import type { OzipzFacility, FacilityActivitySummary } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, FacilitySqlRow, FacilityOverviewSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IFacilitiesRepository } from "../interfaces";
import { generateId } from "../id-generator";

const FACILITY_COLUMNS = [
  "id", "name", "type", "education_types", "address", "city", "postal_code", "municipality", "county",
  "leading_authority", "is_complex", "parent_facility_id", "email", "phone", "default_coordinator_name",
  "default_coordinator_phone", "default_coordinator_email", "notes", "created_at", "updated_at",
] as const;

/** INSERT … ON CONFLICT DO UPDATE dla pełnego wiersza placówki (created_at nie jest nadpisywany). */
export const UPSERT_FACILITY_SQL = `INSERT INTO ozipz_facilities (${FACILITY_COLUMNS.join(", ")})
  VALUES (${FACILITY_COLUMNS.map((_, index) => `$${index + 1}`).join(", ")})
  ON CONFLICT(id) DO UPDATE SET ${FACILITY_COLUMNS.filter((column) => column !== "id" && column !== "created_at")
    .map((column) => `${column} = excluded.${column}`).join(", ")}`;

/** Parametry w kolejności FACILITY_COLUMNS; puste teksty opcjonalne zapisujemy jako NULL. */
export function facilitySqlParams(f: OzipzFacility): Array<string | number | null> {
  return [
    f.id, f.name, f.type, f.educationTypes?.length ? JSON.stringify(f.educationTypes) : null,
    f.address, f.city, f.postalCode, f.municipality, f.county, f.leadingAuthority,
    f.isComplex ? 1 : 0, f.parentFacilityId || null, f.email || null, f.phone || null,
    f.defaultCoordinatorName || null, f.defaultCoordinatorPhone || null, f.defaultCoordinatorEmail || null,
    f.notes || null, f.createdAt, f.updatedAt,
  ];
}

export class SqliteFacilitiesRepository implements IFacilitiesRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getFacilities(): Promise<OzipzFacility[]> {
    const rows = await this.db.select<FacilitySqlRow[]>("SELECT * FROM ozipz_facilities ORDER BY name ASC");
    return rows.map(Mappers.toFacility);
  }

  private async getFacility(id: string): Promise<OzipzFacility | undefined> {
    const rows = await this.db.select<FacilitySqlRow[]>("SELECT * FROM ozipz_facilities WHERE id = $1", [id]);
    return rows[0] ? Mappers.toFacility(rows[0]) : undefined;
  }

  async addFacility(fac: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">): Promise<OzipzFacility> {
    const now = new Date().toISOString();
    const created: OzipzFacility = { ...fac, id: generateId("fac"), createdAt: now, updatedAt: now };
    await this.db.execute(UPSERT_FACILITY_SQL, facilitySqlParams(created));
    return created;
  }

  async updateFacility(id: string, updates: Partial<OzipzFacility>): Promise<void> {
    const current = await this.getFacility(id);
    if (!current) return;
    await this.db.execute(UPSERT_FACILITY_SQL, facilitySqlParams({ ...current, ...updates, id, updatedAt: new Date().toISOString() }));
  }

  async deleteFacility(id: string): Promise<void> {
    const linked = await this.db.select<Array<{ count: number }>>("SELECT COUNT(*) AS count FROM ozipz_participations WHERE facility_id = $1", [id]);
    if (linked[0]?.count) throw new Error("Nie można usunąć placówki z zapisanymi udziałami. Najpierw uporządkuj zgłoszenia.");
    await this.db.execute("DELETE FROM ozipz_facilities WHERE id = $1", [id]);
  }

  async batchUpsertFacilities(facilities: OzipzFacility[]): Promise<OzipzFacility[]> {
    try {
      await this.db.execute("BEGIN TRANSACTION;");
      for (const f of facilities) await this.db.execute(UPSERT_FACILITY_SQL, facilitySqlParams(f));
      await this.db.execute("COMMIT;");
    } catch (err) {
      await this.db.execute("ROLLBACK;");
      throw err;
    }
    return this.getFacilities();
  }

  async getFacilityActivitySummary(facilityId: string): Promise<FacilityActivitySummary> {
    const rows = await this.db.select<FacilityOverviewSqlRow[]>(
      "SELECT * FROM v_ozipz_facility_overview WHERE facility_id = $1",
      [facilityId]
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        facilityId: r.facility_id,
        facilityName: r.facility_name,
        programsCount: Number(r.programs_count) || 0,
        actionsCount: Number(r.actions_count) || 0,
        totalPupilsReached: Number(r.total_pupils_reached) || 0,
        totalMaterialsReceived: Number(r.total_materials_received) || 0,
        lastActionDate: r.last_action_date || undefined,
      };
    }
    const fac = await this.getFacility(facilityId);
    return {
      facilityId,
      facilityName: fac ? fac.name : "Nieznana",
      programsCount: 0,
      actionsCount: 0,
      totalPupilsReached: 0,
      totalMaterialsReceived: 0,
    };
  }
}
