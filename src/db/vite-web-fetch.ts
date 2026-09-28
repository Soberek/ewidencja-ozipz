/**
 * Serwerowe pobieranie stron zewnętrznych dla modułu publikacji.
 * Przeglądarka nie może czytać gov.pl / X bezpośrednio (CORS) ani zobaczyć przekierowań,
 * więc serwer deweloperski pobiera je sam — wyłącznie z hostów z listy dozwolonych.
 */

export const WEB_FETCH_ALLOWED_HOSTS = [
  "www.gov.pl",
  "gov.pl",
  "syndication.twitter.com",
  "syndication.x.com",
  "cdn.syndication.twimg.com",
] as const;

const MAX_REDIRECTS = 6;
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

export interface WebFetchResult {
  finalUrl: string;
  status: number;
  body: string;
}

export function parseAllowedWebUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return null;
    if (url.username || url.password || (url.port && url.port !== "443")) return null;
    return (WEB_FETCH_ALLOWED_HOSTS as readonly string[]).includes(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
}

/** Pobiera stronę, śledząc przekierowania ręcznie, by każdy krok pozostał na liście dozwolonych hostów. */
export async function fetchAllowedWebPage(rawUrl: string, headOnly = false): Promise<WebFetchResult> {
  let current = parseAllowedWebUrl(rawUrl);
  if (!current) throw new Error("Adres spoza listy dozwolonych źródeł publikacji");

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.7",
      },
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      const next = parseAllowedWebUrl(new URL(location, current).toString());
      if (!next) {
        // Przekierowanie poza dozwolone źródła: zwracamy adres docelowy bez pobierania treści.
        return { finalUrl: new URL(location, current).toString(), status: response.status, body: "" };
      }
      current = next;
      continue;
    }

    if (headOnly) {
      await response.body?.cancel();
      return { finalUrl: current.toString(), status: response.status, body: "" };
    }
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > MAX_BODY_BYTES) throw new Error("Pobierana strona jest zbyt duża");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BODY_BYTES) throw new Error("Pobierana strona jest zbyt duża");
    return { finalUrl: current.toString(), status: response.status, body: buffer.toString("utf8") };
  }
  throw new Error("Zbyt wiele przekierowań");
}
