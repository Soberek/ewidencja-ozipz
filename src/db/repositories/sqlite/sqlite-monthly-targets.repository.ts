import type { OzipzMonthlyTarget } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, MonthlyTargetSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IMonthlyTargetsRepository } from "../interfaces";
import type { OzipzYearlyMonthlyTargets } from "../../../features/ozipz/utils/monthlyTargetsUtils";
import { generateId } from "../id-generator";
import { parseMetricPlan, type MetricPlanState } from "../../../features/ozipz/components/reports/components/reportConstants";

const metricPlanKey = (year: number) => `metric_plan:${year}`;

function parseJsonPlan(value: string): MetricPlanState | null {
  try {
    return parseMetricPlan(JSON.parse(value));
  } catch {
    return null;
  }
}

export class SqliteMonthlyTargetsRepository implements IMonthlyTargetsRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getMetricPlan(year: number): Promise<MetricPlanState | null> {
    const rows = await this.db.select<Array<{ value: string }>>("SELECT value FROM ozipz_meta WHERE key = $1", [metricPlanKey(year)]);
    if (rows[0]) return parseJsonPlan(rows[0].value);
    return this.importLegacyMetricPlan(year);
  }

  /** Wersje do 1.1.0 trzymały plan w pamięci przeglądarki — przenosimy go do bazy przy pierwszym odczycie. */
  private async importLegacyMetricPlan(year: number): Promise<MetricPlanState | null> {
    const legacyKey = `ozipz_metric_plan_${year}`;
    let legacy: MetricPlanState | null = null;
    try {
      legacy = parseJsonPlan(globalThis.localStorage?.getItem(legacyKey) ?? "null");
    } catch {
      return null;
    }
    if (!legacy) return null;
    await this.saveMetricPlan(year, legacy);
    try { globalThis.localStorage.removeItem(legacyKey); } catch { /* plan jest już w bazie */ }
    return legacy;
  }

  async saveMetricPlan(year: number, plan: MetricPlanState): Promise<void> {
    await this.db.execute("INSERT OR REPLACE INTO ozipz_meta (key, value) VALUES ($1, $2)", [metricPlanKey(year), JSON.stringify(plan)]);
  }

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
