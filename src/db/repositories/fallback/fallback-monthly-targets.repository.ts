import type { OzipzMonthlyTarget } from "../../../features/ozipz/types/ozipz.types";
import type { IMonthlyTargetsRepository } from "../interfaces";
import type { OzipzYearlyMonthlyTargets } from "../../../features/ozipz/utils/monthlyTargetsUtils";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage } from "./storage";
import { parseMetricPlan, type MetricPlanState } from "../../../features/ozipz/components/reports/components/reportConstants";

export class FallbackMonthlyTargetsRepository implements IMonthlyTargetsRepository {
  // Ten sam klucz („ozipz_metric_plan_<rok>”), pod którym plan był zapisywany wcześniej.
  async getMetricPlan(year: number): Promise<MetricPlanState | null> {
    return parseMetricPlan(loadFromStorage<unknown>(`metric_plan_${year}`, null));
  }

  async saveMetricPlan(year: number, plan: MetricPlanState): Promise<void> {
    saveToStorage(`metric_plan_${year}`, plan);
  }

  async getMonthlyTargets(year?: number): Promise<OzipzMonthlyTarget[]> {
    const all = loadFromStorage<OzipzMonthlyTarget[]>("monthly_targets", []);
    if (year !== undefined) {
      return all.filter((t) => t.year === year).sort((a, b) => a.month - b.month);
    }
    return all.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }

  async saveMonthlyTargets(year: number, targets: OzipzYearlyMonthlyTargets): Promise<OzipzMonthlyTarget[]> {
    const list = await this.getMonthlyTargets();
    const now = new Date().toISOString();
    const updated = list.filter((t) => t.year !== year);

    for (let m = 1; m <= 12; m++) {
      const t = targets[m] || {
        programActions: 0,
        programRecipients: 0,
        otherActions: 0,
        otherRecipients: 0,
        notes: "",
      };
      const existing = list.find((item) => item.year === year && item.month === m);
      const record: OzipzMonthlyTarget = {
        id: existing?.id || generateId(`mt-${year}-${m}`),
        year,
        month: m,
        programActions: t.programActions || 0,
        programRecipients: t.programRecipients || 0,
        otherActions: t.otherActions || 0,
        otherRecipients: t.otherRecipients || 0,
        notes: t.notes || undefined,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      updated.push(record);
    }
    saveToStorage("monthly_targets", updated);
    return updated.filter((t) => t.year === year).sort((a, b) => a.month - b.month);
  }
}
