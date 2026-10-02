import type { OzipzDictionaryItem } from "../../../features/ozipz/types/ozipz.types";
import type { IDictionariesRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage, withStorageRollback } from "./storage";
import type { RegisterMappingSave } from "../../types";

export class FallbackDictionariesRepository implements IDictionariesRepository {
  async getDictionaryItems(): Promise<OzipzDictionaryItem[]> {
    const raw = loadFromStorage<OzipzDictionaryItem[]>("dictionaries", []);
    const result = raw.filter(
      (d) => d.dictType !== "topic" && d.dictType !== "tematyki" && !d.id.startsWith("dict-jrw-") && d.code !== "9010" && d.code !== "070"
    );
    if (result.length !== raw.length) {
      saveToStorage("dictionaries", result);
    }
    return result;
  }

  async addDictionaryItem(item: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzDictionaryItem> {
    const list = await this.getDictionaryItems();
    if (list.some((entry) => entry.dictType === item.dictType && entry.code === item.code)) {
      throw new Error("Pozycja słownika o tym typie i kodzie już istnieje.");
    }
    const id = generateId("dict");
    const now = new Date().toISOString();
    const created: OzipzDictionaryItem = { ...item, id, createdAt: now, updatedAt: now };
    saveToStorage("dictionaries", [...list, created]);
    return created;
  }

  async updateDictionaryItem(id: string, updates: Partial<OzipzDictionaryItem>): Promise<void> {
    const list = await this.getDictionaryItems();
    const current = list.find((entry) => entry.id === id);
    if (!current) return;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => value !== undefined && key !== "id" && key !== "createdAt" && key !== "updatedAt")
    );
    const updated = { ...current, ...cleanUpdates };
    if ((updated.dictType !== current.dictType || updated.code !== current.code) &&
        list.some((entry) => entry.id !== id && entry.dictType === updated.dictType && entry.code === updated.code)) {
      throw new Error("Pozycja słownika o tym typie i kodzie już istnieje.");
    }
    const now = new Date().toISOString();
    saveToStorage("dictionaries", list.map((d) => (d.id === id ? { ...d, ...cleanUpdates, updatedAt: now } : d)));
  }

  async deleteDictionaryItem(id: string): Promise<void> {
    const list = await this.getDictionaryItems();
    const item = list.find((d) => d.id === id);
    if (item?.isSystem) return;
    saveToStorage("dictionaries", list.filter((d) => d.id !== id));
  }

  async saveRegisterMappings(mappings: RegisterMappingSave[]): Promise<OzipzDictionaryItem[]> {
    return withStorageRollback(["dictionaries"], async () => {
      const items = await this.getDictionaryItems();
      const byCode = new Map(items.filter((item) => item.dictType === "register_mapping").map((item) => [item.code, item]));
      const now = new Date().toISOString();
      const additions = new Map<string, OzipzDictionaryItem>();
      for (const mapping of mappings) {
        const description = JSON.stringify(mapping.registers);
        const existing = byCode.get(mapping.activityType);
        if (existing) {
          const updated = { ...existing, description, updatedAt: now };
          byCode.set(mapping.activityType, updated);
          if (additions.has(mapping.activityType)) additions.set(mapping.activityType, updated);
        } else {
          const created: OzipzDictionaryItem = {
            id: generateId("dict"), dictType: "register_mapping", code: mapping.activityType,
            label: mapping.activityType, description, isSystem: false, createdAt: now, updatedAt: now,
          };
          byCode.set(mapping.activityType, created);
          additions.set(mapping.activityType, created);
        }
      }
      const next = [...items.map((item) => item.dictType === "register_mapping" ? byCode.get(item.code)! : item), ...additions.values()];
      saveToStorage("dictionaries", next);
      return next;
    });
  }
}
