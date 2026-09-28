import type { OzipzMaterial, OzipzDistribution, OzipzAction } from "../../../features/ozipz/types/ozipz.types";
import { MIGRATED_FIREBASE_DATA } from "../../../features/ozipz/data/migratedData";
import type { IMaterialsRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";

export class FallbackMaterialsRepository implements IMaterialsRepository {
  async getMaterials(): Promise<OzipzMaterial[]> {
    return loadFromStorage<OzipzMaterial[]>("materials", MIGRATED_FIREBASE_DATA.materials);
  }

  async addMaterial(mat: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">): Promise<OzipzMaterial> {
    const list = await this.getMaterials();
    const id = generateId("mat");
    const now = new Date().toISOString();
    const created: OzipzMaterial = { ...mat, id, createdAt: now, updatedAt: now };
    saveToStorage("materials", [...list, created]);
    return created;
  }

  async updateMaterial(id: string, updates: Partial<OzipzMaterial>): Promise<void> {
    const list = await this.getMaterials();
    const now = new Date().toISOString();
    saveToStorage("materials", list.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: now } : m)));
  }

  async deleteMaterial(id: string): Promise<void> {
    const list = await this.getMaterials();
    saveToStorage("materials", list.filter((m) => m.id !== id));
    const actions = loadFromStorage<OzipzAction[]>("actions", MIGRATED_FIREBASE_DATA.actions);
    saveToStorage("actions", actions.map((a) => (a.materialId === id ? { ...a, materialId: undefined } : a)));
    const dists = await this.getDistributions();
    saveToStorage("distributions", dists.map((d) => (d.materialId === id ? { ...d, materialId: undefined } : d)));
  }

  async getDistributions(): Promise<OzipzDistribution[]> {
    return loadFromStorage<OzipzDistribution[]>("distributions", MIGRATED_FIREBASE_DATA.distributions);
  }

  async addDistribution(dist: Omit<OzipzDistribution, "id" | "createdAt">): Promise<OzipzDistribution> {
    const list = await this.getDistributions();
    const id = generateId("dist");
    const now = new Date().toISOString();
    const created: OzipzDistribution = { ...dist, id, createdAt: now, updatedAt: now };
    saveToStorage("distributions", [created, ...list]);
    return created;
  }

  async updateDistribution(id: string, updates: Partial<OzipzDistribution>): Promise<void> {
    const list = await this.getDistributions();
    const now = new Date().toISOString();
    saveToStorage("distributions", list.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: now } : d)));
  }

  async deleteDistribution(id: string): Promise<void> {
    const list = await this.getDistributions();
    saveToStorage("distributions", list.filter((d) => d.id !== id));
  }
}
