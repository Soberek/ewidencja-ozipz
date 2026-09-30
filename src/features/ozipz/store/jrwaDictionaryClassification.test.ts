import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOzipzDbStore } from "./useOzipzDbStore";
import { isProgramAction } from "../utils/ozipzCalculations";
import { buildReportAnnexRows } from "../utils/reportAnnex";
import { resolveScheduleProgram, scheduleProgramLabel } from "../utils/scheduleProgramResolver";
import { getActiveJrwaNamesMap } from "../utils/calculators/jrwaClassification";
import { useReportsData } from "../components/reports/useReportsData";
import type { OzipzAction, OzipzProgram, OzipzScheduleEvent } from "../types/ozipz.types";

describe("JRWA Dictionary Classification as Single Source of Truth (SSOT)", () => {
  beforeEach(async () => {
    await useOzipzDbStore.getState().loadAll();
  });

  it("dynamically recognizes newly added JRWA symbol as PROGRAMOWE in isProgramAction and reports", async () => {
    // 1. Initially, an unrecognized JRWA code without programId defaults to false unless actionType=programowe
    const testAction: OzipzAction = {
      id: "act-test-jrwa-ssot",
      title: "Warsztaty Nowego Programu",
      actionType: "Prelekcja (warsztat)",
      date: "2026-04-10",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "Edukacja zdrowotna",
      audienceGroup: "Uczniowie",
      jrwaSign: "OZiPZ.966.88.1.2026",
      ezdStatus: "Robocze",
      status: "Zrealizowane",
      participantsCount: 45,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 1,
      leadEducator: "Jan Kowalski",
      createdAt: "2026-04-10T10:00:00Z",
      updatedAt: "2026-04-10T10:00:00Z",
    };

    // Before adding to dictionary:
    expect(isProgramAction(testAction)).toBe(false);

    // 2. Add new JRWA symbol to dictionary with kind: "PROGRAMOWE"
    const newJrwaItem = await useOzipzDbStore.getState().addDictionaryItem({
      dictType: "jrwaSymbol",
      code: "966.88",
      label: "Program Profilaktyczny Nowej Generacji",
      description: "Nowo zarejestrowany program w wykazie akt",
      kind: "PROGRAMOWE",
      isSystem: false,
    });

    expect(newJrwaItem.id).toBeDefined();
    expect(newJrwaItem.kind).toBe("PROGRAMOWE");

    // 3. Verify that isProgramAction now dynamically returns true (SSOT!)
    expect(isProgramAction(testAction)).toBe(true);

    // 4. Verify report annex aggregation classifies it as programowe with the dynamic label
    const annexRows = buildReportAnnexRows([testAction]);
    expect(annexRows.length).toBeGreaterThan(0);
    const row = annexRows.find((r) => r.jrwa === "966.88");
    expect(row).toBeDefined();
    expect(row?.kind).toBe("programowe");
    expect(row?.programName).toBe("Program Profilaktyczny Nowej Generacji");

    // 5. Update dictionary item to "NIEPROGRAMOWE"
    await useOzipzDbStore.getState().updateDictionaryItem(newJrwaItem.id, {
      kind: "NIEPROGRAMOWE",
    });

    // 6. Verify that isProgramAction now immediately returns false
    expect(isProgramAction(testAction)).toBe(false);

    // 7. And annex aggregation classifies it as nieprogramowe
    const updatedAnnexRows = buildReportAnnexRows([testAction]);
    const updatedRow = updatedAnnexRows.find((r) => r.jrwa === "966.88");
    expect(updatedRow?.kind).toBe("nieprogramowe");
  });

  it("correctly extracts and classifies non-966 custom symbols like 851.1 (SSOT across different prefixes)", async () => {
    const customAction: OzipzAction = {
      id: "act-test-non-966",
      title: "Interwencja Ochrony Zdrowia",
      actionType: "Prelekcja (warsztat)",
      date: "2026-05-15",
      facilityName: "Centrum Kultury",
      municipality: "Dębno",
      topic: "Ochrona zdrowia",
      audienceGroup: "Dorośli",
      jrwaSign: "OZiPZ.851.1.1.2026",
      ezdStatus: "Robocze",
      status: "wykonane",
      participantsCount: 50,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 1,
      leadEducator: "Anna Nowak",
      createdAt: "2026-05-15T10:00:00Z",
      updatedAt: "2026-05-15T10:00:00Z",
    };

    // Before adding:
    expect(isProgramAction(customAction)).toBe(false);

    // Add 851.1 to dictionary:
    const item = await useOzipzDbStore.getState().addDictionaryItem({
      dictType: "jrwaSymbol",
      code: "851.1",
      label: "Program Ochrony Zdrowia i Profilaktyki",
      kind: "PROGRAMOWE",
      isSystem: false,
    });

    expect(isProgramAction(customAction)).toBe(true);

    // Update to NIEPROGRAMOWE
    await useOzipzDbStore.getState().updateDictionaryItem(item.id, {
      kind: "NIEPROGRAMOWE",
    });

    expect(isProgramAction(customAction)).toBe(false);
  });

  it("prioritizes nested specific JRWA symbols over broader parent symbols (e.g. 966.1.99 vs 966.1)", async () => {
    // 966.1 is PROGRAMOWE by default
    const parentAction: OzipzAction = {
      id: "act-parent-966-1",
      title: "Trzymaj formę - ogólne",
      actionType: "Prelekcja",
      date: "2026-06-01",
      facilityName: "SP 2",
      municipality: "Myślibórz",
      topic: "Żywienie",
      audienceGroup: "Uczniowie",
      jrwaSign: "OZiPZ.966.1.5.2026",
      ezdStatus: "Robocze",
      status: "wykonane",
      participantsCount: 30,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 1,
      leadEducator: "Jan Kowalski",
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    };

    // Add nested child code 966.1.99 as NIEPROGRAMOWE
    await useOzipzDbStore.getState().addDictionaryItem({
      dictType: "jrwaSymbol",
      code: "966.1.99",
      label: "Doraźny konkurs Trzymaj Formę (nieprogramowy)",
      kind: "NIEPROGRAMOWE",
      isSystem: false,
    });

    const childAction: OzipzAction = {
      ...parentAction,
      id: "act-child-966-1-99",
      jrwaSign: "OZiPZ.966.1.99.1.2026",
    };

    expect(isProgramAction(parentAction)).toBe(true);
    expect(isProgramAction(childAction)).toBe(false);
  });

  it("enforces JRWA dictionary classification as SSOT over conflicting actionType fields", async () => {
    // 966.1 is PROGRAMOWE in dictionary. Even if actionType says 'wlasne', dictionary dictates PROGRAMOWE!
    const progActionWithWlasneType: OzipzAction = {
      id: "act-ssot-override-1",
      title: "Trzymaj formę szkolenie",
      actionType: "wlasne",
      date: "2026-07-01",
      facilityName: "SP 1",
      municipality: "Myślibórz",
      topic: "Żywienie",
      audienceGroup: "Uczniowie",
      jrwaSign: "OZiPZ.966.1.12.2026",
      ezdStatus: "Robocze",
      status: "wykonane",
      participantsCount: 25,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 1,
      leadEducator: "Jan Kowalski",
      createdAt: "2026-07-01T10:00:00Z",
      updatedAt: "2026-07-01T10:00:00Z",
    };
    expect(isProgramAction(progActionWithWlasneType)).toBe(true);

    // 966.14 is NIEPROGRAMOWE in dictionary. Even if actionType says 'programowe', dictionary dictates NIEPROGRAMOWE!
    const nonProgActionWithProgramoweType: OzipzAction = {
      id: "act-ssot-override-2",
      title: "Bezpieczne wakacje nad jeziorem",
      actionType: "programowe",
      date: "2026-07-05",
      facilityName: "Plaża Miejska",
      municipality: "Myślibórz",
      topic: "Bezpieczeństwo",
      audienceGroup: "Dzieci",
      jrwaSign: "OZiPZ.966.14.8.2026",
      ezdStatus: "Robocze",
      status: "wykonane",
      participantsCount: 40,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 1,
      leadEducator: "Jan Kowalski",
      createdAt: "2026-07-05T10:00:00Z",
      updatedAt: "2026-07-05T10:00:00Z",
    };
    expect(isProgramAction(nonProgActionWithProgramoweType)).toBe(false);
  });

  it("resolveScheduleProgram classifies events according to the dynamic JRWA dictionary", async () => {
    // Non-programmatic administrative task
    const eventAdmin: OzipzScheduleEvent = {
      id: "sch-test-admin",
      title: "Porządkowanie dokumentacji biurowej",
      eventDate: "2026-07-10",
      location: "Biuro",
      responsiblePerson: "Jan Kowalski",
      status: "zaplanowane",
      category: "Administracja",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const resAdmin = resolveScheduleProgram(eventAdmin);
    expect(resAdmin.isProgrammatic).toBe(false);

    // 966.14 is resolved as Bezpieczne Wakacje in schedule – NIEPROGRAMOWE in the JRWA dictionary
    const event96614: OzipzScheduleEvent = {
      id: "sch-test-14",
      title: "Spotkanie profilaktyczne Bezpieczne Wakacje",
      eventDate: "2026-07-10",
      location: "Plaża Miejska",
      responsiblePerson: "Jan Kowalski",
      status: "zaplanowane",
      jrwa: "966.14",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const res14 = resolveScheduleProgram(event96614);
    expect(res14.isProgrammatic).toBe(false);
    expect(res14.name).toContain("Bezpieczne Wakacje");

    // 966.3 is PROGRAMOWE
    const event9663: OzipzScheduleEvent = {
      id: "sch-test-3",
      title: "Zajęcia Zdrowe Zęby",
      eventDate: "2026-04-10",
      location: "Przedszkole",
      responsiblePerson: "Anna Nowak",
      status: "zaplanowane",
      jrwa: "966.3",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const res3 = resolveScheduleProgram(event9663);
    expect(res3.isProgrammatic).toBe(true);

    // Add new custom symbol 851.2 as PROGRAMOWE
    await useOzipzDbStore.getState().addDictionaryItem({
      dictType: "jrwaSymbol",
      code: "851.2",
      label: "Nowy Program Promocji Zdrowia",
      kind: "PROGRAMOWE",
      isSystem: false,
    });

    const eventCustom: OzipzScheduleEvent = {
      id: "sch-test-custom",
      title: "Zajęcia z nowego programu",
      eventDate: "2026-09-01",
      location: "Szkoła",
      responsiblePerson: "Jan Kowalski",
      status: "zaplanowane",
      jrwa: "851.2",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const resCustom = resolveScheduleProgram(eventCustom);
    expect(resCustom.isProgrammatic).toBe(true);
    expect(resCustom.name).toBe("Nowy Program Promocji Zdrowia");

    // Imported schedule rows keep the JRWA symbol only in category / title
    const importedProgram = resolveScheduleProgram({ ...event9663, id: "sch-imp-1", jrwa: undefined, category: "JRWA 966.1", title: "Konkurs (quiz) (JRWA 966.1)" });
    expect(importedProgram.symbol).toBe("966.1");
    expect(importedProgram.isProgrammatic).toBe(true);
    const importedOther = resolveScheduleProgram({ ...event9663, id: "sch-imp-2", jrwa: undefined, category: "JRWA 966.14", title: "Dystrybucja (JRWA 966.14)" });
    expect(importedOther.symbol).toBe("966.14");
    expect(importedOther.isProgrammatic).toBe(false);

    // Kilka programów pod jednym symbolem (ferie i wakacje) – nazwa teczki ze słownika, nie przypadkowy program
    const twoPrograms = [
      { id: "bezpieczne-ferie", name: "Bezpieczne ferie", jrwaSymbol: "966.14" },
      { id: "bezpieczne-wakacje", name: "Bezpieczne wakacje", jrwaSymbol: "966.14" },
    ] as OzipzProgram[];
    const shared = resolveScheduleProgram({ ...event9663, id: "sch-imp-3", jrwa: undefined, category: "JRWA 966.14" }, twoPrograms);
    expect(shared.name).toBe(getActiveJrwaNamesMap().get("966.14"));
    expect(scheduleProgramLabel({ ...event9663, id: "sch-imp-4", jrwa: undefined, category: "JRWA 966.1" }, [])).toMatch(/\(JRWA 966\.1\)$/);
  });

  it("immediately recalculates useReportsData live KPI when JRWA dictionary item classification changes", async () => {
    // Add custom JRWA symbol 966.77 as NIEPROGRAMOWE
    const dictItem = await useOzipzDbStore.getState().addDictionaryItem({
      dictType: "jrwaSymbol",
      code: "966.77",
      label: "Program Eksperymentalny 77",
      kind: "NIEPROGRAMOWE",
      isSystem: false,
    });

    const action77: OzipzAction = {
      id: "act-test-reactive-77",
      title: "Działanie 77",
      actionType: "Prelekcja",
      date: "2026-05-10",
      facilityName: "Szkoła 1",
      municipality: "Myślibórz",
      topic: "Zdrowie",
      audienceGroup: "Uczniowie",
      jrwaSign: "OZiPZ.966.77.1.2026",
      ezdStatus: "Robocze",
      status: "wykonane",
      participantsCount: 100,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      numberOfActions: 2,
      leadEducator: "Jan Kowalski",
      createdAt: "2026-05-10T10:00:00Z",
      updatedAt: "2026-05-10T10:00:00Z",
    };

    const { result } = renderHook(() =>
      useReportsData({
        allActions: [action77],
        year: 2026,
        months: [5],
      })
    );

    // Initially NIEPROGRAMOWE:
    expect(result.current.metricSummary.programoweActions).toBe(0);
    expect(result.current.metricSummary.otherActions).toBe(2);

    // Update to PROGRAMOWE
    await act(async () => {
      await useOzipzDbStore.getState().updateDictionaryItem(dictItem.id, {
        kind: "PROGRAMOWE",
      });
    });

    // Recomputed live!
    expect(result.current.metricSummary.programoweActions).toBe(2);
    expect(result.current.metricSummary.otherActions).toBe(0);
    expect(result.current.metricSummary.programowePeople).toBe(100);
  });
});
