import type {
  OzipzAction,
  OzipzContact,
  OzipzDictionaryItem,
  OzipzDistribution,
  OzipzFacility,
  OzipzJrwaCase,
  OzipzMaterial,
  OzipzScan,
  OzipzScheduleEvent,
  OzipzStaff,
} from "../types/ozipz.types";

/**
 * Indeks użycia pozycji słownikowych w rekordach aplikacji.
 *
 * Rekordy przechowują wartości słownikowe jako tekst — raz kod (np. "szkola", "966.7"),
 * raz etykietę (np. "Prelekcja (warsztat)"). Dopasowanie odbywa się więc po obu polach,
 * bez rozróżniania wielkości liter i białych znaków na brzegach.
 */

export interface DictionaryUsageData {
  actions?: OzipzAction[];
  scheduleEvents?: OzipzScheduleEvent[];
  materials?: OzipzMaterial[];
  distributions?: OzipzDistribution[];
  facilities?: OzipzFacility[];
  jrwaCases?: OzipzJrwaCase[];
  staff?: OzipzStaff[];
  contacts?: OzipzContact[];
  scans?: OzipzScan[];
}

interface UsageSource {
  /** Nazwa modułu widoczna dla użytkownika. */
  module: string;
  /** Ścieżka modułu w aplikacji. */
  route: string;
  /** Wartości słownikowe zapisane w pojedynczym rekordzie. */
  collect: (data: DictionaryUsageData) => Array<Array<string | undefined | null>>;
}

const DICTIONARY_USAGE_SOURCES: Record<string, UsageSource[]> = {
  activityType: [
    { module: "Działania", route: "/dzialania", collect: (d) => (d.actions ?? []).map((a) => [a.actionType]) },
    {
      module: "Harmonogram",
      route: "/harmonogram",
      collect: (d) => (d.scheduleEvents ?? []).map((e) => [e.activityTypeCode, e.activityTypeName]),
    },
  ],
  recipientGroup: [
    { module: "Działania", route: "/dzialania", collect: (d) => (d.actions ?? []).map((a) => [a.audienceGroup]) },
    { module: "Harmonogram", route: "/harmonogram", collect: (d) => (d.scheduleEvents ?? []).map((e) => [e.recipientGroup]) },
    { module: "Materiały", route: "/materialy", collect: (d) => (d.materials ?? []).map((m) => [m.targetAudience]) },
  ],
  campaign: [
    {
      module: "Działania",
      route: "/dzialania",
      collect: (d) => (d.actions ?? []).map((a) => [a.campaignId, a.campaignName]),
    },
    {
      module: "Harmonogram",
      route: "/harmonogram",
      collect: (d) => (d.scheduleEvents ?? []).map((e) => [e.campaignId, e.campaignName]),
    },
  ],
  annotationReason: [
    {
      module: "Harmonogram",
      route: "/harmonogram",
      collect: (d) => (d.scheduleEvents ?? []).map((e) => [e.annotationReasonCode, e.annotationReasonLabel]),
    },
  ],
  locationType: [
    { module: "Placówki", route: "/lokalizacje", collect: (d) => (d.facilities ?? []).map((f) => [f.type]) },
  ],
  municipality: [
    { module: "Placówki", route: "/lokalizacje", collect: (d) => (d.facilities ?? []).map((f) => [f.municipality]) },
    { module: "Działania", route: "/dzialania", collect: (d) => (d.actions ?? []).map((a) => [a.municipality]) },
    { module: "Kontakty", route: "/kontakty", collect: (d) => (d.contacts ?? []).map((c) => [c.municipality]) },
  ],
  materialType: [
    { module: "Materiały", route: "/materialy", collect: (d) => (d.materials ?? []).map((m) => [m.materialType]) },
    { module: "Rozdzielniki", route: "/rozdzielniki", collect: (d) => (d.distributions ?? []).map((r) => [r.materialType]) },
  ],
  jrwaSymbol: [
    { module: "Działania", route: "/dzialania", collect: (d) => (d.actions ?? []).map((a) => [a.jrwaSign]) },
    { module: "Harmonogram", route: "/harmonogram", collect: (d) => (d.scheduleEvents ?? []).map((e) => [e.jrwa]) },
    { module: "Sprawy JRWA", route: "/znaki", collect: (d) => (d.jrwaCases ?? []).map((c) => [c.jrwaSymbol]) },
  ],
  staffRole: [{ module: "Kadra", route: "/osoby", collect: (d) => (d.staff ?? []).map((s) => [s.role]) }],
  contactPosition: [
    { module: "Kontakty", route: "/kontakty", collect: (d) => (d.contacts ?? []).map((c) => [c.position]) },
  ],
  documentType: [{ module: "Skany", route: "/skany", collect: (d) => (d.scans ?? []).map((s) => [s.documentType]) }],
};

/** Moduły, w których wykorzystywana jest dana kategoria słownika. */
export function getDictionaryUsageModules(dictType: string): Array<{ module: string; route: string }> {
  const seen = new Set<string>();
  return (DICTIONARY_USAGE_SOURCES[dictType] ?? [])
    .filter((s) => (seen.has(s.module) ? false : (seen.add(s.module), true)))
    .map(({ module, route }) => ({ module, route }));
}

export function isUsageTracked(dictType: string): boolean {
  return dictType in DICTIONARY_USAGE_SOURCES;
}

export interface DictionaryItemUsage {
  total: number;
  byModule: Array<{ module: string; route: string; count: number }>;
}

export type DictionaryUsageIndex = Map<string, DictionaryItemUsage>;

export const normalizeDictionaryValue = (value: string | undefined | null): string =>
  (value ?? "").trim().toLocaleLowerCase("pl");

export function buildDictionaryUsageIndex(
  items: OzipzDictionaryItem[],
  data: DictionaryUsageData
): DictionaryUsageIndex {
  const index: DictionaryUsageIndex = new Map();

  const itemsByType = new Map<string, OzipzDictionaryItem[]>();
  for (const item of items) {
    const list = itemsByType.get(item.dictType) ?? [];
    list.push(item);
    itemsByType.set(item.dictType, list);
  }

  for (const [dictType, typeItems] of itemsByType) {
    const sources = DICTIONARY_USAGE_SOURCES[dictType];
    if (!sources) continue;

    // Etykieta ma pierwszeństwo przed kodem tylko wtedy, gdy kod nie koliduje z inną pozycją.
    const lookup = new Map<string, string>();
    for (const item of typeItems) {
      const code = normalizeDictionaryValue(item.code);
      if (code && !lookup.has(code)) lookup.set(code, item.id);
    }
    for (const item of typeItems) {
      const label = normalizeDictionaryValue(item.label);
      if (label && !lookup.has(label)) lookup.set(label, item.id);
    }

    for (const source of sources) {
      const perItem = new Map<string, number>();
      for (const values of source.collect(data)) {
        const matched = new Set<string>();
        for (const value of values) {
          const id = lookup.get(normalizeDictionaryValue(value));
          if (id) matched.add(id);
        }
        matched.forEach((id) => perItem.set(id, (perItem.get(id) ?? 0) + 1));
      }

      for (const [id, count] of perItem) {
        const usage = index.get(id) ?? { total: 0, byModule: [] };
        usage.total += count;
        const existing = usage.byModule.find((m) => m.module === source.module);
        if (existing) existing.count += count;
        else usage.byModule.push({ module: source.module, route: source.route, count });
        index.set(id, usage);
      }
    }
  }

  return index;
}

export function formatUsageSummary(usage: DictionaryItemUsage | undefined): string {
  if (!usage || usage.total === 0) return "Nieużywana w rekordach";
  return usage.byModule.map((m) => `${m.module}: ${m.count}`).join(" · ");
}

/** Pozycje wewnętrzne, niewyświetlane w centrum słowników. */
export function isHiddenDictionaryItem(item: OzipzDictionaryItem): boolean {
  return (
    item.dictType === "register_mapping" ||
    item.code === "070" ||
    item.code === "9010" ||
    item.id.startsWith("dict-jrw-")
  );
}
