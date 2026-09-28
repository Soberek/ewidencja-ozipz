import type { OzipzAction } from "../../types/ozipz.types";

export interface TotalRecipientsResult {
  direct: number;
  indirect: number;
  total: number;
  materialsCount: number;
}

export function calculateTotalRecipients(actions?: OzipzAction[]): TotalRecipientsResult {
  let direct = 0;
  let indirect = 0;
  let materialsCount = 0;

  const safeActions = Array.isArray(actions) ? actions : [];
  for (const action of safeActions) {
    direct += action.participantsCount || 0;
    indirect += action.indirectRecipientsCount || 0;
    materialsCount += action.materialsDistributedCount || 0;
  }

  return {
    direct,
    indirect,
    total: direct + indirect,
    materialsCount,
  };
}

export const calculateRecipients = calculateTotalRecipients;

export interface SyntheticActionMetrics {
  tasksCount: number;
  dzCount: number;
  directRecipients: number;
  indirectRecipients: number;
  totalRecipients: number;
  materialsDistributed: number;
  executedCount: number;
  plannedCount: number;
  cancelledCount?: number;
  uniqueFacilitiesCount: number;
  uniqueTopicsCount: number;
}

export function isActionCancelled(status?: string | null): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "odwolane" || s === "odwołane" || s === "anulowane" || s === "cancelled";
}

export function isActionExecuted(status?: string | null): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "wykonane" || s === "done" || s === "zrealizowane" || (!s && s !== "planowane");
}

export function calculateSyntheticActionMetrics(actions: OzipzAction[]): SyntheticActionMetrics {
  const uniqueFacilities = new Set<string>();
  const uniqueTopics = new Set<string>();
  let dzCount = 0;
  let directRecipients = 0;
  let indirectRecipients = 0;
  let materialsDistributed = 0;
  let executedCount = 0;
  let plannedCount = 0;
  let cancelledCount = 0;

  for (const a of actions) {
    if (isActionCancelled(a.status)) {
      cancelledCount += 1;
      continue;
    }
    const fac = (a.facilityId || a.facilityName || "").trim();
    if (fac) uniqueFacilities.add(fac);
    const top = (a.topic || "").trim();
    if (top) uniqueTopics.add(top);
    dzCount += Number(a.numberOfActions) || 1;
    directRecipients += Number(a.participantsCount) || 0;
    indirectRecipients += Number(a.indirectRecipientsCount) || 0;
    materialsDistributed += Number(a.materialsDistributedCount) || 0;
    if (a.status === "planowane" || a.status === "planned") {
      plannedCount += 1;
    } else {
      executedCount += 1;
    }
  }

  return {
    tasksCount: actions.length,
    dzCount,
    directRecipients,
    indirectRecipients,
    totalRecipients: directRecipients + indirectRecipients,
    materialsDistributed,
    executedCount,
    plannedCount,
    cancelledCount,
    uniqueFacilitiesCount: uniqueFacilities.size,
    uniqueTopicsCount: uniqueTopics.size,
  };
}
