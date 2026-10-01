import type { OzipzAction } from "../../../types/ozipz.types";

export const monthLabels = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

export const monthFullLabels = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

export const monthEmojis = ["❄️", "🥶", "🌸", "🌱", "🌞", "🌻", "🏖️", "🌳", "🍂", "🎃", "🍁", "🎄"];

export const statusLabels: Record<string, string> = {
  planned: "Planowane",
  "in-progress": "W toku",
  done: "Wykonane",
  wykonane: "Wykonane",
  zaplanowane: "Planowane",
  w_trakcie: "W toku",
  odwolane: "Odwołane",
  cancelled: "Odwołane",
};

export const statusBadgeClasses: Record<string, string> = {
  planned: "border-sky-200 bg-sky-50 text-sky-700",
  zaplanowane: "border-sky-200 bg-sky-50 text-sky-700",
  "in-progress": "border-amber-200 bg-amber-50 text-amber-700",
  w_trakcie: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  wykonane: "border-emerald-200 bg-emerald-50 text-emerald-700",
  odwolane: "border-neutral-200 bg-neutral-100 text-neutral-500",
  cancelled: "border-neutral-200 bg-neutral-100 text-neutral-500",
};

export interface MetricPlanState {
  razemDzialania: number;
  razemUczestnicy: number;
  programyDzialania: number;
  programyUczestnicy: number;
}

/** Plan z zapisu (JSON) — brakujące lub błędne pola dostają wartości domyślne. */
export function parseMetricPlan(value: unknown): MetricPlanState | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const pick = (key: keyof MetricPlanState) => {
    const n = Number(raw[key]);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : emptyMetricPlan[key];
  };
  return {
    razemDzialania: pick("razemDzialania"),
    razemUczestnicy: pick("razemUczestnicy"),
    programyDzialania: pick("programyDzialania"),
    programyUczestnicy: pick("programyUczestnicy"),
  };
}

/** Brak planu w bazie – zera, więc realizacja w procentach się nie liczy, dopóki plan nie zostanie wpisany. */
export const emptyMetricPlan: MetricPlanState = {
  razemDzialania: 0,
  razemUczestnicy: 0,
  programyDzialania: 0,
  programyUczestnicy: 0,
};

export function recipientCount(action: OzipzAction): number {
  return (Number(action.participantsCount) || 0) + (Number(action.indirectRecipientsCount) || 0);
}

export function materialCount(action: OzipzAction): number {
  return Number(action.materialsDistributedCount) || 0;
}

export const isCompletedAction = (action: OzipzAction): boolean =>
  action.status === "wykonane" || action.status === "done";
