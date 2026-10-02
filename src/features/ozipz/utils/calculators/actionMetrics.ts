import type { OzipzAction } from "../../types/ozipz.types";

export interface TotalRecipientsResult {
  total: number;
  materialsCount: number;
}

export function calculateTotalRecipients(actions?: OzipzAction[]): TotalRecipientsResult {
  let total = 0;
  let materialsCount = 0;

  const safeActions = Array.isArray(actions) ? actions : [];
  for (const action of safeActions) {
    total += action.participantsCount || 0;
    materialsCount += action.materialsDistributedCount || 0;
  }

  return { total, materialsCount };
}

export interface SyntheticActionMetrics {
  tasksCount: number;
  dzCount: number;
  totalRecipients: number;
  materialsDistributed: number;
  cancelledCount?: number;
  uniqueFacilitiesCount: number;
  uniqueTopicsCount: number;
}

export function isActionCancelled(status?: string | null): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "odwolane" || s === "odwołane" || s === "anulowane" || s === "cancelled";
}

export function isActionPostponed(status?: string | null): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "odroczone" || s === "postponed";
}

/** Działanie liczone w sprawozdaniach (miernik, GIS, statystyki): nie odwołane i nie odroczone. */
export function isActionCountedInReports(action: Pick<OzipzAction, "status">): boolean {
  return !isActionCancelled(action.status) && !isActionPostponed(action.status);
}

export function calculateSyntheticActionMetrics(actions: OzipzAction[]): SyntheticActionMetrics {
  const uniqueFacilities = new Set<string>();
  const uniqueTopics = new Set<string>();
  let dzCount = 0;
  let totalRecipients = 0;
  let materialsDistributed = 0;
  let cancelledCount = 0;

  for (const a of actions) {
    if (isActionCancelled(a.status)) {
      cancelledCount += 1;
      continue;
    }
    if (isActionPostponed(a.status)) continue;
    const fac = (a.facilityId || a.facilityName || "").trim();
    if (fac) uniqueFacilities.add(fac);
    const top = (a.topic || "").trim();
    if (top) uniqueTopics.add(top);
    dzCount += Number(a.numberOfActions) || 1;
    totalRecipients += Number(a.participantsCount) || 0;
    materialsDistributed += Number(a.materialsDistributedCount) || 0;
  }

  return {
    tasksCount: actions.filter(isActionCountedInReports).length,
    dzCount,
    totalRecipients,
    materialsDistributed,
    cancelledCount,
    uniqueFacilitiesCount: uniqueFacilities.size,
    uniqueTopicsCount: uniqueTopics.size,
  };
}
