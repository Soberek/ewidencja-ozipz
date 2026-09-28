import type { OzipzAction, OzipzDictionaryItem, OzipzStaff, OzipzDistribution } from "../../../types/ozipz.types";
import type { ActionFormInput, ActionDistributedMaterialItem } from "./editor.types";

export function localActionDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Osoba prowadząca podpowiadana w nowym działaniu tylko wtedy, gdy w kadrze jest dokładnie jedna aktywna osoba.
 * Przy kilku osobach wybór należy do użytkownika (zasada "Zero Default Values").
 */
export function getSoleActiveStaffName(staff: OzipzStaff[] = []): string {
  const active = staff.filter((person) => person.active !== false && person.fullName?.trim());
  return active.length === 1 ? active[0].fullName.trim() : "";
}

export function getDefaultActionFormValues(
  _activityTypeDict: OzipzDictionaryItem[] = [],
  staff: OzipzStaff[] = []
): ActionFormInput {
  return {
    title: "",
    actionType: "",
    date: localActionDate(),
    facilityId: "",
    facilityName: "",
    municipality: "",
    programId: "",
    programName: "",
    scheduleEventId: "",
    campaignId: "",
    campaignName: "",
    topic: "",
    audienceGroup: "",
    participantsCount: 0,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 0,
    numberOfActions: 1,
    materialId: "",
    leadEducator: getSoleActiveStaffName(staff),
    status: "",
    ezdStatus: "",
    izrzSign: "",
    sourceInfo: "",
    notes: "",
    jrwaSign: "",
    jrwaCaseId: "",
  };
}

export function mapActionToFormValues(
  action: Partial<OzipzAction>,
  _staff: OzipzStaff[] = []
): ActionFormInput {
  return {
    title: action.title || "",
    actionType: action.actionType || "",
    date: action.date || localActionDate(),
    facilityId: action.facilityId || "",
    facilityName: action.facilityName || "",
    municipality: action.municipality || "",
    programId: action.programId || "",
    programName: action.programName || "",
    scheduleEventId: action.scheduleEventId || "",
    campaignId: action.campaignId || "",
    campaignName: action.campaignName || "",
    topic: action.topic || "",
    audienceGroup: action.audienceGroup || "",
    participantsCount: Number(action.participantsCount) || 0,
    indirectRecipientsCount: Number(action.indirectRecipientsCount) || 0,
    materialsDistributedCount: Number(action.materialsDistributedCount) || 0,
    numberOfActions: action.numberOfActions != null ? Math.max(1, Number(action.numberOfActions)) : 1,
    materialId: action.materialId || "",
    leadEducator: action.leadEducator || "",
    status: action.status || "",
    ezdStatus: action.ezdStatus || "",
    izrzSign: action.izrzSign || "",
    sourceInfo: action.sourceInfo || "",
    notes: action.notes || "",
    jrwaSign: action.jrwaSign || "",
    jrwaCaseId: action.jrwaCaseId || "",
  };
}

export function isPublicationActionType(actionType?: string | null): boolean {
  if (!actionType) return false;
  const lower = actionType.trim().toLowerCase();
  return (
    lower.includes("publikacja") ||
    lower.includes("portal x") ||
    lower.includes("facebook") ||
    lower.includes("twitter") ||
    lower.includes("strona") ||
    lower.includes("gov.pl") ||
    lower.startsWith("publikacja_") ||
    lower.includes("artykuł / post") ||
    lower.includes("social medi")
  );
}

export function isDistributionActionType(actionType?: string | null): boolean {
  if (!actionType) return false;
  const lower = actionType.trim().toLowerCase();
  return lower.includes("dystrybucja");
}

export function isNoJrwaActionType(actionType?: string | null): boolean {
  return isPublicationActionType(actionType) || isDistributionActionType(actionType);
}

export const ACTION_TYPE_CODE_TO_LABEL: Record<string, string> = {
  prelekcja: "Prelekcja (warsztat)",
  dystrybucja: "Dystrybucja",
  sprawozdanie: "Sprawozdanie (z programu, miernik, tytoń)",
  publikacja_x: "Publikacja media (Portal X)",
  publikacja_fb: "Publikacja media (Facebook)",
  publikacja_strona: "Publikacja media (Strona)",
  stoisko: "Stoisko edukacyjno-informacyjne",
  wyklad: "Wykład",
  narada: "Narada",
  konkurs: "Konkurs (quiz)",
  pismo: "Pismo (list intencyjny)",
  wizytacja: "Wizytacja",
  happening: "Happening (przemarsz, gra, event)",
  rozmowa_indywidualna: "Rozmowa indywidualna (instruktaż)",
  kontrola: "Kontrola",
  szkolenie: "Szkolenie",
  konferencja: "Konferencja",
  wywiad_media: "Wywiad do mediów",
};

export function normalizeActionType(val?: string | null): string {
  if (!val) return "Działanie edukacyjne";
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (ACTION_TYPE_CODE_TO_LABEL[lower]) {
    return ACTION_TYPE_CODE_TO_LABEL[lower];
  }
  return trimmed;
}

/**
 * Tworzy bezpieczną kopię roboczą działania (szablon nowego działania) na podstawie istniejącej encji:
 * zachowuje dane merytoryczne (tytuł, forma, placówka, gmina, program, odbiorcy, materiały, uwagi, edukator),
 * ale usuwa unikalne identyfikatory, sprawę JRWA, sygnatury EZD/IZRZ i status EZD, aby utworzyć nowy,
 * niezależny rekord w bazie (kopia nie może wyglądać na już zarejestrowaną w EZD).
 */
export function duplicateActionDraft(
  source: Partial<OzipzAction> & { materialItems?: ActionDistributedMaterialItem[] },
  distributions: OzipzDistribution[] = []
): Omit<OzipzAction, "id" | "createdAt" | "updatedAt"> & { materialItems?: ActionDistributedMaterialItem[] } {
  let materialItems: ActionDistributedMaterialItem[] | undefined = undefined;

  if (source.materialItems && source.materialItems.length > 0) {
    materialItems = source.materialItems.map((m) => ({ ...m }));
  } else if (source.id && distributions.length > 0) {
    const matched = distributions.filter((d) => d.actionId === source.id);
    if (matched.length > 0) {
      materialItems = matched.map((d) => ({
        materialId: d.materialId || "",
        quantity: d.quantity,
      }));
    }
  }

  return {
    title: source.title || "",
    actionType: source.actionType || "",
    date: source.date || localActionDate(),
    facilityId: source.facilityId,
    facilityName: source.facilityName || "",
    municipality: source.municipality || "",
    programId: source.programId,
    programName: source.programName,
    campaignId: source.campaignId,
    campaignName: source.campaignName,
    topic: source.topic || "",
    audienceGroup: source.audienceGroup || "",
    participantsCount: Number(source.participantsCount) || 0,
    indirectRecipientsCount: Number(source.indirectRecipientsCount) || 0,
    materialsDistributedCount: Number(source.materialsDistributedCount) || 0,
    materialId: source.materialId,
    materialItems,
    numberOfActions: source.numberOfActions || 1,
    leadEducator: source.leadEducator || "",
    notes: source.notes,
    status: source.status || "wykonane",
    ezdStatus: isNoJrwaActionType(source.actionType) ? "nie_dotyczy" : "",
    // Pola unikalne dla pojedynczego wpisu celowo pomijamy (będą wygenerowane na nowo przy zapisie):
    jrwaCaseId: undefined,
    jrwaSign: undefined,
    izrzSign: undefined,
    sourceInfo: undefined,
    scheduleEventId: undefined,
  };
}
