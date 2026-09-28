use serde_json::Value;

pub fn reserve(model: &Value, input_bytes: usize, web: bool) -> Result<f64, String> {
    let price = |key: &str| -> Result<f64, String> {
        model["pricing"][key]
            .as_str()
            .and_then(|s| s.parse::<f64>().ok())
            .filter(|p| p.is_finite() && *p >= 0.0)
            .ok_or("Brak wiarygodnego cennika modelu".into())
    };
    let request = model["pricing"]["request"]
        .as_str()
        .unwrap_or("0")
        .parse::<f64>()
        .map_err(|_| "Niepoprawny koszt zapytania")?;
    if !request.is_finite() || request < 0.0 {
        return Err("Niepoprawny koszt zapytania".into());
    }
    // UTF-8 byte count is a conservative token bound. Search has at most one
    // tool call, three 4000-character excerpts and two completion rounds.
    let rounds = if web { 2.0 } else { 1.0 };
    Ok(
        (((input_bytes + if web { 60000 } else { 4096 }) as f64 * price("prompt")?
            + 8192.0 * price("completion")?
            + request)
            * rounds
            + if web { 0.25 } else { 0.0 })
        .max(0.001),
    )
}
pub fn check(cost: f64, pending: i64, reserve: f64, limit: f64) -> Result<(), String> {
    if pending > 0 {
        return Err("Poprzednie wywołanie ma nieustalony koszt. Sprawdź historię OpenRoutera i rozlicz je w ustawieniach.".into());
    }
    if cost + reserve > limit {
        return Err("Miesięczny limit kosztów nie wystarcza na kolejne wywołanie".into());
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn cost_gate_reserves_search_and_never_ignores_unknown_bills() {
        let model =
            json!({"pricing":{"prompt":"0.00000025","completion":"0.0000015","request":"0"}});
        let normal = reserve(&model, 10000, false).unwrap();
        let search = reserve(&model, 10000, true).unwrap();
        assert!(search > normal + 0.25);
        assert!(check(4.99, 0, normal, 5.0).is_err());
        assert!(check(0.0, 1, normal, 5.0).is_err());
        assert!(check(0.0, 0, normal, 5.0).is_ok());
        assert!(reserve(
            &json!({"pricing":{"prompt":"NaN","completion":"0"}}),
            1,
            false
        )
        .is_err());
    }
}
