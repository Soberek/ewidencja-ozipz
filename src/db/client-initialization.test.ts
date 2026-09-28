import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ init: vi.fn(), fallback: vi.fn(), invoke: vi.fn(), records: [] as string[] }));
vi.mock("./sqlite-service", () => ({ SqliteDatabaseService: class {}, initTables: mocks.init }));
vi.mock("./fallback-service", () => ({ FallbackDatabaseService: class {
  constructor() { mocks.fallback(); }
  async addAction(action: { id: string }) {
    const snapshot = [...mocks.records];
    await Promise.resolve();
    mocks.records = [...snapshot, action.id];
  }
} }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  localStorage.clear();
  mocks.records = [];
});
afterEach(() => vi.unstubAllGlobals());

it("serializes concurrent edits in browser storage", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  const request = vi.fn(async (_name: string, operation: () => Promise<unknown>) => operation());
  vi.stubGlobal("navigator", { locks: { request } });
  const { getDatabaseService } = await import("./client");
  const service = await getDatabaseService();
  await Promise.all([service.addAction({ id: "first" } as never), service.addAction({ id: "second" } as never)]);
  expect(mocks.records).toEqual(["first", "second"]);
  expect(request).toHaveBeenCalledTimes(2);
});

it("keeps one-tab edits available and warns when Web Locks are unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  vi.stubGlobal("navigator", {});
  const { getDatabaseService, getDatabaseInfo } = await import("./client");
  const service = await getDatabaseService();
  await Promise.all([service.addAction({ id: "first" } as never), service.addAction({ id: "second" } as never)]);
  expect(mocks.records).toEqual(["first", "second"]);
  expect((await getDatabaseInfo()).detail).toContain("jednej karcie");
});

it("restores a browser backup under the same Web Lock", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  const request = vi.fn(async (_name: string, operation: () => void) => operation());
  vi.stubGlobal("navigator", { locks: { request } });
  const { restoreDatabaseBackup } = await import("./client");
  const backup = { text: async () => JSON.stringify({ format: "ozipz-localstorage-v1", entries: { ozipz_actions: "[]" } }) } as File;
  await expect(restoreDatabaseBackup(backup)).resolves.toBe("reload");
  expect(request).toHaveBeenCalledWith("ozipz-browser-storage", expect.any(Function));
  expect(localStorage.getItem("ozipz_actions")).toBe("[]");
});

it("surfaces an HTTP database migration failure and retries without switching storage", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, token: "token", path: "/tmp/test.db" }) });
  vi.stubGlobal("fetch", fetchMock);
  mocks.init.mockRejectedValueOnce(new Error("Nieprawidłowe powiązania"));
  const { getDatabaseService } = await import("./client");
  await expect(getDatabaseService()).rejects.toThrow("Nieprawidłowe powiązania");
  expect(mocks.fallback).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledWith("/api/db/status", expect.objectContaining({ headers: expect.objectContaining({ "X-Ozipz-Client": "local-app" }) }));
  await expect(getDatabaseService()).resolves.toBeDefined();
});

it("does not silently substitute browser storage after an access denial", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => { throw new SyntaxError("Invalid JSON"); } }));
  const { getDatabaseService } = await import("./client");
  await expect(getDatabaseService()).rejects.toThrow("dostępu");
  expect(mocks.fallback).not.toHaveBeenCalled();
});

it("shows the server's reason when database access from another computer is denied", async () => {
  const message = "Dostęp do bazy jest dozwolony wyłącznie z lokalnej aplikacji.";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: message }) }));
  const { getDatabaseService } = await import("./client");
  await expect(getDatabaseService()).rejects.toThrow(`HTTP 403: ${message}`);
  expect(mocks.fallback).not.toHaveBeenCalled();
});

it("surfaces desktop connection errors instead of opening another data store", async () => {
  Object.defineProperty(window, "__TAURI_INTERNALS__", { value: {}, configurable: true });
  mocks.invoke.mockImplementation(async (command: string) => {
    if (command === "get_database_path") return "/tmp/test.db";
    throw new Error("Baza niedostępna");
  });
  const { getDatabaseService } = await import("./client");
  await expect(getDatabaseService()).rejects.toThrow("Baza niedostępna");
  expect(mocks.fallback).not.toHaveBeenCalled();
});

it("initializes successfully in insecure contexts where crypto.randomUUID is undefined", async () => {
  const originalCrypto = globalThis.crypto;
  try {
    // Simulate non-secure context (e.g. HTTP over LAN) where crypto.randomUUID is missing
    Object.defineProperty(globalThis, "crypto", {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
          return arr;
        },
      },
      configurable: true,
      writable: true,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, token: "token", path: "/tmp/test.db" }) }));
    const { getDatabaseService } = await import("./client");
    await expect(getDatabaseService()).resolves.toBeDefined();
  } finally {
    Object.defineProperty(globalThis, "crypto", { value: originalCrypto, configurable: true, writable: true });
  }
});
