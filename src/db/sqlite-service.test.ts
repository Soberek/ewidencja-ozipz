import { describe, it, expect, vi } from "vitest";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import type { ISqlDatabase, ActionSqlRow, ISqlQueryResult } from "./types";

describe("SqliteDatabaseService", () => {
  it("pobiera działania edukacyjne i mapuje wiersze", async () => {
    const mockRow: ActionSqlRow = {
      id: "act-1",
      title: "Warsztat profilaktyczny",
      action_type: "warsztat",
      date: "2026-05-10",
      facility_id: "fac-1",
      facility_name: "Szkoła Podstawowa nr 1",
      municipality: "Miasto",
      program_id: "prog-1",
      program_name: "Program Zdrowie",
      topic: "zywienie_i_aktywnosc",
      audience_group: "uczniowie",
      participants_count: 25,
      materials_distributed_count: 20,
      lead_educator: "Jan Kowalski",
      notes: "Udane spotkanie",
      created_at: "2026-05-10T10:00:00Z",
      updated_at: "2026-05-10T10:00:00Z",
    };

    const mockDb: ISqlDatabase = {
      select: vi.fn().mockResolvedValue([mockRow]),
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
    };

    const service = new SqliteDatabaseService(mockDb);
    const actions = await service.getActions();

    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Warsztat profilaktyczny");
    expect(actions[0].leadEducator).toBe("Jan Kowalski");
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("dodaje nowe działanie edukacyjne z wygenerowanym ID", async () => {
    const mockDb: ISqlDatabase = {
      select: vi.fn().mockResolvedValue([]),
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
    };

    const service = new SqliteDatabaseService(mockDb);
    const created = await service.addAction({
      title: "Prelekcja o higienie",
      actionType: "prelekcja",
      date: "2026-06-01",
      facilityName: "Przedszkole Miejskie",
      municipality: "Gmina",
      topic: "higiena",
      audienceGroup: "Dzieci przedszkolne",
      participantsCount: 40,
      materialsDistributedCount: 0,
      leadEducator: "Anna Nowak",
      status: "wykonane",
      ezdStatus: "w_ezd",
    });

    expect(created.title).toBe("Prelekcja o higienie");
    expect(created.id).toMatch(/^act-\d+/);
    expect(mockDb.execute).toHaveBeenCalled();
  });

  it("pobiera podsumowanie aktywności placówki", async () => {
    const mockDb: ISqlDatabase = {
      select: vi.fn().mockImplementation((query: string) => {
        if (query.includes("v_ozipz_facility_overview")) {
          return Promise.resolve([
            {
              facility_id: "fac-123",
              facility_name: "LO nr 1",
              programs_count: 2,
              actions_count: 5,
              total_pupils_reached: 150,
              total_materials_received: 80,
              last_action_date: "2026-05-12",
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      execute: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
    };

    const service = new SqliteDatabaseService(mockDb);
    const summary = await service.getFacilityActivitySummary("fac-123");

    expect(summary.facilityId).toBe("fac-123");
    expect(summary.facilityName).toBe("LO nr 1");
    expect(summary.programsCount).toBe(2);
    expect(summary.actionsCount).toBe(5);
    expect(summary.totalPupilsReached).toBe(150);
    expect(summary.totalMaterialsReceived).toBe(80);
    expect(summary.lastActionDate).toBe("2026-05-12");
  });

  it("pobiera cele miesięczne z bazy i mapuje wiersze", async () => {
    const mockDb: ISqlDatabase = {
      select: vi.fn().mockResolvedValue([
        {
          id: "mt-2026-1",
          year: 2026,
          month: 1,
          program_actions: 5,
          program_recipients: 120,
          other_actions: 2,
          other_recipients: 50,
          notes: "Plan na styczeń",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]),
      execute: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
    };

    const service = new SqliteDatabaseService(mockDb);
    const targets = await service.getMonthlyTargets(2026);

    expect(targets).toHaveLength(1);
    expect(targets[0].year).toBe(2026);
    expect(targets[0].month).toBe(1);
    expect(targets[0].programActions).toBe(5);
    expect(targets[0].programRecipients).toBe(120);
    expect(targets[0].otherActions).toBe(2);
    expect(targets[0].otherRecipients).toBe(50);
    expect(targets[0].notes).toBe("Plan na styczeń");
    expect(mockDb.select).toHaveBeenCalledWith(
      expect.stringContaining("WHERE year = $1"),
      [2026]
    );
  });

  it("zapisuje cele miesięczne w transakcji z UPSERT", async () => {
    const executedQueries: string[] = [];
    const mockDb: ISqlDatabase = {
      select: vi.fn().mockResolvedValue([]),
      execute: vi.fn().mockImplementation((query: string) => {
        executedQueries.push(query);
        return Promise.resolve({ rowsAffected: 1 });
      }),
    };

    const service = new SqliteDatabaseService(mockDb);
    const yearlyMap = {
      1: { month: 1, programActions: 10, programRecipients: 200, otherActions: 3, otherRecipients: 80, notes: "Uwaga" },
    };

    await service.saveMonthlyTargets(2026, yearlyMap);

    expect(executedQueries[0]).toBe("BEGIN TRANSACTION;");
    expect(executedQueries.some((q) => q.includes("INSERT INTO ozipz_monthly_targets"))).toBe(true);
    expect(executedQueries.some((q) => q.includes("ON CONFLICT(year, month) DO UPDATE SET"))).toBe(true);
    expect(executedQueries[executedQueries.length - 1]).toBe("COMMIT;");
  });

  it("initTables jest w pełni idempotentne i nie rzuca błędu 'duplicate column name' przy ponownym uruchomieniu", async () => {
    const { DatabaseSync } = await import("node:sqlite");
    const rawDb = new DatabaseSync(":memory:");

    const db: ISqlDatabase = {
      async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
        const normalizedSql = query.replace(/\$\d+/g, "?");
        const stmt = rawDb.prepare(normalizedSql);
        const params = bindValues || [];
        const rows = (stmt.all as (...args: unknown[]) => unknown[])(...params);
        return rows as unknown as T;
      },
      async execute(query: string, bindValues?: unknown[]): Promise<ISqlQueryResult> {
        const params = bindValues || [];
        if (params.length === 0) {
          rawDb.exec(query);
          return { rowsAffected: 0 };
        }
        const normalizedSql = query.replace(/\$\d+/g, "?");
        const stmt = rawDb.prepare(normalizedSql);
        const result = (stmt.run as (...args: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint })(...params);
        return {
          rowsAffected: Number(result.changes),
          lastInsertId: Number(result.lastInsertRowid),
        };
      },
    };

    // Pierwsze uruchomienie initTables
    await expect(initTables(db)).resolves.not.toThrow();

    // Drugie uruchomienie initTables na istniejących tabelach i kolumnach
    await expect(initTables(db)).resolves.not.toThrow();

    // Trzecie uruchomienie initTables
    await expect(initTables(db)).resolves.not.toThrow();

    // Weryfikacja obecności kolumny municipality w ozipz_contacts
    const cols = await db.select<{ name: string }[]>("PRAGMA table_info(ozipz_contacts);");
    expect(cols.some((c) => c.name === "municipality")).toBe(true);
  });
});
