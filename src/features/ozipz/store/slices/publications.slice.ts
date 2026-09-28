import { OzipzDbService } from "../../../../db/client";
import type { PublicationsSlice, SliceCreator } from "./types";

export const createPublicationsSlice: SliceCreator<PublicationsSlice> = (set) => ({
  publications: [],

  addPublication: async (pub) => {
    const created = await OzipzDbService.addPublication(pub);
    set((state) => ({ publications: [created, ...state.publications] }));
    return created;
  },

  updatePublication: async (id, updates) => {
    await OzipzDbService.updatePublication(id, updates);
    set((state) => ({
      publications: state.publications.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deletePublication: async (id) => {
    await OzipzDbService.deletePublication(id);
    set((state) => ({ publications: state.publications.filter((p) => p.id !== id) }));
  },
});
