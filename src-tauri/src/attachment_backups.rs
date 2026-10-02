//! Participation files are included inside the SQLite backup, keeping a backup portable.
use sqlx::{Connection, SqliteConnection, sqlite::SqliteConnectOptions};
use std::path::{Path, PathBuf};

const TABLE: &str = "ozipz_backup_files";

fn collect_files(directory: &Path, root: &Path, files: &mut Vec<(String, PathBuf)>) -> Result<(), String> {
    for entry in std::fs::read_dir(directory).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        let metadata = std::fs::symlink_metadata(&path).map_err(|e| e.to_string())?;
        if metadata.file_type().is_symlink() {
            return Err(format!("Folder zgłoszeń zawiera dowiązanie: {}", path.display()));
        }
        if metadata.is_dir() {
            collect_files(&path, root, files)?;
        } else if metadata.is_file() {
            let relative = path.strip_prefix(root).map_err(|e| e.to_string())?.to_string_lossy().replace('\\', "/");
            files.push((relative, path));
        }
    }
    Ok(())
}

fn files_for(database: &Path) -> Result<Vec<(String, PathBuf)>, String> {
    let parent = database.parent().ok_or("Nieznany folder bazy danych")?;
    let folder = parent.join(super::participation_files::FOLDER);
    if !folder.exists() { return Ok(Vec::new()); }
    // Reject a linked root as well as links nested inside it.
    super::participation_files::resolve_relative(&folder, &format!("{}/probe", super::participation_files::FOLDER))?;
    let mut files = Vec::new();
    collect_files(&folder, parent, &mut files)?;
    Ok(files)
}

pub fn embed_files(database: &Path, snapshot: &Path) -> Result<(), String> {
    let files = files_for(database)?;
    tauri::async_runtime::block_on(async {
        let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(snapshot)).await.map_err(|e| e.to_string())?;
        let result = async {
            sqlx::query(&format!("CREATE TABLE IF NOT EXISTS {TABLE} (path TEXT PRIMARY KEY, contents BLOB NOT NULL)")).execute(&mut connection).await.map_err(|e| e.to_string())?;
            sqlx::query(&format!("DELETE FROM {TABLE}")).execute(&mut connection).await.map_err(|e| e.to_string())?;
            for (relative, path) in files {
                let contents = std::fs::read(path).map_err(|e| e.to_string())?;
                sqlx::query(&format!("INSERT INTO {TABLE} (path, contents) VALUES (?, ?)"))
                    .bind(relative).bind(contents).execute(&mut connection).await.map_err(|e| e.to_string())?;
            }
            Ok(())
        }.await;
        connection.close().await.map_err(|e| e.to_string())?;
        result
    })
}

/// Extracts before activation. A legacy backup without this table leaves existing files in place.
pub fn stage_files(snapshot: &Path, database: &Path) -> Result<(), String> {
    let pending = database.with_extension("restore-files-pending");
    let staged = database.with_extension("restore-files");
    if pending.exists() { std::fs::remove_dir_all(&pending).map_err(|e| e.to_string())?; }
    let extracted = tauri::async_runtime::block_on(async {
        let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(snapshot)).await.map_err(|e| e.to_string())?;
        let result = async {
            let exists: (i64,) = sqlx::query_as("SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?")
                .bind(TABLE).fetch_one(&mut connection).await.map_err(|e| e.to_string())?;
            if exists.0 == 0 { return Ok(false); }
            let root = pending.join(super::participation_files::FOLDER);
            std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;
            let paths: Vec<(String,)> = sqlx::query_as(&format!("SELECT path FROM {TABLE}")).fetch_all(&mut connection).await.map_err(|e| e.to_string())?;
            for (relative,) in paths {
                let target = super::participation_files::resolve_relative(&root, &relative)?;
                if let Some(parent) = target.parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
                let (length,): (i64,) = sqlx::query_as(&format!("SELECT length(contents) FROM {TABLE} WHERE path=?"))
                    .bind(&relative).fetch_one(&mut connection).await.map_err(|e| e.to_string())?;
                let mut file = std::fs::OpenOptions::new().write(true).create_new(true).open(&target)
                    .map_err(|e| format!("Nie można przywrócić pliku {}: {}", relative, e))?;
                // Keep memory bounded when restoring large documents from an imported backup.
                let mut offset = 0_i64;
                while offset < length {
                    let (contents,): (Vec<u8>,) = sqlx::query_as(&format!("SELECT substr(contents, ?, ?) FROM {TABLE} WHERE path=?"))
                        .bind(offset + 1).bind(1024 * 1024_i64).bind(&relative)
                        .fetch_one(&mut connection).await.map_err(|e| e.to_string())?;
                    if contents.is_empty() { return Err("Niepełny plik dokumentu w kopii zapasowej".into()); }
                    offset += contents.len() as i64;
                    std::io::Write::write_all(&mut file, &contents).map_err(|e| e.to_string())?;
                }
            }
            Ok(true)
        }.await;
        connection.close().await.map_err(|e| e.to_string())?;
        result
    });
    match extracted {
        Ok(has_files) => {
            if has_files {
                if staged.exists() { std::fs::remove_dir_all(&staged).map_err(|e| e.to_string())?; }
                std::fs::rename(&pending, &staged).map_err(|e| e.to_string())?;
                tauri::async_runtime::block_on(async {
                    let mut connection = SqliteConnection::connect_with(&SqliteConnectOptions::new().filename(snapshot)).await.map_err(|e| e.to_string())?;
                    sqlx::query(&format!("DROP TABLE {TABLE}")).execute(&mut connection).await.map_err(|e| e.to_string())?;
                    connection.close().await.map_err(|e| e.to_string())
                })?;
            }
            Ok(())
        }
        Err(error) => { let _ = std::fs::remove_dir_all(&pending); Err(error) }
    }
}

pub fn activate_files(database: &Path) -> Result<(), String> {
    let staged = database.with_extension("restore-files");
    if !staged.exists() { return Ok(()); }
    let live = database.parent().ok_or("Nieznany folder bazy danych")?.join(super::participation_files::FOLDER);
    let previous = database.with_extension("before-restore-files");
    if previous.exists() { std::fs::remove_dir_all(&previous).map_err(|e| e.to_string())?; }
    if live.exists() { std::fs::rename(&live, &previous).map_err(|e| e.to_string())?; }
    if let Err(error) = std::fs::rename(staged.join(super::participation_files::FOLDER), &live) {
        if previous.exists() { let _ = std::fs::rename(&previous, &live); }
        return Err(error.to_string());
    }
    let _ = std::fs::remove_dir(staged);
    Ok(())
}

pub fn copy_files(source: &Path, target: &Path) -> Result<(), String> {
    let parent = target.parent().ok_or("Nieznany folder docelowej bazy")?;
    let root = parent.join(super::participation_files::FOLDER);
    for (relative, source) in files_for(source)? {
        let destination = super::participation_files::resolve_relative(&root, &relative)?;
        if let Some(parent) = destination.parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
        if destination.exists() {
            if std::fs::read(&source).map_err(|e| e.to_string())? != std::fs::read(&destination).map_err(|e| e.to_string())? {
                return Err(format!("W wybranym folderze istnieje inny plik zgłoszenia: {}", relative));
            }
        } else { std::fs::copy(source, destination).map_err(|e| e.to_string())?; }
    }
    Ok(())
}
