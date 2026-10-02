import type { GisCategory, OzipzAction, OzipzFacility } from "../../types/ozipz.types";
import { isProgramAction } from "../calculators/jrwaClassification";
import { isActionCountedInReports } from "../calculators/actionMetrics";
import { getNormalizedActionType } from "../annex/annexAggregation";
import { GIS_REPORT_CATEGORIES, resolveActionGisCategory } from "./gisCategories";
import { classifyGisForm, mapToStandardGroups } from "./gisClassification";
import type {
  GisProgramType,
  GisReportData,
  GisReportMatrix,
  GisReportResult,
  GisUnclassifiedAction,
} from "./gisReportTypes";

export function isCountedInGisReport(action: OzipzAction): boolean {
  return isActionCountedInReports(action);
}

export function gisActionsCount(action: OzipzAction): number {
  return Math.max(1, Number(action.numberOfActions) || 1);
}

/** Odbiorcy działania */
export function gisRecipientsCount(action: OzipzAction): number {
  return (Number(action.participantsCount) || 0);
}

export function createEmptyGisReportData(): GisReportData {
  return {
    powiat: "",
    interwencje: [],
    grupyOdbiorcow: [],
    zidentyfikowanePodmioty: [],
    zidentyfikowaneMiejscaDystrybucji: [],
    liczbaDzialan: 0,
    liczbaOdbiorcow: 0,
    liczbaPodmiotow: 0,
    liczbaWizytacji: 0,
    liczbaSzkolen: 0,
    liczbaOdbiorcowSzkolen: 0,
    liczbaKonkursow: 0,
    liczbaUczestnikowKonkursow: 0,
    liczbaPrelekcji: 0,
    liczbaOdbiorcowPrelekcji: 0,
    liczbaEventow: 0,
    liczbaPostowSocialMedia: 0,
    liczbaObserwatorowSocialMedia: 0,
    liczbaPublikacjiStrona: 0,
    liczbaMiejscDystrybucjiMateria: 0,
  };
}

const sortPl = (values: Iterable<string>) => Array.from(values).sort((a, b) => a.localeCompare(b, "pl-PL"));

function mostFrequent(values: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl-PL"))[0]?.[0] ?? "";
}

/**
 * Wylicza pola sprawozdania GIS dla jednej grupy działań (obszar × typ programu).
 */
export function calculateGisReportData(
  actions: readonly OzipzAction[],
  facilitiesById: ReadonlyMap<string, OzipzFacility> = new Map()
): GisReportData {
  const result = createEmptyGisReportData();
  const interventions = new Set<string>();
  const audiences: string[] = [];
  const entities = new Set<string>();
  const distributionPlaces = new Set<string>();
  // Dystrybucje bez wskazanego miejsca – każda liczy się jako osobne miejsce.
  let unnamedDistributions = 0;
  const counties: string[] = [];

  for (const action of actions) {
    const facility = action.facilityId ? facilitiesById.get(action.facilityId) : undefined;
    if (facility?.county?.trim()) counties.push(facility.county.trim());

    const programName = action.programName?.trim();
    if (programName) interventions.add(programName);
    if (action.audienceGroup?.trim()) audiences.push(action.audienceGroup);

    const facilityName = (facility?.name ?? action.facilityName ?? "").trim();
    if (facilityName) entities.add(facilityName);

    const count = gisActionsCount(action);
    const recipients = gisRecipientsCount(action);
    result.liczbaDzialan += count;
    result.liczbaOdbiorcow += recipients;

    switch (classifyGisForm(getNormalizedActionType(action))) {
      case "wizytacja":
        result.liczbaWizytacji += count;
        break;
      case "szkolenie":
        result.liczbaSzkolen += count;
        result.liczbaOdbiorcowSzkolen += recipients;
        break;
      case "konkurs":
        result.liczbaKonkursow += count;
        result.liczbaUczestnikowKonkursow += recipients;
        break;
      case "prelekcja":
        result.liczbaPrelekcji += count;
        result.liczbaOdbiorcowPrelekcji += recipients;
        break;
      case "event":
        result.liczbaEventow += count;
        break;
      case "publikacja-strona":
        result.liczbaPublikacjiStrona += count;
        break;
      case "social-media":
        result.liczbaPostowSocialMedia += count;
        result.liczbaObserwatorowSocialMedia += recipients;
        break;
      case "dystrybucja":
        if (facilityName) distributionPlaces.add(facilityName);
        else unnamedDistributions += count;
        break;
    }
  }

  result.powiat = mostFrequent(counties);
  result.interwencje = sortPl(interventions);
  result.grupyOdbiorcow = mapToStandardGroups(audiences);
  result.zidentyfikowanePodmioty = sortPl(entities);
  result.liczbaPodmiotow = entities.size;
  result.zidentyfikowaneMiejscaDystrybucji = sortPl(distributionPlaces);
  // Miejsca, nie wpisy: kilka dystrybucji w tej samej placówce to jedno miejsce.
  result.liczbaMiejscDystrybucjiMateria = distributionPlaces.size + unnamedDistributions;
  return result;
}

interface GisReportOptions {
  gisCategoryMap: ReadonlyMap<string, GisCategory>;
  kindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;
  facilities?: readonly OzipzFacility[];
}

/**
 * Buduje komplet sprawozdań GIS (wszystkie obszary × PROGRAMOWE/NIEPROGRAMOWE)
 * oraz statystykę pokrycia działań kategoriami.
 */
export function calculateGisReports(actions: readonly OzipzAction[], options: GisReportOptions): GisReportResult {
  const facilitiesById = new Map((options.facilities ?? []).map((facility) => [facility.id, facility]));
  const buckets = new Map<string, OzipzAction[]>();
  const unclassified: GisUnclassifiedAction[] = [];
  let totalActions = 0;
  let totalRecipients = 0;
  let categorizedActions = 0;
  let categorizedRecipients = 0;

  for (const action of actions) {
    if (!isCountedInGisReport(action)) continue;

    const count = gisActionsCount(action);
    const recipients = gisRecipientsCount(action);
    totalActions += count;
    totalRecipients += recipients;

    const { symbol, category } = resolveActionGisCategory(action, options.gisCategoryMap);
    if (!category || category === "brak") {
      const reason = !symbol ? "brak-symbolu" : category === "brak" ? "poza-sprawozdaniem" : "brak-kategorii";
      unclassified.push({ action, symbol, reason });
      continue;
    }

    categorizedActions += count;
    categorizedRecipients += recipients;
    const programType: GisProgramType = isProgramAction(action, options.kindMap) ? "programowe" : "nieprogramowe";
    const key = `${category}:${programType}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(action);
    else buckets.set(key, [action]);
  }

  const reports = Object.fromEntries(
    GIS_REPORT_CATEGORIES.map(({ id }) => [
      id,
      {
        programowe: calculateGisReportData(buckets.get(`${id}:programowe`) ?? [], facilitiesById),
        nieprogramowe: calculateGisReportData(buckets.get(`${id}:nieprogramowe`) ?? [], facilitiesById),
      },
    ])
  ) as GisReportMatrix;

  return {
    reports,
    stats: {
      totalActions,
      totalRecipients,
      categorizedActions,
      categorizedRecipients,
      uncategorizedActions: totalActions - categorizedActions,
      uncategorizedRecipients: totalRecipients - categorizedRecipients,
      categorizedPercentage: totalActions > 0 ? (categorizedActions / totalActions) * 100 : 0,
      unclassified,
    },
  };
}
