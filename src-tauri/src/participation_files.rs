//! Pliki zgłoszeń do programów: kopie leżą obok bazy w „Zgłoszenia/<rok szkolny>/”,
//! a baza przechowuje ścieżkę względną (z „/”), więc przeniesienie folderu bazy jej nie psuje.
use std::path::{Component, Path, PathBuf};

pub const FOLDER: &str = "Zgłoszenia";
/// Podgląd w oknie aplikacji; większe pliki otwiera się w domyślnym programie.
const PREVIEW_LIMIT_BYTES: u64 = 60 * 1024 * 1024;
const MAX_NAME_CHARS: usize = 120;

fn files_root() -> Result<PathBuf, String> {
    let database = super::database_path()?;
    let directory = database.parent().ok_or("Nieznany folder bazy danych")?;
    Ok(directory.join(FOLDER))
}

/// Nazwa bezpieczna na Windows i macOS: bez znaków zastrzeżonych, kropek/spacji na końcu i nadmiernej długości.
fn sanitize_component(value: &str) -> String {
    let replaced: String = value.chars()
        .map(|c| if c.is_control() || "<>:\"/\\|?*".contains(c) { ' ' } else { c })
        .collect();
    let collapsed = replaced.split_whitespace().collect::<Vec<_>>().join(" ");
    let truncated: String = collapsed.chars().take(MAX_NAME_CHARS).collect();
    truncated.trim_matches(|c: char| c == '.' || c == ' ').to_string()
}

/// „2026/2027” → „2026-2027”.
fn year_folder(school_year: &str) -> String {
    let folder = sanitize_component(&school_year.replace(['/', '\\'], "-"));
    if folder.is_empty() { "bez roku szkolnego".into() } else { folder }
}

fn extension_of(path: &Path) -> Option<String> {
    let extension = sanitize_component(&path.extension()?.to_string_lossy().to_lowercase());
    (!extension.is_empty()).then_some(extension)
}

fn unique_target(directory: &Path, stem: &str, extension: Option<&str>) -> PathBuf {
    let file_name = |suffix: String| match extension {
        Some(extension) => format!("{}{}.{}", stem, suffix, extension),
        None => format!("{}{}", stem, suffix),
    };
    let mut candidate = directory.join(file_name(String::new()));
    let mut counter = 2;
    while candidate.exists() {
        candidate = directory.join(file_name(format!(" ({})", counter)));
        counter += 1;
    }
    candidate
}

/// Ścieżka względna z bazy → ścieżka na dysku; odrzuca wszystko, co wychodzi poza folder zgłoszeń.
pub(crate) fn resolve_relative(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let relative = Path::new(relative);
    let mut components = relative.components();
    let inside_folder = components.next() == Some(Component::Normal(FOLDER.as_ref()))
        && components.clone().next().is_some()
        && components.all(|component| matches!(component, Component::Normal(_)));
    if !inside_folder { return Err("Nieprawidłowa ścieżka pliku zgłoszenia".into()); }
    let parent = root.parent().ok_or("Nieznany folder bazy danych")?;
    let mut path = parent.to_path_buf();
    for component in relative.components() {
        path.push(component);
        match std::fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() => return Err("Plik zgłoszenia prowadzi przez dowiązanie poza archiwum".into()),
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(error.to_string()),
        }
    }
    Ok(path)
}

fn existing_file(relative_path: &str) -> Result<PathBuf, String> {
    let path = resolve_relative(&files_root()?, relative_path)?;
    if !path.is_file() {
        return Err(format!("Nie znaleziono pliku zgłoszenia „{}”. Mógł zostać przeniesiony lub usunięty z folderu bazy.", relative_path));
    }
    Ok(path)
}

fn import_into(root: &Path, source: &Path, school_year: &str, base_name: &str) -> Result<String, String> {
    if !source.is_file() { return Err("Wybrany plik nie istnieje".into()); }
    let year = year_folder(school_year);
    let directory = resolve_relative(root, &format!("{}/{}", FOLDER, year))?;
    std::fs::create_dir_all(&directory)
        .map_err(|e| format!("Nie można utworzyć folderu zgłoszeń „{}”: {}", directory.display(), e))?;
    let mut stem = sanitize_component(base_name);
    if stem.is_empty() {
        stem = source.file_stem().map(|name| sanitize_component(&name.to_string_lossy())).unwrap_or_default();
    }
    if stem.is_empty() { stem = "zgłoszenie".into(); }
    let target = unique_target(&directory, &stem, extension_of(source).as_deref());
    resolve_relative(root, &format!("{}/{}/{}", FOLDER, year, target.file_name().ok_or("Nieprawidłowa nazwa pliku")?.to_string_lossy()))?;
    std::fs::copy(source, &target).map_err(|e| format!("Nie udało się skopiować pliku zgłoszenia: {}", e))?;
    let file_name = target.file_name().ok_or("Nieprawidłowa nazwa pliku")?.to_string_lossy();
    Ok(format!("{}/{}/{}", FOLDER, year, file_name))
}

/// Kopiuje wskazany plik do folderu zgłoszeń danego roku szkolnego i zwraca ścieżkę do zapisania w bazie.
#[tauri::command]
pub fn import_participation_file(source_path: String, school_year: String, base_name: String) -> Result<String, String> {
    super::db_lock::ensure_owned(&super::database_path()?)?;
    import_into(&files_root()?, Path::new(&source_path), &school_year, &base_name)
}

/// Zawartość pliku do podglądu w aplikacji (binarnie, bez kodowania base64).
#[tauri::command]
pub fn read_participation_file(relative_path: String) -> Result<tauri::ipc::Response, String> {
    let path = existing_file(&relative_path)?;
    let size = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if size > PREVIEW_LIMIT_BYTES {
        return Err("Plik jest zbyt duży na podgląd w aplikacji – otwórz go w domyślnym programie.".into());
    }
    std::fs::read(&path).map(tauri::ipc::Response::new).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_participation_file(relative_path: String) -> Result<(), String> {
    super::open_in_file_manager(&existing_file(&relative_path)?, false)
}

#[tauri::command]
pub fn reveal_participation_file(relative_path: String) -> Result<(), String> {
    super::open_in_file_manager(&existing_file(&relative_path)?, true)
}

/// Otwiera folder zgłoszeń (tworzy go, jeśli jeszcze nie istnieje).
#[tauri::command]
pub fn open_participation_files_folder() -> Result<(), String> {
    let root = files_root()?;
    std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    super::open_in_file_manager(&root, false)
}

/// Usuwa kopię zaimportowaną przed nieudanym zapisem zgłoszenia, aby nie zostawiać osieroconych plików.
#[tauri::command]
pub fn discard_participation_file(relative_path: String) -> Result<(), String> {
    super::db_lock::ensure_owned(&super::database_path()?)?;
    let path = resolve_relative(&files_root()?, &relative_path)?;
    if path.is_file() { std::fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_names_for_windows() {
        assert_eq!(sanitize_component("  Program: „Trzymaj formę!” / SP 1?.  "), "Program „Trzymaj formę!” SP 1");
        assert_eq!(year_folder("2026/2027"), "2026-2027");
        assert_eq!(year_folder(" "), "bez roku szkolnego");
        assert_eq!(sanitize_component(&"a".repeat(300)).chars().count(), MAX_NAME_CHARS);
    }

    #[test]
    fn rejects_paths_outside_the_folder() {
        let root = Path::new("/baza").join(FOLDER);
        assert!(resolve_relative(&root, &format!("{}/2026-2027/plik.pdf", FOLDER)).is_ok());
        assert!(resolve_relative(&root, &format!("{}/../ozipz.db", FOLDER)).is_err());
        assert!(resolve_relative(&root, "../ozipz.db").is_err());
        assert!(resolve_relative(&root, "/etc/passwd").is_err());
        assert!(resolve_relative(&root, "Inny/plik.pdf").is_err());
        assert!(resolve_relative(&root, FOLDER).is_err());
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlinks_for_read_delete_and_import_paths() {
        let directory = std::env::temp_dir().join(format!("ozipz-symlink-test-{}", std::process::id()));
        let root = directory.join(FOLDER);
        let outside = directory.join("outside");
        std::fs::create_dir_all(&root).unwrap();
        std::fs::create_dir_all(&outside).unwrap();
        std::fs::write(outside.join("file.pdf"), b"outside file").unwrap();
        std::os::unix::fs::symlink(&outside, root.join("linked")).unwrap();
        assert!(resolve_relative(&root, "Zgłoszenia/linked/file.pdf").is_err());
        assert!(import_into(&root, &outside.join("file.pdf"), "linked", "copy").is_err());
        assert_eq!(std::fs::read(outside.join("file.pdf")).unwrap(), b"outside file");
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn imports_into_year_folder_without_overwriting() {
        let directory = std::env::temp_dir().join(format!("ozipz-participation-files-{}", std::process::id()));
        let root = directory.join(FOLDER);
        std::fs::create_dir_all(&directory).unwrap();
        let source = directory.join("Skan.PDF");
        std::fs::write(&source, b"%PDF-1.4").unwrap();

        let first = import_into(&root, &source, "2026/2027", "Program – SP 1").unwrap();
        let second = import_into(&root, &source, "2026/2027", "Program – SP 1").unwrap();
        assert_eq!(first, format!("{}/2026-2027/Program – SP 1.pdf", FOLDER));
        assert_eq!(second, format!("{}/2026-2027/Program – SP 1 (2).pdf", FOLDER));
        assert_eq!(std::fs::read(resolve_relative(&root, &second).unwrap()).unwrap(), b"%PDF-1.4");
        assert!(import_into(&root, &directory.join("brak.pdf"), "2026/2027", "x").is_err());
        std::fs::remove_dir_all(directory).unwrap();
    }
}
