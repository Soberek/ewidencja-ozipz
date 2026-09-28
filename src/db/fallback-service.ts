import { resolveReferenceNames } from "./reference-names";
import type {
  OzipzAction, OzipzProgram, OzipzSchoolParticipation, OzipzMaterial, OzipzDistribution,
  OzipzScheduleEvent, OzipzJrwaCase, OzipzPublication, OzipzFacility, OzipzDictionaryItem,
  OzipzLetter, OzipzScan, OzipzTemplate, OzipzStaff, OzipzContact, OzipzRegisterItem,
  FacilityActivitySummary, OzipzMonthlyTarget,
} from "../features/ozipz/types/ozipz.types";
import type { IOzipzDatabaseService, CompanionDistributionPayload, SaveActionWithRelationsParams, SaveActionWithRelationsResult } from "./types";
import type { OzipzYearlyMonthlyTargets } from "../features/ozipz/utils/monthlyTargetsUtils";
import { FallbackActionsRepository } from "./repositories/fallback/fallback-actions.repository";
import { FallbackProgramsRepository } from "./repositories/fallback/fallback-programs.repository";
import { FallbackMaterialsRepository } from "./repositories/fallback/fallback-materials.repository";
import { FallbackScheduleRepository } from "./repositories/fallback/fallback-schedule.repository";
import { FallbackJrwaRepository } from "./repositories/fallback/fallback-jrwa.repository";
import { FallbackFacilitiesRepository } from "./repositories/fallback/fallback-facilities.repository";
import { FallbackDictionariesRepository } from "./repositories/fallback/fallback-dictionaries.repository";
import { FallbackStaffContactsRepository } from "./repositories/fallback/fallback-staff-contacts.repository";
import { FallbackRegistryRepository } from "./repositories/fallback/fallback-registry.repository";
import { FallbackMonthlyTargetsRepository } from "./repositories/fallback/fallback-monthly-targets.repository";
import { getStoredClosedMonths } from "../features/ozipz/utils/dateUtils";

export class FallbackDatabaseService implements IOzipzDatabaseService {
  private readonly actionsRepo: FallbackActionsRepository;
  private readonly programsRepo: FallbackProgramsRepository;
  private readonly materialsRepo: FallbackMaterialsRepository;
  private readonly scheduleRepo: FallbackScheduleRepository;
  private readonly jrwaRepo: FallbackJrwaRepository;
  private readonly facilitiesRepo: FallbackFacilitiesRepository;
  private readonly dictionariesRepo: FallbackDictionariesRepository;
  private readonly staffContactsRepo: FallbackStaffContactsRepository;
  private readonly registryRepo: FallbackRegistryRepository;
  private readonly monthlyTargetsRepo: FallbackMonthlyTargetsRepository;

  constructor() {
    this.scheduleRepo = new FallbackScheduleRepository();
    this.jrwaRepo = new FallbackJrwaRepository();
    this.materialsRepo = new FallbackMaterialsRepository();
    this.actionsRepo = new FallbackActionsRepository(this.jrwaRepo, this.scheduleRepo, this.materialsRepo);
    this.programsRepo = new FallbackProgramsRepository();
    this.facilitiesRepo = new FallbackFacilitiesRepository();
    this.dictionariesRepo = new FallbackDictionariesRepository();
    this.staffContactsRepo = new FallbackStaffContactsRepository();
    this.registryRepo = new FallbackRegistryRepository();
    this.monthlyTargetsRepo = new FallbackMonthlyTargetsRepository();
  }

  async getClosedMonths(): Promise<string[]> { return [...getStoredClosedMonths()].filter((month) => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)).sort(); }
  async setMonthClosed(monthKey: string, closed: boolean): Promise<void> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) throw new Error("Nieprawidłowy miesiąc.");
    const months = new Set(await this.getClosedMonths());
    if (closed) months.add(monthKey);
    else months.delete(monthKey);
    localStorage.setItem("oz.closedMonths", JSON.stringify([...months]));
  }

  // Actions
  async getActions(): Promise<OzipzAction[]> { return resolveReferenceNames(await this.actionsRepo.getActions(), await this.getFacilities(), await this.getPrograms()); }
  addAction(action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">): Promise<OzipzAction> { return this.actionsRepo.addAction(action); }
  updateAction(id: string, updates: Partial<OzipzAction>): Promise<void> { return this.actionsRepo.updateAction(id, updates); }
  updateActionWithRelations(
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ): Promise<void> {
    return this.actionsRepo.updateActionWithRelations(id, updates, distributionMaterials, companionDistribution);
  }
  deleteAction(id: string): Promise<void> { return this.actionsRepo.deleteAction(id); }
  saveActionWithRelations(params: SaveActionWithRelationsParams): Promise<SaveActionWithRelationsResult> { return this.actionsRepo.saveActionWithRelations(params); }
  // Programs & Participations
  getPrograms(): Promise<OzipzProgram[]> { return this.programsRepo.getPrograms(); }
  addProgram(p: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram> { return this.programsRepo.addProgram(p); }
  updateProgram(id: string, u: Partial<OzipzProgram>): Promise<void> { return this.programsRepo.updateProgram(id, u); }
  deleteProgram(id: string): Promise<void> { return this.programsRepo.deleteProgram(id); }
  async getParticipations(): Promise<OzipzSchoolParticipation[]> { return resolveReferenceNames(await this.programsRepo.getParticipations(), await this.getFacilities(), await this.getPrograms()); }
  addParticipation(p: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">): Promise<OzipzSchoolParticipation> { return this.programsRepo.addParticipation(p); }
  updateParticipation(id: string, u: Partial<OzipzSchoolParticipation>): Promise<void> { return this.programsRepo.updateParticipation(id, u); }
  deleteParticipation(id: string): Promise<void> { return this.programsRepo.deleteParticipation(id); }
  // Materials & Distributions
  getMaterials(): Promise<OzipzMaterial[]> { return this.materialsRepo.getMaterials(); }
  addMaterial(m: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">): Promise<OzipzMaterial> { return this.materialsRepo.addMaterial(m); }
  updateMaterial(id: string, u: Partial<OzipzMaterial>): Promise<void> { return this.materialsRepo.updateMaterial(id, u); }
  deleteMaterial(id: string): Promise<void> { return this.materialsRepo.deleteMaterial(id); }
  getDistributions(): Promise<OzipzDistribution[]> { return this.materialsRepo.getDistributions(); }
  addDistribution(d: Omit<OzipzDistribution, "id" | "createdAt">): Promise<OzipzDistribution> { return this.materialsRepo.addDistribution(d); }
  updateDistribution(id: string, u: Partial<OzipzDistribution>): Promise<void> { return this.materialsRepo.updateDistribution(id, u); }
  deleteDistribution(id: string): Promise<void> { return this.materialsRepo.deleteDistribution(id); }
  // Schedule
  async getScheduleEvents(): Promise<OzipzScheduleEvent[]> { return resolveReferenceNames(await this.scheduleRepo.getScheduleEvents(), await this.getFacilities(), await this.getPrograms()); }
  addScheduleEvent(e: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent> { return this.scheduleRepo.addScheduleEvent(e); }
  updateScheduleEvent(id: string, u: Partial<OzipzScheduleEvent>): Promise<void> { return this.scheduleRepo.updateScheduleEvent(id, u); }
  deleteScheduleEvent(id: string): Promise<void> { return this.scheduleRepo.deleteScheduleEvent(id); }
  toggleScheduleStatus(id: string, currentStatus: string): Promise<void> { return this.scheduleRepo.toggleScheduleStatus(id, currentStatus); }
  // JRWA
  async getJrwaCases(): Promise<OzipzJrwaCase[]> { return resolveReferenceNames(await this.jrwaRepo.getJrwaCases(), await this.getFacilities(), await this.getPrograms()); }
  addJrwaCase(c: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">): Promise<OzipzJrwaCase> { return this.jrwaRepo.addJrwaCase(c); }
  updateJrwaCase(id: string, u: Partial<OzipzJrwaCase>): Promise<void> { return this.jrwaRepo.updateJrwaCase(id, u); }
  deleteJrwaCase(id: string): Promise<void> { return this.jrwaRepo.deleteJrwaCase(id); }
  // Publications
  getPublications(): Promise<OzipzPublication[]> { return this.registryRepo.getPublications(); }
  addPublication(p: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">): Promise<OzipzPublication> { return this.registryRepo.addPublication(p); }
  updatePublication(id: string, u: Partial<OzipzPublication>): Promise<void> { return this.registryRepo.updatePublication(id, u); }
  deletePublication(id: string): Promise<void> { return this.registryRepo.deletePublication(id); }
  // Facilities
  getFacilities(): Promise<OzipzFacility[]> { return this.facilitiesRepo.getFacilities(); }
  addFacility(f: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">): Promise<OzipzFacility> { return this.facilitiesRepo.addFacility(f); }
  updateFacility(id: string, u: Partial<OzipzFacility>): Promise<void> { return this.facilitiesRepo.updateFacility(id, u); }
  deleteFacility(id: string): Promise<void> { return this.facilitiesRepo.deleteFacility(id); }
  batchUpsertFacilities(f: OzipzFacility[]): Promise<OzipzFacility[]> { return this.facilitiesRepo.batchUpsertFacilities(f); }
  getFacilityActivitySummary(id: string): Promise<FacilityActivitySummary> { return this.facilitiesRepo.getFacilityActivitySummary(id); }
  // Dictionaries
  getDictionaryItems(): Promise<OzipzDictionaryItem[]> { return this.dictionariesRepo.getDictionaryItems(); }
  addDictionaryItem(d: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzDictionaryItem> { return this.dictionariesRepo.addDictionaryItem(d); }
  updateDictionaryItem(id: string, u: Partial<OzipzDictionaryItem>): Promise<void> { return this.dictionariesRepo.updateDictionaryItem(id, u); }
  deleteDictionaryItem(id: string): Promise<void> { return this.dictionariesRepo.deleteDictionaryItem(id); }
  // Letters, Scans, Templates, Registers
  getLetters(): Promise<OzipzLetter[]> { return this.registryRepo.getLetters(); }
  addLetter(l: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">): Promise<OzipzLetter> { return this.registryRepo.addLetter(l); }
  updateLetter(id: string, u: Partial<OzipzLetter>): Promise<void> { return this.registryRepo.updateLetter(id, u); }
  deleteLetter(id: string): Promise<void> { return this.registryRepo.deleteLetter(id); }
  async getScans(): Promise<OzipzScan[]> { return resolveReferenceNames(await this.registryRepo.getScans(), await this.getFacilities(), await this.getPrograms()); }
  addScan(s: Omit<OzipzScan, "id" | "createdAt">): Promise<OzipzScan> { return this.registryRepo.addScan(s); }
  deleteScan(id: string): Promise<void> { return this.registryRepo.deleteScan(id); }
  getTemplates(): Promise<OzipzTemplate[]> { return this.registryRepo.getTemplates(); }
  addTemplate(t: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">): Promise<OzipzTemplate> { return this.registryRepo.addTemplate(t); }
  updateTemplate(id: string, u: Partial<OzipzTemplate>): Promise<void> { return this.registryRepo.updateTemplate(id, u); }
  deleteTemplate(id: string): Promise<void> { return this.registryRepo.deleteTemplate(id); }
  async getRegisters(): Promise<OzipzRegisterItem[]> { return resolveReferenceNames(await this.registryRepo.getRegisters(), await this.getFacilities(), await this.getPrograms()); }
  addRegister(r: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem> { return this.registryRepo.addRegister(r); }
  updateRegister(id: string, u: Partial<OzipzRegisterItem>): Promise<void> { return this.registryRepo.updateRegister(id, u); }
  deleteRegister(id: string): Promise<void> { return this.registryRepo.deleteRegister(id); }
  // Staff & Contacts
  getStaff(): Promise<OzipzStaff[]> { return this.staffContactsRepo.getStaff(); }
  addStaff(s: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff> { return this.staffContactsRepo.addStaff(s); }
  updateStaff(id: string, u: Partial<OzipzStaff>): Promise<void> { return this.staffContactsRepo.updateStaff(id, u); }
  deleteStaff(id: string): Promise<void> { return this.staffContactsRepo.deleteStaff(id); }
  async getContacts(): Promise<OzipzContact[]> { return resolveReferenceNames(await this.staffContactsRepo.getContacts(), await this.getFacilities(), await this.getPrograms()); }
  addContact(c: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact> { return this.staffContactsRepo.addContact(c); }
  updateContact(id: string, u: Partial<OzipzContact>): Promise<void> { return this.staffContactsRepo.updateContact(id, u); }
  deleteContact(id: string): Promise<void> { return this.staffContactsRepo.deleteContact(id); }
  // Monthly Targets
  getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]> { return this.monthlyTargetsRepo.getMonthlyTargets(year); }
  saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]> { return this.monthlyTargetsRepo.saveMonthlyTargets(year, targets); }

  async clearAndReseedDefaults(): Promise<void> {
    const ownedKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith("ozipz_")));
    ownedKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("oz.closedMonths");
  }
}
