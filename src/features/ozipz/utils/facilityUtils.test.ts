import { describe, expect, it } from "vitest";
import type { OzipzDictionaryItem, OzipzFacility } from "../types/ozipz.types";
import {
  EMPTY_FACILITY_FILTERS,
  buildChildrenMap,
  buildFacilityIssuesIndex,
  collectFacilityEmails,
  countActiveFilters,
  filterFacilities,
  formatFacilityAddress,
  municipalityName,
  municipalityNamesFromDictionary,
  municipalityPostalCode,
  normalizeSearchText,
  type FacilityFilterContext,
} from "./facilityUtils";

const fac = (overrides: Partial<OzipzFacility>): OzipzFacility => ({
  id: "f", name: "Szkoła", type: "szkola", educationTypes: ["Szkoła podstawowa"],
  address: "ul. Szkolna 1", city: "Myślibórz", postalCode: "74-300", municipality: "Myślibórz",
  county: "powiat myśliborski", leadingAuthority: "Gmina Myślibórz", isComplex: false,
  email: "sekretariat@sp.pl", createdAt: "2026-01-01", updatedAt: "2026-01-01",
  ...overrides,
});

const dict = (label: string, postalCode?: string): OzipzDictionaryItem => ({
  id: label, dictType: "municipality", code: label, label, postalCode, isSystem: true, createdAt: "", updatedAt: "",
});

function context(facilities: OzipzFacility[]): FacilityFilterContext {
  return {
    byId: new Map(facilities.map((f) => [f.id, f])),
    childrenMap: buildChildrenMap(facilities),
    issues: buildFacilityIssuesIndex(facilities, new Set(["Myślibórz", "Dębno"])),
    typeLabels: new Map([["szkola", "szkoła"], ["przedszkole", "przedszkole"]]),
  };
}

describe("municipality helpers", () => {
  it("strips the Gmina prefix and deduplicates dictionary names", () => {
    expect(municipalityName("Gmina Myślibórz")).toBe("Myślibórz");
    expect(municipalityName("  Dębno ")).toBe("Dębno");
    expect(municipalityNamesFromDictionary([dict("Gmina Dębno"), dict("Dębno"), dict("Barlinek")])).toEqual(["Barlinek", "Dębno"]);
  });

  it("finds the postal code regardless of prefix and diacritics", () => {
    expect(municipalityPostalCode([dict("Gmina Myślibórz", "74-300")], "Myślibórz")).toBe("74-300");
    expect(municipalityPostalCode([dict("Gmina Myślibórz", "74-300")], "Dębno")).toBeUndefined();
  });
});

describe("normalizeSearchText", () => {
  it("removes Polish diacritics including ł", () => {
    expect(normalizeSearchText("  Łódź   Myślibórz ")).toBe("lodz mysliborz");
  });
});

describe("filterFacilities", () => {
  const complex = fac({ id: "zs", name: "Zespół Szkół nr 1", isComplex: true, educationTypes: [] });
  const liceum = fac({ id: "lo", name: "I Liceum", parentFacilityId: "zs", educationTypes: ["Liceum"] });
  const przedszkole = fac({ id: "p", name: "Przedszkole Słoneczko", type: "przedszkole", municipality: "Dębno", city: "Dębno", educationTypes: ["Przedszkole"] });
  const all = [przedszkole, liceum, complex];
  const ctx = context(all);

  it("matches every search word without diacritics, including the parent complex name", () => {
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, search: "sloneczko debno" }, ctx).map((f) => f.id)).toEqual(["p"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, search: "zespol szkol" }, ctx).map((f) => f.id)).toEqual(["lo", "zs"]);
  });

  it("filters by structure, type and municipality and sorts by name", () => {
    expect(filterFacilities(all, EMPTY_FACILITY_FILTERS, ctx).map((f) => f.id)).toEqual(["lo", "p", "zs"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, structure: "complex" }, ctx).map((f) => f.id)).toEqual(["zs"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, structure: "in_complex" }, ctx).map((f) => f.id)).toEqual(["lo"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, structure: "standalone" }, ctx).map((f) => f.id)).toEqual(["p"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, types: ["przedszkole"] }, ctx).map((f) => f.id)).toEqual(["p"]);
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, municipality: "Debno" }, ctx).map((f) => f.id)).toEqual(["p"]);
  });

  it("matches a complex through the education types of its units", () => {
    expect(filterFacilities(all, { ...EMPTY_FACILITY_FILTERS, educationTypes: ["Liceum"] }, ctx).map((f) => f.id)).toEqual(["lo", "zs"]);
  });

  it("can show only facilities with data issues", () => {
    const broken = fac({ id: "x", name: "Bez kodu", postalCode: "74300" });
    const rows = [...all, broken];
    expect(filterFacilities(rows, { ...EMPTY_FACILITY_FILTERS, onlyWithIssues: true }, context(rows)).map((f) => f.id)).toEqual(["x"]);
  });

  it("counts active filters", () => {
    expect(countActiveFilters(EMPTY_FACILITY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FACILITY_FILTERS, search: "a", types: ["szkola", "inne"], onlyWithIssues: true })).toBe(4);
  });
});

describe("buildFacilityIssuesIndex", () => {
  const codes = (facilities: OzipzFacility[], id: string) =>
    (buildFacilityIssuesIndex(facilities, new Set(["Myślibórz"])).get(id) || []).map((i) => i.code).sort();

  it("reports nothing for a complete facility", () => {
    expect(codes([fac({})], "f")).toEqual([]);
  });

  it("detects format and completeness problems", () => {
    const f = fac({ postalCode: "74300", email: undefined, defaultCoordinatorEmail: "zly@", municipality: "Gmina Myślibórz", educationTypes: [], leadingAuthority: "" });
    expect(codes([f], "f")).toEqual([
      "invalid-email", "invalid-postal-code", "missing-education-types", "missing-leading-authority", "unknown-municipality",
    ]);
  });

  it("accepts a unit without own e-mail when its complex has one", () => {
    const complex = fac({ id: "zs", isComplex: true, name: "Zespół" });
    const unit = fac({ id: "u", name: "Technikum", parentFacilityId: "zs", email: undefined });
    expect(codes([complex, unit], "u")).toEqual([]);
    expect(codes([complex], "zs")).toEqual(["empty-complex"]);
  });

  it("flags duplicates and standalone units sharing address and e-mail", () => {
    const a = fac({ id: "a", name: "Liceum w Barlinku" });
    const b = fac({ id: "b", name: "Technikum w Barlinku" });
    const c = fac({ id: "c", name: "liceum w barlinku", address: "ul. Inna 2", email: "inny@sp.pl" });
    expect(codes([a, b, c], "a")).toEqual(["duplicate-name", "shared-contact"]);
    expect(codes([a, b, c], "c")).toEqual(["duplicate-name"]);
  });

  it("does not require an e-mail from non-educational places", () => {
    expect(codes([fac({ type: "inne", educationTypes: [], email: undefined, leadingAuthority: "" })], "f")).toEqual([]);
  });
});

describe("collectFacilityEmails", () => {
  const rows = [
    fac({ id: "a", email: "Sekretariat@sp.pl", defaultCoordinatorEmail: "anna@sp.pl" }),
    fac({ id: "b", email: "sekretariat@sp.pl; drugi@sp.pl", defaultCoordinatorEmail: "niepoprawny" }),
  ];

  it("collects unique valid addresses from the chosen source", () => {
    expect(collectFacilityEmails(rows, "facility")).toEqual(["Sekretariat@sp.pl", "drugi@sp.pl"]);
    expect(collectFacilityEmails(rows, "coordinator")).toEqual(["anna@sp.pl"]);
    expect(collectFacilityEmails(rows, "both")).toEqual(["Sekretariat@sp.pl", "anna@sp.pl", "drugi@sp.pl"]);
  });
});

it("formats a postal address", () => {
  expect(formatFacilityAddress({ address: "ul. Szkolna 1", postalCode: "74-300", city: "Myślibórz" })).toBe("ul. Szkolna 1, 74-300 Myślibórz");
  expect(formatFacilityAddress({ address: "", postalCode: "", city: "Dębno" })).toBe("Dębno");
});
