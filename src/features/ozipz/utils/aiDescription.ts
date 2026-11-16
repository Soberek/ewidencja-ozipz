import { invoke, isTauri } from "@tauri-apps/api/core";
import { httpHeaders } from "@/db/http-database";

export const DEFAULT_AI_MODEL = "deepseek/deepseek-v4.1-flash";
const SETTINGS_KEY = "ozipz_aiSettings";

export interface AiSettings {
  apiKey: string;
  model: string;
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<AiSettings>;
    return {
      apiKey: typeof raw.apiKey === "string" ? raw.apiKey.trim() : "",
      model: typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULT_AI_MODEL,
    };
  } catch {
    return { apiKey: "", model: DEFAULT_AI_MODEL };
  }
}

export function saveAiSettings(settings: AiSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim() || DEFAULT_AI_MODEL,
  }));
}

/** „action” – opis wykonanego działania (czas przeszły); „template” – wzorzec do powtarzania (bez dat, miejsc i liczb). */
export type DescriptionMode = "action" | "template";

export type DescriptionFact = readonly [label: string, value: string | undefined | null];

const COMMON_RULES = `Zasady redakcji:
- Pisz po polsku, stylem urzędowym, rzeczowo, w stronie biernej lub bezosobowo (np. „przeprowadzono”, „omówiono”); bez zwrotów do czytelnika i bez potocznych sformułowań.
- Opis ma 2–5 zdań (do ok. 600 znaków) i jest jednym ciągłym akapitem – bez nagłówków, list, punktorów i formatowania markdown.
- Opisz, na czym polegały czynności: tematykę, formę pracy z odbiorcami i cel edukacyjny wynikający z podanej tematyki lub programu.
- Opieraj się wyłącznie na podanych danych. Niczego nie dopowiadaj: nie wymyślaj liczb, nazwisk, dat, miejsc, materiałów, wyników ani oceny skuteczności. Jeśli dana nie została podana, pomiń ją.
- Nie podawaj imion i nazwisk osób.
- Notatki użytkownika to jego własne ustalenia: uwzględnij ich treść i zachowaj zawarte w nich fakty, ale połącz je z danymi w jeden spójny opis (nie cytuj ich dosłownie i nie twórz dwóch osobnych części).
- Zwróć wyłącznie gotowy tekst opisu, bez wstępu i komentarza.`;

const MODE_RULES: Record<DescriptionMode, string> = {
  action: "Opisujesz działanie już zrealizowane, więc używaj czasu przeszłego. Datę, miejsce i odbiorców możesz wpleść w opis tylko wtedy, gdy zostały podane.",
  template: "Opisujesz wzorcowy przebieg działania, który będzie powtarzany w różnych miejscach i terminach, więc nie podawaj dat, miejsc, liczby osób ani liczby sztuk materiałów. Pisz w sposób ogólny, nadający się do wielokrotnego użycia.",
};

export const DESCRIPTION_SYSTEM_PROMPT = `Jesteś pracownikiem Sekcji Oświaty Zdrowotnej i Promocji Zdrowia Powiatowej Stacji Sanitarno-Epidemiologicznej. Redagujesz pole „Opis czynności” w ewidencji działań z zakresu oświaty zdrowotnej i promocji zdrowia.

${COMMON_RULES}`;

export function buildSystemPrompt(mode: DescriptionMode): string {
  return `${DESCRIPTION_SYSTEM_PROMPT}\n\n${MODE_RULES[mode]}`;
}

export function buildUserPrompt(facts: readonly DescriptionFact[], existingText: string): string {
  const lines = facts
    .map(([label, value]) => [label, (value ?? "").replace(/\s+/g, " ").trim()] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`);
  const notes = existingText.trim();
  return [
    "Dane działania wybrane w formularzu:",
    lines.length ? lines.join("\n") : "- (nie wybrano żadnych danych)",
    "",
    notes ? `Notatki użytkownika do uwzględnienia:\n${notes}` : "Notatki użytkownika: brak.",
    "",
    "Napisz jeden opis czynności.",
  ].join("\n");
}

/** Model potrafi dodać cudzysłów, nagłówek albo blok kodu – do pola trafia sam tekst opisu. */
export function cleanGeneratedDescription(raw: string): string {
  return raw
    .replace(/^\s*```[a-z]*\n?|\n?```\s*$/g, "")
    .replace(/\*\*|__/g, "")
    .trim()
    .replace(/^(opis czynności|opis)\s*:\s*/i, "")
    .replace(/^["„”]+|["„”]+$/g, "")
    .trim();
}

export async function generateDescription(mode: DescriptionMode, facts: readonly DescriptionFact[], existingText: string): Promise<string> {
  const { apiKey, model } = loadAiSettings();
  if (!apiKey) throw new Error("Najpierw wpisz klucz API OpenRouter w Ustawieniach (karta „Asystent AI”).");
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(facts, existingText);

  let text: string;
  if (isTauri()) {
    text = await invoke<string>("generate_ai_description", { apiKey, model, systemPrompt, userPrompt });
  } else {
    const response = await fetch("/api/ai/describe", {
      method: "POST",
      headers: { ...httpHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model, systemPrompt, userPrompt }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Serwer aplikacji nie wygenerował opisu (HTTP ${response.status})`);
    text = String(payload.text ?? "");
  }
  const cleaned = cleanGeneratedDescription(text);
  if (!cleaned) throw new Error("Model nie zwrócił opisu. Spróbuj ponownie.");
  return cleaned;
}
