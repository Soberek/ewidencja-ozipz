import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OzipzAction, OzipzDictionaryItem, OzipzProgram } from "../types/ozipz.types";
import { useOzipzDbStore } from "../store/useOzipzDbStore";
import {
  buildJrwaInterventionKindMap,
  buildJrwaInterventionNamesMap,
  extractCleanJrwaSymbol,
  isProgramAction,
  resolveReportingJrwaSymbol,
} from "./calculators/jrwaClassification";
import { aggregateActionsToProgramsData, buildReportAnnexRows, buildReportHierarchy } from "./annex/annexAggregation";
import { buildJrwaGisCategoryMap, calculateGisReports } from "./gis";
import { calculateMonthlyComplianceMatrix, getDefaultMonthlyTargets } from "./monthlyTargetsUtils";

/**
 * Zgodność ewidencji ze sprawozdaniami: miesięczne (programowe / nieprogramowe), miernik
 * (załączniki nr 1 i 2) i GIS. Słownik JRWA odpowiada temu w bazie produkcyjnej – w szczególności
 * para seniorów: 966.15 (nieprogramowe) i 966.19 „Senior w roli głównej” (programowe).
 * O klasyfikacji (programowe / nieprogramowe) decyduje wyłącznie wybrany program i rodzaj jego symbolu
 * w słowniku JRWA; znak sprawy nie ma na nią wpływu, a działanie bez programu o określonym rodzaju
 * jest nieprogramowe. Znak sprawy pozostaje tylko zapasowym źródłem symbolu (obszar GIS, kolumna JRWA).
 */

type JrwaRow = [code: string, kind: "PROGRAMOWE" | "NIEPROGRAMOWE", gis: string, label: string];
const JRWA: JrwaRow[] = [
  ["0442", "NIEPROGRAMOWE", "brak", "Sprawozdawczość Statystyczna"],
  ["9011.1", "NIEPROGRAMOWE", "brak", "Wymiana Informacji - Współpraca z WSSE"],
  ["9011.2", "NIEPROGRAMOWE", "brak", "Wymiana Informacji - Organy Podległe"],
  ["966.1", "PROGRAMOWE", "otylosc", "Trzymaj Formę"],
  ["966.2", "PROGRAMOWE", "sti", "Krajowy Program Zapobiegania HIV i Zwalczania AIDS"],
  ["966.3", "PROGRAMOWE", "inne", "Zdrowe Zęby Mamy, Marchewkę Zajadamy"],
  ["966.4", "PROGRAMOWE", "inne", "Higiena Naszą Tarczą Ochronną"],
  ["966.5", "PROGRAMOWE", "uzaleznienia", "Porozmawiajmy o Zdrowiu i Nowych Zagrożeniach"],
  ["966.6", "NIEPROGRAMOWE", "uzaleznienia", "Profilaktyka Używania Substancji Psychoaktywnych"],
  ["966.7", "NIEPROGRAMOWE", "otylosc", "Promocja Zdrowego Stylu Życia, Aktywności i Odżywiania"],
  ["966.9", "NIEPROGRAMOWE", "inne", "Profilaktyka Chorób Nowotworowych"],
  ["966.11", "NIEPROGRAMOWE", "szczepienia", "Promocja Szczepień Ochronnych"],
  ["966.14", "NIEPROGRAMOWE", "inne", "Bezpieczne Wakacje i Bezpieczne Ferie"],
  ["966.15", "NIEPROGRAMOWE", "inne", "Seniorzy (Senior w Roli Głównej)"],
  ["966.18", "PROGRAMOWE", "sti", "#MłodziŚwiadomi"],
  ["966.20", "PROGRAMOWE", "inne", "Tylko Pomyśl"],
  ["966.19", "PROGRAMOWE", "inne", "Senior w roli głównej"],
];

const DICTIONARY: OzipzDictionaryItem[] = JRWA.map(([code, kind, gisCategory, label]) => ({
  id: `dict-jrwa-${code}`,
  dictType: "jrwaSymbol",
  code,
  label,
  kind,
  gisCategory: gisCategory as OzipzDictionaryItem["gisCategory"],
  isSystem: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}));

const KIND_MAP = buildJrwaInterventionKindMap(DICTIONARY);
const NAMES_MAP = buildJrwaInterventionNamesMap(DICTIONARY);
const GIS_MAP = buildJrwaGisCategoryMap(DICTIONARY);

const SENIOR_PROGRAM_NAME = "Seniorzy (Senior w roli głównej)";
const PROGRAMS: [id: string, symbol: string, name: string][] = [
  ["bezpieczne-wakacje", "966.14", "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)"],
  ["choroby-nowotworowe", "966.9", "Profilaktyka chorób nowotworowych"],
  ["higiena-tarcza", "966.4", "Higiena naszą tarczą ochronną"],
  ["hiv-aids", "966.2", "Krajowy Program Zapobiegania Zakażeniom HIV i Zwalczania AIDS"],
  ["mlodzi-swiadomi", "966.18", "#MłodziŚwiadomi"],
  ["porozmawiajmy-o-zdrowiu", "966.5", "Porozmawiajmy o zdrowiu i nowych zagrożeniach"],
  ["seniorzy", "966.19", SENIOR_PROGRAM_NAME],
  ["sprawozdawczosc-statystyczna", "0442", "Sprawozdawczość statystyczna"],
  ["substancje-psychoaktywne", "966.6", "Profilaktyka używania substancji psychoaktywnych"],
  ["szczepienia", "966.11", "Promocja szczepień ochronnych (Europejski Tydzień Szczepień)"],
  ["trzymaj-forme", "966.1", "Trzymaj Formę"],
  ["zdrowy-styl-zycia", "966.7", "Promocja zdrowego stylu życia, aktywności fizycznej i prawidłowego odżywiania"],
];
const PROGRAM_BY_ID = new Map(PROGRAMS.map(([id, symbol, name]) => [id, { symbol, name }]));

const programRecords: OzipzProgram[] = PROGRAMS.map(([id, jrwaSymbol, name]) => ({
  id,
  code: id,
  name,
  editionYear: "2025/2026",
  jrwaSymbol,
  targetAudience: "",
  description: "",
  status: "aktywny",
  participatingSchoolsCount: 0,
  totalPupilsReached: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}));

let sequence = 0;
function action(overrides: Partial<OzipzAction>): OzipzAction {
  sequence += 1;
  const program = overrides.programId ? PROGRAM_BY_ID.get(overrides.programId) : undefined;
  return {
    id: `act-${sequence}`,
    title: overrides.actionType ?? "Prelekcja (warsztat)",
    actionType: "Prelekcja (warsztat)",
    date: "2026-05-15",
    facilityName: "Szkoła Podstawowa nr 1",
    municipality: "Myślibórz",
    programName: program?.name,
    topic: "",
    audienceGroup: "Uczniowie",
    ezdStatus: "w_ezd",
    status: "wykonane",
    numberOfActions: 1,
    participantsCount: 0,
    materialsDistributedCount: 0,
    leadEducator: "Edukator",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    ...overrides,
  };
}

/** Maj 2026 z ewidencji: [dzień, forma, znak sprawy, program, liczba działań, odbiorcy]. */
type MayRow = [day: string, actionType: string, jrwaSign: string, programId: string, numberOfActions: number, participants: number];
const MAY_2026: MayRow[] = [
  ["01", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["01", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["01", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["04", "Sprawozdanie (z programu, miernik, tytoń)", "OZiPZ.0442.4.2026", "sprawozdawczosc-statystyczna", 1, 1],
  ["04", "Pismo (list intencyjny)", "OZiPZ.966.7.14.2026", "zdrowy-styl-zycia", 1, 3],
  ["08", "Publikacja media (Portal X)", "966.9", "choroby-nowotworowe", 1, 0],
  ["08", "Publikacja media (Strona)", "966.9", "choroby-nowotworowe", 1, 0],
  ["09", "Publikacja media (Portal X)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["10", "Publikacja media (Facebook)", "966.9", "choroby-nowotworowe", 1, 0],
  ["11", "Publikacja media (Portal X)", "966.11", "szczepienia", 1, 0],
  ["11", "Publikacja media (Strona)", "966.11", "szczepienia", 1, 0],
  ["14", "Publikacja media (Facebook)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["14", "Publikacja media (Portal X)", "966.4", "higiena-tarcza", 1, 0],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["14", "Dystrybucja", "966.5", "porozmawiajmy-o-zdrowiu", 1, 1],
  ["15", "Publikacja media (Portal X)", "966.6", "substancje-psychoaktywne", 1, 0],
  ["15", "Pismo (list intencyjny)", "966.18", "mlodzi-swiadomi", 1, 8],
  ["16", "Publikacja media (Portal X)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["17", "Publikacja media (Portal X)", "966.2", "hiv-aids", 1, 0],
  ["18", "Publikacja media (Facebook)", "966.18", "mlodzi-swiadomi", 1, 0],
  ["18", "Publikacja media (Strona)", "966.18", "mlodzi-swiadomi", 1, 0],
  ["19", "Publikacja media (Portal X)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Publikacja media (Facebook)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["21", "Publikacja media (Portal X)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["21", "Publikacja media (Strona)", "966.7", "zdrowy-styl-zycia", 1, 0],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["21", "Dystrybucja", "966.11", "szczepienia", 1, 1],
  ["25", "Prelekcja (warsztat)", "OZiPZ.966.14.20.2026", "bezpieczne-wakacje", 2, 68],
  ["25", "Prelekcja (warsztat)", "OZiPZ.966.5.15.2026", "porozmawiajmy-o-zdrowiu", 1, 30],
  ["25", "Wykład", "OZiPZ.966.14.11.2026", "bezpieczne-wakacje", 1, 112],
  ["25", "Prelekcja (warsztat)", "OZiPZ.966.5.7.2026", "porozmawiajmy-o-zdrowiu", 1, 43],
  ["25", "Prelekcja (warsztat)", "OZiPZ.966.5.8.2026", "porozmawiajmy-o-zdrowiu", 1, 25],
  ["25", "Prelekcja (warsztat)", "OZiPZ.966.14.12.2026", "bezpieczne-wakacje", 2, 75],
  ["26", "Wykład", "OZiPZ.966.14.13.2026", "bezpieczne-wakacje", 1, 70],
  ["26", "Dystrybucja", "966.9", "choroby-nowotworowe", 1, 1],
  ["26", "Publikacja media (Portal X)", "966.6", "substancje-psychoaktywne", 1, 0],
  ["27", "Prelekcja (warsztat)", "OZiPZ.966.5.9.2026", "porozmawiajmy-o-zdrowiu", 4, 90],
  ["27", "Prelekcja (warsztat)", "OZiPZ.966.6.3.2026", "substancje-psychoaktywne", 2, 90],
  ["27", "Publikacja media (Facebook)", "966.6", "substancje-psychoaktywne", 1, 0],
  ["27", "Publikacja media (Portal X)", "966.6", "substancje-psychoaktywne", 1, 0],
  ["27", "Publikacja media (Strona)", "966.6", "substancje-psychoaktywne", 1, 0],
  // Znak sprawy z teczki 966.15, ale program „Senior w roli głównej” (966.19) – liczy się jako programowe.
  ["28", "Wykład", "966.15.1.2026", "seniorzy", 1, 94],
  ["28", "Dystrybucja", "966.19", "seniorzy", 1, 1],
  ["28", "Prelekcja (warsztat)", "OZiPZ.966.5.10.2026", "porozmawiajmy-o-zdrowiu", 1, 18],
  ["28", "Publikacja media (Portal X)", "966.14", "bezpieczne-wakacje", 1, 0],
  // Znak bez kropki po „OZiPZ” – tak zapisany w ewidencji.
  ["29", "Prelekcja (warsztat)", "OZiPZ966.5.11.2026", "porozmawiajmy-o-zdrowiu", 2, 45],
  ["29", "Prelekcja (warsztat)", "OZiPZ.966.14.14.2026", "bezpieczne-wakacje", 2, 45],
  ["29", "Konkurs (quiz)", "OZiPZ.966.6.4.2026", "substancje-psychoaktywne", 1, 97],
  ["31", "Publikacja media (Portal X)", "966.6", "substancje-psychoaktywne", 1, 0],
];

const mayActions = () =>
  MAY_2026.map(([day, actionType, jrwaSign, programId, numberOfActions, participantsCount]) =>
    action({
      date: `2026-05-${day}`,
      actionType,
      jrwaSign,
      programId,
      numberOfActions,
      participantsCount,
      audienceGroup: programId === "seniorzy" ? "Mieszkańcy powiatu / społeczność lokalna" : "Uczniowie",
      facilityName: programId === "seniorzy" ? "Dębnowski Ośrodek Kultury" : "Szkoła Podstawowa nr 1",
    })
  );

/** Liczby wysłane w sprawozdaniu za maj 2026. */
const MAY_REPORT = { programActions: 24, programRecipients: 361, otherActions: 48, otherRecipients: 577 };

function targetsWith(month: number, values: typeof MAY_REPORT) {
  const targets = getDefaultMonthlyTargets();
  targets[month] = { month, ...values };
  return targets;
}

function compliance(actions: OzipzAction[], targets = getDefaultMonthlyTargets()) {
  return calculateMonthlyComplianceMatrix({ actions, targets, year: 2026, customKindMap: KIND_MAP });
}

function sumMiernik(section: Record<string, Record<string, { people: number; actionNumber: number }>>) {
  let actions = 0;
  let people = 0;
  for (const program of Object.values(section)) {
    for (const row of Object.values(program)) {
      actions += row.actionNumber;
      people += row.people;
    }
  }
  return { actions, people };
}

const initialStore = useOzipzDbStore.getState();

beforeEach(() => {
  useOzipzDbStore.setState({ dictionaryItems: DICTIONARY, programs: programRecords, jrwaCases: [] });
});

afterEach(() => {
  useOzipzDbStore.setState(initialStore, true);
});

describe("Sprawozdanie za maj 2026 – ewidencja zgodna z wysłanymi liczbami", () => {
  it("sprawozdanie miesięczne: 24 działania / 361 odbiorców programowych, 48 / 577 nieprogramowych", () => {
    const { rows } = compliance(mayActions(), targetsWith(5, MAY_REPORT));
    const may = rows[4];

    expect(may.monthly.recorded).toEqual(MAY_REPORT);
    expect(may.monthly.status).toBe("zgodne");
    expect(rows.filter((r) => r.month !== 5).every((r) => r.monthly.status === "brak_sprawozdania")).toBe(true);
  });

  it("wykład i dystrybucja „Senior w roli głównej” (966.19) liczą się jako programowe mimo znaku 966.15", () => {
    const seniors = mayActions().filter((a) => a.programId === "seniorzy");
    expect(seniors).toHaveLength(2);
    expect(seniors.every((a) => isProgramAction(a, KIND_MAP))).toBe(true);

    const recorded = compliance(seniors).rows[4].monthly.recorded;
    expect(recorded).toEqual({ programActions: 2, programRecipients: 95, otherActions: 0, otherRecipients: 0 });
  });

  it("bez seniorów maj nie zgadza się ze sprawozdaniem – dokładnie o 2 działania i 95 odbiorców programowych", () => {
    const withoutSeniors = mayActions().filter((a) => a.programId !== "seniorzy");
    const { diff, status } = compliance(withoutSeniors, targetsWith(5, MAY_REPORT)).rows[4].monthly;

    expect(status).toBe("rozbieznosc");
    expect(diff).toEqual({ programActions: -2, programRecipients: -95, otherActions: 0, otherRecipients: 0 });
  });

  it("miernik (załączniki nr 1 i 2) ma te same sumy co sprawozdanie miesięczne", () => {
    const { aggregated, allActions, allPeople } = aggregateActionsToProgramsData(mayActions(), [5], KIND_MAP, NAMES_MAP);

    expect(sumMiernik(aggregated.PROGRAMOWE)).toEqual({ actions: 24, people: 361 });
    expect(sumMiernik(aggregated.NIEPROGRAMOWE)).toEqual({ actions: 48, people: 577 });
    expect({ allActions, allPeople }).toEqual({ allActions: 72, allPeople: 938 });

    expect(aggregated.PROGRAMOWE[SENIOR_PROGRAM_NAME]).toEqual({
      "Wykład": { actionNumber: 1, people: 94 },
      "Dystrybucja": { actionNumber: 1, people: 1 },
    });
    expect(Object.keys(aggregated.NIEPROGRAMOWE).some((name) => /senior/i.test(name))).toBe(false);
  });

  it("hierarchia załącznika (podgląd na ekranie) ma te same sumy sekcji", () => {
    const sections = buildReportHierarchy(buildReportAnnexRows(mayActions(), KIND_MAP, NAMES_MAP));
    const byKind = Object.fromEntries(sections.map((s) => [s.kind, { actions: s.totalActions + s.totalVisits, people: s.totalPeople }]));

    expect(byKind).toEqual({ programowe: { actions: 24, people: 361 }, nieprogramowe: { actions: 48, people: 577 } });
    const seniors = sections.find((s) => s.kind === "programowe")?.groups.find((g) => g.programName === SENIOR_PROGRAM_NAME);
    expect(seniors).toMatchObject({ jrwa: "966.19", totalActions: 2, totalPeople: 95 });
  });

  it("GIS: seniorzy w obszarze INNE (programowe), sprawozdanie 0442 poza formularzem", () => {
    const { reports, stats } = calculateGisReports(mayActions(), { gisCategoryMap: GIS_MAP, kindMap: KIND_MAP });
    const inne = reports.inne.programowe;

    expect(inne.interwencje).toContain(SENIOR_PROGRAM_NAME);
    expect(inne.liczbaPrelekcji).toBe(1);
    expect(inne.liczbaOdbiorcowPrelekcji).toBe(94);
    expect(inne.zidentyfikowaneMiejscaDystrybucji).toContain("Dębnowski Ośrodek Kultury");
    expect(reports.inne.nieprogramowe.interwencje.some((name) => /senior/i.test(name))).toBe(false);

    expect(stats.totalActions).toBe(72);
    expect(stats.totalRecipients).toBe(938);
    expect(stats.unclassified.map((u) => [u.symbol, u.reason])).toEqual([["0442", "poza-sprawozdaniem"]]);
    expect(stats.categorizedActions).toBe(71);
  });
});

describe("Seniorzy: para symboli 966.15 (nieprogramowe) i 966.19 (programowe)", () => {
  const senior = (overrides: Partial<OzipzAction>) =>
    action({ actionType: "Wykład", programId: "seniorzy", jrwaSign: "966.19", participantsCount: 94, ...overrides });

  it.each<[string, Partial<OzipzAction>]>([
    ["sam symbol w znaku", {}],
    ["pełny znak sprawy", { jrwaSign: "OZiPZ.966.19.4.2026" }],
    ["znak bez kropki po OZiPZ", { jrwaSign: "OZiPZ966.19.4.2026" }],
    ["bez znaku – symbol z programu", { jrwaSign: "" }],
    ["bez znaku i id – program po nazwie", { jrwaSign: "", programId: undefined, programName: SENIOR_PROGRAM_NAME }],
    ["bez znaku, nazwa z wielkimi literami jak w słowniku 966.15", { jrwaSign: "", programId: undefined, programName: "Seniorzy (Senior w Roli Głównej)" }],
    ["sprawa JRWA powiązana relacją", { jrwaSign: "", jrwaCaseId: "case-senior" }],
  ])("%s → 966.19, programowe", (_label, overrides) => {
    useOzipzDbStore.setState({
      jrwaCases: [{ id: "case-senior", jrwaSymbol: "966.19" } as never],
    });
    const a = senior(overrides);

    expect(resolveReportingJrwaSymbol(a)).toBe("966.19");
    expect(isProgramAction(a, KIND_MAP)).toBe(true);
    expect(compliance([a]).rows[4].monthly.recorded).toMatchObject({ programActions: 1, programRecipients: 94, otherActions: 0 });
  });

  it.each(["966.15.1.2026", "OZiPZ.966.15.2.2026"])("program 966.19 decyduje mimo znaku sprawy %s – we wszystkich sprawozdaniach", (jrwaSign) => {
    const a = senior({ jrwaSign });

    // Znak sprawy nadal wskazuje swoją teczkę – zmienia się tylko symbol do sprawozdań.
    expect(extractCleanJrwaSymbol(a)).toBe("966.15");
    expect(resolveReportingJrwaSymbol(a)).toBe("966.19");

    expect(compliance([a]).rows[4].monthly.recorded).toEqual({ programActions: 1, programRecipients: 94, otherActions: 0, otherRecipients: 0 });
    const { aggregated } = aggregateActionsToProgramsData([a], [5], KIND_MAP, NAMES_MAP);
    expect(aggregated).toEqual({ PROGRAMOWE: { [SENIOR_PROGRAM_NAME]: { "Wykład": { actionNumber: 1, people: 94 } } }, NIEPROGRAMOWE: {} });
    expect(buildReportAnnexRows([a], KIND_MAP, NAMES_MAP)).toMatchObject([{ kind: "programowe", jrwa: "966.19", actions: 1, people: 94 }]);
    const { reports } = calculateGisReports([a], { gisCategoryMap: GIS_MAP, kindMap: KIND_MAP });
    expect(reports.inne.programowe.liczbaOdbiorcowPrelekcji).toBe(94);
    expect(reports.inne.nieprogramowe.liczbaDzialan).toBe(0);
  });

  it("program nieprogramowy decyduje mimo znaku z teczki programowej", () => {
    const a = action({ actionType: "Pismo (list intencyjny)", programId: "zdrowy-styl-zycia", jrwaSign: "OZiPZ.966.2.2.2026", participantsCount: 71 });

    expect(resolveReportingJrwaSymbol(a)).toBe("966.7");
    expect(compliance([a]).rows[4].monthly.recorded).toEqual({ programActions: 0, programRecipients: 0, otherActions: 1, otherRecipients: 71 });
    expect(calculateGisReports([a], { gisCategoryMap: GIS_MAP, kindMap: KIND_MAP }).reports.otylosc.nieprogramowe.liczbaDzialan).toBe(1);
  });

  it("bez programu działanie jest nieprogramowe – znak sprawy nie decyduje (ani 966.15, ani 966.19)", () => {
    const a = action({ actionType: "Wykład", jrwaSign: "OZiPZ.966.15.3.2026", participantsCount: 40 });

    expect(resolveReportingJrwaSymbol(a)).toBe("966.15");
    expect(isProgramAction(a, KIND_MAP)).toBe(false);
    expect(compliance([a]).rows[4].monthly.recorded).toEqual({ programActions: 0, programRecipients: 0, otherActions: 1, otherRecipients: 40 });

    // Znak z teczki programowej 966.19 bez programu też nie czyni działania programowym
    const b = action({ actionType: "Wykład", jrwaSign: "OZiPZ.966.19.3.2026", participantsCount: 40 });

    expect(resolveReportingJrwaSymbol(b)).toBe("966.19");
    expect(isProgramAction(b, KIND_MAP)).toBe(false);
    expect(compliance([b]).rows[4].monthly.recorded).toEqual({ programActions: 0, programRecipients: 0, otherActions: 1, otherRecipients: 40 });
  });

  it("program z symbolem spoza słownika JRWA nie ma rodzaju – działanie nieprogramowe mimo znaku 966.19", () => {
    useOzipzDbStore.setState({ programs: [...programRecords, { ...programRecords[0], id: "bez-teczki", name: "Program bez teczki", jrwaSymbol: "999.9" }] });
    const a = action({ programId: "bez-teczki", programName: "Program bez teczki", jrwaSign: "OZiPZ.966.19.6.2026", participantsCount: 12 });

    // Symbol do sprawozdań nadal ze znaku (zapasowo), ale rodzaj tylko z programu
    expect(resolveReportingJrwaSymbol(a)).toBe("966.19");
    expect(isProgramAction(a, KIND_MAP)).toBe(false);
    expect(compliance([a]).rows[4].monthly.recorded).toEqual({ programActions: 0, programRecipients: 0, otherActions: 1, otherRecipients: 12 });
  });

  it.each([
    ["OZiPZ.966.1.19.2026", "966.1"],
    ["OZiPZ.966.19.1.2026", "966.19"],
    ["OZiPZ.966.15.19.2026", "966.15"],
    ["OZiPZ.966.19.15.2026", "966.19"],
    ["OZiPZ.966.1.15.2026", "966.1"],
  ])("numer sprawy nie myli się z symbolem: %s → %s", (jrwaSign, symbol) => {
    expect(extractCleanJrwaSymbol({ jrwaSign }, Array.from(KIND_MAP.keys()))).toBe(symbol);
  });
});

describe("Liczenie w sprawozdaniu miesięcznym", () => {
  it("działanie z 31 maja i z 1 czerwca trafiają do swoich miesięcy", () => {
    const { rows } = compliance([
      action({ date: "2026-05-31", jrwaSign: "966.19", programId: "seniorzy", participantsCount: 10 }),
      action({ date: "2026-06-01", jrwaSign: "966.19", programId: "seniorzy", participantsCount: 20 }),
      action({ date: "2025-05-15", jrwaSign: "966.19", programId: "seniorzy", participantsCount: 40 }),
    ]);

    expect(rows[4].monthly.recorded.programRecipients).toBe(10);
    expect(rows[5].monthly.recorded.programRecipients).toBe(20);
  });

  it("odwołane i odroczone nie wchodzą do żadnego sprawozdania", () => {
    const actions = [
      action({ jrwaSign: "966.19", programId: "seniorzy", participantsCount: 94 }),
      action({ jrwaSign: "966.19", programId: "seniorzy", participantsCount: 50, status: "odwolane" }),
      action({ jrwaSign: "966.6", programId: "substancje-psychoaktywne", participantsCount: 30, status: "odroczone" }),
    ];

    expect(compliance(actions).rows[4].monthly.recorded).toEqual({ programActions: 1, programRecipients: 94, otherActions: 0, otherRecipients: 0 });
    expect(aggregateActionsToProgramsData(actions, [5], KIND_MAP, NAMES_MAP)).toMatchObject({ allActions: 1, allPeople: 94 });
    expect(calculateGisReports(actions, { gisCategoryMap: GIS_MAP, kindMap: KIND_MAP }).stats).toMatchObject({ totalActions: 1, totalRecipients: 94 });
  });

  it("liczba działań to liczba grup, a brak lub zero liczy się jako jedno działanie", () => {
    const actions = [
      action({ jrwaSign: "OZiPZ.966.5.9.2026", programId: "porozmawiajmy-o-zdrowiu", numberOfActions: 4, participantsCount: 90 }),
      action({ jrwaSign: "966.6", programId: "substancje-psychoaktywne", numberOfActions: 0, participantsCount: 5 }),
      action({ jrwaSign: "966.6", programId: "substancje-psychoaktywne", numberOfActions: undefined, participantsCount: 5 }),
    ];

    expect(compliance(actions).rows[4].monthly.recorded).toEqual({ programActions: 4, programRecipients: 90, otherActions: 2, otherRecipients: 10 });
    expect(aggregateActionsToProgramsData(actions, [5], KIND_MAP, NAMES_MAP)).toMatchObject({ allActions: 6, allPeople: 100 });
  });

  it("narastająco sumuje miesiące do ostatniego sprawozdania", () => {
    const targets = targetsWith(5, MAY_REPORT);
    targets[4] = { month: 4, programActions: 2, programRecipients: 94, otherActions: 1, otherRecipients: 30 };
    const actions = [
      ...mayActions(),
      action({ date: "2026-04-10", jrwaSign: "966.19", programId: "seniorzy", numberOfActions: 2, participantsCount: 94 }),
      action({ date: "2026-04-11", jrwaSign: "966.6", programId: "substancje-psychoaktywne", participantsCount: 30 }),
    ];
    const { rows, summary } = compliance(actions, targets);

    expect(rows[3].monthly.status).toBe("zgodne");
    expect(rows[4].cumulative.recorded).toEqual({ programActions: 26, programRecipients: 455, otherActions: 49, otherRecipients: 607 });
    expect(summary).toMatchObject({ reportedMonthsCount: 2, matchingMonthsCount: 2, lastReportedMonth: 5 });
    expect(summary.cumulative.status).toBe("zgodne");
  });
});
