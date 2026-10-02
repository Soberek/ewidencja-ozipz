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
import type { CompanionDistributionPayload, RegisterMappingSave, SaveActionWithRelationsParams, SaveActionWithRelationsResult } from "../types";
import type { OzipzYearlyMonthlyTargets } from "../../features/ozipz/utils/monthlyTargetsUtils";
import type { MetricPlanState } from "../../features/ozipz/components/reports/components/reportConstants";
import type { RozdzielnikTemplate } from "../../features/ozipz/utils/rozdzielnikTemplates";

export interface IActionsRepository {
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
}

export interface IProgramsRepository {
  getPrograms(): Promise<OzipzProgram[]>;
  addProgram(program: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram>;
  updateProgram(id: string, updates: Partial<OzipzProgram>): Promise<void>;
  deleteProgram(id: string): Promise<void>;
  getParticipations(): Promise<OzipzSchoolParticipation[]>;
  addParticipation(part: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">): Promise<OzipzSchoolParticipation>;
  updateParticipation(id: string, updates: Partial<OzipzSchoolParticipation>): Promise<void>;
  deleteParticipation(id: string): Promise<void>;
}

export interface IMaterialsRepository {
  getMaterials(): Promise<OzipzMaterial[]>;
  addMaterial(mat: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">): Promise<OzipzMaterial>;
  updateMaterial(id: string, updates: Partial<OzipzMaterial>): Promise<void>;
  deleteMaterial(id: string): Promise<void>;
  getDistributions(): Promise<OzipzDistribution[]>;
  addDistribution(dist: Omit<OzipzDistribution, "id" | "createdAt">): Promise<OzipzDistribution>;
  updateDistribution(id: string, updates: Partial<OzipzDistribution>): Promise<void>;
  deleteDistribution(id: string): Promise<void>;
}

export interface IScheduleRepository {
  getScheduleEvents(): Promise<OzipzScheduleEvent[]>;
  addScheduleEvent(event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent>;
  updateScheduleEvent(id: string, updates: Partial<OzipzScheduleEvent>): Promise<void>;
  deleteScheduleEvent(id: string): Promise<void>;
  toggleScheduleStatus?(id: string, currentStatus: string): Promise<void>;
}

export interface IJrwaRepository {
  getJrwaCases(): Promise<OzipzJrwaCase[]>;
  addJrwaCase(c: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">): Promise<OzipzJrwaCase>;
  updateJrwaCase(id: string, updates: Partial<OzipzJrwaCase>): Promise<void>;
  deleteJrwaCase(id: string): Promise<void>;
}

export interface IFacilitiesRepository {
  getFacilities(): Promise<OzipzFacility[]>;
  addFacility(fac: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">): Promise<OzipzFacility>;
  updateFacility(id: string, updates: Partial<OzipzFacility>): Promise<void>;
  deleteFacility(id: string): Promise<void>;
  batchUpsertFacilities(facilities: OzipzFacility[]): Promise<OzipzFacility[]>;
  getFacilityActivitySummary(facilityId: string): Promise<FacilityActivitySummary>;
}

export interface IDictionariesRepository {
  getDictionaryItems(): Promise<OzipzDictionaryItem[]>;
  addDictionaryItem(item: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzDictionaryItem>;
  updateDictionaryItem(id: string, updates: Partial<OzipzDictionaryItem>): Promise<void>;
  deleteDictionaryItem(id: string): Promise<void>;
  saveRegisterMappings(mappings: RegisterMappingSave[]): Promise<OzipzDictionaryItem[]>;
}

export interface IStaffContactsRepository {
  getStaff(): Promise<OzipzStaff[]>;
  addStaff(staff: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff>;
  updateStaff(id: string, updates: Partial<OzipzStaff>): Promise<void>;
  deleteStaff(id: string): Promise<void>;
  getContacts(): Promise<OzipzContact[]>;
  addContact(contact: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact>;
  updateContact(id: string, updates: Partial<OzipzContact>): Promise<void>;
  deleteContact(id: string): Promise<void>;
}

export interface IRegistryRepository {
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
  getPublications(): Promise<OzipzPublication[]>;
  addPublication(pub: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">): Promise<OzipzPublication>;
  updatePublication(id: string, updates: Partial<OzipzPublication>): Promise<void>;
  deletePublication(id: string): Promise<void>;
  getRegisters(): Promise<OzipzRegisterItem[]>;
  addRegister(reg: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem>;
  updateRegister(id: string, updates: Partial<OzipzRegisterItem>): Promise<void>;
  deleteRegister(id: string): Promise<void>;
}

export interface IMonthlyTargetsRepository {
  getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]>;
  saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]>;
  /** Roczny plan miernika (działania i uczestnicy); null, gdy dla roku nie zapisano planu. */
  getMetricPlan(year: number): Promise<MetricPlanState | null>;
  saveMetricPlan(year: number, plan: MetricPlanState): Promise<void>;
}

export interface IRozdzielnikTemplatesRepository {
  getRozdzielnikTemplates(): Promise<RozdzielnikTemplate[]>;
  /** Dodaje albo zastępuje szablon o tym samym id. */
  saveRozdzielnikTemplate(template: RozdzielnikTemplate): Promise<void>;
  deleteRozdzielnikTemplate(id: string): Promise<void>;
}
