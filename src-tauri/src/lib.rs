mod auto_backup;
mod db_lock;
mod publication_fetch;
mod storage_kind;
use sqlx::{Connection, SqliteConnection, sqlite::SqliteConnectOptions};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use tauri::Manager;

static RESTORED_DATABASE: AtomicBool = AtomicBool::new(false);
/// Resolved once at startup; changing the location takes effect after a restart.
static DATABASE_PATH: OnceLock<Result<PathBuf, String>> = OnceLock::new();
const DATABASE_FILE: &str = "ozipz.db";
const DATABASE_FOLDER: &str = "Ewidencja OZiPZ";
const LOCATION_FILE: &str = "database-location.txt";

fn validate_database(path: &std::path::Path) -> Result<(), String> {
    tauri::async_runtime::block_on(async {
        let options = SqliteConnectOptions::new().filename(path).read_only(true);
        let mut connection = SqliteConnection::connect_with(&options).await.map_err(|e| e.to_string())?;
        let result = async {
            let integrity: Vec<(String,)> = sqlx::query_as("PRAGMA integrity_check").fetch_all(&mut connection).await.map_err(|e| e.to_string())?;
            if integrity != vec![("ok".to_string(),)] { return Err("Kontrola integralności bazy nie powiodła się".to_string()); }
            sqlx::query("SELECT id, title, date FROM ozipz_actions LIMIT 0").execute(&mut connection).await.map_err(|_| "Wybrany plik nie jest bazą OZiPZ".to_string())?;
            Ok(())
        }.await;
        connection.close().await.map_err(|e| e.to_string())?;
        result
    })
}

fn activate_staged_restore(database_path: &std::path::Path) -> Result<(), String> {
    let staged_path = database_path.with_extension("restore");
    if !staged_path.exists() {
        return Ok(());
    }

    validate_database(&staged_path)?;
    if database_path.exists() {
        tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(database_path)).await.map_err(|e| e.to_string())?;
            let checkpoint: (i64, i64, i64) = sqlx::query_as("PRAGMA wal_checkpoint(TRUNCATE)").fetch_one(&mut connection).await.map_err(|e| e.to_string())?;
            connection.close().await.map_err(|e| e.to_string())?;
            if checkpoint.0 != 0 { return Err("Zamknij inne okna aplikacji przed przywróceniem bazy".to_string()); }
            Ok(())
        })?;
    }

    let previous_path = database_path.with_extension("before-restore");
    if previous_path.exists() {
        std::fs::remove_file(&previous_path).map_err(|error| error.to_string())?;
    }
    if database_path.exists() {
        std::fs::rename(database_path, &previous_path).map_err(|error| error.to_string())?;
    }
    if let Err(error) = std::fs::rename(&staged_path, database_path) {
        if previous_path.exists() && !database_path.exists() {
            let _ = std::fs::rename(&previous_path, database_path);
        }
        return Err(error.to_string());
    }
    for suffix in ["-wal", "-shm"] {
        let sidecar = std::path::PathBuf::from(format!("{}{}", database_path.display(), suffix));
        if sidecar.exists() {
            std::fs::remove_file(sidecar).map_err(|error| error.to_string())?;
        }
    }
    if let Err(error) = validate_database(database_path) {
        std::fs::rename(database_path, &staged_path).map_err(|e| e.to_string())?;
        if previous_path.exists() { std::fs::rename(&previous_path, database_path).map_err(|e| e.to_string())?; }
        return Err(error);
    }
    // Retain the previous database even after successful activation.
    RESTORED_DATABASE.store(true, Ordering::SeqCst);
    Ok(())
}

/// Keeps the newest `<db>.before-migration-<version>-<stamp>.db` of each schema version (same rule as sqlite-migrations.ts).
fn stale_migration_backups(file_names: &[String], database_file_name: &str) -> Vec<String> {
    let prefix = format!("{}.before-migration-", database_file_name);
    let mut newest: std::collections::HashMap<String, (u64, String)> = std::collections::HashMap::new();
    let mut stale = Vec::new();
    for name in file_names {
        let Some(rest) = name.strip_prefix(&prefix).and_then(|rest| rest.strip_suffix(".db")) else { continue };
        let Some((version, stamp)) = rest.split_once('-') else { continue };
        let (Ok(_), Ok(stamp)) = (version.parse::<u32>(), stamp.parse::<u64>()) else { continue };
        match newest.get(version) {
            Some((current, _)) if *current >= stamp => stale.push(name.clone()),
            _ => {
                if let Some((_, previous)) = newest.insert(version.to_string(), (stamp, name.clone())) { stale.push(previous); }
            }
        }
    }
    stale
}

fn prune_migration_backups(database_path: &std::path::Path) {
    let (Some(directory), Some(file_name)) = (database_path.parent(), database_path.file_name().and_then(|name| name.to_str())) else { return };
    let Ok(entries) = std::fs::read_dir(directory) else { return };
    let names: Vec<String> = entries.filter_map(|entry| entry.ok()?.file_name().into_string().ok()).collect();
    for name in stale_migration_backups(&names, file_name) {
        let _ = std::fs::remove_file(directory.join(name));
    }
}

/// Development runs keep using the project's ozipz.db.
fn development_database_path() -> Option<PathBuf> {
    if !cfg!(debug_assertions) { return None; }
    let cwd = std::env::current_dir().ok()?;
    [cwd.join(DATABASE_FILE), cwd.join("..").join(DATABASE_FILE)].into_iter()
        .find(|path| path.exists())
        .map(|path| path.canonicalize().unwrap_or(path))
}

/// Versions before 1.0 kept the database next to the executable.
fn legacy_database_path() -> Option<PathBuf> {
    let path = std::env::current_exe().ok()?.parent()?.join(DATABASE_FILE);
    path.exists().then_some(path)
}

fn location_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_config_dir().map_err(|e| e.to_string())?.join(LOCATION_FILE))
}

fn configured_database_directory(app: &tauri::AppHandle) -> Result<Option<PathBuf>, String> {
    let file = location_file(app)?;
    let Ok(content) = std::fs::read_to_string(&file) else { return Ok(None) };
    let directory = content.trim();
    if directory.is_empty() { return Ok(None); }
    let directory = PathBuf::from(directory);
    if !directory.is_dir() {
        return Err(format!(
            "Folder bazy danych „{}” jest niedostępny. Podłącz dysk z bazą albo usuń plik „{}”, aby wrócić do domyślnej lokalizacji w Dokumentach.",
            directory.display(), file.display()
        ));
    }
    Ok(Some(directory))
}

fn resolve_database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Some(path) = development_database_path() { return Ok(path); }
    let directory = match configured_database_directory(app)? {
        Some(directory) => directory,
        None => app.path().document_dir().map_err(|e| e.to_string())?.join(DATABASE_FOLDER),
    };
    std::fs::create_dir_all(&directory).map_err(|e| format!("Nie można utworzyć folderu bazy „{}”: {}", directory.display(), e))?;
    let path = directory.join(DATABASE_FILE);
    if !path.exists() {
        if let Some(legacy) = legacy_database_path() {
            // The original file stays in place as a fallback copy.
            snapshot_database(&legacy, &path)?;
        }
    }
    Ok(path)
}

fn database_path() -> Result<PathBuf, String> {
    DATABASE_PATH.get().cloned().unwrap_or_else(|| Err("Lokalizacja bazy danych nie została jeszcze ustalona".into()))
}

#[tauri::command]
fn get_database_path() -> Result<String, String> {
    database_path().map(|path| path.to_string_lossy().to_string())
}

/// Copies the current database into `directory` (or adopts an existing ozipz.db there) and remembers it for the next start.
#[tauri::command]
fn set_database_location(app: tauri::AppHandle, directory: String) -> Result<(), String> {
    let current = database_path()?;
    let directory = PathBuf::from(directory);
    if !directory.is_dir() { return Err("Wybrany folder nie istnieje".into()); }
    let target = directory.join(DATABASE_FILE);
    if std::fs::canonicalize(&target).ok() == std::fs::canonicalize(&current).ok() {
        return Err("Baza już znajduje się w tym folderze".into());
    }
    if target.exists() {
        validate_database(&target)?;
    } else {
        let temporary_path = target.with_extension("move-pending");
        snapshot_database(&current, &temporary_path)?;
        validate_database(&temporary_path)?;
        std::fs::rename(&temporary_path, &target).map_err(|e| e.to_string())?;
    }
    let file = location_file(&app)?;
    if let Some(parent) = file.parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
    std::fs::write(file, directory.to_string_lossy().as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal_database_file() -> Result<(), String> {
    open_in_file_manager(&database_path()?, true)
}

/// Otwiera folder w menedżerze plików; `select` zaznacza wskazany plik zamiast otwierać folder.
fn open_in_file_manager(path: &std::path::Path, select: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let result = if select {
        std::process::Command::new("explorer").arg("/select,").arg(path).spawn()
    } else {
        std::process::Command::new("explorer").arg(path).spawn()
    };
    #[cfg(target_os = "macos")]
    let result = if select {
        std::process::Command::new("open").arg("-R").arg(path).spawn()
    } else {
        std::process::Command::new("open").arg(path).spawn()
    };
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let result = std::process::Command::new("xdg-open")
        .arg(if select { path.parent().unwrap_or(std::path::Path::new(".")) } else { path })
        .spawn();
    result.map(|_| ()).map_err(|e| format!("Nie udało się otworzyć folderu: {}", e))
}

#[tauri::command]
fn queue_database_restore(source_path: String) -> Result<(), String> {
    let source = std::path::PathBuf::from(source_path);
    validate_database(&source)?;

    let database_path = database_path()?;
    stage_database_restore(&source, &database_path)
}

fn snapshot_database(source: &std::path::Path, destination: &std::path::Path) -> Result<(), String> {
    if std::fs::canonicalize(source).ok() == std::fs::canonicalize(destination).ok() {
        return Err("Nie można nadpisać źródłowej bazy danych".into());
    }
    if destination.exists() { std::fs::remove_file(destination).map_err(|e| e.to_string())?; }
    tauri::async_runtime::block_on(async {
        let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(source)).await.map_err(|e| e.to_string())?;
        let result = sqlx::query("VACUUM INTO ?").bind(destination.to_string_lossy().as_ref()).execute(&mut connection).await.map_err(|e| e.to_string());
        connection.close().await.map_err(|e| e.to_string())?;
        result.map(|_| ())
    })
}

fn stage_database_restore(source: &std::path::Path, database_path: &std::path::Path) -> Result<(), String> {
    let staged_path = database_path.with_extension("restore");
    let temporary_path = database_path.with_extension("restore-pending");
    snapshot_database(source, &temporary_path)?;
    validate_database(&temporary_path)?;
    if staged_path.exists() { std::fs::remove_file(&staged_path).map_err(|e| e.to_string())?; }
    std::fs::rename(temporary_path, staged_path).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn backup_database(destination_path: String) -> Result<(), String> {
    let database_path = database_path()?;
    if std::fs::canonicalize(&destination_path).ok() == std::fs::canonicalize(&database_path).ok() {
        return Err("Wybierz inną lokalizację niż aktywna baza danych".into());
    }
    let temporary_path = database_path.with_extension("backup-pending");
    snapshot_database(&database_path, &temporary_path)?;
    validate_database(&temporary_path)?;
    std::fs::copy(&temporary_path, destination_path).map_err(|error| error.to_string())?;
    std::fs::remove_file(temporary_path).map_err(|error| error.to_string())
}

#[tauri::command]
fn has_restored_database() -> bool { RESTORED_DATABASE.load(Ordering::SeqCst) }

#[tauri::command]
fn acknowledge_database_restore() { RESTORED_DATABASE.store(false, Ordering::SeqCst); }

// Raw BEGIN/COMMIT calls must use the same physical connection.
#[tauri::command]
async fn open_local_database(instances: tauri::State<'_, tauri_plugin_sql::DbInstances>) -> Result<(), String> {
    let path = get_database_path()?;
    let key = format!("sqlite:{}", path);
    let mut pools = instances.0.write().await;
    if pools.contains_key(&key) { return Ok(()); }
    let pool = create_local_pool(std::path::Path::new(&path)).await?;
    pools.insert(key, tauri_plugin_sql::DbPool::Sqlite(pool));
    Ok(())
}

async fn create_local_pool(path: &std::path::Path) -> Result<sqlx::SqlitePool, String> {
    let options = SqliteConnectOptions::new().filename(path).create_if_missing(true)
        .foreign_keys(true).busy_timeout(std::time::Duration::from_secs(5));
    sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).min_connections(1)
        .max_lifetime(None).idle_timeout(None).connect_with(options).await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // An unavailable database folder is reported in the window instead of aborting startup.
            let resolved = resolve_database_path(app.handle());
            if let Ok(path) = &resolved {
                activate_staged_restore(path).map_err(std::io::Error::other)?;
                prune_migration_backups(path);
                // Kopie trafiają na dysk lokalny (Dokumenty), także gdy baza leży na dysku sieciowym.
                if development_database_path().is_none() {
                    if let Ok(documents) = app.path().document_dir() {
                        auto_backup::start(path.clone(), documents.join(DATABASE_FOLDER).join(auto_backup::FOLDER));
                    }
                }
            }
            let _ = DATABASE_PATH.set(resolved);
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![publication_fetch::fetch_publication_source, open_local_database, get_database_path, set_database_location, reveal_database_file, backup_database, queue_database_restore, has_restored_database, acknowledge_database_restore,
            auto_backup::get_auto_backups, auto_backup::create_auto_backup_now, auto_backup::open_auto_backup_folder,
            db_lock::acquire_database_lock, db_lock::database_lock_status, db_lock::get_session_actor,
            storage_kind::get_database_storage_kind])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_, event| {
            if let tauri::RunEvent::Exit = event { db_lock::release(); }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_transactions_and_migration_batches_keep_one_connection() {
        tauri::async_runtime::block_on(async {
            let pool = create_local_pool(std::path::Path::new(":memory:")).await.unwrap();
            sqlx::query("CREATE TABLE probe(value INTEGER CHECK(value >= 0));").execute(&pool).await.unwrap();
            sqlx::query("BEGIN IMMEDIATE;").execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO probe VALUES ($1)").bind(3.0_f64).execute(&pool).await.unwrap();
            assert!(sqlx::query("INSERT INTO probe VALUES (-1)").execute(&pool).await.is_err());
            sqlx::query("ROLLBACK;").execute(&pool).await.unwrap();
            let count: (i64,) = sqlx::query_as("SELECT count(*) FROM probe").fetch_one(&pool).await.unwrap();
            assert_eq!(count.0, 0);
            sqlx::query("PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE; CREATE TABLE probe_new(value INTEGER); INSERT INTO probe_new VALUES(7); DROP TABLE probe; ALTER TABLE probe_new RENAME TO probe; PRAGMA user_version=1; COMMIT; PRAGMA foreign_keys=ON;").execute(&pool).await.unwrap();
            let value: (i64,) = sqlx::query_as("SELECT value FROM probe").fetch_one(&pool).await.unwrap();
            let foreign_keys: (i64,) = sqlx::query_as("PRAGMA foreign_keys").fetch_one(&pool).await.unwrap();
            assert_eq!(value.0, 7);
            assert_eq!(foreign_keys.0, 1);
            pool.close().await;
        });
    }

    #[test]
    fn keeps_newest_migration_backup_per_version() {
        let names: Vec<String> = ["ozipz.db", "ozipz.db.before-migration-1-100.db", "ozipz.db.before-migration-1-300.db",
            "ozipz.db.before-migration-1-200.db", "ozipz.db.before-migration-5-400.db", "inna.db.before-migration-1-1.db"]
            .iter().map(|name| name.to_string()).collect();
        let mut stale = stale_migration_backups(&names, "ozipz.db");
        stale.sort();
        assert_eq!(stale, vec!["ozipz.db.before-migration-1-100.db", "ozipz.db.before-migration-1-200.db"]);
    }

    #[test]
    fn restore_rejects_corruption_and_retains_previous_database() {
        let directory = std::env::temp_dir().join(format!("ozipz-restore-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let database = directory.join("ozipz.db");
        tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(&database).create_if_missing(true)).await.unwrap();
            sqlx::query("CREATE TABLE IF NOT EXISTS ozipz_actions (id TEXT, title TEXT, date TEXT)").execute(&mut connection).await.unwrap();
            connection.close().await.unwrap();
        });
        assert!(validate_database(&database).is_ok());
        let original = std::fs::read(&database).unwrap();
        let staged = database.with_extension("restore");
        std::fs::write(&staged, b"SQLite format 3\0truncated").unwrap();
        assert!(activate_staged_restore(&database).is_err());
        assert_eq!(std::fs::read(&database).unwrap(), original);
        std::fs::copy(&database, &staged).unwrap();
        activate_staged_restore(&database).unwrap();
        assert!(validate_database(&database).is_ok());
        assert!(database.with_extension("before-restore").exists());
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn restore_stages_committed_wal_rows() {
        let directory = std::env::temp_dir().join(format!("ozipz-wal-restore-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let source = directory.join("source.db");
        let database_path = directory.join("ozipz.db");
        let connection = tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(&source).create_if_missing(true)).await.unwrap();
            sqlx::query("CREATE TABLE ozipz_actions (id TEXT, title TEXT, date TEXT)").execute(&mut connection).await.unwrap();
            sqlx::query("PRAGMA journal_mode=WAL").execute(&mut connection).await.unwrap();
            sqlx::query("PRAGMA wal_autocheckpoint=0").execute(&mut connection).await.unwrap();
            sqlx::query("INSERT INTO ozipz_actions VALUES ('1', 'committed in WAL', '2026-09-26')").execute(&mut connection).await.unwrap();
            connection
        });

        stage_database_restore(&source, &database_path).unwrap();
        tauri::async_runtime::block_on(async {
            let mut staged = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(database_path.with_extension("restore"))).await.unwrap();
            let count: (i64,) = sqlx::query_as("SELECT count(*) FROM ozipz_actions").fetch_one(&mut staged).await.unwrap();
            assert_eq!(count.0, 1);
            staged.close().await.unwrap();
            connection.close().await.unwrap();
        });
        std::fs::remove_dir_all(directory).unwrap();
    }
}
