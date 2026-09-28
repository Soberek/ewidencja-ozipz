import type { OzipzScheduleEvent, OzipzMonthlyTarget, OzipzProgram } from "../types/ozipz.types";
import { resolveScheduleProgram, getEventMonth } from "./scheduleExecutionUtils";
import { getYearNumber } from "./dateUtils";

export type {
  OzipzMonthlyTargetItem,
  OzipzYearlyMonthlyTargets,
  OzipzMonthlyComplianceRow,
  OzipzAnnualComplianceSummary,
} from "./monthlyTargetsTypes";
import {
  MONTH_NAMES_PL,
  MONTH_EMOJIS,
  type OzipzYearlyMonthlyTargets,
} from "./monthlyTargetsTypes";
export { MONTH_NAMES_PL, MONTH_EMOJIS };

/**
 * Generuje domyślny szablon planu pracy dla 12 miesięcy danego roku
 */
export function getDefaultMonthlyTargets(): OzipzYearlyMonthlyTargets {
  const result: OzipzYearlyMonthlyTargets = {};
  for (let m = 1; m <= 12; m++) {
    result[m] = {
      month: m,
      programActions: 0,
      programRecipients: 0,
      otherActions: 0,
      otherRecipients: 0,
    };
  }
  return result;
}

/**
 * Konwertuje tablicę rekordów relacyjnej bazy danych OzipzMonthlyTarget na mapę 12 miesięcy OzipzYearlyMonthlyTargets
 */
export function monthlyTargetsArrayToYearlyMap(targets: OzipzMonthlyTarget[]): OzipzYearlyMonthlyTargets {
  const result = getDefaultMonthlyTargets();
  for (const t of targets) {
    if (t.month >= 1 && t.month <= 12) {
      result[t.month] = {
        month: t.month,
        programActions: Math.max(0, t.programActions || 0),
        programRecipients: Math.max(0, t.programRecipients || 0),
        otherActions: Math.max(0, t.otherActions || 0),
        otherRecipients: Math.max(0, t.otherRecipients || 0),
        notes: t.notes || undefined,
      };
    }
  }
  return result;
}

/**
 * Pobiera zaplanowane zadania bezpośrednio z Harmonogramu / Planu Pracy (OzipzScheduleEvent)
 */
export function extractTargetsFromScheduleEvents(
  events: OzipzScheduleEvent[],
  year: number,
  programs?: OzipzProgram[]
): OzipzYearlyMonthlyTargets {
  const result = getDefaultMonthlyTargets();

  events.forEach((ev) => {
    if (ev.status === "odwolane" || ev.status === "cancelled") return;

    const evYear = (typeof ev.year === "number" && ev.year > 1900)
      ? ev.year
      : (ev.eventDate ? getYearNumber(ev.eventDate, 0) : 0);

    if (evYear !== year) return;

    const m = getEventMonth(ev);
    if (!m || m < 1 || m > 12) return;

    const count = Number(ev.plannedCount) || 1;
    const isProg = resolveScheduleProgram(ev, programs).isProgrammatic;

    if (isProg) {
      result[m].programActions += count;
    } else {
      result[m].otherActions += count;
    }
  });

  return result;
}

export {
  getActionRecipients,
  getActionCount,
  calculatePercent,
  getComplianceStatus,
  calculateMonthlyComplianceMatrix,
} from "./monthlyTargetsCompliance";


const STORAGE_KEY_PREFIX = "ozipz_monthly_work_plan_targets_";

/**
 * Wczytuje plan pracy z pamięci lokalnej dla danego roku
 */
export function loadMonthlyTargets(year: number): OzipzYearlyMonthlyTargets {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${year}`);
    if (!raw) return getDefaultMonthlyTargets();
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const result = getDefaultMonthlyTargets();
      for (let m = 1; m <= 12; m++) {
        if (parsed[m]) {
          result[m] = {
            month: m,
            programActions: Math.max(0, parseInt(parsed[m].programActions, 10) || 0),
            programRecipients: Math.max(0, parseInt(parsed[m].programRecipients, 10) || 0),
            otherActions: Math.max(0, parseInt(parsed[m].otherActions, 10) || 0),
            otherRecipients: Math.max(0, parseInt(parsed[m].otherRecipients, 10) || 0),
            notes: parsed[m].notes || undefined,
          };
        }
      }
      return result;
    }
  } catch {
    // ignore
  }
  return getDefaultMonthlyTargets();
}

/**
 * Zapisuje plan pracy do pamięci lokalnej dla danego roku
 */
export function saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${year}`, JSON.stringify(targets));
  } catch {
    // ignore
  }
}
