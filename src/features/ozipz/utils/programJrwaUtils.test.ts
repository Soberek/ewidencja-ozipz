import { describe, it, expect } from "vitest";
import {
  getProgramJrwaSymbol,
  generateNextJrwaSign,
  getAllJrwaSymbols,
  formatFullJrwaSign,
  getJrwaDetails,
} from "./programJrwaUtils";
import type { OzipzProgram, OzipzAction, OzipzJrwaCase } from "../types/ozipz.types";
import { useOzipzDbStore } from "../store/useOzipzDbStore";
import { JRWA_DICTIONARY_FIXTURE } from "../../../test/fixtures/jrwaCatalog";

describe("programJrwaUtils", () => {
  it("takes the JRWA symbol only from the program record – never guesses it", () => {
    const base = { code: "X", editionYear: "2025/2026", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
    expect(getProgramJrwaSymbol({ ...base, id: "prog-custom-123", name: "Nowy Program", jrwaSymbol: " 966.19 " } as OzipzProgram)).toBe("966.19");
    // Brak symbolu w bazie = brak symbolu, nawet gdy nazwa lub opis coś sugerują
    expect(getProgramJrwaSymbol({ ...base, id: "trzymaj-forme", name: "Trzymaj Formę", description: "(JRWA 966.1)" } as OzipzProgram)).toBe("");
    expect(getProgramJrwaSymbol({ ...base, id: "sprawozdawczosc-statystyczna", name: "Sprawozdawczość statystyczna" } as OzipzProgram)).toBe("");
    expect(getProgramJrwaSymbol(null)).toBe("");
  });

  it("generates next sequential JRWA case number (per symbol) and global IZRZ (continuity 1,2,3...)", () => {
    const existingActions = [
      {
        id: "act-1",
        date: "2026-07-15",
        jrwaSign: "OZiPZ.966.14.36.2026",
        izrzSign: "88/2026",
      },
      {
        id: "act-2",
        date: "2026-08-10",
        jrwaSign: "OZiPZ.966.1.12.2026",
        izrzSign: "89/2026",
      },
      {
        id: "act-3",
        date: "2026-08-19",
        jrwaSign: "OZiPZ.966.14.35.2026",
        izrzSign: "90/2026",
      },
    ] as OzipzAction[];

    const existingCases = [
      {
        id: "case-1",
        year: 2026,
        jrwaSymbol: "966.14",
        caseNumber: 36,
        fullCaseSign: "OZiPZ.966.14.36.2026",
      },
    ] as OzipzJrwaCase[];

    const result = generateNextJrwaSign({
      symbol: "966.14",
      year: 2026,
      actions: existingActions,
      jrwaCases: existingCases,
    });

    // JRWA case number w ramach 966.14: 36 -> 37
    expect(result.caseNumber).toBe(37);
    expect(result.fullCaseSign).toBe("OZiPZ.966.14.37.2026");

    // IZRZ globalna ciągłość dla wszystkich akcji w danym roku: 90 -> 91/2026
    expect(result.izrzSign).toBe("91/2026");
  });

  it("strictly computes separate independent case sequences (1, 2, 3...) per each JRWA symbol", () => {
    const mixedActions = [
      { id: "a1", date: "2026-03-01", jrwaSign: "OZiPZ.966.1.1.2026" },
      { id: "a2", date: "2026-03-02", jrwaSign: "OZiPZ.966.1.2.2026" },
      { id: "a3", date: "2026-03-03", jrwaSign: "OZiPZ.966.1.3.2026" },
      { id: "a4", date: "2026-04-01", jrwaSign: "OZiPZ.966.4.1.2026" },
      { id: "a5", date: "2026-04-02", jrwaSign: "OZiPZ.966.4.2.2026" },
      { id: "a6", date: "2026-04-03", jrwaSign: "OZiPZ.966.4.6.2026" },
    ] as OzipzAction[];

    // Domyślna nowa sprawa dla 966.4 powinna mieć kolejny numer 7 (bo max w 966.4 to 6)
    const next966_4 = generateNextJrwaSign({
      symbol: "966.4",
      year: 2026,
      actions: mixedActions,
    });
    expect(next966_4.caseNumber).toBe(7);
    expect(next966_4.fullCaseSign).toBe("OZiPZ.966.4.7.2026");

    // Domyślna nowa sprawa dla 966.1 powinna mieć numer 4 (bo max w 966.1 to 3)
    const next966_1 = generateNextJrwaSign({
      symbol: "966.1",
      year: 2026,
      actions: mixedActions,
    });
    expect(next966_1.caseNumber).toBe(4);
    expect(next966_1.fullCaseSign).toBe("OZiPZ.966.1.4.2026");

    // Domyślna nowa sprawa dla pustego symbolu (np. 966.10) powinna zaczynać się od 1
    const next966_10 = generateNextJrwaSign({
      symbol: "966.10",
      year: 2026,
      actions: mixedActions,
    });
    expect(next966_10.caseNumber).toBe(1);
    expect(next966_10.fullCaseSign).toBe("OZiPZ.966.10.1.2026");
  });

  it("returns JRWA symbols only from the dictionary, in natural order", () => {
    expect(getAllJrwaSymbols([])).toEqual([]);
    const list = getAllJrwaSymbols(JRWA_DICTIONARY_FIXTURE);
    expect(list.length).toBeGreaterThan(15);
    const symbols = list.map((l) => l.symbol);
    expect(symbols).toContain("966.14");
    expect(symbols).toContain("966.1");
    expect(symbols).toContain("0442");
    expect(symbols).toContain("9011.1");
  });

  it("formats full case sign properly with OZiPZ prefix (e.g. OZiPZ.966.5.2.2026)", () => {
    expect(formatFullJrwaSign({ jrwaSign: "OZiPZ.966.5.2.2026" })).toBe("OZiPZ.966.5.2.2026");
    expect(formatFullJrwaSign({ jrwaSign: "OZ.966.5.2.2026" })).toBe("OZiPZ.966.5.2.2026");
    expect(formatFullJrwaSign({ jrwaSign: "PSSE.OZiPZ.966.5.2.2026" })).toBe("OZiPZ.966.5.2.2026");
    expect(formatFullJrwaSign({ jrwaSign: "966.5.2.2026" })).toBe("OZiPZ.966.5.2.2026");
    expect(formatFullJrwaSign({ jrwaSign: "966.5", date: "2026-06-01" })).toBe("OZiPZ.966.5.1.2026");
  });

  it("returns full JRWA details (label, description, symbol) via getJrwaDetails", () => {
    useOzipzDbStore.setState({ dictionaryItems: [] });
    expect(getJrwaDetails("966.14")?.label).toBe("Teczka JRWA 966.14");
    useOzipzDbStore.setState({ dictionaryItems: JRWA_DICTIONARY_FIXTURE });
    const details14 = getJrwaDetails("966.14");
    expect(details14).toBeDefined();
    expect(details14?.symbol).toBe("966.14");
    expect(details14?.label).toBe("Bezpieczne Wakacje i Bezpieczne Ferie");
    expect(details14?.description).toContain("Bezpieczeństwo dzieci");

    const details1 = getJrwaDetails("JRWA 966.1");
    expect(details1?.symbol).toBe("966.1");
    expect(details1?.label).toBe("Trzymaj Formę");

    const details6 = getJrwaDetails("OZiPZ.966.6.3.2026");
    expect(details6?.symbol).toBe("966.6");
    expect(details6?.label).toBe("Profilaktyka Używania Substancji Psychoaktywnych");
  });
});
