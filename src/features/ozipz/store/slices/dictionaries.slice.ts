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
    for (const map of mappings) {
      const existing = get().dictionaryItems.find(
        (d) => d.dictType === "register_mapping" && d.code === map.activityType
      );
      if (existing) {
        await get().updateDictionaryItem(existing.id, {
          description: JSON.stringify(map.registers),
        });
      } else {
        await get().addDictionaryItem({
          dictType: "register_mapping",
          code: map.activityType,
          label: map.activityType,
          description: JSON.stringify(map.registers),
          isSystem: false,
        });
      }
    }
  },
});
