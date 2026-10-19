import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../types/ozipz.types";
import { computeProgramCoverage, programTargetEducationTypes } from "./programCoverage";

const program = (overrides: Partial<OzipzProgram>) =>
  ({ id: "higiena", name: "Higiena naszą tarczą ochronną", jrwaSymbol: "966.4", status: "aktywny", targetAudience: "Szkoła podstawowa, Szkoła podstawowa specjalna", ...overrides }) as OzipzProgram;

const facility = (overrides: Partial<OzipzFacility>) =>
  ({ id: "sp1", name: "SP 1", type: "szkola", municipality: "Myślibórz", educationTypes: ["Szkoła podstawowa"], ...overrides }) as OzipzFacility;

const part = (overrides: Partial<OzipzSchoolParticipation>) =>
  ({ id: "p", programId: "higiena", programName: "Higiena", facilityId: "sp1", facilityName: "SP 1", municipality: "Myślibórz", schoolYear: "2026/2027", ...overrides }) as OzipzSchoolParticipation;

const action = (overrides: Partial<OzipzAction>) =>
  ({ programId: "higiena", facilityId: "sp2", facilityName: "SP 2", municipality: "Dębno", date: "2026-10-05", numberOfActions: 1, ...overrides }) as OzipzAction;

const kinds = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([["966.3", "PROGRAMOWE"], ["966.4", "PROGRAMOWE"], ["966.7", "NIEPROGRAMOWE"], ["966.18", "PROGRAMOWE"]]);

const facilities = [
  facility({}),
  facility({ id: "sp2", name: "SP 2", municipality: "Dębno", educationTypes: ["Szkoła podstawowa", "Oddział przedszkolny"] }),
  facility({ id: "przedszkole", name: "Przedszkole nr 1", type: "przedszkole", educationTypes: ["Przedszkole"] }),
  facility({ id: "zs", name: "Zespół Szkół", isComplex: true, municipality: "Dębno", educationTypes: ["Szkoła podstawowa", "Liceum"] }),
  facility({ id: "zs-sp", name: "Szkoła Podstawowa w Zespole", municipality: "Dębno", parentFacilityId: "zs" }),
  facility({ id: "zs-lo", name: "Liceum w Zespole", municipality: "Dębno", parentFacilityId: "zs", educationTypes: ["Liceum"] }),
  facility({ id: "apteka", name: "Apteka", type: "apteka", educationTypes: [] }),
];

describe("grupa docelowa programu", () => {
  it("rozpoznaje rodzaje kształcenia, także z dopiskiem w nawiasie", () => {
    expect(programTargetEducationTypes("Przedszkole, Żłobek; oddział przedszkolny")).toEqual(["Przedszkole", "Żłobek", "Oddział przedszkolny"]);
    expect(programTargetEducationTypes("Szkoła podstawowa (klasy I–III)")).toEqual(["Szkoła podstawowa"]);
    expect(programTargetEducationTypes("Społeczność lokalna / ogół ludności")).toEqual([]);
    expect(programTargetEducationTypes(undefined)).toEqual([]);
  });
});

describe("placówki bez zgłoszeń", () => {
  it("wymienia kwalifikujące się placówki bez zgłoszenia w wybranym roku", () => {
    const coverage = computeProgramCoverage(
      [program({})],
      facilities,
      [part({}), part({ id: "old", facilityId: "sp2", facilityName: "SP 2", municipality: "Dębno", schoolYear: "2025/2026" })],
      [],
      "2026/2027",
      kinds,
    );
    const row = coverage.rows[0];
    expect(row).toMatchObject({ programId: "higiena", targetTypes: ["Szkoła podstawowa", "Szkoła podstawowa specjalna"], eligible: 3, participating: 1 });
    expect(row.missing.map((m) => [m.facility.name, m.parent?.name, m.matchedTypes])).toEqual([
      ["SP 2", undefined, ["Szkoła podstawowa"]],
      ["Szkoła Podstawowa w Zespole", "Zespół Szkół", ["Szkoła podstawowa"]],
    ]);
  });

  it("zgłoszenie zespołu obejmuje jego szkoły, a sam zespół z jednostkami nie jest liczony osobno", () => {
    const row = computeProgramCoverage([program({})], facilities, [part({ facilityId: "zs", facilityName: "Zespół Szkół" })], [], "2026/2027", kinds).rows[0];
    expect(row).toMatchObject({ eligible: 3, participating: 1 });
    expect(row.missing.map((m) => m.facility.id)).toEqual(["sp2", "sp1"]);
  });

  it("rozpoznaje zgłoszenie bez powiązania z bazą po nazwie i gminie", () => {
    const row = computeProgramCoverage([program({})], facilities, [part({ facilityId: "", facilityName: " sp 2 ", municipality: "Dębno" })], [], "2026/2027", kinds).rows[0];
    expect(row.missing.map((m) => m.facility.id)).not.toContain("sp2");
  });

  it("udział to tylko zgłoszenie – działania programu w placówce bez zgłoszenia są dopiskiem", () => {
    const actions = [
      action({ numberOfActions: 2 }),
      action({ date: "2026-08-31" }),
      action({ status: "odwolane" }),
      action({ programId: "inny" }),
      action({ facilityId: "zs", facilityName: "Zespół Szkół" }),
    ];
    const row = computeProgramCoverage([program({})], facilities, [], actions, "2026/2027", kinds).rows[0];
    expect(row.participating).toBe(0);
    expect(Object.fromEntries(row.missing.map((m) => [m.facility.id, m.actionsWithoutParticipation]))).toEqual({ sp1: 0, sp2: 2, "zs-sp": 1 });
  });

  it("dobiera placówki do grupy docelowej programu przedszkolnego", () => {
    const zeby = program({ id: "zeby", name: "Zdrowe zęby", jrwaSymbol: "966.3", targetAudience: "Przedszkole, Żłobek, Oddział przedszkolny" });
    const row = computeProgramCoverage([zeby], facilities, [], [], "2026/2027", kinds).rows[0];
    expect(row.missing.map((m) => [m.facility.id, m.matchedTypes])).toEqual([
      ["sp2", ["Oddział przedszkolny"]],
      ["przedszkole", ["Przedszkole"]],
    ]);
  });

  it("pomija programy NIEPROGRAMOWE, bez zgłoszeń szkół i nieaktywne bez zgłoszeń; zgłasza programy bez rodzaju kształcenia", () => {
    const coverage = computeProgramCoverage(
      [
        program({}),
        program({ id: "styl", name: "Zdrowy styl", jrwaSymbol: "966.7" }),
        program({ id: "stary", name: "Zakończony", jrwaSymbol: "", status: "zakonczony" }),
        program({ id: "stary-ze-zgloszeniem", name: "Zakończony ze zgłoszeniem", jrwaSymbol: "", status: "zakonczony" }),
        program({ id: "mlodzi", name: "#MłodziŚwiadomi", jrwaSymbol: "966.18", targetAudience: "Młodzież szkół ponadpodstawowych" }),
        program({ id: "nieznany", name: "Bez symbolu", jrwaSymbol: "", targetAudience: "Mieszkańcy" }),
        program({ id: "hiv", name: "HIV/AIDS", jrwaSymbol: "966.4", targetAudience: "Liceum, Technikum", acceptsParticipations: false }),
        program({ id: "senior", name: "Seniorzy", jrwaSymbol: "966.18", targetAudience: "Seniorzy", acceptsParticipations: false }),
      ],
      facilities,
      [part({ programId: "stary-ze-zgloszeniem" })],
      [],
      "2026/2027",
      kinds,
    );
    expect(coverage.rows.map((r) => r.programId)).toEqual(["higiena", "stary-ze-zgloszeniem"]);
    expect(coverage.withoutEducationTypes.map((p) => p.id)).toEqual(["mlodzi"]);
  });
});
