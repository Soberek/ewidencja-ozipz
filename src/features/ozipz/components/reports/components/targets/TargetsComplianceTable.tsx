import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  OzipzMonthlyComplianceRow,
  OzipzYearlyMonthlyTargets,
  OzipzAnnualComplianceSummary,
} from "../../../../utils/monthlyTargetsUtils";

export interface TargetsComplianceTableProps {
  rows: OzipzMonthlyComplianceRow[];
  targets: OzipzYearlyMonthlyTargets;
  onCellChange: (
    month: number,
    field: "programActions" | "programRecipients" | "otherActions" | "otherRecipients",
    value: string
  ) => void;
  summary: OzipzAnnualComplianceSummary;
}

export function TargetsComplianceTable({
  rows,
  targets,
  onCellChange,
  summary,
}: TargetsComplianceTableProps) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-border bg-background shadow-xs select-none">
      <table className="w-full text-xs text-left border-collapse min-w-[980px]">
        <thead>
          {/* Grupowanie Główne */}
          <tr className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <th rowSpan={2} className="py-2.5 px-3 w-32 border-r border-border">
              Miesiąc
            </th>
            <th colSpan={4} className="py-2 px-2 text-center border-r border-border">
              Działania Programowe (GIS / MZ)
            </th>
            <th colSpan={4} className="py-2 px-2 text-center border-r border-border">
              Działania Nieprogramowe (Akcyjne / Media)
            </th>
            <th colSpan={3} className="py-2 px-2 text-center">
              Łącznie Plan Pracy (Razem)
            </th>
          </tr>
          {/* Podkolumny Działań i Odbiorców */}
          <tr className="bg-muted/30 border-b border-border text-[10.5px] font-semibold text-muted-foreground">
            {/* Programowe */}
            <th className="py-1.5 px-1.5 text-center w-16">
              Plan DZ
            </th>
            <th className="py-1.5 px-1.5 text-center w-24">
              Fakt DZ (%)
            </th>
            <th className="py-1.5 px-1.5 text-center w-20">
              Plan ODB
            </th>
            <th className="py-1.5 px-1.5 text-center border-r border-border w-24">
              Fakt ODB (%)
            </th>

            {/* Nieprogramowe */}
            <th className="py-1.5 px-1.5 text-center w-16">
              Plan DZ
            </th>
            <th className="py-1.5 px-1.5 text-center w-24">
              Fakt DZ (%)
            </th>
            <th className="py-1.5 px-1.5 text-center w-20">
              Plan ODB
            </th>
            <th className="py-1.5 px-1.5 text-center border-r border-border w-24">
              Fakt ODB (%)
            </th>

            {/* Łącznie */}
            <th className="py-1.5 px-2 text-center w-28">
              Działania (Plan/Fakt)
            </th>
            <th className="py-1.5 px-2 text-center w-32">
              Odbiorcy (Plan/Fakt)
            </th>
            <th className="py-1.5 px-2 text-center w-36">
              Zgodność
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono text-[11px]">
          {rows.map((r) => {
            const mTargets = targets[r.month] || {
              programActions: 0,
              programRecipients: 0,
              otherActions: 0,
              otherRecipients: 0,
            };

            const isSuccess = r.complianceStatus === "compliant";
            const isWarning = r.complianceStatus === "warning";

            return (
              <tr
                key={r.month}
                className="hover:bg-muted transition-colors"
              >
                {/* Miesiąc */}
                <td className="py-2 px-3 font-sans font-semibold text-foreground border-r border-border/80 flex items-center gap-1.5">
                  <span>{r.monthEmoji}</span>
                  <span>{r.monthLabel}</span>
                </td>

                {/* Programowe: Plan DZ */}
                <td className="p-1 text-center">
                  <Input
                    type="number"
                    min={0}
                    value={mTargets.programActions}
                    onChange={(e) => onCellChange(r.month, "programActions", e.target.value)}
                    className="h-6 w-14 text-center text-[11px] font-mono mx-auto bg-background p-0.5"
                    title="Zaplanowane działania programowe"
                  />
                </td>

                {/* Programowe: Wykonano DZ (%) */}
                <td className="p-1 text-center">
                  <span className="font-bold text-foreground">
                    {r.actualProgramActions}
                  </span>
                  {r.programActionsPercent !== null && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({r.programActionsPercent}%)
                    </span>
                  )}
                </td>

                {/* Programowe: Plan ODB */}
                <td className="p-1 text-center">
                  <Input
                    type="number"
                    min={0}
                    value={mTargets.programRecipients}
                    onChange={(e) => onCellChange(r.month, "programRecipients", e.target.value)}
                    className="h-6 w-16 text-center text-[11px] font-mono mx-auto bg-background p-0.5"
                    title="Zaplanowani odbiorcy programowi"
                  />
                </td>

                {/* Programowe: Wykonano ODB (%) */}
                <td className="p-1 text-center border-r border-border">
                  <span className="font-bold text-foreground">
                    {r.actualProgramRecipients}
                  </span>
                  {r.programRecipientsPercent !== null && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({r.programRecipientsPercent}%)
                    </span>
                  )}
                </td>

                {/* Nieprogramowe: Plan DZ */}
                <td className="p-1 text-center">
                  <Input
                    type="number"
                    min={0}
                    value={mTargets.otherActions}
                    onChange={(e) => onCellChange(r.month, "otherActions", e.target.value)}
                    className="h-6 w-14 text-center text-[11px] font-mono mx-auto bg-background p-0.5"
                    title="Zaplanowane działania nieprogramowe"
                  />
                </td>

                {/* Nieprogramowe: Wykonano DZ (%) */}
                <td className="p-1 text-center">
                  <span className="font-bold text-foreground">
                    {r.actualOtherActions}
                  </span>
                  {r.otherActionsPercent !== null && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({r.otherActionsPercent}%)
                    </span>
                  )}
                </td>

                {/* Nieprogramowe: Plan ODB */}
                <td className="p-1 text-center">
                  <Input
                    type="number"
                    min={0}
                    value={mTargets.otherRecipients}
                    onChange={(e) => onCellChange(r.month, "otherRecipients", e.target.value)}
                    className="h-6 w-16 text-center text-[11px] font-mono mx-auto bg-background p-0.5"
                    title="Zaplanowani odbiorcy nieprogramowi"
                  />
                </td>

                {/* Nieprogramowe: Wykonano ODB (%) */}
                <td className="p-1 text-center border-r border-border">
                  <span className="font-bold text-foreground">
                    {r.actualOtherRecipients}
                  </span>
                  {r.otherRecipientsPercent !== null && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({r.otherRecipientsPercent}%)
                    </span>
                  )}
                </td>

                {/* Łącznie Działania (Plan / Fakt) */}
                <td className="py-2 px-2 text-center">
                  <span className="font-bold text-foreground">{r.actualTotalActions}</span>
                  <span className="text-muted-foreground text-[10px]"> / {r.targetTotalActions}</span>
                </td>

                {/* Łącznie Odbiorcy (Plan / Fakt) */}
                <td className="py-2 px-2 text-center">
                  <span className="font-bold text-foreground">{r.actualTotalRecipients.toLocaleString("pl-PL")}</span>
                  <span className="text-muted-foreground text-[10px]"> / {r.targetTotalRecipients.toLocaleString("pl-PL")}</span>
                </td>

                {/* Status Zgodności */}
                <td className="py-2 px-2 text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold py-0.5 px-2 ${
                      isSuccess
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : isWarning
                        ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="size-3 mr-1 inline" />
                    ) : isWarning ? (
                      <AlertTriangle className="size-3 mr-1 inline" />
                    ) : (
                      <XCircle className="size-3 mr-1 inline" />
                    )}
                    {r.totalActionsPercent !== null ? `${r.totalActionsPercent}% planu` : "Brak planu"}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-muted/50 font-bold border-t-2 border-border text-foreground font-mono text-[11px]">
          <tr>
            <td className="py-2.5 px-3 font-sans border-r border-border">RAZEM (ROK):</td>
            {/* Programowe DZ */}
            <td className="p-1.5 text-center text-foreground">
              {summary.targetProgramActions}
            </td>
            <td className="p-1.5 text-center text-foreground">
              {summary.actualProgramActions} ({summary.programActionsPercent ?? 0}%)
            </td>
            {/* Programowe ODB */}
            <td className="p-1.5 text-center text-foreground">
              {summary.targetProgramRecipients.toLocaleString("pl-PL")}
            </td>
            <td className="p-1.5 text-center text-foreground border-r border-border">
              {summary.actualProgramRecipients.toLocaleString("pl-PL")} ({summary.programRecipientsPercent ?? 0}%)
            </td>

            {/* Nieprogramowe DZ */}
            <td className="p-1.5 text-center text-foreground">
              {summary.targetOtherActions}
            </td>
            <td className="p-1.5 text-center text-foreground">
              {summary.actualOtherActions} ({summary.otherActionsPercent ?? 0}%)
            </td>
            {/* Nieprogramowe ODB */}
            <td className="p-1.5 text-center text-foreground">
              {summary.targetOtherRecipients.toLocaleString("pl-PL")}
            </td>
            <td className="p-1.5 text-center text-foreground border-r border-border">
              {summary.actualOtherRecipients.toLocaleString("pl-PL")} ({summary.otherRecipientsPercent ?? 0}%)
            </td>

            {/* Łącznie */}
            <td className="py-2 px-2 text-center text-foreground">
              {summary.actualTotalActions} / {summary.targetTotalActions} ({summary.totalActionsPercent ?? 0}%)
            </td>
            <td className="py-2 px-2 text-center text-foreground">
              {summary.actualTotalRecipients.toLocaleString("pl-PL")} / {summary.targetTotalRecipients.toLocaleString("pl-PL")} ({summary.totalRecipientsPercent ?? 0}%)
            </td>
            <td className="py-2 px-2 text-center">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold py-0.5 px-2.5 ${
                  summary.complianceStatus === "compliant"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : summary.complianceStatus === "warning"
                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                }`}
              >
                {summary.totalActionsPercent !== null ? `${summary.totalActionsPercent}% zgodności` : "Brak planu"}
              </Badge>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
