import type { OzipzProgram, OzipzSchoolParticipation } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, ProgramSqlRow, ParticipationSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IProgramsRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteProgramsRepository implements IProgramsRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getPrograms(): Promise<OzipzProgram[]> {
    const rows = await this.db.select<ProgramSqlRow[]>("SELECT * FROM ozipz_programs ORDER BY name ASC");
    return rows.map(Mappers.toProgram);
  }

  async addProgram(program: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram> {
    const id = generateId("prog");
    const now = new Date().toISOString();
    const newProg: OzipzProgram = { ...program, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_programs (id, code, name, edition_year, jrwa_symbol, target_audience, description, status, participating_schools_count, total_pupils_reached, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [newProg.id, newProg.code, newProg.name, newProg.editionYear, newProg.jrwaSymbol || null, newProg.targetAudience, newProg.description, newProg.status, newProg.participatingSchoolsCount || 0, newProg.totalPupilsReached || 0, newProg.createdAt, newProg.updatedAt]
    );
    return newProg;
  }

  async updateProgram(id: string, updates: Partial<OzipzProgram>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getPrograms()).find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_programs SET code = $1, name = $2, edition_year = $3, jrwa_symbol = $4, target_audience = $5, description = $6, status = $7, participating_schools_count = $8, total_pupils_reached = $9, updated_at = $10 WHERE id = $11",
      [merged.code, merged.name, merged.editionYear, merged.jrwaSymbol || null, merged.targetAudience, merged.description, merged.status, merged.participatingSchoolsCount || 0, merged.totalPupilsReached || 0, merged.updatedAt, id]
    );
  }

  async deleteProgram(id: string): Promise<void> {
    const linked = await this.db.select<Array<{ count: number }>>("SELECT COUNT(*) AS count FROM ozipz_participations WHERE program_id = $1", [id]);
    if (linked[0]?.count) throw new Error("Nie można usunąć programu z zapisanymi udziałami. Najpierw uporządkuj zgłoszenia.");
    await this.db.execute("DELETE FROM ozipz_programs WHERE id = $1", [id]);
  }

  async getParticipations(): Promise<OzipzSchoolParticipation[]> {
    const rows = await this.db.select<ParticipationSqlRow[]>("SELECT * FROM ozipz_participations ORDER BY program_name ASC, facility_name ASC");
    return rows.map(Mappers.toParticipation);
  }

  async addParticipation(part: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">): Promise<OzipzSchoolParticipation> {
    const id = generateId("part");
    const now = new Date().toISOString();
    const newPart: OzipzSchoolParticipation = { ...part, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_participations (id, program_id, program_name, facility_id, facility_name, municipality, school_year, school_coordinator_name, school_coordinator_contact, school_coordinator_contact_id, second_coordinator_name, second_coordinator_contact, second_coordinator_contact_id, pupils_count, has_declaration, has_final_report, evaluation_grade, notes, application_file, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)",
      [newPart.id, newPart.programId, newPart.programName, newPart.facilityId, newPart.facilityName, newPart.municipality, newPart.schoolYear, newPart.schoolCoordinatorName, newPart.schoolCoordinatorContact || null, newPart.schoolCoordinatorContactId || null, newPart.secondCoordinatorName?.trim() || null, newPart.secondCoordinatorContact || null, newPart.secondCoordinatorContactId || null, newPart.pupilsCount, newPart.hasDeclaration ? 1 : 0, newPart.hasFinalReport ? 1 : 0, newPart.evaluationGrade || null, newPart.notes || null, newPart.applicationFile || null, newPart.createdAt, newPart.updatedAt]
    );
    return newPart;
  }

  async updateParticipation(id: string, updates: Partial<OzipzSchoolParticipation>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getParticipations()).find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_participations SET program_id = $1, program_name = $2, facility_id = $3, facility_name = $4, municipality = $5, school_year = $6, school_coordinator_name = $7, school_coordinator_contact = $8, school_coordinator_contact_id = $9, second_coordinator_name = $10, second_coordinator_contact = $11, second_coordinator_contact_id = $12, pupils_count = $13, has_declaration = $14, has_final_report = $15, evaluation_grade = $16, notes = $17, application_file = $18, updated_at = $19 WHERE id = $20",
      [merged.programId, merged.programName, merged.facilityId, merged.facilityName, merged.municipality, merged.schoolYear, merged.schoolCoordinatorName, merged.schoolCoordinatorContact || null, merged.schoolCoordinatorContactId || null, merged.secondCoordinatorName?.trim() || null, merged.secondCoordinatorContact || null, merged.secondCoordinatorContactId || null, merged.pupilsCount, merged.hasDeclaration ? 1 : 0, merged.hasFinalReport ? 1 : 0, merged.evaluationGrade || null, merged.notes || null, merged.applicationFile || null, merged.updatedAt, id]
    );
  }

  async deleteParticipation(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_participations WHERE id = $1", [id]);
  }
}
