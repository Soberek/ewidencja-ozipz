//! Rozpoznaje, czy baza leży na dysku lokalnym, sieciowym czy w folderze synchronizowanym z chmurą.
//! Na dyskach sieciowych i w chmurze tryb WAL SQLite nie jest bezpieczny.
use std::path::Path;

#[derive(serde::Serialize, Clone, Copy, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StorageKind {
    Local,
    Network,
    Cloud,
}

const CLOUD_MARKERS: [&str; 5] = ["onedrive", "dropbox", "google drive", "googledrive", "icloud"];

pub fn classify(path: &Path) -> StorageKind {
    let text = path.to_string_lossy().replace('/', "\\");
    let lower = text.to_lowercase();
    if lower.split('\\').any(|part| CLOUD_MARKERS.iter().any(|marker| part.starts_with(marker))) {
        return StorageKind::Cloud;
    }
    if lower.starts_with("\\\\?\\unc\\") { return StorageKind::Network; }
    let plain = text.strip_prefix("\\\\?\\").unwrap_or(&text);
    if plain.starts_with("\\\\") || is_remote_drive(plain) { StorageKind::Network } else { StorageKind::Local }
}

#[cfg(windows)]
fn is_remote_drive(path: &str) -> bool {
    #[link(name = "kernel32")]
    extern "system" {
        fn GetDriveTypeW(root_path_name: *const u16) -> u32;
    }
    const DRIVE_REMOTE: u32 = 4;
    let bytes = path.as_bytes();
    if bytes.len() < 2 || bytes[1] != b':' || !bytes[0].is_ascii_alphabetic() { return false; }
    let root: Vec<u16> = format!("{}:\\", bytes[0] as char).encode_utf16().chain(std::iter::once(0)).collect();
    // SAFETY: `root` to zakończony zerem ciąg UTF-16, który żyje przez całe wywołanie.
    unsafe { GetDriveTypeW(root.as_ptr()) == DRIVE_REMOTE }
}

#[cfg(not(windows))]
fn is_remote_drive(_path: &str) -> bool { false }

#[tauri::command]
pub fn get_database_storage_kind() -> Result<StorageKind, String> {
    Ok(classify(&super::database_path()?))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognises_cloud_and_network_locations() {
        assert_eq!(classify(Path::new(r"C:\Users\anna\OneDrive - PSSE\Ewidencja\ozipz.db")), StorageKind::Cloud);
        assert_eq!(classify(Path::new(r"\\serwer\wspolne\ozipz.db")), StorageKind::Network);
        assert_eq!(classify(Path::new(r"\\?\UNC\serwer\wspolne\ozipz.db")), StorageKind::Network);
        assert_eq!(classify(Path::new(r"\\?\C:\Users\anna\Documents\ozipz.db")), StorageKind::Local);
        assert_eq!(classify(Path::new("/Users/anna/Documents/Ewidencja OZiPZ/ozipz.db")), StorageKind::Local);
        assert_eq!(classify(Path::new(r"C:\Users\anna\Dropbox\ozipz.db")), StorageKind::Cloud);
    }
}
