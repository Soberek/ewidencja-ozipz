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
    if target.exists() { return Ok(None); }
    let pending = directory.join(format!("{PREFIX}{today}.pending"));
    super::snapshot_database(database, &pending)?;
    if let Err(error) = super::validate_database(&pending) {
        let _ = std::fs::remove_file(&pending);
        return Err(error);
    }
    std::fs::rename(&pending, &target).map_err(|e| e.to_string())?;
    prune(directory);
    Ok(Some(target))
}

pub fn start(database: PathBuf, directory: PathBuf) {
    *DIRECTORY.lock().unwrap() = Some(directory.clone());
    std::thread::spawn(move || {
        std::thread::sleep(STARTUP_DELAY);
        loop {
            let result = ensure_today(&database, &directory);
            *LAST_ERROR.lock().unwrap() = result.err();
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
    let result = ensure_today(&database, &directory).map(|_| ());
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
