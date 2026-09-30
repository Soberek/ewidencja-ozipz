import type { OzipzAction } from "../types/ozipz.types";
import { isProgramAction } from "./ozipzCalculations";
import { isActionCancelled, isActionExecuted } from "./calculators/actionMetrics";
import { safeParseDate } from "./dateUtils";
import {
  MONTH_NAMES_PL,
  MONTH_EMOJIS,
  REPORT_METRIC_KEYS,
  type OzipzYearlyMonthlyTargets,
  type OzipzMonthlyComplianceRow,
  type OzipzAnnualComplianceSummary,
  type OzipzReportMetrics,
  type OzipzReportComparison,
} from "./monthlyTargetsTypes";

const POSTPONED_STATUSES = new Set(["odroczone", "postponed"]);

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

export function emptyReportMetrics(): OzipzReportMetrics {
  return { programActions: 0, programRecipients: 0, otherActions: 0, otherRecipients: 0 };
}

function addMetrics(a: OzipzReportMetrics, b: OzipzReportMetrics): OzipzReportMetrics {
  const out = emptyReportMetrics();
  for (const k of REPORT_METRIC_KEYS) out[k] = a[k] + b[k];
  return out;
}

/** Czy w sprawozdaniu za miesiąc wpisano jakąkolwiek liczbę (same zera = nie wpisano). */
export function hasReportedValues(m: OzipzReportMetrics): boolean {
  return REPORT_METRIC_KEYS.some((k) => m[k] > 0);
}

/**
 * Porównuje liczby ze sprawozdania z ewidencją. Sprawozdanie to wykonanie, więc zgodność
 * oznacza równość co do sztuki – każda różnica jest rozbieżnością.
 */
export function compareWithReport(
  reported: OzipzReportMetrics,
  recorded: OzipzReportMetrics,
  hasReport: boolean
): OzipzReportComparison {
  const diff = emptyReportMetrics();
  for (const k of REPORT_METRIC_KEYS) diff[k] = recorded[k] - reported[k];
  const status = !hasReport
    ? "brak_sprawozdania"
    : REPORT_METRIC_KEYS.every((k) => diff[k] === 0)
    ? "zgodne"
    : "rozbieznosc";
  return { reported, recorded, diff, status };
}

function readReported(targets: OzipzYearlyMonthlyTargets, month: number): OzipzReportMetrics {
  const item = targets[month];
  const out = emptyReportMetrics();
  if (!item) return out;
  for (const k of REPORT_METRIC_KEYS) out[k] = Math.max(0, Number(item[k]) || 0);
  return out;
}

/**
 * Zestawia liczby z wysłanych sprawozdań miesięcznych z wykonaniem zapisanym w ewidencji,
 * miesięcznie i narastająco od stycznia.
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

  const recordedPerMonth: OzipzReportMetrics[] = Array.from({ length: 13 }, emptyReportMetrics);
  const openPerMonth: number[] = new Array(13).fill(0);

  for (const a of actions) {
    if (!a.date || isActionCancelled(a.status) || POSTPONED_STATUSES.has(a.status ?? "")) continue;

    const parsed = safeParseDate(a.date);
    if (!parsed || parsed.getFullYear() !== year) continue;
    const month = parsed.getMonth() + 1;

    // Do sprawozdania trafia wyłącznie wykonanie – niezamknięte wpisy tylko sygnalizujemy.
    if (!isActionExecuted(a.status)) {
      openPerMonth[month] += 1;
      continue;
    }

    const bucket = recordedPerMonth[month];
    if (isProgramAction(a, customKindMap)) {
      bucket.programActions += getActionCount(a);
      bucket.programRecipients += getActionRecipients(a);
    } else {
      bucket.otherActions += getActionCount(a);
      bucket.otherRecipients += getActionRecipients(a);
    }
  }

  const rows: OzipzMonthlyComplianceRow[] = [];
  let cumReported = emptyReportMetrics();
  let cumRecorded = emptyReportMetrics();
  let reportedMonthsCount = 0;
  let matchingMonthsCount = 0;
  let lastReportedMonth = 0;

  for (let m = 1; m <= 12; m++) {
    const reported = readReported(targets, m);
    const recorded = recordedPerMonth[m];
    const hasReport = hasReportedValues(reported);

    cumReported = addMetrics(cumReported, reported);
    cumRecorded = addMetrics(cumRecorded, recorded);

    const monthly = compareWithReport(reported, recorded, hasReport);
    if (hasReport) {
      reportedMonthsCount += 1;
      lastReportedMonth = m;
      if (monthly.status === "zgodne") matchingMonthsCount += 1;
    }

    rows.push({
      month: m,
      monthLabel: MONTH_NAMES_PL[m - 1],
      monthEmoji: MONTH_EMOJIS[m - 1],
      hasReport,
      monthly,
      cumulative: compareWithReport(cumReported, cumRecorded, hasReport),
      openActionsCount: openPerMonth[m],
    });
  }

  const summary: OzipzAnnualComplianceSummary = {
    reportedMonthsCount,
    matchingMonthsCount,
    mismatchedMonthsCount: reportedMonthsCount - matchingMonthsCount,
    lastReportedMonth,
    cumulative:
      lastReportedMonth > 0
        ? rows[lastReportedMonth - 1].cumulative
        : compareWithReport(emptyReportMetrics(), emptyReportMetrics(), false),
  };

  return { rows, summary };
}
