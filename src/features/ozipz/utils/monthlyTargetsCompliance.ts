import type { OzipzAction } from "../types/ozipz.types";
import { isProgramAction } from "./ozipzCalculations";
import { safeParseDate } from "./dateUtils";
import {
  MONTH_NAMES_PL,
  MONTH_EMOJIS,
  type OzipzYearlyMonthlyTargets,
  type OzipzMonthlyComplianceRow,
  type OzipzAnnualComplianceSummary,
} from "./monthlyTargetsTypes";

/**
 * Bezpieczne pobranie odbiorców z działania
 */
export function getActionRecipients(a: OzipzAction): number {
  const direct = Number(a.participantsCount) || 0;
  return Math.max(0, direct);
}

/**
 * Bezpieczne pobranie liczby pojedynczych działań z encji
 */
export function getActionCount(a: OzipzAction): number {
  const count = Number(a.numberOfActions);
  return Number.isFinite(count) && count > 0 ? count : 1;
}

/**
 * Oblicza procent zgodności/wykonania (zaokrąglony do liczb całkowitych)
 */
export function calculatePercent(actual: number, target: number): number | null {
  if (target <= 0) return null;
  return Math.round((actual / target) * 100);
}

/**
 * Wyznacza status zgodności na podstawie procentu wykonania planu
 */
export function getComplianceStatus(
  percent: number | null,
  targetTotal: number
): "compliant" | "warning" | "danger" | "no_target" {
  if (targetTotal <= 0 || percent === null) return "no_target";
  if (percent >= 100) return "compliant";
  if (percent >= 70) return "warning";
  return "danger";
}

/**
 * Główna funkcja analityczna obliczająca pełną macierz zgodności planu wykonania z ewidencją
 */
export function calculateMonthlyComplianceMatrix(params: {
  actions: OzipzAction[];
  targets: OzipzYearlyMonthlyTargets;
  year: number;
  customKindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;
}): {
  rows: OzipzMonthlyComplianceRow[];
  summary: OzipzAnnualComplianceSummary;
} {
  const { actions, targets, year, customKindMap } = params;

  // 1. Zgrupuj akcje per miesiąc (1-12) z podziałem na programowe i nieprogramowe
  const actualsPerMonth: Record<
    number,
    {
      progActions: number;
      progRecipients: number;
      otherActions: number;
      otherRecipients: number;
    }
  > = {};

  for (let m = 1; m <= 12; m++) {
    actualsPerMonth[m] = {
      progActions: 0,
      progRecipients: 0,
      otherActions: 0,
      otherRecipients: 0,
    };
  }

  actions.forEach((a) => {
    if (a.status === "odwolane" || a.status === "cancelled") return;
    if (!a.date) return;

    const parsed = safeParseDate(a.date);
    if (!parsed || parsed.getFullYear() !== year) return;

    const monthNum = parsed.getMonth() + 1;
    if (monthNum < 1 || monthNum > 12) return;

    const count = getActionCount(a);
    const recipients = getActionRecipients(a);

    if (isProgramAction(a, customKindMap)) {
      actualsPerMonth[monthNum].progActions += count;
      actualsPerMonth[monthNum].progRecipients += recipients;
    } else {
      actualsPerMonth[monthNum].otherActions += count;
      actualsPerMonth[monthNum].otherRecipients += recipients;
    }
  });

  // 2. Zbuduj wiersze dla 12 miesięcy
  const rows: OzipzMonthlyComplianceRow[] = [];

  let sumTargetProgActions = 0;
  let sumTargetProgRecipients = 0;
  let sumTargetOtherActions = 0;
  let sumTargetOtherRecipients = 0;
  let sumActualProgActions = 0;
  let sumActualProgRecipients = 0;
  let sumActualOtherActions = 0;
  let sumActualOtherRecipients = 0;

  for (let m = 1; m <= 12; m++) {
    const targetItem = targets[m] || {
      month: m,
      programActions: 0,
      programRecipients: 0,
      otherActions: 0,
      otherRecipients: 0,
    };

    const targetProgAct = Math.max(0, Number(targetItem.programActions) || 0);
    const targetProgRec = Math.max(0, Number(targetItem.programRecipients) || 0);
    const targetOtherAct = Math.max(0, Number(targetItem.otherActions) || 0);
    const targetOtherRec = Math.max(0, Number(targetItem.otherRecipients) || 0);

    const actualProgAct = actualsPerMonth[m].progActions;
    const actualProgRec = actualsPerMonth[m].progRecipients;
    const actualOtherAct = actualsPerMonth[m].otherActions;
    const actualOtherRec = actualsPerMonth[m].otherRecipients;

    const targetTotalAct = targetProgAct + targetOtherAct;
    const targetTotalRec = targetProgRec + targetOtherRec;
    const actualTotalAct = actualProgAct + actualOtherAct;
    const actualTotalRec = actualProgRec + actualOtherRec;

    sumTargetProgActions += targetProgAct;
    sumTargetProgRecipients += targetProgRec;
    sumTargetOtherActions += targetOtherAct;
    sumTargetOtherRecipients += targetOtherRec;
    sumActualProgActions += actualProgAct;
    sumActualProgRecipients += actualProgRec;
    sumActualOtherActions += actualOtherAct;
    sumActualOtherRecipients += actualOtherRec;

    const progActPercent = calculatePercent(actualProgAct, targetProgAct);
    const progRecPercent = calculatePercent(actualProgRec, targetProgRec);
    const otherActPercent = calculatePercent(actualOtherAct, targetOtherAct);
    const otherRecPercent = calculatePercent(actualOtherRec, targetOtherRec);
    const totalActPercent = calculatePercent(actualTotalAct, targetTotalAct);
    const totalRecPercent = calculatePercent(actualTotalRec, targetTotalRec);

    rows.push({
      month: m,
      monthLabel: MONTH_NAMES_PL[m - 1],
      monthEmoji: MONTH_EMOJIS[m - 1],

      targetProgramActions: targetProgAct,
      targetProgramRecipients: targetProgRec,
      targetOtherActions: targetOtherAct,
      targetOtherRecipients: targetOtherRec,
      targetTotalActions: targetTotalAct,
      targetTotalRecipients: targetTotalRec,

      actualProgramActions: actualProgAct,
      actualProgramRecipients: actualProgRec,
      actualOtherActions: actualOtherAct,
      actualOtherRecipients: actualOtherRec,
      actualTotalActions: actualTotalAct,
      actualTotalRecipients: actualTotalRec,

      programActionsPercent: progActPercent,
      programRecipientsPercent: progRecPercent,
      otherActionsPercent: otherActPercent,
      otherRecipientsPercent: otherRecPercent,
      totalActionsPercent: totalActPercent,
      totalRecipientsPercent: totalRecPercent,

      diffProgramActions: actualProgAct - targetProgAct,
      diffProgramRecipients: actualProgRec - targetProgRec,
      diffOtherActions: actualOtherAct - targetOtherAct,
      diffOtherRecipients: actualOtherRec - targetOtherRec,
      diffTotalActions: actualTotalAct - targetTotalAct,
      diffTotalRecipients: actualTotalRec - targetTotalRec,

      complianceStatus: getComplianceStatus(totalActPercent, targetTotalAct),
    });
  }

  // 3. Zbuduj podsumowanie roczne
  const sumTargetTotalAct = sumTargetProgActions + sumTargetOtherActions;
  const sumTargetTotalRec = sumTargetProgRecipients + sumTargetOtherRecipients;
  const sumActualTotalAct = sumActualProgActions + sumActualOtherActions;
  const sumActualTotalRec = sumActualProgRecipients + sumActualOtherRecipients;

  const progActAnnualPercent = calculatePercent(sumActualProgActions, sumTargetProgActions);
  const progRecAnnualPercent = calculatePercent(sumActualProgRecipients, sumTargetProgRecipients);
  const otherActAnnualPercent = calculatePercent(sumActualOtherActions, sumTargetOtherActions);
  const otherRecAnnualPercent = calculatePercent(sumActualOtherRecipients, sumTargetOtherRecipients);
  const totalActAnnualPercent = calculatePercent(sumActualTotalAct, sumTargetTotalAct);
  const totalRecAnnualPercent = calculatePercent(sumActualTotalRec, sumTargetTotalRec);

  const summary: OzipzAnnualComplianceSummary = {
    targetProgramActions: sumTargetProgActions,
    targetProgramRecipients: sumTargetProgRecipients,
    targetOtherActions: sumTargetOtherActions,
    targetOtherRecipients: sumTargetOtherRecipients,
    targetTotalActions: sumTargetTotalAct,
    targetTotalRecipients: sumTargetTotalRec,

    actualProgramActions: sumActualProgActions,
    actualProgramRecipients: sumActualProgRecipients,
    actualOtherActions: sumActualOtherActions,
    actualOtherRecipients: sumActualOtherRecipients,
    actualTotalActions: sumActualTotalAct,
    actualTotalRecipients: sumActualTotalRec,

    programActionsPercent: progActAnnualPercent,
    programRecipientsPercent: progRecAnnualPercent,
    otherActionsPercent: otherActAnnualPercent,
    otherRecipientsPercent: otherRecAnnualPercent,
    totalActionsPercent: totalActAnnualPercent,
    totalRecipientsPercent: totalRecAnnualPercent,

    diffProgramActions: sumActualProgActions - sumTargetProgActions,
    diffProgramRecipients: sumActualProgRecipients - sumTargetProgRecipients,
    diffOtherActions: sumActualOtherActions - sumTargetOtherActions,
    diffOtherRecipients: sumActualOtherRecipients - sumTargetOtherRecipients,
    diffTotalActions: sumActualTotalAct - sumTargetTotalAct,
    diffTotalRecipients: sumActualTotalRec - sumTargetTotalRec,

    complianceStatus: getComplianceStatus(totalActAnnualPercent, sumTargetTotalAct),
  };

  return { rows, summary };
}
