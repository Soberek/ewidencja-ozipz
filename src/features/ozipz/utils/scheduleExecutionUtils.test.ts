import { describe, it, expect } from "vitest";
import {
  getMatchingActionsForScheduleEvent,
  enrichScheduleEvent,
  getEventMonth,
} from "./scheduleExecutionUtils";
import type { OzipzAction, OzipzScheduleEvent } from "../types/ozipz.types";

describe("Ewidencja OZiPZ - Rozliczanie Harmonogramu z Rejestru Działań (scheduleExecutionUtils)", () => {
  const sampleEvent: OzipzScheduleEvent = {
    id: "harm-1",
    title: "Prelekcja dla młodzieży - Czyste Powietrze Wokół Nas",
    eventDate: "2026-03-15",
    month: 3,
    year: 2026,
    programName: "Czyste Powietrze Wokół Nas",
    location: "Szkoła Podstawowa nr 2 w Myśliborzu",
    responsiblePerson: "Krzysztof Palpuchowski",
    plannedCount: 1,
    status: "zaplanowane",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const sampleActionMatching: OzipzAction = {
    id: "act-1",
    title: "Prelekcja dla młodzieży - Czyste Powietrze Wokół Nas",
    actionType: "Prelekcja (warsztat)",
    date: "2026-03-12",
    programName: "Czyste Powietrze Wokół Nas",
    facilityName: "Szkoła Podstawowa nr 2 w Myśliborzu",
    municipality: "Myślibórz",
    topic: "tyton",
    audienceGroup: "Uczestnicy",
    participantsCount: 25,
    materialsDistributedCount: 0,
    leadEducator: "Krzysztof Palpuchowski",
    status: "wykonane",
    ezdStatus: "w_ezd",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  };

  const sampleActionWrongMonth: OzipzAction = {
    ...sampleActionMatching,
    id: "act-wrong-month",
    date: "2026-04-10",
  };

  it("extracts correct month from schedule event", () => {
    expect(getEventMonth(sampleEvent)).toBe(3);
    expect(getEventMonth({ ...sampleEvent, month: undefined, eventDate: "2026-08-20" })).toBe(8);
  });

  it("matches action with schedule event by program, month and location", () => {
    const matched = getMatchingActionsForScheduleEvent(sampleEvent, [sampleActionMatching, sampleActionWrongMonth]);
    expect(matched.length).toBe(1);
    expect(matched[0].id).toBe("act-1");
  });

  it("matches action with schedule event via explicit scheduleEventId link", () => {
    const directLinkedAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-linked",
      title: "Inny Tytuł",
      scheduleEventId: "harm-1",
    };
    const matched = getMatchingActionsForScheduleEvent(sampleEvent, [directLinkedAction]);
    expect(matched.length).toBe(1);
    expect(matched[0].id).toBe("act-linked");
  });

  it("enriches schedule event with auto-done status and matched actions list", () => {
    const enriched = enrichScheduleEvent(sampleEvent, [sampleActionMatching]);
    expect(enriched.computedCompletedCount).toBe(1);
    expect(enriched.isAutoDone).toBe(true);
    expect(enriched.effectiveStatus).toBe("wykonane");
    expect(enriched.matchedActions.length).toBe(1);
  });

  it("keeps status as zaplanowane when no matching actions exist in database", () => {
    const enriched = enrichScheduleEvent(sampleEvent, [sampleActionWrongMonth]);
    expect(enriched.computedCompletedCount).toBe(0);
    expect(enriched.isAutoDone).toBe(false);
    expect(enriched.effectiveStatus).toBe("zaplanowane");
  });

  it("marks media publication schedule items as done when any media article action exists in that month", () => {
    const mediaEvent: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-media",
      title: "Publikacja media społecznościowe i strona www",
      programName: undefined,
      location: "",
      month: 5,
      eventDate: "2026-05-10",
    };

    const mediaAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-media-post",
      actionType: "Artykuł / post w social mediach",
      title: "Post profilaktyczny na FB",
      date: "2026-05-18",
    };

    const enriched = enrichScheduleEvent(mediaEvent, [mediaAction]);
    expect(enriched.isAutoDone).toBe(true);
    expect(enriched.effectiveStatus).toBe("wykonane");
  });

  it("does not match action if schedule event is for a different facility", () => {
    const actionDifferentSchool: OzipzAction = {
      ...sampleActionMatching,
      id: "act-diff-school",
      facilityName: "Szkoła Podstawowa w Dębnie",
      facilityId: "loc-debno",
    };
    const matched = getMatchingActionsForScheduleEvent(sampleEvent, [actionDifferentSchool]);
    expect(matched.length).toBe(0);
  });

  it("preserves effectiveStatus as odwolane for cancelled events and avoids auto-matching", () => {
    const cancelledEvent: OzipzScheduleEvent = {
      ...sampleEvent,
      status: "odwolane",
    };
    const enriched = enrichScheduleEvent(cancelledEvent, [sampleActionMatching]);
    expect(enriched.effectiveStatus).toBe("odwolane");
    expect(enriched.isAutoDone).toBe(false);
    expect(enriched.computedCompletedCount).toBe(0);
    expect(enriched.matchedActions.length).toBe(0);
  });

  it("does not count an action explicitly linked to another schedule task", () => {
    const linkedElsewhere = { ...sampleActionMatching, scheduleEventId: "harm-2" };
    expect(getMatchingActionsForScheduleEvent(sampleEvent, [linkedElsewhere])).toEqual([]);
    expect(getMatchingActionsForScheduleEvent({ ...sampleEvent, id: "harm-2" }, [linkedElsewhere])).toEqual([linkedElsewhere]);
  });

  it("keeps an annotated task postponed even when a matching action exists", () => {
    const event = { ...sampleEvent, status: "odroczone", annotationReasonCode: "FERIE" };
    const enriched = enrichScheduleEvent(event, [sampleActionMatching]);
    expect(enriched.effectiveStatus).toBe("odroczone");
    expect(enriched.isAutoDone).toBe(false);
    expect(enrichScheduleEvent({ ...sampleEvent, status: "wykonane" }, []).isAutoDone).toBe(false);
    expect(enrichScheduleEvent({ ...sampleEvent, status: "wykonane" }, [sampleActionMatching]).isAutoDone).toBe(false);
  });

  it("shows a task explicitly marked in progress without registered actions", () => {
    expect(enrichScheduleEvent({ ...sampleEvent, status: "w_toku" }, []).effectiveStatus).toBe("w_trakcie");
  });

  it("resolves schedule program name by programId, programName, JRWA symbol, or keywords", () => {
    const dummyPrograms = [
      { id: "prog-tf", name: "Trzymaj Formę", jrwaSymbol: "966.1" },
      { id: "prog-zz", name: "Zdrowe Zęby Mamy, Marchewkę Zajadamy", jrwaSymbol: "966.3" },
    ];

    // 1. By JRWA symbol
    const eventJrwa: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-jrwa",
      title: "Konkurs plastyczny",
      programName: undefined,
      jrwa: "966.1",
    };
    const enriched1 = enrichScheduleEvent(eventJrwa, [], dummyPrograms as any);
    expect(enriched1.resolvedProgramName).toBe("Trzymaj Formę");
    expect(enriched1.resolvedJrwaSymbol).toBe("966.1");
    expect(enriched1.isProgrammatic).toBe(true);

    // 2. By programId
    const eventProgId: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-id",
      title: "Zadanie zębów",
      programId: "prog-zz",
      programName: undefined,
    };
    const enriched2 = enrichScheduleEvent(eventProgId, [], dummyPrograms as any);
    expect(enriched2.resolvedProgramName).toBe("Zdrowe Zęby Mamy, Marchewkę Zajadamy");
    expect(enriched2.isProgrammatic).toBe(true);

    // 3. By known JRWA catalog fallback (966.14 Bezpieczne Wakacje)
    const eventCatalog: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-vacation",
      programName: undefined,
      title: "Pogadanka o bezpieczeństwie",
      jrwa: "966.14",
    };
    const enriched3 = enrichScheduleEvent(eventCatalog, []);
    expect(enriched3.resolvedProgramName).toContain("Bezpieczne Wakacje");
    // 966.14 jest w słowniku JRWA działaniem NIEPROGRAMOWYM – tak samo jak w klasyfikacji działań
    expect(enriched3.isProgrammatic).toBe(false);
  });

  it("does not match actions with status 'planowane' or 'planned'", () => {
    const plannedAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-planned",
      status: "planowane",
    };
    const matched = getMatchingActionsForScheduleEvent(sampleEvent, [plannedAction]);
    expect(matched.length).toBe(0);
  });

  it("does not falsely match JRWA 966.1 with 966.14 or 966.10", () => {
    const tfEvent: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-tf",
      title: "Zadanie Trzymaj Formę",
      programName: undefined,
      jrwa: "966.1",
    };
    const bwAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-bw",
      title: "Bezpieczne Wakacje w szkole",
      programName: undefined,
      jrwaSign: "OZiPZ.966.14.1.2026",
    };
    const matched = getMatchingActionsForScheduleEvent(tfEvent, [bwAction]);
    expect(matched.length).toBe(0);

    const correctTfAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-tf-correct",
      title: "Inny Tytuł",
      programName: undefined,
      jrwaSign: "OZiPZ.966.1.3.2026",
    };
    const matchedCorrect = getMatchingActionsForScheduleEvent(tfEvent, [correctTfAction]);
    expect(matchedCorrect.length).toBe(1);
  });

  it("does not match an action purely by facility if title and topic are completely unrelated", () => {
    const dentalEvent: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-dental",
      title: "Fluoryzacja i higiena jamy ustnej",
      topic: "zeby",
      programName: undefined,
      jrwa: undefined,
      facilityId: "fac-1",
      location: "Szkoła Podstawowa nr 2 w Myśliborzu",
    };
    const tobaccoAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-tobacco",
      title: "Szkodliwość e-papierosów",
      topic: "tyton",
      programName: undefined,
      jrwaSign: undefined,
      facilityId: "fac-1",
      facilityName: "Szkoła Podstawowa nr 2 w Myśliborzu",
    };
    const matched = getMatchingActionsForScheduleEvent(dentalEvent, [tobaccoAction]);
    expect(matched.length).toBe(0);
  });

  describe("akcja profilaktyczna", () => {
    const campaignEvent: OzipzScheduleEvent = {
      ...sampleEvent,
      id: "harm-akcja",
      title: "Pogadanki wakacyjne",
      eventDate: "2026-07-01",
      month: 7,
      year: 2026,
      programName: undefined,
      location: "",
      campaignId: "bezpieczne_wakacje",
      campaignName: "Bezpieczne Wakacje",
      plannedCount: 2,
    };
    const campaignAction: OzipzAction = {
      ...sampleActionMatching,
      id: "act-akcja",
      title: "Bezpieczny wypoczynek nad wodą",
      date: "2026-07-08",
      programName: undefined,
      facilityName: "Półkolonie MOK",
      campaignId: "bezpieczne_wakacje",
      campaignName: "Bezpieczne Wakacje",
    };

    it("zalicza działanie z rejestru oznaczone tą samą akcją", () => {
      const matched = getMatchingActionsForScheduleEvent(campaignEvent, [campaignAction]);
      expect(matched.map((a) => a.id)).toEqual(["act-akcja"]);
    });

    it("dopasowuje starsze zapisy: etykieta w działaniu, id pozycji słownika w harmonogramie", () => {
      const legacyAction = { ...campaignAction, campaignId: "Bezpieczne Wakacje" };
      const legacyEvent = { ...campaignEvent, campaignId: "dict-cmp-2" };
      expect(getMatchingActionsForScheduleEvent(legacyEvent, [legacyAction])).toHaveLength(1);
    });

    it("nie zalicza działań innej akcji ani z innego miesiąca", () => {
      const otherCampaign = { ...campaignAction, id: "a2", campaignId: "bezpieczne_ferie", campaignName: "Bezpieczne Ferie" };
      const otherMonth = { ...campaignAction, id: "a3", date: "2026-08-02" };
      expect(getMatchingActionsForScheduleEvent(campaignEvent, [otherCampaign, otherMonth])).toHaveLength(0);
    });

    it("wykonanie zadania rośnie z liczbą działań akcji", () => {
      const second = { ...campaignAction, id: "act-akcja-2", date: "2026-07-20" };
      const enriched = enrichScheduleEvent(campaignEvent, [campaignAction, second]);
      expect(enriched.computedCompletedCount).toBe(2);
      expect(enriched.effectiveStatus).toBe("wykonane");
    });
  });
});
