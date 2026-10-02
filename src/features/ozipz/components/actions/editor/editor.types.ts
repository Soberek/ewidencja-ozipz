import type {
  OzipzAction,
  OzipzProgram,
  OzipzMaterial,
  OzipzFacility,
  OzipzDictionaryItem,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzStaff,
  OzipzTemplate,
  OzipzHealthTopic,
} from "../../../types/ozipz.types";
import { ActionSchema } from "../../../schemas/ozipz.schemas";
import { z } from "zod";

export const ActionFormSchema = ActionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ActionFormInput = z.input<typeof ActionFormSchema>;
export type ActionFormOutput = z.output<typeof ActionFormSchema>;

// Typ pojedynczego elementu odbiorcy wewnątrz grupy z opcjonalnym wiekiem i liczbą
export interface RecipientSubItem {
  id: string;
  name: string;
  count: number;
  ageFrom?: number | null;
  ageTo?: number | null;
}

// Grupa odbiorców (np. Grupa 1 / Klasa 7A, Grupa 2 / Klasa 7B)
export interface AudienceGroupBlock {
  id: string;
  name: string;
  items: RecipientSubItem[];
}

/** Osobne działanie „Dystrybucja” zapisywane razem z działaniem głównym (np. materiały wydane na prelekcji). */
export type LinkedDistributionPayload = Omit<OzipzAction, "id" | "createdAt" | "updatedAt" | "linkedActionId">;

export interface ActionDistributedMaterialItem {
  id?: string;
  materialId: string;
  quantity: number;
  customTitle?: string;
}

export interface ActionEditorDraft extends Partial<OzipzAction> {
  sourceActionId?: string;
  materialItems?: ActionDistributedMaterialItem[];
}

export interface ActionCardPreset {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  actionType: string;
  titlePrefix?: string;
  topic?: OzipzHealthTopic;
  jrwaSymbol: string;
  facilityType?: string;
  audienceGroups: AudienceGroupBlock[];
  materialsDistributedCount?: number;
  materialItems?: ActionDistributedMaterialItem[];
  programKeyword?: string;
  campaignKeyword?: string;
  notesTemplate?: string;
  activitiesTemplate?: string;
}

export interface ActionEditorSectionProps {
  editingAction?: Partial<OzipzAction> | null;
  actions?: OzipzAction[];
  programs?: OzipzProgram[];
  materials?: OzipzMaterial[];
  facilities?: OzipzFacility[];
  scheduleEvents?: OzipzScheduleEvent[];
  jrwaCases?: OzipzJrwaCase[];
  dictionaryItems?: OzipzDictionaryItem[];
  distributions?: import("../../../types/ozipz.types").OzipzDistribution[];
  staff?: OzipzStaff[];
  templates?: OzipzTemplate[];
  municipalities?: string[];
  isReadOnly?: boolean;
  closedReason?: string;
  /** Autozapis szkicu nowego działania w przeglądarce (formularz otwarty bez danych startowych). */
  enableDraft?: boolean;
  onSave?: (
    data: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">,
    autoCreateJrwa?: { section: string; jrwaSymbol: string; caseNumber: number; year: number; fullCaseSign: string },
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => void | Promise<void>;
  onUpdate?: (
    id: string,
    data: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => void | Promise<void>;
  onCancel?: () => void;
  /** Szybkie dodanie miejsca do bazy placówek z formularza działania; bez tej funkcji przycisk jest ukryty. */
  onAddFacility?: (data: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">) => Promise<OzipzFacility>;
}
