import type { ISqlDatabase, ISqlQueryResult } from "./types";

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        Number(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
      ).toString(16)
    );
  }
  return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

let httpToken = "";
const httpSession = generateSessionId();

export function setHttpToken(token: string): void {
  httpToken = token;
}

let lanKey: string | undefined;

/** Klucz parowania LAN: z adresu (?klucz=…) zapamiętywany w przeglądarce, a z paska adresu usuwany. */
function getLanKey(): string {
  if (lanKey !== undefined) return lanKey;
  lanKey = "";
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("klucz")?.trim();
    if (fromUrl) {
      localStorage.setItem("oz.lanKey", fromUrl);
      url.searchParams.delete("klucz");
      window.history.replaceState(window.history.state, "", url);
      lanKey = fromUrl;
    } else {
      lanKey = localStorage.getItem("oz.lanKey") || "";
    }
  } catch { /* Brak window/localStorage: klucz nie jest potrzebny na tym komputerze. */ }
  return lanKey;
}

export const httpHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "X-Ozipz-Client": "local-app",
    "X-Ozipz-Token": httpToken,
    "X-Ozipz-Session": httpSession,
  };
  const key = getLanKey();
  if (key) headers["X-Ozipz-Lan-Key"] = key;
  return headers;
};

export class HttpSqlDatabase implements ISqlDatabase {
  async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
    const res = await fetch("/api/db/query", {
      method: "POST",
      headers: { ...httpHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ query, params: bindValues || [] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Błąd zapytania HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async execute(query: string, bindValues?: unknown[]): Promise<ISqlQueryResult> {
    const res = await fetch("/api/db/execute", {
      method: "POST",
      headers: { ...httpHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ query, params: bindValues || [] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Błąd wykonania HTTP ${res.status}`);
    }
    return await res.json();
  }
}
