import type { OzipzDictionaryItem } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, DictionarySqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IDictionariesRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteDictionariesRepository implements IDictionariesRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getDictionaryItems(): Promise<OzipzDictionaryItem[]> {
    const rows = await this.db.select<DictionarySqlRow[]>("SELECT * FROM ozipz_dictionaries ORDER BY dict_type ASC, label ASC");
    return rows.map(Mappers.toDictionary);
  }

  async addDictionaryItem(item: Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">): Promise<OzipzDictionaryItem> {
    const id = generateId("dict");
    const now = new Date().toISOString();
    const newItem: OzipzDictionaryItem = { ...item, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_dictionaries (id, dict_type, code, label, description, postal_code, kind, gis_category, is_system, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [newItem.id, newItem.dictType, newItem.code, newItem.label, newItem.description || null, newItem.postalCode || null, newItem.kind || null, newItem.gisCategory || null, newItem.isSystem ? 1 : 0, newItem.createdAt, newItem.updatedAt]
    );
    return newItem;
  }

  async updateDictionaryItem(id: string, updates: Partial<OzipzDictionaryItem>): Promise<void> {
    const now = new Date().toISOString();
    const current = (await this.getDictionaryItems()).find((d) => d.id === id);
    if (!current) return;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const merged = { ...current, ...cleanUpdates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_dictionaries SET code = $1, label = $2, description = $3, postal_code = $4, kind = $5, gis_category = $6, updated_at = $7 WHERE id = $8",
      [merged.code, merged.label, merged.description || null, merged.postalCode || null, merged.kind || null, merged.gisCategory || null, merged.updatedAt, id]
    );
  }

  async deleteDictionaryItem(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_dictionaries WHERE id = $1 AND is_system = 0", [id]);
  }
}
