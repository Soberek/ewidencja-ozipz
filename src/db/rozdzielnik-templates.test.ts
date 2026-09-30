import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import { FallbackDatabaseService } from "./fallback-service";
import { parseRozdzielnikTemplate, type RozdzielnikTemplate } from "../features/ozipz/utils/rozdzielnikTemplates";

function createInMemorySqlite(): ISqlDatabase {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  return {
    async select<T>(sql: string, values: unknown[] = []) {
      return raw.prepare(sql.replace(/\$\d+/g, "?")).all(...values as never[]) as T;
    },
    async execute(sql: string, values: unknown[] = []) {
      if (!values.length) { raw.exec(sql); return { rowsAffected: 0 }; }
      const result = raw.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
      return { rowsAffected: Number(result.changes) };
    },
  };
}

const template = (id: string, name: string): RozdzielnikTemplate => ({
  id,
  name,
  programName: `Program ${name}`,
  items: [{ title: "Ulotka", quantity: 30 }, { title: "Plakat" }],
  updatedAt: "2026-09-30T10:00:00.000Z",
});

describe("szablony rozdzielnika", () => {
  beforeEach(() => localStorage.clear());

  it.each([
    ["SQLite", async () => { const db = createInMemorySqlite(); await initTables(db); return new SqliteDatabaseService(db); }],
    ["tryb awaryjny", async () => new FallbackDatabaseService()],
  ])("zapisuje, nadpisuje i usuwa szablony (%s)", async (_label, create) => {
    const service = await create();
    expect(await service.getRozdzielnikTemplates()).toEqual([]);

    await service.saveRozdzielnikTemplate(template("b", "Zdrowe zęby"));
    await service.saveRozdzielnikTemplate(template("a", "ARS"));
    await service.saveRozdzielnikTemplate({ ...template("b", "Zdrowe zęby"), items: [{ title: "Szczoteczka", quantity: 25 }] });

    const list = await service.getRozdzielnikTemplates();
    expect(list.map((t) => t.name)).toEqual(["ARS", "Zdrowe zęby"]);
    expect(list[1].items).toEqual([{ title: "Szczoteczka", quantity: 25 }]);

    await service.deleteRozdzielnikTemplate("a");
    expect((await service.getRozdzielnikTemplates()).map((t) => t.id)).toEqual(["b"]);
  });

  it("pomija uszkodzone wpisy i niepoprawne ilości", () => {
    expect(parseRozdzielnikTemplate({ id: "x", name: " ", items: [] })).toBeNull();
    expect(parseRozdzielnikTemplate("zły")).toBeNull();
    expect(parseRozdzielnikTemplate({ id: "x", name: "A", items: [{ title: "U", quantity: -3 }, { quantity: 2 }] })).toEqual({
      id: "x",
      name: "A",
      programName: "",
      items: [{ title: "U", quantity: undefined }],
      updatedAt: "",
    });
  });
});
