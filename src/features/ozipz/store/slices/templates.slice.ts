import { OzipzDbService } from "../../../../db/client";
import type { TemplatesSlice, SliceCreator } from "./types";

export const createTemplatesSlice: SliceCreator<TemplatesSlice> = (set) => ({
  templates: [],

  addTemplate: async (tpl) => {
    const created = await OzipzDbService.addTemplate(tpl);
    set((state) => ({ templates: [...state.templates, created] }));
    return created;
  },

  updateTemplate: async (id, updates) => {
    await OzipzDbService.updateTemplate(id, updates);
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },

  deleteTemplate: async (id) => {
    await OzipzDbService.deleteTemplate(id);
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
});
