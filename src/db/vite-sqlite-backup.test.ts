// @vitest-environment node
import { expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { SCHEMA_SQL } from "./sqlite-migrations";
import { viteSqlitePlugin } from "./vite-sqlite-plugin";

it("backs up and restores records and settings, rejects corrupt input, and retains recovery data", async () => {
  const directory = mkdtempSync(join(tmpdir(), "ozipz-backup-"));
  const path = join(directory, "ozipz.db");
  const initial = new DatabaseSync(path);
  initial.exec(SCHEMA_SQL);
  initial.exec("INSERT INTO ozipz_actions(id, title, action_type, date, facility_name, municipality, topic, audience_group, lead_educator, created_at, updated_at) VALUES ('a', 'Original', 'test', '2026-09-09', 'Szkoła', 'Gmina', '', 'Uczniowie', 'Test', '', ''); CREATE TABLE ozipz_backup_storage(id INTEGER, entries TEXT); CREATE TABLE ozipz_backup_files(path TEXT PRIMARY KEY, contents BLOB NOT NULL);");
  initial.prepare("INSERT INTO ozipz_backup_storage VALUES(1, ?)").run(JSON.stringify({ "oz.closedMonths": '["2026-09"]' }));
  initial.prepare("INSERT INTO ozipz_backup_files VALUES(?, ?)").run("Zgłoszenia/2026/test.pdf", Buffer.from([1, 2, 3]));
  initial.close();
  const plugin = viteSqlitePlugin(path);
  let middleware!: (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  let token = "";
  (plugin.configureServer as (server: ViteDevServer) => void)({
    middlewares: { use: (handler: typeof middleware) => { middleware = handler; } },
  } as unknown as ViteDevServer);
  const request = (url: string, method: string, body?: Buffer | Iterable<Buffer>) => new Promise<{ status: number; body: Buffer }>((resolve) => {
    let status = 200;
    const req = Readable.from(body ? Buffer.isBuffer(body) ? [body] : body : []) as unknown as IncomingMessage;
    req.url = url;
    req.method = method;
    req.headers = { host: "127.0.0.1:1421", "x-ozipz-client": "local-app", "x-ozipz-token": token, "x-ozipz-session": "test" };
    Object.defineProperty(req, "socket", { value: { remoteAddress: "127.0.0.1" } });
    middleware(req, {
      setHeader: () => {},
      writeHead: (code: number) => { status = code; },
      end: (result: Buffer | string) => resolve({ status, body: Buffer.from(result) }),
    } as unknown as ServerResponse, () => {});
  });
  function* chunks(body: Buffer): Iterable<Buffer> {
    for (let offset = 0; offset < body.length; offset += 257) yield body.subarray(offset, offset + 257);
  }
  try {
    token = JSON.parse((await request("/api/db/status", "GET")).body.toString()).token;
    const backup = await request("/api/db/backup", "GET");
    expect(backup.status).toBe(200);
    const corrupt = await request("/api/db/restore", "POST", chunks(Buffer.from("SQLite format 3\0broken")));
    expect(corrupt.status).toBe(400);
    expect((await request("/api/db/query", "POST", Buffer.from(JSON.stringify({ query: "SELECT title FROM ozipz_actions" })))).body.toString()).toContain("Original");
    await request("/api/db/execute", "POST", Buffer.from(JSON.stringify({ query: "UPDATE ozipz_actions SET title = 'Changed'" })));
    expect((await request("/api/db/execute", "POST", Buffer.from(JSON.stringify({ query: "BEGIN IMMEDIATE" })))).status).toBe(200);
    expect((await request("/api/db/restore", "POST", chunks(backup.body))).status).toBe(400);
    expect((await request("/api/db/execute", "POST", Buffer.from(JSON.stringify({ query: "ROLLBACK" })))).status).toBe(200);
    expect((await request("/api/db/restore", "POST", chunks(Buffer.from("not a database")))).status).toBe(400);
    expect((await request("/api/db/query", "POST", Buffer.from(JSON.stringify({ query: "SELECT title FROM ozipz_actions" })))).body.toString()).toContain("Changed");
    expect(readdirSync(directory).filter((name) => name.includes("restore-upload"))).toEqual([]);
    expect((await request("/api/db/restore", "POST", chunks(backup.body))).status).toBe(200);
    const restored = new DatabaseSync(path, { readOnly: true });
    expect(restored.prepare("SELECT title FROM ozipz_actions").get()).toEqual({ title: "Original" });
    expect(restored.prepare("SELECT entries FROM ozipz_backup_storage").get()).toEqual({ entries: JSON.stringify({ "oz.closedMonths": '["2026-09"]' }) });
    expect(restored.prepare("SELECT path, hex(contents) AS contents FROM ozipz_backup_files").get())
      .toEqual({ path: "Zgłoszenia/2026/test.pdf", contents: "010203" });
    restored.close();
    expect(readFileSync(`${path}.before-restore`).length).toBeGreaterThan(16);
    expect(readdirSync(directory).filter((name) => name.includes("restore-upload"))).toEqual([]);
  } finally {
    (plugin.closeBundle as () => void)();
    rmSync(directory, { recursive: true, force: true });
  }
});
