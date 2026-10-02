import type { OzipzAction } from "../types/ozipz.types";
import { formatAudienceString, parseAudienceGroups } from "../components/actions/editor/audienceUtils";

type ActionPayload = Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;
type CompanionPayload = Omit<ActionPayload, "linkedActionId">;

/** Forma działania dla dystrybucji, gdy słownik form nie ma własnej pozycji „Dystrybucja…”. */
export const DEFAULT_DISTRIBUTION_ACTION_TYPE = "Dystrybucja";

export function linkedDistributionTitle(actionTitle: string): string {
  return `Dystrybucja materiałów – ${actionTitle.trim()}`;
}

/**
 * Grupa odbiorców dystrybucji: te same grupy co w działaniu głównym, ale łącznie 1 odbiorca (placówka).
 * Formularz liczy uczestników z grupy odbiorców, więc liczba musi być zapisana także tutaj –
 * inaczej edycja dystrybucji przepisałaby uczestników działania głównego i zdublowała odbiorców.
 */
export function linkedDistributionAudience(audienceGroup: string | undefined): string | undefined {
  if (!audienceGroup?.trim()) return audienceGroup;
  const groups = parseAudienceGroups(audienceGroup);
  let remaining = 1;
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.name.trim()) continue;
      item.count = remaining;
      remaining = 0;
    }
  }
  return formatAudienceString(groups);
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
    audienceGroup: linkedDistributionAudience(action.audienceGroup) ?? "",
    jrwaSign: classificationSymbol?.trim() || undefined,
    ezdStatus: "nie_dotyczy",
    status: action.status,
    materialId,
    numberOfActions: 1,
    participantsCount: 1,
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
    const value = key === "audienceGroup" ? linkedDistributionAudience(next.audienceGroup) : next[key];
    if (previous[key] !== next[key] && distribution[key] !== value) {
      (updates as Record<string, unknown>)[key] = value;
    }
  }
  if (previous.title !== next.title && distribution.title === linkedDistributionTitle(previous.title)) {
    updates.title = linkedDistributionTitle(next.title);
  }
  return Object.keys(updates).length > 0 ? updates : null;
}
