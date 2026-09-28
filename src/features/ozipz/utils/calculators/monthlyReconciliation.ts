import type { MonthlyBreakdownRow, MonthlySummaryResult } from "./monthlyBreakdown";

export interface ExpectedMonthlyTarget {
  tasksCount?: number;
  actionsCount?: number;
  recipientsCount?: number;
  materialsCount?: number;
  doneCount?: number;
}

export type ExpectedMonthlyTargetsMap = Record<string, ExpectedMonthlyTarget>;

export interface MonthlyReconciliationFieldDiff {
  actual: number;
  expected: number;
  diff: number;
  matches: boolean;
}

export interface MonthlyReconciliationRow extends MonthlyBreakdownRow {
  expected?: ExpectedMonthlyTarget;
  isReconciled: boolean;
  hasMismatch: boolean;
  hasTargetData: boolean;
  fieldDiffs: {
    tasks: MonthlyReconciliationFieldDiff;
    actions: MonthlyReconciliationFieldDiff;
    recipients: MonthlyReconciliationFieldDiff;
    materials: MonthlyReconciliationFieldDiff;
    done: MonthlyReconciliationFieldDiff;
  };
}

export interface MonthlyReconciliationSummary {
  rows: MonthlyReconciliationRow[];
  totalTasksActual: number;
  totalTasksExpected: number;
  totalActionsActual: number;
  totalActionsExpected: number;
  totalRecipientsActual: number;
  totalRecipientsExpected: number;
  totalMaterialsActual: number;
  totalMaterialsExpected: number;
  totalDoneActual: number;
  totalDoneExpected: number;
  totalMismatchesCount: number;
  configuredMonthsCount: number;
  allMatched: boolean;
}

const makeDiff = (actual: number, expected: number, matches: boolean): MonthlyReconciliationFieldDiff => ({
  actual,
  expected,
  diff: actual - expected,
  matches,
});

export function reconcileMonthlySummary(
  monthlySummary: MonthlySummaryResult,
  targets: ExpectedMonthlyTargetsMap
): MonthlyReconciliationSummary {
  let totalTasksExpected = 0;
  let totalActionsExpected = 0;
  let totalRecipientsExpected = 0;
  let totalMaterialsExpected = 0;
  let totalDoneExpected = 0;
  let totalMismatchesCount = 0;
  let configuredMonthsCount = 0;

  const rows: MonthlyReconciliationRow[] = monthlySummary.rows.map((row) => {
    const mPad = String(row.monthNumber).padStart(2, "0");
    const target = targets[mPad] || targets[String(row.monthNumber)] || targets[row.monthKey];

    const hasTargetData = !!target && (
      target.tasksCount !== undefined ||
      target.actionsCount !== undefined ||
      target.recipientsCount !== undefined ||
      target.materialsCount !== undefined ||
      target.doneCount !== undefined
    );

    if (hasTargetData) configuredMonthsCount += 1;

    const expTasks = target?.tasksCount ?? row.tasksCount;
    const expActions = target?.actionsCount ?? row.actionsCount;
    const expRecipients = target?.recipientsCount ?? row.recipientsCount;
    const expMaterials = target?.materialsCount ?? row.materialsCount;
    const expDone = target?.doneCount ?? row.doneCount;

    totalTasksExpected += expTasks;
    totalActionsExpected += expActions;
    totalRecipientsExpected += expRecipients;
    totalMaterialsExpected += expMaterials;
    totalDoneExpected += expDone;

    const tasksMatch = row.tasksCount === expTasks;
    const actionsMatch = row.actionsCount === expActions;
    const recipientsMatch = row.recipientsCount === expRecipients;
    const materialsMatch = row.materialsCount === expMaterials;
    const doneMatch = row.doneCount === expDone;

    const isReconciled = tasksMatch && actionsMatch && recipientsMatch && materialsMatch && doneMatch;
    const hasMismatch = hasTargetData && !isReconciled;

    if (hasMismatch) {
      totalMismatchesCount += 1;
    }

    return {
      ...row,
      expected: target,
      isReconciled,
      hasMismatch,
      hasTargetData,
      fieldDiffs: {
        tasks: makeDiff(row.tasksCount, expTasks, tasksMatch),
        actions: makeDiff(row.actionsCount, expActions, actionsMatch),
        recipients: makeDiff(row.recipientsCount, expRecipients, recipientsMatch),
        materials: makeDiff(row.materialsCount, expMaterials, materialsMatch),
        done: makeDiff(row.doneCount, expDone, doneMatch),
      },
    };
  });

  const allMatched = totalMismatchesCount === 0;

  return {
    rows,
    totalTasksActual: monthlySummary.totalTasks,
    totalTasksExpected,
    totalActionsActual: monthlySummary.totalActions,
    totalActionsExpected,
    totalRecipientsActual: monthlySummary.totalRecipients,
    totalRecipientsExpected,
    totalMaterialsActual: monthlySummary.totalMaterials,
    totalMaterialsExpected,
    totalDoneActual: monthlySummary.totalDone,
    totalDoneExpected,
    totalMismatchesCount,
    configuredMonthsCount,
    allMatched,
  };
}

export const DEFAULT_2026_EXPECTED_MONTHLY_TARGETS: ExpectedMonthlyTargetsMap = {
  "01": { tasksCount: 27, actionsCount: 37, recipientsCount: 753, materialsCount: 0, doneCount: 27 },
  "02": { tasksCount: 25, actionsCount: 29, recipientsCount: 528, materialsCount: 0, doneCount: 25 },
  "03": { tasksCount: 41, actionsCount: 45, recipientsCount: 1515, materialsCount: 0, doneCount: 41 },
  "04": { tasksCount: 39, actionsCount: 46, recipientsCount: 943, materialsCount: 0, doneCount: 39 },
  "05": { tasksCount: 64, actionsCount: 72, recipientsCount: 938, materialsCount: 0, doneCount: 64 },
  "06": { tasksCount: 33, actionsCount: 34, recipientsCount: 1606, materialsCount: 0, doneCount: 33 },
  "07": { tasksCount: 21, actionsCount: 21, recipientsCount: 540, materialsCount: 10, doneCount: 21 },
  "08": { tasksCount: 8, actionsCount: 8, recipientsCount: 599, materialsCount: 10, doneCount: 8 },
  "09": { tasksCount: 1, actionsCount: 1, recipientsCount: 1, materialsCount: 0, doneCount: 0 },
};

export const DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_PROGRAM: ExpectedMonthlyTargetsMap = {
  "01": { tasksCount: 3, actionsCount: 3, recipientsCount: 46, materialsCount: 0, doneCount: 3 },
  "02": { tasksCount: 7, actionsCount: 7, recipientsCount: 181, materialsCount: 0, doneCount: 7 },
  "03": { tasksCount: 13, actionsCount: 13, recipientsCount: 312, materialsCount: 0, doneCount: 13 },
  "04": { tasksCount: 22, actionsCount: 22, recipientsCount: 398, materialsCount: 0, doneCount: 22 },
  "05": { tasksCount: 24, actionsCount: 24, recipientsCount: 361, materialsCount: 0, doneCount: 24 },
  "06": { tasksCount: 14, actionsCount: 14, recipientsCount: 364, materialsCount: 0, doneCount: 14 },
  "07": { tasksCount: 0, actionsCount: 0, recipientsCount: 0, materialsCount: 0, doneCount: 0 },
  "08": { tasksCount: 2, actionsCount: 2, recipientsCount: 2, materialsCount: 0, doneCount: 2 },
};

export const DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_NON_PROGRAM: ExpectedMonthlyTargetsMap = {
  "01": { tasksCount: 24, actionsCount: 34, recipientsCount: 707, materialsCount: 0, doneCount: 24 },
  "02": { tasksCount: 18, actionsCount: 22, recipientsCount: 347, materialsCount: 0, doneCount: 18 },
  "03": { tasksCount: 28, actionsCount: 32, recipientsCount: 1203, materialsCount: 0, doneCount: 28 },
  "04": { tasksCount: 17, actionsCount: 24, recipientsCount: 545, materialsCount: 0, doneCount: 17 },
  "05": { tasksCount: 40, actionsCount: 48, recipientsCount: 577, materialsCount: 0, doneCount: 40 },
  "06": { tasksCount: 19, actionsCount: 20, recipientsCount: 1242, materialsCount: 0, doneCount: 19 },
  "07": { tasksCount: 21, actionsCount: 21, recipientsCount: 540, materialsCount: 10, doneCount: 21 },
  "08": { tasksCount: 6, actionsCount: 6, recipientsCount: 597, materialsCount: 10, doneCount: 6 },
};
