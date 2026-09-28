import { describe, it, expect, beforeEach } from "vitest";
import { FallbackDatabaseService } from "./fallback-service";
import { MIGRATED_FIREBASE_DATA } from "../features/ozipz/data/migratedData";

describe("FallbackDatabaseService (LocalStorage & In-Memory Fallback)", () => {
  let service: FallbackDatabaseService;

  beforeEach(() => {
    localStorage.clear();
    service = new FallbackDatabaseService();
  });

  describe("Initial Data Seeding & Fallback", () => {
    it("returns migrated data when localStorage is empty", async () => {
      const actions = await service.getActions();
      expect(actions.length).toBe(MIGRATED_FIREBASE_DATA.actions.length);

      const facilities = await service.getFacilities();
      expect(facilities.length).toBe(MIGRATED_FIREBASE_DATA.facilities.length);

      const programs = await service.getPrograms();
      expect(programs.length).toBe(MIGRATED_FIREBASE_DATA.programs.length);
    });

    it("correctly sets default JRWA symbol 0442 for sprawozdawczosc program", async () => {
      const programs = await service.getPrograms();
      const sprawozdawczosc = programs.find((p) => p.id === "sprawozdawczosc-statystyczna");
      expect(sprawozdawczosc?.jrwaSymbol).toBe("0442");
    });
  });

  describe("Actions CRUD & Relational Cascades", () => {
    it("adds, updates and deletes actions", async () => {
      const newAction = await service.addAction({
        title: "Testowe działanie w fallbacku",
        actionType: "prelekcja",
        date: "2026-09-10",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan Nowak",
      });

      expect(newAction.id).toBeDefined();
      expect(newAction.id.startsWith("act-")).toBe(true);

      const actionsAfterAdd = await service.getActions();
      expect(actionsAfterAdd.some((a) => a.id === newAction.id)).toBe(true);

      await service.updateAction(newAction.id, {
        title: "Zaktualizowane działanie w fallbacku",
        participantsCount: 25,
      });

      const updatedActions = await service.getActions();
      const updated = updatedActions.find((a) => a.id === newAction.id);
      expect(updated?.title).toBe("Zaktualizowane działanie w fallbacku");
      expect(updated?.participantsCount).toBe(25);

      await service.deleteAction(newAction.id);
      const actionsAfterDelete = await service.getActions();
      expect(actionsAfterDelete.some((a) => a.id === newAction.id)).toBe(false);
    });

    it("nullifies actionId in related distributions, schedules and jrwa cases upon action deletion", async () => {
      const action = await service.addAction({
        title: "Działanie do usunięcia z relacjami",
        actionType: "warsztat",
        date: "2026-09-12",
        facilityName: "Placówka",
        municipality: "Barlinek",
        topic: "Higiena",
        audienceGroup: "Uczniowie",
        participantsCount: 15,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan",
      });

      const dist = await service.addDistribution({
        materialTitle: "Ulotka testowa",
        recipientName: "Placówka",
        quantity: 10,
        distributionDate: "2026-09-12",
        assignedEducator: "Anna Nowak",
        purpose: "Edukacja",
        actionId: action.id,
      });

      const sch = await service.addScheduleEvent({
        title: "Zadanie z planu",
        eventDate: "2026-09-12",
        location: "Placówka",
        responsiblePerson: "Anna Nowak",
        status: "done",
        actionId: action.id,
      });

      await service.deleteAction(action.id);

      const distributions = await service.getDistributions();
      const foundDist = distributions.find((d) => d.id === dist.id);
      expect(foundDist).toBeDefined();
      expect(foundDist?.actionId).toBeUndefined();
      expect(foundDist?.quantity).toBe(10);

      const schedules = await service.getScheduleEvents();
      const foundSch = schedules.find((s) => s.id === sch.id);
      expect(foundSch?.actionId).toBeUndefined();
    });
  });

  describe("saveActionWithRelations (Complex Transaction Simulation)", () => {
    it("creates action, auto-generates JRWA case, updates schedule event, and creates multi-item distributions", async () => {
      const schedule = await service.addScheduleEvent({
        title: "Zaplanowane zadanie harmonogramu",
        eventDate: "2026-09-20",
        location: "SP Barlinek",
        responsiblePerson: "Krzysztof P.",
        status: "zaplanowane",
      });

      const result = await service.saveActionWithRelations({
        action: {
          title: "Realizacja zadania z harmonogramu",
          actionType: "Prelekcja",
          date: "2026-09-20",
          facilityName: "SP Barlinek",
          municipality: "Barlinek",
          topic: "Tytoń",
          audienceGroup: "Młodzież",
          participantsCount: 30,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          status: "wykonane",
          ezdStatus: "w_ezd",
          leadEducator: "Krzysztof P.",
          scheduleEventId: schedule.id,
        },
        autoCreateJrwa: {
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 5,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.5.2026",
        },
        distributionMaterials: [
          { materialId: "mat-1", title: "Broszura o nikotynie", type: "broszura", quantity: 30 },
          { materialId: "mat-2", title: "Plakat antynikotynowy", type: "plakat", quantity: 2 },
        ],
      });

      expect(result.action).toBeDefined();
      expect(result.action.id).toBeDefined();
      expect(result.action.jrwaCaseId).toBeDefined();

      // Weryfikacja utworzonej sprawy JRWA
      expect(result.jrwaCase).toBeDefined();
      expect(result.jrwaCase?.fullCaseSign).toBe("OZiPZ.966.1.5.2026");
      expect(result.jrwaCase?.actionId).toBe(result.action.id);

      // Weryfikacja aktualizacji statusu harmonogramu do 'done'
      const updatedSchedules = await service.getScheduleEvents();
      const updatedSch = updatedSchedules.find((s) => s.id === schedule.id);
      expect(updatedSch?.status).toBe("done");
      expect(updatedSch?.actionId).toBe(result.action.id);

      // Weryfikacja utworzonych rozdzielników materiałów
      expect(result.distributions?.length).toBe(2);
      expect(result.distributions?.[0].quantity).toBe(30);
      expect(result.distributions?.[1].quantity).toBe(2);
      expect(result.distributions?.[0].actionId).toBe(result.action.id);
    });
  });

  describe("Facilities & Programs Relational Cascades", () => {
    it("deletes facility and cascades null to dependent actions and contacts", async () => {
      const facility = await service.addFacility({
        name: "Testowa Szkoła Podstawowa",
        type: "szkola_podstawowa",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Kwiatowa 1",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Gmina Myślibórz",
        isComplex: false,
      });

      const action = await service.addAction({
        title: "Akcja w nowej szkole",
        actionType: "prelekcja",
        date: "2026-09-10",
        facilityId: facility.id,
        facilityName: facility.name,
        municipality: facility.municipality,
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        leadEducator: "Jan",
      });

      const contact = await service.addContact({
        facilityId: facility.id,
        facilityName: facility.name,
        name: "Pedagog Szkolny",
        position: "koordynator",
        phone: "",
        email: "",
      });

      await service.deleteFacility(facility.id);

      const actions = await service.getActions();
      const foundAct = actions.find((a) => a.id === action.id);
      expect(foundAct?.facilityId).toBeUndefined();

      const contacts = await service.getContacts();
      const foundContact = contacts.find((c) => c.id === contact.id);
      expect(foundContact?.facilityId).toBeUndefined();
    });

    it("protects participation history before allowing program deletion", async () => {
      const program = await service.addProgram({
        code: "TEST_PROG",
        name: "Testowy Program Profilaktyczny",
        editionYear: "2026",
        targetAudience: "Młodzież",
        description: "Opis programu",
        status: "aktywny",
        jrwaSymbol: "966.1",
        participatingSchoolsCount: 0,
        totalPupilsReached: 0,
      });

      const part = await service.addParticipation({
        programId: program.id,
        programName: program.name,
        facilityId: "fac-1",
        facilityName: "Szkoła 1",
        municipality: "Dębno",
        schoolYear: "2026/2027",
        schoolCoordinatorName: "Koordynator",
        schoolCoordinatorContact: "123456789",
        classesCount: 2,
        pupilsCount: 40,
        parentsCount: 30,
        hasDeclaration: true,
        hasFinalReport: false,
        evaluationGrade: "bardzo_dobra",
        notes: "",
      });

      await expect(service.deleteProgram(program.id)).rejects.toThrow("zapisanymi udziałami");
      expect((await service.getParticipations()).find((p) => p.id === part.id)).toBeDefined();
      await service.deleteParticipation(part.id);
      await service.deleteProgram(program.id);

      const participations = await service.getParticipations();
      const foundPart = participations.find((p) => p.id === part.id);
      expect(foundPart).toBeUndefined();
    });
  });

  describe("Dictionaries & Facilities Activity Overview", () => {
    it("adds dictionary item with postalCode and retrieves it", async () => {
      const dictItem = await service.addDictionaryItem({
        dictType: "municipality",
        code: "test_nowogrodek_pomorski",
        label: "Nowogródek Pomorski",
        isSystem: false,
        postalCode: "74-304",
      });

      expect(dictItem.id).toBeDefined();
      expect(dictItem.postalCode).toBe("74-304");

      const items = await service.getDictionaryItems();
      const found = items.find((d) => d.id === dictItem.id);
      expect(found?.postalCode).toBe("74-304");
    });

    it("batch upserts facilities correctly", async () => {
      const existing = await service.getFacilities();
      const first = existing[0];
      const updatedFirst = { ...first, name: first.name + " - Zaktualizowana" };
      const newFacility = {
        id: "fac-batch-new",
        name: "Nowa Placówka z Batcha",
        type: "szkola_podstawowa" as const,
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Leśna 5",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Gmina Myślibórz",
        isComplex: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      const result = await service.batchUpsertFacilities([updatedFirst, newFacility]);
      expect(result.length).toBeGreaterThanOrEqual(2);

      const facilities = await service.getFacilities();
      const foundUpdated = facilities.find((f) => f.id === first.id);
      expect(foundUpdated?.name).toBe(first.name + " - Zaktualizowana");

      const foundNew = facilities.find((f) => f.id === "fac-batch-new");
      expect(foundNew?.name).toBe("Nowa Placówka z Batcha");
    });
  });

  describe("Monthly Targets Persistence", () => {
    it("saves and retrieves monthly targets with storage synchronization", async () => {
      const initial = await service.getMonthlyTargets(2026);
      expect(initial).toEqual([]);

      const yearlyMap = {
        1: { month: 1, programActions: 5, programRecipients: 100, otherActions: 2, otherRecipients: 30, notes: "Styczeń" },
        2: { month: 2, programActions: 8, programRecipients: 150, otherActions: 1, otherRecipients: 20 },
      };

      const saved = await service.saveMonthlyTargets(2026, yearlyMap);
      expect(saved).toHaveLength(12);

      const jan = saved.find((t) => t.month === 1);
      expect(jan?.programActions).toBe(5);
      expect(jan?.programRecipients).toBe(100);
      expect(jan?.otherActions).toBe(2);
      expect(jan?.otherRecipients).toBe(30);
      expect(jan?.notes).toBe("Styczeń");

      const fetched = await service.getMonthlyTargets(2026);
      expect(fetched).toHaveLength(12);
      expect(fetched.find((t) => t.month === 2)?.programActions).toBe(8);

      // Verify filter by year
      const otherYear = await service.getMonthlyTargets(2025);
      expect(otherYear).toHaveLength(0);
    });
  });

  describe("Szkolny koordynator powiązany z kontaktem", () => {
    it("przenosi zmiany kontaktu do zgłoszeń i zachowuje nazwisko po jego usunięciu", async () => {
      const [program] = await service.getPrograms();
      const [facility] = await service.getFacilities();
      const contact = await service.addContact({ name: "Anna Nowak", position: "Koordynator", facilityName: "", phone: "600 000 000", email: "" });
      const part = await service.addParticipation({
        programId: program.id, programName: program.name, facilityId: facility.id, facilityName: facility.name,
        municipality: facility.municipality, schoolYear: "2031/2032", schoolCoordinatorName: contact.name,
        schoolCoordinatorContact: "600 000 000", schoolCoordinatorContactId: contact.id,
        classesCount: 1, pupilsCount: 25, parentsCount: 0, hasDeclaration: true, hasFinalReport: false, evaluationGrade: "", notes: "",
      });

      await service.updateContact(contact.id, { name: "Anna Nowak-Kowal", email: "anna@szkola.pl" });
      let saved = (await service.getParticipations()).find((p) => p.id === part.id);
      expect(saved).toMatchObject({ schoolCoordinatorName: "Anna Nowak-Kowal", schoolCoordinatorContact: "600 000 000 / anna@szkola.pl" });

      await service.deleteContact(contact.id);
      saved = (await service.getParticipations()).find((p) => p.id === part.id);
      expect(saved?.schoolCoordinatorContactId).toBeUndefined();
      expect(saved?.schoolCoordinatorName).toBe("Anna Nowak-Kowal");
    });
  });
});
