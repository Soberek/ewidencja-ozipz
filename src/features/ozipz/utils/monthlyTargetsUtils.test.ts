import { describe, it, expect, beforeEach } from "vitest";
import {
  getDefaultMonthlyTargets,
  calculatePercent,
  getComplianceStatus,
  calculateMonthlyComplianceMatrix,
  loadMonthlyTargets,
  saveMonthlyTargets,
  extractTargetsFromScheduleEvents,
  monthlyTargetsArrayToYearlyMap,
  type OzipzYearlyMonthlyTargets,
} from "./monthlyTargetsUtils";
import type { OzipzAction, OzipzMonthlyTarget, OzipzScheduleEvent, OzipzProgram } from "../types/ozipz.types";

describe("Monthly Targets & Compliance Utils (monthlyTargetsUtils)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a 12-month default template with 0 values", () => {
    const targets = getDefaultMonthlyTargets();
    expect(Object.keys(targets).length).toBe(12);
    for (let m = 1; m <= 12; m++) {
      expect(targets[m].month).toBe(m);
      expect(targets[m].programActions).toBe(0);
      expect(targets[m].programRecipients).toBe(0);
      expect(targets[m].otherActions).toBe(0);
      expect(targets[m].otherRecipients).toBe(0);
    }
  });

  it("calculates percentage accurately and returns null if target is 0", () => {
    expect(calculatePercent(10, 20)).toBe(50);
    expect(calculatePercent(25, 20)).toBe(125);
    expect(calculatePercent(0, 50)).toBe(0);
    expect(calculatePercent(10, 0)).toBeNull();
  });

  it("determines compliance status based on achievement threshold", () => {
    expect(getComplianceStatus(100, 10)).toBe("compliant");
    expect(getComplianceStatus(120, 10)).toBe("compliant");
    expect(getComplianceStatus(75, 10)).toBe("warning");
    expect(getComplianceStatus(69, 10)).toBe("danger");
    expect(getComplianceStatus(null, 0)).toBe("no_target");
  });

  it("computes monthly compliance matrix with program and other breakdown", () => {
    const actions: OzipzAction[] = [
      // Styczeń (m=1): 2 działania programowe (50 ODB) i 1 nieprogramowe (20 ODB)
      {
        id: "a1",
        title: "Program 1",
        actionType: "prelekcja",
        date: "2026-01-10",
        programId: "prog-1",
        participantsCount: 30,
        numberOfActions: 1,
        status: "wykonane",
        ezdStatus: "w_ezd",
      } as OzipzAction,
      {
        id: "a2",
        title: "Program 2",
        actionType: "warsztat",
        date: "2026-01-20",
        programId: "prog-2",
        participantsCount: 20,
        numberOfActions: 1,
        status: "wykonane",
        ezdStatus: "w_ezd",
      } as OzipzAction,
      {
        id: "a3",
        title: "Pogadanka ogólna",
        actionType: "pogadanka",
        date: "2026-01-25",
        topic: "nieprogramowe",
        participantsCount: 20,
        numberOfActions: 1,
        status: "wykonane",
        ezdStatus: "w_ezd",
      } as OzipzAction,
      // Luty (m=2): 1 działanie programowe (40 ODB)
      {
        id: "a4",
        title: "Program Luty",
        actionType: "prelekcja",
        date: "2026-02-15",
        programId: "prog-1",
        participantsCount: 40,
        numberOfActions: 1,
        status: "wykonane",
        ezdStatus: "w_ezd",
      } as OzipzAction,
    ];

    const targets: OzipzYearlyMonthlyTargets = getDefaultMonthlyTargets();
    // Styczeń plan: 2 DZ programowe (50 ODB), 1 DZ nieprogramowe (20 ODB) -> Razem: 3 DZ, 70 ODB
    targets[1] = {
      month: 1,
      programActions: 2,
      programRecipients: 50,
      otherActions: 1,
      otherRecipients: 20,
    };
    // Luty plan: 2 DZ programowe (50 ODB), 0 DZ nieprogramowe -> Razem: 2 DZ, 50 ODB
    targets[2] = {
      month: 2,
      programActions: 2,
      programRecipients: 50,
      otherActions: 0,
      otherRecipients: 0,
    };

    const { rows, summary } = calculateMonthlyComplianceMatrix({
      actions,
      targets,
      year: 2026,
    });

    expect(rows.length).toBe(12);

    // Styczeń: idealna realizacja 100%
    const jan = rows[0];
    expect(jan.month).toBe(1);
    expect(jan.actualProgramActions).toBe(2);
    expect(jan.actualProgramRecipients).toBe(50);
    expect(jan.actualOtherActions).toBe(1);
    expect(jan.actualOtherRecipients).toBe(20);
    expect(jan.actualTotalActions).toBe(3);
    expect(jan.actualTotalRecipients).toBe(70);

    expect(jan.targetTotalActions).toBe(3);
    expect(jan.targetTotalRecipients).toBe(70);
    expect(jan.totalActionsPercent).toBe(100);
    expect(jan.totalRecipientsPercent).toBe(100);
    expect(jan.diffTotalActions).toBe(0);
    expect(jan.diffTotalRecipients).toBe(0);
    expect(jan.complianceStatus).toBe("compliant");

    // Luty: wykonano 1 DZ z 2 planowanych (50%) i 40 ODB z 50 planowanych (80%)
    const feb = rows[1];
    expect(feb.actualProgramActions).toBe(1);
    expect(feb.actualProgramRecipients).toBe(40);
    expect(feb.actualTotalActions).toBe(1);
    expect(feb.targetTotalActions).toBe(2);
    expect(feb.totalActionsPercent).toBe(50); // 1 / 2 = 50%
    expect(feb.diffTotalActions).toBe(-1);
    expect(feb.diffTotalRecipients).toBe(-10);
    expect(feb.complianceStatus).toBe("danger"); // < 70%

    // Podsumowanie roczne
    expect(summary.actualTotalActions).toBe(4);
    expect(summary.actualTotalRecipients).toBe(110);
    expect(summary.targetTotalActions).toBe(5);
    expect(summary.targetTotalRecipients).toBe(120);
    expect(summary.totalActionsPercent).toBe(80); // 4 / 5 = 80%
    expect(summary.complianceStatus).toBe("warning");
  });

  it("persists and restores targets from localStorage", () => {
    const targets = getDefaultMonthlyTargets();
    targets[5] = {
      month: 5,
      programActions: 10,
      programRecipients: 250,
      otherActions: 3,
      otherRecipients: 60,
      notes: "Majowe festyny",
    };

    saveMonthlyTargets(2026, targets);
    const restored = loadMonthlyTargets(2026);

    expect(restored[5].programActions).toBe(10);
    expect(restored[5].programRecipients).toBe(250);
    expect(restored[5].otherActions).toBe(3);
    expect(restored[5].otherRecipients).toBe(60);
    expect(restored[5].notes).toBe("Majowe festyny");
  });

  it("extracts planned targets accurately from schedule events", () => {
    const events: Partial<OzipzScheduleEvent>[] = [
      {
        id: "ev-1",
        title: "Warsztat Bieg po Zdrowie",
        eventDate: "2026-03-12",
        month: 3,
        year: 2026,
        programId: "prog-1",
        plannedCount: 2,
        status: "zaplanowane",
      },
      {
        id: "ev-2",
        title: "Festyn Zdrowia (akcja własna)",
        eventDate: "2026-03-20",
        month: 3,
        year: 2026,
        plannedCount: 1,
        status: "zaplanowane",
      },
      {
        id: "ev-3",
        title: "Odwołana prelekcja",
        eventDate: "2026-03-25",
        month: 3,
        year: 2026,
        programId: "prog-1",
        plannedCount: 1,
        status: "odwolane",
      },
      {
        id: "ev-4",
        title: "Higiena jamy ustnej",
        eventDate: "2026-04-10",
        month: 4,
        year: 2026,
        jrwa: "966.3",
        plannedCount: 3,
        status: "zaplanowane",
      },
    ];

    const programs: Partial<OzipzProgram>[] = [
      { id: "prog-1", name: "Bieg po Zdrowie", jrwaSymbol: "966.1" },
      { id: "prog-3", name: "Czyste Zęby", jrwaSymbol: "966.3" },
    ];

    const extracted = extractTargetsFromScheduleEvents(
      events as OzipzScheduleEvent[],
      2026,
      programs as OzipzProgram[]
    );
    expect(extracted[3].programActions).toBe(2);
    expect(extracted[3].otherActions).toBe(1);
    expect(extracted[4].programActions).toBe(3);
    expect(extracted[1].programActions).toBe(0);
  });

  it("handles conflicting year indicators and yearless events correctly", () => {
    const events: Partial<OzipzScheduleEvent>[] = [
      {
        id: "ev-conflict-year-priority",
        title: "Zadanie z planu 2026 ze starym eventDate",
        year: 2026,
        month: 1,
        eventDate: "2025-12-31",
        programId: "prog-1",
        plannedCount: 2,
        status: "zaplanowane",
      },
      {
        id: "ev-wrong-year",
        title: "Zadanie z roku 2025",
        year: 2025,
        month: 1,
        eventDate: "2025-01-15",
        plannedCount: 5,
        status: "zaplanowane",
      },
      {
        id: "ev-no-year-no-date",
        title: "Zadanie bez roku i bez daty",
        month: 1,
        plannedCount: 3,
        status: "zaplanowane",
      },
      {
        id: "ev-date-only-2026",
        title: "Zadanie z samą datą 2026",
        eventDate: "2026-02-10",
        programName: "Program Czyste Zęby",
        plannedCount: 1,
        status: "zaplanowane",
      },
    ];

    const targets2026 = extractTargetsFromScheduleEvents(events as OzipzScheduleEvent[], 2026);
    // ev-conflict-year-priority is included in month 1 because year=2026 takes priority: 2 DZ
    // ev-wrong-year is excluded
    // ev-no-year-no-date is excluded (evYear=0 !== 2026)
    expect(targets2026[1].programActions).toBe(2);
    expect(targets2026[1].otherActions).toBe(0);

    // ev-date-only-2026 is included in month 2: 1 DZ
    expect(targets2026[2].programActions).toBe(1);
  });

  it("converts relational database monthly targets array to yearly map", () => {
    const dbRows: OzipzMonthlyTarget[] = [
      {
        id: "mt-2026-1",
        year: 2026,
        month: 1,
        programActions: 4,
        programRecipients: 80,
        otherActions: 1,
        otherRecipients: 20,
        notes: "Styczeń",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "mt-2026-6",
        year: 2026,
        month: 6,
        programActions: 12,
        programRecipients: 300,
        otherActions: 4,
        otherRecipients: 100,
        createdAt: "2026-06-01",
        updatedAt: "2026-06-01",
      },
    ];

    const map = monthlyTargetsArrayToYearlyMap(dbRows);
    expect(map[1].programActions).toBe(4);
    expect(map[1].programRecipients).toBe(80);
    expect(map[1].otherActions).toBe(1);
    expect(map[1].otherRecipients).toBe(20);
    expect(map[1].notes).toBe("Styczeń");

    expect(map[6].programActions).toBe(12);
    expect(map[6].programRecipients).toBe(300);

    expect(map[2].programActions).toBe(0);
  });
});
