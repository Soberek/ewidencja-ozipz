import type {
  OzipzLetter,
  OzipzScan,
  OzipzTemplate,
  OzipzPublication,
  OzipzRegisterItem,
} from "../../../features/ozipz/types/ozipz.types";
import type {
  ISqlDatabase,
  LetterSqlRow,
  ScanSqlRow,
  TemplateSqlRow,
  PublicationSqlRow,
  RegisterSqlRow,
} from "../../types";
import { Mappers } from "../../mappers";
import type { IRegistryRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteRegistryRepository implements IRegistryRepository {
  constructor(private readonly db: ISqlDatabase) {}

  // --- Letters ---
  async getLetters(): Promise<OzipzLetter[]> {
    const rows = await this.db.select<LetterSqlRow[]>("SELECT * FROM ozipz_letters ORDER BY letter_date DESC");
    return rows.map(Mappers.toLetter);
  }

  async addLetter(letter: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">): Promise<OzipzLetter> {
    const id = generateId("let");
    const now = new Date().toISOString();
    const newLetter: OzipzLetter = { ...letter, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_letters (id, direction, letter_number, letter_date, case_sign, sender_recipient, facility_id, subject, program_id, assigned_person, status, notes, response_due_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
      [newLetter.id, newLetter.direction, newLetter.letterNumber, newLetter.letterDate, newLetter.caseSign || null, newLetter.senderRecipient, newLetter.facilityId || null, newLetter.subject, newLetter.programId || null, newLetter.assignedPerson, newLetter.status, newLetter.notes || null, newLetter.responseDueDate || null, newLetter.createdAt, newLetter.updatedAt]
    );
    return newLetter;
  }

  async updateLetter(id: string, updates: Partial<OzipzLetter>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getLetters()).find((l) => l.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_letters SET direction = $1, letter_number = $2, letter_date = $3, case_sign = $4, sender_recipient = $5, facility_id = $6, subject = $7, program_id = $8, assigned_person = $9, status = $10, notes = $11, response_due_date = $12, updated_at = $13 WHERE id = $14",
      [merged.direction, merged.letterNumber, merged.letterDate, merged.caseSign || null, merged.senderRecipient, merged.facilityId || null, merged.subject, merged.programId || null, merged.assignedPerson, merged.status, merged.notes || null, merged.responseDueDate || null, merged.updatedAt, id]
    );
  }

  async deleteLetter(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_letters WHERE id = $1", [id]);
  }

  // --- Scans ---
  async getScans(): Promise<OzipzScan[]> {
    const rows = await this.db.select<ScanSqlRow[]>("SELECT * FROM ozipz_scans ORDER BY scan_date DESC");
    return rows.map(Mappers.toScan);
  }

  async addScan(scan: Omit<OzipzScan, "id" | "createdAt">): Promise<OzipzScan> {
    const id = generateId("scan");
    const now = new Date().toISOString();
    const newScan: OzipzScan = { ...scan, id, createdAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_scans (id, title, document_type, facility_id, facility_name, program_id, program_name, scan_date, file_size_kb, file_name, file_path, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
      [newScan.id, newScan.title, newScan.documentType, newScan.facilityId || null, newScan.facilityName, newScan.programId || null, newScan.programName || null, newScan.scanDate, newScan.fileSizeKb || null, newScan.fileName, newScan.filePath || null, newScan.notes || null, newScan.createdAt, newScan.createdAt]
    );
    return newScan;
  }

  async deleteScan(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_scans WHERE id = $1", [id]);
  }

  // --- Templates ---
  async getTemplates(): Promise<OzipzTemplate[]> {
    const rows = await this.db.select<TemplateSqlRow[]>("SELECT * FROM ozipz_templates ORDER BY title ASC");
    return rows.map(Mappers.toTemplate);
  }

  async addTemplate(tpl: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">): Promise<OzipzTemplate> {
    const id = generateId("tpl");
    const now = new Date().toISOString();
    const newTpl: OzipzTemplate = { ...tpl, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_templates (id, title, topic, action_type, description_template, default_audience, suggested_materials, created_at, updated_at, action_defaults) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [newTpl.id, newTpl.title, newTpl.topic, newTpl.actionType, newTpl.descriptionTemplate, newTpl.defaultAudience, newTpl.suggestedMaterials || null, newTpl.createdAt, newTpl.updatedAt, newTpl.actionDefaults ? JSON.stringify(newTpl.actionDefaults) : null]
    );
    return newTpl;
  }

  async updateTemplate(id: string, updates: Partial<OzipzTemplate>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getTemplates()).find((t) => t.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_templates SET title = $1, topic = $2, action_type = $3, description_template = $4, default_audience = $5, suggested_materials = $6, updated_at = $7, action_defaults = $8 WHERE id = $9",
      [merged.title, merged.topic, merged.actionType, merged.descriptionTemplate, merged.defaultAudience, merged.suggestedMaterials || null, merged.updatedAt, merged.actionDefaults ? JSON.stringify(merged.actionDefaults) : null, id]
    );
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_templates WHERE id = $1", [id]);
  }

  // --- Publications ---
  async getPublications(): Promise<OzipzPublication[]> {
    const rows = await this.db.select<PublicationSqlRow[]>("SELECT * FROM ozipz_publications ORDER BY publication_date DESC");
    return rows.map(Mappers.toPublication);
  }

  async addPublication(pub: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">): Promise<OzipzPublication> {
    const id = generateId("pub");
    const now = new Date().toISOString();
    const newPub: OzipzPublication = { ...pub, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_publications (id, title, channel, publication_date, topic, link, reach_count, action_id, author, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [newPub.id, newPub.title, newPub.channel, newPub.publicationDate, newPub.topic, newPub.link || null, newPub.reachCount || null, newPub.actionId || null, newPub.author, newPub.notes || null, newPub.createdAt, newPub.updatedAt]
    );
    return newPub;
  }

  async updatePublication(id: string, updates: Partial<OzipzPublication>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getPublications()).find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_publications SET title = $1, channel = $2, publication_date = $3, topic = $4, link = $5, reach_count = $6, action_id = $7, author = $8, notes = $9, updated_at = $10 WHERE id = $11",
      [merged.title, merged.channel, merged.publicationDate, merged.topic, merged.link || null, merged.reachCount || null, merged.actionId || null, merged.author, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deletePublication(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_publications WHERE id = $1", [id]);
  }

  // --- Registers ---
  async getRegisters(): Promise<OzipzRegisterItem[]> {
    const rows = await this.db.select<RegisterSqlRow[]>("SELECT * FROM ozipz_registers ORDER BY date DESC");
    return rows.map(Mappers.toRegister);
  }

  async addRegister(reg: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem> {
    const id = generateId("reg");
    const now = new Date().toISOString();
    const newReg: OzipzRegisterItem = { ...reg, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_registers (id, register_type, register_number, date, title, organizer, location, facility_id, facility_name, program_id, program_name, jrwa_sign, participants_count, target_audience, outcome, responsible_person, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
      [newReg.id, newReg.registerType, newReg.registerNumber || null, newReg.date, newReg.title, newReg.organizer, newReg.location, newReg.facilityId || null, newReg.facilityName || null, newReg.programId || null, newReg.programName || null, newReg.jrwaSign || null, newReg.participantsCount, newReg.targetAudience || null, newReg.outcome || null, newReg.responsiblePerson || null, newReg.notes || null, newReg.createdAt, newReg.updatedAt]
    );
    return newReg;
  }

  async updateRegister(id: string, updates: Partial<OzipzRegisterItem>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getRegisters()).find((r) => r.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_registers SET register_type = $1, register_number = $2, date = $3, title = $4, organizer = $5, location = $6, facility_id = $7, facility_name = $8, program_id = $9, program_name = $10, jrwa_sign = $11, participants_count = $12, target_audience = $13, outcome = $14, responsible_person = $15, notes = $16, updated_at = $17 WHERE id = $18",
      [merged.registerType, merged.registerNumber || null, merged.date, merged.title, merged.organizer, merged.location, merged.facilityId || null, merged.facilityName || null, merged.programId || null, merged.programName || null, merged.jrwaSign || null, merged.participantsCount, merged.targetAudience || null, merged.outcome || null, merged.responsiblePerson || null, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deleteRegister(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_registers WHERE id = $1", [id]);
  }
}
