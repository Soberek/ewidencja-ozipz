mod auto_backup;
mod attachment_backups;
mod db_lock;
mod participation_files;
mod publication_fetch;
mod storage_kind;
use sqlx::{Connection, SqliteConnection, sqlite::SqliteConnectOptions};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::atomic::AtomicU64;
use std::sync::OnceLock;
use tauri::Manager;

static RESTORED_DATABASE: AtomicBool = AtomicBool::new(false);
/// Resolved once at startup; changing the location takes effect after a restart.
static DATABASE_PATH: OnceLock<Result<PathBuf, String>> = OnceLock::new();
const DATABASE_FILE: &str = "ozipz.db";
const DATABASE_FOLDER: &str = "Ewidencja OZiPZ";
const LOCATION_FILE: &str = "database-location.txt";
static TEMPORARY_FILE_ID: AtomicU64 = AtomicU64::new(0);

fn temporary_path(target: &std::path::Path, purpose: &str) -> PathBuf {
    target.with_extension(format!("{}-{}-{}", purpose, std::process::id(), TEMPORARY_FILE_ID.fetch_add(1, Ordering::SeqCst)))
}

/// Windows cannot replace every existing destination with rename; retain it until the new file is installed.
fn replace_file(source: &std::path::Path, target: &std::path::Path) -> Result<(), String> {
    let previous = temporary_path(target, "replace-previous");
    if target.exists() { std::fs::rename(target, &previous).map_err(|e| e.to_string())?; }
    if let Err(error) = std::fs::rename(source, target) {
        if previous.exists() { std::fs::rename(&previous, target).map_err(|e| e.to_string())?; }
        return Err(error.to_string());
    }
    if previous.exists() { let _ = std::fs::remove_file(previous); }
    Ok(())
}

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

fn activate_staged_restore(database_path: &std::path::Path, guard: Option<&db_lock::AcquisitionGuard>) -> Result<(), String> {
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

    if let Some(guard) = guard { guard.verify()?; }
    attachment_backups::stage_files(&staged_path, database_path)?;
    if let Some(guard) = guard { guard.verify()?; }
    if db_lock::foreign_holder(&db_lock::lock_path(database_path), chrono::Utc::now().timestamp()).is_some() {
        return Err("Inny komputer przejął bazę w trakcie przywracania. Połącz się ponownie.".into());
    }
    // Remove checkpointed sidecars before replacing the database, so a failure keeps the live file.
    for suffix in ["-wal", "-shm"] {
        let sidecar = std::path::PathBuf::from(format!("{}{}", database_path.display(), suffix));
        if sidecar.exists() { std::fs::remove_file(sidecar).map_err(|e| e.to_string())?; }
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
    if let Err(error) = validate_database(database_path) {
        std::fs::rename(database_path, &staged_path).map_err(|e| e.to_string())?;
        if previous_path.exists() { std::fs::rename(&previous_path, database_path).map_err(|e| e.to_string())?; }
        return Err(error);
    }
    if let Err(error) = attachment_backups::activate_files(database_path) {
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
            attachment_backups::copy_files(&legacy, &path)?;
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
    db_lock::ensure_owned(&current)?;
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
        attachment_backups::copy_files(&current, &target)?;
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
    db_lock::with_acquire_guard(&db_lock::lock_path(&database_path), |guard| {
        db_lock::ensure_owned(&database_path)?;
        stage_database_restore(&source, &database_path, Some(guard))
    })
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

fn stage_database_restore(source: &std::path::Path, database_path: &std::path::Path, guard: Option<&db_lock::AcquisitionGuard>) -> Result<(), String> {
    let staged_path = database_path.with_extension("restore");
    let temporary_path = database_path.with_extension("restore-pending");
    snapshot_database(source, &temporary_path)?;
    validate_database(&temporary_path)?;
    if let Some(guard) = guard { guard.verify()?; }
    replace_file(&temporary_path, &staged_path)?;
    let staged_files = database_path.with_extension("restore-files");
    if staged_files.exists() { std::fs::remove_dir_all(staged_files).map_err(|e| e.to_string())?; }
    Ok(())
}

fn backup_snapshot(source: &std::path::Path, destination: &std::path::Path) -> Result<(), String> {
    snapshot_database(source, destination)?;
    attachment_backups::embed_files(source, destination)?;
    validate_database(destination)
}

#[tauri::command]
fn backup_database(destination_path: String) -> Result<(), String> {
    let database_path = database_path()?;
    if std::fs::canonicalize(&destination_path).ok() == std::fs::canonicalize(&database_path).ok() {
        return Err("Wybierz inną lokalizację niż aktywna baza danych".into());
    }
    let destination = PathBuf::from(destination_path);
    let temporary = temporary_path(&destination, "backup-pending");
    let result = backup_snapshot(&database_path, &temporary).and_then(|_| replace_file(&temporary, &destination));
    if temporary.exists() { let _ = std::fs::remove_file(temporary); }
    result
}

#[tauri::command]
fn has_restored_database() -> bool { RESTORED_DATABASE.load(Ordering::SeqCst) }

#[tauri::command]
fn acknowledge_database_restore() { RESTORED_DATABASE.store(false, Ordering::SeqCst); }

// Raw BEGIN/COMMIT calls must use the same physical connection.
#[tauri::command]
async fn open_local_database(instances: tauri::State<'_, tauri_plugin_sql::DbInstances>) -> Result<(), String> {
    let path = get_database_path()?;
    db_lock::ensure_owned(std::path::Path::new(&path))?;
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
            storage_kind::get_database_storage_kind,
            participation_files::import_participation_file, participation_files::read_participation_file, participation_files::open_participation_file,
            participation_files::reveal_participation_file, participation_files::open_participation_files_folder, participation_files::discard_participation_file])
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
    fn replacing_an_existing_file_preserves_it_on_failure() {
        let directory = std::env::temp_dir().join(format!("ozipz-replace-file-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let target = directory.join("backup.db");
        let pending = directory.join("pending.db");
        std::fs::write(&target, b"previous backup").unwrap();
        assert!(replace_file(&pending, &target).is_err());
        assert_eq!(std::fs::read(&target).unwrap(), b"previous backup");
        std::fs::write(&pending, b"new backup").unwrap();
        replace_file(&pending, &target).unwrap();
        assert_eq!(std::fs::read(&target).unwrap(), b"new backup");
        assert_eq!(std::fs::read_dir(&directory).unwrap().count(), 1);
        std::fs::remove_dir_all(directory).unwrap();
    }

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
        assert!(activate_staged_restore(&database, None).is_err());
        assert_eq!(std::fs::read(&database).unwrap(), original);
        std::fs::copy(&database, &staged).unwrap();
        activate_staged_restore(&database, None).unwrap();
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

        stage_database_restore(&source, &database_path, None).unwrap();
        tauri::async_runtime::block_on(async {
            let mut staged = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(database_path.with_extension("restore"))).await.unwrap();
            let count: (i64,) = sqlx::query_as("SELECT count(*) FROM ozipz_actions").fetch_one(&mut staged).await.unwrap();
            assert_eq!(count.0, 1);
            staged.close().await.unwrap();
            connection.close().await.unwrap();
        });
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn backups_and_relocation_keep_document_contents() {
        let directory = std::env::temp_dir().join(format!("ozipz-portable-backup-test-{}", std::process::id()));
        let source_dir = directory.join("source");
        let target_dir = directory.join("target");
        let moved_dir = directory.join("moved");
        for folder in [&source_dir, &target_dir, &moved_dir] { std::fs::create_dir_all(folder).unwrap(); }
        let source = source_dir.join("ozipz.db");
        let target = target_dir.join("ozipz.db");
        tauri::async_runtime::block_on(async {
            for path in [&source, &target] {
                let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(path).create_if_missing(true)).await.unwrap();
                sqlx::query("CREATE TABLE ozipz_actions (id TEXT, title TEXT, date TEXT)").execute(&mut connection).await.unwrap();
                sqlx::query("INSERT INTO ozipz_actions VALUES ('1', ?, '2026-10-01')").bind(if path == &source { "from backup" } else { "previous" }).execute(&mut connection).await.unwrap();
                sqlx::query("CREATE TABLE ozipz_scan_files (path TEXT PRIMARY KEY, data_url TEXT NOT NULL)").execute(&mut connection).await.unwrap();
                sqlx::query("INSERT INTO ozipz_scan_files VALUES ('scan:file-1', 'data:application/pdf;base64,JVBERg==')").execute(&mut connection).await.unwrap();
                connection.close().await.unwrap();
            }
        });
        let relative = "Zgłoszenia/2026-2027/zgłoszenie.pdf";
        let document: Vec<u8> = (0..2 * 1024 * 1024 + 13).map(|index| (index % 251) as u8).collect();
        std::fs::create_dir_all(source_dir.join("Zgłoszenia/2026-2027")).unwrap();
        std::fs::write(source_dir.join(relative), &document).unwrap();
        let moved = moved_dir.join("ozipz.db");
        snapshot_database(&source, &moved).unwrap();
        attachment_backups::copy_files(&source, &moved).unwrap();
        assert_eq!(std::fs::read(moved_dir.join(relative)).unwrap(), document);
        std::fs::create_dir_all(target_dir.join("Zgłoszenia")).unwrap();
        std::fs::write(target_dir.join("Zgłoszenia/previous.pdf"), b"previous document").unwrap();
        let backup = directory.join("portable.db");
        backup_snapshot(&source, &backup).unwrap();
        // Only the backup survives: recovery must not depend on the source folder.
        std::fs::remove_dir_all(&source_dir).unwrap();
        stage_database_restore(&backup, &target, None).unwrap();
        activate_staged_restore(&target, None).unwrap();
        assert_eq!(std::fs::read(target_dir.join(relative)).unwrap(), document);
        assert_eq!(std::fs::read(target.with_extension("before-restore-files").join("previous.pdf")).unwrap(), b"previous document");
        tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(&target)).await.unwrap();
            let (title,): (String,) = sqlx::query_as("SELECT title FROM ozipz_actions").fetch_one(&mut connection).await.unwrap();
            let (contents,): (String,) = sqlx::query_as("SELECT data_url FROM ozipz_scan_files").fetch_one(&mut connection).await.unwrap();
            let (embedded,): (i64,) = sqlx::query_as("SELECT count(*) FROM sqlite_master WHERE name='ozipz_backup_files'").fetch_one(&mut connection).await.unwrap();
            assert_eq!(title, "from backup");
            assert_eq!(contents, "data:application/pdf;base64,JVBERg==");
            assert_eq!(embedded, 0);
            connection.close().await.unwrap();
        });
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn restore_rejects_attachment_paths_outside_archive_without_replacing_database() {
        let directory = std::env::temp_dir().join(format!("ozipz-unsafe-backup-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let database = directory.join("ozipz.db");
        tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(&database).create_if_missing(true)).await.unwrap();
            sqlx::query("CREATE TABLE ozipz_actions (id TEXT, title TEXT, date TEXT)").execute(&mut connection).await.unwrap();
            connection.close().await.unwrap();
        });
        let original = std::fs::read(&database).unwrap();
        let staged = database.with_extension("restore");
        std::fs::copy(&database, &staged).unwrap();
        tauri::async_runtime::block_on(async {
            let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(&staged)).await.unwrap();
            sqlx::query("CREATE TABLE ozipz_backup_files (path TEXT PRIMARY KEY, contents BLOB NOT NULL)").execute(&mut connection).await.unwrap();
            sqlx::query("INSERT INTO ozipz_backup_files VALUES ('Zgłoszenia/../../outside.txt', ?)").bind(b"unsafe".to_vec()).execute(&mut connection).await.unwrap();
            connection.close().await.unwrap();
        });
        assert!(activate_staged_restore(&database, None).is_err());
        assert_eq!(std::fs::read(&database).unwrap(), original);
        assert!(!directory.parent().unwrap().join("outside.txt").exists());
        std::fs::remove_dir_all(directory).unwrap();
    }
}
