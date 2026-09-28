use super::types::{err, hash, Source};
use scraper::{Html, Selector};

pub fn allowed(url: &str, domains: &[String]) -> bool {
    let Ok(url) = reqwest::Url::parse(url) else {
        return false;
    };
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.port().is_some()
    {
        return false;
    }
    let Some(host) = url.host_str() else {
        return false;
    };
    if host.parse::<std::net::IpAddr>().is_ok() {
        return false;
    }
    domains.iter().any(|d| {
        host.eq_ignore_ascii_case(d)
            || host
                .to_lowercase()
                .ends_with(&format!(".{}", d.to_lowercase()))
    })
}
pub async fn fetch(url: &str, domains: &[String]) -> Result<Source, String> {
    if !allowed(url, domains) {
        return Err("Adres poza listą dozwolonych domen HTTPS".into());
    }
    let mut current = url.to_string();
    for _ in 0..5 {
        let parsed = reqwest::Url::parse(&current).map_err(err)?;
        let host = parsed.host_str().ok_or("Brak domeny")?;
        // Reject private-network destinations, including public names resolving locally.
        let addresses: Vec<_> = tokio::net::lookup_host((host, 443))
            .await
            .map_err(err)?
            .collect();
        if addresses.is_empty() || addresses.iter().any(|a| !public_ip(a.ip())) {
            return Err("Źródło wskazuje adres sieci lokalnej".into());
        }
        let safe_client = reqwest::Client::builder()
            .resolve_to_addrs(host, &addresses)
            .redirect(reqwest::redirect::Policy::none())
            .timeout(std::time::Duration::from_secs(25))
            .build()
            .map_err(err)?;
        let mut response = safe_client.get(&current).send().await.map_err(err)?;
        if response.status().is_redirection() {
            let next = response
                .headers()
                .get("location")
                .and_then(|s| s.to_str().ok())
                .ok_or("Nieprawidłowe przekierowanie")?;
            current = parsed.join(next).map_err(err)?.to_string();
            if !allowed(&current, domains) {
                return Err("Przekierowanie poza dozwolone domeny".into());
            }
            continue;
        }
        if !response.status().is_success() {
            return Err(format!("Nie można odczytać strony: {}", response.status()));
        }
        let kind = response
            .headers()
            .get("content-type")
            .and_then(|s| s.to_str().ok())
            .unwrap_or("")
            .to_string();
        let mut bytes = vec![];
        while let Some(chunk) = response.chunk().await.map_err(err)? {
            if bytes.len() + chunk.len() > 5 * 1024 * 1024 {
                return Err("Strona przekracza limit 5 MB".into());
            }
            bytes.extend_from_slice(&chunk);
        }
        let text = if kind.contains("pdf") {
            tauri::async_runtime::spawn_blocking(move || {
                pdf_extract::extract_text_from_mem(&bytes).map_err(err)
            })
            .await
            .map_err(err)??
        } else if kind.contains("html") {
            let html = Html::parse_document(&String::from_utf8_lossy(&bytes));
            let selector = Selector::parse("p, h1, h2, h3, li, td, th").map_err(err)?;
            html.select(&selector)
                .map(|e| e.text().collect::<Vec<_>>().join(" "))
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            return Err("Źródło nie jest stroną HTML ani PDF".into());
        };
        let text = text.split_whitespace().collect::<Vec<_>>().join(" ");
        if text.len() < 80 {
            return Err(
                "Nie udało się odczytać treści strony; wynik wyszukiwania nie będzie dowodem"
                    .into(),
            );
        }
        let version = hash(&text);
        // Keep full digest even when the evidence excerpt must fit a model request.
        return Ok(Source {
            id: hash(format!("{url}|{version}")),
            path: url.into(),
            location: "treść strony (do 18000 znaków)".into(),
            version,
            text: text.chars().take(18000).collect(),
            fetched_at: Some(chrono::Utc::now().to_rfc3339()),
        });
    }
    Err("Zbyt wiele przekierowań".into())
}
fn public_ip(ip: std::net::IpAddr) -> bool {
    match ip {
        std::net::IpAddr::V4(ip) => {
            !(ip.is_private()
                || ip.is_loopback()
                || ip.is_link_local()
                || ip.is_unspecified()
                || ip.is_broadcast()
                || ip.is_multicast()
                || ip.is_documentation()
                || ip.octets()[0] == 0
                || ip.octets()[0] >= 240
                || (ip.octets()[0] == 100 && (64..=127).contains(&ip.octets()[1])))
        }
        std::net::IpAddr::V6(ip) => match ip.to_ipv4_mapped() {
            Some(v4) => public_ip(v4.into()),
            None => {
                !(ip.is_loopback()
                    || ip.is_unspecified()
                    || ip.is_multicast()
                    || (ip.segments()[0] & 0xfe00) == 0xfc00
                    || (ip.segments()[0] & 0xffc0) == 0xfe80)
            }
        },
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn domain_boundary_and_network_safety() {
        let domains = vec!["gov.pl".into()];
        assert!(allowed("https://www.gov.pl/web/program", &domains));
        for url in [
            "https://gov.pl.evil.test/",
            "https://evilgov.pl/",
            "http://gov.pl/",
            "https://gov.pl@evil.test/",
        ] {
            assert!(!allowed(url, &domains));
        }
        assert!(!public_ip("127.0.0.1".parse().unwrap()));
        assert!(!public_ip("::ffff:127.0.0.1".parse().unwrap()));
    }
}
