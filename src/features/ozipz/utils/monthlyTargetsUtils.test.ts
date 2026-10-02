import { describe, it, expect, beforeEach } from "vitest";
import {
  getDefaultMonthlyTargets,
  compareWithReport,
  calculateMonthlyComplianceMatrix,
  loadMonthlyTargets,
  saveMonthlyTargets,
  monthlyTargetsArrayToYearlyMap,
  type OzipzYearlyMonthlyTargets,
} from "./monthlyTargetsUtils";
import type { OzipzAction, OzipzMonthlyTarget } from "../types/ozipz.types";

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

  it("treats any difference between records and the sent report as a mismatch", () => {
    const reported = { programActions: 3, programRecipients: 50, otherActions: 1, otherRecipients: 20 };
    expect(compareWithReport(reported, { ...reported }, true).status).toBe("zgodne");

    const moreRecorded = compareWithReport(reported, { ...reported, otherRecipients: 21 }, true);
    expect(moreRecorded.status).toBe("rozbieznosc");
    expect(moreRecorded.diff.otherRecipients).toBe(1);

    expect(compareWithReport(reported, { ...reported, programActions: 2 }, true).diff.programActions).toBe(-1);
    expect(compareWithReport(reported, reported, false).status).toBe("brak_sprawozdania");
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
    // Styczeń wg sprawozdania: 2 DZ programowe (50 ODB), 1 DZ nieprogramowe (20 ODB) -> Razem: 3 DZ, 70 ODB
    targets[1] = {
      month: 1,
      programActions: 2,
      programRecipients: 50,
      otherActions: 1,
      otherRecipients: 20,
    };
    // Luty wg sprawozdania: 2 DZ programowe (50 ODB), 0 DZ nieprogramowe -> Razem: 2 DZ, 50 ODB
    targets[2] = {
      month: 2,
      programActions: 2,
      programRecipients: 50,
      otherActions: 0,
      otherRecipients: 0,
    };

    actions.push(
      {
        id: "a6",
        title: "Odwołana",
        actionType: "prelekcja",
        date: "2026-02-21",
        programId: "prog-1",
        participantsCount: 25,
        numberOfActions: 1,
        status: "odwolane",
      } as OzipzAction
    );

    const { rows, summary } = calculateMonthlyComplianceMatrix({
      actions,
      targets,
      year: 2026,
    });

    expect(rows.length).toBe(12);

    // Styczeń: ewidencja zgodna ze sprawozdaniem
    const jan = rows[0];
    expect(jan.hasReport).toBe(true);
    expect(jan.monthly.recorded).toEqual({ programActions: 2, programRecipients: 50, otherActions: 1, otherRecipients: 20 });
    expect(jan.monthly.status).toBe("zgodne");
    expect(jan.cumulative.status).toBe("zgodne");

    // Luty: w sprawozdaniu 2 DZ / 50 ODB, w ewidencji wykonane 1 DZ / 40 ODB
    const feb = rows[1];
    expect(feb.monthly.recorded.programActions).toBe(1);
    expect(feb.monthly.recorded.programRecipients).toBe(40);
    expect(feb.monthly.diff.programActions).toBe(-1);
    expect(feb.monthly.diff.programRecipients).toBe(-10);
    expect(feb.monthly.status).toBe("rozbieznosc");

    // Narastająco sty–lut
    expect(feb.cumulative.reported.programActions).toBe(4);
    expect(feb.cumulative.recorded.programActions).toBe(3);
    expect(feb.cumulative.status).toBe("rozbieznosc");

    // Marzec: brak sprawozdania
    expect(rows[2].hasReport).toBe(false);
    expect(rows[2].monthly.status).toBe("brak_sprawozdania");

    expect(summary.reportedMonthsCount).toBe(2);
    expect(summary.matchingMonthsCount).toBe(1);
    expect(summary.mismatchedMonthsCount).toBe(1);
    expect(summary.lastReportedMonth).toBe(2);
    expect(summary.cumulative.reported.programRecipients).toBe(100);
    expect(summary.cumulative.recorded.programRecipients).toBe(90);
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
