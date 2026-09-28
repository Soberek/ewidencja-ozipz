import type { ISqlDatabase } from "./types";

export const isOwnedStorageKey = (key: string) => key.startsWith("ozipz_") || key.startsWith("oz.");
const collectionKeys = new Set(["actions", "programs", "participations", "facilities", "materials", "distributions", "schedules", "jrwaCases", "dictionaries", "letters", "scans", "templates", "staff", "contacts", "publications", "registers", "monthly_targets"].map((key) => `ozipz_${key}`));

export function collectBrowserStorage(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isOwnedStorageKey(key)) entries[key] = localStorage.getItem(key)!;
  }
  return entries;
}

export function validateBrowserStorage(value: unknown): asserts value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Nieprawidłowe dane kopii zapasowej");
  for (const [key, entry] of Object.entries(value)) {
    if (!isOwnedStorageKey(key) || typeof entry !== "string") throw new Error("Kopia zawiera niedozwolony wpis danych");
    if (collectionKeys.has(key) && !Array.isArray(JSON.parse(entry))) throw new Error(`Nieprawidłowa kolekcja w kopii: ${key}`);
  }
}

export function restoreBrowserStorage(entries: Record<string, string>): void {
  validateBrowserStorage(entries);
  const previous = collectBrowserStorage();
  try {
    Object.keys(previous).forEach((key) => localStorage.removeItem(key));
    Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
  } catch (error) {
    Object.keys(entries).forEach((key) => localStorage.removeItem(key));
    Object.entries(previous).forEach(([key, value]) => localStorage.setItem(key, value));
    throw error;
  }
}

export async function embedBrowserStorage(db: ISqlDatabase): Promise<void> {
  await db.execute("CREATE TABLE IF NOT EXISTS ozipz_backup_storage (id INTEGER PRIMARY KEY, entries TEXT NOT NULL)");
  await db.execute("INSERT OR REPLACE INTO ozipz_backup_storage (id, entries) VALUES (1, $1)", [JSON.stringify(collectBrowserStorage())]);
}

export async function restoreEmbeddedStorage(db: ISqlDatabase): Promise<void> {
  const tables = await db.select<Array<{ name: string }>>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ozipz_backup_storage'");
  if (!tables.length) return; // Older SQLite backups contain database records only.
  const rows = await db.select<Array<{ entries: string }>>("SELECT entries FROM ozipz_backup_storage WHERE id = 1");
  if (rows.length) restoreBrowserStorage(JSON.parse(rows[0].entries));
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fallbackBackupBlob(): Blob {
  const entries = collectBrowserStorage();
  return new Blob([JSON.stringify({ format: "ozipz-localstorage-v1", entries }, null, 2)], {
    type: "application/json",
  });
}

