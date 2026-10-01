import { describe, it, expect } from "vitest";
import { JRWA_DICTIONARY_FIXTURE } from "../../../../test/fixtures/jrwaCatalog";
import type { OzipzAction, OzipzDictionaryItem, OzipzFacility } from "../../types/ozipz.types";
import {
  buildJrwaGisCategoryMap,
  calculateGisReports,
  classifyGisForm,
  mapToStandardGroups,
  resolveActionGisCategory,
} from "./index";

let sequence = 0;
function action(overrides: Partial<OzipzAction>): OzipzAction {
  sequence += 1;
  return {
    id: `a-${sequence}`,
    title: "Działanie",
    actionType: "Prelekcja (warsztat)",
    date: "2026-02-10",
    facilityName: "Szkoła Podstawowa nr 1",
    municipality: "Myślibórz",
    topic: "",
    audienceGroup: "Uczniowie szkół podstawowych",
    ezdStatus: "",
    status: "wykonane",
    participantsCount: 0,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 0,
    leadEducator: "Jan Kowalski",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function jrwaItem(code: string, overrides: Partial<OzipzDictionaryItem> = {}): OzipzDictionaryItem {
  return {
    id: `dict-${code}`,
    dictType: "jrwaSymbol",
    code,
    label: `Symbol ${code}`,
    isSystem: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

const gisCategoryMap = buildJrwaGisCategoryMap(JRWA_DICTIONARY_FIXTURE);


describe("GIS categories (JRWA -> obszar sprawozdania)", () => {
  it("takes GIS areas only from the JRWA dictionary", () => {
    expect(buildJrwaGisCategoryMap().size).toBe(0);
    expect(gisCategoryMap.get("966.5")).toBe("uzaleznienia");
    expect(gisCategoryMap.get("966.8")).toBe("szczepienia");
    expect(gisCategoryMap.get("966.1")).toBe("otylosc");
    expect(gisCategoryMap.get("966.18")).toBe("sti");
    expect(gisCategoryMap.get("966.14")).toBe("inne");
    expect(gisCategoryMap.get("0442")).toBe("brak");
  });

  it("builds the map only from the given dictionary entries", () => {
    const map = buildJrwaGisCategoryMap([
      jrwaItem("966.16", { gisCategory: "uzaleznienia" }),
      jrwaItem("966.20", { gisCategory: "inne" }),
      jrwaItem("966.21"),
      { ...jrwaItem("x"), dictType: "activityType", gisCategory: "sti" },
    ]);
    expect(map.get("966.16")).toBe("uzaleznienia");
    expect(map.get("966.20")).toBe("inne");
    expect(map.has("966.21")).toBe(false);
    expect(map.has("x")).toBe(false);
    expect(map.has("966.1")).toBe(false);
  });

  it("resolves the category from the case sign", () => {
    expect(resolveActionGisCategory(action({ jrwaSign: "OZiPZ.966.11.3.2026" }), gisCategoryMap)).toEqual({
      symbol: "966.11",
      category: "szczepienia",
    });
    expect(resolveActionGisCategory(action({ title: "Spotkanie", programName: "" }), gisCategoryMap)).toEqual({
      symbol: null,
      category: null,
    });
  });
});

describe("classifyGisForm", () => {
  it.each([
    ["Wizytacja", "wizytacja"],
    ["Kontrola", "wizytacja"],
    ["Szkolenie", "szkolenie"],
    ["Konferencja", "szkolenie"],
    ["Narada", "szkolenie"],
    ["Konkurs (quiz)", "konkurs"],
    ["Prelekcja (warsztat)", "prelekcja"],
    ["Wykład", "prelekcja"],
    ["Rozmowa indywidualna (instruktaż)", "prelekcja"],
    ["Happening (przemarsz, gra, event)", "event"],
    ["Stoisko edukacyjno-informacyjne", "event"],
    ["Publikacja media (Strona)", "publikacja-strona"],
    ["Publikacja media (Facebook)", "social-media"],
    ["Publikacja media (Portal X)", "social-media"],
    ["Dystrybucja", "dystrybucja"],
    ["Pismo (list intencyjny)", "other"],
    ["Sprawozdanie (z programu, miernik, tytoń)", "other"],
    ["Wywiad do mediów", "other"],
  ])("%s -> %s", (label, expected) => {
    expect(classifyGisForm(label)).toBe(expected);
  });
});

describe("mapToStandardGroups", () => {
  it("maps free-text audiences from the registry to GIS groups", () => {
    const groups = mapToStandardGroups([
      "Grupa I:\nUczniowie kl. 4 - 21\nOpiekunowie - 1",
      "Młodzież szkół ponadpodstawowych (Liceum, Technikum, BS)",
      "Seniorzy (UTW, Domy Seniora, Kluby)",
      "Pracownicy ochrony zdrowia - 1",
      "Społeczność lokalna / internauci",
      "Członkowie koła diabetyków - 96",
    ]);
    expect(groups.sort()).toEqual(
      ["dzieci", "dorośli", "młodzież", "seniorzy", "kadra medyczna", "ogół społeczeństwa", "inne niż wymienione"].sort()
    );
  });

  it("ignores commas inside parentheses and group headers", () => {
    expect(mapToStandardGroups(["Dzieci przedszkolne (lampa UV, talerz zdrowego żywienia) - 70", "Grupa II:"])).toEqual(["dzieci"]);
  });
});

describe("calculateGisReports", () => {
  const facilities: OzipzFacility[] = [
    {
      id: "f-1",
      name: "Szkoła Podstawowa nr 1",
      type: "Szkoła podstawowa",
      address: "ul. Szkolna 1",
      city: "Myślibórz",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "powiat myśliborski",
      leadingAuthority: "",
      isComplex: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const actions = [
    // SZCZEPIENIA – nieprogramowe
    action({ jrwaSign: "OZiPZ.966.11.1.2026", programName: "Promocja szczepień", actionType: "Prelekcja (warsztat)", numberOfActions: 2, participantsCount: 40, indirectRecipientsCount: 5, facilityId: "f-1" }),
    action({ jrwaSign: "OZiPZ.966.11.2.2026", programName: "Promocja szczepień", actionType: "Publikacja media (Facebook)", participantsCount: 120, facilityName: "PSSE Myślibórz" }),
    action({ jrwaSign: "OZiPZ.966.11.3.2026", programName: "Promocja szczepień", actionType: "Dystrybucja", facilityName: "Przychodnia Zdrowie" }),
    action({ jrwaSign: "OZiPZ.966.11.4.2026", programName: "Promocja szczepień", actionType: "Konkurs (quiz)", participantsCount: 30, status: "odwolane" }),
    // ZAPOBIEGANIE OTYŁOŚCI – programowe (966.1 Trzymaj Formę)
    action({ jrwaSign: "OZiPZ.966.1.1.2026", programName: "Trzymaj Formę", actionType: "Szkolenie", participantsCount: 12, audienceGroup: "Kadra pedagogiczna i koordynatorzy" }),
    action({ jrwaSign: "OZiPZ.966.1.2.2026", programName: "Trzymaj Formę", actionType: "Wizytacja", participantsCount: 1, facilityName: "Szkoła Podstawowa nr 2" }),
    // Poza sprawozdaniem i bez symbolu
    action({ jrwaSign: "OZiPZ.0442.1.2026", programName: "Sprawozdawczość statystyczna", actionType: "Sprawozdanie (z programu, miernik, tytoń)", participantsCount: 1 }),
    action({ title: "Spotkanie organizacyjne", programName: "", participantsCount: 3 }),
  ];

  const { reports, stats } = calculateGisReports(actions, { gisCategoryMap, facilities });

  it("splits actions by GIS area and program type", () => {
    expect(reports.szczepienia.nieprogramowe.liczbaDzialan).toBe(4);
    expect(reports.szczepienia.programowe.liczbaDzialan).toBe(0);
    expect(reports.otylosc.programowe.liczbaDzialan).toBe(2);
    expect(reports.otylosc.nieprogramowe.liczbaDzialan).toBe(0);
    expect(reports.uzaleznienia.programowe.liczbaDzialan).toBe(0);
  });

  it("fills form fields with direct + indirect recipients and numberOfActions", () => {
    const report = reports.szczepienia.nieprogramowe;
    expect(report.interwencje).toEqual(["Promocja szczepień"]);
    expect(report.liczbaOdbiorcow).toBe(40 + 5 + 120);
    expect(report.liczbaPrelekcji).toBe(2);
    expect(report.liczbaOdbiorcowPrelekcji).toBe(45);
    expect(report.liczbaPostowSocialMedia).toBe(1);
    expect(report.liczbaObserwatorowSocialMedia).toBe(120);
    expect(report.liczbaMiejscDystrybucjiMateria).toBe(1);
    expect(report.zidentyfikowaneMiejscaDystrybucji).toEqual(["Przychodnia Zdrowie"]);
    expect(report.liczbaPodmiotow).toBe(3);
    expect(report.powiat).toBe("powiat myśliborski");
    expect(report.grupyOdbiorcow).toEqual(["dzieci"]);
  });

  it("excludes cancelled actions", () => {
    expect(reports.szczepienia.nieprogramowe.liczbaKonkursow).toBe(0);
    expect(stats.totalActions).toBe(8);
  });

  it("counts trainings and visits for programme interventions", () => {
    const report = reports.otylosc.programowe;
    expect(report.liczbaSzkolen).toBe(1);
    expect(report.liczbaOdbiorcowSzkolen).toBe(12);
    expect(report.liczbaWizytacji).toBe(1);
    expect(report.grupyOdbiorcow).toContain("dorośli");
    expect(report.powiat).toBe("");
  });

  it("reports categorisation coverage and the reason for each unclassified action", () => {
    expect(stats.categorizedActions).toBe(6);
    expect(stats.uncategorizedActions).toBe(2);
    expect(stats.categorizedRecipients).toBe(165 + 13);
    expect(stats.categorizedPercentage).toBeCloseTo(75);
    expect(stats.unclassified.map((row) => [row.symbol, row.reason])).toEqual([
      ["0442", "poza-sprawozdaniem"],
      [null, "brak-symbolu"],
    ]);
  });

  it("działania nieprogramowe z obszarem GIS liczą się razem z odbiorcami, także dystrybucja, wizytacja i sprawozdanie", () => {
    const sign = (n: number) => `OZiPZ.966.11.${n}.2026`;
    const result = calculateGisReports([
      action({ jrwaSign: sign(10), actionType: "Dystrybucja", participantsCount: 1, facilityName: "Apteka" }),
      action({ jrwaSign: sign(11), actionType: "Wizytacja", participantsCount: 1 }),
      action({ jrwaSign: sign(12), actionType: "Sprawozdanie (z programu, miernik, tytoń)", participantsCount: 1 }),
      action({ jrwaSign: sign(13), actionType: "Prelekcja (warsztat)", participantsCount: 20 }),
    ], { gisCategoryMap });
    const report = result.reports.szczepienia.nieprogramowe;
    expect(report.liczbaDzialan).toBe(4);
    expect(report.liczbaOdbiorcow).toBe(23);
    expect(report.liczbaWizytacji).toBe(1);
    expect(result.stats.categorizedRecipients).toBe(23);
  });

  it("liczy miejsca dystrybucji, a nie wpisy", () => {
    const sign = "OZiPZ.966.11.20.2026";
    const report = calculateGisReports([
      action({ jrwaSign: sign, actionType: "Dystrybucja", facilityName: "Apteka w Dębnie" }),
      action({ jrwaSign: sign, actionType: "Dystrybucja", facilityName: "Apteka w Dębnie" }),
      action({ jrwaSign: sign, actionType: "Dystrybucja", facilityName: "Przychodnia" }),
      action({ jrwaSign: sign, actionType: "Dystrybucja", facilityName: "" }),
    ], { gisCategoryMap }).reports.szczepienia.nieprogramowe;
    expect(report.liczbaMiejscDystrybucjiMateria).toBe(3);
    expect(report.zidentyfikowaneMiejscaDystrybucji).toEqual(["Apteka w Dębnie", "Przychodnia"]);
  });

  it("marks actions whose symbol has no GIS category", () => {
    const partialMap = new Map(gisCategoryMap);
    partialMap.delete("966.11");
    const result = calculateGisReports([actions[0]], { gisCategoryMap: partialMap });
    expect(result.stats.unclassified[0]).toMatchObject({ symbol: "966.11", reason: "brak-kategorii" });
  });
});
