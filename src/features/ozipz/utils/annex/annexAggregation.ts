import type { OzipzAction } from "../../types/ozipz.types";
import { isActionCountedInReports } from "../calculators/actionMetrics";
import { safeParseDate } from "../dateUtils";
import {
  isProgramAction,
  extractCleanJrwaSymbol,
  getActiveJrwaKindMap,
  getActiveJrwaNamesMap,
} from "../calculators/jrwaClassification";
import type {
  ReportAnnexKind,
  ReportAnnexRow,
  ReportHierarchyGroup,
  ReportHierarchySection,
  ProgramsData,
  AggregatedMiernikData,
} from "./annexTypes";

const ACTION_TYPE_MATCHERS: [RegExp, string][] = [
  [/publikacja_x|portal x|twitter|tweet/, "Publikacja media (Portal X)"],
  [/publikacja_fb|facebook|post fb/, "Publikacja media (Facebook)"],
  [/publikacja_strona|strona|gov\.pl|portal www|publikacja internetowa/, "Publikacja media (Strona)"],
  [/^prelekcj|warsztat|pogadanka|zajęcia/, "Prelekcja (warsztat)"],
  [/^wyk[lł]ad/, "Wykład"],
  [/^pismo|list intencyjny|korespondencja/, "Pismo (list intencyjny)"],
  [/^konkurs|quiz|turniej/, "Konkurs (quiz)"],
  [/^dystrybucja|rozdzielnik/, "Dystrybucja"],
  [/^stoisko|punkt informacyjny/, "Stoisko edukacyjno-informacyjne"],
  [/^sprawozdanie|miernik|raport/, "Sprawozdanie (z programu, miernik, tytoń)"],
  [/^wizytacja|kontrola/, "Wizytacja"],
  [/^narada/, "Narada"],
  [/^szkolenie|konferencja/, "Szkolenie"],
  [/happening|event|przemarsz/, "Happening (przemarsz, gra, event)"],
  [/rozmowa|instruktaż/, "Rozmowa indywidualna (instruktaż)"],
  [/wywiad/, "Wywiad do mediów"],
];

/**
 * Zwraca znormalizowaną etykietę formy działania ze słownika OZiPZ.
 */
export function getNormalizedActionType(action: Partial<OzipzAction>): string {
  const raw = String(action.actionType || "").trim() || String(action.title || "").trim();
  const lower = raw.toLowerCase();

  for (const [regex, label] of ACTION_TYPE_MATCHERS) {
    if (regex.test(lower)) return label;
  }

  if (raw.length <= 50 && !raw.includes("http") && !raw.includes("#")) {
    return raw;
  }

  return "Prelekcja (warsztat)";
}

const TITLE_INTERVENTIONS: [RegExp, string][] = [
  [/wzw|wirusow|zoltaczk|zakazn/, "Profilaktyka chorób zakaźnych (Podstępne WZW, Jesień bez infekcji, grypa)"],
  [/grzyb|grzybobran/, "Promocja bezpiecznego grzybobrania i profilaktyka zatruć grzybami"],
  [/kleszcz|borelioz/, "Choroby odkleszczowe i borelioza"],
  [/tyton|paleni|nikotyn|papieros/, "Profilaktyka tytoniowa"],
  [/wakacj|wypoczynek|ferie|kapiel/, "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne ferie i wakacje)"],
  [/szczepien|hpv/, "Promocja szczepień ochronnych (Europejski Tydzień Szczepień)"],
  [/odzywian|cukier|otylos|ruch/, "Promocja zdrowego stylu życia, aktywności fizycznej i prawidłowego odżywiania"],
  [/nowotwor|rak|czerniak|znamion|znamie/, "Profilaktyka chorób nowotworowych (Znamię! znam je?)"],
];

/**
 * Rozstrzyga precyzyjną nazwę programu lub interwencji nieprogramowej.
 */
export function resolveInterventionName(
  action: Partial<OzipzAction>,
  isProg: boolean,
  interventionNames?: ReadonlyMap<string, string>
): string {
  const names = interventionNames ?? getActiveJrwaNamesMap();

  // 1. Jeśli przypisano oficjalny program szkolny ze słownika
  if (
    action.programName &&
    action.programName.trim() &&
    action.programName !== "Działania nieprogramowe" &&
    action.programName !== "Program profilaktyczny"
  ) {
    return action.programName.trim();
  }

  // 2. Jeśli ma przypisany znak sprawy lub symbol JRWA z katalogu / słownika
  const known = interventionNames ? Array.from(interventionNames.keys()) : undefined;
  let jrwaKey = "";
  if (action.jrwaSign) {
    jrwaKey = extractCleanJrwaSymbol({ jrwaSign: action.jrwaSign }, known) || "";
  }
  if (!jrwaKey && action.jrwaCaseId) {
    jrwaKey = extractCleanJrwaSymbol({ jrwaCaseId: action.jrwaCaseId }, known) || "";
  }
  if (jrwaKey && names.has(jrwaKey)) {
    return names.get(jrwaKey)!;
  }

  // 3. Jeśli ma określoną tematykę zdrowotną w polu topic
  if (
    action.topic &&
    action.topic.trim() &&
    action.topic !== "Działania nieprogramowe" &&
    action.topic !== "Ogólne OZiPZ / Promocja Zdrowia" &&
    action.topic !== "Program profilaktyczny"
  ) {
    return action.topic.trim();
  }

  // 4. Dopasowanie tematyki na podstawie słów kluczowych z tytułu / treści
  const title = String(action.title || "").toLowerCase();
  const normalizedTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [regex, label] of TITLE_INTERVENTIONS) {
    if (regex.test(normalizedTitle)) return label;
  }

  if (action.topic && action.topic.trim()) {
    return action.topic.trim();
  }

  return isProg ? "Program profilaktyczny" : "Promocja zdrowego stylu życia i edukacja zdrowotna";
}

/** Wizytacja nieprogramowa nie wchodzi do miernika – szablon ma kolumnę wizytacji tylko przy programach. */
export function isOutsideMiernik(isProg: boolean, actionName: string): boolean {
  return !isProg && actionName.toLocaleLowerCase("pl-PL") === "wizytacja";
}

/**
 * Agreguje działania w strukturę załączników sprawozdawczych identyczną z Better-OZ.
 */
export function buildReportAnnexRows(
  actions: readonly OzipzAction[],
  customInterventionMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">,
  customInterventionNames?: ReadonlyMap<string, string>
): ReportAnnexRow[] {
  const buckets = new Map<string, ReportAnnexRow>();
  const interventionMap = getActiveJrwaKindMap(customInterventionMap);
  const interventionNames = getActiveJrwaNamesMap(customInterventionNames);
  const knownSymbols = customInterventionMap
    ? Array.from(customInterventionMap.keys())
    : (customInterventionNames ? Array.from(customInterventionNames.keys()) : undefined);

  actions.forEach((action) => {
    if (!isActionCountedInReports(action)) return;
    const isProg = isProgramAction(action, interventionMap);
    const kind: ReportAnnexKind = isProg ? "programowe" : "nieprogramowe";
    const programName = resolveInterventionName(action, isProg, interventionNames);
    const actionName = getNormalizedActionType(action);
    if (isOutsideMiernik(isProg, actionName)) return;
    const cleanJrwa = extractCleanJrwaSymbol(action, knownSymbols) || "";
    const key = `${kind}|${programName}|${actionName}`;

    const row = buckets.get(key) ?? {
      kind,
      programName,
      jrwa: cleanJrwa,
      actionName,
      actions: 0,
      visits: 0,
      people: 0,
    };
    if (!row.jrwa && cleanJrwa) {
      row.jrwa = cleanJrwa;
    }

    const isVisit = actionName.toLocaleLowerCase("pl-PL") === "wizytacja";
    const numActions = Number(action.numberOfActions) || 1;
    const count = (Number(action.participantsCount) || 0);

    if (isVisit) {
      row.visits += numActions;
    } else {
      row.actions += numActions;
    }
    row.people += count;

    buckets.set(key, row);
  });

  return [...buckets.values()].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "programowe" ? -1 : 1;
    return (
      left.programName.localeCompare(right.programName, "pl-PL") ||
      left.jrwa.localeCompare(right.jrwa, "pl-PL") ||
      left.actionName.localeCompare(right.actionName, "pl-PL")
    );
  });
}

/**
 * Buduje hierarchię dwupoziomową: Sekcja -> Grupa -> Formy działań.
 */
export function buildReportHierarchy(rows: readonly ReportAnnexRow[]): ReportHierarchySection[] {
  const sections: ReportHierarchySection[] = [
    { kind: "programowe", label: "Działania Programowe (GIS/MZ)", groups: [], totalActions: 0, totalVisits: 0, totalPeople: 0 },
    { kind: "nieprogramowe", label: "Działania Pozaprogramowe / Własne / Akcyjne", groups: [], totalActions: 0, totalVisits: 0, totalPeople: 0 },
  ];

  const sectionByKind = new Map(sections.map((section) => [section.kind, section]));
  const groupsByKind = new Map<ReportAnnexKind, Map<string, ReportHierarchyGroup>>([
    ["programowe", new Map()],
    ["nieprogramowe", new Map()],
  ]);

  for (const row of rows) {
    const section = sectionByKind.get(row.kind);
    if (!section) continue;

    const key = row.programName;
    const groupMap = groupsByKind.get(row.kind)!;
    let group = groupMap.get(key);

    if (!group) {
      group = {
        kind: row.kind,
        programName: row.programName,
        jrwa: row.jrwa,
        actions: [],
        totalActions: 0,
        totalVisits: 0,
        totalPeople: 0,
      };
      section.groups.push(group);
      groupMap.set(key, group);
    } else if (!group.jrwa && row.jrwa) {
      group.jrwa = row.jrwa;
    }

    group.actions.push({
      actionName: row.actionName,
      actions: row.actions,
      visits: row.visits,
      people: row.people,
    });
    group.totalActions += row.actions;
    group.totalVisits += row.visits;
    group.totalPeople += row.people;

    section.totalActions += row.actions;
    section.totalVisits += row.visits;
    section.totalPeople += row.people;
  }

  return sections.filter((section) => section.groups.length > 0);
}

/**
 * Agreguje działania OZiPZ do struktury ProgramsData zgodnej z edu-report
 */
export function aggregateActionsToProgramsData(
  actions: readonly OzipzAction[],
  selectedMonths?: readonly number[],
  customInterventionMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">,
  customInterventionNames?: ReadonlyMap<string, string>
): AggregatedMiernikData {
  let allPeople = 0;
  let allActions = 0;
  const warnings: string[] = [];

  const interventionMap = getActiveJrwaKindMap(customInterventionMap);
  const interventionNames = getActiveJrwaNamesMap(customInterventionNames);

  const filtered = actions.filter((a) => {
    if (!isActionCountedInReports(a)) return false;
    if (selectedMonths && selectedMonths.length > 0) {
      const date = safeParseDate(a.date);
      if (!date || !selectedMonths.includes(date.getMonth() + 1)) return false;
    }
    return true;
  });

  const aggregated: ProgramsData = {
    PROGRAMOWE: {},
    NIEPROGRAMOWE: {},
  };

  filtered.forEach((action) => {
    const isProg = isProgramAction(action, interventionMap);
    const programType = isProg ? "PROGRAMOWE" : "NIEPROGRAMOWE";
    const programName = resolveInterventionName(action, isProg, interventionNames);
    const actionName = getNormalizedActionType(action);

    if (isOutsideMiernik(isProg, actionName)) return;

    const peopleCount = Math.max(0, (Number(action.participantsCount) || 0));
    const actionCount = Math.max(1, Number(action.numberOfActions) || 1);

    aggregated[programType] ??= {};
    aggregated[programType][programName] ??= {};
    aggregated[programType][programName][actionName] ??= { people: 0, actionNumber: 0 };

    aggregated[programType][programName][actionName].actionNumber += actionCount;
    aggregated[programType][programName][actionName].people += peopleCount;

    allPeople += peopleCount;
    allActions += actionCount;
  });

  return { aggregated, allPeople, allActions, warnings };
}
