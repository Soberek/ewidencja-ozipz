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
