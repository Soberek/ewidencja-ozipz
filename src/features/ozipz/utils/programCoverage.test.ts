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

// Stan placówki w programie: id → „zgłoszona” / „brak” (pomija programy, które jej nie dotyczą).
const statuses = (coverage: ReturnType<typeof computeProgramCoverage>, programId: string) =>
  Object.fromEntries(
    coverage.facilities
      .filter((row) => row.programs[programId])
      .map((row) => [row.facility.id, row.programs[programId].participations.length > 0 ? "zgłoszona" : "brak"]),
  );

describe("udział placówek w programach", () => {
  it("wymienia kwalifikujące się placówki ze zgłoszeniem i bez niego w wybranym roku", () => {
    const coverage = computeProgramCoverage(
      [program({})],
      facilities,
      [part({}), part({ id: "old", facilityId: "sp2", facilityName: "SP 2", municipality: "Dębno", schoolYear: "2025/2026" })],
      [],
      "2026/2027",
      kinds,
    );
    expect(coverage.rows[0]).toMatchObject({ programId: "higiena", targetTypes: ["Szkoła podstawowa", "Szkoła podstawowa specjalna"], eligible: 3, participating: 1, missing: 2 });
    expect(statuses(coverage, "higiena")).toEqual({ sp1: "zgłoszona", sp2: "brak", "zs-sp": "brak" });
    expect(coverage.facilities.map((r) => [r.facility.name, r.parent?.name, r.signed, r.missing])).toEqual([
      ["SP 2", undefined, 0, 1],
      ["Szkoła Podstawowa w Zespole", "Zespół Szkół", 0, 1],
      ["SP 1", undefined, 1, 0],
    ]);
  });

  it("zgłoszenie zespołu obejmuje jego szkoły, a sam zespół z jednostkami nie jest liczony osobno", () => {
    const zgloszenie = part({ facilityId: "zs", facilityName: "Zespół Szkół" });
    const coverage = computeProgramCoverage([program({})], facilities, [zgloszenie], [], "2026/2027", kinds);
    expect(coverage.rows[0]).toMatchObject({ eligible: 3, participating: 1 });
    expect(statuses(coverage, "higiena")).toEqual({ sp1: "brak", sp2: "brak", "zs-sp": "zgłoszona" });
    expect(coverage.facilities.find((r) => r.facility.id === "zs-sp")?.programs.higiena).toEqual({ participations: [zgloszenie], eligible: true, actions: 0 });
    // Liceum zespołu nie kwalifikuje się do programu dla podstawówek – zgłoszenie zespołu go nie obejmuje.
    expect(coverage.facilities.map((r) => r.facility.id)).not.toContain("zs-lo");
    expect(coverage.facilities.map((r) => r.facility.id)).not.toContain("zs");
  });

  it("placówka zgłoszona sama poza grupą docelową jest pokazana ze zgłoszeniem", () => {
    const lo = part({ id: "lo", facilityId: "zs-lo", facilityName: "Liceum w Zespole", municipality: "Dębno" });
    const coverage = computeProgramCoverage([program({})], facilities, [lo], [], "2026/2027", kinds);
    expect(coverage.rows[0]).toMatchObject({ eligible: 3, participating: 0 });
    expect(coverage.facilities.find((r) => r.facility.id === "zs-lo")).toMatchObject({ programs: { higiena: { eligible: false } }, signed: 1, missing: 0 });
  });

  it("rozpoznaje zgłoszenie bez powiązania z bazą po nazwie i gminie", () => {
    const coverage = computeProgramCoverage([program({})], facilities, [part({ facilityId: "", facilityName: " sp 2 ", municipality: "Dębno" })], [], "2026/2027", kinds);
    expect(statuses(coverage, "higiena").sp2).toBe("zgłoszona");
  });

  it("udział to tylko zgłoszenie – działania programu w placówce bez zgłoszenia są dopiskiem", () => {
    const actions = [
      action({ numberOfActions: 2 }),
      action({ date: "2026-08-31" }),
      action({ status: "odwolane" }),
      action({ programId: "inny" }),
      action({ facilityId: "zs", facilityName: "Zespół Szkół" }),
    ];
    const coverage = computeProgramCoverage([program({})], facilities, [], actions, "2026/2027", kinds);
    expect(coverage.rows[0].participating).toBe(0);
    expect(Object.fromEntries(coverage.facilities.map((r) => [r.facility.id, r.programs.higiena.actions]))).toEqual({ sp1: 0, sp2: 2, "zs-sp": 1 });
  });

  it("łączy programy w jednym wierszu placówki", () => {
    const zeby = program({ id: "zeby", name: "Zdrowe zęby", jrwaSymbol: "966.3", targetAudience: "Przedszkole, Żłobek, Oddział przedszkolny" });
    const coverage = computeProgramCoverage([program({}), zeby], facilities, [part({ facilityId: "sp2", facilityName: "SP 2", municipality: "Dębno" })], [], "2026/2027", kinds);
    expect(statuses(coverage, "zeby")).toEqual({ sp2: "brak", przedszkole: "brak" });
    const sp2 = coverage.facilities.find((r) => r.facility.id === "sp2")!;
    expect(Object.keys(sp2.programs).sort()).toEqual(["higiena", "zeby"]);
    expect([sp2.signed, sp2.missing]).toEqual([1, 1]);
  });

  it("zgłoszenia do programów spoza zestawienia są przy placówce osobno", () => {
    const bezTypow = program({ id: "bez-typow", name: "Program bez typów", jrwaSymbol: "", targetAudience: "Uczniowie" });
    const inne = part({ id: "inne", programId: "bez-typow", facilityId: "przedszkole", facilityName: "Przedszkole nr 1" });
    const coverage = computeProgramCoverage([program({}), bezTypow], facilities, [inne], [], "2026/2027", kinds);
    expect(coverage.facilities.find((r) => r.facility.id === "przedszkole")).toMatchObject({ programs: {}, otherParticipations: [inne], signed: 0, missing: 0 });
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
