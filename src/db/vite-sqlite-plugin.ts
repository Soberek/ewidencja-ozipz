import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pipeline } from "node:stream/promises";
import { migrateDatabase, staleMigrationBackups } from "./sqlite-migrations";
import { fetchAllowedWebPage } from "./vite-web-fetch";

const isLoopback = (address: string | undefined) =>
  address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";

const isOzipzLanAddress = (address: string | undefined) => {
  const parts = (address || "").replace(/^::ffff:/, "").split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 192 && parts[1] === 168 && parts[2] === 1;
};

const isReadOnlyQuery = (query: string) => /^\s*SELECT\b/i.test(query) ||
  /^\s*PRAGMA\s+(?:user_version|database_list|table_info\s*\(\s*(?:"[^"]+"|\w+)\s*\))\s*;?\s*$/i.test(query);

const MAX_SCAN_FILE_BYTES = 60 * 1024 * 1024;
const MAX_SCAN_REQUEST_BYTES = Math.ceil(MAX_SCAN_FILE_BYTES * 4 / 3) + 4096;
const validScanPath = (value: unknown): value is string =>
  typeof value === "string" && /^scan:[a-zA-Z0-9_-]+$/.test(value);

function validScanDataUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^data:(?:application\/pdf|image\/png|image\/jpeg);base64,([a-zA-Z0-9+/]*={0,2})$/i.exec(value);
  if (!match || match[1].length % 4 !== 0) return false;
  const padding = match[1].endsWith("==") ? 2 : match[1].endsWith("=") ? 1 : 0;
  const decodedBytes = match[1].length / 4 * 3 - padding;
  return decodedBytes > 0 && decodedBytes <= MAX_SCAN_FILE_BYTES;
}

/** Ten sam plik, którego używa zainstalowana aplikacja; OZIPZ_DB_PATH pozwala wskazać inny. */
export const defaultDatabasePath = () =>
  path.resolve(process.env.OZIPZ_DB_PATH?.trim() || path.join(os.homedir(), "Documents", "Ewidencja OZiPZ", "ozipz.db"));

export function viteSqlitePlugin(dbPath = defaultDatabasePath()): Plugin {
  let db: DatabaseSync | null = null;
  let initializing: Promise<DatabaseSync> | null = null;
  const token = randomBytes(32).toString("hex");
  // Urządzenia z sieci LAN muszą znać klucz parowania (wypisywany w konsoli serwera), inaczej każdy w sieci miałby dostęp do bazy.
  const lanKey = process.env.OZIPZ_LAN_KEY?.trim() || randomBytes(9).toString("base64url");
  const expiredSessions = new Set<string>();
  let restoring = false;
  let transactionOwner: string | null = null;
  let transactionTimeout: ReturnType<typeof setTimeout> | undefined;

  function resetDatabase() {
    clearTimeout(transactionTimeout);
    transactionOwner = null;
    if (db) db.close();
    db = null;
    initializing = null;
  }

  function getDatabase(): Promise<DatabaseSync> {
    if (initializing) return initializing;
    initializing = (async () => {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      const connection = new DatabaseSync(dbPath);
      db = connection;
      connection.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
      await migrateDatabase({
        async select<T>(query: string, values: unknown[] = []): Promise<T> {
          return connection.prepare(query.replace(/\$\d+/g, "?")).all(...values as never[]) as T;
        },
        async execute(query: string, values: unknown[] = []) {
          if (values.length) return connection.prepare(query.replace(/\$\d+/g, "?")).run(...values as never[]);
          connection.exec(query);
          return {};
        },
      });
      pruneMigrationBackups();
      return connection;
    })().catch((error) => { resetDatabase(); throw error; });
    return initializing;
  }

  function pruneMigrationBackups() {
    const directory = path.dirname(dbPath);
    for (const name of staleMigrationBackups(fs.readdirSync(directory), path.basename(dbPath))) {
      fs.rmSync(path.join(directory, name), { force: true });
    }
  }

  async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > limit) throw new Error("Przekroczono dopuszczalny rozmiar żądania");
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  }

  async function stageRestoreUpload(req: IncomingMessage): Promise<string> {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const stagedPath = `${dbPath}.restore-upload-${randomBytes(12).toString("hex")}`;
    try {
      await pipeline(req, fs.createWriteStream(stagedPath, { flags: "wx", mode: 0o600 }));
      return stagedPath;
    } catch (error) {
      fs.rmSync(stagedPath, { force: true });
      throw error;
    }
  }

  const matchesSecret = (supplied: unknown, secret: string) =>
    typeof supplied === "string" && Buffer.byteLength(supplied) === Buffer.byteLength(secret) && timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));

  /** "local" – ten komputer, "lan" – urządzenie z sieci 192.168.1.x z kluczem parowania, "lan-key" – brak lub zły klucz. */
  function authorize(req: IncomingMessage, statusRequest: boolean): "local" | "lan" | "lan-key" | null {
    let target: URL;
    try { target = new URL(`http://${req.headers.host}`); } catch { return null; }
    const local = isLoopback(req.socket?.remoteAddress) && ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
    const lan = target.port === "1421" && isOzipzLanAddress(target.hostname) && isOzipzLanAddress(req.socket?.remoteAddress);
    if (!local && !lan) return null;
    if (req.headers["x-ozipz-client"] !== "local-app") return null;
    if (req.headers["sec-fetch-site"] && !["same-origin", "none"].includes(String(req.headers["sec-fetch-site"]))) return null;
    if (req.headers.origin && req.headers.origin !== target.origin) return null;
    if (!local && !matchesSecret(req.headers["x-ozipz-lan-key"], lanKey)) return "lan-key";
    const scope = local ? "local" : "lan";
    if (statusRequest) return scope;
    const supplied = req.headers["x-ozipz-token"];
    return typeof supplied === "string" && /^[a-f0-9]{64}$/.test(supplied) && matchesSecret(supplied, token) ? scope : null;
  }

  async function handleWebFetch(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const reply = (status: number, value: unknown) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    if (req.method !== "POST" || !["local", "lan"].includes(authorize(req, false) ?? "")) {
      reply(403, { error: "Pobieranie stron jest dozwolone wyłącznie z lokalnej aplikacji." });
      return;
    }
    try {
      const data = JSON.parse((await readBody(req, 16 * 1024)).toString());
      reply(200, await fetchAllowedWebPage(data.url, data.headOnly === true));
    } catch (error) {
      reply(502, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async function handleHttp(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const url = req.url?.split("?")[0] || "";
    if (url === "/api/web/fetch") { await handleWebFetch(req, res); return; }
    if (!url.startsWith("/api/db")) { next(); return; }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const reply = (status: number, value: unknown) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    const scope = authorize(req, url === "/api/db/status" && req.method === "GET");
    if (scope === "lan-key") {
      reply(403, { error: "Brak klucza dostępu LAN. Otwórz aplikację adresem z kluczem wypisanym w konsoli serwera (…?klucz=…)." });
      return;
    }
    if (!scope) {
      reply(403, { error: "Dostęp do bazy jest dozwolony wyłącznie z lokalnej aplikacji." });
      return;
    }
    if (url === "/api/db/restore" && scope !== "local") {
      reply(403, { error: "Przywracanie kopii bazy jest możliwe tylko na komputerze, na którym działa serwer." });
      return;
    }
    if (url === "/api/db/status" && req.method === "GET") {
      reply(200, { ok: true, file: "ozipz.db", exists: fs.existsSync(dbPath), path: dbPath, token });
      return;
    }
    const session = req.headers["x-ozipz-session"];
    if (typeof session !== "string" || !session) { reply(400, { error: "Brak identyfikatora sesji" }); return; }
    let stagedRestorePath: string | null = null;
    try {
      // Read the body before checking ownership: another request may start a transaction while it arrives.
      const bodyLimit = url === "/api/db/scan-file" ? MAX_SCAN_REQUEST_BYTES : 2 * 1024 * 1024;
      let body: Buffer = Buffer.alloc(0);
      if (req.method === "POST") {
        if (url === "/api/db/restore") stagedRestorePath = await stageRestoreUpload(req);
        else body = await readBody(req, bodyLimit);
      }
      const database = await getDatabase();
      if (restoring) { reply(409, { error: "Trwa przywracanie kopii bazy. Poczekaj na zakończenie." }); return; }
      if (expiredSessions.has(session)) {
        const rollback = url === "/api/db/execute" && /^\s*ROLLBACK\s*;?\s*$/i.test(JSON.parse(body.toString()).query || "");
        if (rollback) {
          expiredSessions.delete(session);
          reply(200, { rowsAffected: 0 });
        } else {
          reply(409, { error: "Przekroczono czas zapisu. Transakcja została wycofana. Ponów operację." });
        }
        return;
      }
      if (transactionOwner && transactionOwner !== session) {
        reply(409, { error: "Trwa zapis w innej karcie. Ponów operację po jego zakończeniu." }); return;
      }
      if (url === "/api/db/scan-file" && req.method === "POST") {
        const data = JSON.parse(body.toString());
        if (!validScanPath(data?.path) || !validScanDataUrl(data?.dataUrl)) {
          throw new Error("Nieprawidłowy plik skanu lub jego ścieżka");
        }
        database.exec("CREATE TABLE IF NOT EXISTS ozipz_scan_files (path TEXT PRIMARY KEY, data_url TEXT NOT NULL)");
        database.prepare("INSERT INTO ozipz_scan_files (path, data_url) VALUES (?, ?)").run(data.path, data.dataUrl);
        reply(200, { ok: true });
        return;
      }
      if (url === "/api/db/backup" && req.method === "GET") {
        if (transactionOwner) throw new Error("Zakończ zapis przed wykonaniem kopii");
        const snapshotPath = `${dbPath}.backup-pending`;
        try {
          fs.rmSync(snapshotPath, { force: true });
          database.prepare("VACUUM INTO ?").run(snapshotPath);
          const backup = fs.readFileSync(snapshotPath);
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Content-Disposition", "attachment; filename=ozipz-backup.db");
          res.writeHead(200); res.end(backup);
        } finally { fs.rmSync(snapshotPath, { force: true }); }
        return;
      }
      if (url === "/api/db/restore" && req.method === "POST") {
        if (transactionOwner) throw new Error("Zakończ zapis przed odtworzeniem kopii");
        const stagedPath = stagedRestorePath;
        if (!stagedPath) throw new Error("Nie odebrano pliku kopii bazy danych");
        const header = Buffer.alloc(16);
        const file = fs.openSync(stagedPath, "r");
        try { fs.readSync(file, header, 0, header.length, 0); } finally { fs.closeSync(file); }
        if (!header.equals(Buffer.from("SQLite format 3\0"))) throw new Error("Wybrany plik nie jest prawidłową bazą SQLite");
        restoring = true;
        try {
        const validationDb = new DatabaseSync(stagedPath);
        try {
          const integrity = validationDb.prepare("PRAGMA integrity_check").all();
          if (integrity.length !== 1 || integrity[0]?.integrity_check !== "ok") throw new Error("Kontrola integralności wybranej bazy nie powiodła się");
          validationDb.prepare("SELECT id, title, date FROM ozipz_actions LIMIT 0").all();
          await migrateDatabase({
            async select<T>(sql: string): Promise<T> { return validationDb.prepare(sql).all() as T; },
            async execute(sql: string, values: unknown[] = []) {
              if (values.length) return validationDb.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
              validationDb.exec(sql);
              return {};
            },
          });
          if (validationDb.prepare("PRAGMA foreign_key_check").all().length) throw new Error("Kopia zawiera nieprawidłowe powiązania danych");
        } finally { validationDb.close(); }
        // VACUUM captures committed WAL contents even if another reader is connected.
        const previousPath = `${dbPath}.before-restore`;
        fs.rmSync(previousPath, { force: true });
        database.prepare("VACUUM INTO ?").run(previousPath);
        resetDatabase();
        fs.renameSync(stagedPath, dbPath);
        stagedRestorePath = null;
        fs.rmSync(`${dbPath}-wal`, { force: true });
        fs.rmSync(`${dbPath}-shm`, { force: true });
        reply(200, { ok: true }); return;
        } finally { restoring = false; }
      }
      if (["/api/db/query", "/api/db/execute"].includes(url) && req.method === "POST") {
        const data = JSON.parse(body.toString());
        const query = typeof data.query === "string" ? data.query : "";
        if (!query.trim()) throw new Error("Brak parametru query");
        const params = Array.isArray(data.params) ? data.params : [];
        const normalized = query.replace(/\$\d+/g, "?");
        if (url === "/api/db/query") {
          if (!isReadOnlyQuery(query)) throw new Error("Zapytanie odczytu nie może zmieniać bazy danych");
          reply(200, database.prepare(normalized).all(...params));
        } else {
          const result = params.length ? database.prepare(normalized).run(...params) : (database.exec(query), null);
          if (/^\s*BEGIN\b/i.test(query)) {
            transactionOwner = session;
            clearTimeout(transactionTimeout);
            transactionTimeout = setTimeout(() => {
              expiredSessions.add(session);
              try { db?.exec("ROLLBACK"); } catch { /* Connection may already be closed. */ } finally { transactionOwner = null; }
            }, 30_000);
            transactionTimeout.unref?.();
          }
          if (/^\s*(COMMIT|ROLLBACK)\b/i.test(query)) {
            transactionOwner = null;
            clearTimeout(transactionTimeout);
          }
          reply(200, { rowsAffected: Number(result?.changes ?? 0), lastInsertId: Number(result?.lastInsertRowid ?? 0) });
        }
        return;
      }
      if (url === "/api/db/checkpoint" && req.method === "POST") {
        database.exec("PRAGMA wal_checkpoint(TRUNCATE)"); reply(200, { ok: true }); return;
      }
      reply(404, { error: "Nieznany endpoint bazy danych" });
    } catch (error) {
      reply(400, { error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (stagedRestorePath) fs.rmSync(stagedRestorePath, { force: true });
    }
  }

  return {
    name: "vite-sqlite-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => { void handleHttp(req, res, next); });
      server.httpServer?.once("close", resetDatabase);
      server.httpServer?.once("listening", () => {
        const host = server.config?.server?.host;
        if (host === true || host === "0.0.0.0") {
          server.config.logger.info(`  Dostęp z sieci LAN: dopisz do adresu ?klucz=${lanKey} (stały klucz: zmienna OZIPZ_LAN_KEY)`);
        }
      });
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use((req, res, next) => { void handleHttp(req, res, next); });
      server.httpServer?.once("close", resetDatabase);
    },
    closeBundle: resetDatabase,
  };
}
