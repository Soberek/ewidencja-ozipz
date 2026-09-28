import { OzipzDbService } from "../../../../db/client";
import type { MaterialsSlice, SliceCreator } from "./types";

export const createMaterialsSlice: SliceCreator<MaterialsSlice> = (set) => ({
  materials: [],
  distributions: [],

  addMaterial: async (mat) => {
    const created = await OzipzDbService.addMaterial(mat);
    set((state) => ({ materials: [created, ...state.materials] }));
    return created;
  },

  updateMaterial: async (id, updates) => {
    await OzipzDbService.updateMaterial(id, updates);
    set((state) => ({
      materials: state.materials.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
    }));
  },

  deleteMaterial: async (id) => {
    await OzipzDbService.deleteMaterial(id);
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
      actions: state.actions.map((a) => (a.materialId === id ? { ...a, materialId: undefined } : a)),
      distributions: state.distributions.map((d) =>
        d.materialId === id ? { ...d, materialId: undefined } : d
      ),
    }));
  },

  addDistribution: async (dist) => {
    const created = await OzipzDbService.addDistribution(dist);
    set((state) => ({ distributions: [created, ...state.distributions] }));
    return created;
  },

  updateDistribution: async (id, updates) => {
    await OzipzDbService.updateDistribution(id, updates);
    set((state) => ({
      distributions: state.distributions.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },

  deleteDistribution: async (id) => {
    await OzipzDbService.deleteDistribution(id);
    set((state) => ({ distributions: state.distributions.filter((d) => d.id !== id) }));
  },
});
