import type {
  OzipzFacility, FacilityActivitySummary, OzipzSchoolParticipation,
  OzipzAction, OzipzDistribution, OzipzScheduleEvent, OzipzJrwaCase,
  OzipzLetter, OzipzScan, OzipzContact, OzipzRegisterItem,
} from "../../../features/ozipz/types/ozipz.types";
import type { IFacilitiesRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { assertNoClosedActionReference, loadFromStorage, saveToStorage, withStorageRollback } from "./storage";

export class FallbackFacilitiesRepository implements IFacilitiesRepository {
  async getFacilities(): Promise<OzipzFacility[]> {
    return loadFromStorage<OzipzFacility[]>("facilities", []);
  }

  async addFacility(fac: Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">): Promise<OzipzFacility> {
    const list = await this.getFacilities();
    const id = generateId("fac");
    const now = new Date().toISOString();
    const created: OzipzFacility = { ...fac, id, createdAt: now, updatedAt: now };
    saveToStorage("facilities", [...list, created]);
    return created;
  }

  async updateFacility(id: string, updates: Partial<OzipzFacility>): Promise<void> {
    const list = await this.getFacilities();
    const now = new Date().toISOString();
    saveToStorage("facilities", list.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: now } : f)));
  }

  async deleteFacility(id: string): Promise<void> {
    assertNoClosedActionReference("facilityId", id);
    return withStorageRollback(["facilities", "participations", "actions", "distributions", "schedules", "jrwaCases", "letters", "scans", "contacts", "registers"], async () => {
      const linked = loadFromStorage<OzipzSchoolParticipation[]>("participations", []);
      if (linked.some((row) => row.facilityId === id)) throw new Error("Nie można usunąć placówki z zapisanymi udziałami. Najpierw uporządkuj zgłoszenia.");
      const list = await this.getFacilities();
      saveToStorage("facilities", list.filter((f) => f.id !== id).map((f) => (f.parentFacilityId === id ? { ...f, parentFacilityId: undefined } : f)));
      const parts = loadFromStorage<OzipzSchoolParticipation[]>("participations", []);
      saveToStorage("participations", parts.filter((part) => part.facilityId !== id));
      const actions = loadFromStorage<OzipzAction[]>("actions", []);
      saveToStorage("actions", actions.map((a) => (a.facilityId === id ? { ...a, facilityId: undefined } : a)));
      const dists = loadFromStorage<OzipzDistribution[]>("distributions", []);
      saveToStorage("distributions", dists.map((d) => (d.facilityId === id ? { ...d, facilityId: undefined } : d)));
      const schs = loadFromStorage<OzipzScheduleEvent[]>("schedules", []);
      saveToStorage("schedules", schs.map((s) => (s.facilityId === id ? { ...s, facilityId: undefined } : s)));
      const jrwa = loadFromStorage<OzipzJrwaCase[]>("jrwaCases", []);
      saveToStorage("jrwaCases", jrwa.map((j) => (j.facilityId === id ? { ...j, facilityId: undefined, facilityName: undefined } : j)));
      const letters = loadFromStorage<OzipzLetter[]>("letters", []);
      saveToStorage("letters", letters.map((l) => (l.facilityId === id ? { ...l, facilityId: undefined } : l)));
      const scans = loadFromStorage<OzipzScan[]>("scans", []);
      saveToStorage("scans", scans.map((s) => (s.facilityId === id ? { ...s, facilityId: undefined } : s)));
      const contacts = loadFromStorage<OzipzContact[]>("contacts", []);
      saveToStorage("contacts", contacts.map((c) => (c.facilityId === id ? { ...c, facilityId: undefined } : c)));
      const registers = loadFromStorage<OzipzRegisterItem[]>("registers", []);
      saveToStorage("registers", registers.map((r) => (r.facilityId === id ? { ...r, facilityId: undefined, facilityName: undefined } : r)));
    });
  }

  async batchUpsertFacilities(facilities: OzipzFacility[]): Promise<OzipzFacility[]> {
    const map = new Map<string, OzipzFacility>();
    (await this.getFacilities()).forEach((f) => map.set(f.id, f));
    facilities.forEach((f) => map.set(f.id, f));
    const merged = Array.from(map.values());
    saveToStorage("facilities", merged);
    return merged;
  }

  async getFacilityActivitySummary(facilityId: string): Promise<FacilityActivitySummary> {
    const fac = (await this.getFacilities()).find((f) => f.id === facilityId);
    const parts = loadFromStorage<OzipzSchoolParticipation[]>("participations", []).filter((p) => p.facilityId === facilityId);
    const acts = loadFromStorage<OzipzAction[]>("actions", []).filter((a) => a.facilityId === facilityId);
    const dists = loadFromStorage<OzipzDistribution[]>("distributions", []).filter((d) => d.facilityId === facilityId);
    // Uczestnicy programów są już liczeni w działaniach, więc sumujemy tylko działania (jak widok SQLite).
    const totalPupils = acts.reduce((acc, a) => acc + a.participantsCount, 0);
    const totalMaterials = dists.reduce((acc, d) => acc + d.quantity, 0);
    const lastDate = acts.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

    return {
      facilityId,
      facilityName: fac ? fac.name : "Nieznana",
      programsCount: parts.length,
      actionsCount: acts.length,
      totalPupilsReached: totalPupils,
      totalMaterialsReceived: totalMaterials,
      lastActionDate: lastDate,
    };
  }
}
