import { describe, it, expect } from "vitest";
import {
  TYPY_KSZTALCENIA,
  mapTypyKsztalcenia,
  inferLokalizacjaTyp,
} from "./educationTypesUtils";

describe("educationTypesUtils", () => {
  it("should contain 14 canonical educational types", () => {
    expect(TYPY_KSZTALCENIA.length).toBe(14);
    expect(TYPY_KSZTALCENIA).toContain("Szkoła podstawowa");
    expect(TYPY_KSZTALCENIA).toContain("Przedszkole");
    expect(TYPY_KSZTALCENIA).toContain("Oddział przedszkolny");
    expect(TYPY_KSZTALCENIA).toContain("Liceum");
    expect(TYPY_KSZTALCENIA).toContain("Technikum");
    expect(TYPY_KSZTALCENIA).toContain("Szkoła policealna");
    expect(TYPY_KSZTALCENIA).toContain("Szkoła specjalna");
  });

  it("should map and reject unknown educational types", () => {
    const raw = ["szkoła podstawowa", "Liceum Ogólnokształcące", "Przedszkole", "Szkoła Podstawowa", "Nieznany typ"];
    const { matched, rejected } = mapTypyKsztalcenia(raw);
    expect(matched).toContain("Szkoła podstawowa");
    expect(matched).toContain("Przedszkole");
    expect(matched.length).toBe(2); // deduped and canonical
    expect(rejected).toContain("Liceum Ogólnokształcące");
    expect(rejected).toContain("Nieznany typ");
  });

  it("should infer whether location is kindergarten or school", () => {
    expect(inferLokalizacjaTyp(["Przedszkole", "Oddział przedszkolny"])).toBe("przedszkole");
    expect(inferLokalizacjaTyp(["Szkoła podstawowa", "Przedszkole"])).toBe("szkoła");
    expect(inferLokalizacjaTyp([])).toBe("szkoła");
  });
});
