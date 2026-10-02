import type { OzipzAction, OzipzDistribution, OzipzMaterial } from "../types/ozipz.types";
import { resolveActivityFormLabel } from "./actionFormUtils";
import { isActionCountedInReports } from "./calculators/actionMetrics";
import { formatDatePl, safeParseDate } from "./dateUtils";
import { POLISH_MONTHS, formatPeriodForHeader } from "./annex/annexConstants";

/**
 * Rozpiska akcji: wszystko, co zrobiono w ramach jednego zadania z planu pracy (programu)
 * albo jednej kampanii/akcji profilaktycznej — w wybranych miesiącach roku.
 */

export type ActionBreakdownKind = "program" | "kampania";

export interface ActionBreakdownOption {
  /** `program:<id>` albo `kampania:<nazwa>` */
  value: string;
  kind: ActionBreakdownKind;
  label: string;
  /** Wpisy w wybranych miesiącach. */
  periodEntries: number;
  /** Wpisy w całym roku. */
  yearEntries: number;
}

export interface ActionBreakdownRow {
  label: string;
  entries: number;
  actions: number;
  recipients: number;
  materials: number;
}

export interface ActionBreakdownFacilityRow extends ActionBreakdownRow {
  municipality: string;
}

export interface ActionBreakdownMonthRow extends ActionBreakdownRow {
  month: number;
}

export interface ActionBreakdownEntry {
  id: string;
  date: string;
  month: number | null;
  form: string;
  /** Tytuł wpisu, gdy mówi coś więcej niż sama forma. */
  title: string;
  facility: string;
  municipality: string;
  audience: string;
  actions: number;
  recipients: number;
  materials: number;
  materialTitles: string[];
  educator: string;
  status: string;
  notes: string;
}

export interface ActionBreakdown {
  totals: {
    entries: number;
    actions: number;
    recipients: number;
    materials: number;
    facilities: number;
    municipalities: number;
  };
  byMonth: ActionBreakdownMonthRow[];
  byForm: ActionBreakdownRow[];
  byFacility: ActionBreakdownFacilityRow[];
  byMunicipality: ActionBreakdownRow[];
  byEducator: ActionBreakdownRow[];
  materials: { title: string; quantity: number; type: string }[];
  entries: ActionBreakdownEntry[];
}

const UNKNOWN_MATERIAL = "Materiały bez wskazanego tytułu";

const clean = (value: string | null | undefined) => String(value ?? "").trim();

export function isCancelledAction(action: OzipzAction): boolean {
  return !isActionCountedInReports(action);
}

function programKey(action: OzipzAction): string {
  return clean(action.programId) || clean(action.programName);
}

function campaignKey(action: OzipzAction): string {
  // campaignId to kod słownika (starsze wpisy: etykieta), więc grupujemy po nazwie.
  return clean(action.campaignName) || clean(action.campaignId);
}

export function actionBreakdownValue(kind: ActionBreakdownKind, key: string): string {
  return `${kind}:${key}`;
}

function parseValue(value: string): { kind: ActionBreakdownKind; key: string } | null {
  const idx = value.indexOf(":");
  if (idx < 0) return null;
  const kind = value.slice(0, idx);
  const key = value.slice(idx + 1);
  if ((kind !== "program" && kind !== "kampania") || !key) return null;
  return { kind, key };
}

export function matchesActionBreakdown(action: OzipzAction, value: string): boolean {
  const parsed = parseValue(value);
  if (!parsed) return false;
  return parsed.kind === "program" ? programKey(action) === parsed.key : campaignKey(action) === parsed.key;
}

function actionMonth(action: OzipzAction): number | null {
  const parsed = safeParseDate(action.date);
  return parsed ? parsed.getMonth() + 1 : null;
}

/**
 * Lista zadań/programów i kampanii, które mają wpisy w danym roku.
 * `yearActions` — działania z wybranego roku, `months` — zaznaczone miesiące.
 */
export function listActionBreakdownOptions(
  yearActions: readonly OzipzAction[],
  months: readonly number[]
): ActionBreakdownOption[] {
  const options = new Map<string, ActionBreakdownOption>();
  const bump = (kind: ActionBreakdownKind, key: string, label: string, inPeriod: boolean) => {
    if (!key) return;
    const value = actionBreakdownValue(kind, key);
    let option = options.get(value);
    if (!option) {
      option = { value, kind, label: label || key, periodEntries: 0, yearEntries: 0 };
      options.set(value, option);
    }
    option.yearEntries += 1;
    if (inPeriod) option.periodEntries += 1;
  };

  for (const action of yearActions) {
    if (isCancelledAction(action)) continue;
    const month = actionMonth(action);
    const inPeriod = month !== null && months.includes(month);
    bump("program", programKey(action), clean(action.programName), inPeriod);
    bump("kampania", campaignKey(action), campaignKey(action), inPeriod);
  }

  return Array.from(options.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "program" ? -1 : 1;
    return a.label.localeCompare(b.label, "pl");
  });
}

function addTo<T extends ActionBreakdownRow>(
  map: Map<string, T>,
  key: string,
  create: () => T,
  entry: ActionBreakdownEntry
) {
  let row = map.get(key);
  if (!row) {
    row = create();
    map.set(key, row);
  }
  row.entries += 1;
  row.actions += entry.actions;
  row.recipients += entry.recipients;
  row.materials += entry.materials;
}

const emptyRow = (label: string): ActionBreakdownRow => ({ label, entries: 0, actions: 0, recipients: 0, materials: 0 });

const byActionsDesc = (a: ActionBreakdownRow, b: ActionBreakdownRow) =>
  b.actions - a.actions || b.recipients - a.recipients || a.label.localeCompare(b.label, "pl");

/**
 * Buduje rozpiskę z działań już zawężonych do akcji i okresu.
 * Materiały: najpierw pozycje rozdzielników przypisane do działania, a nadwyżkę z licznika
 * `materialsDistributedCount` (np. dystrybucja bez rozdzielnika) — pod tytułem materiału działania.
 */
export function buildActionBreakdown(
  actions: readonly OzipzAction[],
  months: readonly number[],
  { distributions = [], materials = [] }: { distributions?: readonly OzipzDistribution[]; materials?: readonly OzipzMaterial[] } = {}
): ActionBreakdown {
  const materialTitleById = new Map(materials.map((m) => [m.id, m.title]));
  const materialTypeByTitle = new Map(materials.map((m) => [clean(m.title), clean(m.materialType)]));
  const distributionsByAction = new Map<string, OzipzDistribution[]>();
  for (const d of distributions) {
    if (!d.actionId) continue;
    const list = distributionsByAction.get(d.actionId) ?? [];
    list.push(d);
    distributionsByAction.set(d.actionId, list);
  }

  const materialTotals = new Map<string, { quantity: number; type: string }>();
  const addMaterial = (title: string, quantity: number, type?: string) => {
    if (quantity <= 0) return;
    const current = materialTotals.get(title) ?? { quantity: 0, type: "" };
    current.quantity += quantity;
    current.type ||= clean(type) || materialTypeByTitle.get(title) || "";
    materialTotals.set(title, current);
  };

  const entries: ActionBreakdownEntry[] = actions
    .filter((a) => !isCancelledAction(a))
    .map((action) => {
      const form = resolveActivityFormLabel(action);
      const title = clean(action.title);
      const materialsCount = Number(action.materialsDistributedCount) || 0;
      const linked = distributionsByAction.get(action.id) ?? [];
      const materialTitles: string[] = [];
      let fromDistributions = 0;
      for (const d of linked) {
        const qty = Number(d.quantity) || 0;
        const materialTitle = clean(d.materialTitle) || UNKNOWN_MATERIAL;
        addMaterial(materialTitle, qty, d.materialType);
        fromDistributions += qty;
        if (!materialTitles.includes(materialTitle)) materialTitles.push(materialTitle);
      }
      const remainder = materialsCount - fromDistributions;
      if (remainder > 0) {
        const materialTitle = clean(action.materialId && materialTitleById.get(action.materialId)) || UNKNOWN_MATERIAL;
        addMaterial(materialTitle, remainder);
        if (!materialTitles.includes(materialTitle)) materialTitles.push(materialTitle);
      }

      return {
        id: action.id,
        date: action.date,
        month: actionMonth(action),
        form,
        // Tytuł bywa kopią formy albo nazwy programu/kampanii — wtedy nic nie wnosi.
        title: [form, action.actionType, action.programName, action.campaignName].some((v) => clean(v) === title) ? "" : title,
        facility: clean(action.facilityName),
        municipality: clean(action.municipality),
        audience: clean(action.audienceGroup),
        actions: Number(action.numberOfActions) || 1,
        recipients: (Number(action.participantsCount) || 0),
        materials: Math.max(materialsCount, fromDistributions),
        materialTitles,
        educator: clean(action.leadEducator),
        status: clean(action.status),
        notes: clean(action.notes),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.form.localeCompare(b.form, "pl"));

  const monthMap = new Map<string, ActionBreakdownMonthRow>();
  const formMap = new Map<string, ActionBreakdownRow>();
  const facilityMap = new Map<string, ActionBreakdownFacilityRow>();
  const municipalityMap = new Map<string, ActionBreakdownRow>();
  const educatorMap = new Map<string, ActionBreakdownRow>();

  for (const entry of entries) {
    if (entry.month !== null) {
      const month = entry.month;
      addTo(monthMap, String(month), () => ({ ...emptyRow(POLISH_MONTHS[month - 1]), month }) as ActionBreakdownMonthRow, entry);
    }
    addTo(formMap, entry.form, () => emptyRow(entry.form), entry);
    const facility = entry.facility || "Bez placówki";
    addTo(facilityMap, `${facility}|${entry.municipality}`, () => ({ ...emptyRow(facility), municipality: entry.municipality }), entry);
    const municipality = entry.municipality || "Bez gminy";
    addTo(municipalityMap, municipality, () => emptyRow(municipality), entry);
    if (entry.educator) addTo(educatorMap, entry.educator, () => emptyRow(entry.educator), entry);
  }

  const byMonth = [...new Set(months)]
    .sort((a, b) => a - b)
    .map((month) => monthMap.get(String(month)) ?? { ...emptyRow(POLISH_MONTHS[month - 1]), month });

  const sum = (key: "actions" | "recipients" | "materials") => entries.reduce((s, e) => s + e[key], 0);

  return {
    totals: {
      entries: entries.length,
      actions: sum("actions"),
      recipients: sum("recipients"),
      materials: sum("materials"),
      facilities: new Set(entries.map((e) => e.facility).filter(Boolean)).size,
      municipalities: new Set(entries.map((e) => e.municipality).filter(Boolean)).size,
    },
    byMonth,
    byForm: Array.from(formMap.values()).sort(byActionsDesc),
    byFacility: Array.from(facilityMap.values()).sort(byActionsDesc),
    byMunicipality: Array.from(municipalityMap.values()).sort(byActionsDesc),
    byEducator: Array.from(educatorMap.values()).sort(byActionsDesc),
    materials: Array.from(materialTotals, ([title, { quantity, type }]) => ({ title, quantity, type }))
      .sort((a, b) => b.quantity - a.quantity || a.title.localeCompare(b.title, "pl")),
    entries,
  };
}

const n = (value: number) => value.toLocaleString("pl-PL");

export const ENTRY_FORMS = ["wpis", "wpisy", "wpisów"] as const;

/** Liczebnik z rzeczownikiem: [1, 2–4, 5+] — np. ["działanie", "działania", "działań"]. */
export function plural(value: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  const form = value === 1 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${n(value)} ${form}`;
}

export function actionBreakdownPeriodLabel(year: number, months: readonly number[]): string {
  return `${formatPeriodForHeader(months)} ${year}`;
}

/** Tekstowa rozpiska do wklejenia w sprawozdanie / pismo. */
export function formatActionBreakdownText(
  breakdown: ActionBreakdown,
  { label, year, months }: { label: string; year: number; months: readonly number[] }
): string {
  const { totals } = breakdown;
  const lines: string[] = [
    `Rozpiska: ${label}`,
    `Okres: ${actionBreakdownPeriodLabel(year, months)}`,
    "",
    `Zrealizowano ${plural(totals.actions, ["działanie", "działania", "działań"])}` +
      ` (${plural(totals.entries, ENTRY_FORMS)}),` +
      ` docierając do ${plural(totals.recipients, ["odbiorcy", "odbiorców", "odbiorców"])}` +
      ` w ${plural(totals.facilities, ["placówce", "placówkach", "placówkach"])}` +
      ` na terenie ${plural(totals.municipalities, ["gminy", "gmin", "gmin"])}.` +
      (totals.materials > 0 ? ` Przekazano ${n(totals.materials)} szt. materiałów oświatowych.` : ""),
  ];

  if (breakdown.byForm.length) {
    lines.push("", "Formy działań:");
    for (const row of breakdown.byForm) lines.push(`- ${row.label}: ${n(row.actions)} dz., ${n(row.recipients)} odb.`);
  }

  if (breakdown.materials.length) {
    lines.push("", "Materiały:");
    for (const row of breakdown.materials) lines.push(`- ${row.title}: ${n(row.quantity)} szt.`);
  }

  if (breakdown.entries.length) {
    lines.push("", "Wykaz działań:");
    let currentMonth: number | null | undefined;
    for (const entry of breakdown.entries) {
      if (entry.month !== currentMonth) {
        currentMonth = entry.month;
        lines.push("", entry.month ? POLISH_MONTHS[entry.month - 1] : "Bez daty");
      }
      const what = entry.title ? `${entry.form} „${entry.title}”` : entry.form;
      const where = [entry.facility, entry.municipality && entry.municipality !== entry.facility ? `gm. ${entry.municipality}` : ""]
        .filter(Boolean)
        .join(", ");
      const figures = [`${n(entry.actions)} dz.`, `${n(entry.recipients)} odb.`, entry.materials > 0 ? `${n(entry.materials)} szt. mat.` : ""]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${formatDatePl(entry.date, entry.date)} – ${what}${where ? ` – ${where}` : ""} (${figures})`);
      if (entry.audience) lines.push(`  Odbiorcy: ${entry.audience.replace(/\s*\n\s*/g, "; ")}`);
    }
  }

  return lines.join("\n");
}
