import { CheckCircle2, Users, Sparkles, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OzipzAnnualComplianceSummary } from "../../../../utils/monthlyTargetsUtils";

export interface TargetsSummaryKpiCardsProps {
  summary: OzipzAnnualComplianceSummary;
}

export function TargetsSummaryKpiCards({ summary }: TargetsSummaryKpiCardsProps) {
  const progActionsPercent = summary.programActionsPercent ?? 0;
  const progRecipientsPercent = summary.programRecipientsPercent ?? 0;

  const otherActionsPercent = summary.otherActionsPercent ?? 0;
  const otherRecipientsPercent = summary.otherRecipientsPercent ?? 0;

  const totalActionsPercent = summary.totalActionsPercent ?? 0;
  const totalRecipientsPercent = summary.totalRecipientsPercent ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      {/* Karta 1: Działania Programowe (Działania + Odbiorcy) */}
      <Card className="rounded-[3px] border border-purple-500/20 bg-purple-500/5 p-3 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="size-3 text-purple-600 dark:text-purple-400" />
              <span>Działania Programowe</span>
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-purple-700 dark:text-purple-300">
              {summary.actualProgramActions} <span className="text-xs font-normal text-purple-600/80 dark:text-purple-400/80">/ {summary.targetProgramActions} dz.</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-purple-500/30 text-purple-700 bg-purple-500/10 dark:text-purple-300 py-0.5"
          >
            {progActionsPercent}% dz.
          </Badge>
        </div>
        <div className="mt-2 pt-2 border-t border-purple-500/15 flex items-center justify-between text-xs">
          <span className="text-purple-600/80 dark:text-purple-400 font-medium">Odbiorcy prog.:</span>
          <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
            {summary.actualProgramRecipients.toLocaleString("pl-PL")} <span className="font-normal text-[11px] text-purple-600/80 dark:text-purple-400/80">/ {summary.targetProgramRecipients.toLocaleString("pl-PL")} os.</span> ({progRecipientsPercent}%)
          </span>
        </div>
      </Card>

      {/* Karta 2: Działania Nieprogramowe (Działania + Odbiorcy) */}
      <Card className="rounded-[3px] border border-blue-500/20 bg-blue-500/5 p-3 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Activity className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Działania Nieprogramowe</span>
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-blue-700 dark:text-blue-300">
              {summary.actualOtherActions} <span className="text-xs font-normal text-blue-600/80 dark:text-blue-400/80">/ {summary.targetOtherActions} dz.</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-blue-500/30 text-blue-700 bg-blue-500/10 dark:text-blue-300 py-0.5"
          >
            {otherActionsPercent}% dz.
          </Badge>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-500/15 flex items-center justify-between text-xs">
          <span className="text-blue-600/80 dark:text-blue-400 font-medium">Odbiorcy nieprog.:</span>
          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
            {summary.actualOtherRecipients.toLocaleString("pl-PL")} <span className="font-normal text-[11px] text-blue-600/80 dark:text-blue-400/80">/ {summary.targetOtherRecipients.toLocaleString("pl-PL")} os.</span> ({otherRecipientsPercent}%)
          </span>
        </div>
      </Card>

      {/* Karta 3: Łączna Liczba Działań */}
      <Card className="rounded-[3px] border border-border bg-card p-3 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Łącznie Działania (Plan/Fakt)
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {summary.actualTotalActions} <span className="text-xs font-normal text-muted-foreground">/ {summary.targetTotalActions} dz.</span>
            </p>
          </div>
          <div className="rounded-full bg-muted p-1.5 text-foreground">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Wykonanie planu:</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono py-0 ${
              totalActionsPercent >= 100
                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                : totalActionsPercent >= 70
                ? "border-blue-500/30 text-blue-600 bg-blue-500/10 dark:text-blue-400"
                : "border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {totalActionsPercent}% wykonania
          </Badge>
        </div>
      </Card>

      {/* Karta 4: Łączna Liczba Odbiorców */}
      <Card className="rounded-[3px] border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Łącznie Odbiorcy
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {summary.actualTotalRecipients.toLocaleString("pl-PL")}{" "}
              <span className="text-xs font-normal text-emerald-600/80 dark:text-emerald-400/80">os.</span>
            </p>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
            <Users className="size-4" />
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs">
          <span className="text-emerald-600/80 dark:text-emerald-400 font-medium">Plan odbiorców:</span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
            {summary.targetTotalRecipients.toLocaleString("pl-PL")} os. ({totalRecipientsPercent}%)
          </span>
        </div>
      </Card>
    </div>
  );
}

