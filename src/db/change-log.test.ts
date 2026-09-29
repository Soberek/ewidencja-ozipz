// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import { getRestoreGroup, listChangeLog, listRecordHistory, restoreChange, rowJsonExpression, setAuditActor } from "./change-log";

const databases: DatabaseSync[] = [];
afterEach(() => databases.splice(0).forEach((db) => db.close()));

async function createDatabase(): Promise<{ db: ISqlDatabase; service: SqliteDatabaseService }> {
  const raw = new DatabaseSync(":memory:");
  databases.push(raw);
  const db: ISqlDatabase = {
    async select<T>(sql: string, values: unknown[] = []) { return raw.prepare(sql.replace(/\$\d+/g, "?")).all(...values as never[]) as T; },
    async execute(sql: string, values: unknown[] = []) {
      if (values.length) return raw.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
      raw.exec(sql);
      return {};
    },
  };
  await initTables(db);
  await setAuditActor(db, "jkowalski");
  return { db, service: new SqliteDatabaseService(db) };
}

describe("historia zmian i kosz", () => {
  it("nie rejestruje porządków startowych", async () => {
    const { db } = await createDatabase();
    expect(await listChangeLog(db)).toEqual([]);
  });

  it("zapisuje dodanie, zmianę i usunięcie z autorem i pełnym stanem rekordu", async () => {
    const { db, service } = await createDatabase();
    const material = await service.addMaterial({ title: "Ulotka", materialType: "ulotka", topic: "HIV", publisher: "GIS" });
    await service.updateMaterial(material.id, { title: "Ulotka HIV" });
    await service.deleteMaterial(material.id);

    const history = await listRecordHistory(db, "ozipz_materials", material.id);
    expect(history.map((entry) => entry.operation)).toEqual(["DELETE", "UPDATE", "INSERT"]);
    expect(history.every((entry) => entry.actor === "jkowalski")).toBe(true);
    expect(history[1].oldData?.title).toBe("Ulotka");
    expect(history[1].newData?.title).toBe("Ulotka HIV");
    expect(history[0].oldData?.title).toBe("Ulotka HIV");
  });

  it("pomija zapisy, które niczego nie zmieniają", async () => {
    const { db, service } = await createDatabase();
    const material = await service.addMaterial({ title: "Plakat", materialType: "plakat", topic: "", publisher: "PSSE" });
    await db.execute("UPDATE ozipz_materials SET title = title WHERE id = $1", [material.id]);
    expect((await listRecordHistory(db, "ozipz_materials", material.id)).map((entry) => entry.operation)).toEqual(["INSERT"]);
  });

  it("przywraca usunięty rekord z kosza i oznacza wpis jako przywrócony", async () => {
    const { db, service } = await createDatabase();
    const material = await service.addMaterial({ title: "Broszura", materialType: "broszura", topic: "", publisher: "GIS" });
    await service.deleteMaterial(material.id);
    const [deletion] = await listChangeLog(db, { operation: "DELETE" });

    expect(await restoreChange(db, deletion.id)).toBe(1);
    expect((await service.getMaterials()).map((item) => item.title)).toEqual(["Broszura"]);
    expect((await listChangeLog(db, { operation: "DELETE", onlyRestorable: true }))).toEqual([]);
    await expect(restoreChange(db, deletion.id)).rejects.toThrow(/już przywrócony/);
  });

  it("przywraca poprzednią wersję zmienionego rekordu", async () => {
    const { db, service } = await createDatabase();
    const material = await service.addMaterial({ title: "Stara nazwa", materialType: "ulotka", topic: "", publisher: "GIS" });
    await service.updateMaterial(material.id, { title: "Nowa nazwa" });
    const [update] = await listChangeLog(db, { operation: "UPDATE" });

    await restoreChange(db, update.id);
    expect((await service.getMaterials())[0].title).toBe("Stara nazwa");
  });

  it("przywraca razem rekordy usunięte w jednej operacji i odpięte powiązania", async () => {
    const { db, service } = await createDatabase();
    const material = await service.addMaterial({ title: "Ulotka", materialType: "ulotka", topic: "", publisher: "GIS" });
    const distribution = await service.addDistribution({
      materialId: material.id, materialTitle: material.title, recipientName: "Szkoła", quantity: 5, distributionDate: "2026-09-01", assignedEducator: "Jan", purpose: "Akcja",
    });
    await db.execute("DELETE FROM ozipz_materials WHERE id = $1", [material.id]);
    const deletion = (await listChangeLog(db, { operation: "DELETE" })).find((entry) => entry.tableName === "ozipz_materials")!;

    const group = await getRestoreGroup(db, deletion.id);
    expect(group.length).toBeGreaterThanOrEqual(1);
    await restoreChange(db, deletion.id);
    expect((await service.getMaterials()).map((item) => item.id)).toEqual([material.id]);
    expect((await service.getDistributions()).find((item) => item.id === distribution.id)?.materialId).toBe(material.id);
  });

  it("buduje JSON także dla tabel z ponad 30 kolumnami", async () => {
    const raw = new DatabaseSync(":memory:");
    databases.push(raw);
    const columns = Array.from({ length: 75 }, (_, index) => `c${index}`);
    raw.exec(`CREATE TABLE wide (${columns.join(", ")})`);
    raw.prepare(`INSERT INTO wide VALUES (${columns.map(() => "?").join(", ")})`).run(...columns.map((_, index) => index));
    const row = raw.prepare(`SELECT ${rowJsonExpression(columns, "wide")} AS data FROM wide`).get() as { data: string };
    const parsed = JSON.parse(row.data) as Record<string, number>;
    expect(Object.keys(parsed)).toHaveLength(75);
    expect(parsed.c74).toBe(74);
  });
});
