import { describe, it, expect } from "vitest";
import {
  TYPY_KSZTALCENIA,
  mapTypyKsztalcenia,
  inferLokalizacjaTyp,
  collectEmails,
  emailToastCount,
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

  it("should extract unique emails from list and format toast count", () => {
    const rows = [
      { email: "sekretariat@sp1.pl; dyrektor@sp1.pl", active: true },
      { email: "dyrektor@sp1.pl, pedagog@sp1.pl", active: true },
      { defaultCoordinatorEmail: "koordynator@sp2.pl", active: true },
      { email: "nieaktywny@sp3.pl", active: false },
    ];
    const emails = collectEmails(rows);
    expect(emails).toHaveLength(4);
    expect(emails).toContain("sekretariat@sp1.pl");
    expect(emails).toContain("dyrektor@sp1.pl");
    expect(emails).toContain("pedagog@sp1.pl");
    expect(emails).toContain("koordynator@sp2.pl");
    expect(emails).not.toContain("nieaktywny@sp3.pl");

    expect(emailToastCount(1)).toBe("1 e-mail");
    expect(emailToastCount(3)).toBe("3 e-maile");
    expect(emailToastCount(5)).toBe("5 e-maili");
  });
});
