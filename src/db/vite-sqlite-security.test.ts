// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { viteSqlitePlugin } from "./vite-sqlite-plugin";

const cleanup: Array<() => void> = [];
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); cleanup.splice(0).reverse().forEach((fn) => fn()); });
function setup() {
  const directory = mkdtempSync(join(tmpdir(), "ozipz-http-"));
  cleanup.push(() => rmSync(directory, { recursive: true, force: true }));
  const plugin = viteSqlitePlugin(join(directory, "ozipz.db"));
  cleanup.push(() => (plugin.closeBundle as () => void)());
  let middleware!: (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  (plugin.configureServer as (server: ViteDevServer) => void)({ middlewares: { use: (handler: typeof middleware) => { middleware = handler; } } } as unknown as ViteDevServer);
  let token = "";
  const request = (url: string, options: { query?: string; session?: string; address?: string; headers?: Record<string, string>; method?: string } = {}) => new Promise<{ status: number; data: unknown }>((resolve) => {
    const body = options.query ? Buffer.from(JSON.stringify({ query: options.query })) : null;
    const req = Readable.from(body ? [body] : []) as unknown as IncomingMessage;
    req.url = url; req.method = options.method || (body ? "POST" : "GET");
    req.headers = { host: "127.0.0.1:1421", "x-ozipz-client": "local-app", "x-ozipz-token": token, "x-ozipz-session": options.session || "one", ...options.headers };
    Object.defineProperty(req, "socket", { value: { remoteAddress: options.address || "127.0.0.1" } });
    let status = 200;
    middleware(req, { setHeader: () => {}, writeHead: (value: number) => { status = value; }, end: (value: string) => resolve({ status, data: JSON.parse(value) }) } as unknown as ServerResponse, () => resolve({ status: 404, data: null }));
  });
  return { request, async authorize() { const result = await request("/api/db/status"); token = (result.data as { token: string }).token; } };
}

it("rejects LAN, foreign origins, DNS rebinding, missing credentials and cross-site requests", async () => {
  const { request, authorize } = setup();
  expect((await request("/api/db/status", { address: "192.168.1.10" })).status).toBe(403);
  expect((await request("/api/db/status", { headers: { host: "attacker.example:1421" } })).status).toBe(403);
  expect((await request("/api/db/status", { headers: { origin: "https://attacker.example" } })).status).toBe(403);
  expect((await request("/api/db/status", { headers: { "sec-fetch-site": "cross-site" } })).status).toBe(403);
  expect((await request("/api/db/status", { headers: { "x-ozipz-client": "" } })).status).toBe(403);
  expect((await request("/api/db/execute", { query: "DROP TABLE ozipz_actions" })).status).toBe(403);
  await authorize();
  expect((await request("/api/db/query", { query: "SELECT COUNT(*) AS n FROM ozipz_actions" })).status).toBe(200);
  expect((await request("/api/db/backup", { headers: { "x-ozipz-token": "ą".repeat(64) } })).status).toBe(403);
});

it("prevents a second tab from reading, committing or joining an active transaction", async () => {
  const { request, authorize } = setup(); await authorize();
  expect((await request("/api/db/execute", { query: "CREATE TABLE probe(value TEXT)" })).status).toBe(200);
  expect((await request("/api/db/execute", { query: "BEGIN IMMEDIATE" })).status).toBe(200);
  expect((await request("/api/db/execute", { query: "INSERT INTO probe VALUES('pending')" })).status).toBe(200);
  for (const query of ["COMMIT", "INSERT INTO probe VALUES('other')"]) expect((await request("/api/db/execute", { query, session: "two" })).status).toBe(409);
  expect((await request("/api/db/query", { query: "SELECT * FROM probe", session: "two" })).status).toBe(409);
  expect((await request("/api/db/execute", { query: "ROLLBACK" })).status).toBe(200);
  expect((await request("/api/db/query", { query: "SELECT * FROM probe", session: "two" })).data).toEqual([]);
  expect((await request("/api/db/execute", { query: "BEGIN IMMEDIATE", session: "two" })).status).toBe(200);
  expect((await request("/api/db/execute", { query: "COMMIT", session: "two" })).status).toBe(200);
});

it("rejects late writes after transaction timeout until the caller acknowledges rollback", async () => {
  const { request, authorize } = setup(); await authorize();
  await request("/api/db/execute", { query: "CREATE TABLE probe(value TEXT)" });
  vi.useFakeTimers();
  await request("/api/db/execute", { query: "BEGIN IMMEDIATE" });
  await request("/api/db/execute", { query: "INSERT INTO probe VALUES('pending')" });
  vi.advanceTimersByTime(30_001);
  expect((await request("/api/db/execute", { query: "INSERT INTO probe VALUES('late')" })).status).toBe(409);
  expect((await request("/api/db/execute", { query: "COMMIT" })).status).toBe(409);
  expect((await request("/api/db/execute", { query: "ROLLBACK" })).status).toBe(200);
  expect((await request("/api/db/query", { query: "SELECT * FROM probe" })).data).toEqual([]);
});

it("allows every 192.168.1.x address while rejecting other networks and foreign origins", async () => {
  vi.stubEnv("OZIPZ_LAN_KEY", "test-lan-key");
  const { request } = setup();
  const options = { address: "192.168.1.20", headers: { host: "192.168.1.117:1421", origin: "http://192.168.1.117:1421", "sec-fetch-site": "same-origin", "x-ozipz-lan-key": "test-lan-key" } };
  const status = await request("/api/db/status", options);
  expect(status.status).toBe(200);
  const token = (status.data as { token: string }).token;
  expect((await request("/api/db/query", { ...options, query: "SELECT 1 AS n", headers: { ...options.headers, "x-ozipz-token": token } })).data).toEqual([{ n: 1 }]);
  expect((await request("/api/db/query", { ...options, query: "SELECT 1" })).status).toBe(403);
  expect((await request("/api/db/status", { ...options, headers: { ...options.headers, host: "192.168.1.4:1421", origin: "http://192.168.1.4:1421" } })).status).toBe(200);
  const rejectedHeaders: Record<string, string>[] = [{ host: "192.168.2.118:1421" }, { host: "192.168.1.118:3000" }, { host: "attacker.example:1421" }, { origin: "http://attacker.example" }, { "sec-fetch-site": "cross-site" }, { "x-ozipz-client": "" }];
  for (const headers of rejectedHeaders) {
    expect((await request("/api/db/status", { ...options, headers: { ...options.headers, ...headers } })).status).toBe(403);
  }
  expect((await request("/api/db/status", { ...options, address: "8.8.8.8" })).status).toBe(403);
  expect((await request("/api/db/status", { ...options, address: "192.168.2.20" })).status).toBe(403);
  expect((await request("/api/db/status", { ...options, address: "::ffff:192.168.1.20" })).status).toBe(200);
});

it("requires the LAN pairing key and keeps database restore local-only", async () => {
  vi.stubEnv("OZIPZ_LAN_KEY", "test-lan-key");
  const { request } = setup();
  const headers = { host: "192.168.1.117:1421", origin: "http://192.168.1.117:1421", "sec-fetch-site": "same-origin" };
  const options = { address: "192.168.1.20", headers: { ...headers, "x-ozipz-lan-key": "test-lan-key" } };
  for (const key of [undefined, "", "wrong-lan-key", "test-lan-ke"]) {
    const response = await request("/api/db/status", { address: "192.168.1.20", headers: key === undefined ? headers : { ...headers, "x-ozipz-lan-key": key } });
    expect(response.status).toBe(403);
    expect(String((response.data as { error: string }).error)).toContain("klucza dostępu LAN");
  }
  const token = ((await request("/api/db/status", options)).data as { token: string }).token;
  const restore = await request("/api/db/restore", { ...options, method: "POST", headers: { ...options.headers, "x-ozipz-token": token } });
  expect(restore.status).toBe(403);
  expect(String((restore.data as { error: string }).error)).toContain("tylko na komputerze");
});
