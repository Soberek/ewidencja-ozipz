use super::{
    storage,
    types::{err, Config},
};
use serde_json::{json, Value};
use sqlx::SqlitePool;

pub fn credential() -> Result<keyring::Entry, String> {
    keyring::Entry::new("pl.gov.pis.ewidencja.ozipz.assistant", "openrouter").map_err(err)
}
pub async fn call(
    pool: &SqlitePool,
    config: &Config,
    system: &str,
    input: Value,
    web: bool,
) -> Result<Value, String> {
    let key = credential()?
        .get_password()
        .map_err(|_| "Dodaj klucz OpenRoutera w ustawieniach asystenta")?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(err)?;
    let models: Value = client
        .get("https://openrouter.ai/api/v1/models")
        .send()
        .await
        .map_err(|_| "Nie można pobrać cennika OpenRoutera")?
        .error_for_status()
        .map_err(err)?
        .json()
        .await
        .map_err(err)?;
    let model = models["data"]
        .as_array()
        .and_then(|list| {
            list.iter()
                .find(|m| m["id"].as_str() == Some(&config.model))
        })
        .ok_or("Wybrany model jest niedostępny. Zmień model w ustawieniach.")?;
    let input_text = input.to_string();
    if input_text.len() > 240_000 {
        return Err("Zbyt dużo materiału w jednym wywołaniu".into());
    }
    let reserve = super::budget::reserve(model, system.len() + input_text.len(), web)?;
    let usage = storage::usage(pool).await?;
    super::budget::check(
        usage["cost"].as_f64().unwrap_or(0.0),
        usage["pending"].as_i64().unwrap_or(0),
        reserve,
        config.monthly_limit_usd,
    )?;
    let row =
        sqlx::query("INSERT INTO assistant_usage(month,cost,status,model) VALUES(?,?,'pending',?)")
            .bind(chrono::Utc::now().format("%Y-%m").to_string())
            .bind(reserve)
            .bind(&config.model)
            .execute(pool)
            .await
            .map_err(err)?;
    let mut body = json!({"model":config.model,"messages":[{"role":"system","content":system},{"role":"user","content":input_text}],
        "max_tokens":8192,"temperature":0.1,"provider":{"allow_fallbacks":false,"require_parameters":true,"max_price":{"prompt":model["pricing"]["prompt"].as_str().and_then(|s|s.parse::<f64>().ok()).unwrap_or(0.0)*1_000_000.0,"completion":model["pricing"]["completion"].as_str().and_then(|s|s.parse::<f64>().ok()).unwrap_or(0.0)*1_000_000.0}},"usage":{"include":true},
        "response_format":{"type":"json_object"}});
    if web {
        body["tools"] = json!([{"type":"openrouter:web_search","parameters":{"engine":"exa","mode":"fast","max_results":3,"max_total_results":3,"max_uses":1,"max_characters":4000,"allowed_domains":config.domains}}]);
    }
    let response = client.post("https://openrouter.ai/api/v1/chat/completions").bearer_auth(key).json(&body).send().await
        .map_err(|_| "Połączenie przerwano. Rezerwacja kosztu pozostaje do wyjaśnienia w historii OpenRoutera.")?;
    if !response.status().is_success() {
        let status = response.status();
        if status.is_client_error() {
            sqlx::query("UPDATE assistant_usage SET cost=0,status='rejected' WHERE id=?")
                .bind(row.last_insert_rowid())
                .execute(pool)
                .await
                .map_err(err)?;
        }
        return Err(match status.as_u16() {
            401 | 403 => "OpenRouter odrzucił klucz API".into(),
            402 => "Brak środków na koncie OpenRouter".into(),
            429 => "Limit zapytań OpenRouter. Spróbuj później.".into(),
            _ => format!("OpenRouter: błąd {status}"),
        });
    }
    let response: Value = response.json().await.map_err(err)?;
    if let Some(cost) = response["usage"]["cost"]
        .as_f64()
        .filter(|n| n.is_finite() && *n >= 0.0)
    {
        sqlx::query("UPDATE assistant_usage SET cost=?,status='complete' WHERE id=?")
            .bind(cost)
            .bind(row.last_insert_rowid())
            .execute(pool)
            .await
            .map_err(err)?;
    }
    let content = response["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("Model nie zwrócił tekstu")?;
    serde_json::from_str(content)
        .map_err(|_| "Model zwrócił niepoprawny format. Projekt nie został zaakceptowany.".into())
}
