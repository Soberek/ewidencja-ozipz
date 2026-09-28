import type {
  OzipzAction, OzipzProgram, OzipzSchoolParticipation, OzipzMaterial, OzipzDistribution,
  OzipzScheduleEvent, OzipzJrwaCase, OzipzPublication, OzipzFacility, OzipzDictionaryItem,
  OzipzLetter, OzipzScan, OzipzTemplate, OzipzStaff, OzipzContact, OzipzRegisterItem,
  FacilityActivitySummary, OzipzMonthlyTarget,
} from "../features/ozipz/types/ozipz.types";
import type { IOzipzDatabaseService, ISqlDatabase, CompanionDistributionPayload, SaveActionWithRelationsParams, SaveActionWithRelationsResult } from "./types";
import type { OzipzYearlyMonthlyTargets } from "../features/ozipz/utils/monthlyTargetsUtils";
import { SqliteActionsRepository } from "./repositories/sqlite/sqlite-actions.repository";
import { SqliteProgramsRepository } from "./repositories/sqlite/sqlite-programs.repository";
import { SqliteMaterialsRepository } from "./repositories/sqlite/sqlite-materials.repository";
import { SqliteScheduleRepository } from "./repositories/sqlite/sqlite-schedule.repository";
import { SqliteJrwaRepository } from "./repositories/sqlite/sqlite-jrwa.repository";
import { SqliteFacilitiesRepository } from "./repositories/sqlite/sqlite-facilities.repository";
import { SqliteDictionariesRepository } from "./repositories/sqlite/sqlite-dictionaries.repository";
import { SqliteStaffContactsRepository } from "./repositories/sqlite/sqlite-staff-contacts.repository";
import { SqliteRegistryRepository } from "./repositories/sqlite/sqlite-registry.repository";
import { SqliteMonthlyTargetsRepository } from "./repositories/sqlite/sqlite-monthly-targets.repository";
import { seedInitialData } from "./sqlite-seed";

export { initTables } from "./sqlite-schema";
export { seedInitialData, cleanupPoisonedJrwaCases } from "./sqlite-seed";

export class SqliteDatabaseService implements IOzipzDatabaseService {
  private readonly actionsRepo: SqliteActionsRepository;
  private readonly programsRepo: SqliteProgramsRepository;
  private readonly materialsRepo: SqliteMaterialsRepository;
  private readonly scheduleRepo: SqliteScheduleRepository;
  private readonly jrwaRepo: SqliteJrwaRepository;
  private readonly facilitiesRepo: SqliteFacilitiesRepository;
  private readonly dictionariesRepo: SqliteDictionariesRepository;
  private readonly staffContactsRepo: SqliteStaffContactsRepository;
  private readonly registryRepo: SqliteRegistryRepository;
  private readonly monthlyTargetsRepo: SqliteMonthlyTargetsRepository;

  constructor(private readonly db: ISqlDatabase) {
    this.scheduleRepo = new SqliteScheduleRepository(db);
    this.jrwaRepo = new SqliteJrwaRepository(db);
    this.materialsRepo = new SqliteMaterialsRepository(db);
    this.actionsRepo = new SqliteActionsRepository(db, this.jrwaRepo, this.scheduleRepo, this.materialsRepo);
    this.programsRepo = new SqliteProgramsRepository(db);
    this.facilitiesRepo = new SqliteFacilitiesRepository(db);
    this.dictionariesRepo = new SqliteDictionariesRepository(db);
    this.staffContactsRepo = new SqliteStaffContactsRepository(db);
    this.registryRepo = new SqliteRegistryRepository(db);
    this.monthlyTargetsRepo = new SqliteMonthlyTargetsRepository(db);
  }

  async getClosedMonths(): Promise<string[]> {
    const rows = await this.db.select<Array<{ month_key: string }>>("SELECT month_key FROM ozipz_closed_months ORDER BY month_key");
    return rows.map((row) => row.month_key);
  }

  async setMonthClosed(monthKey: string, closed: boolean): Promise<void> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) throw new Error("Nieprawidłowy miesiąc.");
    if (closed) {
      await this.db.execute("INSERT OR IGNORE INTO ozipz_closed_months (month_key, closed_at) VALUES ($1, $2)", [monthKey, new Date().toISOString()]);
    } else {
      await this.db.execute("DELETE FROM ozipz_closed_months WHERE month_key = $1", [monthKey]);
    }
  }

  // Actions
  getActions(): Promise<OzipzAction[]> { return this.actionsRepo.getActions(); }
  addAction(action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">): Promise<OzipzAction> { return this.actionsRepo.addAction(action); }
  updateAction(id: string, updates: Partial<OzipzAction>): Promise<void> { return this.actionsRepo.updateAction(id, updates); }
  deleteAction(id: string): Promise<void> { return this.actionsRepo.deleteAction(id); }
  saveActionWithRelations(params: SaveActionWithRelationsParams): Promise<SaveActionWithRelationsResult> { return this.actionsRepo.saveActionWithRelations(params); }
  updateActionWithRelations(
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ): Promise<void> {
    return this.actionsRepo.updateActionWithRelations(id, updates, distributionMaterials, companionDistribution);
  }
  // Programs & Participations
  getPrograms(): Promise<OzipzProgram[]> { return this.programsRepo.getPrograms(); }
  addProgram(p: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram> { return this.programsRepo.addProgram(p); }
  updateProgram(id: string, u: Partial<OzipzProgram>): Promise<void> { return this.programsRepo.updateProgram(id, u); }
  deleteProgram(id: string): Promise<void> { return this.programsRepo.deleteProgram(id); }
  getParticipations(): Promise<OzipzSchoolParticipation[]> { return this.programsRepo.getParticipations(); }
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
  getScheduleEvents(): Promise<OzipzScheduleEvent[]> { return this.scheduleRepo.getScheduleEvents(); }
  addScheduleEvent(e: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent> { return this.scheduleRepo.addScheduleEvent(e); }
  updateScheduleEvent(id: string, u: Partial<OzipzScheduleEvent>): Promise<void> { return this.scheduleRepo.updateScheduleEvent(id, u); }
  deleteScheduleEvent(id: string): Promise<void> { return this.scheduleRepo.deleteScheduleEvent(id); }
  // JRWA
  getJrwaCases(): Promise<OzipzJrwaCase[]> { return this.jrwaRepo.getJrwaCases(); }
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
  getScans(): Promise<OzipzScan[]> { return this.registryRepo.getScans(); }
  addScan(s: Omit<OzipzScan, "id" | "createdAt">): Promise<OzipzScan> { return this.registryRepo.addScan(s); }
  deleteScan(id: string): Promise<void> { return this.registryRepo.deleteScan(id); }
  getTemplates(): Promise<OzipzTemplate[]> { return this.registryRepo.getTemplates(); }
  addTemplate(t: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">): Promise<OzipzTemplate> { return this.registryRepo.addTemplate(t); }
  updateTemplate(id: string, u: Partial<OzipzTemplate>): Promise<void> { return this.registryRepo.updateTemplate(id, u); }
  deleteTemplate(id: string): Promise<void> { return this.registryRepo.deleteTemplate(id); }
  getRegisters(): Promise<OzipzRegisterItem[]> { return this.registryRepo.getRegisters(); }
  addRegister(r: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem> { return this.registryRepo.addRegister(r); }
  updateRegister(id: string, u: Partial<OzipzRegisterItem>): Promise<void> { return this.registryRepo.updateRegister(id, u); }
  deleteRegister(id: string): Promise<void> { return this.registryRepo.deleteRegister(id); }
  // Staff & Contacts
  getStaff(): Promise<OzipzStaff[]> { return this.staffContactsRepo.getStaff(); }
  addStaff(s: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff> { return this.staffContactsRepo.addStaff(s); }
  updateStaff(id: string, u: Partial<OzipzStaff>): Promise<void> { return this.staffContactsRepo.updateStaff(id, u); }
  deleteStaff(id: string): Promise<void> { return this.staffContactsRepo.deleteStaff(id); }
  getContacts(): Promise<OzipzContact[]> { return this.staffContactsRepo.getContacts(); }
  addContact(c: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact> { return this.staffContactsRepo.addContact(c); }
  updateContact(id: string, u: Partial<OzipzContact>): Promise<void> { return this.staffContactsRepo.updateContact(id, u); }
  deleteContact(id: string): Promise<void> { return this.staffContactsRepo.deleteContact(id); }
  // Monthly Targets
  getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]> { return this.monthlyTargetsRepo.getMonthlyTargets(year); }
  saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]> { return this.monthlyTargetsRepo.saveMonthlyTargets(year, targets); }

  async clearAndReseedDefaults(): Promise<void> {
    const tables = [
      "ozipz_closed_months", "ozipz_distributions", "ozipz_actions", "ozipz_participations", "ozipz_programs", "ozipz_materials",
      "ozipz_schedule", "ozipz_jrwa_cases", "ozipz_publications", "ozipz_facilities", "ozipz_dictionaries",
      "ozipz_letters", "ozipz_scans", "ozipz_templates", "ozipz_staff", "ozipz_contacts", "ozipz_registers", "ozipz_monthly_targets",
    ];
    try {
      await this.db.execute("BEGIN TRANSACTION;");
      for (const table of tables) {
        await this.db.execute(`DELETE FROM ${table};`);
      }
      await this.db.execute("COMMIT;");
    } catch (err) {
      await this.db.execute("ROLLBACK;");
      throw err;
    }
    await seedInitialData(this.db);
  }
}
