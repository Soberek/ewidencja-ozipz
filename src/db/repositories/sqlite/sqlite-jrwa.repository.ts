import type { OzipzJrwaCase } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, JrwaSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IJrwaRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteJrwaRepository implements IJrwaRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getJrwaCases(): Promise<OzipzJrwaCase[]> {
    const rows = await this.db.select<JrwaSqlRow[]>("SELECT * FROM ozipz_jrwa_cases ORDER BY year DESC, case_number DESC");
    return rows.map(Mappers.toJrwa);
  }

  async addJrwaCase(c: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">): Promise<OzipzJrwaCase> {
    const id = generateId("jrwa");
    const now = new Date().toISOString();
    const newCase: OzipzJrwaCase = { ...c, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, referent_initials, full_case_sign, title, facility_id, facility_name, program_id, program_name, action_id, archival_category, start_date, end_date, initiating_document, status, assigned_educator, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)",
      [newCase.id, newCase.section, newCase.jrwaSymbol, newCase.caseNumber, newCase.year, newCase.referentInitials || null, newCase.fullCaseSign, newCase.title, newCase.facilityId || null, newCase.facilityName || null, newCase.programId || null, newCase.programName || null, newCase.actionId || null, newCase.archivalCategory || null, newCase.startDate || null, newCase.endDate || null, newCase.initiatingDocument || null, newCase.status, newCase.assignedEducator, newCase.notes || null, newCase.createdAt, newCase.updatedAt]
    );
    return newCase;
  }

  async updateJrwaCase(id: string, updates: Partial<OzipzJrwaCase>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getJrwaCases()).find((c) => c.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_jrwa_cases SET section = $1, jrwa_symbol = $2, case_number = $3, year = $4, referent_initials = $5, full_case_sign = $6, title = $7, facility_id = $8, facility_name = $9, program_id = $10, program_name = $11, action_id = $12, archival_category = $13, start_date = $14, end_date = $15, initiating_document = $16, status = $17, assigned_educator = $18, notes = $19, updated_at = $20 WHERE id = $21",
      [merged.section, merged.jrwaSymbol, merged.caseNumber, merged.year, merged.referentInitials || null, merged.fullCaseSign, merged.title, merged.facilityId || null, merged.facilityName || null, merged.programId || null, merged.programName || null, merged.actionId || null, merged.archivalCategory || null, merged.startDate || null, merged.endDate || null, merged.initiatingDocument || null, merged.status, merged.assignedEducator, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deleteJrwaCase(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_jrwa_cases WHERE id = $1", [id]);
  }
}
