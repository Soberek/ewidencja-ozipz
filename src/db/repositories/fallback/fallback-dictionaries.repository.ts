import type { OzipzDictionaryItem } from "../../../features/ozipz/types/ozipz.types";
import type { IDictionariesRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";

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
}
