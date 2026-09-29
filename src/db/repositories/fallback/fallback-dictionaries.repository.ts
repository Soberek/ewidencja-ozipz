import type { OzipzDictionaryItem } from "../../../features/ozipz/types/ozipz.types";
import { KNOWN_JRWA_CATALOG } from "../../../features/ozipz/utils/programJrwaUtils";
import type { IDictionariesRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";

/** Oficjalny wykaz JRWA — jedyny słownik, który aplikacja dostarcza sama (tak samo jak w SQLite). */
const CANONICAL_JRWA: OzipzDictionaryItem[] = KNOWN_JRWA_CATALOG.map((d) => ({
  id: `dict_jrwa_${d.symbol.replace(/\./g, "_")}`,
  dictType: "jrwaSymbol",
  code: d.symbol,
  label: d.label,
  description: d.description || `Symbol JRWA ${d.symbol} w wykazie akt OZiPZ`,
  kind: d.kind || "PROGRAMOWE",
  gisCategory: d.gisCategory,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

export class FallbackDictionariesRepository implements IDictionariesRepository {
  async getDictionaryItems(): Promise<OzipzDictionaryItem[]> {
    const raw = loadFromStorage<OzipzDictionaryItem[]>("dictionaries", []);
    const cleaned = raw
      .filter((d) => d.dictType !== "topic" && d.dictType !== "tematyki" && !d.id.startsWith("dict-jrw-") && d.code !== "9010" && d.code !== "070")
      .map((d) => {
        if (d.dictType === "jrwaSymbol") {
          const canonical = CANONICAL_JRWA.find((c) => c.code === d.code);
          if (canonical) {
            return { ...d, label: canonical.label, description: canonical.description, kind: d.kind ?? canonical.kind, gisCategory: d.gisCategory ?? canonical.gisCategory };
          }
        }
        return d;
      });
    const jrwaCodes = new Set(cleaned.filter((d) => d.dictType === "jrwaSymbol").map((d) => d.code));
    const missingJrwa = CANONICAL_JRWA.filter((d) => !jrwaCodes.has(d.code));
    const result = [...cleaned, ...missingJrwa];
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
