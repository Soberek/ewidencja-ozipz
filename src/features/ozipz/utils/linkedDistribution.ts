import type { OzipzAction } from "../types/ozipz.types";

type ActionPayload = Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;
type CompanionPayload = Omit<ActionPayload, "linkedActionId">;

/** Forma działania dla dystrybucji, gdy słownik form nie ma własnej pozycji „Dystrybucja…”. */
export const DEFAULT_DISTRIBUTION_ACTION_TYPE = "Dystrybucja";

export function linkedDistributionTitle(actionTitle: string): string {
  return `Dystrybucja materiałów – ${actionTitle.trim()}`;
}

/**
 * Osobne działanie „Dystrybucja” dla materiałów wydanych podczas innego działania (np. prelekcji).
 * Liczy się jako 1 działanie z 1 odbiorcą (placówką), z tą samą grupą odbiorców co działanie główne;
 * nie ma sprawy w kancelarii, więc EZD „nie dotyczy”.
 */
export function buildLinkedDistribution(
  action: ActionPayload,
  { actionType, materialId, materialsCount, classificationSymbol }: {
    actionType: string;
    materialId?: string;
    materialsCount: number;
    /** Symbol JRWA klasyfikacji (bez programu) — dystrybucja nie dziedziczy znaku sprawy działania głównego. */
    classificationSymbol?: string;
  }
): CompanionPayload {
  return {
    title: linkedDistributionTitle(action.title),
    actionType,
    date: action.date,
    facilityId: action.facilityId,
    facilityName: action.facilityName,
    municipality: action.municipality,
    programId: action.programId,
    programName: action.programName,
    campaignId: action.campaignId,
    campaignName: action.campaignName,
    topic: action.topic,
    audienceGroup: action.audienceGroup,
    jrwaSign: classificationSymbol?.trim() || undefined,
    ezdStatus: "nie_dotyczy",
    status: action.status,
    materialId,
    numberOfActions: 1,
    participantsCount: 1,
    indirectRecipientsCount: 0,
    materialsDistributedCount: materialsCount,
    leadEducator: action.leadEducator,
  };
}

/**
 * Zmiany do przepisania z edytowanego działania na zapisaną razem z nim dystrybucję
 * (to samo zdarzenie: data, miejsce, prowadzący, program, odbiorcy, status).
 * Tytuł podążamy tylko wtedy, gdy nikt go ręcznie nie zmienił. Zwraca null, gdy nie ma czego zmieniać.
 */
export function linkedDistributionUpdates(
  previous: OzipzAction,
  next: OzipzAction,
  distribution: OzipzAction
): Partial<OzipzAction> | null {
  const shared = [
    "date", "facilityId", "facilityName", "municipality", "programId", "programName",
    "campaignId", "campaignName", "topic", "audienceGroup", "leadEducator", "status",
  ] as const;
  const updates: Partial<OzipzAction> = {};
  for (const key of shared) {
    if (previous[key] !== next[key] && distribution[key] !== next[key]) {
      (updates as Record<string, unknown>)[key] = next[key];
    }
  }
  if (previous.title !== next.title && distribution.title === linkedDistributionTitle(previous.title)) {
    updates.title = linkedDistributionTitle(next.title);
  }
  return Object.keys(updates).length > 0 ? updates : null;
}
