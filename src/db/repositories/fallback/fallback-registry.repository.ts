import type {
  OzipzLetter,
  OzipzScan,
  OzipzTemplate,
  OzipzPublication,
  OzipzRegisterItem,
} from "../../../features/ozipz/types/ozipz.types";
import { MIGRATED_FIREBASE_DATA } from "../../../features/ozipz/data/migratedData";
import type { IRegistryRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";

export class FallbackRegistryRepository implements IRegistryRepository {
  // Letters
  async getLetters(): Promise<OzipzLetter[]> {
    return loadFromStorage<OzipzLetter[]>("letters", MIGRATED_FIREBASE_DATA.letters);
  }
  async addLetter(letter: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">): Promise<OzipzLetter> {
    const list = await this.getLetters();
    const id = generateId("let");
    const now = new Date().toISOString();
    const created: OzipzLetter = { ...letter, id, createdAt: now, updatedAt: now };
    saveToStorage("letters", [created, ...list]);
    return created;
  }
  async updateLetter(id: string, updates: Partial<OzipzLetter>): Promise<void> {
    const list = await this.getLetters();
    const now = new Date().toISOString();
    saveToStorage("letters", list.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: now } : l)));
  }
  async deleteLetter(id: string): Promise<void> {
    const list = await this.getLetters();
    saveToStorage("letters", list.filter((l) => l.id !== id));
  }

  // Scans
  async getScans(): Promise<OzipzScan[]> {
    return loadFromStorage<OzipzScan[]>("scans", MIGRATED_FIREBASE_DATA.scans);
  }
  async addScan(scan: Omit<OzipzScan, "id" | "createdAt">): Promise<OzipzScan> {
    const list = await this.getScans();
    const id = generateId("scan");
    const now = new Date().toISOString();
    const created: OzipzScan = { ...scan, id, createdAt: now };
    saveToStorage("scans", [created, ...list]);
    return created;
  }
  async deleteScan(id: string): Promise<void> {
    const list = await this.getScans();
    saveToStorage("scans", list.filter((s) => s.id !== id));
  }

  // Templates
  async getTemplates(): Promise<OzipzTemplate[]> {
    return loadFromStorage<OzipzTemplate[]>("templates", MIGRATED_FIREBASE_DATA.templates);
  }
  async addTemplate(tpl: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">): Promise<OzipzTemplate> {
    const list = await this.getTemplates();
    const id = generateId("tpl");
    const now = new Date().toISOString();
    const created: OzipzTemplate = { ...tpl, id, createdAt: now, updatedAt: now };
    saveToStorage("templates", [...list, created]);
    return created;
  }
  async updateTemplate(id: string, updates: Partial<OzipzTemplate>): Promise<void> {
    const list = await this.getTemplates();
    const now = new Date().toISOString();
    saveToStorage("templates", list.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t)));
  }
  async deleteTemplate(id: string): Promise<void> {
    const list = await this.getTemplates();
    saveToStorage("templates", list.filter((t) => t.id !== id));
  }

  // Publications
  async getPublications(): Promise<OzipzPublication[]> {
    return loadFromStorage<OzipzPublication[]>("publications", MIGRATED_FIREBASE_DATA.publications);
  }
  async addPublication(pub: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">): Promise<OzipzPublication> {
    const list = await this.getPublications();
    const id = generateId("pub");
    const now = new Date().toISOString();
    const created: OzipzPublication = { ...pub, id, createdAt: now, updatedAt: now };
    saveToStorage("publications", [created, ...list]);
    return created;
  }
  async updatePublication(id: string, updates: Partial<OzipzPublication>): Promise<void> {
    const list = await this.getPublications();
    const now = new Date().toISOString();
    saveToStorage("publications", list.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
  }
  async deletePublication(id: string): Promise<void> {
    const list = await this.getPublications();
    saveToStorage("publications", list.filter((p) => p.id !== id));
  }

  // Registers
  async getRegisters(): Promise<OzipzRegisterItem[]> {
    return loadFromStorage<OzipzRegisterItem[]>("registers", MIGRATED_FIREBASE_DATA.registers);
  }
  async addRegister(reg: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzRegisterItem> {
    const list = await this.getRegisters();
    const id = generateId("reg");
    const now = new Date().toISOString();
    const created: OzipzRegisterItem = { ...reg, id, createdAt: now, updatedAt: now };
    saveToStorage("registers", [created, ...list]);
    return created;
  }
  async updateRegister(id: string, updates: Partial<OzipzRegisterItem>): Promise<void> {
    const list = await this.getRegisters();
    const now = new Date().toISOString();
    saveToStorage("registers", list.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: now } : r)));
  }
  async deleteRegister(id: string): Promise<void> {
    const list = await this.getRegisters();
    saveToStorage("registers", list.filter((r) => r.id !== id));
  }
}
