import { describe, it, expect, beforeEach, vi } from "vitest";
import { FallbackDatabaseService } from "./fallback-service";
import { FallbackActionsRepository } from "./repositories/fallback/fallback-actions.repository";
import { FallbackProgramsRepository } from "./repositories/fallback/fallback-programs.repository";
import { FallbackFacilitiesRepository } from "./repositories/fallback/fallback-facilities.repository";
import { FallbackMaterialsRepository } from "./repositories/fallback/fallback-materials.repository";
import { FallbackScheduleRepository } from "./repositories/fallback/fallback-schedule.repository";
import { FallbackJrwaRepository } from "./repositories/fallback/fallback-jrwa.repository";
import { FallbackDictionariesRepository } from "./repositories/fallback/fallback-dictionaries.repository";
import { FallbackStaffContactsRepository } from "./repositories/fallback/fallback-staff-contacts.repository";
import { FallbackRegistryRepository } from "./repositories/fallback/fallback-registry.repository";
import { FallbackMonthlyTargetsRepository } from "./repositories/fallback/fallback-monthly-targets.repository";
import { loadFromStorage, saveToStorage } from "./repositories/fallback/storage";
import { MIGRATED_FIREBASE_DATA } from "../features/ozipz/data/migratedData";
import type { IJrwaRepository, IScheduleRepository, IMaterialsRepository } from "./repositories/interfaces";

describe("Adversarial Fallback Storage & Repositories Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("1. Storage Layer Edge Cases & Corruption Recovery", () => {
    it("blocks malformed JSON without replacing stored records", () => {
      localStorage.setItem("ozipz_actions", "{ unclosed_json_string: true, corrupt");
      expect(() => loadFromStorage("actions", ["safe_fallback"])).toThrow("Nie można odczytać zapisanych danych");
      expect(localStorage.getItem("ozipz_actions")).toContain("unclosed_json_string");
    });

    it("falls back to default data when localStorage item is null", () => {
      const result = loadFromStorage("non_existent_key", { defaultVal: 123 });
      expect(result).toEqual({ defaultVal: 123 });
    });

    it("preserves a deliberately persisted empty array", () => {
      localStorage.setItem("ozipz_actions", "[]");
      const fallback = [{ id: "seed-1" }];
      const result = loadFromStorage("actions", fallback);
      expect(result).toEqual([]);
    });

    it("returns empty array if both stored data and fallback are empty arrays", () => {
      localStorage.setItem("ozipz_empty_list", "[]");
      const result = loadFromStorage("empty_list", []);
      expect(result).toEqual([]);
    });

    it("reports saveToStorage quota or access errors", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => saveToStorage("test_key", { data: "sample" })).toThrow(
        "Nie udało się zapisać danych w pamięci przeglądarki"
      );
      setItemSpy.mockRestore();
    });
  });

  describe("2. Persistence Across Disjoint Service & Repository Instances", () => {
    it("keeps unrelated localStorage preferences when reseeding OZiPZ data", async () => {
      localStorage.setItem("unrelated_preference", "keep-me");
      localStorage.setItem("ozipz_actions", "[]");

      await new FallbackDatabaseService().clearAndReseedDefaults();

      expect(localStorage.getItem("unrelated_preference")).toBe("keep-me");
      expect(localStorage.getItem("ozipz_actions")).toBeNull();
    });

    it("persists updates made in instance A to new instance B", async () => {
      const serviceA = new FallbackDatabaseService();
      const facility = await serviceA.addFacility({
        name: "Instancja A Szkoła",
        type: "szkola_podstawowa",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Główna 1",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Gmina Myślibórz",
        isComplex: false,
      });

      const serviceB = new FallbackDatabaseService();
      const fetchedB = await serviceB.getFacilities();
      const foundB = fetchedB.find((f) => f.id === facility.id);
      expect(foundB).toBeDefined();
      expect(foundB?.name).toBe("Instancja A Szkoła");

      await serviceB.updateFacility(facility.id, { name: "Zaktualizowana przez B" });

      const serviceC = new FallbackDatabaseService();
      const fetchedC = await serviceC.getFacilities();
      const foundC = fetchedC.find((f) => f.id === facility.id);
      expect(foundC?.name).toBe("Zaktualizowana przez B");
    });

    it("wipes persisted mutations and reseeds defaults on clearAndReseedDefaults", async () => {
      const service = new FallbackDatabaseService();
      const customAction = await service.addAction({
        title: "Tymczasowa akcja",
        actionType: "prelekcja",
        date: "2026-09-01",
        facilityName: "Szkoła",
        municipality: "Barlinek",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        participantsCount: 10,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan",
      });

      expect((await service.getActions()).some((a) => a.id === customAction.id)).toBe(true);

      await service.clearAndReseedDefaults();

      const actionsAfterClear = await service.getActions();
      expect(actionsAfterClear.some((a) => a.id === customAction.id)).toBe(false);
      expect(actionsAfterClear.length).toBe(MIGRATED_FIREBASE_DATA.actions.length);
    });
  });

  describe("3. Dependency Injection & Isolation in FallbackActionsRepository", () => {
    it("uses the local day when an action has no distribution date", async () => {
      const addDistribution = vi.fn().mockResolvedValue({});
      const materials = { addDistribution } as unknown as IMaterialsRepository;
      const repo = new FallbackActionsRepository(undefined, undefined, materials);
      const action = (await repo.getActions())[0]!;
      vi.stubEnv("TZ", "Europe/Warsaw");
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date("2026-01-01T23:30:00Z"));
        await repo.updateActionWithRelations(action.id, { date: "" }, [{ materialId: "m", title: "M", quantity: 1 }]);
        expect(addDistribution).toHaveBeenCalledWith(expect.objectContaining({ distributionDate: "2026-01-02" }));
      } finally {
        vi.useRealTimers();
        vi.unstubAllEnvs();
      }
    });

    it("allows passing mock peer repositories to verify decoupling", async () => {
      const mockJrwaRepo: IJrwaRepository = {
        getJrwaCases: vi.fn().mockResolvedValue([]),
        addJrwaCase: vi.fn().mockResolvedValue({
          id: "mock-jrwa-id",
          fullCaseSign: "MOCK.966.1",
          section: "OZ",
          jrwaSymbol: "966.1",
          caseNumber: 1,
          year: 2026,
          title: "Mock JRWA",
          status: "w_toku",
          assignedEducator: "Test",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        }),
        updateJrwaCase: vi.fn().mockResolvedValue(undefined),
        deleteJrwaCase: vi.fn().mockResolvedValue(undefined),
      };

      const mockScheduleRepo: IScheduleRepository = {
        getScheduleEvents: vi.fn().mockResolvedValue([]),
        addScheduleEvent: vi.fn(),
        updateScheduleEvent: vi.fn().mockResolvedValue(undefined),
        deleteScheduleEvent: vi.fn(),
      };

      const mockMaterialsRepo: IMaterialsRepository = {
        getMaterials: vi.fn().mockResolvedValue([]),
        addMaterial: vi.fn(),
        updateMaterial: vi.fn(),
        deleteMaterial: vi.fn(),
        getDistributions: vi.fn().mockResolvedValue([]),
        addDistribution: vi.fn().mockResolvedValue({
          id: "mock-dist-id",
          materialTitle: "Mock Mat",
          recipientName: "Mock Place",
          quantity: 15,
          distributionDate: "2026-09-01",
          assignedEducator: "Test",
          purpose: "Mock",
          createdAt: "2026-01-01",
        }),
        updateDistribution: vi.fn(),
        deleteDistribution: vi.fn(),
      };

      const actionsRepo = new FallbackActionsRepository(mockJrwaRepo, mockScheduleRepo, mockMaterialsRepo);

      const res = await actionsRepo.saveActionWithRelations({
        action: {
          title: "Akcja z mockami",
          actionType: "Wykład",
          date: "2026-09-05",
          facilityName: "Placówka Mock",
          municipality: "Dębno",
          topic: "Tytoń",
          audienceGroup: "Dorośli",
          participantsCount: 50,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "w_ezd",
          leadEducator: "Edukator",
          scheduleEventId: "sch-123",
        },
        autoCreateJrwa: {
          section: "OZ",
          jrwaSymbol: "966.1",
          caseNumber: 1,
          year: 2026,
          fullCaseSign: "MOCK.966.1",
        },
        distributionMaterials: [{ materialId: "mat-mock", title: "Mock Mat", quantity: 15 }],
      });

      expect(mockJrwaRepo.addJrwaCase).toHaveBeenCalledTimes(1);
      expect(mockJrwaRepo.updateJrwaCase).toHaveBeenCalledWith("mock-jrwa-id", { actionId: res.action.id });
      expect(mockScheduleRepo.updateScheduleEvent).toHaveBeenCalledWith("sch-123", { status: "done", actionId: res.action.id });
      expect(mockMaterialsRepo.addDistribution).toHaveBeenCalledTimes(1);
      expect(res.distribution?.id).toBe("mock-dist-id");
    });

    it("instantiates and queries all standalone fallback repositories independently", async () => {
      const progRepo = new FallbackProgramsRepository();
      const facRepo = new FallbackFacilitiesRepository();
      const matRepo = new FallbackMaterialsRepository();
      const schRepo = new FallbackScheduleRepository();
      const jrwaRepo = new FallbackJrwaRepository();
      const dictRepo = new FallbackDictionariesRepository();
      const staffRepo = new FallbackStaffContactsRepository();
      const regRepo = new FallbackRegistryRepository();
      const targetRepo = new FallbackMonthlyTargetsRepository();

      expect((await progRepo.getPrograms()).length).toBeGreaterThan(0);
      expect((await facRepo.getFacilities()).length).toBeGreaterThan(0);
      expect((await matRepo.getMaterials()).length).toBeGreaterThan(0);
      expect((await schRepo.getScheduleEvents()).length).toBeGreaterThan(0);
      expect((await jrwaRepo.getJrwaCases()).length).toBeGreaterThan(0);
      expect((await dictRepo.getDictionaryItems()).length).toBeGreaterThan(0);
      expect((await staffRepo.getStaff()).length).toBeGreaterThan(0);
      expect(Array.isArray(await regRepo.getRegisters())).toBe(true);
      expect(Array.isArray(await targetRepo.getMonthlyTargets())).toBe(true);
    });
  });

  describe("4. Edge Cases of saveActionWithRelations", () => {
    let service: FallbackDatabaseService;
    beforeEach(() => {
      service = new FallbackDatabaseService();
    });

    it("handles zero-quantity materials correctly without generating empty distributions", async () => {
      const res = await service.saveActionWithRelations({
        action: {
          title: "Akcja bez materiałów fizycznych",
          actionType: "prelekcja",
          date: "2026-09-05",
          facilityName: "Szkoła Podstawowa",
          municipality: "Myślibórz",
          topic: "Higiena",
          audienceGroup: "Dzieci",
          participantsCount: 15,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "w_ezd",
          leadEducator: "Jan",
        },
        distributionMaterials: [
          { materialId: "mat-zero-1", title: "Broszura 0", quantity: 0 },
          { materialId: "mat-zero-2", title: "Plakat 0", quantity: -5 },
        ],
      });

      expect(res.distributions).toEqual([]);
      expect(res.distribution).toBeUndefined();
    });

    it("prefers distributionMaterials array over single legacy distributionMaterial", async () => {
      const res = await service.saveActionWithRelations({
        action: {
          title: "Akcja z oboma typami materiałów",
          actionType: "prelekcja",
          date: "2026-09-05",
          facilityName: "Szkoła Podstawowa",
          municipality: "Myślibórz",
          topic: "Higiena",
          audienceGroup: "Dzieci",
          participantsCount: 15,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "w_ezd",
          leadEducator: "Jan",
        },
        distributionMaterials: [
          { materialId: "m-arr-1", title: "Z tablicy 1", quantity: 10 },
          { materialId: "m-arr-2", title: "Z tablicy 2", quantity: 20 },
        ],
        distributionMaterial: {
          materialId: "m-single",
          title: "Ignorowany pojedynczy",
          quantity: 99,
        },
      });

      expect(res.distributions).toHaveLength(2);
      expect(res.distributions?.map((d) => d.materialTitle)).toEqual(["Z tablicy 1", "Z tablicy 2"]);
      expect(res.distributions?.every((d) => d.actionId === res.action.id)).toBe(true);
    });

    it("falls back to singular distributionMaterial when distributionMaterials is empty", async () => {
      const res = await service.saveActionWithRelations({
        action: {
          title: "Akcja ze starym pojedynczym materiałem",
          actionType: "prelekcja",
          date: "2026-09-05",
          facilityName: "Szkoła Podstawowa",
          municipality: "Myślibórz",
          topic: "Higiena",
          audienceGroup: "Dzieci",
          participantsCount: 15,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "w_ezd",
          leadEducator: "Jan",
        },
        distributionMaterials: [],
        distributionMaterial: {
          materialId: "m-single",
          title: "Użyty pojedynczy",
          quantity: 25,
        },
      });

      expect(res.distributions).toHaveLength(1);
      expect(res.distribution?.materialTitle).toBe("Użyty pojedynczy");
      expect(res.distribution?.quantity).toBe(25);
    });
  });

  describe("Action writes remain atomic when a distribution fails", () => {
    const actionInput = {
      title: "Działanie testowe",
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
    };

    it("rolls back a new action, JRWA case and schedule link", async () => {
      const service = new FallbackDatabaseService();
      const schedule = await service.addScheduleEvent({
        title: "Planowana prelekcja",
        eventDate: actionInput.date,
        location: "Szkoła",
        status: "zaplanowane",
        responsiblePerson: "Jan",
      });
      const before = {
        actions: await service.getActions(),
        jrwa: await service.getJrwaCases(),
        schedules: await service.getScheduleEvents(),
        distributions: await service.getDistributions(),
      };
      const materials = new FallbackMaterialsRepository();
      vi.spyOn(materials, "addDistribution").mockRejectedValue(new Error("distribution failed"));
      const repo = new FallbackActionsRepository(undefined, undefined, materials);

      await expect(repo.saveActionWithRelations({
        action: { ...actionInput, scheduleEventId: schedule.id },
        autoCreateJrwa: {
          section: "OZ",
          jrwaSymbol: "966.1",
          caseNumber: 99999,
          year: 2026,
          fullCaseSign: "OZ.966.1.99999.2026",
        },
        distributionMaterials: [{ materialId: "", title: "Ulotka", quantity: 20 }],
      })).rejects.toThrow("distribution failed");

      expect(await service.getActions()).toEqual(before.actions);
      expect(await service.getJrwaCases()).toEqual(before.jrwa);
      expect(await service.getScheduleEvents()).toEqual(before.schedules);
      expect(await service.getDistributions()).toEqual(before.distributions);
    });

    it("restores the original action, schedule links and distribution with its ID", async () => {
      const service = new FallbackDatabaseService();
      const firstSchedule = await service.addScheduleEvent({
        title: "Pierwszy termin",
        eventDate: actionInput.date,
        location: "Szkoła",
        status: "zaplanowane",
        responsiblePerson: "Jan",
      });
      const nextSchedule = await service.addScheduleEvent({
        title: "Nowy termin",
        eventDate: "2026-09-27",
        location: "Szkoła",
        status: "zaplanowane",
        responsiblePerson: "Jan",
      });
      const action = await service.addAction({ ...actionInput, scheduleEventId: firstSchedule.id });
      await service.updateScheduleEvent(firstSchedule.id, { actionId: action.id, status: "done" });
      const distribution = await service.addDistribution({
        materialTitle: "Stara ulotka",
        recipientName: "Szkoła",
        actionId: action.id,
        actionTitle: action.title,
        quantity: 20,
        distributionDate: action.date,
        assignedEducator: "Jan",
        purpose: "Pierwotne przekazanie",
      });
      const before = {
        actions: await service.getActions(),
        schedules: await service.getScheduleEvents(),
        distributions: await service.getDistributions(),
      };
      const materials = new FallbackMaterialsRepository();
      vi.spyOn(materials, "addDistribution").mockRejectedValue(new Error("distribution failed"));
      const repo = new FallbackActionsRepository(undefined, undefined, materials);

      await expect(repo.updateActionWithRelations(
        action.id,
        { title: "Zmieniony tytuł", scheduleEventId: nextSchedule.id },
        [{ materialId: "", title: "Nowa ulotka", quantity: 30 }]
      )).rejects.toThrow("distribution failed");

      expect(await service.getActions()).toEqual(before.actions);
      expect(await service.getScheduleEvents()).toEqual(before.schedules);
      expect(await service.getDistributions()).toEqual(before.distributions);
      expect((await service.getDistributions()).find((item) => item.id === distribution.id)?.purpose)
        .toBe("Pierwotne przekazanie");
    });

    it("moves and clears a schedule link without replacing unchanged distribution metadata", async () => {
      const service = new FallbackDatabaseService();
      const first = await service.addScheduleEvent({
        title: "Pierwszy termin", eventDate: actionInput.date, location: "Szkoła", status: "done", responsiblePerson: "Jan",
      });
      const second = await service.addScheduleEvent({
        title: "Drugi termin", eventDate: actionInput.date, location: "Szkoła", status: "zaplanowane", responsiblePerson: "Jan",
      });
      const action = await service.addAction({ ...actionInput, scheduleEventId: first.id });
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
      const service = new FallbackDatabaseService();
      const action = await service.addAction(actionInput);
      const add = (quantity: number, notes: string) => service.addDistribution({
        materialId: "material-a", materialTitle: "Ulotka A", recipientName: "Szkoła",
        actionId: action.id, quantity, distributionDate: action.date, assignedEducator: "Jan",
        purpose: "Przekazanie", notes,
      });
      const first = await add(5, "Pierwszy rozdzielnik");
      const second = await add(10, "Drugi rozdzielnik");

      await service.updateActionWithRelations(action.id, { title: "Nowy tytuł" }, [
        { materialId: "material-a", title: "Ulotka A", quantity: 5 },
        { materialId: "material-a", title: "Ulotka A", quantity: 12 },
        { materialId: "material-b", title: "Plakat B", quantity: 3 },
      ]);

      const updated = (await service.getDistributions()).filter((item) => item.actionId === action.id);
      expect(updated).toHaveLength(3);
      expect(updated.find((item) => item.id === first.id)).toMatchObject({
        quantity: 5, notes: first.notes, createdAt: first.createdAt,
      });
      expect(updated.find((item) => item.id === second.id)).toMatchObject({
        quantity: 12, notes: second.notes, createdAt: second.createdAt,
      });
      expect(updated.find((item) => item.materialId === "material-b")).toMatchObject({ quantity: 3 });
    });

    it("does not let create or update take another action's schedule event", async () => {
      const service = new FallbackDatabaseService();
      const schedule = await service.addScheduleEvent({
        title: "Zajęty termin", eventDate: actionInput.date, location: "Szkoła", status: "zaplanowane", responsiblePerson: "Jan",
      });
      const owner = await service.addAction({ ...actionInput, scheduleEventId: schedule.id });
      await service.updateScheduleEvent(schedule.id, { actionId: owner.id, status: "done" });
      const other = await service.addAction({ ...actionInput, title: "Drugie działanie" });
      const before = {
        actions: await service.getActions(),
        jrwa: await service.getJrwaCases(),
        schedules: await service.getScheduleEvents(),
        distributions: await service.getDistributions(),
      };

      await expect(service.saveActionWithRelations({
        action: { ...actionInput, title: "Nowe działanie", scheduleEventId: schedule.id },
        autoCreateJrwa: { section: "OZ", jrwaSymbol: "966.1", caseNumber: 99999, year: 2026, fullCaseSign: "OZ.966.1.99999.2026" },
      })).rejects.toThrow("powiązane z innym działaniem");
      await expect(service.updateActionWithRelations(other.id, { title: "Przejęcie", scheduleEventId: schedule.id }))
        .rejects.toThrow("powiązane z innym działaniem");

      expect(await service.getActions()).toEqual(before.actions);
      expect(await service.getJrwaCases()).toEqual(before.jrwa);
      expect(await service.getScheduleEvents()).toEqual(before.schedules);
      expect(await service.getDistributions()).toEqual(before.distributions);
    });

    it("restores all action relations when publication storage fails during delete", async () => {
      const service = new FallbackDatabaseService();
      const action = await service.addAction(actionInput);
      await service.addDistribution({
        materialTitle: "Ulotka", recipientName: "Szkoła", actionId: action.id,
        quantity: 20, distributionDate: action.date, assignedEducator: "Jan", purpose: "Przekazanie",
      });
      await service.addScheduleEvent({
        title: "Termin", eventDate: action.date, location: "Szkoła", responsiblePerson: "Jan",
        actionId: action.id, status: "done",
      });
      await service.addJrwaCase({
        section: "OZ", jrwaSymbol: "966.1", caseNumber: 99999, year: 2026,
        fullCaseSign: "OZ.966.1.99999.2026", title: "Sprawa", status: "w_toku",
        assignedEducator: "Jan", actionId: action.id,
      });
      await service.addPublication({
        title: "Relacja", channel: "Facebook", publicationDate: action.date,
        topic: "Zdrowie", author: "Jan", actionId: action.id,
      });
      const before = {
        actions: await service.getActions(),
        distributions: await service.getDistributions(),
        schedules: await service.getScheduleEvents(),
        jrwa: await service.getJrwaCases(),
        publications: await service.getPublications(),
      };
      const originalSetItem = Storage.prototype.setItem;
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
        if (key === "ozipz_publications") throw new Error("publication storage failed");
        return originalSetItem.call(this, key, value);
      });
      try {
        await expect(service.deleteAction(action.id)).rejects.toThrow();
      } finally {
        spy.mockRestore();
      }

      expect(await service.getActions()).toEqual(before.actions);
      expect(await service.getDistributions()).toEqual(before.distributions);
      expect(await service.getScheduleEvents()).toEqual(before.schedules);
      expect(await service.getJrwaCases()).toEqual(before.jrwa);
      expect(await service.getPublications()).toEqual(before.publications);
    });

    it("rejects relation changes for a missing action without creating distributions", async () => {
      const service = new FallbackDatabaseService();
      const schedule = await service.addScheduleEvent({
        title: "Wolny termin", eventDate: actionInput.date, location: "Szkoła",
        status: "zaplanowane", responsiblePerson: "Jan",
      });
      const distributions = await service.getDistributions();

      await expect(service.updateActionWithRelations("missing-action", { scheduleEventId: schedule.id },
        [{ materialId: "", title: "Ulotka", quantity: 1 }])).rejects.toThrow();

      expect(await service.getDistributions()).toEqual(distributions);
      expect((await service.getScheduleEvents()).find((item) => item.id === schedule.id)?.actionId).toBeUndefined();
    });
  });

  describe("5. Full Relational Cascading Matrix", () => {
    let service: FallbackDatabaseService;
    beforeEach(() => {
      service = new FallbackDatabaseService();
    });

    it("executes multi-level cascading nullification and deletion across all 10 repositories", async () => {
      // 1. Create Parent & Child Facility
      const parentFac = await service.addFacility({
        name: "Zespół Szkół Ponadpodstawowych",
        type: "szkola_ponadpodstawowa",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Szkolna 10",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Powiat",
        isComplex: true,
      });

      const childFac = await service.addFacility({
        name: "Liceum w Zespole",
        type: "liceum",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Szkolna 10",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Powiat",
        isComplex: false,
        parentFacilityId: parentFac.id,
      });

      // 2. Create Program & Participation
      const prog = await service.addProgram({
        code: "CASC_PROG",
        name: "Program Kaskadowy",
        editionYear: "2026",
        targetAudience: "Młodzież",
        description: "Opis testowy",
        status: "aktywny",
        jrwaSymbol: "966.1",
        participatingSchoolsCount: 1,
        totalPupilsReached: 30,
      });

      const part = await service.addParticipation({
        programId: prog.id,
        programName: prog.name,
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        municipality: parentFac.municipality,
        schoolYear: "2026/2027",
        schoolCoordinatorName: "Koordynator",
        schoolCoordinatorContact: "123456789",
        classesCount: 1,
        pupilsCount: 30,
        parentsCount: 10,
        hasDeclaration: true,
        hasFinalReport: false,
        evaluationGrade: "bardzo_dobra",
        notes: "",
      });

      // 3. Create Material
      const mat = await service.addMaterial({
        title: "Ulotka Kaskadowa",
        materialType: "ulotka",
        topic: "Zdrowie psychiczne",
        publisher: "GIS",
      });

      // 4. Create Schedule Event
      const sch = await service.addScheduleEvent({
        title: "Harmonogram Kaskadowy",
        eventDate: "2026-10-01",
        location: parentFac.name,
        facilityId: parentFac.id,
        programId: prog.id,
        programName: prog.name,
        responsiblePerson: "Edukator",
        status: "zaplanowane",
      });

      // 5. Create JRWA Case
      const jrwa = await service.addJrwaCase({
        section: "OZ",
        jrwaSymbol: "966.1",
        caseNumber: 99,
        year: 2026,
        fullCaseSign: "OZ.966.1.99.2026",
        title: "Sprawa Kaskadowa",
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        programId: prog.id,
        status: "w_toku",
        assignedEducator: "Edukator",
      });

      // 6. Create Action linked to all above
      const action = await service.addAction({
        title: "Akcja Kaskadowa",
        actionType: "prelekcja",
        date: "2026-10-01",
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        municipality: parentFac.municipality,
        programId: prog.id,
        programName: prog.name,
        materialId: mat.id,
        scheduleEventId: sch.id,
        jrwaCaseId: jrwa.id,
        topic: "Zdrowie",
        audienceGroup: "Młodzież",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Edukator",
      });

      // 7. Create Publication linked to Action
      const pub = await service.addPublication({
        title: "Post o akcji",
        channel: "Facebook",
        publicationDate: "2026-10-01",
        topic: "Zdrowie",
        actionId: action.id,
        author: "Edukator",
      });

      // 8. Create Distribution linked to Material, Facility, Action
      const dist = await service.addDistribution({
        materialId: mat.id,
        materialTitle: mat.title,
        facilityId: parentFac.id,
        recipientName: parentFac.name,
        actionId: action.id,
        actionTitle: action.title,
        quantity: 30,
        distributionDate: "2026-10-01",
        assignedEducator: "Edukator",
        purpose: "Dystrybucja",
      });

      // 9. Create Letter, Scan, Contact, Register
      const letter = await service.addLetter({
        direction: "wychodzace",
        letterNumber: "OZ/1/2026",
        letterDate: "2026-10-01",
        senderRecipient: parentFac.name,
        facilityId: parentFac.id,
        programId: prog.id,
        subject: "Pismo testowe",
        assignedPerson: "Edukator",
        status: "nowe",
      });

      const scan = await service.addScan({
        title: "Skan testowy",
        documentType: "sprawozdanie",
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        programId: prog.id,
        programName: prog.name,
        scanDate: "2026-10-01",
        fileName: "skan.pdf",
      });

      const contact = await service.addContact({
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        name: "Jan Kowalski",
        position: "Dyrektor",
        phone: "123456",
        email: "jan@szkola.pl",
      });

      const reg = await service.addRegister({
        registerType: "szkolenia",
        date: "2026-10-01",
        title: "Rejestr test",
        organizer: "PSSE",
        location: parentFac.name,
        facilityId: parentFac.id,
        facilityName: parentFac.name,
        programId: prog.id,
        programName: prog.name,
        participantsCount: 10,
      });

      // VERIFICATION PHASE 1: DELETE ACTION
      await service.deleteAction(action.id);
      expect((await service.getActions()).find((a) => a.id === action.id)).toBeUndefined();
      // Nullified actionId in distribution, schedule, jrwa, publication
      const retainedDist = (await service.getDistributions()).find((d) => d.id === dist.id);
      expect(retainedDist).toBeDefined();
      expect(retainedDist?.actionId).toBeUndefined();
      expect((await service.getScheduleEvents()).find((s) => s.id === sch.id)?.actionId).toBeUndefined();
      expect((await service.getJrwaCases()).find((j) => j.id === jrwa.id)?.actionId).toBeUndefined();
      expect((await service.getPublications()).find((p) => p.id === pub.id)?.actionId).toBeUndefined();

      // VERIFICATION PHASE 2: DELETE MATERIAL
      await service.deleteMaterial(mat.id);
      expect((await service.getMaterials()).find((m) => m.id === mat.id)).toBeUndefined();
      expect((await service.getDistributions()).find((d) => d.id === dist.id)?.materialId).toBeUndefined();

      // VERIFICATION PHASE 3: DELETE PROGRAM
      await expect(service.deleteProgram(prog.id)).rejects.toThrow("zapisanymi udziałami");
      expect((await service.getParticipations()).find((p) => p.id === part.id)).toBeDefined();
      await service.deleteParticipation(part.id);
      await service.deleteProgram(prog.id);
      expect((await service.getPrograms()).find((p) => p.id === prog.id)).toBeUndefined();
      // Participation was explicitly removed before deleting its program
      expect((await service.getParticipations()).find((p) => p.id === part.id)).toBeUndefined();
      // Other entities have programId nullified
      expect((await service.getScheduleEvents()).find((s) => s.id === sch.id)?.programId).toBeUndefined();
      expect((await service.getJrwaCases()).find((j) => j.id === jrwa.id)?.programId).toBeUndefined();
      expect((await service.getLetters()).find((l) => l.id === letter.id)?.programId).toBeUndefined();
      expect((await service.getScans()).find((s) => s.id === scan.id)?.programId).toBeUndefined();
      expect((await service.getRegisters()).find((r) => r.id === reg.id)?.programId).toBeUndefined();

      // VERIFICATION PHASE 4: DELETE FACILITY
      await service.deleteFacility(parentFac.id);
      expect((await service.getFacilities()).find((f) => f.id === parentFac.id)).toBeUndefined();
      // Child facility has parentFacilityId set to undefined
      expect((await service.getFacilities()).find((f) => f.id === childFac.id)?.parentFacilityId).toBeUndefined();
      // Contacts, letters, scans, registers have facilityId nullified
      expect((await service.getContacts()).find((c) => c.id === contact.id)?.facilityId).toBeUndefined();
      expect((await service.getLetters()).find((l) => l.id === letter.id)?.facilityId).toBeUndefined();
      expect((await service.getScans()).find((s) => s.id === scan.id)?.facilityId).toBeUndefined();
      expect((await service.getRegisters()).find((r) => r.id === reg.id)?.facilityId).toBeUndefined();
      expect((await service.getDistributions()).find((d) => d.id === dist.id)?.facilityId).toBeUndefined();
      expect((await service.getScheduleEvents()).find((s) => s.id === sch.id)?.facilityId).toBeUndefined();
      expect((await service.getJrwaCases()).find((j) => j.id === jrwa.id)?.facilityId).toBeUndefined();
    });
  });

  describe("6. Specialized Repositories Operations & Edge Cases", () => {
    let service: FallbackDatabaseService;
    beforeEach(() => {
      service = new FallbackDatabaseService();
    });

    it("Schedule: toggles status back and forth between 'wykonane' and 'planowane'", async () => {
      const sch = await service.addScheduleEvent({
        title: "Zadanie do przełączania",
        eventDate: "2026-11-01",
        location: "PSSE",
        responsiblePerson: "Edukator",
        status: "zaplanowane",
      });

      await service.toggleScheduleStatus(sch.id, "zaplanowane");
      let current = (await service.getScheduleEvents()).find((s) => s.id === sch.id);
      expect(current?.status).toBe("wykonane");

      await service.toggleScheduleStatus(sch.id, "wykonane");
      current = (await service.getScheduleEvents()).find((s) => s.id === sch.id);
      expect(current?.status).toBe("planowane");
    });

    it("Dictionaries: prevents deletion of system items and normalizes canonical JRWA symbols", async () => {
      const items = await service.getDictionaryItems();
      const systemItem = items.find((d) => d.isSystem);
      expect(systemItem).toBeDefined();

      if (systemItem) {
        await service.deleteDictionaryItem(systemItem.id);
        const itemsAfter = await service.getDictionaryItems();
        expect(itemsAfter.some((d) => d.id === systemItem.id)).toBe(true);
      }

      // Can delete non-system item
      const userItem = await service.addDictionaryItem({
        dictType: "topic",
        code: "user_custom_topic",
        label: "Nowy Temat Użytkownika",
        isSystem: false,
      });

      await service.deleteDictionaryItem(userItem.id);
      const itemsAfterUserDelete = await service.getDictionaryItems();
      expect(itemsAfterUserDelete.some((d) => d.id === userItem.id)).toBe(false);
    });

    it("Staff & Contacts: full CRUD life-cycle", async () => {
      const staff = await service.addStaff({
        fullName: "Dr Anna Nowak",
        role: "Młodszy Asystent",
        email: "anna.nowak@psse.gov.pl",
        phone: "500-600-700",
        active: true,
      });
      expect(staff.id.startsWith("stf-")).toBe(true);

      await service.updateStaff(staff.id, { role: "Starszy Asystent" });
      const updatedStaff = (await service.getStaff()).find((s) => s.id === staff.id);
      expect(updatedStaff?.role).toBe("Starszy Asystent");

      await service.deleteStaff(staff.id);
      expect((await service.getStaff()).find((s) => s.id === staff.id)).toBeUndefined();
    });

    it("Registry (Templates, Scans, Letters, Publications, Registers): CRUD life-cycle", async () => {
      // Templates
      const tpl = await service.addTemplate({
        title: "Szablon lekcji o tytoniu",
        topic: "Tytoń",
        actionType: "Prelekcja",
        descriptionTemplate: "Scenariusz zajęć...",
        defaultAudience: "Młodzież",
      });
      expect(tpl.id.startsWith("tpl-")).toBe(true);
      await service.updateTemplate(tpl.id, { defaultAudience: "Dorośli" });
      expect((await service.getTemplates()).find((t) => t.id === tpl.id)?.defaultAudience).toBe("Dorośli");
      await service.deleteTemplate(tpl.id);
      expect((await service.getTemplates()).find((t) => t.id === tpl.id)).toBeUndefined();

      // Scans
      const scan = await service.addScan({
        title: "Raport roczny skan",
        documentType: "sprawozdanie",
        facilityName: "Szkoła",
        scanDate: "2026-01-15",
        fileName: "raport.pdf",
      });
      expect(scan.id.startsWith("scan-")).toBe(true);
      await service.deleteScan(scan.id);
      expect((await service.getScans()).find((s) => s.id === scan.id)).toBeUndefined();
    });

    it("Monthly Targets: saves 12 months, updates single year, keeps other years untouched", async () => {
      const year2025Map = {
        1: { month: 1, programActions: 3, programRecipients: 50, otherActions: 1, otherRecipients: 10 },
      };
      await service.saveMonthlyTargets(2025, year2025Map);

      const year2026Map = {
        5: { month: 5, programActions: 10, programRecipients: 200, otherActions: 5, otherRecipients: 100 },
      };
      await service.saveMonthlyTargets(2026, year2026Map);

      const all2025 = await service.getMonthlyTargets(2025);
      const all2026 = await service.getMonthlyTargets(2026);
      const allBoth = await service.getMonthlyTargets();

      expect(all2025).toHaveLength(12);
      expect(all2026).toHaveLength(12);
      expect(allBoth).toHaveLength(24);

      expect(all2025.find((m) => m.month === 1)?.programActions).toBe(3);
      expect(all2026.find((m) => m.month === 5)?.programActions).toBe(10);
    });

    it("Facility Activity Summary: aggregates pupils, materials, actions, participations accurately", async () => {
      const fac = await service.addFacility({
        name: "Szkoła do podsumowania",
        type: "szkola_podstawowa",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Kwiatowa 2",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Gmina",
        isComplex: false,
      });

      // Add participation: 40 pupils
      await service.addParticipation({
        programId: "prog-sum",
        programName: "Prog Sum",
        facilityId: fac.id,
        facilityName: fac.name,
        municipality: fac.municipality,
        schoolYear: "2026/2027",
        schoolCoordinatorName: "Koord",
        schoolCoordinatorContact: "987654321",
        classesCount: 2,
        pupilsCount: 40,
        parentsCount: 0,
        hasDeclaration: true,
        hasFinalReport: false,
        evaluationGrade: "bardzo_dobra",
        notes: "",
      });

      // Add 2 actions: 25 and 15 participants
      await service.addAction({
        title: "Akcja 1",
        actionType: "prelekcja",
        date: "2026-03-01",
        facilityId: fac.id,
        facilityName: fac.name,
        municipality: fac.municipality,
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        participantsCount: 25,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan",
      });

      await service.addAction({
        title: "Akcja 2",
        actionType: "prelekcja",
        date: "2026-05-10",
        facilityId: fac.id,
        facilityName: fac.name,
        municipality: fac.municipality,
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        participantsCount: 15,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan",
      });

      // Add distribution: 50 materials
      await service.addDistribution({
        materialTitle: "Ulotki",
        facilityId: fac.id,
        recipientName: fac.name,
        quantity: 50,
        distributionDate: "2026-04-01",
        assignedEducator: "Jan",
        purpose: "Edukacja",
      });

      const summary = await service.getFacilityActivitySummary(fac.id);
      expect(summary.facilityId).toBe(fac.id);
      expect(summary.facilityName).toBe(fac.name);
      expect(summary.programsCount).toBe(1);
      expect(summary.actionsCount).toBe(2);
      // Uczniowie z udziału w programie (40) są już ujęci w uczestnikach działań — bez podwójnego liczenia.
      expect(summary.totalPupilsReached).toBe(25 + 15);
      expect(summary.totalMaterialsReceived).toBe(50);
      expect(summary.lastActionDate).toBe("2026-05-10");
    });
  });
});
