use super::types::{err, Config};
use serde_json::{json, Value};
use sqlx::{Row, SqlitePool};
use tauri::Manager;

pub async fn connect(app: &tauri::AppHandle) -> Result<SqlitePool, String> {
    let dir = app.path().app_data_dir().map_err(err)?.join("assistant");
    std::fs::create_dir_all(&dir).map_err(err)?;
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename(dir.join("assistant.db"))
                .create_if_missing(true)
                .foreign_keys(true)
                .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal),
        )
        .await
        .map_err(err)?;
    migrate(&pool).await?;
    Ok(pool)
}
pub async fn migrate(pool: &SqlitePool) -> Result<(), String> {
    sqlx::raw_sql("CREATE TABLE IF NOT EXISTS assistant_settings(id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS assistant_documents(path TEXT NOT NULL, program TEXT NOT NULL, version TEXT NOT NULL, status TEXT NOT NULL, PRIMARY KEY(path,program));
        CREATE VIRTUAL TABLE IF NOT EXISTS assistant_chunks USING fts5(id UNINDEXED, program UNINDEXED, path UNINDEXED, location UNINDEXED, version UNINDEXED, text, tokenize='unicode61 remove_diacritics 2');
        CREATE TABLE IF NOT EXISTS assistant_drafts(id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS assistant_usage(id INTEGER PRIMARY KEY, month TEXT NOT NULL, cost REAL NOT NULL, status TEXT NOT NULL, model TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS assistant_usage_month ON assistant_usage(month);
        CREATE TABLE IF NOT EXISTS assistant_web(url TEXT PRIMARY KEY, value TEXT NOT NULL);")
        .execute(pool).await.map_err(err)?;
    Ok(())
}
pub async fn config(pool: &SqlitePool) -> Result<Config, String> {
    let row: Option<(String,)> = sqlx::query_as("SELECT value FROM assistant_settings WHERE id=1")
        .fetch_optional(pool)
        .await
        .map_err(err)?;
    let mut cfg: Config = row
        .map(|(s,)| serde_json::from_str(&s).map_err(err))
        .unwrap_or(Ok(Config::default()))?;
    cfg.programs = super::library::discover(&cfg).unwrap_or_default();
    Ok(cfg)
}
pub async fn save_config(pool: &SqlitePool, config: &Config) -> Result<(), String> {
    let mut config = config.clone();
    config.programs = super::library::discover(&config)?;
    if config.model.trim().is_empty()
        || !config.monthly_limit_usd.is_finite()
        || config.monthly_limit_usd <= 0.0
    {
        return Err("Podaj model i dodatni miesięczny limit w USD".into());
    }
    let mut ids = std::collections::HashSet::new();
    for p in &config.programs {
        if p.id.is_empty() || p.name.trim().is_empty() || !ids.insert(&p.id) {
            return Err("Każde przypisanie folderu wymaga unikalnego ID i nazwy programu".into());
        }
        if !std::path::Path::new(&p.folder).is_dir() {
            return Err(format!("Folder nie istnieje: {}", p.folder));
        }
    }
    for domain in &config.domains {
        if domain.contains('/')
            || !domain.contains('.')
            || domain.contains(':')
            || domain.contains('@')
        {
            return Err("Wpisz same domeny, np. www.gov.pl".into());
        }
    }
    sqlx::query("INSERT INTO assistant_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value")
        .bind(serde_json::to_string(&config).map_err(err)?).execute(pool).await.map_err(err)?;
    Ok(())
}
pub async fn usage(pool: &SqlitePool) -> Result<Value, String> {
    let month = chrono::Utc::now().format("%Y-%m").to_string();
    let rows = sqlx::query("SELECT COALESCE(SUM(cost),0.0) AS total, COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) AS pending FROM assistant_usage WHERE month=?")
        .bind(&month).fetch_one(pool).await.map_err(err)?;
    Ok(
        json!({"month":month,"cost": rows.get::<f64,_>("total"),"pending":rows.get::<i64,_>("pending")}),
    )
}
pub async fn drafts(pool: &SqlitePool) -> Result<Value, String> {
    let rows: Vec<(String,)> =
        sqlx::query_as("SELECT value FROM assistant_drafts ORDER BY updated_at DESC")
            .fetch_all(pool)
            .await
            .map_err(err)?;
    let values: Result<Vec<Value>, _> = rows
        .into_iter()
        .map(|(s,)| serde_json::from_str(&s))
        .collect();
    Ok(json!(values.map_err(err)?))
}
pub async fn save_draft(pool: &SqlitePool, value: Value) -> Result<Value, String> {
    let id = value["id"]
        .as_str()
        .filter(|s| !s.is_empty())
        .ok_or("Brak identyfikatora projektu")?;
    sqlx::query("INSERT INTO assistant_drafts VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at")
        .bind(id).bind(value.to_string()).bind(chrono::Utc::now().to_rfc3339()).execute(pool).await.map_err(err)?;
    Ok(value)
}
