import { migrateDatabase } from "./sqlite-migrations";
import type { ISqlDatabase } from "./types";
import { alignDataWithDictionaries, cleanupPoisonedJrwaCases } from "./sqlite-seed";
import { dropAuditTriggers, installAuditTriggers, pruneChangeLog } from "./change-log";

export interface InitTablesOptions {
  /** WAL wymaga pamięci współdzielonej, której nie mają dyski sieciowe; tam używamy klasycznego dziennika. */
  journalMode?: "WAL" | "DELETE";
}

export async function initTables(db: ISqlDatabase, options: InitTablesOptions = {}): Promise<void> {
  await db.execute("PRAGMA foreign_keys = ON;");
  await db.execute(`PRAGMA journal_mode = ${options.journalMode ?? "WAL"};`);
  await db.execute("PRAGMA synchronous = NORMAL;");

  // Porządki startowe i migracje nie trafiają do historii zmian.
  await dropAuditTriggers(db);
  await migrateDatabase(db);

  await runOnce(db, "jrwa_cleanup_v1", () => cleanupPoisonedJrwaCases(db));
  await runOnce(db, "dictionary_alignment_v1", () => alignDataWithDictionaries(db));
  await db.execute("BEGIN IMMEDIATE;");
  try {
    // Usuń wycofaną kategorię tematyk ze słowników
    await db.execute("DELETE FROM ozipz_dictionaries WHERE dict_type = 'topic' OR dict_type = 'tematyki';");

    // Wycofane, techniczne pozycje JRWA z dawnych wersji
    await db.execute("DELETE FROM ozipz_dictionaries WHERE dict_type = 'jrwaSymbol' AND (id LIKE 'dict-jrw-%' OR code = '9010' OR code = '070');");

    // Rodzaj działania (działania, szablony) zapisany kodem słownika, np. „prelekcja” → etykieta z tego samego słownika
    await db.execute(
      "UPDATE ozipz_actions SET action_type = (SELECT d.label FROM ozipz_dictionaries d WHERE d.dict_type = 'activityType' AND d.code = ozipz_actions.action_type) " +
      "WHERE EXISTS (SELECT 1 FROM ozipz_dictionaries d WHERE d.dict_type = 'activityType' AND d.code = ozipz_actions.action_type AND d.label <> ozipz_actions.action_type) " +
      "AND NOT EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(ozipz_actions.date, 1, 7));"
    );
    await db.execute(
      "UPDATE ozipz_templates SET action_type = (SELECT d.label FROM ozipz_dictionaries d WHERE d.dict_type = 'activityType' AND d.code = ozipz_templates.action_type) " +
      "WHERE EXISTS (SELECT 1 FROM ozipz_dictionaries d WHERE d.dict_type = 'activityType' AND d.code = ozipz_templates.action_type AND d.label <> ozipz_templates.action_type);"
    );

    await db.execute("COMMIT;");
  } catch (error) {
    await db.execute("ROLLBACK;");
    throw error;
  }
  await importStoredClosedMonths(db);
  await pruneChangeLog(db);
  await installAuditTriggers(db);
}

async function importStoredClosedMonths(db: ISqlDatabase): Promise<void> {
  let stored: string | null = null;
  try {
    if (typeof localStorage !== "undefined") stored = localStorage.getItem("oz.closedMonths");
  } catch { /* Register the migration even when browser storage is unavailable. */ }
  await db.execute("BEGIN IMMEDIATE;");
  try {
    const imported = await db.select<Array<{ value: string }>>("SELECT value FROM ozipz_meta WHERE key = 'closed_months_imported'");
    if (imported.length === 0) {
      let months: unknown = [];
      try { months = stored === null ? [] : JSON.parse(stored); } catch { /* Ignore damaged legacy storage. */ }
      const now = new Date().toISOString();
      for (const month of Array.isArray(months) ? months.filter((value): value is string => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) : []) {
        await db.execute("INSERT OR IGNORE INTO ozipz_closed_months (month_key, closed_at) VALUES ($1, $2)", [month, now]);
      }
      await db.execute("INSERT INTO ozipz_meta (key, value) VALUES ('closed_months_imported', '1')");
    }
    await db.execute("COMMIT;");
  } catch (error) {
    await db.execute("ROLLBACK;");
    throw error;
  }
  if (stored !== null) {
    try { localStorage.removeItem("oz.closedMonths"); } catch { /* SQLite already owns the state. */ }
  }
}

/** Porządki danych, które mają się wykonać raz na bazę, a nie przy każdym starcie aplikacji. */
async function runOnce(db: ISqlDatabase, key: string, task: () => Promise<void>): Promise<void> {
  const done = await db.select<Array<{ value: string }>>("SELECT value FROM ozipz_meta WHERE key = $1", [key]);
  if (done.length > 0) return;
  await task();
  await db.execute("INSERT OR IGNORE INTO ozipz_meta (key, value) VALUES ($1, $2)", [key, new Date().toISOString()]);
}
