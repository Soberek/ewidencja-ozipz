import type {
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzAction,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzLetter,
  OzipzScan,
  OzipzRegisterItem,
} from "../../../features/ozipz/types/ozipz.types";
import { MIGRATED_FIREBASE_DATA } from "../../../features/ozipz/data/migratedData";
import type { IProgramsRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";

export class FallbackProgramsRepository implements IProgramsRepository {
  async getPrograms(): Promise<OzipzProgram[]> {
    const raw = loadFromStorage<OzipzProgram[]>("programs", MIGRATED_FIREBASE_DATA.programs);
    return raw.map((p) => {
      if (p.id === "sprawozdawczosc-statystyczna" || p.name.toLowerCase().includes("sprawozdawczość")) {
        return { ...p, jrwaSymbol: "0442" };
      }
      return p;
    });
  }

  async addProgram(prog: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">): Promise<OzipzProgram> {
    const list = await this.getPrograms();
    const id = generateId("prog");
    const now = new Date().toISOString();
    const created: OzipzProgram = { ...prog, id, createdAt: now, updatedAt: now };
    saveToStorage("programs", [...list, created]);
    return created;
  }

  async updateProgram(id: string, updates: Partial<OzipzProgram>): Promise<void> {
    const list = await this.getPrograms();
    const now = new Date().toISOString();
    saveToStorage("programs", list.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
  }

  async deleteProgram(id: string): Promise<void> {
    const linked = loadFromStorage<OzipzSchoolParticipation[]>("participations", MIGRATED_FIREBASE_DATA.participations);
    if (linked.some((row) => row.programId === id)) throw new Error("Nie można usunąć programu z zapisanymi udziałami. Najpierw uporządkuj zgłoszenia.");
    const list = await this.getPrograms();
    saveToStorage("programs", list.filter((p) => p.id !== id));
    const parts = await this.getParticipations();
    saveToStorage("participations", parts.filter((part) => part.programId !== id));
    const actions = loadFromStorage<OzipzAction[]>("actions", MIGRATED_FIREBASE_DATA.actions);
    saveToStorage("actions", actions.map((a) => (a.programId === id ? { ...a, programId: undefined, programName: undefined } : a)));
    const schs = loadFromStorage<OzipzScheduleEvent[]>("schedules", MIGRATED_FIREBASE_DATA.schedules);
    saveToStorage("schedules", schs.map((s) => (s.programId === id ? { ...s, programId: undefined, programName: undefined } : s)));
    const jrwa = loadFromStorage<OzipzJrwaCase[]>("jrwaCases", MIGRATED_FIREBASE_DATA.jrwaCases);
    saveToStorage("jrwaCases", jrwa.map((j) => (j.programId === id ? { ...j, programId: undefined, programName: undefined } : j)));
    const letters = loadFromStorage<OzipzLetter[]>("letters", MIGRATED_FIREBASE_DATA.letters);
    saveToStorage("letters", letters.map((l) => (l.programId === id ? { ...l, programId: undefined } : l)));
    const scans = loadFromStorage<OzipzScan[]>("scans", MIGRATED_FIREBASE_DATA.scans);
    saveToStorage("scans", scans.map((s) => (s.programId === id ? { ...s, programId: undefined, programName: undefined } : s)));
    const registers = loadFromStorage<OzipzRegisterItem[]>("registers", MIGRATED_FIREBASE_DATA.registers);
    saveToStorage("registers", registers.map((r) => (r.programId === id ? { ...r, programId: undefined, programName: undefined } : r)));
  }

  async getParticipations(): Promise<OzipzSchoolParticipation[]> {
    return loadFromStorage<OzipzSchoolParticipation[]>("participations", MIGRATED_FIREBASE_DATA.participations);
  }

  async addParticipation(part: Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">): Promise<OzipzSchoolParticipation> {
    const list = await this.getParticipations();
    this.assertUniqueParticipation(list, part);
    const id = generateId("part");
    const now = new Date().toISOString();
    const created: OzipzSchoolParticipation = { ...part, id, createdAt: now, updatedAt: now };
    saveToStorage("participations", [...list, created]);
    return created;
  }

  async updateParticipation(id: string, updates: Partial<OzipzSchoolParticipation>): Promise<void> {
    const list = await this.getParticipations();
    const current = list.find((row) => row.id === id);
    if (!current) return;
    this.assertUniqueParticipation(list.filter((row) => row.id !== id), { ...current, ...updates });
    const now = new Date().toISOString();
    saveToStorage("participations", list.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
  }

  private assertUniqueParticipation(list: OzipzSchoolParticipation[], part: Pick<OzipzSchoolParticipation, "programId" | "facilityId" | "schoolYear">): void {
    if (list.some((row) => row.programId === part.programId && row.facilityId === part.facilityId && row.schoolYear === part.schoolYear)) {
      throw new Error("Placówka jest już zgłoszona do tego programu w wybranym roku szkolnym.");
    }
  }

  async deleteParticipation(id: string): Promise<void> {
    const list = await this.getParticipations();
    saveToStorage("participations", list.filter((p) => p.id !== id));
  }
}
