import { OzipzDbService } from "../../../../db/client";
import type { JrwaSlice, SliceCreator } from "./types";

export const createJrwaSlice: SliceCreator<JrwaSlice> = (set) => ({
  jrwaCases: [],

  addJrwaCase: async (c) => {
    const created = await OzipzDbService.addJrwaCase(c);
    set((state) => ({ jrwaCases: [created, ...state.jrwaCases] }));
    return created;
  },

  updateJrwaCase: async (id, updates) => {
    await OzipzDbService.updateJrwaCase(id, updates);
    set((state) => ({
      jrwaCases: state.jrwaCases.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  deleteJrwaCase: async (id) => {
    await OzipzDbService.deleteJrwaCase(id);
    set((state) => ({
      jrwaCases: state.jrwaCases.filter((c) => c.id !== id),
      actions: state.actions.map((a) => (a.jrwaCaseId === id ? { ...a, jrwaCaseId: undefined } : a)),
    }));
  },
});
