import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "../../../db/types";
import { migrateDatabase } from "../../../db/sqlite-migrations";
import { cleanupPoisonedJrwaCases } from "../../../db/sqlite-seed";
import { generateNextJrwaSign, formatFullJrwaSign } from "./jrwaNumberingUtils";
import { useActionEditorJrwa } from "../components/actions/editor/useActionEditorJrwa";
import { SqliteActionsRepository } from "../../../db/repositories/sqlite/sqlite-actions.repository";
import type { OzipzAction, OzipzJrwaCase } from "../types/ozipz.types";

function createInMemoryDb(): ISqlDatabase {
  const rawDb = new DatabaseSync(":memory:");
  rawDb.exec("PRAGMA foreign_keys = ON;");

  return {
    async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
      const normalized = query.replace(/\$\d+/g, "?");
      const stmt = rawDb.prepare(normalized);
      const rows = (stmt.all as (...args: unknown[]) => unknown[])(...(bindValues || []));
      return rows as unknown as T;
    },
    async execute(query: string, bindValues?: unknown[]) {
      const params = bindValues || [];
      if (params.length === 0) {
        rawDb.exec(query);
        return { rowsAffected: 0 };
      }
      const normalized = query.replace(/\$\d+/g, "?");
      const stmt = rawDb.prepare(normalized);
      const result = (stmt.run as (...args: unknown[]) => {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
      })(...params);
      return {
        rowsAffected: Number(result.changes),
        lastInsertId: Number(result.lastInsertRowid),
      };
    },
  };
}

describe("jrwaNumberingUtils & cleanupPoisonedJrwaCases", () => {
  describe("generateNextJrwaSign — ochrona przed zawyżaniem numerów przez atrapy teczek", () => {
    it("nie zawyża numeru sprawy, gdy w jrwaCases istnieje atrapa folderu (OZiPZ.966.8.2026 bez numeru sprawy)", () => {
      const dummyFolderCases: OzipzJrwaCase[] = [
        {
          id: "dummy-folder-1",
          section: "OZiPZ",
          jrwaSymbol: "966.8",
          caseNumber: 2026, // atrapa z rokiem zamiast numeru
          year: 2026,
          fullCaseSign: "OZiPZ.966.8.2026", // brak numeru sprawy!
          title: "Teczka zbiorcza 966.8",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.8",
        year: 2026,
        jrwaCases: dummyFolderCases,
      });

      // Zamiast błędnego 2027, musi wygenerować numer 1
      expect(res.caseNumber).toBe(1);
      expect(res.fullCaseSign).toBe("OZiPZ.966.8.1.2026");
    });

    it("nie zawyża numeru sprawy dla różnych prefiksów atrap (PSSE.OZiPZ, OZ) oraz symboli jednocyfrowych", () => {
      const dummyCases: OzipzJrwaCase[] = [
        {
          id: "d1",
          section: "PSSE.OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 2026,
          year: 2026,
          fullCaseSign: "PSSE.OZiPZ.966.1.2026",
          title: "Atrapa 1",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "d2",
          section: "OZ",
          jrwaSymbol: "0442",
          caseNumber: 2026,
          year: 2026,
          fullCaseSign: "OZ.0442.2026",
          title: "Atrapa 2",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const res966 = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        jrwaCases: dummyCases,
      });
      expect(res966.caseNumber).toBe(1);
      expect(res966.fullCaseSign).toBe("OZiPZ.966.1.1.2026");

      const res0442 = generateNextJrwaSign({
        symbol: "0442",
        year: 2026,
        jrwaCases: dummyCases,
      });
      expect(res0442.caseNumber).toBe(1);
      expect(res0442.fullCaseSign).toBe("OZiPZ.0442.1.2026");
    });

    it("dokładnie generuje kolejne numery sekwencyjne obok istniejących prawidłowych spraw", () => {
      const cases: OzipzJrwaCase[] = [
        {
          id: "dummy-folder",
          section: "OZiPZ",
          jrwaSymbol: "966.8",
          caseNumber: 2026,
          year: 2026,
          fullCaseSign: "OZiPZ.966.8.2026",
          title: "Atrapa",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "c1",
          section: "OZiPZ",
          jrwaSymbol: "966.8",
          caseNumber: 1,
          year: 2026,
          fullCaseSign: "OZiPZ.966.8.1.2026",
          title: "Sprawa 1",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
        },
        {
          id: "c2",
          section: "OZiPZ",
          jrwaSymbol: "966.8",
          caseNumber: 2,
          year: 2026,
          fullCaseSign: "OZiPZ.966.8.2.2026",
          title: "Sprawa 2",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-03",
          updatedAt: "2026-01-03",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.8",
        year: 2026,
        jrwaCases: cases,
      });

      // Powinno wygenerować kolejny numer 3
      expect(res.caseNumber).toBe(3);
      expect(res.fullCaseSign).toBe("OZiPZ.966.8.3.2026");
    });

    it("ignoruje w pętli actions znaki bez numeru sprawy (np. sam symbol lub atrapę)", () => {
      const actionsWithDummies: Partial<OzipzAction>[] = [
        { id: "a1", jrwaSign: "966.8" },
        { id: "a2", jrwaSign: "OZiPZ.966.8.2026" },
        { id: "a3", jrwaSign: "OZiPZ.966.8.2026.2026" }, // rok jako numer sprawy
      ];

      const res = generateNextJrwaSign({
        symbol: "966.8",
        year: 2026,
        actions: actionsWithDummies as OzipzAction[],
      });

      expect(res.caseNumber).toBe(1);
      expect(res.fullCaseSign).toBe("OZiPZ.966.8.1.2026");
    });
  });

  describe("cleanupPoisonedJrwaCases — idempotentne czyszczenie bazy", () => {
    it("usuwa atrapy folderów, re-numeruje zatrute sprawy (>100) i aktualizuje ozipz_actions", async () => {
      const db = createInMemoryDb();
      await migrateDatabase(db);

      // Wstaw atrapę folderu 966.8 (OZiPZ.966.8.2026 bez numeru sprawy)
      await db.execute(
        `INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, full_case_sign, title, status, assigned_educator, created_at, updated_at)
         VALUES ('dummy-966-8', 'OZiPZ', '966.8', 2026, 2026, 'OZiPZ.966.8.2026', 'Atrapa', 'w_toku', 'Jan', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');`
      );

      // Wstaw normalną sprawę nr 1
      await db.execute(
        `INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, full_case_sign, title, status, assigned_educator, created_at, updated_at)
         VALUES ('case-normal-1', 'OZiPZ', '966.8', 1, 2026, 'OZiPZ.966.8.1.2026', 'Normalna 1', 'w_toku', 'Jan', '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z');`
      );

      // Wstaw zatrutą sprawę nr 2027 (spowodowaną przez atrapę 2026)
      await db.execute(
        `INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, full_case_sign, title, status, assigned_educator, created_at, updated_at)
         VALUES ('case-poisoned-2027', 'OZiPZ', '966.8', 2027, 2026, 'OZiPZ.966.8.2027.2026', 'Zatruta sprawa', 'w_toku', 'Jan', '2026-01-03T00:00:00Z', '2026-01-03T00:00:00Z');`
      );

      // Wstaw akcję powiązaną z zatrutą sprawą
      await db.execute(
        `INSERT INTO ozipz_actions (id, title, action_type, date, facility_name, municipality, topic, audience_group, jrwa_sign, jrwa_case_id, lead_educator, created_at, updated_at)
         VALUES ('act-poisoned', 'Prelekcja zakaźne', 'Prelekcja (warsztat)', '2026-01-03', 'SP 1', 'Myślibórz', 'Zakaźne', 'uczniowie', 'OZiPZ.966.8.2027.2026', 'case-poisoned-2027', 'Jan', '2026-01-03T00:00:00Z', '2026-01-03T00:00:00Z');`
      );

      // Uruchom procedurę czyszczenia
      await cleanupPoisonedJrwaCases(db);

      // 1. Sprawdź, czy atrapa została usunięta
      const dummyCheck = await db.select<{ id: string }[]>("SELECT id FROM ozipz_jrwa_cases WHERE id = 'dummy-966-8'");
      expect(dummyCheck).toHaveLength(0);

      // 2. Sprawdź, czy normalna sprawa 1 pozostała nienaruszona
      const normalCase = await db.select<{ case_number: number; full_case_sign: string }[]>(
        "SELECT case_number, full_case_sign FROM ozipz_jrwa_cases WHERE id = 'case-normal-1'"
      );
      expect(normalCase[0].case_number).toBe(1);
      expect(normalCase[0].full_case_sign).toBe("OZiPZ.966.8.1.2026");

      // 3. Sprawdź, czy zatruta sprawa została przenumerowana na kolejny wolny numer (2)
      const cleanedCase = await db.select<{ case_number: number; full_case_sign: string }[]>(
        "SELECT case_number, full_case_sign FROM ozipz_jrwa_cases WHERE id = 'case-poisoned-2027'"
      );
      expect(cleanedCase[0].case_number).toBe(2);
      expect(cleanedCase[0].full_case_sign).toBe("OZiPZ.966.8.2.2026");

      // 4. Sprawdź, czy akcja została zaktualizowana do nowego znaku OZiPZ.966.8.2.2026
      const cleanedAction = await db.select<{ jrwa_sign: string; jrwa_case_id: string }[]>(
        "SELECT jrwa_sign, jrwa_case_id FROM ozipz_actions WHERE id = 'act-poisoned'"
      );
      expect(cleanedAction[0].jrwa_sign).toBe("OZiPZ.966.8.2.2026");
      expect(cleanedAction[0].jrwa_case_id).toBe("case-poisoned-2027");

      // 5. Sprawdź idempotencję (ponowne uruchomienie nie zmienia niczego)
      await cleanupPoisonedJrwaCases(db);
      const afterSecondRun = await db.select<{ case_number: number; full_case_sign: string }[]>(
        "SELECT case_number, full_case_sign FROM ozipz_jrwa_cases WHERE id = 'case-poisoned-2027'"
      );
      expect(afterSecondRun[0].case_number).toBe(2);
      expect(afterSecondRun[0].full_case_sign).toBe("OZiPZ.966.8.2.2026");
    });
  });

  describe("useActionEditorJrwa — handleJrwaSignChange synchronizacja i linkowanie", () => {
    it("linkuje jrwaCaseId i wyłącza autoCreateJrwaCase gdy wpisany znak odpowiada istniejącej sprawie", () => {
      const existingCases: OzipzJrwaCase[] = [
        {
          id: "case-existing-1",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 5,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.5.2026",
          title: "Trzymaj Formę SP 1",
          assignedEducator: "Jan",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const setValue = vi.fn();
      const watch = vi.fn((key?: string) => (key === "date" ? "2026-05-10" : ""));

      const { result } = renderHook(() =>
        useActionEditorJrwa({
          programs: [],
          actions: [],
          jrwaCases: existingCases,
          dictionaryItems: [],
          isNoJrwa: false,
          setValue: setValue as unknown as Parameters<typeof useActionEditorJrwa>[0]["setValue"],
          watch: watch as unknown as Parameters<typeof useActionEditorJrwa>[0]["watch"],
        })
      );

      act(() => {
        result.current.handleJrwaSignChange("ozipz.966.1.5.2026");
      });

      expect(setValue).toHaveBeenCalledWith("jrwaSign", "ozipz.966.1.5.2026", expect.any(Object));
      expect(setValue).toHaveBeenCalledWith("jrwaCaseId", "case-existing-1");
      expect(result.current.autoCreateJrwaCase).toBe(false);
      expect(result.current.generatedJrwaMeta?.caseNumber).toBe(5);
    });

    it("parsuje metadane i włącza autoCreateJrwaCase gdy wpisano nowy, poprawny znak sprawy", () => {
      const setValue = vi.fn();
      const watch = vi.fn((key?: string) => (key === "date" ? "2026-05-10" : ""));

      const { result } = renderHook(() =>
        useActionEditorJrwa({
          programs: [],
          actions: [],
          jrwaCases: [],
          dictionaryItems: [],
          isNoJrwa: false,
          setValue: setValue as unknown as Parameters<typeof useActionEditorJrwa>[0]["setValue"],
          watch: watch as unknown as Parameters<typeof useActionEditorJrwa>[0]["watch"],
        })
      );

      act(() => {
        result.current.handleJrwaSignChange("OZiPZ.966.3.7.2026");
      });

      expect(setValue).toHaveBeenCalledWith("jrwaSign", "OZiPZ.966.3.7.2026", expect.any(Object));
      expect(setValue).toHaveBeenCalledWith("jrwaCaseId", "");
      expect(result.current.autoCreateJrwaCase).toBe(true);
      expect(result.current.generatedJrwaMeta).toEqual({
        section: "OZiPZ",
        jrwaSymbol: "966.3",
        caseNumber: 7,
        year: 2026,
        fullCaseSign: "OZiPZ.966.3.7.2026",
      });
    });

    it("bezpiecznie czyści metadane i wyłącza autoCreateJrwaCase gdy znak został wyczyszczony", () => {
      const setValue = vi.fn();
      const watch = vi.fn((key?: string) => (key === "date" ? "2026-05-10" : ""));

      const { result } = renderHook(() =>
        useActionEditorJrwa({
          programs: [],
          actions: [],
          jrwaCases: [],
          dictionaryItems: [],
          isNoJrwa: false,
          setValue: setValue as unknown as Parameters<typeof useActionEditorJrwa>[0]["setValue"],
          watch: watch as unknown as Parameters<typeof useActionEditorJrwa>[0]["watch"],
        })
      );

      act(() => {
        result.current.handleJrwaSignChange("");
      });

      expect(setValue).toHaveBeenCalledWith("jrwaCaseId", "");
      expect(result.current.autoCreateJrwaCase).toBe(false);
      expect(result.current.generatedJrwaMeta).toBeNull();
    });

    it("odrzuca atrapy teczek bez numeru sprawy (np. OZiPZ.966.8.2026) i nie włącza auto-tworzenia", () => {
      const setValue = vi.fn();
      const watch = vi.fn((key?: string) => (key === "date" ? "2026-05-10" : ""));

      const { result } = renderHook(() =>
        useActionEditorJrwa({
          programs: [],
          actions: [],
          jrwaCases: [],
          dictionaryItems: [],
          isNoJrwa: false,
          setValue: setValue as unknown as Parameters<typeof useActionEditorJrwa>[0]["setValue"],
          watch: watch as unknown as Parameters<typeof useActionEditorJrwa>[0]["watch"],
        })
      );

      act(() => {
        result.current.handleJrwaSignChange("OZiPZ.966.8.2026");
      });

      expect(setValue).toHaveBeenCalledWith("jrwaSign", "OZiPZ.966.8.2026", expect.any(Object));
      expect(setValue).toHaveBeenCalledWith("jrwaCaseId", "");
      expect(result.current.autoCreateJrwaCase).toBe(false);
      expect(result.current.generatedJrwaMeta).toBeNull();
    });
  });

  describe("formatFullJrwaSign — ochrona przed atrapami folderów", () => {
    it("zamienia atrapę folderu bez numeru sprawy na pełny znak z numerem sprawy 1", () => {
      expect(formatFullJrwaSign({ jrwaSign: "OZiPZ.966.8.2026" })).toBe("OZiPZ.966.8.1.2026");
      expect(formatFullJrwaSign({ jrwaSign: "OZ.0442.2026" })).toBe("OZiPZ.0442.1.2026");
      expect(formatFullJrwaSign({ jrwaSign: "OZiPZ.966.8.2.2026" })).toBe("OZiPZ.966.8.2.2026");
    });
  });

  describe("SqliteActionsRepository.saveActionWithRelations — deduplikacja spraw JRWA", () => {
    it("podpina istniejącą sprawę JRWA zamiast rzucać błąd UNIQUE constraint przy powtórnym zapisie", async () => {
      const db = createInMemoryDb();
      await migrateDatabase(db);
      const repo = new SqliteActionsRepository(db);

      const autoCreateJrwa = {
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 1,
        year: 2026,
        fullCaseSign: "OZiPZ.966.1.1.2026",
      };

      // 1. Zapis pierwszej akcji z auto-tworzeniem sprawy
      const res1 = await repo.saveActionWithRelations({
        action: {
          title: "Akcja 1",
          actionType: "Prelekcja (warsztat)",
          date: "2026-02-01",
          facilityName: "SP 1",
          municipality: "Myślibórz",
          topic: "Zdrowie",
          audienceGroup: "uczniowie",
          leadEducator: "Jan Kowalski",
          participantsCount: 25,
          materialsDistributedCount: 0,
          ezdStatus: "w_ezd",
          status: "wykonane",
          jrwaSign: "OZiPZ.966.1.1.2026",
        },
        autoCreateJrwa,
      });

      expect(res1.jrwaCase).toBeDefined();
      expect(res1.jrwaCase?.id).toBeDefined();
      expect(res1.action.jrwaCaseId).toBe(res1.jrwaCase?.id);

      // 2. Zapis drugiej akcji z tym samym znakiem sprawy (np. druga prelekcja w ramach tej samej sprawy)
      const res2 = await repo.saveActionWithRelations({
        action: {
          title: "Akcja 2",
          actionType: "Prelekcja (warsztat)",
          date: "2026-02-02",
          facilityName: "SP 1",
          municipality: "Myślibórz",
          topic: "Zdrowie",
          audienceGroup: "uczniowie",
          leadEducator: "Jan Kowalski",
          participantsCount: 30,
          materialsDistributedCount: 0,
          ezdStatus: "w_ezd",
          status: "wykonane",
          jrwaSign: "OZiPZ.966.1.1.2026",
        },
        autoCreateJrwa,
      });

      // Powinno podpiąć tę samą sprawę bez rzucenia błędu UNIQUE i bez duplikacji w bazie
      expect(res2.jrwaCase?.id).toBe(res1.jrwaCase?.id);
      expect(res2.action.jrwaCaseId).toBe(res1.jrwaCase?.id);

      const allCases = await db.select<{ id: string }[]>("SELECT id FROM ozipz_jrwa_cases WHERE full_case_sign = 'OZiPZ.966.1.1.2026'");
      expect(allCases).toHaveLength(1);
    });
  });
});
