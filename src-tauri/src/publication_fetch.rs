//! Pobieranie stron źródeł publikacji (gov.pl, X) dla modułu importu publikacji.
//! Lista hostów jest zamknięta; przekierowania śledzimy ręcznie, by każdy krok był sprawdzony.

use serde::Serialize;

const ALLOWED_HOSTS: [&str; 5] = [
    "www.gov.pl",
    "gov.pl",
    "syndication.twitter.com",
    "syndication.x.com",
    "cdn.syndication.twimg.com",
];
const MAX_REDIRECTS: usize = 6;
const MAX_BODY_BYTES: usize = 6 * 1024 * 1024;
const USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebFetchResult {
    final_url: String,
    status: u16,
    body: String,
}

fn allowed(url: &reqwest::Url) -> bool {
    url.scheme() == "https"
        && url.username().is_empty()
        && url.password().is_none()
        && url.port().is_none()
        && url
            .host_str()
            .is_some_and(|host| ALLOWED_HOSTS.iter().any(|h| host.eq_ignore_ascii_case(h)))
}

#[tauri::command]
pub async fn fetch_publication_source(url: String, head_only: Option<bool>) -> Result<WebFetchResult, String> {
    let mut current = reqwest::Url::parse(url.trim()).map_err(|e| e.to_string())?;
    if !allowed(&current) {
        return Err("Adres spoza listy dozwolonych źródeł publikacji".into());
    }
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(15))
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| e.to_string())?;

    for _ in 0..=MAX_REDIRECTS {
        let mut response = client
            .get(current.clone())
            .header("Accept", "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "pl-PL,pl;q=0.9,en;q=0.7")
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = response.status().as_u16();

        if response.status().is_redirection() {
            let location = response
                .headers()
                .get("location")
                .and_then(|v| v.to_str().ok())
                .ok_or("Nieprawidłowe przekierowanie")?;
            let next = current.join(location).map_err(|e| e.to_string())?;
            if !allowed(&next) {
                // Przekierowanie poza dozwolone źródła: zwracamy tylko adres docelowy.
                return Ok(WebFetchResult { final_url: next.to_string(), status, body: String::new() });
            }
            current = next;
            continue;
        }

        if head_only.unwrap_or(false) {
            return Ok(WebFetchResult { final_url: current.to_string(), status, body: String::new() });
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
            if bytes.len() + chunk.len() > MAX_BODY_BYTES {
                return Err("Pobierana strona jest zbyt duża".into());
            }
            bytes.extend_from_slice(&chunk);
        }
        return Ok(WebFetchResult {
            final_url: current.to_string(),
            status,
            body: String::from_utf8_lossy(&bytes).into_owned(),
        });
    }
    Err("Zbyt wiele przekierowań".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_exact_publication_hosts_are_allowed() {
        let ok = |u: &str| allowed(&reqwest::Url::parse(u).unwrap());
        assert!(ok("https://www.gov.pl/web/psse-mysliborz/aktualnosci2"));
        assert!(ok("https://cdn.syndication.twimg.com/tweet-result?id=1"));
        assert!(!ok("http://www.gov.pl/"));
        assert!(!ok("https://evil.gov.pl/"));
        assert!(!ok("https://www.gov.pl.evil.test/"));
        assert!(!ok("https://user@www.gov.pl/"));
        assert!(!ok("https://www.gov.pl:8443/"));
    }
}
