import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { OzipzDbService } from "../../../../db/client";
import { emptyMetricPlan } from "./components/reportConstants";
import { useReportsData } from "./useReportsData";
import type { OzipzAction } from "../../types/ozipz.types";

vi.mock("../../utils/reportExport", () => ({
  downloadHealthPromotionReportWorkbook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../utils/reportAnnex", () => ({
  buildReportAnnexRows: vi.fn().mockReturnValue([]),
  buildReportHierarchy: vi.fn().mockReturnValue({ categories: [] }),
  downloadAnnexReportExcel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../utils/vacationReporting", () => ({
  buildVacationSummary: vi.fn().mockReturnValue({
    turnusy: 0,
    uczestnicy: 0,
    pokoje: 0,
  }),
  isVacationAction: vi.fn().mockReturnValue(true),
}));

describe("useReportsData Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockActions: OzipzAction[] = [
    {
      id: "act-1",
      title: "Warsztaty w szkole (programowe)",
      date: "2026-05-10",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      programId: "prog-tf",
      programName: "Trzymaj Formę!",
      actionType: "Prelekcja",
      topic: "zdrowy_styl_zycia",
      audienceGroup: "Dzieci",
      participantsCount: 30,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 15,
      status: "wykonane",
      ezdStatus: "w_ezd",
      leadEducator: "Jan Kowalski",
      createdAt: "2026-05-10",
      updatedAt: "2026-05-10",
    },
    {
      id: "act-2",
      title: "Punkt informacyjny (nieprogramowe)",
      date: "2026-05-20",
      facilityName: "Rynek Miejski",
      municipality: "Myślibórz",
      actionType: "Stoisko informacyjno-edukacyjne",
      topic: "tyton",
      audienceGroup: "Mieszkańcy",
      participantsCount: 50,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 50,
      status: "wykonane",
      ezdStatus: "w_ezd",
      leadEducator: "Anna Nowak",
      createdAt: "2026-05-20",
      updatedAt: "2026-05-20",
    },
    {
      id: "act-3",
      title: "Akcja z innego roku",
      date: "2025-05-10",
      facilityName: "Szkoła",
      municipality: "Barlinek",
      actionType: "Prelekcja",
      topic: "higiena",
      audienceGroup: "Dzieci",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      status: "wykonane",
      ezdStatus: "w_ezd",
      leadEducator: "Jan Kowalski",
      createdAt: "2025-05-10",
      updatedAt: "2025-05-10",
    },
    {
      id: "act-4",
      title: "Akcja z innego miesiąca w 2026",
      date: "2026-09-15",
      facilityName: "Szkoła 2",
      municipality: "Dębno",
      actionType: "Prelekcja",
      topic: "alkohol",
      audienceGroup: "Młodzież",
      participantsCount: 40,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      status: "zaplanowane",
      ezdStatus: "w_ezd",
      leadEducator: "Anna Nowak",
      createdAt: "2026-09-15",
      updatedAt: "2026-09-15",
    },
  ];

  it("filters actions strictly by specified year and months", () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [5], // maj
      })
    );

    expect(result.current.yearActions.length).toBe(3); // act-1, act-2, act-4
    expect(result.current.filteredActions.length).toBe(2); // act-1, act-2
    expect(result.current.summary.tasks).toBe(2);
    expect(result.current.summary.recipients).toBe(80); // 30 + 50
    expect(result.current.summary.materials).toBe(65); // 15 + 50
    expect(result.current.summary.completed).toBe(2);
  });

  it("computes monthlyRows and maxMonthlyActions properly", () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      })
    );

    const mayRow = result.current.monthlyRows.find((r) => r.month === 5);
    expect(mayRow?.tasks).toBe(2);
    expect(mayRow?.recipients).toBe(80);

    const sepRow = result.current.monthlyRows.find((r) => r.month === 9);
    expect(sepRow?.tasks).toBe(1);
    expect(sepRow?.recipients).toBe(40);

    expect(result.current.maxMonthlyActions).toBeGreaterThanOrEqual(2);
  });

  it("separates program and other actions in statisticsRows", () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [5],
      })
    );

    const mayStat = result.current.statisticsRows.find((r) => r.month === 5);
    expect(mayStat).toBeDefined();
    expect(mayStat?.programActions).toBe(1);
    expect(mayStat?.programRecipients).toBe(30);
    expect(mayStat?.otherActions).toBe(1);
    expect(mayStat?.otherRecipients).toBe(50);
    expect(mayStat?.totalActions).toBe(2);
    expect(mayStat?.totalRecipients).toBe(80);
  });

  it("calculates metricSummary and percentage execution vs budget plan", () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [5],
      })
    );

    act(() => {
      result.current.setMetricPlan({
        razemDzialania: 4,
        razemUczestnicy: 160,
        programyDzialania: 2,
        programyUczestnicy: 60,
      });
    });

    // 2 z 4 działań -> 50%
    expect(result.current.metricSummary.totalActions).toBe(2);
    expect(result.current.metricSummary.totalActionsPercent).toBe(50);

    // 80 z 160 uczestników -> 50%
    expect(result.current.metricSummary.totalPeople).toBe(80);
    expect(result.current.metricSummary.totalPeoplePercent).toBe(50);

    // 1 z 2 działań programowych -> 50%
    expect(result.current.metricSummary.programoweActions).toBe(1);
    expect(result.current.metricSummary.programActionsPercent).toBe(50);

    // 30 z 60 uczestników programowych -> 50%
    expect(result.current.metricSummary.programowePeople).toBe(30);
    expect(result.current.metricSummary.programPeoplePercent).toBe(50);
  });

  it("persists metricPlan in the database and loads it back for the same year", async () => {
    const newPlan = {
      razemDzialania: 10,
      razemUczestnicy: 500,
      programyDzialania: 5,
      programyUczestnicy: 250,
    };
    const first = renderHook(() => useReportsData({ allActions: mockActions, year: 2026, months: [5] }));
    act(() => {
      first.result.current.handlePersistMetricPlan(newPlan);
    });
    await waitFor(async () => expect(await OzipzDbService.getMetricPlan(2026)).toEqual(newPlan));
    first.unmount();

    const reopened = renderHook(() => useReportsData({ allActions: mockActions, year: 2026, months: [5] }));
    await waitFor(() => expect(reopened.result.current.metricPlan).toEqual(newPlan));
    expect(reopened.result.current.metricPlanSource).toEqual({ kind: "saved" });
    // Rok bez planu podpowiada ostatni zapisany plan, ale nie zapisuje go sam.
    const nextYear = renderHook(() => useReportsData({ allActions: mockActions, year: 2027, months: [5] }));
    await waitFor(() => expect(nextYear.result.current.metricPlanSource).toEqual({ kind: "inherited", fromYear: 2026 }));
    expect(nextYear.result.current.metricPlan).toEqual(newPlan);
    expect(await OzipzDbService.getMetricPlan(2027)).toBeNull();
    // Bez wcześniejszych planów – zera zamiast zgadywanych wartości.
    const oldYear = renderHook(() => useReportsData({ allActions: mockActions, year: 2010, months: [5] }));
    await waitFor(() => expect(oldYear.result.current.metricPlanSource).toEqual({ kind: "empty" }));
    expect(oldYear.result.current.metricPlan).toEqual(emptyMetricPlan);
  });

  it("zapisuje zmiany planu w bazie automatycznie", async () => {
    const { result } = renderHook(() => useReportsData({ allActions: mockActions, year: 2031, months: [5] }));
    await waitFor(() => expect(result.current.metricPlanSource.kind).not.toBe("saved"));
    act(() => {
      result.current.setMetricPlan((prev) => ({ ...prev, razemDzialania: 250, razemUczestnicy: 7500 }));
    });
    act(() => {
      result.current.setMetricPlan((prev) => ({ ...prev, programyDzialania: 150, programyUczestnicy: 2500 }));
    });
    await waitFor(async () =>
      expect(await OzipzDbService.getMetricPlan(2031)).toEqual({ razemDzialania: 250, razemUczestnicy: 7500, programyDzialania: 150, programyUczestnicy: 2500 })
    );
    await waitFor(() => expect(result.current.metricPlanSource).toEqual({ kind: "saved" }));
  });

  it("nie nadpisuje planu wpisanego, zanim baza zdążyła go wczytać", async () => {
    const stored = { razemDzialania: 1, razemUczestnicy: 1, programyDzialania: 1, programyUczestnicy: 1 };
    let resolveLoad: (plan: typeof stored) => void = () => undefined;
    const load = vi.spyOn(OzipzDbService, "getMetricPlan").mockImplementationOnce(
      () => new Promise((resolve) => { resolveLoad = resolve; })
    );
    const { result } = renderHook(() => useReportsData({ allActions: mockActions, year: 2032, months: [5] }));
    act(() => {
      result.current.setMetricPlan((prev) => ({ ...prev, razemDzialania: 400 }));
    });
    await act(async () => {
      resolveLoad(stored);
    });
    expect(result.current.metricPlan.razemDzialania).toBe(400);
    load.mockRestore();
  });

  it("handles XLSX export call and sets success message", async () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [5],
      })
    );

    await act(async () => {
      await result.current.handleExportXlsx();
    });

    expect(result.current.exportSuccess).toBe("Pobrano arkusz sprawozdania .xlsx");
    expect(result.current.exportError).toBeNull();
  });

  it("initializes preparedPersonId without 'auto' string leak and provides clean persons list", () => {
    const { result } = renderHook(() =>
      useReportsData({
        allActions: mockActions,
        year: 2026,
        months: [5],
      })
    );

    expect(result.current.preparedPersonId).toBe("");
    expect(result.current.preparedPersonId).not.toBe("auto");
    expect(result.current.persons.some((p) => p.id === "auto")).toBe(false);
    expect(result.current.persons.map((p) => p.name)).toEqual(["Anna Nowak", "Jan Kowalski"]);
  });
});
