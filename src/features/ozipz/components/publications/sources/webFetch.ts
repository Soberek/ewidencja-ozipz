import { invoke, isTauri } from "@tauri-apps/api/core";
import { httpHeaders } from "@/db/http-database";

export interface WebFetchResult {
  finalUrl: string;
  status: number;
  body: string;
}

/**
 * Pobiera stronę źródła publikacji przez warstwę serwerową (Tauri lub serwer Vite).
 * Przeglądarka sama nie odczyta gov.pl/X (CORS) ani nie zobaczy przekierowań.
 */
export async function fetchSourcePage(url: string, options: { headOnly?: boolean } = {}): Promise<WebFetchResult> {
  if (isTauri()) {
    return invoke<WebFetchResult>("fetch_publication_source", { url, headOnly: options.headOnly ?? false });
  }
  const response = await fetch("/api/web/fetch", {
    method: "POST",
    headers: { ...httpHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ url, headOnly: options.headOnly ?? false }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Serwer aplikacji nie pobrał strony (HTTP ${response.status})`);
  }
  return payload as WebFetchResult;
}
