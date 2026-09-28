import type { OzipzAction } from "../../types/ozipz.types";
import { isProgramAction } from "./jrwaClassification";

/**
 * Normalizacja i sanityzacja daty z OCR (rok odchylony o > 1 jest podmieniany na bieżący rok)
 */
export function sanitizeRecentDate(
  iso: string | null | undefined,
  opts: { nowYear?: number; maxDelta?: number } = {}
): string | null {
  if (!iso) return null;
  const m = String(iso)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const year = Number(m[1]);
  if (opts.nowYear === undefined && opts.maxDelta === undefined) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const nowYear = opts.nowYear ?? new Date().getFullYear();
  const maxDelta = opts.maxDelta ?? 1;
  if (!Number.isFinite(year) || Math.abs(year - nowYear) <= maxDelta) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return `${nowYear}-${m[2]}-${m[3]}`;
}

/**
 * Walidacja dodatniej liczby całkowitej
 */
export function validateIntegerAtLeast(value: unknown, min: number, label: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) {
    throw new Error(`${label} musi być liczbą całkowitą ≥ ${min}`);
  }
  return number;
}

export function nonNegativeInt(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

export function calculatePercent(actual: number, planned: number): number | null {
  return planned > 0 ? Math.round((actual / planned) * 100) : null;
}

export interface MiernikWykonanieResult {
  programowe: { actions: number; people: number };
  akcje: { actions: number; people: number };
  razem: { actions: number; people: number };
  planowane: {
    razemDzialania: number;
    razemUczestnicy: number;
    programyDzialania: number;
    programyUczestnicy: number;
  };
  procenty: {
    razemDzialania: number | null;
    razemUczestnicy: number | null;
    programyDzialania: number | null;
    programyUczestnicy: number | null;
  };
}

export interface MiernikPlanInput {
  razem_dzialania?: number | null;
  razem_uczestnicy?: number | null;
  programy_dzialania?: number | null;
  programy_uczestnicy?: number | null;
  razemDzialania?: number | null;
  razemUczestnicy?: number | null;
  programyDzialania?: number | null;
  programyUczestnicy?: number | null;
}

export interface MiernikPreviewInput {
  split?: {
    programowe?: { actions?: number; people?: number };
    nieprogramowe?: { actions?: number; people?: number };
  };
}

/**
 * Oblicza wykonanie mierników 20.5.1.W i 20.5.1.2.W na podstawie podglądu sprawozdania i planu.
 */
export function calculateMiernikWykonanie(
  preview: MiernikPreviewInput = {},
  plan: MiernikPlanInput = {}
): MiernikWykonanieResult {
  const programowe = {
    actions: nonNegativeInt(preview.split?.programowe?.actions),
    people: nonNegativeInt(preview.split?.programowe?.people),
  };
  const akcje = {
    actions: nonNegativeInt(preview.split?.nieprogramowe?.actions),
    people: nonNegativeInt(preview.split?.nieprogramowe?.people),
  };
  const razem = {
    actions: programowe.actions + akcje.actions,
    people: programowe.people + akcje.people,
  };
  const planowane = {
    razemDzialania: nonNegativeInt(plan.razem_dzialania ?? plan.razemDzialania),
    razemUczestnicy: nonNegativeInt(plan.razem_uczestnicy ?? plan.razemUczestnicy),
    programyDzialania: nonNegativeInt(plan.programy_dzialania ?? plan.programyDzialania),
    programyUczestnicy: nonNegativeInt(plan.programy_uczestnicy ?? plan.programyUczestnicy),
  };

  return {
    programowe,
    akcje,
    razem,
    planowane,
    procenty: {
      razemDzialania: calculatePercent(razem.actions, planowane.razemDzialania),
      razemUczestnicy: calculatePercent(razem.people, planowane.razemUczestnicy),
      programyDzialania: calculatePercent(programowe.actions, planowane.programyDzialania),
      programyUczestnicy: calculatePercent(programowe.people, planowane.programyUczestnicy),
    },
  };
}

/**
 * Czy wykluczyć NIEPROGRAMOWE + Wizytacja
 */
export function isExcludedNieprogramoweWizytacja(
  row: {
    actionType?: string | null;
    title?: string | null;
    dzialanie_nazwa?: string | null;
    rodzaj_interwencji?: string | null;
    programId?: string | null;
    jrwaSign?: string | null;
    jrwaCaseId?: string | null;
  },
  customKindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">
): boolean {
  const isProg = isProgramAction(row as Partial<OzipzAction>, customKindMap);
  const actionName = String(row.dzialanie_nazwa || row.title || row.actionType || "").trim().toLowerCase();
  return !isProg && actionName === "wizytacja";
}
