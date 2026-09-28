import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectBrowserStorage, restoreBrowserStorage, embedBrowserStorage, restoreEmbeddedStorage } from "./backup-storage";
import type { ISqlDatabase } from "./types";

describe("complete backup storage", () => {
  beforeEach(() => localStorage.clear());

  it("round trips reporting plans, month locks and raw text preferences", () => {
    localStorage.setItem("oz.closedMonths", '["2026-09"]');
    localStorage.setItem("oz.reconciliation.2026", '{"9":{"progDz":10}}');
    localStorage.setItem("ozipz_metric_plan_2026", '{"razemDzialania":123}');
    localStorage.setItem("ozipz_theme", "dark");
    localStorage.setItem("unrelated", "keep");
    const entries = collectBrowserStorage();
    localStorage.setItem("oz.closedMonths", "[]");
    localStorage.setItem("oz.miernikPlan.2027", "{}");
    restoreBrowserStorage(entries);
    expect(collectBrowserStorage()).toEqual(entries);
    expect(localStorage.getItem("unrelated")).toBe("keep");
    expect(localStorage.getItem("oz.miernikPlan.2027")).toBeNull();
  });

  it("rejects unowned keys before changing anything", () => {
    localStorage.setItem("ozipz_actions", "[]");
    expect(() => restoreBrowserStorage({ unrelated: "bad" })).toThrow();
    expect(localStorage.getItem("ozipz_actions")).toBe("[]");
  });

  it("rejects corrupt collection payloads before replacing existing storage", () => {
    localStorage.setItem("ozipz_actions", "[]");
    expect(() => restoreBrowserStorage({ "ozipz_actions": "{broken" })).toThrow();
    expect(() => restoreBrowserStorage({ "ozipz_actions": "null" })).toThrow();
    expect(localStorage.getItem("ozipz_actions")).toBe("[]");
  });

  it("rolls back when restoring storage fails", () => {
    localStorage.setItem("oz.closedMonths", '["2026-09"]');
    const original = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("full"); });
    spy.mockImplementation(function (this: Storage, key, value) { original.call(this, key, value); });
    expect(() => restoreBrowserStorage({ "ozipz_theme": "dark" })).toThrow("full");
    expect(localStorage.getItem("oz.closedMonths")).toBe('["2026-09"]');
    spy.mockRestore();
  });

  it("embeds settings into SQLite and restores them from the same backup", async () => {
    let serialized = "";
    const db: ISqlDatabase = {
      execute: vi.fn(async (_query, params) => { if (params) serialized = String(params[0]); return { rowsAffected: 1 }; }),
      select: vi.fn(async (query) => query.includes("sqlite_master") ? [{ name: "ozipz_backup_storage" }] : [{ entries: serialized }]) as ISqlDatabase["select"],
    };
    localStorage.setItem("oz.reconciliation.2026", '{"9":{}}');
    await embedBrowserStorage(db);
    localStorage.clear();
    await restoreEmbeddedStorage(db);
    expect(localStorage.getItem("oz.reconciliation.2026")).toBe('{"9":{}}');
  });
});
