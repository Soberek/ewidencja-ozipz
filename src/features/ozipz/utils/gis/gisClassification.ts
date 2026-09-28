import type { GisFormCategory } from "./gisReportTypes";

/**
 * Przypisuje formę działania (etykieta ze słownika activityType) do sekcji formularza GIS.
 * Reguły przeniesione 1:1 z miernika budżetowego (edu-report).
 */
export function classifyGisForm(actionType: string): GisFormCategory {
  const forma = actionType.trim().toLowerCase();

  if (forma.includes("wizytacja") || forma.includes("kontrola")) return "wizytacja";
  if (forma === "szkolenie" || forma === "konferencja" || forma === "narada") return "szkolenie";
  if (forma.includes("konkurs") || forma.includes("quiz")) return "konkurs";
  if (["prelekcj", "wykład", "warsztat", "rozmowa", "instruktaż"].some((key) => forma.includes(key))) return "prelekcja";
  if (["happening", "event", "stoisko", "impreza", "przemarsz"].some((key) => forma.includes(key))) return "event";
  if (forma.includes("publikacja media (strona)")) return "publikacja-strona";
  if (["facebook", "portal x", "instagram", "social", "publikacja media"].some((key) => forma.includes(key))) return "social-media";
  if (forma === "dystrybucja" || forma === "dystrybucja materiałów" || forma.includes("materiały")) return "dystrybucja";

  return "other";
}

const GROUP_MATCHERS: ReadonlyArray<{ keywords: readonly string[]; group: string }> = [
  { keywords: ["dzieci", "uczniowie", "uczestnicy półkolonii", "uczestnicy kolonii", "przedszko", "klasa", "kl."], group: "dzieci" },
  { keywords: ["młodzież", "studen", "ponadpodstaw"], group: "młodzież" },
  { keywords: ["seniorzy", "osoby starsze", "brb", "utw"], group: "seniorzy" },
  { keywords: ["kadra medyczna", "pielęgniarki", "lekarz", "położn", "personel medyczny", "ochrony zdrowia"], group: "kadra medyczna" },
  {
    keywords: ["dorośli", "rodzice", "opiekun", "nauczyciel", "wychowaw", "kadra pedagogiczna", "dyrektor", "koordynator", "pracownicy", "przedstawiciele"],
    group: "dorośli",
  },
  { keywords: ["ogół", "mieszk", "społeczn", "społecze", "internauci", "odbiorcy mediów"], group: "ogół społeczeństwa" },
];

export const OTHER_AUDIENCE_GROUP = "inne niż wymienione";

// Nagłówki podziału na grupy w opisie adresatów, np. "Grupa I:" — nie są grupą odbiorców
const GROUP_HEADER = /^grupa\s*[\divxlc]*\s*:?$/i;

/**
 * Rozbija opis adresatów działania na standardowe grupy odbiorców z formularza GIS.
 */
export function mapToStandardGroups(audienceDescriptions: Iterable<string>): string[] {
  const mappedGroups = new Set<string>();

  for (const description of audienceDescriptions) {
    // Nawiasy zawierają doprecyzowania (wiek, forma), często z przecinkami — nie są osobnymi grupami
    const parts = description
      .replace(/\([^)]*\)/g, "")
      .split(/[,;\n]/)
      .map((part) => part.replace(/^grupa\s*[\divxlc]*\s*:\s*/i, "").trim())
      .filter((part) => part && !GROUP_HEADER.test(part));

    for (const part of parts) {
      const normalized = part.toLowerCase();
      const matched = GROUP_MATCHERS.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
      mappedGroups.add(matched ? matched.group : OTHER_AUDIENCE_GROUP);
    }
  }

  return Array.from(mappedGroups);
}
