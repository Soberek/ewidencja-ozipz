import { CheckCircle2, AlertTriangle, FileText, Sigma } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  MONTH_NAMES_PL,
  type OzipzAnnualComplianceSummary,
} from "../../../../utils/monthlyTargetsUtils";

export interface TargetsSummaryKpiCardsProps {
  summary: OzipzAnnualComplianceSummary;
}

const fmt = (n: number) => n.toLocaleString("pl-PL");

export function TargetsSummaryKpiCards({ summary }: TargetsSummaryKpiCardsProps) {
  const { cumulative, lastReportedMonth } = summary;
  const reportedActions = cumulative.reported.programActions + cumulative.reported.otherActions;
  const recordedActions = cumulative.recorded.programActions + cumulative.recorded.otherActions;
  const reportedRecipients = cumulative.reported.programRecipients + cumulative.reported.otherRecipients;
  const recordedRecipients = cumulative.recorded.programRecipients + cumulative.recorded.otherRecipients;
  const cumulativeMismatch = cumulative.status === "rozbieznosc";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      <Card className="rounded-[3px] border border-border bg-card p-3 shadow-none">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <FileText className="size-3" />
          <span>Wpisane sprawozdania</span>
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-foreground">
          {summary.reportedMonthsCount} <span className="text-xs font-normal text-muted-foreground">/ 12 mies.</span>
        </p>
        <p className="mt-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
          {lastReportedMonth > 0 ? `Ostatnie: ${MONTH_NAMES_PL[lastReportedMonth - 1].toLowerCase()}` : "Brak wpisanych sprawozdań"}
        </p>
      </Card>

      <Card className="rounded-[3px] border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-none">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="size-3" />
          <span>Miesiące zgodne</span>
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
          {summary.matchingMonthsCount}{" "}
          <span className="text-xs font-normal text-emerald-600/80 dark:text-emerald-400/80">/ {summary.reportedMonthsCount}</span>
        </p>
        <p className="mt-2 pt-2 border-t border-emerald-500/15 text-xs text-emerald-700/80 dark:text-emerald-400">
          Ewidencja = sprawozdanie
        </p>
      </Card>

      <Card
        className={`rounded-[3px] border p-3 shadow-none ${
          summary.mismatchedMonthsCount > 0 ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"
        }`}
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            summary.mismatchedMonthsCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
          }`}
        >
          <AlertTriangle className="size-3" />
          <span>Miesiące z rozbieżnością</span>
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-foreground">{summary.mismatchedMonthsCount}</p>
        <p className="mt-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
          {summary.mismatchedMonthsCount > 0 ? "Sprawdź wpisy w ewidencji" : "Brak rozbieżności"}
        </p>
      </Card>

      <Card className="rounded-[3px] border border-border bg-card p-3 shadow-none">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Sigma className="size-3" />
          <span>Narastająco (ewidencja / sprawozd.)</span>
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-foreground">
          {fmt(recordedActions)} <span className="text-xs font-normal text-muted-foreground">/ {fmt(reportedActions)} dz.</span>
        </p>
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="font-mono text-foreground">
            {fmt(recordedRecipients)} <span className="text-muted-foreground">/ {fmt(reportedRecipients)} os.</span>
          </span>
          {lastReportedMonth > 0 && (
            <span className={cumulativeMismatch ? "text-red-600 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
              {cumulativeMismatch ? "Rozbieżność" : "Zgodne"}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
