//! Codzienne kopie bazy w folderze „Kopie automatyczne”: 14 ostatnich dni i po jednej z 12 ostatnich miesięcy.
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

pub const FOLDER: &str = "Kopie automatyczne";
const PREFIX: &str = "ozipz-auto-";
const KEEP_DAILY: usize = 14;
const KEEP_MONTHLY: usize = 12;
/// Pierwsza kopia po starcie czeka, aż aplikacja otworzy i ewentualnie zmigruje bazę.
const STARTUP_DELAY: Duration = Duration::from_secs(20);
const CHECK_INTERVAL: Duration = Duration::from_secs(60 * 60);

static LAST_ERROR: Mutex<Option<String>> = Mutex::new(None);
static DIRECTORY: Mutex<Option<PathBuf>> = Mutex::new(None);

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoBackup {
    name: String,
    path: String,
    date: String,
    size_bytes: u64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoBackupStatus {
    folder: Option<String>,
    backups: Vec<AutoBackup>,
    last_error: Option<String>,
}

fn backup_date(name: &str) -> Option<&str> {
    name.strip_prefix(PREFIX)?.strip_suffix(".db").filter(|date| date.len() == 10)
}

/// Kopie do usunięcia: poza 14 najnowszymi zostaje najnowsza kopia każdego z 12 ostatnich miesięcy.
pub fn stale_backups(names: &[String]) -> Vec<String> {
    let mut dated: Vec<(&str, &String)> = names.iter().filter_map(|name| backup_date(name).map(|date| (date, name))).collect();
    dated.sort_by(|left, right| right.0.cmp(left.0));
    let mut keep: HashSet<&String> = dated.iter().take(KEEP_DAILY).map(|(_, name)| *name).collect();
    let mut months: Vec<&str> = Vec::new();
    for (date, name) in &dated {
        let month = &date[..7];
        if !months.contains(&month) && months.len() < KEEP_MONTHLY {
            months.push(month);
            keep.insert(name);
        }
    }
    dated.into_iter().filter(|(_, name)| !keep.contains(name)).map(|(_, name)| name.clone()).collect()
}

fn prune(directory: &Path) {
    let Ok(entries) = std::fs::read_dir(directory) else { return };
    let names: Vec<String> = entries.filter_map(|entry| entry.ok()?.file_name().into_string().ok()).collect();
    for name in stale_backups(&names) {
        let _ = std::fs::remove_file(directory.join(name));
    }
}

/// Tworzy dzisiejszą kopię, jeśli jeszcze jej nie ma.
pub fn ensure_today(database: &Path, directory: &Path) -> Result<Option<PathBuf>, String> {
    if !database.exists() { return Ok(None); }
    std::fs::create_dir_all(directory).map_err(|e| format!("Nie można utworzyć folderu kopii „{}”: {}", directory.display(), e))?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let target = directory.join(format!("{PREFIX}{today}.db"));
    super::db_lock::with_acquire_guard(&target, |guard| {
        if target.exists() { return Ok(None); }
        let pending = directory.join(format!("{PREFIX}{today}.pending"));
        if let Err(error) = super::backup_snapshot(database, &pending) {
            let _ = std::fs::remove_file(&pending);
            return Err(error);
        }
        guard.verify()?;
        std::fs::rename(&pending, &target).map_err(|e| e.to_string())?;
        prune(directory);
        Ok(Some(target.clone()))
    })
}

fn ensure_owned_today(database: &Path, directory: &Path) -> Result<Option<PathBuf>, String> {
    super::db_lock::with_acquire_guard(&super::db_lock::lock_path(database), |guard| {
        super::db_lock::ensure_owned(database)?;
        let result = ensure_today(database, directory);
        guard.verify()?;
        result
    })
}

pub fn start(database: PathBuf, directory: PathBuf) {
    *DIRECTORY.lock().unwrap() = Some(directory.clone());
    std::thread::spawn(move || {
        std::thread::sleep(STARTUP_DELAY);
        loop {
            // An unopened or taken-over shared database must not be bundled by this window.
            if super::db_lock::ensure_owned(&database).is_ok() {
                let result = ensure_owned_today(&database, &directory);
                *LAST_ERROR.lock().unwrap() = result.err();
            }
            std::thread::sleep(CHECK_INTERVAL);
        }
    });
}

#[tauri::command]
pub fn get_auto_backups() -> AutoBackupStatus {
    let directory = DIRECTORY.lock().unwrap().clone();
    let mut backups = Vec::new();
    if let Some(entries) = directory.as_ref().and_then(|directory| std::fs::read_dir(directory).ok()) {
        for entry in entries.flatten() {
            let Ok(name) = entry.file_name().into_string() else { continue };
            let Some(date) = backup_date(&name).map(str::to_string) else { continue };
            backups.push(AutoBackup {
                size_bytes: entry.metadata().map(|metadata| metadata.len()).unwrap_or(0),
                path: entry.path().to_string_lossy().to_string(),
                name,
                date,
            });
        }
    }
    backups.sort_by(|left, right| right.date.cmp(&left.date));
    AutoBackupStatus {
        folder: directory.map(|directory| directory.to_string_lossy().to_string()),
        backups,
        last_error: LAST_ERROR.lock().unwrap().clone(),
    }
}

#[tauri::command]
pub fn create_auto_backup_now() -> Result<(), String> {
    let directory = DIRECTORY.lock().unwrap().clone().ok_or("Kopie automatyczne są wyłączone w tej wersji")?;
    let database = super::database_path()?;
    let result = ensure_owned_today(&database, &directory).map(|_| ());
    *LAST_ERROR.lock().unwrap() = result.clone().err();
    result
}

#[tauri::command]
pub fn open_auto_backup_folder() -> Result<(), String> {
    let directory = DIRECTORY.lock().unwrap().clone().ok_or("Kopie automatyczne są wyłączone w tej wersji")?;
    std::fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    super::open_in_file_manager(&directory, false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_unowned_database_cannot_create_an_automatic_backup() {
        let directory = std::env::temp_dir().join(format!("ozipz-unowned-backup-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let database = directory.join("ozipz.db");
        std::fs::write(&database, b"must not be opened").unwrap();
        let backups = directory.join("backups");
        assert!(ensure_owned_today(&database, &backups).is_err());
        assert!(!backups.exists());
        assert_eq!(std::fs::read(&database).unwrap(), b"must not be opened");
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn concurrent_requests_create_one_complete_daily_backup() {
        let directory = std::env::temp_dir().join(format!("ozipz-concurrent-backup-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let database = directory.join("ozipz.db");
        tauri::async_runtime::block_on(async {
            use sqlx::Connection;
            let mut connection = sqlx::SqliteConnection::connect_with(&sqlx::sqlite::SqliteConnectOptions::new().filename(&database).create_if_missing(true)).await.unwrap();
            sqlx::query("CREATE TABLE ozipz_actions (id TEXT, title TEXT, date TEXT)").execute(&mut connection).await.unwrap();
            connection.close().await.unwrap();
        });
        std::fs::create_dir_all(directory.join("Zgłoszenia")).unwrap();
        std::fs::write(directory.join("Zgłoszenia/document.pdf"), b"document bytes").unwrap();
        let backups = directory.join("backups");
        let start = std::sync::Arc::new(std::sync::Barrier::new(4));
        let workers: Vec<_> = (0..4).map(|_| {
            let (database, backups, start) = (database.clone(), backups.clone(), start.clone());
            std::thread::spawn(move || { start.wait(); ensure_today(&database, &backups).unwrap() })
        }).collect();
        let created: Vec<_> = workers.into_iter().filter_map(|worker| worker.join().unwrap()).collect();
        assert_eq!(created.len(), 1);
        super::super::validate_database(&created[0]).unwrap();
        tauri::async_runtime::block_on(async {
            use sqlx::Connection;
            let mut connection = sqlx::SqliteConnection::connect_with(&sqlx::sqlite::SqliteConnectOptions::new().filename(&created[0])).await.unwrap();
            let (contents,): (Vec<u8>,) = sqlx::query_as("SELECT contents FROM ozipz_backup_files WHERE path='Zgłoszenia/document.pdf'").fetch_one(&mut connection).await.unwrap();
            assert_eq!(contents, b"document bytes");
            connection.close().await.unwrap();
        });
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn keeps_two_weeks_and_one_backup_per_month() {
        let mut names: Vec<String> = (1..=30).map(|day| format!("{PREFIX}2026-09-{day:02}.db")).collect();
        names.extend((1..=12).map(|month| format!("{PREFIX}2025-{month:02}-15.db")));
        names.push("inny-plik.db".into());
        let stale = stale_backups(&names);
        // Wrzesień 2026: zostaje 14 najnowszych dni (17–30), reszta miesiąca jest już reprezentowana.
        assert!(stale.contains(&format!("{PREFIX}2026-09-16.db")));
        assert!(!stale.contains(&format!("{PREFIX}2026-09-17.db")));
        // 11 kolejnych miesięcy zostaje (razem 12), najstarszy wypada.
        assert!(!stale.contains(&format!("{PREFIX}2025-02-15.db")));
        assert!(stale.contains(&format!("{PREFIX}2025-01-15.db")));
        assert!(!stale.iter().any(|name| name == "inny-plik.db"));
    }
}
