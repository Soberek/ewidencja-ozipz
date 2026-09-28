/**
 * Narzędzia do normalizacji i standaryzacji form działań (activityType)
 * zgodnie ze słownikiem ozipz_dictionaries Sekcji OZiPZ.
 * 
 * Chroni przed zanieczyszczaniem zestawień i raportów treściami postów/tweetów,
 * indywidualnymi tytułami, skrótami roboczymi (np. "BW") czy nazwami programów.
 */

export interface ActionFormResolvable {
  actionType?: string | null;
  dzialanie_nazwa?: string | null;
  title?: string | null;
  topic?: string | null;
}

/**
 * Zwraca kanoniczną, słownikową etykietę formy działania (activityType).
 * Jeśli działanie posiada wypełnione pole actionType, standaryzuje je
 * do oficjalnych wartości ze słownika OZiPZ.
 * W przypadku braku typu wnioskuje formę z kontekstu lub zwraca "Inna forma".
 * Pod żadnym pozorem nie zwraca surowego tytułu/posta jako formy działania.
 */
export function resolveActivityFormLabel(action?: ActionFormResolvable | null): string {
  if (!action) return "Inna forma";

  // 1. Sprawdzamy pole actionType lub dzialanie_nazwa
  const rawType = (action.actionType || action.dzialanie_nazwa || "").trim();
  if (rawType) {
    const lower = rawType.toLowerCase();

    if (lower.includes("portal x") || lower.includes("twitter") || lower === "publikacja_x") {
      return "Publikacja media (Portal X)";
    }
    if (lower.includes("facebook") || lower === "fb" || lower.includes("meta") || lower === "publikacja_fb") {
      return "Publikacja media (Facebook)";
    }
    if (lower.includes("strona") || lower.includes("gov") || lower.includes("portal") || lower === "publikacja_strona") {
      return "Publikacja media (Strona)";
    }
    if (lower.includes("wywiad")) {
      return "Wywiad do mediów";
    }
    if (lower.includes("publikacja")) {
      return "Publikacja w mediach";
    }
    if (lower.includes("stoisko")) {
      return "Stoisko edukacyjno-informacyjne";
    }
    if (lower.includes("prelekcja") || lower.includes("warsztat") || lower.includes("pogadanka")) {
      return "Prelekcja (warsztat)";
    }
    if (lower.includes("wykład") || lower.includes("wyklad")) {
      return "Wykład";
    }
    if (lower.includes("dystrybucja") || lower.includes("rozdawnictwo") || lower.includes("rozdzielnik")) {
      return "Dystrybucja";
    }
    if (lower.includes("konkurs") || lower.includes("quiz") || lower.includes("olimpiad")) {
      return "Konkurs (quiz)";
    }
    if (lower.includes("pismo") || lower.includes("list intencyjny")) {
      return "Pismo (list intencyjny)";
    }
    if (lower.includes("rozmowa") || lower.includes("instruktaż") || lower.includes("instruktaz")) {
      return "Rozmowa indywidualna (instruktaż)";
    }
    if (lower.includes("sprawozdanie") || lower.includes("miernik")) {
      return "Sprawozdanie (z programu, miernik, tytoń)";
    }
    if (lower.includes("happening") || lower.includes("przemarsz") || lower.includes("festyn") || lower.includes("event")) {
      return "Happening (przemarsz, gra, event)";
    }
    if (lower.includes("szkolenie")) {
      return "Szkolenie";
    }
    if (lower.includes("narada")) {
      return "Narada";
    }
    if (lower.includes("wizytacja")) {
      return "Wizytacja";
    }
    if (lower.includes("kontrola")) {
      return "Kontrola";
    }
    if (lower.includes("konferencja")) {
      return "Konferencja";
    }

    // Jeśli wpis słownikowy został dodany dynamicznie przez użytkownika w Centrum Słowników
    // i jest zwięzłą nazwą (a nie wielolinijkowym postem/opisem), zachowujemy go
    if (rawType.length <= 60 && !rawType.includes("http") && !rawType.includes("#") && !rawType.includes("\n")) {
      return rawType;
    }
  }

  // 2. Jeśli actionType było puste lub nieprawidłowe, wnioskujemy z kontekstu (tematyki lub tytułu)
  const contextText = `${action.title || ""} ${action.topic || ""}`.toLowerCase();
  if (contextText.includes("portal x") || contextText.includes("twitter") || contextText.includes("#")) {
    return "Publikacja media (Portal X)";
  }
  if (contextText.includes("facebook") || contextText.includes("post fb") || contextText.includes("fb.com")) {
    return "Publikacja media (Facebook)";
  }
  if (contextText.includes("gov.pl") || contextText.includes("artykuł") || contextText.includes("artykul") || contextText.includes("strona www")) {
    return "Publikacja media (Strona)";
  }
  if (contextText.includes("stoisko")) {
    return "Stoisko edukacyjno-informacyjne";
  }
  if (contextText.includes("prelekcja") || contextText.includes("warsztat") || contextText.includes("pogadanka")) {
    return "Prelekcja (warsztat)";
  }
  if (contextText.includes("wykład") || contextText.includes("wyklad")) {
    return "Wykład";
  }
  if (contextText.includes("dystrybucja") || contextText.includes("ulot") || contextText.includes("broszur")) {
    return "Dystrybucja";
  }
  if (contextText.includes("konkurs") || contextText.includes("quiz")) {
    return "Konkurs (quiz)";
  }
  if (contextText.includes("pismo") || contextText.includes("list")) {
    return "Pismo (list intencyjny)";
  }

  return "Inna forma";
}
