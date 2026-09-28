export interface OzipzMonthlyTargetItem {
  month: number; // 1 - 12
  programActions: number; // Planowana liczba działań programowych (DZ)
  programRecipients: number; // Planowana liczba odbiorców programowych (ODB)
  otherActions: number; // Planowana liczba działań nieprogramowych (DZ)
  otherRecipients: number; // Planowana liczba odbiorców nieprogramowych (ODB)
  notes?: string;
}

export type OzipzYearlyMonthlyTargets = Record<number, OzipzMonthlyTargetItem>;

export interface OzipzMonthlyComplianceRow {
  month: number;
  monthLabel: string;
  monthEmoji: string;

  // Planowane wartości z planu pracy
  targetProgramActions: number;
  targetProgramRecipients: number;
  targetOtherActions: number;
  targetOtherRecipients: number;
  targetTotalActions: number;
  targetTotalRecipients: number;

  // Realizacja (wykonanie faktyczne z ewidencji)
  actualProgramActions: number;
  actualProgramRecipients: number;
  actualOtherActions: number;
  actualOtherRecipients: number;
  actualTotalActions: number;
  actualTotalRecipients: number;

  // Wskaźniki zgodności (% wykonania planu)
  programActionsPercent: number | null;
  programRecipientsPercent: number | null;
  otherActionsPercent: number | null;
  otherRecipientsPercent: number | null;
  totalActionsPercent: number | null;
  totalRecipientsPercent: number | null;

  // Odchylenia (Różnica = Wykonano - Plan)
  diffProgramActions: number;
  diffProgramRecipients: number;
  diffOtherActions: number;
  diffOtherRecipients: number;
  diffTotalActions: number;
  diffTotalRecipients: number;

  // Status zgodności z planem
  complianceStatus: "compliant" | "warning" | "danger" | "no_target";
}

export interface OzipzAnnualComplianceSummary {
  // Sumy planowane w planie pracy
  targetProgramActions: number;
  targetProgramRecipients: number;
  targetOtherActions: number;
  targetOtherRecipients: number;
  targetTotalActions: number;
  targetTotalRecipients: number;

  // Sumy wykonane w ewidencji
  actualProgramActions: number;
  actualProgramRecipients: number;
  actualOtherActions: number;
  actualOtherRecipients: number;
  actualTotalActions: number;
  actualTotalRecipients: number;

  // Procenty roczne zgodności
  programActionsPercent: number | null;
  programRecipientsPercent: number | null;
  otherActionsPercent: number | null;
  otherRecipientsPercent: number | null;
  totalActionsPercent: number | null;
  totalRecipientsPercent: number | null;

  // Różnice roczne
  diffProgramActions: number;
  diffProgramRecipients: number;
  diffOtherActions: number;
  diffOtherRecipients: number;
  diffTotalActions: number;
  diffTotalRecipients: number;

  complianceStatus: "compliant" | "warning" | "danger" | "no_target";
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
