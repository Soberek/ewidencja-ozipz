import type { OzipzAction, OzipzScheduleEvent } from "../types/ozipz.types";
import { isActionCancelled, isActionPostponed } from "./calculators/actionMetrics";

export type ScheduleEventProgress = "completed" | "in_progress" | "postponed" | "planned";

const COMPLETED_STATUSES = new Set(["wykonane", "done", "zrealizowane"]);
const IN_PROGRESS_STATUSES = new Set(["w_toku", "in_progress"]);

/** Identyfikatory zadań planu, do których podpięto działanie. */
export function linkedScheduleEventIds(actions: Pick<OzipzAction, "scheduleEventId">[]): Set<string> {
  const ids = new Set<string>();
  for (const a of actions) if (a.scheduleEventId) ids.add(a.scheduleEventId);
  return ids;
}

/** Stan zadania planu: zrealizowane (status lub podpięte działanie), w toku, odroczone/odwołane albo zaplanowane. */
export function classifyScheduleEvent(
  event: Pick<OzipzScheduleEvent, "id" | "status" | "actionId">,
  linkedIds: Set<string>
): ScheduleEventProgress {
  const status = (event.status || "").toLowerCase().trim();
  if (COMPLETED_STATUSES.has(status) || event.actionId || linkedIds.has(event.id)) return "completed";
  if (IN_PROGRESS_STATUSES.has(status)) return "in_progress";
  if (isActionPostponed(status) || isActionCancelled(status)) return "postponed";
  return "planned";
}
