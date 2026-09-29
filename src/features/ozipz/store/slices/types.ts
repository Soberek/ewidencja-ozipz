import type { StateCreator } from "zustand";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzMaterial,
  OzipzDistribution,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzPublication,
  OzipzFacility,
  OzipzDictionaryItem,
  OzipzLetter,
  OzipzScan,
  OzipzTemplate,
  OzipzStaff,
  OzipzContact,
  OzipzRegisterItem,
  FacilityActivitySummary,
  OzipzMonthlyTarget,
} from "../../types/ozipz.types";
import type {
  CompanionDistributionPayload,
  SaveActionWithRelationsParams,
  SaveActionWithRelationsResult,
} from "../../../../db/types";
import type { OzipzYearlyMonthlyTargets } from "../../utils/monthlyTargetsUtils";

export interface ActionsSlice {
  actions: OzipzAction[];
  addAction: (action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">) => Promise<OzipzAction>;
  updateAction: (id: string, updates: Partial<OzipzAction>) => Promise<void>;
  updateActionWithRelations: (
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  saveActionWithRelations: (params: SaveActionWithRelationsParams) => Promise<SaveActionWithRelationsResult>;
}

export interface ProgramsSlice {
  programs: OzipzProgram[];
  participations: OzipzSchoolParticipation[];
  addProgram: (program: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">) => Promise<OzipzProgram>;
  updateProgram: (id: string, updates: Partial<OzipzProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  addParticipation: (part: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">) => Promise<OzipzSchoolParticipation>;
  updateParticipation: (id: string, updates: Partial<OzipzSchoolParticipation>) => Promise<void>;
  deleteParticipation: (id: string) => Promise<void>;
}

export interface FacilitiesSlice {
  facilities: OzipzFacility[];
  addFacility: (fac: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">) => Promise<OzipzFacility>;
  updateFacility: (id: string, updates: Partial<OzipzFacility>) => Promise<void>;
  deleteFacility: (id: string) => Promise<void>;
  batchUpsertFacilities: (facs: OzipzFacility[]) => Promise<OzipzFacility[]>;
  getFacilityActivitySummary: (facilityId: string) => Promise<FacilityActivitySummary>;
}

export interface ScheduleSlice {
  scheduleEvents: OzipzScheduleEvent[];
  addScheduleEvent: (event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">) => Promise<OzipzScheduleEvent>;
  updateScheduleEvent: (id: string, updates: Partial<OzipzScheduleEvent>) => Promise<void>;
  deleteScheduleEvent: (id: string) => Promise<void>;
  toggleScheduleStatus: (id: string, currentStatus: string) => Promise<void>;
}

export interface MaterialsSlice {
  materials: OzipzMaterial[];
  distributions: OzipzDistribution[];
  addMaterial: (material: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">) => Promise<OzipzMaterial>;
  updateMaterial: (id: string, updates: Partial<OzipzMaterial>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addDistribution: (dist: Omit<OzipzDistribution, "id" | "createdAt">) => Promise<OzipzDistribution>;
  updateDistribution: (id: string, updates: Partial<OzipzDistribution>) => Promise<void>;
  deleteDistribution: (id: string) => Promise<void>;
}

export interface JrwaSlice {
  jrwaCases: OzipzJrwaCase[];
  addJrwaCase: (c: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">) => Promise<OzipzJrwaCase>;
  updateJrwaCase: (id: string, updates: Partial<OzipzJrwaCase>) => Promise<void>;
  deleteJrwaCase: (id: string) => Promise<void>;
}

export interface DictionariesSlice {
  dictionaryItems: OzipzDictionaryItem[];
  addDictionaryItem: (item: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">) => Promise<OzipzDictionaryItem>;
  updateDictionaryItem: (id: string, updates: Partial<OzipzDictionaryItem>) => Promise<void>;
  deleteDictionaryItem: (id: string) => Promise<void>;
  saveRegisterMappings: (mappings: Array<{ activityType: string; registers: ("informacje" | "publikacje" | "wizytacje")[] }>) => Promise<void>;
}

export interface LettersSlice {
  letters: OzipzLetter[];
  addLetter: (letter: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">) => Promise<OzipzLetter>;
  updateLetter: (id: string, updates: Partial<OzipzLetter>) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
}

export interface ScansSlice {
  scans: OzipzScan[];
  addScan: (scan: Omit<OzipzScan, "id" | "createdAt">) => Promise<OzipzScan>;
  deleteScan: (id: string) => Promise<void>;
}

export interface StaffSlice {
  staff: OzipzStaff[];
  addStaff: (staff: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">) => Promise<OzipzStaff>;
  updateStaff: (id: string, updates: Partial<OzipzStaff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

export interface ContactsSlice {
  contacts: OzipzContact[];
  addContact: (contact: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">) => Promise<OzipzContact>;
  updateContact: (id: string, updates: Partial<OzipzContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export interface RegistersSlice {
  registers: OzipzRegisterItem[];
  addRegister: (reg: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">) => Promise<OzipzRegisterItem>;
  updateRegister: (id: string, updates: Partial<OzipzRegisterItem>) => Promise<void>;
  deleteRegister: (id: string) => Promise<void>;
}

export interface TemplatesSlice {
  templates: OzipzTemplate[];
  addTemplate: (tpl: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">) => Promise<OzipzTemplate>;
  updateTemplate: (id: string, updates: Partial<OzipzTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export interface PublicationsSlice {
  publications: OzipzPublication[];
  addPublication: (pub: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">) => Promise<OzipzPublication>;
  updatePublication: (id: string, updates: Partial<OzipzPublication>) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;
}

export interface CoreSlice {
  monthlyTargets: OzipzMonthlyTarget[];
  closedMonths: string[];
  isLoading: boolean;
  isInitialized: boolean;
  loadError: string | null;
  loadAll: () => Promise<void>;
  refreshClosedMonths: () => Promise<void>;
  setMonthClosed: (monthKey: string, closed: boolean) => Promise<void>;
  saveMonthlyTargets: (year: number, targets: OzipzYearlyMonthlyTargets) => Promise<OzipzMonthlyTarget[]>;
}

export type OzipzDbState = ActionsSlice &
  ProgramsSlice &
  FacilitiesSlice &
  ScheduleSlice &
  MaterialsSlice &
  JrwaSlice &
  DictionariesSlice &
  LettersSlice &
  ScansSlice &
  StaffSlice &
  ContactsSlice &
  RegistersSlice &
  TemplatesSlice &
  PublicationsSlice &
  CoreSlice;

export type SliceCreator<T> = StateCreator<OzipzDbState, [], [], T>;
