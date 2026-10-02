/**
 * Liczby z miesięcznego sprawozdania wysłanego do kierownictwa (wpisywane ręcznie z pliku).
 * Nazwy pól zostają zgodne z tabelą monthly_targets.
 */
export interface OzipzMonthlyTargetItem {
  month: number; // 1 - 12
  programActions: number; // Działania programowe (DZ) wykazane w sprawozdaniu
  programRecipients: number; // Odbiorcy działań programowych (ODB) wykazani w sprawozdaniu
  otherActions: number; // Działania nieprogramowe (DZ) wykazane w sprawozdaniu
  otherRecipients: number; // Odbiorcy działań nieprogramowych (ODB) wykazani w sprawozdaniu
  notes?: string;
}

export type OzipzYearlyMonthlyTargets = Record<number, OzipzMonthlyTargetItem>;

export const REPORT_METRIC_KEYS = [
  "programActions",
  "programRecipients",
  "otherActions",
  "otherRecipients",
] as const;

export type OzipzReportMetricKey = (typeof REPORT_METRIC_KEYS)[number];

export type OzipzReportMetrics = Record<OzipzReportMetricKey, number>;

/** zgodne – ewidencja = sprawozdanie; rozbieznosc – różnica w min. jednej liczbie; brak_sprawozdania – nie wpisano */
export type OzipzReportComplianceStatus = "zgodne" | "rozbieznosc" | "brak_sprawozdania";

export interface OzipzReportComparison {
  reported: OzipzReportMetrics; // wg wysłanego sprawozdania
  recorded: OzipzReportMetrics; // wg ewidencji (tylko działania wykonane)
  diff: OzipzReportMetrics; // ewidencja - sprawozdanie
  status: OzipzReportComplianceStatus;
}

export interface OzipzMonthlyComplianceRow {
  month: number;
  monthLabel: string;
  monthEmoji: string;
  hasReport: boolean;
  monthly: OzipzReportComparison;
  /** Od stycznia do tego miesiąca włącznie. */
  cumulative: OzipzReportComparison;
}

export interface OzipzAnnualComplianceSummary {
  reportedMonthsCount: number;
  matchingMonthsCount: number;
  mismatchedMonthsCount: number;
  /** Ostatni miesiąc z wpisanym sprawozdaniem (0, gdy brak). */
  lastReportedMonth: number;
  /** Narastająco od stycznia do ostatniego miesiąca ze sprawozdaniem. */
  cumulative: OzipzReportComparison;
}

export const MONTH_NAMES_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
] as const;

export const MONTH_EMOJIS = [
  "❄️",
  "🌨️",
  "🌱",
  "🌸",
  "🌿",
  "☀️",
  "🏖️",
  "🌻",
  "🎒",
  "🍂",
  "🌧️",
  "🎄",
] as const;
