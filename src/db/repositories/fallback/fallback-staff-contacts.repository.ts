import type { OzipzStaff, OzipzContact, OzipzSchoolParticipation } from "../../../features/ozipz/types/ozipz.types";
import { syncCoordinatorContact, unlinkCoordinatorContact } from "../../../features/ozipz/utils/participationUtils";
import type { IStaffContactsRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage, withStorageRollback } from "./storage";

export class FallbackStaffContactsRepository implements IStaffContactsRepository {
  async getStaff(): Promise<OzipzStaff[]> {
    return loadFromStorage<OzipzStaff[]>("staff", []);
  }

  async addStaff(staff: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">): Promise<OzipzStaff> {
    const list = await this.getStaff();
    const id = generateId("stf");
    const now = new Date().toISOString();
    const created: OzipzStaff = { ...staff, id, createdAt: now, updatedAt: now };
    saveToStorage("staff", [...list, created]);
    return created;
  }

  async updateStaff(id: string, updates: Partial<OzipzStaff>): Promise<void> {
    const list = await this.getStaff();
    const now = new Date().toISOString();
    saveToStorage("staff", list.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s)));
  }

  async deleteStaff(id: string): Promise<void> {
    const list = await this.getStaff();
    saveToStorage("staff", list.filter((s) => s.id !== id));
  }

  async getContacts(): Promise<OzipzContact[]> {
    return loadFromStorage<OzipzContact[]>("contacts", []);
  }

  async addContact(contact: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">): Promise<OzipzContact> {
    const list = await this.getContacts();
    const id = generateId("cnt");
    const now = new Date().toISOString();
    const created: OzipzContact = { ...contact, id, createdAt: now, updatedAt: now };
    saveToStorage("contacts", [created, ...list]);
    return created;
  }

  async updateContact(id: string, updates: Partial<OzipzContact>): Promise<void> {
    return withStorageRollback(["contacts", "participations"], async () => {
      const list = await this.getContacts();
      const now = new Date().toISOString();
      const next = list.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c));
      saveToStorage("contacts", next);
      const updated = next.find((c) => c.id === id);
      if (updated) saveToStorage("participations", syncCoordinatorContact(this.getParticipations(), updated));
    });
  }

  async deleteContact(id: string): Promise<void> {
    return withStorageRollback(["contacts", "participations"], async () => {
      const list = await this.getContacts();
      saveToStorage("contacts", list.filter((c) => c.id !== id));
      saveToStorage("participations", unlinkCoordinatorContact(this.getParticipations(), id));
    });
  }

  private getParticipations(): OzipzSchoolParticipation[] {
    return loadFromStorage<OzipzSchoolParticipation[]>("participations", []);
  }
}
