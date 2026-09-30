// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanLegacyFacilityContact, migrateDatabase, SCHEMA_SQL, SCHEMA_VERSION, staleMigrationBackups } from "./sqlite-migrations";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import type { ISqlDatabase } from "./types";

const databases: DatabaseSync[] = [];
const directories: string[] = [];
afterEach(() => { databases.splice(0).forEach((db) => db.close()); directories.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })); });
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
function legacy(file = ":memory:") {
  const raw = new DatabaseSync(file); databases.push(raw);
  raw.exec(SCHEMA_SQL.replace(/, FOREIGN KEY \(\w+\) REFERENCES \w+\(id\) ON DELETE (?:SET NULL|RESTRICT)/g, ""));
  return raw;
}
// Kolumny z CHECK na format lub listę wartości potrzebują poprawnych danych przykładowych.
const FIXTURES: Record<string, string> = {
  date: "2026-01-15", event_date: "2026-01-15", distribution_date: "2026-01-15", letter_date: "2026-01-15",
  publication_date: "2026-01-15", scan_date: "2026-01-15", direction: "wychodzace",
};
function insert(raw: DatabaseSync, table: string, values: Record<string, string | number | null>) {
  const columns = raw.prepare(`PRAGMA table_info(${table})`).all();
  const row = { ...values };
  for (const column of columns) {
    const name = String(column.name);
    if (column.notnull && column.dflt_value === null && !(name in row)) row[name] = column.type === "INTEGER" ? 1 : FIXTURES[name] ?? "fixture";
  }
  raw.prepare(`INSERT INTO ${table} (${Object.keys(row).join(",")}) VALUES (${Object.keys(row).map(() => "?").join(",")})`).run(...Object.values(row));
}

describe("versioned database migration", () => {
  it("preserves schedule notes and stores annotation text separately", async () => {
    const raw = legacy();
    raw.exec("PRAGMA user_version = 2");
    raw.exec("ALTER TABLE ozipz_schedule DROP COLUMN annotation_text");
    insert(raw, "ozipz_schedule", {
      id: "schedule-with-notes", title: "Prelekcja", event_date: "2026-09-20",
      location: "Szkoła", status: "zaplanowane", responsible_person: "Anna", notes: "Uwagi do zadania",
    });

    await migrateDatabase(adapter(raw));
    const service = new SqliteDatabaseService(adapter(raw));
    await service.updateScheduleEvent("schedule-with-notes", {
      annotationReasonCode: "FERIE", annotationText: "Uzasadnienie odroczenia", status: "odroczone",
    });
    expect((await service.getScheduleEvents())[0]).toMatchObject({
      notes: "Uwagi do zadania", annotationText: "Uzasadnienie odroczenia",
    });
  });

  it("adds the GIS category to JRWA dictionary entries without losing their classification", async () => {
    const raw = legacy();
    raw.exec("PRAGMA user_version = 3");
    raw.exec("ALTER TABLE ozipz_dictionaries DROP COLUMN gis_category");
    insert(raw, "ozipz_dictionaries", {
      id: "dict-966-16", dict_type: "jrwaSymbol", code: "966.16", label: "Zdrowie psychiczne", kind: "NIEPROGRAMOWE", is_system: 1,
    });

    await migrateDatabase(adapter(raw));
    const service = new SqliteDatabaseService(adapter(raw));
    expect((await service.getDictionaryItems())[0]).toMatchObject({ code: "966.16", kind: "NIEPROGRAMOWE", gisCategory: undefined });

    await service.updateDictionaryItem("dict-966-16", { gisCategory: "uzaleznienia" });
    const created = await service.addDictionaryItem({
      dictType: "jrwaSymbol", code: "966.30", label: "Nowy program", kind: "PROGRAMOWE", gisCategory: "sti", isSystem: false,
    });
    const items = await service.getDictionaryItems();
    expect(items.find((item) => item.id === "dict-966-16")?.gisCategory).toBe("uzaleznienia");
    expect(items.find((item) => item.id === created.id)?.gisCategory).toBe("sti");
  });

  it("never adds, restores or overwrites JRWA dictionary entries on start", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    const db = adapter(raw);
    await initTables(db);
    const jrwaRows = () => raw.prepare("SELECT code, label, gis_category FROM ozipz_dictionaries WHERE dict_type = 'jrwaSymbol' ORDER BY code").all();
    expect(jrwaRows()).toEqual([]);

    insert(raw, "ozipz_dictionaries", {
      id: "dict_jrwa_966_20", dict_type: "jrwaSymbol", code: "966.20", label: "Tylko Pomyśl", gis_category: "inne",
      kind: "PROGRAMOWE", is_system: 1, created_at: "2026-09-16", updated_at: "2026-09-16",
    });
    insert(raw, "ozipz_programs", { id: "p-bez-symbolu", code: "P", name: "Trzymaj Formę", edition_year: "2026/2027", created_at: "2026-09-16", updated_at: "2026-09-16" });
    await initTables(db);
    expect(jrwaRows()).toEqual([{ code: "966.20", label: "Tylko Pomyśl", gis_category: "inne" }]);
    // Program bez symbolu zostaje bez symbolu – nie zgadujemy go po nazwie
    expect(raw.prepare("SELECT jrwa_symbol FROM ozipz_programs WHERE id = 'p-bez-symbolu'").get()?.jrwa_symbol).toBeNull();
  });

  it("upgrades a version 1 file without losing actions", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ozipz-v1-upgrade-")); directories.push(directory);
    const raw = new DatabaseSync(join(directory, "v1.db")); databases.push(raw);
    const v1Sql = SCHEMA_SQL.split(";\n").filter((statement) =>
      !statement.startsWith("CREATE TABLE IF NOT EXISTS ozipz_closed_months") &&
      !statement.startsWith("CREATE TRIGGER IF NOT EXISTS protect_closed_month_")
    ).join(";\n");
    raw.exec(v1Sql);
    raw.exec("PRAGMA user_version = 1");
    insert(raw, "ozipz_actions", { id: "v1-action", title: "Działanie historyczne", date: "2026-09-20" });

    expect((await migrateDatabase(adapter(raw))).migrated).toBe(true);
    expect(raw.prepare("PRAGMA user_version").get()?.user_version).toBe(SCHEMA_VERSION);
    expect(raw.prepare("SELECT title, date FROM ozipz_actions WHERE id='v1-action'").get()).toEqual({
      title: "Działanie historyczne", date: "2026-09-20",
    });
    const service = new SqliteDatabaseService(adapter(raw));
    await service.setMonthClosed("2026-09", true);
    expect(() => raw.exec("DELETE FROM ozipz_actions WHERE id='v1-action'")).toThrow(/zamknięt/);
  });

  it("persists month locks across reopening and allows unlocking", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ozipz-month-lock-")); directories.push(directory);
    const file = join(directory, "locks.db");
    const first = new DatabaseSync(file); databases.push(first);
    await migrateDatabase(adapter(first));
    const service = new SqliteDatabaseService(adapter(first));
    await service.setMonthClosed("2026-08", true);
    expect(await service.getClosedMonths()).toEqual(["2026-08"]);

    first.close(); databases.pop();
    const reopened = new DatabaseSync(file); databases.push(reopened);
    await migrateDatabase(adapter(reopened));
    const restartedService = new SqliteDatabaseService(adapter(reopened));
    expect(await restartedService.getClosedMonths()).toEqual(["2026-08"]);
    await restartedService.setMonthClosed("2026-08", false);
    expect(await restartedService.getClosedMonths()).toEqual([]);
  });

  it("upgrades the old file without losing rows, creates a readable backup and is idempotent", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ozipz-migrate-")); directories.push(directory);
    const raw = legacy(join(directory, "old.db"));
    insert(raw, "ozipz_facilities", { id: "f", name: "Szkoła", municipality: "Gmina" });
    insert(raw, "ozipz_actions", { id: "a", facility_id: "f", facility_name: "Stara nazwa" });
    raw.exec("CREATE TABLE custom_settings(value TEXT); INSERT INTO custom_settings VALUES('keep'); CREATE INDEX custom_title ON ozipz_actions(title)");
    await migrateDatabase(adapter(raw));
    expect(raw.prepare("PRAGMA user_version").get()?.user_version).toBe(SCHEMA_VERSION);
    expect(raw.prepare("PRAGMA foreign_key_list(ozipz_actions)").all()).toHaveLength(6);
    expect(raw.prepare("SELECT id, facility_name FROM ozipz_actions").get()).toEqual({ id: "a", facility_name: "Szkoła" });
    expect(raw.prepare("SELECT value FROM custom_settings").get()?.value).toBe("keep");
    expect(raw.prepare("SELECT name FROM sqlite_master WHERE name='custom_title'").get()).toBeTruthy();
    const backups = readdirSync(directory).filter((name) => name.includes("before-migration"));
    expect(backups).toHaveLength(1);
    const backup = new DatabaseSync(join(directory, backups[0]), { readOnly: true }); databases.push(backup);
    expect(backup.prepare("SELECT facility_name FROM ozipz_actions").get()?.facility_name).toBe("Stara nazwa");
    await migrateDatabase(adapter(raw));
    expect(readdirSync(directory).filter((name) => name.includes("before-migration"))).toHaveLength(1);
  });

  it("does not trust an existing version number when actual constraints are missing", async () => {
    const raw = legacy(); raw.exec(`PRAGMA user_version=${SCHEMA_VERSION}`);
    const result = await migrateDatabase(adapter(raw));
    expect(result.migrated).toBe(true);
    expect(raw.prepare("PRAGMA foreign_key_list(ozipz_actions)").all()).toHaveLength(6);
  });

  it("rejects orphan references, rolls back every table and restores FK enforcement", async () => {
    const raw = legacy();
    insert(raw, "ozipz_actions", { id: "a", facility_id: "missing" });
    await expect(migrateDatabase(adapter(raw))).rejects.toThrow("Dane nie zostały usunięte");
    expect(raw.prepare("SELECT facility_id FROM ozipz_actions").get()?.facility_id).toBe("missing");
    expect(raw.prepare("PRAGMA user_version").get()?.user_version).toBe(0);
    expect(raw.prepare("PRAGMA foreign_key_list(ozipz_actions)").all()).toHaveLength(0);
    expect(raw.prepare("PRAGMA foreign_keys").get()?.foreign_keys).toBe(1);
  });

  it("keeps several participations of one school in a program year (e.g. two buildings, two coordinators)", async () => {
    const raw = legacy();
    insert(raw, "ozipz_facilities", { id: "f" }); insert(raw, "ozipz_programs", { id: "p" });
    for (const id of ["one", "two"]) insert(raw, "ozipz_participations", { id, facility_id: "f", program_id: "p", school_year: "2026/2027" });
    await migrateDatabase(adapter(raw));
    expect(raw.prepare("SELECT COUNT(*) AS n FROM ozipz_participations").get()?.n).toBe(2);
  });

  it("enforces references, integer ranges and protects participation history", async () => {
    const raw = legacy(); await migrateDatabase(adapter(raw));
    insert(raw, "ozipz_facilities", { id: "f" }); insert(raw, "ozipz_programs", { id: "p" });
    insert(raw, "ozipz_participations", { id: "one", facility_id: "f", program_id: "p", school_year: "2026/2027" });
    expect(() => raw.exec("DELETE FROM ozipz_facilities WHERE id='f'")).toThrow(/FOREIGN KEY/);
    expect(() => raw.exec("DELETE FROM ozipz_programs WHERE id='p'")).toThrow(/FOREIGN KEY/);
    expect(() => insert(raw, "ozipz_actions", { id: "a", facility_id: "missing" })).toThrow(/FOREIGN KEY/);
    // Tabele STRICT odrzucają ułamki jeszcze przed CHECK.
    for (const number of [-1, 1.5]) expect(() => insert(raw, "ozipz_actions", { id: "negative", participants_count: number })).toThrow(/CHECK|cannot store REAL/);
    for (const month of [0, 13, 1.5]) expect(() => insert(raw, "ozipz_monthly_targets", { id: "m", year: 2026, month })).toThrow(/CHECK|cannot store REAL/);
    expect(() => raw.exec("UPDATE ozipz_participations SET has_declaration=2")).toThrow(/CHECK/);
  });

  it("synchronizes names on rename, insertion and relinking while retaining detached names", async () => {
    const raw = legacy(); await migrateDatabase(adapter(raw));
    insert(raw, "ozipz_facilities", { id: "f", name: "Pierwsza", municipality: "Gmina A" });
    insert(raw, "ozipz_facilities", { id: "g", name: "Druga", municipality: "Gmina B" });
    insert(raw, "ozipz_programs", { id: "p", name: "Program" });
    insert(raw, "ozipz_actions", { id: "a", facility_id: "f", program_id: "p", facility_name: "błędna", program_name: "błędna" });
    raw.exec("UPDATE ozipz_facilities SET name='Nowa' WHERE id='f'; UPDATE ozipz_programs SET name='Nowy program' WHERE id='p'");
    expect(raw.prepare("SELECT facility_name, program_name FROM ozipz_actions").get()).toEqual({ facility_name: "Nowa", program_name: "Nowy program" });
    raw.exec("UPDATE ozipz_actions SET facility_id='g'");
    expect(raw.prepare("SELECT facility_name, municipality FROM ozipz_actions").get()).toEqual({ facility_name: "Druga", municipality: "Gmina B" });
    raw.exec("DELETE FROM ozipz_facilities WHERE id='g'");
    expect(raw.prepare("SELECT facility_id, facility_name FROM ozipz_actions").get()).toEqual({ facility_id: null, facility_name: "Druga" });
  });

  it("does not drop unknown columns or accept a newer schema", async () => {
    const raw = legacy(); raw.exec("ALTER TABLE ozipz_actions ADD COLUMN custom TEXT");
    await expect(migrateDatabase(adapter(raw))).rejects.toThrow("Nieznana kolumna");
    raw.exec("PRAGMA user_version=999");
    await expect(migrateDatabase(adapter(raw))).rejects.toThrow("nowszej wersji");
  });

  it("migrates cleanly even when tables already have cross-table synchronization triggers", async () => {
    const raw = legacy();
    await migrateDatabase(adapter(raw));
    insert(raw, "ozipz_facilities", { id: "f1", name: "Szkoła Podstawowa", municipality: "Myślibórz" });
    insert(raw, "ozipz_programs", { id: "p1", name: "Program 1" });
    insert(raw, "ozipz_participations", { id: "part1", facility_id: "f1", program_id: "p1", school_year: "2026/2027" });
    // Reset user_version to trigger re-migration while triggers already exist
    raw.exec("PRAGMA user_version = 0");
    const result = await migrateDatabase(adapter(raw));
    expect(result.migrated).toBe(true);
    expect(raw.prepare("SELECT facility_name FROM ozipz_participations WHERE id='part1'").get()).toEqual({
      facility_name: "Szkoła Podstawowa",
    });
  });
});

describe("facility contact migration (v5)", () => {
  function v4() {
    const raw = legacy();
    raw.exec("ALTER TABLE ozipz_facilities DROP COLUMN email; ALTER TABLE ozipz_facilities DROP COLUMN phone; PRAGMA user_version = 4");
    return raw;
  }

  it("moves secretariat contact to own columns, strips duplicated notes and the Gmina prefix", async () => {
    const raw = v4();
    insert(raw, "ozipz_facilities", {
      id: "zs", name: "Zespół", municipality: "Gmina Myślibórz", education_types: null,
      default_coordinator_email: "sekretariat@zs.pl", default_coordinator_phone: "957472202",
      notes: "Telefon: 957472202 | E-mail: sekretariat@zs.pl",
    });
    insert(raw, "ozipz_facilities", {
      id: "sp", name: "SP", municipality: "Dębno", education_types: '["Szkoła podstawowa"]',
      default_coordinator_name: "Anna Nowak", default_coordinator_email: "anna@sp.pl",
      notes: "Typy kształcenia: Szkoła podstawowa | Placówka oświatowa z rejestru edu-report-v3 | Klucz u woźnego",
    });
    insert(raw, "ozipz_actions", { id: "a", facility_id: "zs", municipality: "Gmina Myślibórz" });

    await migrateDatabase(adapter(raw));

    expect(raw.prepare("SELECT email, phone, default_coordinator_email AS ce, default_coordinator_phone AS cp, notes, municipality FROM ozipz_facilities WHERE id='zs'").get())
      .toEqual({ email: "sekretariat@zs.pl", phone: "957472202", ce: null, cp: null, notes: null, municipality: "Myślibórz" });
    expect(raw.prepare("SELECT email, default_coordinator_email AS ce, notes FROM ozipz_facilities WHERE id='sp'").get())
      .toEqual({ email: null, ce: "anna@sp.pl", notes: "Klucz u woźnego" });
    expect(raw.prepare("SELECT municipality FROM ozipz_actions").get()?.municipality).toBe("Myślibórz");
  });

  it("keeps notes that differ from stored values", () => {
    expect(cleanLegacyFacilityContact({
      municipality: "Barlinek", notes: "E-mail: inny@szkola.pl | Telefon: 111", email: "a@b.pl", phone: "222", hasEducationTypes: false,
    })).toMatchObject({ notes: "E-mail: inny@szkola.pl | Telefon: 111", email: "a@b.pl", phone: "222" });
    expect(cleanLegacyFacilityContact({ municipality: "Dębno", notes: "Typy kształcenia: Liceum", hasEducationTypes: false }).notes)
      .toBe("Typy kształcenia: Liceum");
  });
});

describe("schema v6 integrity", () => {
  async function fresh() {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    await migrateDatabase(adapter(raw));
    raw.exec("PRAGMA foreign_keys = ON");
    insert(raw, "ozipz_facilities", { id: "f", name: "SP 1", municipality: "Myślibórz" });
    insert(raw, "ozipz_programs", { id: "p", code: "P", name: "Program", edition_year: "2025/2026" });
    insert(raw, "ozipz_materials", { id: "m", title: "Ulotka" });
    insert(raw, "ozipz_actions", { id: "closed", date: "2026-03-10", facility_id: "f", program_id: "p", material_id: "m", lead_educator: "Anna Nowak", action_type: "Wykład" });
    insert(raw, "ozipz_actions", { id: "open", date: "2026-04-10", facility_id: "f", program_id: "p", lead_educator: "Anna Nowak", action_type: "Wykład" });
    raw.exec("INSERT INTO ozipz_closed_months (month_key, closed_at) VALUES ('2026-03', '2026-04-01')");
    return raw;
  }
  const action = (raw: DatabaseSync, id: string) => raw.prepare("SELECT * FROM ozipz_actions WHERE id = ?").get(id)!;

  it("edits facilities and programs linked to a closed month, keeping the closed action's names", async () => {
    const raw = await fresh();
    const service = new SqliteDatabaseService(adapter(raw));
    await service.updateFacility("f", { phone: "957470000" });
    await service.updateProgram("p", { status: "zakończony" });
    await service.updateFacility("f", { name: "SP nr 1", municipality: "Dębno" });
    await service.updateProgram("p", { name: "Program 2" });
    expect(action(raw, "open")).toMatchObject({ facility_name: "SP nr 1", municipality: "Dębno", program_name: "Program 2" });
    expect(action(raw, "closed")).toMatchObject({ facility_name: "SP 1", municipality: "Myślibórz", program_name: "Program" });
  });

  it("explains why a record linked to a closed month cannot be deleted", async () => {
    const raw = await fresh();
    for (const sql of ["DELETE FROM ozipz_facilities WHERE id='f'", "DELETE FROM ozipz_materials WHERE id='m'"]) {
      expect(() => raw.exec(sql)).toThrow(/zamkniętego miesiąca/);
    }
  });

  it("rejects dates that would bypass the month lock", async () => {
    const raw = await fresh();
    expect(() => insert(raw, "ozipz_actions", { id: "pl", date: "10.03.2026" })).toThrow(/CHECK/);
    expect(() => insert(raw, "ozipz_schedule", { id: "s", event_date: "2026-05-10", end_date: "2026-05-01" })).toThrow(/CHECK/);
  });

  it("keeps the action ↔ schedule link one-to-one and consistent", async () => {
    const raw = await fresh();
    insert(raw, "ozipz_schedule", { id: "s1", event_date: "2026-04-01" });
    insert(raw, "ozipz_schedule", { id: "s2", event_date: "2026-04-02" });
    raw.exec("UPDATE ozipz_actions SET schedule_event_id = 's1' WHERE id = 'open'");
    raw.exec("UPDATE ozipz_schedule SET action_id = 'open' WHERE id = 's1'");
    expect(() => raw.exec("UPDATE ozipz_schedule SET action_id = 'open' WHERE id = 's2'")).toThrow(/innym zadaniem|UNIQUE/);
    insert(raw, "ozipz_actions", { id: "other", date: "2026-04-11" });
    expect(() => raw.exec("UPDATE ozipz_actions SET schedule_event_id = 's1' WHERE id = 'other'")).toThrow(/innym działaniem|UNIQUE/);
  });

  it("derives the schedule month from its date", async () => {
    const raw = await fresh();
    insert(raw, "ozipz_schedule", { id: "s", event_date: "2026-10-05", month: 1, year: 1999, month_name: "styczeń" });
    expect(raw.prepare("SELECT month, year, month_name FROM ozipz_schedule").get()).toEqual({ month: 10, year: 2026, month_name: "Październik" });
    raw.exec("UPDATE ozipz_schedule SET event_date = '2026-12-01'");
    expect(raw.prepare("SELECT month, month_name FROM ozipz_schedule").get()).toEqual({ month: 12, month_name: "Grudzień" });
  });

  it("propagates staff names, dictionary labels and JRWA signs to open months only", async () => {
    const raw = await fresh();
    insert(raw, "ozipz_staff", { id: "st", full_name: "Anna Nowak" });
    insert(raw, "ozipz_dictionaries", { id: "d", dict_type: "activityType", code: "wyklad", label: "Wykład" });
    insert(raw, "ozipz_jrwa_cases", { id: "j", section: "OZiPZ", jrwa_symbol: "966.1", case_number: 1, year: 2026, full_case_sign: "OZiPZ.966.1.1.2026" });
    insert(raw, "ozipz_registers", { id: "r", jrwa_sign: "OZiPZ.966.1.1.2026" });
    raw.exec("PRAGMA foreign_keys = ON; DELETE FROM ozipz_closed_months; UPDATE ozipz_actions SET jrwa_case_id = 'j', jrwa_sign = 'OZiPZ.966.1.1.2026'; INSERT INTO ozipz_closed_months VALUES ('2026-03', 'x')");
    raw.exec("UPDATE ozipz_staff SET full_name = 'Anna Kowalska'; UPDATE ozipz_dictionaries SET label = 'Wykład otwarty'; UPDATE ozipz_jrwa_cases SET case_number = 2, full_case_sign = 'OZiPZ.966.1.2.2026'");
    expect(action(raw, "open")).toMatchObject({ lead_educator: "Anna Kowalska", action_type: "Wykład otwarty", jrwa_sign: "OZiPZ.966.1.2.2026" });
    expect(action(raw, "closed")).toMatchObject({ lead_educator: "Anna Nowak", action_type: "Wykład", jrwa_sign: "OZiPZ.966.1.1.2026" });
    expect(raw.prepare("SELECT jrwa_sign FROM ozipz_registers").get()?.jrwa_sign).toBe("OZiPZ.966.1.2.2026");
  });

  it("propagates renamed dictionary labels and codes to every record that stores them", async () => {
    const raw = await fresh();
    insert(raw, "ozipz_dictionaries", { id: "pos", dict_type: "contactPosition", code: "koordynator_szkolny", label: "Szkolny Koordynator Programu" });
    insert(raw, "ozipz_dictionaries", { id: "gm", dict_type: "municipality", code: "gmina_mysliborz", label: "Gmina Myślibórz" });
    insert(raw, "ozipz_dictionaries", { id: "mt", dict_type: "materialType", code: "ulotka", label: "ulotka" });
    insert(raw, "ozipz_dictionaries", { id: "rola", dict_type: "staffRole", code: "referent", label: "Referent" });
    insert(raw, "ozipz_contacts", { id: "c", name: "Anna", position: "Szkolny Koordynator Programu", municipality: "Myślibórz" });
    insert(raw, "ozipz_staff", { id: "s", full_name: "Jan", role: "referent" });
    raw.exec("UPDATE ozipz_materials SET material_type = 'ulotka'");

    raw.exec("UPDATE ozipz_dictionaries SET label = 'Koordynator szkolny' WHERE id = 'pos'");
    raw.exec("UPDATE ozipz_dictionaries SET label = 'Gmina Myślibórz-Miasto' WHERE id = 'gm'");
    raw.exec("UPDATE ozipz_dictionaries SET code = 'ulotka_a5' WHERE id = 'mt'");
    raw.exec("UPDATE ozipz_dictionaries SET code = 'referent_ozipz' WHERE id = 'rola'");

    expect(raw.prepare("SELECT position, municipality FROM ozipz_contacts WHERE id = 'c'").get()).toEqual({ position: "Koordynator szkolny", municipality: "Myślibórz-Miasto" });
    expect(raw.prepare("SELECT municipality FROM ozipz_facilities WHERE id = 'f'").get()?.municipality).toBe("Myślibórz-Miasto");
    expect(action(raw, "open").municipality).toBe("Myślibórz-Miasto");
    expect(action(raw, "closed").municipality).toBe("Myślibórz");
    expect(raw.prepare("SELECT material_type FROM ozipz_materials WHERE id = 'm'").get()?.material_type).toBe("ulotka_a5");
    expect(raw.prepare("SELECT role FROM ozipz_staff WHERE id = 's'").get()?.role).toBe("referent_ozipz");
  });

  it("blocks changing the code of a JRWA symbol that already has cases, otherwise moves programs to the new code", async () => {
    const raw = await fresh();
    insert(raw, "ozipz_dictionaries", { id: "j1", dict_type: "jrwaSymbol", code: "966.1", label: "Trzymaj Formę" });
    insert(raw, "ozipz_dictionaries", { id: "j20", dict_type: "jrwaSymbol", code: "966.20", label: "Tylko Pomyśl" });
    insert(raw, "ozipz_jrwa_cases", { id: "case", section: "OZiPZ", jrwa_symbol: "966.1", case_number: 1, year: 2026, full_case_sign: "OZiPZ.966.1.1.2026" });
    raw.exec("UPDATE ozipz_programs SET jrwa_symbol = '966.20'");

    expect(() => raw.exec("UPDATE ozipz_dictionaries SET code = '966.100' WHERE id = 'j1'")).toThrow(/ma założone sprawy/);
    raw.exec("UPDATE ozipz_dictionaries SET code = '966.21' WHERE id = 'j20'");
    expect(raw.prepare("SELECT jrwa_symbol FROM ozipz_programs WHERE id = 'p'").get()?.jrwa_symbol).toBe("966.21");
  });

  it("detaches a JRWA case from its originating action when the action moves to another case", async () => {
    const raw = await fresh();
    for (const [id, n] of [["j1", 1], ["j2", 2]] as const) {
      insert(raw, "ozipz_jrwa_cases", { id, jrwa_symbol: "966.1", case_number: n, year: 2026, full_case_sign: `OZiPZ.966.1.${n}.2026` });
    }
    raw.exec("UPDATE ozipz_actions SET jrwa_case_id = 'j1' WHERE id = 'open'; UPDATE ozipz_jrwa_cases SET action_id = 'open' WHERE id = 'j1'");
    expect(() => raw.exec("UPDATE ozipz_jrwa_cases SET action_id = 'open' WHERE id = 'j2'")).toThrow(/innej sprawy/);
    raw.exec("UPDATE ozipz_actions SET jrwa_case_id = 'j2' WHERE id = 'open'");
    expect(raw.prepare("SELECT action_id FROM ozipz_jrwa_cases WHERE id = 'j1'").get()?.action_id).toBeNull();
  });

  it("enforces natural keys for programs, outgoing letters and registers", async () => {
    const raw = await fresh();
    expect(() => insert(raw, "ozipz_programs", { id: "p2", code: "P", edition_year: "2025/2026" })).toThrow(/UNIQUE/);
    insert(raw, "ozipz_letters", { id: "l1", letter_number: "1/2026", direction: "przychodzace" });
    insert(raw, "ozipz_letters", { id: "l2", letter_number: "1/2026", direction: "przychodzace" });
    insert(raw, "ozipz_letters", { id: "l3", letter_number: "1/2026", direction: "wychodzace" });
    expect(() => insert(raw, "ozipz_letters", { id: "l4", letter_number: "1/2026", direction: "wychodzace" })).toThrow(/UNIQUE/);
    expect(() => insert(raw, "ozipz_letters", { id: "l5", letter_number: "2", direction: "inne" })).toThrow(/CHECK/);
  });

  it("normalizes equivalent legacy values while upgrading from v5", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    raw.exec(SCHEMA_SQL.replace(/(indirect_recipients_count|materials_distributed_count) INTEGER NOT NULL/g, "$1 INTEGER"));
    raw.exec("CREATE TABLE ozipz_closed_months_import (id INTEGER PRIMARY KEY CHECK (id = 1)); INSERT INTO ozipz_closed_months_import VALUES (1); PRAGMA user_version = 5");
    // Stary schemat pozwalał na puste teksty, NULL w licznikach i listę typów po przecinku.
    raw.exec("PRAGMA ignore_check_constraints = ON");
    insert(raw, "ozipz_facilities", { id: "f", education_types: "Szkoła podstawowa, Przedszkole" });
    insert(raw, "ozipz_contacts", { id: "c", phone: "", email: "" });
    insert(raw, "ozipz_actions", { id: "a", indirect_recipients_count: null, materials_distributed_count: null });
    raw.exec("PRAGMA ignore_check_constraints = OFF");

    await migrateDatabase(adapter(raw));

    expect(JSON.parse(String(raw.prepare("SELECT education_types FROM ozipz_facilities").get()?.education_types))).toEqual(["Szkoła podstawowa", "Przedszkole"]);
    expect(raw.prepare("SELECT phone, email FROM ozipz_contacts").get()).toEqual({ phone: null, email: null });
    expect(raw.prepare("SELECT indirect_recipients_count AS i, materials_distributed_count AS m FROM ozipz_actions").get()).toEqual({ i: 0, m: 0 });
    expect(raw.prepare("SELECT value FROM ozipz_meta WHERE key = 'closed_months_imported'").get()?.value).toBe("1");
    expect(raw.prepare("SELECT name FROM sqlite_master WHERE name IN ('ozipz_closed_months_import', 'idx_jrwa_cases_sign')").all()).toEqual([]);
  });

  it("adds the linked action column when upgrading from v6 and unlinks on delete", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    raw.exec(SCHEMA_SQL
      .replace(" linked_action_id TEXT CHECK (linked_action_id <> id),", "")
      .replace(", FOREIGN KEY (linked_action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL", "")
      .replace("CREATE INDEX IF NOT EXISTS idx_actions_linked ON ozipz_actions(linked_action_id);\n", ""));
    raw.exec("PRAGMA user_version = 6");
    insert(raw, "ozipz_actions", { id: "old" });

    expect((await migrateDatabase(adapter(raw))).migrated).toBe(true);

    expect(raw.prepare("SELECT id, linked_action_id FROM ozipz_actions").get()).toEqual({ id: "old", linked_action_id: null });
    insert(raw, "ozipz_actions", { id: "dist", linked_action_id: "old" });
    raw.exec("PRAGMA foreign_keys = ON; DELETE FROM ozipz_actions WHERE id = 'old'");
    expect(raw.prepare("SELECT linked_action_id FROM ozipz_actions WHERE id = 'dist'").get()?.linked_action_id).toBeNull();
    expect(() => insert(raw, "ozipz_actions", { id: "self", linked_action_id: "self" })).toThrow(/CHECK/);
  });

  it("links participations to the coordinator contact when upgrading from v7 and keeps its details in sync", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    raw.exec(SCHEMA_SQL
      .replace(" school_coordinator_contact_id TEXT,", "")
      .replace(", FOREIGN KEY (school_coordinator_contact_id) REFERENCES ozipz_contacts(id) ON DELETE SET NULL", "")
      .replace("CREATE INDEX IF NOT EXISTS idx_participations_coordinator ON ozipz_participations(school_coordinator_contact_id);\n", "")
      .replace(/CREATE TRIGGER IF NOT EXISTS sync_ozipz_contacts_coordinator_details[^\n]*\n/, ""));
    raw.exec("PRAGMA user_version = 7");
    insert(raw, "ozipz_facilities", { id: "f" });
    insert(raw, "ozipz_programs", { id: "p" });
    insert(raw, "ozipz_participations", { id: "old", facility_id: "f", program_id: "p", school_year: "2025/2026", school_coordinator_name: "Jan Kowal" });

    expect((await migrateDatabase(adapter(raw))).migrated).toBe(true);
    expect(raw.prepare("SELECT school_coordinator_name AS n, school_coordinator_contact_id AS c FROM ozipz_participations").get()).toEqual({ n: "Jan Kowal", c: null });

    raw.exec("PRAGMA foreign_keys = ON");
    insert(raw, "ozipz_contacts", { id: "c1", name: "Anna Nowak", phone: "600 000 000", email: null });
    insert(raw, "ozipz_participations", { id: "new", facility_id: "f", program_id: "p", school_year: "2026/2027", school_coordinator_name: "wpis", school_coordinator_contact_id: "c1" });
    expect(raw.prepare("SELECT school_coordinator_name AS n FROM ozipz_participations WHERE id = 'new'").get()?.n).toBe("Anna Nowak");

    raw.exec("UPDATE ozipz_contacts SET name = 'Anna Nowak-Kowal', email = 'a.nowak@sp1.pl' WHERE id = 'c1'");
    expect(raw.prepare("SELECT school_coordinator_name AS n, school_coordinator_contact AS c FROM ozipz_participations WHERE id = 'new'").get())
      .toEqual({ n: "Anna Nowak-Kowal", c: "600 000 000 / a.nowak@sp1.pl" });
    expect(raw.prepare("SELECT school_coordinator_name AS n FROM ozipz_participations WHERE id = 'old'").get()?.n).toBe("Jan Kowal");

    raw.exec("DELETE FROM ozipz_contacts WHERE id = 'c1'");
    expect(raw.prepare("SELECT school_coordinator_name AS n, school_coordinator_contact AS c, school_coordinator_contact_id AS id FROM ozipz_participations WHERE id = 'new'").get())
      .toEqual({ n: "Anna Nowak-Kowal", c: "600 000 000 / a.nowak@sp1.pl", id: null });
  });

  it("runs the JRWA cleanup once per database instead of on every start", async () => {
    const raw = new DatabaseSync(":memory:"); databases.push(raw);
    const db = adapter(raw);
    await initTables(db);
    // Sprawa nr 101 jest poprawna w ruchliwym roku — kolejny start nie może jej przenumerować.
    insert(raw, "ozipz_jrwa_cases", { id: "busy", section: "OZiPZ", jrwa_symbol: "966.99", case_number: 101, year: 2026, full_case_sign: "OZiPZ.966.99.101.2026" });
    await initTables(db);
    expect(raw.prepare("SELECT case_number FROM ozipz_jrwa_cases WHERE id = 'busy'").get()?.case_number).toBe(101);
  });
});

it("keeps only the newest migration backup of each schema version", () => {
  expect(staleMigrationBackups([
    "ozipz.db", "ozipz.db.before-migration-1-100.db", "ozipz.db.before-migration-1-300.db", "ozipz.db.before-migration-1-200.db",
    "ozipz.db.before-migration-5-400.db", "ozipz.db.verified-backup-2026-09-09.db", "inna.db.before-migration-1-1.db",
  ], "ozipz.db").sort()).toEqual(["ozipz.db.before-migration-1-100.db", "ozipz.db.before-migration-1-200.db"]);
});
