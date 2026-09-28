import { describe, it, expect, beforeEach, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase, ISqlQueryResult } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import { SqliteActionsRepository } from "./repositories/sqlite/sqlite-actions.repository";
import { SqliteFacilitiesRepository } from "./repositories/sqlite/sqlite-facilities.repository";
import { SqliteMonthlyTargetsRepository } from "./repositories/sqlite/sqlite-monthly-targets.repository";
import { SqliteJrwaRepository } from "./repositories/sqlite/sqlite-jrwa.repository";
import { SqliteScheduleRepository } from "./repositories/sqlite/sqlite-schedule.repository";
import type { OzipzFacility } from "../features/ozipz/types/ozipz.types";
import type { OzipzYearlyMonthlyTargets } from "../features/ozipz/utils/monthlyTargetsUtils";

/**
 * Real SQLite adapter wrapping node:sqlite DatabaseSync to ISqlDatabase.
 * Executes genuine SQLite SQL statements in memory with PRAGMA foreign_keys = ON.
 */
function createInMemorySqlite(): ISqlDatabase {
  const rawDb = new DatabaseSync(":memory:");
  rawDb.exec("PRAGMA foreign_keys = ON;");

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

  return db;
}

describe("Empirical Challenger: SQLite Multi-Table Transactions", () => {
  let db: ISqlDatabase;
  let service: SqliteDatabaseService;

  beforeEach(async () => {
    db = createInMemorySqlite();
    await initTables(db);
    service = new SqliteDatabaseService(db);
  });

  it("retains the distribution record after deleting its action", async () => {
    const action = await service.addAction({
      title: "Działanie z rozdzielnikiem",
      actionType: "Prelekcja",
      date: "2026-09-26",
      facilityName: "Szkoła",
      municipality: "Myślibórz",
      topic: "Zdrowie",
      audienceGroup: "Uczniowie",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 20,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
    });
    const distribution = await service.addDistribution({
      materialTitle: "Ulotka",
      recipientName: "Szkoła",
      actionId: action.id,
      actionTitle: action.title,
      quantity: 20,
      distributionDate: action.date,
      assignedEducator: "Jan",
      purpose: "Przekazanie podczas działania",
    });

    await service.deleteAction(action.id);

    const retained = (await service.getDistributions()).find((item) => item.id === distribution.id);
    expect(retained).toBeDefined();
    expect(retained?.actionId).toBeUndefined();
    expect(retained?.actionTitle).toBeUndefined();
    expect(retained?.quantity).toBe(20);
  });

  it("moves and clears a schedule link without replacing unchanged distribution metadata", async () => {
    const first = await service.addScheduleEvent({
      title: "Pierwszy termin", eventDate: "2026-09-26", location: "Szkoła", status: "done", responsiblePerson: "Jan",
    });
    const second = await service.addScheduleEvent({
      title: "Drugi termin", eventDate: "2026-09-26", location: "Szkoła", status: "zaplanowane", responsiblePerson: "Jan",
    });
    const action = await service.addAction({
      title: "Działanie testowe", actionType: "Prelekcja", date: "2026-09-26",
      facilityName: "Szkoła", municipality: "Myślibórz", topic: "Zdrowie", audienceGroup: "Uczniowie",
      participantsCount: 20, indirectRecipientsCount: 0, materialsDistributedCount: 20,
      leadEducator: "Jan", ezdStatus: "w_ezd", status: "wykonane", scheduleEventId: first.id,
    });
    await service.updateScheduleEvent(first.id, { actionId: action.id });
    const distribution = await service.addDistribution({
      materialTitle: "Ulotka", recipientName: "Szkoła", actionId: action.id, actionTitle: action.title,
      quantity: 20, distributionDate: action.date, assignedEducator: "Jan", purpose: "Pierwotny cel", notes: "Zachować notatkę",
    });

    await service.updateActionWithRelations(action.id, { scheduleEventId: second.id, title: "Nowy tytuł" },
      [{ materialId: "", title: "Ulotka", quantity: 20 }]);
    let schedules = await service.getScheduleEvents();
    expect(schedules.find((item) => item.id === first.id)?.actionId).toBeUndefined();
    expect(schedules.find((item) => item.id === first.id)?.status).toBe("zaplanowane");
    expect(schedules.find((item) => item.id === second.id)).toMatchObject({ actionId: action.id, status: "done" });
    expect((await service.getActions()).find((item) => item.id === action.id)?.scheduleEventId).toBe(second.id);
    expect((await service.getDistributions()).find((item) => item.id === distribution.id)).toMatchObject({
      id: distribution.id, createdAt: distribution.createdAt, notes: "Zachować notatkę", actionTitle: "Nowy tytuł",
    });

    await service.updateActionWithRelations(action.id, { scheduleEventId: undefined });
    schedules = await service.getScheduleEvents();
    expect(schedules.find((item) => item.id === second.id)?.actionId).toBeUndefined();
    expect(schedules.find((item) => item.id === second.id)?.status).toBe("zaplanowane");
    expect((await service.getActions()).find((item) => item.id === action.id)?.scheduleEventId).toBeUndefined();
  });

  it("keeps duplicate material records and their notes when only one quantity changes", async () => {
    const materialA = await service.addMaterial({ title: "Ulotka A", materialType: "ulotka", topic: "Zdrowie", publisher: "PSSE" });
    const materialB = await service.addMaterial({ title: "Plakat B", materialType: "plakat", topic: "Zdrowie", publisher: "PSSE" });
    const action = await service.addAction({
      title: "Działanie testowe", actionType: "Prelekcja", date: "2026-09-26",
      facilityName: "Szkoła", municipality: "Myślibórz", topic: "Zdrowie", audienceGroup: "Uczniowie",
      participantsCount: 20, indirectRecipientsCount: 0, materialsDistributedCount: 18,
      leadEducator: "Jan", ezdStatus: "w_ezd", status: "wykonane",
    });
    const add = (quantity: number, notes: string) => service.addDistribution({
      materialId: materialA.id, materialTitle: materialA.title, recipientName: "Szkoła",
      actionId: action.id, quantity, distributionDate: action.date, assignedEducator: "Jan",
      purpose: "Przekazanie", notes,
    });
    const first = await add(5, "Pierwszy rozdzielnik");
    const second = await add(10, "Drugi rozdzielnik");

    await service.updateActionWithRelations(action.id, { title: "Nowy tytuł" }, [
      { materialId: materialA.id, title: materialA.title, quantity: 5 },
      { materialId: materialA.id, title: materialA.title, quantity: 12 },
      { materialId: materialB.id, title: materialB.title, quantity: 3 },
    ]);

    const updated = (await service.getDistributions()).filter((item) => item.actionId === action.id);
    expect(updated).toHaveLength(3);
    expect(updated.find((item) => item.id === first.id)).toMatchObject({
      quantity: 5, notes: first.notes, createdAt: first.createdAt,
    });
    expect(updated.find((item) => item.id === second.id)).toMatchObject({
      quantity: 12, notes: second.notes, createdAt: second.createdAt,
    });
    expect(updated.find((item) => item.materialId === materialB.id)).toMatchObject({ quantity: 3 });
  });

  it("does not let create or update take another action's schedule event", async () => {
    const schedule = await service.addScheduleEvent({
      title: "Zajęty termin", eventDate: "2026-09-26", location: "Szkoła", status: "zaplanowane", responsiblePerson: "Jan",
    });
    const input = {
      title: "Działanie testowe", actionType: "Prelekcja", date: "2026-09-26",
      facilityName: "Szkoła", municipality: "Myślibórz", topic: "Zdrowie", audienceGroup: "Uczniowie",
      participantsCount: 20, indirectRecipientsCount: 0, materialsDistributedCount: 0,
      leadEducator: "Jan", ezdStatus: "w_ezd", status: "wykonane",
    };
    const owner = await service.addAction({ ...input, scheduleEventId: schedule.id });
    await service.updateScheduleEvent(schedule.id, { actionId: owner.id, status: "done" });
    const other = await service.addAction({ ...input, title: "Drugie działanie" });
    const before = {
      actions: await service.getActions(),
      jrwa: await service.getJrwaCases(),
      schedules: await service.getScheduleEvents(),
      distributions: await service.getDistributions(),
    };

    await expect(service.saveActionWithRelations({
      action: { ...input, title: "Nowe działanie", scheduleEventId: schedule.id },
      autoCreateJrwa: { section: "OZ", jrwaSymbol: "966.1", caseNumber: 99999, year: 2026, fullCaseSign: "OZ.966.1.99999.2026" },
    })).rejects.toThrow("powiązane z innym działaniem");
    await expect(service.updateActionWithRelations(other.id, { title: "Przejęcie", scheduleEventId: schedule.id }))
      .rejects.toThrow("powiązane z innym działaniem");

    expect(await service.getActions()).toEqual(before.actions);
    expect(await service.getJrwaCases()).toEqual(before.jrwa);
    expect(await service.getScheduleEvents()).toEqual(before.schedules);
    expect(await service.getDistributions()).toEqual(before.distributions);
  });

  it("rejects relation changes for a missing action without creating distributions", async () => {
    const schedule = await service.addScheduleEvent({
      title: "Wolny termin", eventDate: "2026-09-26", location: "Szkoła",
      status: "zaplanowane", responsiblePerson: "Jan",
    });
    const distributions = await service.getDistributions();

    await expect(service.updateActionWithRelations("missing-action", { scheduleEventId: schedule.id },
      [{ materialId: "", title: "Ulotka", quantity: 1 }])).rejects.toThrow();

    expect(await service.getDistributions()).toEqual(distributions);
    expect((await service.getScheduleEvents()).find((item) => item.id === schedule.id)?.actionId).toBeUndefined();
  });

  it("enforces a closed month for action creation, edits, moves and deletion", async () => {
    const input = {
      title: "Działanie testowe", actionType: "Prelekcja", date: "2026-08-20",
      facilityName: "Szkoła", municipality: "Myślibórz", topic: "Zdrowie", audienceGroup: "Uczniowie",
      participantsCount: 20, indirectRecipientsCount: 0, materialsDistributedCount: 0,
      leadEducator: "Jan", ezdStatus: "w_ezd", status: "wykonane",
    };
    const lockedAction = await service.addAction(input);
    const openAction = await service.addAction({ ...input, title: "Inny miesiąc", date: "2026-07-20" });
    const before = await service.getActions();
    await service.setMonthClosed("2026-08", true);

    await expect(service.addAction({ ...input, title: "Nowe działanie" })).rejects.toThrow(/zamknięt/);
    await expect(service.updateAction(lockedAction.id, { title: "Zmienione" })).rejects.toThrow(/zamknięt/);
    await expect(service.updateActionWithRelations(lockedAction.id, { title: "Zmienione" })).rejects.toThrow(/zamknięt/);
    await expect(service.updateAction(openAction.id, { date: "2026-08-21" })).rejects.toThrow(/zamknięt/);
    await expect(service.deleteAction(lockedAction.id)).rejects.toThrow(/zamknięt/);
    expect(await service.getActions()).toEqual(before);

    await service.setMonthClosed("2026-08", false);
    await service.updateAction(lockedAction.id, { title: "Zmienione po odblokowaniu" });
    await service.deleteAction(lockedAction.id);
    expect((await service.getActions()).some((action) => action.id === lockedAction.id)).toBe(false);
  });

  it("imports a legacy month lock once and never re-locks it after an unlock", async () => {
    const previous = localStorage.getItem("oz.closedMonths");
    localStorage.setItem("oz.closedMonths", '["2026-09", "bad"]');
    try {
      const freshDb = createInMemorySqlite();
      await initTables(freshDb);
      const freshService = new SqliteDatabaseService(freshDb);
      expect(await freshService.getClosedMonths()).toEqual(["2026-09"]);
      expect(localStorage.getItem("oz.closedMonths")).toBeNull();

      await initTables(freshDb);
      expect(await freshService.getClosedMonths()).toEqual(["2026-09"]);

      await freshService.setMonthClosed("2026-09", false);
      localStorage.setItem("oz.closedMonths", '["2026-09"]');
      await initTables(freshDb);
      expect(await freshService.getClosedMonths()).toEqual([]);
    } finally {
      if (previous === null) localStorage.removeItem("oz.closedMonths");
      else localStorage.setItem("oz.closedMonths", previous);
    }
  });

  it("reinitializes with a saved action in a closed month", async () => {
    const action = await service.addAction({
      title: "Zapisane działanie",
      actionType: "prelekcja",
      date: "2026-09-20",
      facilityName: "Szkoła",
      municipality: "Myślibórz",
      topic: "Zdrowie",
      audienceGroup: "Uczniowie",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
    });
    await db.execute("UPDATE ozipz_actions SET action_type = 'prelekcja' WHERE id = $1", [action.id]);
    await service.setMonthClosed("2026-09", true);

    await initTables(db);

    expect(await service.getClosedMonths()).toEqual(["2026-09"]);
    expect(await db.select<Array<{ action_type: string }>>("SELECT action_type FROM ozipz_actions WHERE id = $1", [action.id]))
      .toEqual([{ action_type: "prelekcja" }]);
  });

  describe("Transaction 1: saveActionWithRelations", () => {
    it("empirically commits all relations (Action, JRWA, Schedule, Distribution) with 2-way links in real SQLite", async () => {
      // 1. Setup prerequisite records
      const fac = await service.addFacility({
        name: "Szkoła Podstawowa w Dębnie",
        type: "szkola_podstawowa",
        address: "ul. Szkolna 1",
        city: "Dębno",
        postalCode: "74-400",
        municipality: "Dębno",
        county: "myśliborski",
        leadingAuthority: "Gmina Dębno",
        isComplex: false,
      });

      const sch = await service.addScheduleEvent({
        title: "Warsztaty Zdrowy Uśmiech",
        eventDate: "2026-06-10",
        category: "warsztaty",
        location: fac.name,
        facilityId: fac.id,
        status: "zaplanowane",
        responsiblePerson: "Krzysztof Palpuchowski",
      });

      const mat = await service.addMaterial({
        title: "Broszura Higiena Jamy Ustnej",
        materialType: "broszura",
        topic: "higiena",
        publisher: "GIS",
      });

      // 2. Execute saveActionWithRelations
      const result = await service.saveActionWithRelations({
        action: {
          title: "Warsztaty Zdrowy Uśmiech w Dębnie",
          actionType: "Prelekcja (warsztat)",
          date: "2026-06-10",
          facilityId: fac.id,
          facilityName: fac.name,
          municipality: fac.municipality,
          topic: "higiena",
          audienceGroup: "uczniowie_sp",
          participantsCount: 45,
          scheduleEventId: sch.id,
          leadEducator: "Krzysztof Palpuchowski",
          ezdStatus: "w_ezd",
          status: "wykonane",
          indirectRecipientsCount: 0,
          materialsDistributedCount: 45,
        },
        autoCreateJrwa: {
          section: "OZ",
          jrwaSymbol: "9010",
          caseNumber: 42,
          year: 2026,
          fullCaseSign: "OZiPZ.9010.42.2026",
        },
        distributionMaterial: {
          materialId: mat.id,
          title: mat.title,
          type: mat.materialType,
          quantity: 45,
        },
      });

      // 3. Verify returned payload
      expect(result.action).toBeDefined();
      expect(result.action.id).toMatch(/^act-\d+/);
      expect(result.jrwaCase).toBeDefined();
      expect(result.distribution).toBeDefined();
      expect(result.action.jrwaCaseId).toBe(result.jrwaCase!.id);

      // 4. Verify SQLite state directly via SQL select
      const actionRows = await db.select<{ jrwa_case_id: string; schedule_event_id: string }[]>("SELECT * FROM ozipz_actions WHERE id = $1", [result.action.id]);
      expect(actionRows).toHaveLength(1);
      expect(actionRows[0].jrwa_case_id).toBe(result.jrwaCase!.id);
      expect(actionRows[0].schedule_event_id).toBe(sch.id);

      const jrwaRows = await db.select<{ action_id: string; full_case_sign: string }[]>("SELECT * FROM ozipz_jrwa_cases WHERE id = $1", [result.jrwaCase!.id]);
      expect(jrwaRows).toHaveLength(1);
      expect(jrwaRows[0].action_id).toBe(result.action.id);
      expect(jrwaRows[0].full_case_sign).toBe("OZiPZ.9010.42.2026");

      const schRows = await db.select<{ status: string; action_id: string }[]>("SELECT * FROM ozipz_schedule WHERE id = $1", [sch.id]);
      expect(schRows).toHaveLength(1);
      expect(schRows[0].status).toBe("done");
      expect(schRows[0].action_id).toBe(result.action.id);

      const distRows = await db.select<{ material_id: string; quantity: number }[]>("SELECT * FROM ozipz_distributions WHERE action_id = $1", [result.action.id]);
      expect(distRows).toHaveLength(1);
      expect(distRows[0].material_id).toBe(mat.id);
      expect(distRows[0].quantity).toBe(45);
    });

    it("empirically rolls back JRWA and Action when an error occurs during distribution insertion", async () => {
      // Mock materials repo to fail during distribution creation
      const mockMaterialsRepo = {
        getMaterials: vi.fn().mockResolvedValue([]),
        addMaterial: vi.fn(),
        updateMaterial: vi.fn(),
        deleteMaterial: vi.fn(),
        getDistributions: vi.fn().mockResolvedValue([]),
        addDistribution: vi.fn().mockRejectedValue(new Error("FATAL_DISTRIBUTION_ERROR")),
        updateDistribution: vi.fn(),
        deleteDistribution: vi.fn(),
      };

      const customActionsRepo = new SqliteActionsRepository(
        db,
        new SqliteJrwaRepository(db),
        new SqliteScheduleRepository(db),
        mockMaterialsRepo
      );

      const sch = await service.addScheduleEvent({
        title: "Wydarzenie do wycofania",
        eventDate: "2026-07-01",
        category: "warsztaty",
        location: "Myślibórz",
        status: "zaplanowane",
        responsiblePerson: "Anna",
      });

      const fullCaseSign = "OZiPZ.9010.999.2026";

      // Execute and expect failure
      await expect(
        customActionsRepo.saveActionWithRelations({
          action: {
            title: "Akcja z błędem w rozdzielniku",
            actionType: "Prelekcja (warsztat)",
            date: "2026-07-01",
            facilityName: "Szkoła",
            municipality: "Myślibórz",
            topic: "zdrowie",
            audienceGroup: "uczniowie",
            participantsCount: 20,
            indirectRecipientsCount: 0,
            ezdStatus: "w_ezd",
            status: "wykonane",
            scheduleEventId: sch.id,
            leadEducator: "Anna",
            materialsDistributedCount: 10,
          },
          autoCreateJrwa: {
            section: "OZ",
            jrwaSymbol: "9010",
            caseNumber: 999,
            year: 2026,
            fullCaseSign,
          },
          distributionMaterial: {
            materialId: "mat-dummy",
            title: "Ulotka",
            quantity: 10,
          },
        })
      ).rejects.toThrow("FATAL_DISTRIBUTION_ERROR");

      // Verify EMPIRICALLY that nothing leaked into SQLite:
      // 1. JRWA Case must NOT exist
      const jrwaCheck = await db.select<unknown[]>("SELECT * FROM ozipz_jrwa_cases WHERE full_case_sign = $1", [fullCaseSign]);
      expect(jrwaCheck).toHaveLength(0);

      // 2. Action must NOT exist
      const actionCheck = await db.select<unknown[]>("SELECT * FROM ozipz_actions WHERE title = 'Akcja z błędem w rozdzielniku'");
      expect(actionCheck).toHaveLength(0);

      // 3. Schedule event must NOT be modified
      const schCheck = await db.select<{ status: string; action_id: string | null }[]>("SELECT * FROM ozipz_schedule WHERE id = $1", [sch.id]);
      expect(schCheck[0].status).toBe("zaplanowane");
      expect(schCheck[0].action_id).toBeNull();

      // 4. Distributions must NOT exist
      const distCheck = await db.select<unknown[]>("SELECT * FROM ozipz_distributions WHERE action_title = 'Akcja z błędem w rozdzielniku'");
      expect(distCheck).toHaveLength(0);
    });

    it("empirically rolls back if JRWA Case creation fails with UNIQUE constraint violation", async () => {
      // Create initial JRWA case
      await service.addJrwaCase({
        section: "OZ",
        jrwaSymbol: "9010",
        caseNumber: 10,
        year: 2026,
        fullCaseSign: "OZiPZ.9010.10.2026",
        title: "Istniejąca sprawa",
        status: "w_toku",
        assignedEducator: "Jan",
      });

      // Try to saveActionWithRelations with exact same fullCaseSign (triggers UNIQUE constraint in SQLite)
      await expect(
        service.saveActionWithRelations({
          action: {
            title: "Akcja z duplikatem JRWA",
            actionType: "Prelekcja (warsztat)",
            date: "2026-07-01",
            facilityName: "Szkoła",
            municipality: "Myślibórz",
            topic: "zdrowie",
            audienceGroup: "uczniowie",
            participantsCount: 20,
            indirectRecipientsCount: 0,
            materialsDistributedCount: 0,
            ezdStatus: "w_ezd",
            status: "wykonane",
            leadEducator: "Jan",
          },
          autoCreateJrwa: {
            section: "OZ",
            jrwaSymbol: "9010",
            caseNumber: 10,
            year: 2026,
            fullCaseSign: "OZ.9010.10.2026.conflict",
          },
        })
      ).rejects.toThrow();

      // Ensure no orphan action was inserted
      const actionCheck = await db.select<unknown[]>("SELECT * FROM ozipz_actions WHERE title = 'Akcja z duplikatem JRWA'");
      expect(actionCheck).toHaveLength(0);
    });
  });

  describe("Transaction 2: batchUpsertFacilities", () => {
    it("empirically upserts multiple facilities atomically in real SQLite", async () => {
      const facilities: OzipzFacility[] = [
        {
          id: "fac-batch-1",
          name: "Szkoła Podstawowa nr 1",
          type: "szkola_podstawowa",
          address: "ul. 1 Maja 1",
          city: "Myślibórz",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Gmina Myślibórz",
          isComplex: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "fac-batch-2",
          name: "Szkoła Podstawowa nr 2",
          type: "szkola_podstawowa",
          address: "ul. 1 Maja 2",
          city: "Myślibórz",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Gmina Myślibórz",
          isComplex: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ];

      const upserted = await service.batchUpsertFacilities(facilities);
      expect(upserted.some((f) => f.id === "fac-batch-1")).toBe(true);
      expect(upserted.some((f) => f.id === "fac-batch-2")).toBe(true);

      // Verify in DB directly
      const rows = await db.select<{ id: string; name: string }[]>("SELECT id, name FROM ozipz_facilities WHERE id IN ('fac-batch-1', 'fac-batch-2')");
      expect(rows).toHaveLength(2);

      // Now update batch-1 and add batch-3
      const updatedFacilities: OzipzFacility[] = [
        {
          ...facilities[0],
          name: "Szkoła Podstawowa nr 1 im. Henryka Sienkiewicza",
          updatedAt: "2026-02-01T00:00:00Z",
        },
        {
          id: "fac-batch-3",
          name: "Przedszkole nr 1",
          type: "przedszkole",
          address: "ul. Parkowa 3",
          city: "Myślibórz",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Gmina Myślibórz",
          isComplex: false,
          createdAt: "2026-02-01T00:00:00Z",
          updatedAt: "2026-02-01T00:00:00Z",
        },
      ];

      await service.batchUpsertFacilities(updatedFacilities);

      const updatedRow = await db.select<{ name: string }[]>("SELECT name FROM ozipz_facilities WHERE id = 'fac-batch-1'");
      expect(updatedRow[0].name).toBe("Szkoła Podstawowa nr 1 im. Henryka Sienkiewicza");

      const newRow = await db.select<{ name: string }[]>("SELECT name FROM ozipz_facilities WHERE id = 'fac-batch-3'");
      expect(newRow[0].name).toBe("Przedszkole nr 1");
    });

    it("empirically rolls back all facilities in batch if any facility insertion fails", async () => {
      // Mock db.execute to fail on the second item
      let callCount = 0;
      const originalExecute = db.execute.bind(db);

      const spyDb: ISqlDatabase = {
        select: db.select.bind(db),
        execute: async (sql: string, params?: unknown[]) => {
          if (sql.includes("INTO ozipz_facilities")) {
            callCount++;
            if (callCount === 2) {
              throw new Error("SIMULATED_FACILITY_BATCH_FAILURE");
            }
          }
          return originalExecute(sql, params);
        },
      };

      const failingRepo = new SqliteFacilitiesRepository(spyDb);

      const batch: OzipzFacility[] = [
        {
          id: "fac-roll-1",
          name: "Placówka Pierwsza",
          type: "inna",
          address: "ul. A",
          city: "Myślibórz",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Gmina",
          isComplex: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "fac-roll-2",
          name: "Placówka Druga",
          type: "inna",
          address: "ul. B",
          city: "Myślibórz",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Gmina",
          isComplex: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ];

      await expect(failingRepo.batchUpsertFacilities(batch)).rejects.toThrow("SIMULATED_FACILITY_BATCH_FAILURE");

      // Verify that fac-roll-1 was NOT committed due to transaction ROLLBACK!
      const check = await db.select<unknown[]>("SELECT * FROM ozipz_facilities WHERE id IN ('fac-roll-1', 'fac-roll-2')");
      expect(check).toHaveLength(0);
    });
  });

  describe("Transaction 3: saveMonthlyTargets", () => {
    it("empirically saves all 12 monthly targets atomically using ON CONFLICT DO UPDATE", async () => {
      const yearlyMap: OzipzYearlyMonthlyTargets = {
        1: { month: 1, programActions: 10, programRecipients: 200, otherActions: 2, otherRecipients: 50, notes: "Styczeń" },
        2: { month: 2, programActions: 8, programRecipients: 150, otherActions: 3, otherRecipients: 60, notes: "Luty" },
        6: { month: 6, programActions: 15, programRecipients: 300, otherActions: 5, otherRecipients: 100, notes: "Czerwiec" },
      };

      const saved = await service.saveMonthlyTargets(2026, yearlyMap);
      expect(saved).toHaveLength(12);

      const m1 = saved.find((s) => s.month === 1);
      expect(m1?.programActions).toBe(10);
      expect(m1?.programRecipients).toBe(200);

      const m2 = saved.find((s) => s.month === 2);
      expect(m2?.programActions).toBe(8);

      // Unset month 3 should have default 0s
      const m3 = saved.find((s) => s.month === 3);
      expect(m3?.programActions).toBe(0);
      expect(m3?.programRecipients).toBe(0);

      // Verify directly from SQLite table
      const rows = await db.select<{ month: number; program_actions: number }[]>("SELECT * FROM ozipz_monthly_targets WHERE year = 2026 ORDER BY month ASC");
      expect(rows).toHaveLength(12);
      expect(rows[0].month).toBe(1);
      expect(rows[0].program_actions).toBe(10);
      expect(rows[5].month).toBe(6);
      expect(rows[5].program_actions).toBe(15);
    });

    it("empirically updates targets on second call without duplicate row creation", async () => {
      const firstMap: OzipzYearlyMonthlyTargets = {
        5: { month: 5, programActions: 5, programRecipients: 100, otherActions: 1, otherRecipients: 20, notes: "V1" },
      };
      await service.saveMonthlyTargets(2027, firstMap);

      const rowsV1 = await db.select<unknown[]>("SELECT * FROM ozipz_monthly_targets WHERE year = 2027");
      expect(rowsV1).toHaveLength(12);

      const secondMap: OzipzYearlyMonthlyTargets = {
        5: { month: 5, programActions: 25, programRecipients: 500, otherActions: 8, otherRecipients: 150, notes: "V2" },
      };
      await service.saveMonthlyTargets(2027, secondMap);

      const rowsV2 = await db.select<{ month: number; program_actions: number; program_recipients: number; notes: string }[]>("SELECT * FROM ozipz_monthly_targets WHERE year = 2027");
      expect(rowsV2).toHaveLength(12); // No duplicates!

      const m5 = rowsV2.find((r) => r.month === 5);
      expect(m5?.program_actions).toBe(25);
      expect(m5?.program_recipients).toBe(500);
      expect(m5?.notes).toBe("V2");
    });

    it("empirically rolls back monthly targets if error occurs mid-transaction", async () => {
      let monthCounter = 0;
      const originalExecute = db.execute.bind(db);

      const spyDb: ISqlDatabase = {
        select: db.select.bind(db),
        execute: async (sql: string, params?: unknown[]) => {
          if (sql.includes("INSERT INTO ozipz_monthly_targets")) {
            monthCounter++;
            if (monthCounter === 5) {
              throw new Error("SIMULATED_MONTH_5_FAILURE");
            }
          }
          return originalExecute(sql, params);
        },
      };

      const failingRepo = new SqliteMonthlyTargetsRepository(spyDb);

      const yearlyMap: OzipzYearlyMonthlyTargets = {
        1: { month: 1, programActions: 10, programRecipients: 100, otherActions: 0, otherRecipients: 0 },
        2: { month: 2, programActions: 20, programRecipients: 200, otherActions: 0, otherRecipients: 0 },
      };

      await expect(failingRepo.saveMonthlyTargets(2029, yearlyMap)).rejects.toThrow("SIMULATED_MONTH_5_FAILURE");

      // Verify that NO targets for 2029 exist in the database (clean rollback of months 1..4)
      const check = await db.select<unknown[]>("SELECT * FROM ozipz_monthly_targets WHERE year = 2029");
      expect(check).toHaveLength(0);
    });
  });

  describe("Transaction 4: clearAndReseedDefaults & Seed Transaction Integrity", () => {
    it("empirically demonstrates that seedInitialData succeeds under PRAGMA foreign_keys=ON with valid references", async () => {
      // Add custom test action
      await service.addAction({
        title: "Test custom action",
        actionType: "Prelekcja (warsztat)",
        date: "2026-08-01",
        facilityName: "Test Fac",
        municipality: "Myślibórz",
        topic: "higiena",
        audienceGroup: "dzieci",
        participantsCount: 10,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        ezdStatus: "w_ezd",
        status: "wykonane",
        leadEducator: "Tester",
      });

      const actionsBefore = await service.getActions();
      expect(actionsBefore.some((a) => a.title === "Test custom action")).toBe(true);

      // Execute clearAndReseedDefaults
      await service.clearAndReseedDefaults();

      // Custom action was deleted
      const actionsAfter = await service.getActions();
      expect(actionsAfter.some((a) => a.title === "Test custom action")).toBe(false);

      // Successfully re-seeded under PRAGMA foreign_keys=ON without constraint errors!
      const facilities = await service.getFacilities();
      expect(facilities).toHaveLength(89);
    });
  });
});

describe("Action template persistence", () => {
  it("migrates old templates and retains reusable defaults across reads and partial updates", async () => {
    const db = createInMemorySqlite();
    await db.execute("CREATE TABLE ozipz_templates (id TEXT PRIMARY KEY, title TEXT, topic TEXT, action_type TEXT, description_template TEXT, default_audience TEXT, suggested_materials TEXT, created_at TEXT, updated_at TEXT)");
    await db.execute("INSERT INTO ozipz_templates VALUES ('legacy', 'Stary szablon', '', 'Prelekcja', '', '', NULL, '', '')");
    await initTables(db);
    const service = new SqliteDatabaseService(db);
    const actionDefaults = { title: "Higiena rąk", leadEducator: "Anna", campaignId: "Kampania" };
    const saved = await service.addTemplate({ title: "Mój szablon", topic: "higiena", actionType: "Prelekcja", descriptionTemplate: "Opis", defaultAudience: "Uczniowie", actionDefaults });
    await service.updateTemplate(saved.id, { title: "Nowa nazwa" });
    const reloaded = await new SqliteDatabaseService(db).getTemplates();
    expect(reloaded.find((t) => t.id === saved.id)).toMatchObject({ title: "Nowa nazwa", actionDefaults });
    expect(reloaded.find((t) => t.id === "legacy")?.actionDefaults).toBeUndefined();
  });
});
