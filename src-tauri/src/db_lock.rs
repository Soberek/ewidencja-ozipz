//! Plik `ozipz.db.lock` obok bazy: chroni przed równoczesną pracą na tej samej bazie z dwóch komputerów
//! (np. na dysku sieciowym, gdzie blokady SQLite nie działają niezawodnie).
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

/// Blokada bez odświeżenia przez ten czas uznawana jest za porzuconą (np. po awarii komputera).
const STALE_AFTER_SECS: i64 = 90;
const HEARTBEAT: Duration = Duration::from_secs(30);
/// Plik sekcji krytycznej starszy niż to jest pozostałością po awarii w trakcie zakładania blokady.
const ACQUIRE_GUARD_STALE: Duration = Duration::from_secs(15);
const ACQUIRE_GUARD_WAIT: Duration = Duration::from_secs(10);

static LOCK_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);
static OWNED: AtomicBool = AtomicBool::new(false);
static HEARTBEAT_STARTED: AtomicBool = AtomicBool::new(false);
static TAKEN_OVER_BY: Mutex<Option<LockHolder>> = Mutex::new(None);

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LockHolder {
    pub user: String,
    pub host: String,
    pub pid: u32,
    pub since: i64,
    pub heartbeat: i64,
}

pub fn lock_path(database: &Path) -> PathBuf {
    PathBuf::from(format!("{}.lock", database.display()))
}

fn now() -> i64 { chrono::Utc::now().timestamp() }

fn env_first(names: &[&str], fallback: &str) -> String {
    names.iter().find_map(|name| std::env::var(name).ok().filter(|value| !value.trim().is_empty())).unwrap_or_else(|| fallback.to_string())
}

pub fn current_user() -> String { env_first(&["USERNAME", "USER"], "nieznany użytkownik") }
pub fn current_host() -> String { env_first(&["COMPUTERNAME", "HOSTNAME"], "nieznany komputer") }

fn own_holder(since: i64) -> LockHolder {
    LockHolder { user: current_user(), host: current_host(), pid: std::process::id(), since, heartbeat: now() }
}

fn is_ours(holder: &LockHolder) -> bool {
    holder.host == current_host() && holder.pid == std::process::id()
}

/// Inne okno na tym samym komputerze nie jest zagrożeniem (SQLite blokuje lokalnie), a po restarcie
/// aplikacji (aktualizacja, zmiana lokalizacji bazy) poprzedni proces mógł nie zdążyć zwolnić blokady.
fn is_this_computer(holder: &LockHolder) -> bool {
    holder.host.eq_ignore_ascii_case(&current_host())
}

fn read_holder(path: &Path) -> Option<LockHolder> {
    serde_json::from_str(&std::fs::read_to_string(path).ok()?).ok()
}

fn write_holder(path: &Path, holder: &LockHolder) -> Result<(), String> {
    // Własny plik tymczasowy każdego procesu – dwa komputery nie nadpisują sobie nawzajem zapisu w toku.
    let host: String = holder.host.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
    let temporary = path.with_extension(format!("lock-pending-{}-{}", host, holder.pid));
    std::fs::write(&temporary, serde_json::to_vec(holder).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    std::fs::rename(&temporary, path).map_err(|e| format!("Nie można zapisać blokady bazy: {}", e))
}

/// Sekcja krytyczna zakładania blokady. Plik `*.lock-acquire` tworzony jest atomowo (CREATE_NEW działa
/// niepodzielnie także na udziałach sieciowych), więc dwa komputery uruchomione w tej samej chwili
/// nie uznają jednocześnie bazy za wolną.
fn with_acquire_guard<T>(path: &Path, task: impl FnOnce() -> Result<T, String>) -> Result<T, String> {
    let guard = path.with_extension("lock-acquire");
    let deadline = std::time::Instant::now() + ACQUIRE_GUARD_WAIT;
    loop {
        match std::fs::OpenOptions::new().write(true).create_new(true).open(&guard) {
            Ok(_) => break,
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                let abandoned = std::fs::metadata(&guard)
                    .and_then(|meta| meta.modified())
                    .ok()
                    .and_then(|modified| modified.elapsed().ok())
                    .is_some_and(|age| age > ACQUIRE_GUARD_STALE);
                if abandoned {
                    let _ = std::fs::remove_file(&guard);
                    continue;
                }
                if std::time::Instant::now() > deadline {
                    return Err("Inny komputer właśnie otwiera tę bazę. Spróbuj ponownie za chwilę.".to_string());
                }
                std::thread::sleep(Duration::from_millis(200));
            }
            Err(error) => return Err(format!("Nie można zająć bazy: {}", error)),
        }
    }
    let result = task();
    let _ = std::fs::remove_file(&guard);
    result
}

/// Aktywna blokada innego komputera, jeśli jest świeża.
pub fn foreign_holder(path: &Path, at: i64) -> Option<LockHolder> {
    read_holder(path).filter(|holder| !is_this_computer(holder) && at - holder.heartbeat < STALE_AFTER_SECS)
}

fn start_heartbeat() {
    if HEARTBEAT_STARTED.swap(true, Ordering::SeqCst) { return; }
    std::thread::spawn(|| loop {
        std::thread::sleep(HEARTBEAT);
        if !OWNED.load(Ordering::SeqCst) { continue; }
        let Some(path) = LOCK_PATH.lock().unwrap().clone() else { continue };
        match read_holder(&path) {
            Some(holder) if is_ours(&holder) => { let _ = write_holder(&path, &LockHolder { heartbeat: now(), ..holder }); }
            // Drugie okno na tym komputerze przejęło plik — dalej odświeżamy blokadę tego komputera.
            Some(holder) if is_this_computer(&holder) => { let _ = write_holder(&path, &own_holder(holder.since)); }
            Some(holder) => {
                // Ktoś przejął bazę — przestajemy odświeżać i informujemy okno aplikacji.
                OWNED.store(false, Ordering::SeqCst);
                *TAKEN_OVER_BY.lock().unwrap() = Some(holder);
            }
            None => { let _ = write_holder(&path, &own_holder(now())); }
        }
    });
}

/// Zajmuje bazę. Zwraca dane innej osoby, jeśli baza jest w użyciu, a `force` nie jest ustawione.
#[tauri::command]
pub fn acquire_database_lock(force: bool) -> Result<Option<LockHolder>, String> {
    let path = lock_path(&super::database_path()?);
    let conflict = with_acquire_guard(&path, || {
        if !force {
            if let Some(holder) = foreign_holder(&path, now()) { return Ok(Some(holder)); }
        }
        write_holder(&path, &own_holder(now()))?;
        Ok(None)
    })?;
    if conflict.is_some() { return Ok(conflict); }
    *LOCK_PATH.lock().unwrap() = Some(path);
    *TAKEN_OVER_BY.lock().unwrap() = None;
    OWNED.store(true, Ordering::SeqCst);
    start_heartbeat();
    Ok(None)
}

/// Kto przejął bazę w trakcie pracy (okno powinno wtedy przestać zapisywać).
#[tauri::command]
pub fn database_lock_status() -> Option<LockHolder> {
    TAKEN_OVER_BY.lock().unwrap().clone()
}

#[tauri::command]
pub fn get_session_actor() -> String {
    format!("{} ({})", current_user(), current_host())
}

pub fn release() {
    if !OWNED.swap(false, Ordering::SeqCst) { return; }
    let Some(path) = LOCK_PATH.lock().unwrap().clone() else { return };
    if read_holder(&path).is_some_and(|holder| is_ours(&holder)) {
        let _ = std::fs::remove_file(path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_fresh_foreign_lock_and_ignores_stale_or_own_lock() {
        let directory = std::env::temp_dir().join(format!("ozipz-lock-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let path = lock_path(&directory.join("ozipz.db"));
        let foreign = LockHolder { user: "anna".into(), host: "PSSE-02".into(), pid: 1, since: 1_000, heartbeat: 1_000 };
        write_holder(&path, &foreign).unwrap();
        assert_eq!(foreign_holder(&path, 1_030), Some(foreign.clone()));
        assert_eq!(foreign_holder(&path, 1_000 + STALE_AFTER_SECS), None);
        write_holder(&path, &own_holder(1_000)).unwrap();
        assert_eq!(foreign_holder(&path, now()), None);
        // Poprzedni proces tego komputera (np. sprzed restartu po aktualizacji) nie blokuje startu.
        write_holder(&path, &LockHolder { pid: std::process::id() + 1, heartbeat: now(), ..own_holder(1_000) }).unwrap();
        assert_eq!(foreign_holder(&path, now()), None);
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn acquire_guard_is_exclusive_and_recovers_after_a_crash() {
        let directory = std::env::temp_dir().join(format!("ozipz-guard-test-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        let path = lock_path(&directory.join("ozipz.db"));

        // Równoczesne próby nie wchodzą do sekcji krytycznej naraz.
        let inside = std::sync::Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let overlaps = std::sync::Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let workers: Vec<_> = (0..8).map(|_| {
            let (path, inside, overlaps) = (path.clone(), inside.clone(), overlaps.clone());
            std::thread::spawn(move || {
                with_acquire_guard(&path, || {
                    if inside.fetch_add(1, Ordering::SeqCst) > 0 { overlaps.fetch_add(1, Ordering::SeqCst); }
                    std::thread::sleep(Duration::from_millis(20));
                    inside.fetch_sub(1, Ordering::SeqCst);
                    Ok(())
                }).unwrap();
            })
        }).collect();
        for worker in workers { worker.join().unwrap(); }
        assert_eq!(overlaps.load(Ordering::SeqCst), 0);
        assert!(!path.with_extension("lock-acquire").exists());

        // Plik sekcji pozostawiony po awarii nie blokuje bazy na zawsze.
        let guard = path.with_extension("lock-acquire");
        std::fs::write(&guard, b"").unwrap();
        let old = std::time::SystemTime::now() - ACQUIRE_GUARD_STALE - Duration::from_secs(1);
        std::fs::File::options().write(true).open(&guard).unwrap().set_modified(old).unwrap();
        assert_eq!(with_acquire_guard(&path, || Ok(7)), Ok(7));
        std::fs::remove_dir_all(directory).unwrap();
    }
}
