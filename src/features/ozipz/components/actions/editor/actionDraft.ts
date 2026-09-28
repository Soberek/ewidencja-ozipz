import type { ActionDistributedMaterialItem, ActionFormInput, AudienceGroupBlock } from "./editor.types";

const STORAGE_KEY = "oz.actionDraft.v1";

/** Niezapisany szkic nowego działania, przechowywany w przeglądarce do czasu zapisu lub odrzucenia. */
export interface ActionDraft {
  savedAt: string;
  values: ActionFormInput;
  audienceGroups: AudienceGroupBlock[];
  materialItems: ActionDistributedMaterialItem[];
  activitiesDescription: string;
  additionalNotes: string;
  selectedJrwaSymbol: string;
  /** Znak sprawy nadany automatycznie — przy przywróceniu nadajemy aktualny wolny numer zamiast starego. */
  autoSign: boolean;
}

export type ActionDraftContent = Pick<
  ActionDraft,
  "values" | "audienceGroups" | "materialItems" | "activitiesDescription" | "additionalNotes"
>;

/** Czy szkic zawiera dane wpisane przez użytkownika (a nie tylko wartości startowe formularza). */
export function hasActionDraftContent(content: ActionDraftContent): boolean {
  return Boolean(
    content.values.title?.trim() ||
      content.values.facilityName?.trim() ||
      content.audienceGroups.some((g) => g.items.some((i) => i.name.trim() || Number(i.count) > 0)) ||
      content.materialItems.length > 0 ||
      content.activitiesDescription.trim() ||
      content.additionalNotes.trim()
  );
}

/** Klucz porównawczy pól wpisywanych przez użytkownika (bez pól wyliczanych automatycznie przez formularz). */
export function actionDraftKey(content: ActionDraftContent): string {
  const v = content.values;
  return JSON.stringify([
    v.title, v.actionType, v.date, v.facilityName, v.municipality, v.programId, v.campaignId,
    v.numberOfActions, v.indirectRecipientsCount, v.jrwaSign, v.izrzSign, v.ezdStatus,
    content.audienceGroups.map((g) => [g.name, g.items.map((i) => [i.name, i.count, i.ageFrom, i.ageTo])]),
    content.materialItems.map((m) => [m.materialId, m.quantity]),
    content.activitiesDescription,
    content.additionalNotes,
  ]);
}

function isActionDraft(value: unknown): value is ActionDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<ActionDraft>;
  return (
    typeof draft.savedAt === "string" &&
    Boolean(draft.values) && typeof draft.values === "object" &&
    Array.isArray(draft.audienceGroups) &&
    Array.isArray(draft.materialItems) &&
    typeof draft.activitiesDescription === "string" &&
    typeof draft.additionalNotes === "string" &&
    typeof draft.selectedJrwaSymbol === "string"
  );
}

export function loadActionDraft(): ActionDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isActionDraft(parsed) && hasActionDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActionDraft(draft: ActionDraft): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* brak dostępu do pamięci przeglądarki */ }
}

export function clearActionDraft(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* brak dostępu do pamięci przeglądarki */ }
}
