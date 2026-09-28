import { describe, it, expect } from "vitest";
import type { OzipzContact, OzipzSchoolParticipation } from "../../types/ozipz.types";
import {
  buildContactProgramsIndex,
  collectEmails,
  contactsToVCard,
  findDuplicateContacts,
  formatPhone,
  getContactIssues,
  getContactRole,
  matchesContactSearch,
  matchesRoleFilter,
  normalizeText,
  phoneHref,
} from "./contactUtils";

const make = (overrides: Partial<OzipzContact>): OzipzContact => ({
  id: "c1",
  name: "Anna Kowalska",
  position: "Szkolny Koordynator",
  facilityName: "Szkoła Podstawowa nr 2 w Myśliborzu",
  municipality: "Myślibórz",
  phone: "95 747 22 33",
  email: "a.kowalska@sp2.mysliborz.pl",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("contactUtils", () => {
  it("normalizes Polish diacritics including ł", () => {
    expect(normalizeText("  Myślibórz  ŁĘCZYCA ")).toBe("mysliborz leczyca");
  });

  it("classifies roles regardless of case and diacritics", () => {
    expect(getContactRole("Szkolny KOORDYNATOR programów")).toBe("coordinator");
    expect(getContactRole("Wicedyrektor")).toBe("director");
    expect(getContactRole("Psycholog szkolny")).toBe("pedagogue");
    expect(getContactRole("Sekretarz")).toBe("other");
  });

  describe("formatPhone / phoneHref", () => {
    it("formats landline and mobile numbers", () => {
      expect(formatPhone("957472233")).toBe("95 747 22 33");
      expect(formatPhone("600-123-456")).toBe("600 123 456");
      expect(formatPhone("+48 501234567")).toBe("+48 501 234 567");
    });

    it("leaves unusual values intact", () => {
      expect(formatPhone("95 747 22 33 wew. 12")).toBe("95 747 22 33 wew. 12");
      expect(formatPhone("12345")).toBe("12345");
      expect(formatPhone("")).toBe("");
    });

    it("builds tel: link from the first number", () => {
      expect(phoneHref("95 747 22 33 / 600 000 000")).toBe("tel:+48957472233");
      expect(phoneHref("+48 600 000 000")).toBe("tel:+48600000000");
      expect(phoneHref("123")).toBeNull();
    });
  });

  describe("search", () => {
    const c = make({});
    it("ignores diacritics and matches multiple tokens across fields", () => {
      expect(matchesContactSearch(c, "kowalska mysliborz")).toBe(true);
      expect(matchesContactSearch(c, "KOWALSKA Myślibórz")).toBe(true);
      expect(matchesContactSearch(c, "kowalska debno")).toBe(false);
    });

    it("matches phone numbers regardless of spacing", () => {
      expect(matchesContactSearch(c, "7472233")).toBe(true);
      expect(matchesContactSearch(c, "747 22")).toBe(true);
      expect(matchesContactSearch(c, "999")).toBe(false);
    });
  });

  describe("data quality", () => {
    it("reports missing and invalid data", () => {
      expect(getContactIssues(make({}))).toEqual([]);
      expect(getContactIssues(make({ phone: "", email: "" }))).toContain("Brak telefonu i e-maila");
      expect(getContactIssues(make({ email: "zly-adres" }))).toContain("Niepoprawny adres e-mail");
      expect(getContactIssues(make({ facilityName: "" }))).toContain("Brak przypisanej placówki");
      expect(matchesRoleFilter(make({ position: "" }), "incomplete")).toBe(true);
      expect(matchesRoleFilter(make({}), "incomplete")).toBe(false);
    });
  });

  it("detects duplicates by e-mail, phone and name (ignoring titles)", () => {
    const existing = [
      make({ id: "a", name: "mgr Anna Kowalska", email: "x@y.pl", phone: "" }),
      make({ id: "b", name: "Jan Nowak", email: "jan@nowak.pl", phone: "" }),
      make({ id: "c", name: "Piotr Zieliński", email: "", phone: "600 111 222" }),
    ];
    const byName = findDuplicateContacts({ name: "Anna Kowalska", email: "", phone: "" }, existing);
    expect(byName.map((d) => [d.contact.id, d.reason])).toEqual([["a", "name"]]);

    const byEmail = findDuplicateContacts({ name: "Ktoś", email: "JAN@nowak.pl ", phone: "" }, existing);
    expect(byEmail.map((d) => d.reason)).toEqual(["email"]);

    const byPhone = findDuplicateContacts({ name: "Ktoś", email: "", phone: "+48600111222" }, existing);
    expect(byPhone.map((d) => d.contact.id)).toEqual(["c"]);

    expect(findDuplicateContacts({ name: "Jan Nowak", email: "", phone: "" }, existing, "b")).toEqual([]);
  });

  it("collects unique valid e-mails", () => {
    const list = [
      make({ id: "1", email: "a@b.pl" }),
      make({ id: "2", email: "A@B.pl" }),
      make({ id: "3", email: "" }),
      make({ id: "4", email: "zly" }),
      make({ id: "5", email: "c@d.pl" }),
    ];
    expect(collectEmails(list)).toEqual(["a@b.pl", "c@d.pl"]);
  });

  it("links contacts with programs they coordinate", () => {
    const participations = [
      { programName: "Trzymaj Formę!", schoolCoordinatorName: "mgr Anna Kowalska", schoolCoordinatorContact: "" },
      { programName: "Bieg po Zdrowie", schoolCoordinatorName: "Inna Osoba", schoolCoordinatorContact: "95 747 22 33" },
      { programName: "ARS", schoolCoordinatorName: "Jan Nowak", schoolCoordinatorContact: "" },
    ] as OzipzSchoolParticipation[];
    const index = buildContactProgramsIndex([make({})], participations);
    expect(index.get("c1")).toEqual(["Bieg po Zdrowie", "Trzymaj Formę!"]);
  });

  it("prefers the explicit coordinator link over name matching", () => {
    const participations = [
      { programName: "Powiązany", schoolCoordinatorName: "Ktoś Inny", schoolCoordinatorContactId: "c1" },
      { programName: "Imiennik", schoolCoordinatorName: "Anna Kowalska", schoolCoordinatorContactId: "c2" },
    ] as OzipzSchoolParticipation[];
    expect(buildContactProgramsIndex([make({})], participations).get("c1")).toEqual(["Powiązany"]);
  });

  it("exports a valid vCard with escaped values", () => {
    const vcf = contactsToVCard([make({ name: "mgr Anna Maria Kowalska", notes: "Pn, Śr; 8-14" })]);
    expect(vcf).toContain("BEGIN:VCARD\r\nVERSION:3.0");
    expect(vcf).toContain("FN:mgr Anna Maria Kowalska");
    expect(vcf).toContain("N:Kowalska;Anna Maria;;;");
    expect(vcf).toContain("TEL;TYPE=WORK,VOICE:+48957472233");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET,WORK:a.kowalska@sp2.mysliborz.pl");
    expect(vcf).toContain("NOTE:Pn\\, Śr\\; 8-14 · Ewidencja OZiPZ");
    expect(vcf.trim().endsWith("END:VCARD")).toBe(true);
  });
});
