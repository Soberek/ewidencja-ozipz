import type { ISqlDatabase } from "./types";
import { getDatabaseInfo, getDb } from "./client";
import { HttpSqlDatabase, httpHeaders } from "./http-database";
import { generateId } from "./repositories/id-generator";

const storageKey = (path: string) => `ozipz_scan_file_${path.slice(5)}`;
const validPath = (path: string) => /^scan:[a-zA-Z0-9_-]+$/.test(path);
const MAX_SCAN_FILE_BYTES = 60 * 1024 * 1024;

function scanMime(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expected = extension === "pdf" ? "application/pdf"
    : extension === "png" ? "image/png"
    : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : null;
  if (!expected || (file.type && file.type !== "application/octet-stream" && file.type.toLowerCase() !== expected)) {
    throw new Error("Wybierz plik PDF, PNG lub JPG");
  }
  return expected;
}

async function fileDatabase(): Promise<ISqlDatabase | null> {
  const { mode } = await getDatabaseInfo();
  if (mode === "browser-storage") return null;
  const db = mode === "http-sqlite" ? new HttpSqlDatabase() : await getDb();
  if (!db) throw new Error("Brak połączenia z bazą danych");
  // File contents are kept outside the audited domain tables, like backup settings.
  // SQLite snapshots include this table, so scans remain available after restore.
  await db.execute("CREATE TABLE IF NOT EXISTS ozipz_scan_files (path TEXT PRIMARY KEY, data_url TEXT NOT NULL)");
  return db;
}

function dataUrlFor(file: File, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !/^data:[^,]*;base64,/.test(reader.result)) {
        reject(new Error("Nie udało się odczytać pliku skanu"));
        return;
      }
      resolve(`data:${mime};base64,${reader.result.slice(reader.result.indexOf(",") + 1)}`);
    };
    reader.onerror = () => reject(reader.error || new Error("Nie udało się odczytać pliku skanu"));
    reader.readAsDataURL(file);
  });
}

/** Saves the actual file before its archive record is added. Failed record saves discard it. */
export async function importScanFile(file: File): Promise<string> {
  if (file.size > MAX_SCAN_FILE_BYTES) throw new Error("Plik skanu przekracza limit 60 MiB");
  const mime = scanMime(file);
  const path = `scan:${generateId("file")}`;
  const dataUrl = await dataUrlFor(file, mime);
  if ((await getDatabaseInfo()).mode === "http-sqlite") {
    const response = await fetch("/api/db/scan-file", {
      method: "POST",
      headers: { ...httpHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ path, dataUrl }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Nie udało się zapisać skanu (HTTP ${response.status})`);
    }
    return path;
  }
  const db = await fileDatabase();
  if (db) await db.execute("INSERT INTO ozipz_scan_files (path, data_url) VALUES ($1, $2)", [path, dataUrl]);
  else localStorage.setItem(storageKey(path), dataUrl);
  return path;
}

// Successful records retain their file after deletion so the history can restore them.
// Only an import whose record failed to save should be discarded.
export async function discardScanFile(path: string): Promise<void> {
  if (!validPath(path)) throw new Error("Nieprawidłowa ścieżka pliku skanu");
  const db = await fileDatabase();
  if (db) await db.execute("DELETE FROM ozipz_scan_files WHERE path = $1", [path]);
  else localStorage.removeItem(storageKey(path));
}

export async function readScanFile(path: string): Promise<Blob> {
  if (!validPath(path)) throw new Error("Ten starszy wpis nie zawiera zapisanej kopii pliku. Dodaj dokument ponownie do archiwum.");
  const db = await fileDatabase();
  const dataUrl = db
    ? (await db.select<Array<{ data_url: string }>>("SELECT data_url FROM ozipz_scan_files WHERE path = $1", [path]))[0]?.data_url
    : localStorage.getItem(storageKey(path));
  if (!dataUrl) throw new Error("Nie znaleziono zapisanej kopii pliku skanu");
  const match = /^data:([^;,]*)(?:;[^,]*)?;base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Zapisany plik skanu jest nieprawidłowy");
  const binary = atob(match[2]);
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: match[1] || "application/octet-stream" });
}
