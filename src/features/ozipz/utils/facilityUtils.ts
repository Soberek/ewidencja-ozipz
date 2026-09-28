/**
 * Logika domenowa Bazy Placówek: normalizacja, wyszukiwanie, filtrowanie i kontrola jakości danych.
 * Czyste funkcje — bez Reacta i bez dostępu do bazy.
 */
import type { OzipzDictionaryItem, OzipzFacility } from "../types/ozipz.types";

export type FacilityStructureFilter = "all" | "complex" | "standalone" | "in_complex";

export interface FacilityFilterCriteria {
  search: string;
  structure: FacilityStructureFilter;
  /** Kody typów ze słownika `locationType`; pusta lista = wszystkie. */
  types: string[];
  educationTypes: string[];
  /** Nazwa gminy lub "all". */
  municipality: string;
  onlyWithIssues: boolean;
}

export const EMPTY_FACILITY_FILTERS: FacilityFilterCriteria = {
  search: "",
  structure: "all",
  types: [],
  educationTypes: [],
  municipality: "all",
  onlyWithIssues: false,
};

export type FacilityIssueCode =
  | "invalid-postal-code"
  | "invalid-email"
  | "missing-email"
  | "unknown-municipality"
  | "duplicate-name"
  | "missing-education-types"
  | "missing-leading-authority"
  | "empty-complex"
  | "shared-contact";

export interface FacilityIssue {
  code: FacilityIssueCode;
  message: string;
}

/** Typy ze słownika `locationType`, dla których oczekujemy danych oświatowych. */
const EDUCATION_LOCATION_TYPES = new Set(["szkola", "przedszkole"]);
const POSTAL_CODE_RE = /^\d{2}-\d{3}$/;
const EMAIL_RE = /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/;

/** Placówki przechowują gołą nazwę gminy („Myślibórz”), słownik bywa z prefiksem („Gmina Myślibórz”). */
export function municipalityName(value: string | null | undefined): string {
  return String(value || "").trim().replace(/^gmina\s+/i, "");
}

export function municipalityNamesFromDictionary(items: OzipzDictionaryItem[]): string[] {
  const names = items.map((item) => municipalityName(item.label || item.code)).filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pl"));
}

/** Kod pocztowy gminy ze słownika (pole `postalCode`), dopasowany po nazwie bez prefiksu. */
export function municipalityPostalCode(items: OzipzDictionaryItem[], municipality: string): string | undefined {
  const key = normalizeSearchText(municipalityName(municipality));
  return items.find((item) => normalizeSearchText(municipalityName(item.label || item.code)) === key)?.postalCode || undefined;
}

/** Małe litery bez polskich znaków — „Myślibórz” odnajdziemy wpisując „mysliborz”. */
export function normalizeSearchText(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidPostalCode(value: string | null | undefined): boolean {
  return POSTAL_CODE_RE.test(String(value || "").trim());
}

export function isValidEmail(value: string | null | undefined): boolean {
  return EMAIL_RE.test(String(value || "").trim());
}

export function isEducationFacility(f: OzipzFacility): boolean {
  return EDUCATION_LOCATION_TYPES.has(f.type) || Boolean(f.educationTypes?.length);
}

export function buildChildrenMap(facilities: OzipzFacility[]): Map<string, OzipzFacility[]> {
  const map = new Map<string, OzipzFacility[]>();
  for (const f of facilities) {
    if (!f.parentFacilityId) continue;
    const list = map.get(f.parentFacilityId) || [];
    list.push(f);
    map.set(f.parentFacilityId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  return map;
}

export function countBy<T>(rows: T[], key: (row: T) => string | null | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

/**
 * Wyznacza braki i niespójności dla każdej placówki.
 * @param knownMunicipalities nazwy gmin ze słownika; pusty zbiór wyłącza tę kontrolę.
 */
export function buildFacilityIssuesIndex(
  facilities: OzipzFacility[],
  knownMunicipalities: ReadonlySet<string>
): Map<string, FacilityIssue[]> {
  const byId = new Map(facilities.map((f) => [f.id, f]));
  const children = buildChildrenMap(facilities);
  const byName = groupBy(facilities, (f) => normalizeSearchText(f.name));
  const byContact = groupBy(
    facilities.filter((f) => !f.isComplex && !f.parentFacilityId && f.email),
    (f) => `${normalizeSearchText(f.address)}|${normalizeSearchText(f.city)}|${normalizeSearchText(f.email)}`
  );
  const known = new Set(Array.from(knownMunicipalities, normalizeSearchText));

  const index = new Map<string, FacilityIssue[]>();
  for (const f of facilities) {
    const issues: FacilityIssue[] = [];
    const add = (code: FacilityIssueCode, message: string) => issues.push({ code, message });
    const parent = f.parentFacilityId ? byId.get(f.parentFacilityId) : undefined;
    const education = isEducationFacility(f);

    if (!isValidPostalCode(f.postalCode)) add("invalid-postal-code", `Kod pocztowy „${f.postalCode || "—"}” nie ma formatu 00-000.`);
    for (const [label, value] of [["placówki", f.email], ["koordynatora", f.defaultCoordinatorEmail]] as const) {
      if (value && !isValidEmail(value)) add("invalid-email", `Niepoprawny e-mail ${label}: ${value}.`);
    }
    if (education && !f.email && !f.defaultCoordinatorEmail && !parent?.email) add("missing-email", "Brak adresu e-mail placówki.");
    if (known.size > 0 && !known.has(normalizeSearchText(f.municipality))) add("unknown-municipality", `Gmina „${f.municipality}” nie występuje w słowniku gmin.`);
    if ((byName.get(normalizeSearchText(f.name))?.length || 0) > 1) add("duplicate-name", "Inna placówka ma identyczną nazwę.");
    if (EDUCATION_LOCATION_TYPES.has(f.type) && !f.isComplex && !f.educationTypes?.length) add("missing-education-types", "Nie wskazano typów kształcenia.");
    if (education && !f.leadingAuthority?.trim()) add("missing-leading-authority", "Brak organu prowadzącego.");
    if (f.isComplex && !children.get(f.id)?.length) add("empty-complex", "Zespół nie ma przypisanych jednostek.");

    const siblings = f.email ? byContact.get(`${normalizeSearchText(f.address)}|${normalizeSearchText(f.city)}|${normalizeSearchText(f.email)}`) : undefined;
    if (siblings && siblings.length > 1) {
      const others = siblings.filter((s) => s.id !== f.id).map((s) => s.name).join("; ");
      add("shared-contact", `Ten sam adres i e-mail co: ${others}. Rozważ połączenie w zespół.`);
    }
    if (issues.length) index.set(f.id, issues);
  }
  return index;
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    map.set(k, [...(map.get(k) || []), row]);
  }
  return map;
}

export function facilitySearchHaystack(f: OzipzFacility, parent?: OzipzFacility, typeLabel?: string): string {
  return normalizeSearchText([
    f.name, f.municipality, f.city, f.address, f.postalCode, f.email, f.phone, f.leadingAuthority,
    f.defaultCoordinatorName, f.defaultCoordinatorEmail, f.defaultCoordinatorPhone, f.notes,
    typeLabel || f.type, parent?.name, ...(f.educationTypes || []),
  ].filter(Boolean).join(" | "));
}

export interface FacilityFilterContext {
  byId: Map<string, OzipzFacility>;
  childrenMap: Map<string, OzipzFacility[]>;
  issues: Map<string, FacilityIssue[]>;
  typeLabels: Map<string, string>;
}

/** Filtruje i sortuje alfabetycznie. Wszystkie słowa wyszukiwania muszą wystąpić (AND). */
export function filterFacilities(
  facilities: OzipzFacility[],
  criteria: FacilityFilterCriteria,
  ctx: FacilityFilterContext
): OzipzFacility[] {
  const tokens = normalizeSearchText(criteria.search).split(" ").filter(Boolean);
  const municipality = criteria.municipality === "all" ? null : normalizeSearchText(criteria.municipality);

  return facilities
    .filter((f) => {
      if (criteria.structure === "complex" && !f.isComplex) return false;
      if (criteria.structure === "standalone" && (f.isComplex || f.parentFacilityId)) return false;
      if (criteria.structure === "in_complex" && !f.parentFacilityId) return false;
      if (criteria.types.length && !criteria.types.includes(f.type)) return false;
      if (municipality && normalizeSearchText(f.municipality) !== municipality) return false;
      if (criteria.onlyWithIssues && !ctx.issues.has(f.id)) return false;
      if (criteria.educationTypes.length) {
        const own = f.educationTypes || [];
        const units = (ctx.childrenMap.get(f.id) || []).flatMap((c) => c.educationTypes || []);
        if (![...own, ...units].some((t) => criteria.educationTypes.includes(t))) return false;
      }
      if (tokens.length) {
        const parent = f.parentFacilityId ? ctx.byId.get(f.parentFacilityId) : undefined;
        const haystack = facilitySearchHaystack(f, parent, ctx.typeLabels.get(f.type));
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export function countActiveFilters(criteria: FacilityFilterCriteria): number {
  return (
    (criteria.search.trim() ? 1 : 0) +
    (criteria.structure !== "all" ? 1 : 0) +
    criteria.types.length +
    criteria.educationTypes.length +
    (criteria.municipality !== "all" ? 1 : 0) +
    (criteria.onlyWithIssues ? 1 : 0)
  );
}

export function formatFacilityAddress(f: Pick<OzipzFacility, "address" | "postalCode" | "city">): string {
  const town = [f.postalCode, f.city].filter(Boolean).join(" ");
  return [f.address, town].filter(Boolean).join(", ");
}

export type FacilityEmailSource = "facility" | "coordinator" | "both";

/** Unikalne adresy (bez rozróżniania wielkości liter) w kolejności listy placówek. */
export function collectFacilityEmails(facilities: OzipzFacility[], source: FacilityEmailSource): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of facilities) {
    const values = [
      source !== "coordinator" ? f.email : undefined,
      source !== "facility" ? f.defaultCoordinatorEmail : undefined,
    ];
    for (const raw of values) {
      for (const email of String(raw || "").split(/[;,]/).map((e) => e.trim())) {
        if (!isValidEmail(email) || seen.has(email.toLowerCase())) continue;
        seen.add(email.toLowerCase());
        out.push(email);
      }
    }
  }
  return out;
}
