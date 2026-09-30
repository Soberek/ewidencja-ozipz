import type { ISqlDatabase } from "../../types";
import type { IRozdzielnikTemplatesRepository } from "../interfaces";
import {
  parseRozdzielnikTemplate,
  sortRozdzielnikTemplates,
  type RozdzielnikTemplate,
} from "../../../features/ozipz/utils/rozdzielnikTemplates";

/** Każdy szablon to osobny wpis w ozipz_meta — zapis z dwóch komputerów nie nadpisuje całej listy. */
const KEY_PREFIX = "rozdzielnik_template:";

function parseJson(value: string): RozdzielnikTemplate | null {
  try {
    return parseRozdzielnikTemplate(JSON.parse(value));
  } catch {
    return null;
  }
}

export class SqliteRozdzielnikTemplatesRepository implements IRozdzielnikTemplatesRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getRozdzielnikTemplates(): Promise<RozdzielnikTemplate[]> {
    const rows = await this.db.select<Array<{ value: string }>>(
      "SELECT value FROM ozipz_meta WHERE substr(key, 1, $1) = $2",
      [KEY_PREFIX.length, KEY_PREFIX]
    );
    return sortRozdzielnikTemplates(rows.map((row) => parseJson(row.value)).filter((t): t is RozdzielnikTemplate => t !== null));
  }

  async saveRozdzielnikTemplate(template: RozdzielnikTemplate): Promise<void> {
    await this.db.execute("INSERT OR REPLACE INTO ozipz_meta (key, value) VALUES ($1, $2)", [KEY_PREFIX + template.id, JSON.stringify(template)]);
  }

  async deleteRozdzielnikTemplate(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_meta WHERE key = $1", [KEY_PREFIX + id]);
  }
}
