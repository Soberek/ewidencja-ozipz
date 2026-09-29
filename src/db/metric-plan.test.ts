import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import { FallbackDatabaseService } from "./fallback-service";

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

const plan = { razemDzialania: 280, razemUczestnicy: 9000, programyDzialania: 100, programyUczestnicy: 2500 };

describe("plan miernika w bazie", () => {
  beforeEach(() => localStorage.clear());

  it("zapisuje plan osobno dla każdego roku (SQLite)", async () => {
    const db = createInMemorySqlite();
    await initTables(db);
    const service = new SqliteDatabaseService(db);
    expect(await service.getMetricPlan(2026)).toBeNull();
    await service.saveMetricPlan(2026, plan);
    await service.saveMetricPlan(2026, { ...plan, razemDzialania: 300 });
    expect(await service.getMetricPlan(2026)).toEqual({ ...plan, razemDzialania: 300 });
    expect(await service.getMetricPlan(2027)).toBeNull();
  });

  it("przenosi plan zapisany przez starszą wersję w pamięci przeglądarki do bazy", async () => {
    localStorage.setItem("ozipz_metric_plan_2026", JSON.stringify(plan));
    const db = createInMemorySqlite();
    await initTables(db);
    const service = new SqliteDatabaseService(db);
    expect(await service.getMetricPlan(2026)).toEqual(plan);
    expect(localStorage.getItem("ozipz_metric_plan_2026")).toBeNull();
    const rows = await db.select<Array<{ value: string }>>("SELECT value FROM ozipz_meta WHERE key = 'metric_plan:2026'");
    expect(JSON.parse(rows[0].value)).toEqual(plan);
  });

  it("w trybie przeglądarkowym korzysta z dotychczasowego klucza bez jego usuwania", async () => {
    localStorage.setItem("ozipz_metric_plan_2026", JSON.stringify(plan));
    const service = new FallbackDatabaseService();
    expect(await service.getMetricPlan(2026)).toEqual(plan);
    expect(localStorage.getItem("ozipz_metric_plan_2026")).not.toBeNull();
  });
});
