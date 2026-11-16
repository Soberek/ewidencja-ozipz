//! Generowanie opisów działań przez OpenRouter. Klucz API przychodzi z ustawień aplikacji
//! i jest używany wyłącznie do tego jednego, stałego adresu – nic innego nie jest wywoływane.

use serde_json::{json, Value};

const ENDPOINT: &str = "https://openrouter.ai/api/v1/chat/completions";
const MAX_PROMPT_CHARS: usize = 12_000;
const MAX_OUTPUT_TOKENS: u32 = 900;

#[tauri::command]
pub async fn generate_ai_description(api_key: String, model: String, system_prompt: String, user_prompt: String) -> Result<String, String> {
    let api_key = api_key.trim();
    let model = model.trim();
    if api_key.is_empty() {
        return Err("Brak klucza API OpenRouter. Uzupełnij go w Ustawieniach.".into());
    }
    if model.is_empty() || model.len() > 120 || !model.chars().all(|c| c.is_ascii_alphanumeric() || "/-_.:~".contains(c)) {
        return Err("Nieprawidłowy identyfikator modelu AI.".into());
    }
    if system_prompt.chars().count() + user_prompt.chars().count() > MAX_PROMPT_CHARS {
        return Err("Zbyt długie dane do wygenerowania opisu.".into());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .post(ENDPOINT)
        .bearer_auth(api_key)
        .header("X-Title", "Ewidencja OZiPZ")
        .json(&json!({
            "model": model,
            "temperature": 0.4,
            "max_tokens": MAX_OUTPUT_TOKENS,
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user", "content": user_prompt },
            ],
        }))
        .send()
        .await
        .map_err(|e| format!("Nie udało się połączyć z OpenRouter: {e}"))?;

    let status = response.status();
    let payload: Value = response.json().await.map_err(|_| "OpenRouter zwrócił nieczytelną odpowiedź.".to_string())?;
    if !status.is_success() {
        return Err(describe_error(status.as_u16(), &payload));
    }
    payload["choices"][0]["message"]["content"]
        .as_str()
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
        .ok_or_else(|| "Model nie zwrócił opisu. Spróbuj ponownie.".to_string())
}

fn describe_error(status: u16, payload: &Value) -> String {
    match status {
        401 | 403 => "OpenRouter odrzucił klucz API. Sprawdź go w Ustawieniach.".into(),
        402 => "Brak środków na koncie OpenRouter.".into(),
        429 => "Zbyt wiele zapytań do OpenRouter. Spróbuj za chwilę.".into(),
        _ => {
            let detail = payload["error"]["message"].as_str().unwrap_or("nieznany błąd");
            format!("OpenRouter zwrócił błąd {status}: {detail}")
        }
    }
}
