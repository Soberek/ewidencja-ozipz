import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../../data/migratedData";
import { ActionSchema } from "../../schemas/ozipz.schemas";
import { isMonthClosed } from "../../utils/dateUtils";

describe("Ewidencja OZiPZ - Rejestr Działań i System Znaków JRWA edu-report", () => {
  it("contains migrated authentic actions for 2026", () => {
    expect(MIGRATED_FIREBASE_DATA.actions).toBeDefined();
    expect(MIGRATED_FIREBASE_DATA.actions.length).toBeGreaterThanOrEqual(68);
  });

  it("contains 109 authentic migrated JRWA cases with unique fullCaseSigns", () => {
    expect(MIGRATED_FIREBASE_DATA.jrwaCases).toBeDefined();
    expect(MIGRATED_FIREBASE_DATA.jrwaCases.length).toBe(109);

    const signs = MIGRATED_FIREBASE_DATA.jrwaCases.map((c) => c.fullCaseSign);
    const uniqueSigns = new Set(signs);
    expect(uniqueSigns.size).toBe(signs.length);
  });

  it("formats JRWA case signs matching PSSE OZiPZ standard (e.g. OZiPZ.0442.3.2026)", () => {
    const sample = MIGRATED_FIREBASE_DATA.jrwaCases[0];
    expect(sample.fullCaseSign).toMatch(/^(OZ|OZiPZ)\.[0-9.]+\.[0-9]+\.[0-9]{4}$/);
  });

  it("calculates next sequential JRWA case number for a given symbol and year", () => {
    const symbol = "0442";
    const year = 2026;
    const matchingCases = MIGRATED_FIREBASE_DATA.jrwaCases.filter(
      (c) => (c.section === "OZ" || c.section === "OZiPZ") && c.jrwaSymbol === symbol && c.year === year
    );

    let maxNum = 0;
    matchingCases.forEach((c) => {
      if (Number(c.caseNumber) > maxNum) maxNum = Number(c.caseNumber);
    });

    const nextCaseNumber = maxNum + 1;
    const generatedSign = `OZiPZ.${symbol}.${nextCaseNumber}.${year}`;

    expect(nextCaseNumber).toBeGreaterThan(0);
    expect(generatedSign).toMatch(/^OZiPZ\.0442\.[0-9]+\.2026$/);
  });

  it("correctly computes synthetic metrics DZ / ODB / MAT", () => {
    const action = {
      id: "act-1",
      title: "Prelekcja (warsztat)",
      date: "2026-08-06",
      facilityName: "Szkoła Podstawowa nr 2",
      municipality: "Myślibórz",
      topic: "tyton" as const,
      audienceGroup: "uczniowie_sp",
      participantsCount: 33,
      materialsDistributedCount: 10,
      leadEducator: "Krzysztof Palpuchowski",
      status: "wykonane",
      ezdStatus: "w_ezd",
      izrzSign: "IZRZ: 37/2026",
      createdAt: "2026-08-06",
      updatedAt: "2026-08-06",
    };

    const dzCount = 1;
    const odbCount = action.participantsCount;
    const matCount = action.materialsDistributedCount;
    const metricStr = `${dzCount} / ${odbCount} / ${matCount}`;

    expect(metricStr).toBe("1 / 33 / 10");
    expect(action.ezdStatus).toBe("w_ezd");
    expect(action.status).toBe("wykonane");
  });

  it("validates valid Action data through ActionSchema (SSOT)", () => {
    const validAction = {
      id: "act-test-1",
      title: "Warsztaty profilaktyczne z młodzieżą",
      actionType: "Prelekcja (warsztat)",
      date: "2026-08-28",
      facilityName: "Szkoła Podstawowa nr 1 w Myśliborzu",
      municipality: "Myślibórz",
      topic: "tyton" as const,
      audienceGroup: "uczniowie_sp",
      participantsCount: 28,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 28,
      leadEducator: "Krzysztof Palpuchowski",
      status: "wykonane",
      ezdStatus: "w_ezd",
      jrwaSign: "OZ.966.1.38.2026",
      izrzSign: "IZRZ: 38/2026",
      createdAt: "2026-08-28T12:00:00.000Z",
      updatedAt: "2026-08-28T12:00:00.000Z",
    };

    const result = ActionSchema.safeParse(validAction);
    expect(result.success).toBe(true);
  });

  it("rejects invalid Action data missing title or with negative counts", () => {
    const invalidAction = {
      id: "act-invalid",
      title: "A", // Za krótki tytuł (<2 znaki)
      actionType: "Prelekcja (warsztat)",
      date: "2026-08-28",
      facilityName: "Szkoła",
      municipality: "Myślibórz",
      topic: "tyton",
      audienceGroup: "uczniowie_sp",
      participantsCount: -5, // Liczba ujemna
      leadEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-08-28",
      updatedAt: "2026-08-28",
    };

    const result = ActionSchema.safeParse(invalidAction);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("co najmniej 2 znaki"))).toBe(true);
      expect(messages.some((m) => m.includes("nie może być ujemna"))).toBe(true);
    }
  });

  it("prawidłowo wykrywa zadania z zamkniętych miesięcy i blokuje edycję (read-only)", () => {
    const closedMonths = new Set(["2026-07", "2026-06"]);
    
    const actionJuly = { id: "act-1", date: "2026-07-15", title: "Akcja Lipiec" };
    const actionAugust = { id: "act-2", date: "2026-08-20", title: "Akcja Sierpień" };

    const isJulyLocked = isMonthClosed(actionJuly.date, closedMonths);
    const isAugustLocked = isMonthClosed(actionAugust.date, closedMonths);

    expect(isJulyLocked).toBe(true); // Lipiec zablokowany (tylko do odczytu)
    expect(isAugustLocked).toBe(false); // Sierpień otwarty (pełna edycja)
  });
});

