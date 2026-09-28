import type { OzipzStaff, OzipzContact } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, StaffSqlRow, ContactSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IStaffContactsRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteStaffContactsRepository implements IStaffContactsRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getStaff(): Promise<OzipzStaff[]> {
    const rows = await this.db.select<StaffSqlRow[]>("SELECT * FROM ozipz_staff ORDER BY full_name ASC");
    return rows.map(Mappers.toStaff);
  }

  async addStaff(staff: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff> {
    const id = generateId("stf");
    const now = new Date().toISOString();
    const newStaff: OzipzStaff = { ...staff, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_staff (id, full_name, role, email, phone, active, specialization, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [newStaff.id, newStaff.fullName, newStaff.role, newStaff.email || null, newStaff.phone || null, newStaff.active ? 1 : 0, newStaff.specialization || null, newStaff.createdAt, newStaff.updatedAt]
    );
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<OzipzStaff>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getStaff()).find((s) => s.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_staff SET full_name = $1, role = $2, email = $3, phone = $4, active = $5, specialization = $6, updated_at = $7 WHERE id = $8",
      [merged.fullName, merged.role, merged.email || null, merged.phone || null, merged.active ? 1 : 0, merged.specialization || null, merged.updatedAt, id]
    );
  }

  async deleteStaff(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_staff WHERE id = $1", [id]);
  }

  async getContacts(): Promise<OzipzContact[]> {
    const rows = await this.db.select<ContactSqlRow[]>("SELECT * FROM ozipz_contacts ORDER BY name ASC");
    return rows.map(Mappers.toContact);
  }

  async addContact(contact: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact> {
    const id = generateId("cnt");
    const now = new Date().toISOString();
    const newCnt: OzipzContact = { ...contact, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_contacts (id, facility_id, facility_name, municipality, name, position, phone, email, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [newCnt.id, newCnt.facilityId || null, newCnt.facilityName, newCnt.municipality || null, newCnt.name, newCnt.position, newCnt.phone || null, newCnt.email || null, newCnt.notes || null, newCnt.createdAt, newCnt.updatedAt]
    );
    return newCnt;
  }

  async updateContact(id: string, updates: Partial<OzipzContact>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getContacts()).find((c) => c.id === id);
    if (!current) return;
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_contacts SET facility_id = $1, facility_name = $2, municipality = $3, name = $4, position = $5, phone = $6, email = $7, notes = $8, updated_at = $9 WHERE id = $10",
      [merged.facilityId || null, merged.facilityName, merged.municipality || null, merged.name, merged.position, merged.phone || null, merged.email || null, merged.notes || null, merged.updatedAt, id]
    );
  }

  async deleteContact(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_contacts WHERE id = $1", [id]);
  }
}
