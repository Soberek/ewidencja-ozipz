import type { OzipzAction } from "../types/ozipz.types";
import { extractCleanJrwaSymbol } from "./ozipzCalculations";
import { resolveActivityFormLabel } from "./actionFormUtils";

export { resolveActivityFormLabel };

export const BEZPIECZNE_WAKACJE_JRWA = "966.14";

export type VacationRecipientCategory = "wiek" | "dorosli" | "grupa";

export interface VacationRecipientClassification {
  kind: VacationRecipientCategory;
  label: string;
}

export interface VacationRankedRow {
  label: string;
  value: number;
}

export interface VacationSummary {
  byActivity: VacationRankedRow[];
  byAge: VacationRankedRow[];
  byGroup: VacationRankedRow[];
  byCategory: VacationRankedRow[];
  byMaterial: VacationRankedRow[];
  byMaterialType: VacationRankedRow[];
  recipientsSplit: { adults: number; childrenWithAge: number; childrenWithoutAge: number };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pl-PL");
}

export function isAdultVacationRecipientGroup(name: string | null | undefined) {
  return /rodzic|opiekun|kadra|nauczyciel|dorosli|senior|media|przedstawiciel|pracownik|instytucj/.test(normalize(String(name ?? "")));
}

export function vacationAgeRangeLabel(ageFrom: number | null | undefined, ageTo: number | null | undefined) {
  const from = ageFrom == null ? null : Number(ageFrom);
  const to = ageTo == null ? null : Number(ageTo);
  const validFrom = from != null && Number.isFinite(from);
  const validTo = to != null && Number.isFinite(to);
  if (validFrom && validTo) return from === to ? `${from} lat` : `${Math.min(from, to)}–${Math.max(from, to)} lat`;
  if (validFrom) return `od ${from} lat`;
  if (validTo) return `do ${to} lat`;
  return null;
}

export function classifyVacationRecipient(recipient: { group?: string | null; ageFrom?: number | null; ageTo?: number | null }): VacationRecipientClassification {
  const group = String(recipient.group ?? "").trim() || "Bez grupy";
  const age = vacationAgeRangeLabel(recipient.ageFrom, recipient.ageTo);
  if (age) return { kind: "wiek", label: age };
  if (isAdultVacationRecipientGroup(group)) return { kind: "dorosli", label: "Dorośli" };
  return { kind: "grupa", label: group };
}

function bump(map: Map<string, number>, label: string, value: number) {
  map.set(label, (map.get(label) ?? 0) + value);
}

function ranked(map: Map<string, number>): VacationRankedRow[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, "pl-PL"));
}

/**
 * Sprawdza, czy działanie należy do akcji „Bezpieczne Wakacje / Ferie” (JRWA 966.14).
 * Bezwzględnie odrzuca działania przypisane do innych teczek JRWA (np. 966.1, 966.3, 966.4 itd.).
 */
export function isVacationAction(action: Partial<OzipzAction>): boolean {
  // 1. Znak JRWA lub wyodrębniony symbol: jeśli posiada symbol JRWA inny niż 966.14, natychmiast odrzucamy
  const sym = extractCleanJrwaSymbol(action);
  if (sym) {
    return sym === BEZPIECZNE_WAKACJE_JRWA;
  }

  // 2. Jeśli pole jrwaSign lub jrwaCaseId zawiera znak sprawy
  const rawJrwa = `${action.jrwaSign || ""} ${action.jrwaCaseId || ""}`;
  if (rawJrwa.includes(BEZPIECZNE_WAKACJE_JRWA)) {
    return true;
  }
  // Jeśli ma inny jawny symbol JRWA (np. 966.1, 966.3), nie może być akcją 966.14
  if (/\b(966\.\d+|9011\.\d+|0442|0444)\b/.test(rawJrwa)) {
    return false;
  }

  // 3. Akcja/kampania profilaktyczna przypisana do Bezpiecznych Wakacji/Ferii
  const camp = `${action.campaignId || ""} ${action.campaignName || ""}`.toLowerCase();
  if (
    camp.includes("bezpieczne_wakacje") ||
    camp.includes("bezpieczne wakacje") ||
    camp.includes("bezpieczne_ferie") ||
    camp.includes("bezpieczne ferie")
  ) {
    return true;
  }

  // 4. Pole programId/programName dedykowane dla Bezpiecznych Wakacji
  const progId = (action.programId || "").toLowerCase();
  const progName = (action.programName || "").toLowerCase();
  if (
    progId === "bezpieczne-wakacje" ||
    progId === "bezpieczne-ferie" ||
    progName.includes("bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego")
  ) {
    return true;
  }

  // 5. Dopasowanie po tytule/tematyce WYŁĄCZNIE jeśli działanie nie należy do innego programu/teczki
  // i w tytule lub tematyce wprost jest mowa o Bezpiecznych Wakacjach / Bezpiecznych Feriach
  const titleTopic = `${action.title || ""} ${action.topic || ""}`.toLowerCase();
  if (
    titleTopic.includes("bezpieczne wakacje") ||
    titleTopic.includes("bezpieczne ferie")
  ) {
    return true;
  }

  return false;
}

/**
 * Zestawienie analityczne działań w ramach akcji „Bezpieczne Wakacje / Ferie” (JRWA 966.14).
 */
export function buildVacationSummary(actions: readonly OzipzAction[]): VacationSummary {
  const byActivity = new Map<string, number>();
  const byAge = new Map<string, number>();
  const byGroup = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byMaterial = new Map<string, number>();
  const byMaterialType = new Map<string, number>();
  let adults = 0;
  let childrenWithAge = 0;
  let childrenWithoutAge = 0;

  actions
    .filter((a) => a.status !== "odwolane" && a.status !== "cancelled" && a.status !== "anulowane")
    .filter(isVacationAction)
    .forEach((action) => {
      const actLabel = resolveActivityFormLabel(action);
      const actCount = Number(action.numberOfActions) || 1;
      bump(byActivity, actLabel, actCount);

      const audGroup = action.audienceGroup?.trim() || "Bez grupy";
      const count = Number(action.participantsCount) || 0;
      bump(byGroup, audGroup, count);

      if (isAdultVacationRecipientGroup(audGroup)) {
        adults += count;
        bump(byCategory, "Dorośli", count);
      } else {
        childrenWithoutAge += count;
        bump(byCategory, audGroup, count);
      }

      if (action.materialsDistributedCount) {
        const mats = Number(action.materialsDistributedCount) || 0;
        bump(byMaterial, "Materiały profilaktyczne", mats);
        bump(byMaterialType, "ulotki / broszury", mats);
      }
    });

  return {
    byActivity: ranked(byActivity),
    byAge: ranked(byAge),
    byGroup: ranked(byGroup),
    byCategory: ranked(byCategory),
    byMaterial: ranked(byMaterial),
    byMaterialType: ranked(byMaterialType),
    recipientsSplit: { adults, childrenWithAge, childrenWithoutAge },
  };
}
