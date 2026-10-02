import { OzipzDbService } from "../../../../db/client";
import type { DictionariesSlice, SliceCreator } from "./types";

export const createDictionariesSlice: SliceCreator<DictionariesSlice> = (set, get) => ({
  dictionaryItems: [],

  addDictionaryItem: async (item) => {
    const created = await OzipzDbService.addDictionaryItem(item);
    set((state) => ({ dictionaryItems: [...state.dictionaryItems, created] }));
    return created;
  },

  updateDictionaryItem: async (id, updates) => {
    await OzipzDbService.updateDictionaryItem(id, updates);
    set((state) => ({
      dictionaryItems: state.dictionaryItems.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },

  deleteDictionaryItem: async (id) => {
    const item = get().dictionaryItems.find((d) => d.id === id);
    if (item?.isSystem) {
      console.warn("Nie można usunąć chronionej pozycji systemowej słownika:", item.label);
      return;
    }
    await OzipzDbService.deleteDictionaryItem(id);
    set((state) => ({ dictionaryItems: state.dictionaryItems.filter((d) => d.id !== id) }));
  },

  saveRegisterMappings: async (mappings) => {
    const dictionaryItems = await OzipzDbService.saveRegisterMappings(mappings);
    set({ dictionaryItems });
  },
});
