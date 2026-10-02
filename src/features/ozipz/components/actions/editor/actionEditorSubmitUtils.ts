import type {
  OzipzAction,
  OzipzDictionaryItem,
  OzipzMaterial,
  OzipzFacility,
  OzipzDistribution,
} from "../../../types/ozipz.types";
import type {
  ActionFormOutput,
  ActionDistributedMaterialItem,
  ActionEditorDraft,
} from "./editor.types";
import { PUBLICATION_DEFAULTS } from "../../../constants";
import { municipalityName } from "../../../utils/facilityUtils";
import { extractCleanJrwaSymbol } from "../../../utils/calculators/jrwaClassification";

/**
 * Status EZD nowego działania, gdy użytkownik go nie zmienił: "do EZD" (wymaga wpisu).
 * Nigdy "w EZD" — działanie nie może wyglądać na zarejestrowane, zanim ktoś to potwierdzi.
 */
export const DEFAULT_EZD_STATUS = "do_ezd";

export interface BuildActionPayloadParams {
  data: ActionFormOutput;
  campaignDict: OzipzDictionaryItem[];
  activitiesDescription: string;
  additionalNotes: string;
  isPublication: boolean;
  isNoJrwa: boolean;
  formattedAudienceString: string;
  totalDirectParticipants: number;
  /** Symbol JRWA wybrany jako klasyfikacja (np. "966.7") — dla publikacji i dystrybucji zapisywany zamiast znaku sprawy. */
  classificationSymbol?: string;
}

export function combineActionNotes(description: string, notes: string): string {
  return [description.trim(), notes.trim() ? `Uwagi: ${notes.trim()}` : ""].filter(Boolean).join("\n\n");
}

/**
 * Pozycja słownika kampanii dla wartości z formularza. Starsze działania i szablony trzymają
 * etykietę, harmonogram – id pozycji; nowe zapisy – kod słownika.
 */
export function findCampaign(campaignDict: OzipzDictionaryItem[], value: string | undefined): OzipzDictionaryItem | undefined {
  const v = (value || "").trim();
  if (!v) return undefined;
  return campaignDict.find((c) => c.code === v) || campaignDict.find((c) => c.id === v || c.label === v);
}

export function buildActionCleanPayload(
  params: BuildActionPayloadParams
): Omit<OzipzAction, "id" | "createdAt" | "updatedAt"> {
  const {
    data, campaignDict, activitiesDescription, additionalNotes,
    isPublication, isNoJrwa, formattedAudienceString, totalDirectParticipants, classificationSymbol,
  } = params;

  const campaign = findCampaign(campaignDict, data.campaignId);
  const combinedNotes = combineActionNotes(activitiesDescription, additionalNotes);

  return {
    title: data.title.trim(),
    actionType: data.actionType,
    date: data.date,
    facilityId: isPublication ? undefined : (data.facilityId || undefined),
    facilityName: data.facilityName?.trim() || (isPublication ? PUBLICATION_DEFAULTS.facilityName : ""),
    municipality: municipalityName(data.municipality),
    programId: data.programId || undefined,
    programName: data.programName || undefined,
    campaignId: campaign?.code || data.campaignId || undefined,
    campaignName: campaign ? campaign.label : undefined,
    topic: data.topic || "",
    audienceGroup: isPublication ? PUBLICATION_DEFAULTS.audienceGroup : formattedAudienceString,
    // Publikacje/dystrybucje nie mają sprawy w kancelarii, ale zachowują symbol JRWA jako klasyfikację do sprawozdań.
    jrwaSign: isNoJrwa ? (classificationSymbol?.trim() || undefined) : (data.jrwaSign?.trim() || undefined),
    jrwaCaseId: isNoJrwa ? undefined : (data.jrwaCaseId || undefined),
    scheduleEventId: data.scheduleEventId || undefined,
    izrzSign: isNoJrwa ? undefined : (data.izrzSign?.trim() || undefined),
    ezdStatus: isNoJrwa ? "nie_dotyczy" : (data.ezdStatus || DEFAULT_EZD_STATUS),
    status: data.status || "wykonane",
    sourceInfo: data.sourceInfo?.trim() || undefined,
    materialId: data.materialId || undefined,
    participantsCount: isPublication ? 0 : (Number(totalDirectParticipants) || 0),
    materialsDistributedCount: Number(data.materialsDistributedCount) || 0,
    numberOfActions: data.numberOfActions ? Math.max(1, Number(data.numberOfActions)) : 1,
    leadEducator: data.leadEducator.trim(),
    notes: combinedNotes || undefined,
  };
}

export function buildActionDistributionMaterials(
  materialItems: ActionDistributedMaterialItem[],
  materials: OzipzMaterial[],
  cleanPayload: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">
): Array<{
  materialId: string;
  title: string;
  type?: string;
  quantity: number;
}> {
  const distributionMaterials = materialItems
    .filter((m) => m.materialId && m.quantity > 0)
    .map((m) => {
      const mat = materials.find((item) => item.id === m.materialId);
      const customTitle = m.customTitle;
      return {
        materialId: m.materialId,
        title: mat?.title || customTitle || "Materiał oświatowy",
        type: mat?.materialType,
        quantity: m.quantity,
      };
    });

  if (
    distributionMaterials.length === 0 &&
    cleanPayload.materialsDistributedCount &&
    cleanPayload.materialsDistributedCount > 0 &&
    cleanPayload.materialId
  ) {
    const mat = materials.find((item) => item.id === cleanPayload.materialId);
    distributionMaterials.push({
      materialId: cleanPayload.materialId,
      title: mat?.title || "Materiał oświatowy",
      type: mat?.materialType,
      quantity: cleanPayload.materialsDistributedCount,
    });
  }

  return distributionMaterials;
}

export function resolveActionInitialMaterials(
  editingAction: ActionEditorDraft,
  distributions: OzipzDistribution[]
): ActionDistributedMaterialItem[] {
  const sourceId = editingAction.id || editingAction.sourceActionId;
  const actionDists = sourceId ? distributions.filter((d) => d.actionId === sourceId) : [];
  if (editingAction.materialItems && editingAction.materialItems.length > 0) {
    return editingAction.materialItems;
  }
  if (actionDists.length > 0) {
    return actionDists.map((d) => ({ id: d.id, materialId: d.materialId || "", quantity: d.quantity }));
  }
  // Starsze wpisy mogą mieć samą liczbę materiałów bez wskazania materiału — wtedy zostaje sama liczba (MAT),
  // bo pusta pozycja materiału blokowałaby zapis edycji.
  if (editingAction.materialId) {
    return [{ materialId: editingAction.materialId, quantity: editingAction.materialsDistributedCount || 1 }];
  }
  return [];
}

type ActionPayload = Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;

/** Wymagane pola, których jeszcze brakuje (podpowiedź w stopce przed zapisem; walidację i tak wykonuje schemat). */
export function getMissingActionFields(
  values: Partial<ActionFormOutput>,
  { isPublication, hasNamedAudience }: { isPublication: boolean; hasNamedAudience: boolean }
): string[] {
  const missing: string[] = [];
  if (!values.actionType) missing.push("forma działania");
  if ((values.title || "").trim().length < 2) missing.push("tytuł");
  if (!values.date) missing.push("data");
  if (!(values.facilityName || "").trim()) missing.push("miejsce");
  if (!values.municipality) missing.push("gmina");
  if (!(values.leadEducator || "").trim()) missing.push("osoba prowadząca");
  if (!isPublication && !hasNamedAudience) missing.push("odbiorcy");
  return missing;
}

/**
 * Inny program (lub inna klasyfikacja JRWA) to już inne działanie. Gdy klasyfikacji jednego z wpisów
 * nie da się ustalić (np. brak znaku sprawy), nie rozstrzyga ona o różnicy.
 */
function differentClassification(a: Partial<OzipzAction>, b: Partial<OzipzAction>): boolean {
  const programA = a.programId?.trim();
  const programB = b.programId?.trim();
  if (programA && programB) return programA !== programB;
  const symbolA = extractCleanJrwaSymbol(a);
  const symbolB = extractCleanJrwaSymbol(b);
  return Boolean(symbolA && symbolB && symbolA !== symbolB);
}

/**
 * Szuka w rejestrze działania o tej samej dacie, tytule, miejscu, formie, programie (lub klasyfikacji) i kampanii
 * – typowy skutek podwójnego zapisu lub kopii.
 */
export function findDuplicateAction(payload: ActionPayload, actions: OzipzAction[]): OzipzAction | undefined {
  const norm = (value?: string | null) => (value || "").trim().toLowerCase();
  return actions.find((a) =>
    a.date === payload.date &&
    norm(a.title) === norm(payload.title) &&
    norm(a.facilityName) === norm(payload.facilityName) &&
    norm(a.actionType) === norm(payload.actionType) &&
    norm(a.campaignId) === norm(payload.campaignId) &&
    !differentClassification(a, payload)
  );
}

/** Wyciąga czytelną przyczynę błędu zapisu (np. komunikat triggera SQLite "Miesiąc jest zamknięty."). */
export function describeSaveError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return raw.replace(/^.*?\(code:\s*\d+\)\s*/i, "").trim();
}

export function matchFacilityInfo(
  val: string,
  facilities: OzipzFacility[]
): { id: string; municipality?: string; address: string } | null {
  if (!val || typeof val !== "string" || !Array.isArray(facilities)) return null;
  const cleanVal = val.trim().toLowerCase();
  if (!cleanVal) return null;

  const matched = facilities.find(
    (f) =>
      Boolean(f.name) &&
      (f.name.trim().toLowerCase() === cleanVal ||
        `${f.name} (${f.city || f.municipality})`.trim().toLowerCase() === cleanVal)
  );
  if (!matched) return null;
  return {
    id: matched.id,
    municipality: matched.municipality,
    address: matched.address ? `${matched.address}, ${matched.city || matched.municipality}` : matched.city || "",
  };
}
