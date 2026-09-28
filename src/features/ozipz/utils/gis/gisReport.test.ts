import { describe, it, expect } from "vitest";
import type { OzipzAction, OzipzDictionaryItem, OzipzFacility } from "../../types/ozipz.types";
import {
  DEFAULT_JRWA_GIS_CATEGORY_MAP,
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

const gisCategoryMap = buildJrwaGisCategoryMap();

describe("GIS categories (JRWA -> obszar sprawozdania)", () => {
  it("maps the default catalog according to the Better-OZ categorisation", () => {
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.5")).toBe("uzaleznienia");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.6")).toBe("uzaleznienia");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.8")).toBe("szczepienia");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.11")).toBe("szczepienia");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.1")).toBe("otylosc");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.7")).toBe("otylosc");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.12")).toBe("otylosc");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.2")).toBe("sti");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.18")).toBe("sti");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.14")).toBe("inne");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("966.16")).toBe("inne");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("0442")).toBe("brak");
    expect(DEFAULT_JRWA_GIS_CATEGORY_MAP.get("9011.2")).toBe("brak");
  });

  it("lets dictionary entries override defaults and add new symbols", () => {
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
    expect(map.get("966.1")).toBe("otylosc");
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

  it("marks actions whose symbol has no GIS category", () => {
    const partialMap = new Map(gisCategoryMap);
    partialMap.delete("966.11");
    const result = calculateGisReports([actions[0]], { gisCategoryMap: partialMap });
    expect(result.stats.unclassified[0]).toMatchObject({ symbol: "966.11", reason: "brak-kategorii" });
  });
});
