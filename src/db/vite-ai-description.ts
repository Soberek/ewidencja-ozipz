/**
 * Generowanie opisów działań przez OpenRouter w trybie webowym (serwer Vite).
 * Odpowiednik polecenia Tauri `generate_ai_description`: ten sam, stały adres i te same reguły walidacji.
 */

export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_PROMPT_CHARS = 12_000;
const MAX_OUTPUT_TOKENS = 900;
const TIMEOUT_MS = 60_000;

export interface AiDescriptionRequest {
  apiKey: unknown;
  model: unknown;
  systemPrompt: unknown;
  userPrompt: unknown;
}

function describeError(status: number, payload: unknown): string {
  if (status === 401 || status === 403) return "OpenRouter odrzucił klucz API. Sprawdź go w Ustawieniach.";
  if (status === 402) return "Brak środków na koncie OpenRouter.";
  if (status === 429) return "Zbyt wiele zapytań do OpenRouter. Spróbuj za chwilę.";
  const detail = (payload as { error?: { message?: unknown } } | null)?.error?.message;
  return `OpenRouter zwrócił błąd ${status}: ${typeof detail === "string" ? detail : "nieznany błąd"}`;
}

export async function generateAiDescription(request: AiDescriptionRequest, fetchImpl: typeof fetch = fetch): Promise<string> {
  const apiKey = typeof request.apiKey === "string" ? request.apiKey.trim() : "";
  const model = typeof request.model === "string" ? request.model.trim() : "";
  const systemPrompt = typeof request.systemPrompt === "string" ? request.systemPrompt : "";
  const userPrompt = typeof request.userPrompt === "string" ? request.userPrompt : "";
  if (!apiKey) throw new Error("Brak klucza API OpenRouter. Uzupełnij go w Ustawieniach.");
  if (!model || model.length > 120 || !/^[A-Za-z0-9/_.:~-]+$/.test(model)) throw new Error("Nieprawidłowy identyfikator modelu AI.");
  if (systemPrompt.length + userPrompt.length > MAX_PROMPT_CHARS) throw new Error("Zbyt długie dane do wygenerowania opisu.");

  const response = await fetchImpl(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Ewidencja OZiPZ" },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw new Error(`Nie udało się połączyć z OpenRouter: ${error instanceof Error ? error.message : String(error)}`);
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(describeError(response.status, payload));
  const content = (payload as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new Error("Model nie zwrócił opisu. Spróbuj ponownie.");
  return text;
}
