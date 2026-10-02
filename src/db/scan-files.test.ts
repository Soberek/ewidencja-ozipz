import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { importScanFile, discardScanFile, readScanFile } from "./scan-files";
import { fallbackBackupBlob, restoreBrowserStorage } from "./backup-storage";

const mocks = vi.hoisted(() => ({ getDatabaseInfo: vi.fn(), getDb: vi.fn() }));
vi.mock("./client", () => mocks);

const asDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});
const asText = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsText(blob);
});

describe("scan file persistence", () => {
  let sqlite: DatabaseSync;
  beforeEach(() => {
    localStorage.clear();
    sqlite = new DatabaseSync(":memory:");
    mocks.getDatabaseInfo.mockResolvedValue({ mode: "tauri-sqlite" });
    mocks.getDb.mockResolvedValue({
      execute: async (sql: string, values: Array<string | number> = []) => {
        const result = sqlite.prepare(sql.replace(/\$\d+/g, "?")).run(...values);
        return { rowsAffected: Number(result.changes), lastInsertId: Number(result.lastInsertRowid) };
      },
      select: async (sql: string, values: Array<string | number> = []) => sqlite.prepare(sql.replace(/\$\d+/g, "?")).all(...values),
    });
  });
  afterEach(() => sqlite.close());

  it("retrieves the saved bytes independently of the selected source File", async () => {
    const source = new File([Uint8Array.from([0, 1, 127, 128, 255])], "scan.pdf", { type: "application/pdf" });
    const path = await importScanFile(source);
    expect(path).toMatch(/^scan:/);
    expect(await asDataUrl(await readScanFile(path))).toBe(await asDataUrl(source));
    await discardScanFile(path);
    await expect(readScanFile(path)).rejects.toThrow("Nie znaleziono");
  });

  it("includes emergency-mode file contents in browser backup and restore", async () => {
    mocks.getDatabaseInfo.mockResolvedValue({ mode: "browser-storage" });
    const source = new File(["%PDF-1.4 saved document"], "scan.pdf", { type: "application/pdf" });
    const path = await importScanFile(source);
    const backup = JSON.parse(await asText(fallbackBackupBlob()));
    localStorage.clear();
    restoreBrowserStorage(backup.entries);
    expect(await asDataUrl(await readScanFile(path))).toBe(await asDataUrl(source));
  });

  it("reports legacy metadata-only entries as missing documents", async () => {
    await expect(readScanFile("/skany/old.pdf")).rejects.toThrow("starszy wpis");
  });

  it("does not report success when emergency storage rejects the file", async () => {
    mocks.getDatabaseInfo.mockResolvedValue({ mode: "browser-storage" });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    try { await expect(importScanFile(new File(["contents"], "scan.pdf"))).rejects.toThrow("Quota exceeded"); }
    finally { write.mockRestore(); }
  });
});
