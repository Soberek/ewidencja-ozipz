import { afterEach, expect, it, vi } from "vitest";
import { serializeDatabaseService } from "./serialized-service";
import type { IOzipzDatabaseService } from "./types";

afterEach(() => vi.unstubAllGlobals());

it("keeps complete operations together and continues after a rollback", async () => {
  const events: string[] = [];
  const service = serializeDatabaseService({
    async deleteAction() { events.push("BEGIN"); await Promise.resolve(); events.push("ROLLBACK"); throw new Error("fail"); },
    async getActions() { events.push("SELECT"); return []; },
  } as unknown as IOzipzDatabaseService);
  const results = await Promise.allSettled([service.deleteAction("a"), service.getActions()]);
  expect(events).toEqual(["BEGIN", "ROLLBACK", "SELECT"]);
  expect(results.map((result) => result.status)).toEqual(["rejected", "fulfilled"]);
});

it("keeps edits from independent tabs together with Web Locks", async () => {
  const records: string[] = [];
  let held: Promise<unknown> = Promise.resolve();
  const request = vi.fn((name: string, operation: () => Promise<unknown>) => {
    expect(name).toBe("ozipz-browser-storage");
    const result = held.then(operation);
    held = result.catch(() => {});
    return result;
  });
  vi.stubGlobal("navigator", { locks: { request } });

  const backing = {
    async deleteAction(id: string) {
      const snapshot = [...records];
      await Promise.resolve();
      records.splice(0, records.length, ...snapshot, id);
    },
  } as unknown as IOzipzDatabaseService;
  const firstTab = serializeDatabaseService(backing, true);
  const secondTab = serializeDatabaseService(backing, true);
  await Promise.all([firstTab.deleteAction("first"), secondTab.deleteAction("second")]);

  expect(records).toEqual(["first", "second"]);
  expect(request).toHaveBeenCalledTimes(2);
});
