import { migrateDatabase } from "./sqlite-migrations";
import type { ISqlDatabase } from "./types";
import { getProgramJrwaSymbol, KNOWN_JRWA_CATALOG } from "../features/ozipz/utils/programJrwaUtils";
import type { OzipzProgram } from "../features/ozipz/types/ozipz.types";
import { cleanupPoisonedJrwaCases } from "./sqlite-seed";

export async function initTables(db: ISqlDatabase): Promise<void> {
  await db.execute("PRAGMA foreign_keys = ON;");
  await db.execute("PRAGMA journal_mode = WAL;");
  await db.execute("PRAGMA synchronous = NORMAL;");

  await migrateDatabase(db);

  await runOnce(db, "jrwa_cleanup_v1", () => cleanupPoisonedJrwaCases(db));
  await db.execute("BEGIN IMMEDIATE;");
  try {
    // Usuń wycofaną kategorię tematyk ze słowników
    await db.execute("DELETE FROM ozipz_dictionaries WHERE dict_type = 'topic' OR dict_type = 'tematyki';");

    // Zapewnij obecność symboli JRWA we wszystkich programach w bazie SQLite
    const programs = await db.select<OzipzProgram[]>("SELECT id, name, description FROM ozipz_programs WHERE jrwa_symbol IS NULL OR jrwa_symbol = ''");
    for (const prog of programs) {
      const symbol = getProgramJrwaSymbol(prog);
      if (symbol) {
        await db.execute(
          "UPDATE ozipz_programs SET jrwa_symbol = $1 WHERE id = $2;",
          [symbol, prog.id]
        );
      }
    }

    // Zapewnij obecność kanonicznych słowników JRWA w tabeli ozipz_dictionaries
    await db.execute("DELETE FROM ozipz_dictionaries WHERE dict_type = 'jrwaSymbol' AND (id LIKE 'dict-jrw-%' OR code = '9010' OR code = '070');");
    for (const d of KNOWN_JRWA_CATALOG) {
      await db.execute(
        "INSERT INTO ozipz_dictionaries (id, dict_type, code, label, description, kind, gis_category, is_system, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT(dict_type, code) DO UPDATE SET kind = COALESCE(ozipz_dictionaries.kind, excluded.kind), gis_category = COALESCE(ozipz_dictionaries.gis_category, excluded.gis_category);",
        [`dict_jrwa_${d.symbol.replace(/\./g, "_")}`, "jrwaSymbol", d.symbol, d.label, d.description || `Symbol JRWA ${d.symbol} w wykazie akt OZiPZ`, d.kind || "PROGRAMOWE", d.gisCategory || null, 1, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"]
      );
    }

    // Normalizacja kolumny action_type w ozipz_actions do pełnych etykiet słownikowych
    const normalizeActionTypes = `
      UPDATE ozipz_actions SET action_type = 'Prelekcja (warsztat)' WHERE action_type = 'prelekcja';
      UPDATE ozipz_actions SET action_type = 'Publikacja media (Portal X)' WHERE action_type = 'publikacja_x';
      UPDATE ozipz_actions SET action_type = 'Publikacja media (Facebook)' WHERE action_type = 'publikacja_fb';
      UPDATE ozipz_actions SET action_type = 'Publikacja media (Strona)' WHERE action_type = 'publikacja_strona';
      UPDATE ozipz_actions SET action_type = 'Dystrybucja' WHERE action_type = 'dystrybucja';
      UPDATE ozipz_actions SET action_type = 'Sprawozdanie (z programu, miernik, tytoń)' WHERE action_type = 'sprawozdanie';
      UPDATE ozipz_actions SET action_type = 'Stoisko edukacyjno-informacyjne' WHERE action_type = 'stoisko';
      UPDATE ozipz_actions SET action_type = 'Wykład' WHERE action_type = 'wyklad';
      UPDATE ozipz_actions SET action_type = 'Narada' WHERE action_type = 'narada';
      UPDATE ozipz_actions SET action_type = 'Konkurs (quiz)' WHERE action_type = 'konkurs';
      UPDATE ozipz_actions SET action_type = 'Pismo (list intencyjny)' WHERE action_type = 'pismo';
      UPDATE ozipz_actions SET action_type = 'Wizytacja' WHERE action_type = 'wizytacja';
      UPDATE ozipz_actions SET action_type = 'Happening (przemarsz, gra, event)' WHERE action_type = 'happening';
      UPDATE ozipz_actions SET action_type = 'Rozmowa indywidualna (instruktaż)' WHERE action_type = 'rozmowa_indywidualna';
      UPDATE ozipz_actions SET action_type = 'Kontrola' WHERE action_type = 'kontrola';
      UPDATE ozipz_actions SET action_type = 'Szkolenie' WHERE action_type = 'szkolenie';
      UPDATE ozipz_actions SET action_type = 'Konferencja' WHERE action_type = 'konferencja';
      UPDATE ozipz_actions SET action_type = 'Wywiad do mediów' WHERE action_type = 'wywiad_media';
    `;
    await db.execute(normalizeActionTypes.replace(
      / WHERE action_type =/g,
      " WHERE NOT EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(ozipz_actions.date, 1, 7)) AND action_type ="
    ));

    await db.execute("COMMIT;");
  } catch (error) {
    await db.execute("ROLLBACK;");
    throw error;
  }
  await importStoredClosedMonths(db);
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
