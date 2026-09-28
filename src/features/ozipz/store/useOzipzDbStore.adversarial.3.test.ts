import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOzipzDbStore } from "./useOzipzDbStore";
import { OzipzDbService } from "../../../db/client";

describe("Adversarial Verification Part 3: Facility Cascades & Atomicity", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useOzipzDbStore.getState().loadAll();
  });

  it("cascades unlinking when deleting a facility across 10 relational entities", async () => {
    const state = useOzipzDbStore.getState();

    const mainFac = await state.addFacility({
      name: "Główny Zespół Szkół",
      type: "szkola_podstawowa",
      address: "Szkolna 1",
      city: "Myślibórz",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "myśliborski",
      leadingAuthority: "Gmina Myślibórz",
      isComplex: true,
    });

    const childFac = await state.addFacility({
      name: "Filia Zespołu Szkół",
      type: "przedszkole",
      address: "Szkolna 1B",
      city: "Myślibórz",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "myśliborski",
      leadingAuthority: "Gmina Myślibórz",
      isComplex: false,
      parentFacilityId: mainFac.id,
    });

    const part = await state.addParticipation({
      programId: "prog-xyz",
      programName: "Program X",
      facilityId: mainFac.id,
      facilityName: mainFac.name,
      municipality: "Myślibórz",
      schoolYear: "2026/2027",
      pupilsCount: 30,
      classesCount: 1,
      schoolCoordinatorName: "Koordynator",
      schoolCoordinatorContact: "koord@szkola.pl",
      parentsCount: 0,
      hasDeclaration: true,
      hasFinalReport: false,
      evaluationGrade: "bardzo_dobra",
      notes: "",
    });

    const action = await state.addAction({
      title: "Akcja w placówce",
      actionType: "prelekcja",
      date: "2026-09-18",
      facilityId: mainFac.id,
      facilityName: mainFac.name,
      municipality: "Myślibórz",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Anna",
    });

    const dist = await state.addDistribution({
      materialTitle: "Folder",
      facilityId: mainFac.id,
      recipientName: mainFac.name,
      quantity: 10,
      distributionDate: "2026-09-18",
      assignedEducator: "Anna",
      purpose: "Przekazanie",
    });

    const sched = await state.addScheduleEvent({
      title: "Wizyta w szkole",
      eventDate: "2026-09-25",
      location: "Główny Zespół Szkół",
      month: 9,
      year: 2026,
      status: "planned",
      responsiblePerson: "Anna",
      facilityId: mainFac.id,
    });

    const jrwa = await state.addJrwaCase({
      section: "OZiPZ",
      jrwaSymbol: "966.1",
      caseNumber: 33,
      year: 2026,
      fullCaseSign: "OZiPZ.966.1.33.2026",
      title: "Sprawa placówki",
      status: "w_toku",
      assignedEducator: "Anna",
      facilityId: mainFac.id,
      facilityName: mainFac.name,
    });

    const contact = await state.addContact({
      name: "Janina Kowal",
      facilityId: mainFac.id,
      facilityName: mainFac.name,
      position: "pedagog",
      phone: "123456789",
      email: "janina@szkola.pl",
    });

    await expect(state.deleteFacility(mainFac.id)).rejects.toThrow("zapisanymi udziałami");
    expect(useOzipzDbStore.getState().participations.some((p) => p.id === part.id)).toBe(true);
    await state.deleteParticipation(part.id);
    await state.deleteFacility(mainFac.id);

    const s = useOzipzDbStore.getState();
    expect(s.facilities.some((f) => f.id === mainFac.id)).toBe(false);
    expect(s.facilities.find((f) => f.id === childFac.id)?.parentFacilityId).toBeUndefined();
    expect(s.participations.some((p) => p.id === part.id)).toBe(false);

    expect(s.actions.find((a) => a.id === action.id)?.facilityId).toBeUndefined();
    expect(s.distributions.find((d) => d.id === dist.id)?.facilityId).toBeUndefined();
    expect(s.scheduleEvents.find((e) => e.id === sched.id)?.facilityId).toBeUndefined();

    const updatedJrwa = s.jrwaCases.find((j) => j.id === jrwa.id);
    expect(updatedJrwa?.facilityId).toBeUndefined();
    expect(updatedJrwa?.facilityName).toBeUndefined();

    expect(s.contacts.find((c) => c.id === contact.id)?.facilityId).toBeUndefined();
  });

  it("verifies saveActionWithRelations atomicity with multiple distributions and schedule update", async () => {
    const state = useOzipzDbStore.getState();

    const sched = await state.addScheduleEvent({
      title: "Zadanie do realizacji przez akcję",
      eventDate: "2026-09-28",
      location: "Szkoła 5",
      month: 9,
      year: 2026,
      status: "planned",
      responsiblePerson: "Ewa",
    });

    const res = await state.saveActionWithRelations({
      action: {
        title: "Kompleksowa akcja z wieloma rozdzielnikami",
        actionType: "kampania",
        date: "2026-09-28",
        facilityName: "Szkoła 5",
        municipality: "Nowogródek Pomorski",
        topic: "inne",
        audienceGroup: "Młodzież",
        participantsCount: 40,
        indirectRecipientsCount: 10,
        materialsDistributedCount: 70,
        ezdStatus: "w_ezd",
        status: "wykonane",
        leadEducator: "Ewa",
        scheduleEventId: sched.id,
      },
      autoCreateJrwa: {
        section: "OZiPZ",
        jrwaSymbol: "966.4",
        caseNumber: 77,
        year: 2026,
        fullCaseSign: "OZiPZ.966.4.77.2026",
      },
      distributionMaterials: [
        { materialId: "mat-a", title: "Broszura 1", type: "broszura", quantity: 30 },
        { materialId: "mat-b", title: "Plakat 1", type: "plakat", quantity: 40 },
      ],
    });

    expect(res.action.id).toBeDefined();
    expect(res.jrwaCase?.fullCaseSign).toBe("OZiPZ.966.4.77.2026");
    expect(res.distributions?.length).toBe(2);

    const s = useOzipzDbStore.getState();
    const updatedAction = s.actions.find((a) => a.id === res.action.id);
    expect(updatedAction).toBeDefined();
    expect(updatedAction?.scheduleEventId).toBe(sched.id);

    const updatedSched = s.scheduleEvents.find((e) => e.id === sched.id);
    expect(updatedSched?.status).toBe("done");
    expect(updatedSched?.actionId).toBe(res.action.id);

    const createdDists = s.distributions.filter((d) => d.actionId === res.action.id);
    expect(createdDists.length).toBe(2);
    expect(createdDists.some((d) => d.materialTitle === "Broszura 1" && d.quantity === 30)).toBe(true);
    expect(createdDists.some((d) => d.materialTitle === "Plakat 1" && d.quantity === 40)).toBe(true);
  });

  it("ensures zero store mutation when saveActionWithRelations fails in DB layer", async () => {
    const state = useOzipzDbStore.getState();
    const initialActions = [...state.actions];
    const initialJrwa = [...state.jrwaCases];
    const initialDists = [...state.distributions];
    const initialSched = [...state.scheduleEvents];

    const spy = vi.spyOn(OzipzDbService, "saveActionWithRelations").mockRejectedValueOnce(
      new Error("DB Connection Interrupted")
    );

    await expect(
      state.saveActionWithRelations({
        action: {
          title: "Błędne działanie",
          actionType: "warsztat",
          date: "2026-09-30",
          facilityName: "Brak",
          municipality: "Boleszkowice",
          topic: "inne",
          audienceGroup: "Inna",
          participantsCount: 1,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          ezdStatus: "brak",
          status: "planowane",
          leadEducator: "Nikt",
        },
      })
    ).rejects.toThrow("DB Connection Interrupted");

    const after = useOzipzDbStore.getState();
    expect(after.actions.length).toBe(initialActions.length);
    expect(after.jrwaCases.length).toBe(initialJrwa.length);
    expect(after.distributions.length).toBe(initialDists.length);
    expect(after.scheduleEvents.length).toBe(initialSched.length);

    spy.mockRestore();
  });
});
