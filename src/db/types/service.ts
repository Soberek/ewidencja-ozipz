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
} from "../../features/ozipz/types/ozipz.types";
import type { OzipzYearlyMonthlyTargets } from "../../features/ozipz/utils/monthlyTargetsUtils";

/** Osobne działanie „Dystrybucja” zapisywane razem z działaniem głównym i powiązane z nim przez `linkedActionId`. */
export type CompanionDistributionPayload = Omit<OzipzAction, "id" | "createdAt" | "updatedAt" | "linkedActionId">;

export interface SaveActionWithRelationsParams {
  action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;
  autoCreateJrwa?: { section: string; jrwaSymbol: string; caseNumber: number; year: number; fullCaseSign: string };
  distributionMaterial?: { materialId: string; title: string; type?: string; quantity: number };
  distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>;
  /**
   * Osobne działanie „Dystrybucja” zapisywane razem z `action` (np. materiały wydane na prelekcji).
   * Dostaje `linkedActionId` głównego działania, a pozycje `distributionMaterials` trafiają do niego zamiast do `action`.
   */
  companionDistribution?: CompanionDistributionPayload;
}

export interface SaveActionWithRelationsResult {
  action: OzipzAction;
  jrwaCase?: OzipzJrwaCase;
  distribution?: OzipzDistribution;
  distributions?: OzipzDistribution[];
  companionAction?: OzipzAction;
}

export interface IOzipzDatabaseService {
  getClosedMonths(): Promise<string[]>;
  setMonthClosed(monthKey: string, closed: boolean): Promise<void>;
  getActions(): Promise<OzipzAction[]>;
  addAction(action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">): Promise<OzipzAction>;
  updateAction(id: string, updates: Partial<OzipzAction>): Promise<void>;
  deleteAction(id: string): Promise<void>;
  saveActionWithRelations(params: SaveActionWithRelationsParams): Promise<SaveActionWithRelationsResult>;
  updateActionWithRelations(
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ): Promise<void>;

  getPrograms(): Promise<OzipzProgram[]>;
  addProgram(program: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram>;
  updateProgram(id: string, updates: Partial<OzipzProgram>): Promise<void>;
  deleteProgram(id: string): Promise<void>;

  getParticipations(): Promise<OzipzSchoolParticipation[]>;
  addParticipation(part: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">): Promise<OzipzSchoolParticipation>;
  updateParticipation(id: string, updates: Partial<OzipzSchoolParticipation>): Promise<void>;
  deleteParticipation(id: string): Promise<void>;

  getMaterials(): Promise<OzipzMaterial[]>;
  addMaterial(mat: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">): Promise<OzipzMaterial>;
  updateMaterial(id: string, updates: Partial<OzipzMaterial>): Promise<void>;
  deleteMaterial(id: string): Promise<void>;

  getDistributions(): Promise<OzipzDistribution[]>;
  addDistribution(dist: Omit<OzipzDistribution, "id" | "createdAt">): Promise<OzipzDistribution>;
  updateDistribution(id: string, updates: Partial<OzipzDistribution>): Promise<void>;
  deleteDistribution(id: string): Promise<void>;

  getScheduleEvents(): Promise<OzipzScheduleEvent[]>;
  addScheduleEvent(event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent>;
  updateScheduleEvent(id: string, updates: Partial<OzipzScheduleEvent>): Promise<void>;
  deleteScheduleEvent(id: string): Promise<void>;

  getJrwaCases(): Promise<OzipzJrwaCase[]>;
  addJrwaCase(c: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">): Promise<OzipzJrwaCase>;
  updateJrwaCase(id: string, updates: Partial<OzipzJrwaCase>): Promise<void>;
  deleteJrwaCase(id: string): Promise<void>;

  getPublications(): Promise<OzipzPublication[]>;
  addPublication(pub: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">): Promise<OzipzPublication>;
  updatePublication(id: string, updates: Partial<OzipzPublication>): Promise<void>;
  deletePublication(id: string): Promise<void>;

  getFacilities(): Promise<OzipzFacility[]>;
  addFacility(fac: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">): Promise<OzipzFacility>;
  updateFacility(id: string, updates: Partial<OzipzFacility>): Promise<void>;
  deleteFacility(id: string): Promise<void>;
  batchUpsertFacilities(facilities: OzipzFacility[]): Promise<OzipzFacility[]>;

  getDictionaryItems(): Promise<OzipzDictionaryItem[]>;
  addDictionaryItem(item: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzDictionaryItem>;
  updateDictionaryItem(id: string, updates: Partial<OzipzDictionaryItem>): Promise<void>;
  deleteDictionaryItem(id: string): Promise<void>;

  getLetters(): Promise<OzipzLetter[]>;
  addLetter(letter: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">): Promise<OzipzLetter>;
  updateLetter(id: string, updates: Partial<OzipzLetter>): Promise<void>;
  deleteLetter(id: string): Promise<void>;

  getScans(): Promise<OzipzScan[]>;
  addScan(scan: Omit<OzipzScan, "id" | "createdAt">): Promise<OzipzScan>;
  deleteScan(id: string): Promise<void>;

  getTemplates(): Promise<OzipzTemplate[]>;
  addTemplate(tpl: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">): Promise<OzipzTemplate>;
  updateTemplate(id: string, updates: Partial<OzipzTemplate>): Promise<void>;
  deleteTemplate(id: string): Promise<void>;

  getStaff(): Promise<OzipzStaff[]>;
  addStaff(staff: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff>;
  updateStaff(id: string, updates: Partial<OzipzStaff>): Promise<void>;
  deleteStaff(id: string): Promise<void>;

  getContacts(): Promise<OzipzContact[]>;
  addContact(contact: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact>;
  updateContact(id: string, updates: Partial<OzipzContact>): Promise<void>;
  deleteContact(id: string): Promise<void>;

  getRegisters(): Promise<OzipzRegisterItem[]>;
  addRegister(reg: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem>;
  updateRegister(id: string, updates: Partial<OzipzRegisterItem>): Promise<void>;
  deleteRegister(id: string): Promise<void>;

  getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]>;
  saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]>;

  getFacilityActivitySummary(facilityId: string): Promise<FacilityActivitySummary>;
  clearAndReseedDefaults(): Promise<void>;
}
