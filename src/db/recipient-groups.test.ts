// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { migrateDatabase, SCHEMA_SQL } from "./sqlite-migrations";
import { SqliteDatabaseService } from "./sqlite-service";
import type { ISqlDatabase } from "./types";

const databases: DatabaseSync[] = [];
afterEach(() => { databases.splice(0).forEach((db) => db.close()); });

function adapter(raw: DatabaseSync): ISqlDatabase {
  return {
    async select<T>(sql: string, values: unknown[] = []) { return raw.prepare(sql.replace(/\$\d+/g, "?")).all(...values as never[]) as T; },
    async execute(sql: string, values: unknown[] = []) {
      if (values.length) return raw.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
      raw.exec(sql);
      return {};
    },
  };
}

async function freshDatabase() {
  const raw = new DatabaseSync(":memory:"); databases.push(raw);
  const db = adapter(raw);
  await migrateDatabase(db);
  raw.exec("PRAGMA foreign_keys = ON");
  return { raw, db, service: new SqliteDatabaseService(db) };
}

const group = (raw: DatabaseSync, id: string, label: string, code = id) =>
  raw.prepare("INSERT INTO ozipz_dictionaries (id, dict_type, code, label, is_system, created_at, updated_at) VALUES (?, 'recipientGroup', ?, ?, 0, '2026-01-01', '2026-01-01')")
    .run(id, code, label);
const action = (raw: DatabaseSync, id: string, audience: string, ids: string | null = null, date = "2026-09-10") =>
  raw.prepare("INSERT INTO ozipz_actions (id, title, action_type, date, facility_name, municipality, topic, audience_group, recipient_group_ids, lead_educator, created_at, updated_at) VALUES (?, 'Działanie', 'Prelekcja', ?, 'SP1', 'Myślibórz', '', ?, ?, 'Jan', '2026-01-01', '2026-01-01')")
    .run(id, date, audience, ids);
const baseAction = {
  title: "Prelekcja", actionType: "Prelekcja", date: "2026-09-10", facilityName: "SP1", municipality: "Myślibórz",
  topic: "", audienceGroup: "Uczniowie - 20", participantsCount: 20, leadEducator: "Jan",
  ezdStatus: "do_ezd", status: "wykonane", materialsDistributedCount: 0,
};

describe("grupy odbiorców: powiązanie działań ze słownikiem", () => {
  it("przy aktualizacji bazy łączy starsze działania tylko z dokładnie pasującymi pozycjami słownika", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    raw.exec(SCHEMA_SQL);
    raw.exec("PRAGMA user_version = 17");
    group(raw, "d-uczniowie", "Uczniowie");
    group(raw, "d-opiekunowie", "Opiekunowie", "opiekunowie_kod");
    action(raw, "a1", "Uczniowie - 25, Opiekunowie - 3");
    action(raw, "a2", "uczniowie - 10; Grupa B: OPIEKUNOWIE - 2");
    action(raw, "a3", "Mieszkańcy powiatu / społeczność lokalna - 40");
    action(raw, "a4", "Uczniowie - 5, Zupełnie inna grupa - 7", null, "2026-03-10");
    raw.exec("INSERT INTO ozipz_closed_months (month_key, closed_at) VALUES ('2026-03', '2026-04-01')");

    expect((await migrateDatabase(adapter(raw))).migrated).toBe(true);
    const ids = (id: string) => raw.prepare("SELECT recipient_group_ids AS ids FROM ozipz_actions WHERE id = ?").get(id)?.ids;
    expect(JSON.parse(String(ids("a1")))).toEqual(["d-uczniowie", "d-opiekunowie"]);
    expect(JSON.parse(String(ids("a2")))).toEqual(["d-uczniowie", "d-opiekunowie"]);
    // Wartość spoza słownika zostaje tekstem – nic nie jest zgadywane ani dopisywane do słownika.
    expect(ids("a3")).toBeNull();
    expect(raw.prepare("SELECT COUNT(*) AS n FROM ozipz_dictionaries WHERE dict_type = 'recipientGroup'").get()?.n).toBe(2);
    // Powiązanie obejmuje też zamknięty miesiąc (inaczej grupa byłaby tam niezablokowana), tekst działania się nie zmienia.
    expect(JSON.parse(String(ids("a4")))).toEqual(["d-uczniowie"]);
    expect(raw.prepare("SELECT audience_group AS a FROM ozipz_actions WHERE id = 'a4'").get()?.a).toBe("Uczniowie - 5, Zupełnie inna grupa - 7");
  });

  it("blokuje zmianę nazwy, kodu i usunięcie grupy użytej w działaniu, ale nie opisu", async () => {
    const { raw } = await freshDatabase();
    group(raw, "used", "Uczniowie");
    group(raw, "free", "Seniorzy");
    action(raw, "a1", "Uczniowie - 20", '["used"]');

    expect(() => raw.exec("UPDATE ozipz_dictionaries SET label = 'Uczniowie szkół' WHERE id = 'used'")).toThrow(/nie można zmienić/);
    expect(() => raw.exec("UPDATE ozipz_dictionaries SET code = 'inny' WHERE id = 'used'")).toThrow(/nie można zmienić/);
    expect(() => raw.exec("UPDATE ozipz_dictionaries SET dict_type = 'campaign' WHERE id = 'used'")).toThrow(/nie można zmienić/);
    expect(() => raw.exec("DELETE FROM ozipz_dictionaries WHERE id = 'used'")).toThrow(/nie można jej usunąć/);
    raw.exec("UPDATE ozipz_dictionaries SET description = 'Dzieci i młodzież' WHERE id = 'used'");

    // Grupa, której żadne działanie nie używa, zostaje swobodna.
    raw.exec("UPDATE ozipz_dictionaries SET label = 'Seniorzy 60+' WHERE id = 'free'");
    raw.exec("DELETE FROM ozipz_dictionaries WHERE id = 'free'");

    // Po usunięciu działania grupa znów jest swobodna.
    raw.exec("DELETE FROM ozipz_actions WHERE id = 'a1'");
    raw.exec("UPDATE ozipz_dictionaries SET label = 'Uczniowie szkół' WHERE id = 'used'");
  });

  it("nie pozwala wskazać w działaniu pozycji spoza słownika grup odbiorców", async () => {
    const { raw } = await freshDatabase();
    group(raw, "g1", "Uczniowie");
    raw.prepare("INSERT INTO ozipz_dictionaries (id, dict_type, code, label, is_system, created_at, updated_at) VALUES ('c1', 'campaign', 'c1', 'Kampania', 0, '2026-01-01', '2026-01-01')").run();
    expect(() => action(raw, "bad", "Uczniowie - 1", '["nie-ma-takiej"]')).toThrow(/nie ma w słowniku/);
    expect(() => action(raw, "bad2", "Uczniowie - 1", '["c1"]')).toThrow(/nie ma w słowniku/);
    action(raw, "ok", "Uczniowie - 1", '["g1"]');
    expect(() => raw.exec("UPDATE ozipz_actions SET recipient_group_ids = '[\"zly\"]' WHERE id = 'ok'")).toThrow(/nie ma w słowniku/);
  });

  it("zapisuje i odczytuje powiązania przez serwis, a edycja bez nich ich nie gubi", async () => {
    const { raw, service } = await freshDatabase();
    const created = await service.addDictionaryItem({ dictType: "recipientGroup", code: "uczniowie", label: "Uczniowie", isSystem: false });
    const saved = await service.addAction({ ...baseAction, recipientGroupIds: [created.id] });
    expect((await service.getActions())[0].recipientGroupIds).toEqual([created.id]);

    await service.updateAction(saved.id, { status: "wykonane" });
    expect((await service.getActions())[0].recipientGroupIds).toEqual([created.id]);
    await service.updateAction(saved.id, { recipientGroupIds: undefined });
    expect((await service.getActions())[0].recipientGroupIds).toBeUndefined();
    expect(raw.prepare("SELECT recipient_group_ids AS ids FROM ozipz_actions WHERE id = ?").get(saved.id)?.ids).toBeNull();
  });

  it("serwis słownika odrzuca duplikaty nazw oraz zmianę użytej grupy z czytelnym komunikatem", async () => {
    const { service } = await freshDatabase();
    const created = await service.addDictionaryItem({ dictType: "recipientGroup", code: "uczniowie", label: "Uczniowie", isSystem: false });
    await expect(service.addDictionaryItem({ dictType: "recipientGroup", code: "uczniowie_2", label: "  uczniowie ", isSystem: false }))
      .rejects.toThrow(/już istnieje/);
    await expect(service.addDictionaryItem({ dictType: "recipientGroup", code: "UCZNIOWIE", label: "Inna nazwa", isSystem: false }))
      .rejects.toThrow(/Kod/);

    await service.addAction({ ...baseAction, recipientGroupIds: [created.id] });
    await expect(service.updateDictionaryItem(created.id, { label: "Uczniowie szkół" })).rejects.toThrow(/nie można zmienić/);
    await expect(service.updateDictionaryItem(created.id, { code: "nowy_kod" })).rejects.toThrow(/nie można zmienić/);
    await expect(service.deleteDictionaryItem(created.id)).rejects.toThrow(/nie można jej usunąć/);
    await service.updateDictionaryItem(created.id, { description: "Dzieci i młodzież szkolna" });
    expect((await service.getDictionaryItems()).find((d) => d.id === created.id)?.description).toBe("Dzieci i młodzież szkolna");
  });
});
