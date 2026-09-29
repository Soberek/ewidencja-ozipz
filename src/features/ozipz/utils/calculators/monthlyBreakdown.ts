import type { OzipzAction } from "../../types/ozipz.types";
import { isProgramAction } from "./jrwaClassification";

export interface MonthlyBreakdownRow {
  monthKey: string;
  monthNumber: number;
  monthName: string;
  shortName: string;
  year: string;
  label: string;
  icon: string;
  tasksCount: number;
  actionsCount: number;
  recipientsCount: number;
  materialsCount: number;
  doneCount: number;
  plannedCount: number;
  percentageOfMax: number;
}

export type ActionCategoryFilter = "all" | "program" | "non_program";

export interface MonthlySummaryResult {
  rows: MonthlyBreakdownRow[];
  totalTasks: number;
  totalActions: number;
  totalRecipients: number;
  totalMaterials: number;
  totalDone: number;
  maxMonthlyActions: number;
}

export function calculateMonthlySummary(
  actions: OzipzAction[],
  yearFilter: string = String(new Date().getFullYear()),
  categoryFilter: ActionCategoryFilter = "all"
): MonthlySummaryResult {
  const monthsMeta = [
    { num: "01", name: "Styczeń", short: "Sty", icon: "❄" },
    { num: "02", name: "Luty", short: "Lut", icon: "🥣" },
    { num: "03", name: "Marzec", short: "Mar", icon: "🌸" },
    { num: "04", name: "Kwiecień", short: "Kwi", icon: "🌱" },
    { num: "05", name: "Maj", short: "Maj", icon: "🌞" },
    { num: "06", name: "Czerwiec", short: "Cze", icon: "🌻" },
    { num: "07", name: "Lipiec", short: "Lip", icon: "🏖" },
    { num: "08", name: "Sierpień", short: "Sie", icon: "🌳" },
    { num: "09", name: "Wrzesień", short: "Wrz", icon: "🍂" },
    { num: "10", name: "Październik", short: "Paź", icon: "🍁" },
    { num: "11", name: "Listopad", short: "Lis", icon: "🌧" },
    { num: "12", name: "Grudzień", short: "Gru", icon: "🎄" },
  ];

  const yearActions = actions.filter((a) => {
    if (a.status === "odwolane" || a.status === "cancelled" || a.status === "anulowane") return false;
    if (a.date && yearFilter !== "all" && !a.date.startsWith(yearFilter)) return false;
    if (categoryFilter === "program") return isProgramAction(a);
    if (categoryFilter === "non_program") return !isProgramAction(a);
    return true;
  });
  
  let maxMonthlyActions = 0;
  const rawMonthMap = new Map<string, { tasks: number; actions: number; recipients: number; materials: number; done: number; planned: number }>();

  for (const a of yearActions) {
    if (!a.date) continue;
    const mNum = a.date.slice(5, 7);
    if (!rawMonthMap.has(mNum)) {
      rawMonthMap.set(mNum, { tasks: 0, actions: 0, recipients: 0, materials: 0, done: 0, planned: 0 });
    }
    const entry = rawMonthMap.get(mNum)!;
    entry.tasks += 1;
    const actCount = Number(a.numberOfActions) || 1;
    entry.actions += actCount;
    entry.recipients += Number(a.participantsCount) || 0;
    entry.materials += Number(a.materialsDistributedCount) || 0;
    if (a.status === "planowane" || a.status === "planned") {
      entry.planned += 1;
    } else {
      entry.done += 1;
    }
  }

  for (const entry of rawMonthMap.values()) {
    if (entry.actions > maxMonthlyActions) {
      maxMonthlyActions = entry.actions;
    }
  }

  const rows: MonthlyBreakdownRow[] = [];
  let totalTasks = 0;
  let totalActions = 0;
  let totalRecipients = 0;
  let totalMaterials = 0;
  let totalDone = 0;

  for (const m of monthsMeta) {
    const data = rawMonthMap.get(m.num);
    if (!data) continue;

    const percentageOfMax = maxMonthlyActions > 0 ? Math.round((data.actions / maxMonthlyActions) * 100) : 0;
    
    rows.push({
      monthKey: `${yearFilter}-${m.num}`,
      monthNumber: parseInt(m.num, 10),
      monthName: m.name,
      shortName: m.short,
      year: yearFilter,
      label: `${m.icon} ${m.short} ${yearFilter === "all" ? "" : yearFilter}`.trim(),
      icon: m.icon,
      tasksCount: data.tasks,
      actionsCount: data.actions,
      recipientsCount: data.recipients,
      materialsCount: data.materials,
      doneCount: data.done,
      plannedCount: data.planned,
      percentageOfMax,
    });

    totalTasks += data.tasks;
    totalActions += data.actions;
    totalRecipients += data.recipients;
    totalMaterials += data.materials;
    totalDone += data.done;
  }

  return {
    rows,
    totalTasks,
    totalActions,
    totalRecipients,
    totalMaterials,
    totalDone,
    maxMonthlyActions,
  };
}
