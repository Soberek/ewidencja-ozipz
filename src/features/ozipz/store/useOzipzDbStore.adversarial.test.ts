import { describe, it, expect, beforeEach } from "vitest";
import { useOzipzDbStore } from "./useOzipzDbStore";

describe("Adversarial Verification Part 1: Action, Program & Reciprocal Cascades", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useOzipzDbStore.getState().loadAll();
  });

  it("cascades unlinking when deleting an action across all dependent collections", async () => {
    const state = useOzipzDbStore.getState();

    const action = await state.addAction({
      title: "Akcja do usunięcia",
      actionType: "prelekcja",
      date: "2026-09-12",
      facilityName: "Szkoła Podstawowa",
      municipality: "Myślibórz",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 15,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan Kowalski",
    });

    const dist = await state.addDistribution({
      materialTitle: "Ulotka testowa",
      quantity: 15,
      actionId: action.id,
      actionTitle: action.title,
      distributionDate: "2026-09-12",
      recipientName: "Szkoła Podstawowa",
      assignedEducator: "Jan Kowalski",
      purpose: "Edukacja",
    });

    const sched = await state.addScheduleEvent({
      title: "Harmonogram powiązany",
      eventDate: "2026-09-12",
      location: "Szkoła Podstawowa",
      month: 9,
      year: 2026,
      status: "done",
      responsiblePerson: "Jan Kowalski",
      actionId: action.id,
    });

    const jrwa = await state.addJrwaCase({
      section: "OZiPZ",
      jrwaSymbol: "966.1",
      caseNumber: 50,
      year: 2026,
      fullCaseSign: "OZiPZ.966.1.50.2026",
      title: "Sprawa powiązana",
      status: "zrealizowana",
      assignedEducator: "Jan Kowalski",
      actionId: action.id,
    });

    const pub = await state.addPublication({
      title: "Post o akcji",
      channel: "facebook",
      publicationDate: "2026-09-12",
      topic: "inne",
      author: "Jan Kowalski",
      actionId: action.id,
    });

    expect(useOzipzDbStore.getState().distributions.find((d) => d.id === dist.id)?.actionId).toBe(action.id);
    expect(useOzipzDbStore.getState().scheduleEvents.find((s) => s.id === sched.id)?.actionId).toBe(action.id);
    expect(useOzipzDbStore.getState().jrwaCases.find((j) => j.id === jrwa.id)?.actionId).toBe(action.id);
    expect(useOzipzDbStore.getState().publications.find((p) => p.id === pub.id)?.actionId).toBe(action.id);

    await state.deleteAction(action.id);

    const sAfter = useOzipzDbStore.getState();
    expect(sAfter.actions.some((a) => a.id === action.id)).toBe(false);

    const updatedDist = sAfter.distributions.find((d) => d.id === dist.id);
    expect(updatedDist).toBeDefined();
    expect(updatedDist?.actionId).toBeUndefined();
    expect(updatedDist?.actionTitle).toBeUndefined();

    const updatedSched = sAfter.scheduleEvents.find((s) => s.id === sched.id);
    expect(updatedSched?.actionId).toBeUndefined();

    const updatedJrwa = sAfter.jrwaCases.find((j) => j.id === jrwa.id);
    expect(updatedJrwa?.actionId).toBeUndefined();

    const updatedPub = sAfter.publications.find((p) => p.id === pub.id);
    expect(updatedPub?.actionId).toBeUndefined();
  });

  it("cascades unlinking when deleting a program across 7 relational domains", async () => {
    const state = useOzipzDbStore.getState();

    const prog = await state.addProgram({
      name: "Super Program Zdrowotny",
      code: "SPZ_2026",
      editionYear: "2026",
      jrwaSymbol: "966.3",
      description: "Test",
      targetAudience: "Dzieci",
      status: "aktywny",
      participatingSchoolsCount: 1,
      totalPupilsReached: 50,
    });

    const part = await state.addParticipation({
      programId: prog.id,
      programName: prog.name,
      facilityId: "fac-1",
      facilityName: "Szkoła 1",
      municipality: "Dębno",
      schoolYear: "2026/2027",
      pupilsCount: 50,
      schoolCoordinatorName: "Pani Basia",
      schoolCoordinatorContact: "basia@szkola1.pl",
      hasDeclaration: true,
      hasFinalReport: false,
      evaluationGrade: "dobra",
      notes: "",
    });

    const action = await state.addAction({
      title: "Akcja w programie",
      actionType: "pogadanka",
      date: "2026-09-15",
      facilityName: "Szkoła 1",
      municipality: "Dębno",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 25,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan",
      programId: prog.id,
      programName: prog.name,
    });

    const sched = await state.addScheduleEvent({
      title: "Zadanie z programu",
      eventDate: "2026-09-20",
      location: "Szkoła 1",
      month: 9,
      year: 2026,
      status: "planned",
      responsiblePerson: "Jan",
      programId: prog.id,
      programName: prog.name,
    });

    const jrwa = await state.addJrwaCase({
      section: "OZiPZ",
      jrwaSymbol: "966.3",
      caseNumber: 12,
      year: 2026,
      fullCaseSign: "OZiPZ.966.3.12.2026",
      title: "Sprawa programowa",
      status: "w_toku",
      assignedEducator: "Jan",
      programId: prog.id,
      programName: prog.name,
    });

    const letter = await state.addLetter({
      direction: "wychodzace",
      letterNumber: "1/2026",
      letterDate: "2026-09-10",
      senderRecipient: "Kuratorium",
      subject: "Raport programowy",
      assignedPerson: "Jan",
      status: "wyslane",
      programId: prog.id,
    });

    const scan = await state.addScan({
      title: "Skan sprawozdania",
      documentType: "sprawozdanie",
      facilityName: "Szkoła 1",
      scanDate: "2026-09-10",
      fileName: "test.pdf",
      programId: prog.id,
      programName: prog.name,
    });

    const reg = await state.addRegister({
      registerType: "szkolenia",
      date: "2026-09-10",
      title: "Szkolenie programowe",
      organizer: "PSSE",
      location: "Myślibórz",
      participantsCount: 20,
      programId: prog.id,
      programName: prog.name,
    });

    await expect(state.deleteProgram(prog.id)).rejects.toThrow("zapisanymi udziałami");
    expect(useOzipzDbStore.getState().participations.some((p) => p.id === part.id)).toBe(true);
    await state.deleteParticipation(part.id);
    await state.deleteProgram(prog.id);

    const s = useOzipzDbStore.getState();
    expect(s.programs.some((p) => p.id === prog.id)).toBe(false);
    expect(s.participations.some((p) => p.id === part.id)).toBe(false);

    const updatedAction = s.actions.find((a) => a.id === action.id);
    expect(updatedAction?.programId).toBeUndefined();
    expect(updatedAction?.programName).toBeUndefined();

    const updatedSched = s.scheduleEvents.find((e) => e.id === sched.id);
    expect(updatedSched?.programId).toBeUndefined();
    expect(updatedSched?.programName).toBeUndefined();

    const updatedJrwa = s.jrwaCases.find((j) => j.id === jrwa.id);
    expect(updatedJrwa?.programId).toBeUndefined();
    expect(updatedJrwa?.programName).toBeUndefined();

    const updatedLetter = s.letters.find((l) => l.id === letter.id);
    expect(updatedLetter?.programId).toBeUndefined();

    const updatedScan = s.scans.find((sc) => sc.id === scan.id);
    expect(updatedScan?.programId).toBeUndefined();
    expect(updatedScan?.programName).toBeUndefined();

    const updatedReg = s.registers.find((r) => r.id === reg.id);
    expect(updatedReg?.programId).toBeUndefined();
    expect(updatedReg?.programName).toBeUndefined();
  });

  it("handles schedule and JRWA reciprocal unlinks correctly", async () => {
    const state = useOzipzDbStore.getState();

    const sched = await state.addScheduleEvent({
      title: "Zadanie z akcją",
      eventDate: "2026-09-22",
      location: "PSSE Myślibórz",
      month: 9,
      year: 2026,
      status: "planned",
      responsiblePerson: "Jan",
    });

    const jrwa = await state.addJrwaCase({
      section: "OZiPZ",
      jrwaSymbol: "0442",
      caseNumber: 10,
      year: 2026,
      fullCaseSign: "OZiPZ.0442.10.2026",
      title: "Sprawa sprawozdawcza",
      status: "w_toku",
      assignedEducator: "Jan",
    });

    const action = await state.addAction({
      title: "Akcja dwukierunkowa",
      actionType: "warsztat",
      date: "2026-09-22",
      facilityName: "Szkoła",
      municipality: "Barlinek",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 15,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan",
      scheduleEventId: sched.id,
      jrwaCaseId: jrwa.id,
    });

    await state.deleteScheduleEvent(sched.id);
    expect(useOzipzDbStore.getState().actions.find((a) => a.id === action.id)?.scheduleEventId).toBeUndefined();

    await state.deleteJrwaCase(jrwa.id);
    expect(useOzipzDbStore.getState().actions.find((a) => a.id === action.id)?.jrwaCaseId).toBeUndefined();
  });
});
