import type { OzipzMonthlyTarget } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, MonthlyTargetSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IMonthlyTargetsRepository } from "../interfaces";
import type { OzipzYearlyMonthlyTargets } from "../../../features/ozipz/utils/monthlyTargetsUtils";
import { generateId } from "../id-generator";

export class SqliteMonthlyTargetsRepository implements IMonthlyTargetsRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]> {
    const query = year !== undefined
      ? "SELECT * FROM ozipz_monthly_targets WHERE year = $1 ORDER BY month ASC"
      : "SELECT * FROM ozipz_monthly_targets ORDER BY year ASC, month ASC";
    const params = year !== undefined ? [year] : [];
    const rows = await this.db.select<MonthlyTargetSqlRow[]>(query, params);
    return rows.map(Mappers.toMonthlyTarget);
  }

  async saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]> {
    const now = new Date().toISOString();
    try {
      await this.db.execute("BEGIN TRANSACTION;");
      for (let m = 1; m <= 12; m++) {
        const t = targets[m] || {
          programActions: 0,
          programRecipients: 0,
          otherActions: 0,
          otherRecipients: 0,
          notes: "",
        };
        const id = generateId(`mt-${year}-${m}`);
        await this.db.execute(
          `INSERT INTO ozipz_monthly_targets (
            id, year, month, program_actions, program_recipients, other_actions, other_recipients, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT(year, month) DO UPDATE SET
            program_actions = excluded.program_actions,
            program_recipients = excluded.program_recipients,
            other_actions = excluded.other_actions,
            other_recipients = excluded.other_recipients,
            notes = excluded.notes,
            updated_at = excluded.updated_at;`,
          [id, year, m, t.programActions || 0, t.programRecipients || 0, t.otherActions || 0, t.otherRecipients || 0, t.notes || null, now, now]
        );
      }
      await this.db.execute("COMMIT;");
    } catch (err) {
      await this.db.execute("ROLLBACK;");
      throw err;
    }
    return this.getMonthlyTargets(year);
  }
}
