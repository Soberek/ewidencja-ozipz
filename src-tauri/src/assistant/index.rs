use super::{
    documents, storage,
    types::{err, hash, Config, DocumentStatus, Source},
};
use sqlx::{Row, SqlitePool};
use std::path::Path;

pub async fn refresh(pool: &SqlitePool, config: &Config) -> Result<Vec<DocumentStatus>, String> {
    refresh_scope(pool, config, None).await
}
pub async fn refresh_program(
    pool: &SqlitePool,
    config: &Config,
    program: &str,
) -> Result<Vec<DocumentStatus>, String> {
    refresh_scope(pool, config, Some(program)).await
}
async fn refresh_scope(
    pool: &SqlitePool,
    config: &Config,
    only: Option<&str>,
) -> Result<Vec<DocumentStatus>, String> {
    let mut config = config.clone();
    config.programs = super::library::discover(&config)?;
    if let Some(program) = only {
        config.programs.retain(|p| p.id == program);
        config.style_files.clear();
    }

    let old: Vec<(String, String, String)> =
        sqlx::query_as("SELECT path,program,version FROM assistant_documents")
            .fetch_all(pool)
            .await
            .map_err(err)?;
    let records = tauri::async_runtime::spawn_blocking(move || {
        let mut files = vec![];
        for program in &config.programs {
            let root = std::fs::canonicalize(&program.folder)
                .map_err(|e| format!("{}: {e}", program.folder))?;
            for entry in walkdir::WalkDir::new(&root).follow_links(false) {
                let entry = entry.map_err(err)?;
                if !entry.file_type().is_file() {
                    continue;
                }
                if supported(entry.path()) {
                    files.push((program.id.clone(), entry.path().to_path_buf()));
                }
            }
        }
        for file in &config.style_files {
            files.push((
                "__style__".into(),
                std::fs::canonicalize(file).map_err(err)?,
            ));
        }
        let mut records = vec![];
        for (program, path) in files {
            let path_text = path.to_string_lossy().to_string();
            let bytes = documents::read_bytes(&path);
            let version = bytes.as_ref().map(hash).unwrap_or_default();
            let unchanged = !version.is_empty()
                && old
                    .iter()
                    .any(|(p, g, v)| p == &path_text && g == &program && v == &version);
            if unchanged {
                records.push((program, path_text, version, None));
                continue;
            }
            let data = bytes
                .and_then(|b| documents::extract(&path, &b))
                .map(|sections| documents::chunks(&path_text, &version, sections));
            records.push((program, path_text, version, Some(data)));
        }
        Ok::<_, String>(records)
    })
    .await
    .map_err(err)??;
    let mut tx = pool.begin().await.map_err(err)?;
    // Build the new snapshot atomically; interrupted scans never delete the previous index.
    let existing: Vec<(String, String)> =
        sqlx::query_as("SELECT path,program FROM assistant_documents")
            .fetch_all(&mut *tx)
            .await
            .map_err(err)?;
    for (path, program) in existing {
        if only.is_some_and(|id| id != program) {
            continue;
        }
        if !records
            .iter()
            .any(|(g, p, _, _)| p == &path && g == &program)
        {
            sqlx::query("DELETE FROM assistant_chunks WHERE path=? AND program=?")
                .bind(&path)
                .bind(&program)
                .execute(&mut *tx)
                .await
                .map_err(err)?;
            sqlx::query("DELETE FROM assistant_documents WHERE path=? AND program=?")
                .bind(path)
                .bind(program)
                .execute(&mut *tx)
                .await
                .map_err(err)?;
        }
    }
    for (program, path, version, data) in records {
        let Some(data) = data else {
            continue;
        };
        sqlx::query("DELETE FROM assistant_chunks WHERE path=? AND program=?")
            .bind(&path)
            .bind(&program)
            .execute(&mut *tx)
            .await
            .map_err(err)?;
        let status = match &data {
            Ok(chunks) if !chunks.is_empty() => "gotowy".to_string(),
            Ok(_) => "brak tekstu".into(),
            Err(e) => e.clone(),
        };
        if let Ok(chunks) = data {
            for s in chunks {
                sqlx::query("INSERT INTO assistant_chunks(id,program,path,location,version,text) VALUES(?,?,?,?,?,?)")
                    .bind(s.id).bind(&program).bind(&path).bind(s.location).bind(&version).bind(s.text).execute(&mut *tx).await.map_err(err)?;
            }
        }
        sqlx::query("INSERT INTO assistant_documents VALUES(?,?,?,?) ON CONFLICT(path,program) DO UPDATE SET version=excluded.version,status=excluded.status")
            .bind(path).bind(program).bind(version).bind(status).execute(&mut *tx).await.map_err(err)?;
    }
    tx.commit().await.map_err(err)?;
    statuses(pool).await
}
fn supported(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase()
            .as_str(),
        "docx" | "pdf" | "txt" | "md"
    )
}
pub async fn statuses(pool: &SqlitePool) -> Result<Vec<DocumentStatus>, String> {
    let rows: Vec<(String, String)> =
        sqlx::query_as("SELECT path,status FROM assistant_documents ORDER BY path")
            .fetch_all(pool)
            .await
            .map_err(err)?;
    Ok(rows
        .into_iter()
        .map(|(path, status)| DocumentStatus { path, status })
        .collect())
}
pub fn query_terms(query: &str) -> String {
    query
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| s.chars().count() > 2)
        .take(30)
        .map(|s| format!("\"{s}\"*"))
        .collect::<Vec<_>>()
        .join(" OR ")
}
pub async fn search(
    pool: &SqlitePool,
    program: &str,
    query: &str,
    offset: i64,
) -> Result<Vec<Source>, String> {
    let terms = query_terms(query);
    let mut rows = vec![];
    if !terms.is_empty() && offset == 0 {
        rows = sqlx::query("SELECT * FROM assistant_chunks WHERE assistant_chunks MATCH ? AND program=? ORDER BY bm25(assistant_chunks) LIMIT 16")
            .bind(terms).bind(program).fetch_all(pool).await.map_err(err)?;
    }
    if rows.is_empty() || offset > 0 {
        rows = sqlx::query("SELECT * FROM assistant_chunks WHERE program=? ORDER BY path,location LIMIT 16 OFFSET ?")
            .bind(program).bind(offset.max(0)).fetch_all(pool).await.map_err(err)?;
    }
    Ok(rows
        .into_iter()
        .map(|r| Source {
            id: r.get("id"),
            path: r.get("path"),
            location: r.get("location"),
            version: r.get("version"),
            text: r.get("text"),
            fetched_at: None,
        })
        .collect())
}
pub async fn validate_sources(pool: &SqlitePool, sources: &[Source]) -> Result<(), String> {
    let cfg = storage::config(pool).await?;
    for source in sources {
        if source.fetched_at.is_some() {
            let current = super::web::fetch(&source.path, &cfg.domains).await?;
            if current.version != source.version {
                return Err("Strona źródłowa zmieniła się. Przygotuj projekt ponownie.".into());
            }
        } else if source.path != "Użytkownik" {
            let row: Option<(String,)> = sqlx::query_as(
                "SELECT text FROM assistant_chunks WHERE id=? AND version=? AND path=? LIMIT 1",
            )
            .bind(&source.id)
            .bind(&source.version)
            .bind(&source.path)
            .fetch_optional(pool)
            .await
            .map_err(err)?;
            if row.map(|r| r.0).as_deref() != Some(source.text.as_str()) {
                return Err("Źródło usunięto lub zmieniono. Przygotuj projekt ponownie.".into());
            }
        }
    }
    Ok(())
}
