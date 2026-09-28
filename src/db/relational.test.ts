import { describe, it, expect, beforeEach } from "vitest";
import { FallbackDatabaseService } from "./fallback-service";

describe("Relational Integrity & Cascades (FallbackDatabaseService)", () => {
  let db: FallbackDatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new FallbackDatabaseService();
  });

  it("protects participations and unlinks programId after explicit removal of participations", async () => {
    const prog = await db.addProgram({
      code: "TEST-PROG",
      name: "Program Testowy",
      editionYear: "2025/2026",
      jrwaSymbol: "966.1",
      targetAudience: "Dzieci",
      description: "Opis testowy",
      status: "aktywny",
      participatingSchoolsCount: 1,
      totalPupilsReached: 50,
    });

    const part = await db.addParticipation({
      programId: prog.id,
      programName: prog.name,
      facilityId: "fac-1",
      facilityName: "SP 1",
      municipality: "Myślibórz",
      schoolYear: "2025/2026",
      schoolCoordinatorName: "Jan Koordynator",
      schoolCoordinatorContact: "jan@sp1.pl",
      classesCount: 2,
      pupilsCount: 50,
      parentsCount: 30,
      hasDeclaration: true,
      hasFinalReport: false,
      evaluationGrade: "",
      notes: "",
    });

    const act = await db.addAction({
      title: "Zajęcia z programu testowego",
      actionType: "warsztaty",
      date: "2026-05-10",
      facilityName: "SP 1",
      municipality: "Myślibórz",
      programId: prog.id,
      programName: prog.name,
      topic: "zdrowe_zywienie",
      audienceGroup: "dzieci",
      participantsCount: 25,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
    });

    const sch = await db.addScheduleEvent({
      title: "Planowane warsztaty",
      eventDate: "2026-06-01",
      category: "warsztaty",
      location: "SP 1",
      programId: prog.id,
      programName: prog.name,
      status: "zaplanowane",
      responsiblePerson: "Jan",
    });

    const jrwa = await db.addJrwaCase({
      section: "OZ",
      jrwaSymbol: "966.1",
      caseNumber: 9999,
      year: 2026,
      fullCaseSign: "OZiPZ.966.1.9999.2026",
      title: "Sprawa testowa programu",
      programId: prog.id,
      programName: prog.name,
      status: "w_toku",
      assignedEducator: "Jan",
    });

    // Weryfikacja powiązań przed usunięciem
    expect((await db.getParticipations()).some((p) => p.id === part.id)).toBe(true);
    expect((await db.getActions()).find((a) => a.id === act.id)?.programId).toBe(prog.id);
    expect((await db.getScheduleEvents()).find((s) => s.id === sch.id)?.programId).toBe(prog.id);
    expect((await db.getJrwaCases()).find((j) => j.id === jrwa.id)?.programId).toBe(prog.id);

    // Wykonanie kaskadowego usunięcia programu
    await expect(db.deleteProgram(prog.id)).rejects.toThrow("zapisanymi udziałami");
      expect((await db.getParticipations()).find((p) => p.id === part.id)).toBeDefined();
      await db.deleteParticipation(part.id);
      await db.deleteProgram(prog.id);

    // 1. Program usunięty
    expect((await db.getPrograms()).find((p) => p.id === prog.id)).toBeUndefined();

    // 2. Deklaracja została usunięta jawnie przed usunięciem programu
    expect((await db.getParticipations()).find((p) => p.id === part.id)).toBeUndefined();

    // 3. Działania mają wyzerowane ID programu (SET NULL)
    const updatedAct = (await db.getActions()).find((a) => a.id === act.id);
    expect(updatedAct?.programId).toBeUndefined();

    // 4. Harmonogram ma wyzerowane ID programu (SET NULL)
    const updatedSch = (await db.getScheduleEvents()).find((s) => s.id === sch.id);
    expect(updatedSch?.programId).toBeUndefined();

    // 5. Sprawa JRWA ma wyzerowane ID programu (SET NULL)
    const updatedJrwa = (await db.getJrwaCases()).find((j) => j.id === jrwa.id);
    expect(updatedJrwa?.programId).toBeUndefined();
  });

  it("cascades deleteFacility to unbind parentFacilityId, and unbind facilityId from actions and distributions", async () => {
    const parentFac = await db.addFacility({
      name: "Zespół Szkół Ponadpodstawowych",
      type: "zespol_szkol",
      address: "ul. Szosowa 2",
      city: "Barlinek",
      postalCode: "74-320",
      municipality: "Barlinek",
      county: "myśliborski",
      leadingAuthority: "Gmina Barlinek",
      isComplex: true,
    });

    const childFac = await db.addFacility({
      name: "Liceum w Zespole Szkół",
      type: "liceum",
      address: "ul. Szosowa 2",
      city: "Barlinek",
      postalCode: "74-320",
      municipality: "Barlinek",
      county: "myśliborski",
      leadingAuthority: "Gmina Barlinek",
      isComplex: false,
      parentFacilityId: parentFac.id,
    });

    const act = await db.addAction({
      title: "Prelekcja w placówce",
      actionType: "prelekcja",
      date: "2026-04-10",
      facilityId: parentFac.id,
      facilityName: parentFac.name,
      municipality: parentFac.municipality,
      topic: "tyton",
      audienceGroup: "uczniowie_sp",
      participantsCount: 30,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
    });

    const dist = await db.addDistribution({
      materialTitle: "Ulotki",
      facilityId: parentFac.id,
      recipientName: parentFac.name,
      municipality: parentFac.municipality,
      quantity: 50,
      distributionDate: "2026-04-10",
      assignedEducator: "Jan",
      purpose: "Edukacja",
    });

    // Usunięcie placówki głównej
    await db.deleteFacility(parentFac.id);

    // Placówka usunięta
    expect((await db.getFacilities()).find((f) => f.id === parentFac.id)).toBeUndefined();

    // Placówka podrzędna ma wyzerowany parentFacilityId
    const updatedChild = (await db.getFacilities()).find((f) => f.id === childFac.id);
    expect(updatedChild?.parentFacilityId).toBeUndefined();

    // Działanie i rozdzielnik mają wyzerowane facilityId (SET NULL)
    const updatedAct = (await db.getActions()).find((a) => a.id === act.id);
    expect(updatedAct?.facilityId).toBeUndefined();

    const updatedDist = (await db.getDistributions()).find((d) => d.id === dist.id);
    expect(updatedDist?.facilityId).toBeUndefined();
  });

  it("cascades deleteMaterial to unbind materialId from actions and distributions", async () => {
    const mat = await db.addMaterial({
      title: "Poradnik Rzucania Palenia",
      materialType: "broszura",
      topic: "tyton",
      publisher: "GIS",
    });

    const dist = await db.addDistribution({
      materialId: mat.id,
      materialTitle: mat.title,
      recipientName: "Placówka 1",
      quantity: 20,
      distributionDate: "2026-04-01",
      assignedEducator: "Jan",
      purpose: "Działania",
    });

    const act = await db.addAction({
      title: "Akcja z materiałem",
      actionType: "akcja_plenerowa",
      date: "2026-04-01",
      facilityName: "Placówka 1",
      municipality: "Myślibórz",
      materialId: mat.id,
      topic: "tyton",
      audienceGroup: "mieszkancy",
      participantsCount: 100,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
    });

    await db.deleteMaterial(mat.id);

    expect((await db.getMaterials()).find((m) => m.id === mat.id)).toBeUndefined();

    const updatedDist = (await db.getDistributions()).find((d) => d.id === dist.id);
    expect(updatedDist?.materialId).toBeUndefined();

    const updatedAct = (await db.getActions()).find((a) => a.id === act.id);
    expect(updatedAct?.materialId).toBeUndefined();
  });

  it("cascades deleteAction to unbind actionId from distributions, schedules, and jrwa", async () => {
    const act = await db.addAction({
      title: "Akcja główna",
      actionType: "prelekcja",
      date: "2026-03-20",
      facilityName: "Szkoła 1",
      municipality: "Myślibórz",
      topic: "zdrowe_zywienie",
      audienceGroup: "uczniowie_sp",
      participantsCount: 40,
      leadEducator: "Jan",
      ezdStatus: "w_ezd",
      status: "wykonane",
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
    });

    const dist = await db.addDistribution({
      materialTitle: "Ulotki",
      recipientName: "Szkoła 1",
      actionId: act.id,
      actionTitle: act.title,
      quantity: 40,
      distributionDate: "2026-03-20",
      assignedEducator: "Jan",
      purpose: "Rozdanie w czasie akcji",
    });

    const pub = await db.addPublication({
      title: "Relacja z akcji",
      channel: "facebook",
      publicationDate: "2026-03-21",
      topic: "zdrowe_zywienie",
      actionId: act.id,
      author: "Jan",
    });

    await db.deleteAction(act.id);

    expect((await db.getActions()).find((a) => a.id === act.id)).toBeUndefined();

    const updatedDist = (await db.getDistributions()).find((d) => d.id === dist.id);
    expect(updatedDist).toBeDefined();
    expect(updatedDist?.actionId).toBeUndefined();
    expect(updatedDist?.actionTitle).toBeUndefined();

    const updatedPub = (await db.getPublications()).find((p) => p.id === pub.id);
    expect(updatedPub?.actionId).toBeUndefined();
  });

  it("handles saveActionWithRelations correctly linking JRWA, distribution and schedule", async () => {
    const sch = await db.addScheduleEvent({
      title: "Planowana prelekcja",
      eventDate: "2026-05-15",
      category: "prelekcja",
      location: "SP 1",
      status: "zaplanowane",
      responsiblePerson: "Jan",
    });

    const mat = await db.addMaterial({
      title: "Broszura Zdrowie",
      materialType: "broszura",
      topic: "zdrowe_zywienie",
      publisher: "WSSE",
    });

    const res = await db.saveActionWithRelations({
      action: {
        title: "Zrealizowana prelekcja",
        actionType: "prelekcja",
        date: "2026-05-15",
        facilityId: "fac-1",
        facilityName: "SP 1",
        municipality: "Myślibórz",
        topic: "zdrowe_zywienie",
        audienceGroup: "uczniowie_sp",
        participantsCount: 30,
        leadEducator: "Jan",
        scheduleEventId: sch.id,
        ezdStatus: "w_ezd",
        status: "wykonane",
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
      },
      autoCreateJrwa: {
        section: "OZ",
        jrwaSymbol: "9010",
        caseNumber: 5,
        year: 2026,
        fullCaseSign: "OZiPZ.9010.5.2026",
      },
      distributionMaterial: {
        materialId: mat.id,
        title: mat.title,
        type: mat.materialType,
        quantity: 30,
      },
    });

    expect(res.action).toBeDefined();
    expect(res.jrwaCase).toBeDefined();
    expect(res.distribution).toBeDefined();
    expect(res.action.jrwaCaseId).toBe(res.jrwaCase?.id);

    // Sprawdzenie powiązania 2-way dla sprawy JRWA
    const updatedJrwa = (await db.getJrwaCases()).find((j) => j.id === res.jrwaCase?.id);
    expect(updatedJrwa?.actionId).toBe(res.action.id);

    // Sprawdzenie statusu i powiązania 2-way dla harmonogramu
    const updatedSch = (await db.getScheduleEvents()).find((s) => s.id === sch.id);
    expect(updatedSch?.status).toBe("done");
    expect(updatedSch?.actionId).toBe(res.action.id);

    // Sprawdzenie rozdzielnika i powiązania z akcją
    const dist = (await db.getDistributions()).find((d) => d.id === res.distribution?.id);
    expect(dist?.materialId).toBe(mat.id);
    expect(dist?.actionId).toBe(res.action.id);
    expect(dist?.actionTitle).toBe(res.action.title);
    expect(dist?.quantity).toBe(30);
  });

  it("prevents deleting system dictionary items", async () => {
    const sysItem = await db.addDictionaryItem({
      dictType: "activityType",
      code: "prelekcja_systemowa",
      label: "Prelekcja systemowa",
      isSystem: true,
    });

    await db.deleteDictionaryItem(sysItem.id);
    const items = await db.getDictionaryItems();
    expect(items.some((d) => d.id === sysItem.id)).toBe(true);

    const nonSysItem = await db.addDictionaryItem({
      dictType: "activityType",
      code: "custom_activity",
      label: "Własne działanie",
      isSystem: false,
    });

    await db.deleteDictionaryItem(nonSysItem.id);
    const itemsAfter = await db.getDictionaryItems();
    expect(itemsAfter.some((d) => d.id === nonSysItem.id)).toBe(false);
  });

  it("handles atomic creation of an action with multiple distributed materials", async () => {
    const mat1 = await db.addMaterial({
      title: "Ulotka: Zdrowe Zęby",
      materialType: "ulotka",
      publisher: "GIS",
      topic: "higiena",
    });

    const mat2 = await db.addMaterial({
      title: "Broszura: Aktywność Fizyczna",
      materialType: "broszura",
      publisher: "MZ",
      topic: "aktywnosc",
    });

    const res = await db.saveActionWithRelations({
      action: {
        title: "Warsztaty Higieny i Zdrowia",
        actionType: "warsztaty",
        date: "2026-06-15",
        facilityName: "Szkoła Podstawowa nr 3",
        municipality: "Myślibórz",
        topic: "higiena",
        audienceGroup: "uczniowie_sp",
        participantsCount: 40,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 65,
        leadEducator: "Krzysztof Palpuchowski",
        ezdStatus: "w_ezd",
        status: "wykonane",
      },
      distributionMaterials: [
        {
          materialId: mat1.id,
          title: mat1.title,
          type: mat1.materialType,
          quantity: 40,
        },
        {
          materialId: mat2.id,
          title: mat2.title,
          type: mat2.materialType,
          quantity: 25,
        },
      ],
    });

    expect(res.action).toBeDefined();
    expect(res.distributions).toBeDefined();
    expect(res.distributions?.length).toBe(2);

    const allDists = await db.getDistributions();
    const actionDists = allDists.filter((d) => d.actionId === res.action.id);
    expect(actionDists.length).toBe(2);

    const distMat1 = actionDists.find((d) => d.materialId === mat1.id);
    const distMat2 = actionDists.find((d) => d.materialId === mat2.id);

    expect(distMat1).toBeDefined();
    expect(distMat1?.quantity).toBe(40);
    expect(distMat1?.actionTitle).toBe("Warsztaty Higieny i Zdrowia");

    expect(distMat2).toBeDefined();
    expect(distMat2?.quantity).toBe(25);
    expect(distMat2?.actionTitle).toBe("Warsztaty Higieny i Zdrowia");
  });
});
