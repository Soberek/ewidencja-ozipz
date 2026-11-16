import { describe, expect, it, vi } from "vitest";
import { generateAiDescription, OPENROUTER_ENDPOINT } from "./vite-ai-description";

const request = { apiKey: "sk-or-test", model: "deepseek/deepseek-v4.1-flash", systemPrompt: "s", userPrompt: "u" };
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("generateAiDescription", () => {
  it("wywołuje wyłącznie stały adres OpenRouter z kluczem w nagłówku i zwraca przycięty tekst", async () => {
    const fetchImpl = reply(200, { choices: [{ message: { content: "  Przeprowadzono prelekcję.  " } }] });
    await expect(generateAiDescription(request, fetchImpl)).resolves.toBe("Przeprowadzono prelekcję.");
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe(OPENROUTER_ENDPOINT);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer sk-or-test");
  });

  it("odrzuca brak klucza i niepoprawny model bez wywołania sieci", async () => {
    const fetchImpl = reply(200, {});
    await expect(generateAiDescription({ ...request, apiKey: " " }, fetchImpl)).rejects.toThrow("Brak klucza API");
    await expect(generateAiDescription({ ...request, model: "x y; rm" }, fetchImpl)).rejects.toThrow("Nieprawidłowy identyfikator modelu");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("tłumaczy błędy dostawcy i pustą odpowiedź", async () => {
    await expect(generateAiDescription(request, reply(401, {}))).rejects.toThrow("odrzucił klucz API");
    await expect(generateAiDescription(request, reply(402, {}))).rejects.toThrow("Brak środków");
    await expect(generateAiDescription(request, reply(200, { choices: [] }))).rejects.toThrow("nie zwrócił opisu");
  });
});
