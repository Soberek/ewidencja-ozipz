import type { OzipzMaterial, OzipzDistribution } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, MaterialSqlRow, DistributionSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IMaterialsRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteMaterialsRepository implements IMaterialsRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getMaterials(): Promise<OzipzMaterial[]> {
    const rows = await this.db.select<MaterialSqlRow[]>("SELECT * FROM ozipz_materials ORDER BY title ASC");
    return rows.map(Mappers.toMaterial);
  }

  async addMaterial(mat: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">): Promise<OzipzMaterial> {
    const id = generateId("mat");
    const now = new Date().toISOString();
    const newMat: OzipzMaterial = { ...mat, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_materials (id, title, material_type, topic, publisher, target_audience, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [newMat.id, newMat.title, newMat.materialType, newMat.topic, newMat.publisher, newMat.targetAudience || null, newMat.notes || null, newMat.createdAt, newMat.updatedAt]
    );
    return newMat;
  }

  async updateMaterial(id: string, updates: Partial<OzipzMaterial>): Promise<void> {
    const now = new Date().toISOString();
    const rows = await this.db.select<MaterialSqlRow[]>("SELECT * FROM ozipz_materials WHERE id = $1 LIMIT 1", [id]);
    if (!rows || rows.length === 0) return;
    const current = Mappers.toMaterial(rows[0]);
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_materials SET title = $1, material_type = $2, topic = $3, publisher = $4, target_audience = $5, notes = $6, updated_at = $7 WHERE id = $8",
      [merged.title, merged.materialType, merged.topic, merged.publisher, merged.targetAudience || null, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_materials WHERE id = $1", [id]);
  }

  async getDistributions(): Promise<OzipzDistribution[]> {
    const rows = await this.db.select<DistributionSqlRow[]>("SELECT * FROM ozipz_distributions ORDER BY distribution_date DESC");
    return rows.map(Mappers.toDistribution);
  }

  async addDistribution(dist: Omit<OzipzDistribution, "id" | "createdAt">): Promise<OzipzDistribution> {
    const id = generateId("dist");
    const now = new Date().toISOString();
    const newDist: OzipzDistribution = { ...dist, id, createdAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_distributions (id, material_id, material_title, material_type, facility_id, recipient_name, municipality, action_id, action_title, quantity, distribution_date, assigned_educator, purpose, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
      [newDist.id, newDist.materialId || null, newDist.materialTitle, newDist.materialType || null, newDist.facilityId || null, newDist.recipientName, newDist.municipality || null, newDist.actionId || null, newDist.actionTitle || null, newDist.quantity, newDist.distributionDate, newDist.assignedEducator, newDist.purpose, newDist.notes || null, newDist.createdAt, now]
    );
    return newDist;
  }

  async updateDistribution(id: string, updates: Partial<OzipzDistribution>): Promise<void> {
    const now = new Date().toISOString();
    const rows = await this.db.select<DistributionSqlRow[]>("SELECT * FROM ozipz_distributions WHERE id = $1 LIMIT 1", [id]);
    if (!rows || rows.length === 0) return;
    const current = Mappers.toDistribution(rows[0]);
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_distributions SET material_id = $1, material_title = $2, material_type = $3, facility_id = $4, recipient_name = $5, municipality = $6, action_id = $7, action_title = $8, quantity = $9, distribution_date = $10, assigned_educator = $11, purpose = $12, notes = $13, updated_at = $14 WHERE id = $15",
      [merged.materialId || null, merged.materialTitle, merged.materialType || null, merged.facilityId || null, merged.recipientName, merged.municipality || null, merged.actionId || null, merged.actionTitle || null, merged.quantity, merged.distributionDate, merged.assignedEducator, merged.purpose, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deleteDistribution(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_distributions WHERE id = $1", [id]);
  }
}
