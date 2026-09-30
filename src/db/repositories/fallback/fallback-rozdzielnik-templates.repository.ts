import type { IRozdzielnikTemplatesRepository } from "../interfaces";
import { loadFromStorage, saveToStorage } from "./storage";
import {
  parseRozdzielnikTemplate,
  sortRozdzielnikTemplates,
  type RozdzielnikTemplate,
} from "../../../features/ozipz/utils/rozdzielnikTemplates";

const STORAGE_KEY = "rozdzielnik_templates";

export class FallbackRozdzielnikTemplatesRepository implements IRozdzielnikTemplatesRepository {
  async getRozdzielnikTemplates(): Promise<RozdzielnikTemplate[]> {
    const raw = loadFromStorage<unknown[]>(STORAGE_KEY, []);
    return sortRozdzielnikTemplates(raw.map(parseRozdzielnikTemplate).filter((t): t is RozdzielnikTemplate => t !== null));
  }

  async saveRozdzielnikTemplate(template: RozdzielnikTemplate): Promise<void> {
    const others = (await this.getRozdzielnikTemplates()).filter((t) => t.id !== template.id);
    saveToStorage(STORAGE_KEY, [...others, template]);
  }

  async deleteRozdzielnikTemplate(id: string): Promise<void> {
    saveToStorage(STORAGE_KEY, (await this.getRozdzielnikTemplates()).filter((t) => t.id !== id));
  }
}
