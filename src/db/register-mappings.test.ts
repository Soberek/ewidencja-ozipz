import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { ISqlDatabase, ISqlQueryResult } from "./types";
import { SqliteDictionariesRepository } from "./repositories/sqlite/sqlite-dictionaries.repository";
import { FallbackDictionariesRepository } from "./repositories/fallback/fallback-dictionaries.repository";

function sqliteAdapter(raw: DatabaseSync, failSecondUpdate: () => boolean): ISqlDatabase {
  return {
    async select<T>(query: string, values: unknown[] = []): Promise<T> {
      return raw.prepare(query.replace(/\$\d+/g, "?")).all(...values as []) as T;
    },
    async execute(query: string, values: unknown[] = []): Promise<ISqlQueryResult> {
      if (failSecondUpdate() && query.startsWith("UPDATE ozipz_dictionaries") && values[2] === "b") {
        throw new Error("write failed");
      }
      if (!values.length) {
        raw.exec(query);
        return { rowsAffected: 0 };
      }
      const result = raw.prepare(query.replace(/\$\d+/g, "?")).run(...values as []);
      return { rowsAffected: Number(result.changes) };
    },
  };
}

describe("atomic register mappings", () => {
  it("rolls back the entire SQLite mapping save when a later write fails", async () => {
    const raw = new DatabaseSync(":memory:");
    try {
      raw.exec("CREATE TABLE ozipz_dictionaries (id TEXT PRIMARY KEY, dict_type TEXT, code TEXT, label TEXT, description TEXT, postal_code TEXT, kind TEXT, gis_category TEXT, is_system INTEGER, created_at TEXT, updated_at TEXT)");
      raw.exec("INSERT INTO ozipz_dictionaries (id, dict_type, code, label, description, is_system, created_at, updated_at) VALUES ('a', 'register_mapping', 'A', 'A', '[\"informacje\"]', 0, '', ''), ('b', 'register_mapping', 'B', 'B', '[\"publikacje\"]', 0, '', '')");
      let fail = true;
      const repo = new SqliteDictionariesRepository(sqliteAdapter(raw, () => fail));
      const mappings = [{ activityType: "A", registers: [] }, { activityType: "B", registers: [] }];
      await expect(repo.saveRegisterMappings(mappings)).rejects.toThrow("write failed");
      expect(raw.prepare("SELECT description FROM ozipz_dictionaries WHERE id = 'a'").get()).toMatchObject({ description: '["informacje"]' });
      fail = false;
      const saved = await repo.saveRegisterMappings(mappings);
      expect(saved.filter((item) => item.dictType === "register_mapping").map((item) => item.description)).toEqual(["[]", "[]"]);
    } finally {
      raw.close();
    }
  });

  it("saves browser mappings as one collection update", async () => {
    localStorage.clear();
    const repo = new FallbackDictionariesRepository();
    const saved = await repo.saveRegisterMappings([
      { activityType: "Prelekcja", registers: [] },
      { activityType: "Publikacja", registers: ["publikacje"] },
    ]);
    expect(saved.filter((item) => item.dictType === "register_mapping").map((item) => item.description)).toEqual(["[]", '["publikacje"]']);
    expect(JSON.parse(localStorage.getItem("ozipz_dictionaries") || "[]")).toEqual(saved);
  });
});
