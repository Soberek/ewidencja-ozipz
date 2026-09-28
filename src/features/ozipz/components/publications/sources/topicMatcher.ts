import type { OzipzProgram, OzipzDictionaryItem } from "../../../types/ozipz.types";

export const DEFAULT_PUBLICATION_TOPIC = "Ogólne OZiPZ / Promocja Zdrowia";
export const DEFAULT_PUBLICATION_JRWA = "9011";

/** Słowa kluczowe do automatycznego dopasowywania tematyki i symboli JRWA */
const TOPIC_KEYWORDS: { pattern: RegExp; topic: string; jrwa: string }[] = [
  { pattern: /grzyb/i, topic: "Profilaktyka zatruć grzybami", jrwa: "9011" },
  { pattern: /kleszcz|borelioz/i, topic: "Choroby odkleszczowe i borelioza", jrwa: "9011" },
  { pattern: /beauty|kosmetycz|fryzjer|tatuaż/i, topic: "Wymagania higieniczno-sanitarne w branży beauty", jrwa: "9010" },
  { pattern: /tytoń|tyton|paleni|nikotyn|papieros/i, topic: "Profilaktyka tytoniowa", jrwa: "9011" },
  { pattern: /wzw|wirusow.*wątrob|żółtaczk/i, topic: "Wirusowe Zapalenie Wątroby (WZW)", jrwa: "9011" },
  { pattern: /higien|czyst.*ręk|myci.*ręk|myj.*ręce/i, topic: "Higiena i czyste ręce", jrwa: "9011" },
  { pattern: /szczepien|hpv/i, topic: "Szczepienia ochronne & HPV", jrwa: "9011" },
  { pattern: /odżywian|cukier|otyłoś|żywien|szkoła.*przestrzeń/i, topic: "Zdrowe odżywianie i aktywność fizyczna", jrwa: "9011" },
  { pattern: /bezpieczne wakacje|letni|kąpiel|wypoczynek|upał/i, topic: "Bezpieczny wypoczynek i letnie wakacje", jrwa: "9011" },
  { pattern: /substancj.*chemiczn|rakotwórcz|mutagenn|środowisk.*pracy/i, topic: "Substancje chemiczne i czynniki rakotwórcze", jrwa: "9010" },
  { pattern: /wod.*przeznaczon|badani.*wody|laboratori/i, topic: "Jakość wody i bezpieczeństwo sanitarne", jrwa: "9010" },
  { pattern: /czad|tlenek węgla|ogrzewan/i, topic: "Zagrożenia tlenkiem węgla (czad)", jrwa: "9011" },
  { pattern: /nowotwór|rak.*szyjki|onkolog/i, topic: "Profilaktyka onkologiczna", jrwa: "9011" },
  { pattern: /antybiotyk/i, topic: "Racjonalna antybiotykoterapia", jrwa: "9011" },
  { pattern: /zęb|stomatolog|uśmiech/i, topic: "Higiena jamy ustnej", jrwa: "9011" },
  { pattern: /młodzi.*świadomi/i, topic: "Program Młodzi Świadomi", jrwa: "9011" },
];

export interface TopicMatch {
  programId?: string;
  programName?: string;
  topic: string;
  suggestedJrwa?: string;
}

const fromProgram = (prog: OzipzProgram): TopicMatch => ({
  programId: prog.id,
  programName: prog.name,
  topic: prog.name,
  suggestedJrwa: prog.jrwaSymbol || undefined,
});

/** Automatyczne powiązanie ze słownikiem programów profilaktycznych i JRWA */
export function matchTopicAndJrwa(
  title: string,
  programs: OzipzProgram[] = [],
  jrwaSymbols: OzipzDictionaryItem[] = []
): TopicMatch {
  const cleanTitle = String(title || "").trim().toLowerCase();

  const byName = programs.find((p) => p.name && cleanTitle.includes(p.name.toLowerCase()));
  if (byName) return fromProgram(byName);

  // Co najmniej dwa charakterystyczne słowa z nazwy programu – jedno ogólne słowo (np. "bezpieczeństwo") to za mało.
  let byKeyword: OzipzProgram | undefined;
  let bestHits = 1;
  for (const prog of programs) {
    const keywords = new Set(prog.name.toLowerCase().split(/[\s,.#()„”"-]+/).filter((kw) => kw.length >= 5));
    const hits = Array.from(keywords).filter((kw) => cleanTitle.includes(kw)).length;
    if (hits > bestHits) {
      bestHits = hits;
      byKeyword = prog;
    }
  }
  if (byKeyword) return fromProgram(byKeyword);

  for (const rule of TOPIC_KEYWORDS) {
    if (rule.pattern.test(cleanTitle)) {
      const relatedProg = programs.find((p) => rule.pattern.test(p.name));
      const matchedSymbol = jrwaSymbols.find((j) => j.code === rule.jrwa);
      return {
        programId: relatedProg?.id,
        programName: relatedProg?.name,
        topic: relatedProg?.name || rule.topic,
        suggestedJrwa: relatedProg?.jrwaSymbol || (matchedSymbol ? matchedSymbol.code : rule.jrwa),
      };
    }
  }

  return { topic: DEFAULT_PUBLICATION_TOPIC, suggestedJrwa: DEFAULT_PUBLICATION_JRWA };
}
