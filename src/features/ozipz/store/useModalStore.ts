import { create } from "zustand";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzDictionaryItem,
  OzipzScheduleEvent,
  OzipzRegisterItem,
  OzipzFacility,
  OzipzContact,
  OzipzMaterial,
  OzipzDistribution,
  OzipzJrwaCase,
  OzipzLetter,
  OzipzPublication,
  OzipzStaff,
  OzipzTemplate,
} from "../types/ozipz.types";

export type ModalType =
  | "action"
  | "participation"
  | "dictionary"
  | "schedule"
  | "register"
  | "facility"
  | "contact"
  | "material"
  | "distribution"
  | "jrwa"
  | "letter"
  | "scan"
  | "publication"
  | "program"
  | "staff"
  | "template";

export interface ModalPayloadMap {
  action: { item?: Partial<OzipzAction> | null; isReadOnly?: boolean };
  participation: { item?: OzipzSchoolParticipation | null; programId?: string; facilityId?: string };
  dictionary: { item?: OzipzDictionaryItem | null; category?: string; initialValues?: Partial<OzipzDictionaryItem> };
  schedule: { item?: OzipzScheduleEvent | null };
  register: { item?: OzipzRegisterItem | null; defaultType?: string };
  facility: { item?: OzipzFacility | null };
  contact: { item?: OzipzContact | null };
  material: { item?: OzipzMaterial | null };
  distribution: { item?: OzipzDistribution | null; initialMaterialId?: string };
  jrwa: { item?: OzipzJrwaCase | null };
  letter: { item?: OzipzLetter | null; initialValues?: Partial<OzipzLetter> };
  scan: Record<string, never>;
  publication: { item?: OzipzPublication | null };
  program: { item?: OzipzProgram | null };
  staff: { item?: OzipzStaff | null };
  template: { item?: OzipzTemplate | null };
}

export type ModalPayload<T extends ModalType> = ModalPayloadMap[T];

export interface ModalState {
  activeModal: ModalType | null;
  payload: Partial<ModalPayloadMap[ModalType]>;
  openModal: <T extends ModalType>(type: T, payload?: ModalPayloadMap[T]) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  payload: {},
  openModal: (type, payload = {}) => set({ activeModal: type, payload }),
  closeModal: () => set({ activeModal: null, payload: {} }),
}));
