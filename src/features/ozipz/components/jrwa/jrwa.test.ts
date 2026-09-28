import { describe, it, expect } from "vitest";
import type { OzipzJrwaCase } from "../../types/ozipz.types";
import { generateNextJrwaSign } from "../../utils/programJrwaUtils";

function formatJrwaSign(
  section: string,
  symbol: string,
  caseNumber: number,
  year: number,
  initials?: string
): string {
  const sSec = section.trim() || "OZ";
  const sSym = symbol.trim() || "966.1";
  const sNum = caseNumber || 1;
  const sYr = year || new Date().getFullYear();
  const sInit = initials?.trim() ? `.${initials.trim().toUpperCase()}` : "";
  return `${sSec}.${sSym}.${sNum}.${sYr}${sInit}`;
}

function getNextCaseNumber(
  cases: OzipzJrwaCase[],
  jrwaSymbol: string,
  year: number
): number {
  const matching = cases.filter(
    (c) => c.jrwaSymbol === jrwaSymbol && Number(c.year) === Number(year)
  );
  if (matching.length === 0) return 1;
  const maxNum = Math.max(...matching.map((c) => Number(c.caseNumber) || 0));
  return maxNum + 1;
}

describe("Ewidencja OZiPZ - Moduł Spisu Spraw i Znaków JRWA", () => {
  const sampleCases: OzipzJrwaCase[] = [
    {
      id: "j-1",
      section: "OZ",
      jrwaSymbol: "966.1",
      caseNumber: 1,
      year: 2026,
      fullCaseSign: "OZ.966.1.1.2026",
      title: "Prelekcja dla przedszkola",
      status: "w_toku",
      assignedEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-01-10T10:00:00Z",
      updatedAt: "2026-01-10T10:00:00Z",
    },
    {
      id: "j-2",
      section: "OZ",
      jrwaSymbol: "966.1",
      caseNumber: 2,
      year: 2026,
      referentInitials: "KP",
      fullCaseSign: "OZ.966.1.2.2026.KP",
      title: "Warsztaty w szkole",
      status: "zakonczona",
      assignedEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "j-3",
      section: "HDM",
      jrwaSymbol: "9020",
      caseNumber: 15,
      year: 2026,
      fullCaseSign: "HDM.9020.15.2026",
      title: "Kontrola bieżąca placówek oświatowych",
      status: "w_toku",
      assignedEducator: "Jan Kowalski",
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    },
  ];

  it("poprawnie konstruuje unikalny znak sprawy według wzoru instrukcji kancelaryjnej", () => {
    const sign1 = formatJrwaSign("OZ", "966.1", 1, 2026);
    expect(sign1).toBe("OZ.966.1.1.2026");

    const sign2 = formatJrwaSign("HDM", "9020", 15, 2026);
    expect(sign2).toBe("HDM.9020.15.2026");

    const signWithInitials = formatJrwaSign("OZ", "966.1", 2, 2026, "kp");
    expect(signWithInitials).toBe("OZ.966.1.2.2026.KP");
  });

  it("automatycznie wyznacza kolejny wolny numer sprawy w teczce JRWA dla danego roku", () => {
    // Dla hasła 966.1 w 2026 roku mamy sprawy 1 i 2, więc kolejna to 3
    const nextNum966 = getNextCaseNumber(sampleCases, "966.1", 2026);
    expect(nextNum966).toBe(3);

    // Dla nowego hasła 0442 w 2026 roku kolejny numer to 1
    const nextNum0442 = getNextCaseNumber(sampleCases, "0442", 2026);
    expect(nextNum0442).toBe(1);

    // Dla roku 2027 kolejny numer dla 966.1 to 1 (nowy spis roczny)
    const nextNum2027 = getNextCaseNumber(sampleCases, "966.1", 2027);
    expect(nextNum2027).toBe(1);
  });

  it("posiada kompletne dane do spisu spraw i teczki aktowej", () => {
    const item = sampleCases[0];
    expect(item.section).toBe("OZ");
    expect(item.jrwaSymbol).toBe("966.1");
    expect(item.caseNumber).toBe(1);
    expect(item.year).toBe(2026);
    expect(item.status).toBe("w_toku");
  });

  it("weryfikuje działanie oficjalnej funkcji domenowej generateNextJrwaSign z modułu programJrwaUtils", () => {
    const next966 = generateNextJrwaSign({
      symbol: "966.1",
      year: 2026,
      jrwaCases: sampleCases,
    });
    expect(next966.caseNumber).toBe(3);
    expect(next966.fullCaseSign).toBe("OZiPZ.966.1.3.2026");

    const next0442 = generateNextJrwaSign({
      symbol: "0442",
      year: 2026,
      jrwaCases: sampleCases,
    });
    expect(next0442.caseNumber).toBe(1);
    expect(next0442.fullCaseSign).toBe("OZiPZ.0442.1.2026");
  });
});
