import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  invoke: vi.fn(async (command: string) => command === "get_database_path" ? "/tmp/ozipz.db" : false),
  execute: vi.fn(async () => ({ rowsAffected: 0 })),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({ save: mocks.save }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/plugin-sql", () => ({ default: { get: () => ({ execute: mocks.execute }) } }));
vi.mock("./sqlite-service", () => ({ SqliteDatabaseService: class {}, initTables: async () => {} }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(window, "__TAURI_INTERNALS__", { value: {}, configurable: true });
});

it("returns cancellation without writing a backup or a timestamp", async () => {
  mocks.save.mockResolvedValue(null);
  const { createDatabaseBackup } = await import("./client");
  expect(await createDatabaseBackup()).toBe(false);
  expect(mocks.invoke).not.toHaveBeenCalledWith("backup_database", expect.anything());
  expect(localStorage.getItem("ozipz_lastBackupAt")).toBeNull();
});

it("includes browser settings before creating a desktop backup", async () => {
  mocks.save.mockResolvedValue("/tmp/backup.db");
  localStorage.setItem("oz.closedMonths", '["2026-09"]');
  const { createDatabaseBackup } = await import("./client");
  expect(await createDatabaseBackup()).toBe(true);
  expect(mocks.execute).toHaveBeenCalledWith(expect.stringContaining("INSERT OR REPLACE INTO ozipz_backup_storage"), [JSON.stringify({ "oz.closedMonths": '["2026-09"]' })]);
  expect(mocks.invoke).toHaveBeenCalledWith("backup_database", { destinationPath: "/tmp/backup.db" });
});
