import type { ISqlDatabase } from "./types";
import { JRWA_DEFAULT_SECTION } from "../features/ozipz/constants";

/**
 * Idempotentne czyszczenie bazy z atrap teczek (dummy folders bez numeru sprawy)
 * oraz naprawa i re-numeracja "zatrutych" spraw z zawyżonymi numerami (np. > 100).
 */
export async function cleanupPoisonedJrwaCases(db: ISqlDatabase): Promise<void> {
  const allCases = await db.select<Array<{
    id: string;
    section: string;
    jrwa_symbol: string;
    case_number: number;
    year: number;
    full_case_sign: string;
    created_at: string;
  }>>("SELECT id, section, jrwa_symbol, case_number, year, full_case_sign, created_at FROM ozipz_jrwa_cases;");

  if (!allCases || allCases.length === 0) return;
  const lockedCaseIds = new Set((await db.select<Array<{ id: string }>>(
    "SELECT DISTINCT j.id FROM ozipz_jrwa_cases j JOIN ozipz_actions a ON (a.jrwa_case_id = j.id OR a.jrwa_sign = j.full_case_sign) JOIN ozipz_closed_months m ON m.month_key = substr(a.date, 1, 7)"
  )).map((row) => row.id));

  const genericDummyRegex = /^(?:(?:PSSE\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\.)?(?:966(?:\.[0-9]+)?|9011(?:\.[0-9]+)?|0442|\d{4})\.(\d{4})$/i;
  const dummyCaseIds: string[] = [];

  for (const c of allCases) {
    if (lockedCaseIds.has(c.id)) continue;
    const sign = (c.full_case_sign || "").trim();
    const escapedSym = (c.jrwa_symbol || "").replace(/\./g, "\\.");
    const dummyRegex = new RegExp(`^(?:(?:PSSE\\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\\.)?${escapedSym}\\.${c.year}(?:\\.[A-Za-z0-9]+)?$`, "i");

    if (
      (escapedSym && dummyRegex.test(sign)) ||
      genericDummyRegex.test(sign) ||
      c.case_number === c.year
    ) {
      dummyCaseIds.push(c.id);
    }
  }

  if (dummyCaseIds.length > 0) {
    await db.execute("BEGIN TRANSACTION;");
    try {
      for (const dummyId of dummyCaseIds) {
        await db.execute("UPDATE ozipz_actions SET jrwa_case_id = NULL WHERE jrwa_case_id = $1;", [dummyId]);
        await db.execute("DELETE FROM ozipz_jrwa_cases WHERE id = $1;", [dummyId]);
      }
      await db.execute("COMMIT;");
    } catch (err) {
      await db.execute("ROLLBACK;");
      throw err;
    }
  }

  // Pobierz sprawy po usunięciu atrap
  const remainingCases = await db.select<Array<{
    id: string;
    section: string;
    jrwa_symbol: string;
    case_number: number;
    year: number;
    full_case_sign: string;
    created_at: string;
  }>>("SELECT id, section, jrwa_symbol, case_number, year, full_case_sign, created_at FROM ozipz_jrwa_cases ORDER BY year ASC, jrwa_symbol ASC, case_number ASC, created_at ASC;");

  // Pogrupuj według (section, jrwa_symbol, year)
  const groups = new Map<string, typeof remainingCases>();
  for (const c of remainingCases) {
    const key = `${c.section || JRWA_DEFAULT_SECTION}::${c.jrwa_symbol}::${c.year}`;
    const list = groups.get(key) || [];
    list.push(c);
    groups.set(key, list);
  }

  const now = new Date().toISOString();
  for (const [, casesInGroup] of groups) {
    const hasPoisoned = casesInGroup.some((c) => c.case_number > 100);
    if (!hasPoisoned) continue;

    const normalCases = casesInGroup.filter((c) => c.case_number <= 100);
    const poisonedCases = casesInGroup.filter((c) => c.case_number > 100 && !lockedCaseIds.has(c.id));
    if (poisonedCases.length === 0) continue;

    let nextNum = normalCases.reduce((max, c) => (c.case_number > max ? c.case_number : max), 0) + 1;

    await db.execute("BEGIN TRANSACTION;");
    try {
      for (const pc of poisonedCases) {
        const sec = pc.section || JRWA_DEFAULT_SECTION;
        const newSign = `${sec}.${pc.jrwa_symbol}.${nextNum}.${pc.year}`;
        // Trigger sync_ozipz_jrwa_cases_sign przenosi nową sygnaturę do działań, rejestrów i pism.

        await db.execute(
          "UPDATE ozipz_jrwa_cases SET case_number = $1, full_case_sign = $2, updated_at = $3 WHERE id = $4;",
          [nextNum, newSign, now, pc.id]
        );


        nextNum++;
      }
      await db.execute("COMMIT;");
    } catch (err) {
      await db.execute("ROLLBACK;");
      throw err;
    }
  }
}
