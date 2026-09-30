import { CheckCircle2, AlertTriangle, MinusCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MONTH_NAMES_PL,
  REPORT_METRIC_KEYS,
  type OzipzMonthlyComplianceRow,
  type OzipzAnnualComplianceSummary,
  type OzipzReportComparison,
  type OzipzReportComplianceStatus,
  type OzipzReportMetricKey,
} from "../../../../utils/monthlyTargetsUtils";

export type ComplianceViewMode = "monthly" | "cumulative";

export interface TargetsComplianceTableProps {
  rows: OzipzMonthlyComplianceRow[];
  viewMode: ComplianceViewMode;
  onCellChange: (month: number, field: OzipzReportMetricKey, value: string) => void;
  summary: OzipzAnnualComplianceSummary;
}

const METRIC_TITLES: Record<OzipzReportMetricKey, string> = {
  programActions: "działania programowe",
  programRecipients: "odbiorcy działań programowych",
  otherActions: "działania nieprogramowe",
  otherRecipients: "odbiorcy działań nieprogramowych",
};

const fmt = (n: number) => n.toLocaleString("pl-PL");

export function ComplianceStatusBadge({ status }: { status: OzipzReportComplianceStatus }) {
  if (status === "zgodne") {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2 bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
        <CheckCircle2 className="size-3 mr-1 inline" />
        Zgodne
      </Badge>
    );
  }
  if (status === "rozbieznosc") {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300">
        <AlertTriangle className="size-3 mr-1 inline" />
        Rozbieżność
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-2 text-muted-foreground">
      <MinusCircle className="size-3 mr-1 inline" />
      Nie wpisano
    </Badge>
  );
}

/** Wartość z ewidencji z różnicą względem sprawozdania (tylko gdy sprawozdanie wpisane). */
function RecordedCell({ comparison, metric, active }: { comparison: OzipzReportComparison; metric: OzipzReportMetricKey; active: boolean }) {
  const diff = comparison.diff[metric];
  return (
    <td className={`p-1 text-center ${metric.endsWith("Recipients") ? "border-r border-border" : ""}`}>
      <span className="font-bold text-foreground">{fmt(comparison.recorded[metric])}</span>
      {active && diff !== 0 && (
        <span
          className="ml-1 text-[10px] font-semibold text-red-600 dark:text-red-400"
          title="Ewidencja minus sprawozdanie"
        >
          ({diff > 0 ? "+" : ""}{fmt(diff)})
        </span>
      )}
    </td>
  );
}

export function TargetsComplianceTable({ rows, viewMode, onCellChange, summary }: TargetsComplianceTableProps) {
  const isCumulative = viewMode === "cumulative";
  const lastMonth = summary.lastReportedMonth;

  return (
    <div className="overflow-x-auto rounded-[3px] border border-border bg-background shadow-xs select-none">
      <table className="w-full text-xs text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <th rowSpan={3} className="py-2.5 px-3 w-32 border-r border-border">
              {isCumulative ? "Od stycznia do" : "Miesiąc"}
            </th>
            <th colSpan={4} className="py-2 px-2 text-center border-r border-border">
              Działania programowe
            </th>
            <th colSpan={4} className="py-2 px-2 text-center border-r border-border">
              Działania nieprogramowe
            </th>
            <th rowSpan={3} className="py-2 px-2 text-center w-36">
              Zgodność
            </th>
          </tr>
          <tr className="bg-muted/40 border-b border-border text-[10.5px] font-semibold text-muted-foreground">
            <th colSpan={2} className="py-1 px-1.5 text-center">Działania (DZ)</th>
            <th colSpan={2} className="py-1 px-1.5 text-center border-r border-border">Odbiorcy (ODB)</th>
            <th colSpan={2} className="py-1 px-1.5 text-center">Działania (DZ)</th>
            <th colSpan={2} className="py-1 px-1.5 text-center border-r border-border">Odbiorcy (ODB)</th>
          </tr>
          <tr className="bg-muted/30 border-b border-border text-[10px] font-medium text-muted-foreground">
            {REPORT_METRIC_KEYS.map((k) => (
              <SubHeaders key={k} metric={k} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono text-[11px]">
          {rows.map((r) => {
            const comparison = isCumulative ? r.cumulative : r.monthly;
            // Narastająco pokazujemy tylko do ostatniego wpisanego sprawozdania – dalej nie ma z czym porównać.
            const dimmed = isCumulative && r.month > lastMonth;

            return (
              <tr key={r.month} className={`hover:bg-muted transition-colors ${dimmed ? "opacity-40" : ""}`}>
                <td className="py-2 px-3 font-sans font-semibold text-foreground border-r border-border/80">
                  <div className="flex items-center gap-1.5">
                    <span>{r.monthEmoji}</span>
                    <span>{r.monthLabel}</span>
                  </div>
                </td>

                {REPORT_METRIC_KEYS.map((k) => (
                  <MetricCells
                    key={k}
                    row={r}
                    metric={k}
                    comparison={comparison}
                    editable={!isCumulative}
                    onCellChange={onCellChange}
                  />
                ))}

                <td className="py-2 px-2 text-center font-sans">
                  <div className="flex flex-col items-center gap-1">
                    <ComplianceStatusBadge status={comparison.status} />
                    {!isCumulative && r.openActionsCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400"
                        title="Działania z tego miesiąca, które nie są oznaczone jako wykonane ani odwołane – nie są liczone do ewidencji wykonania"
                      >
                        <Clock className="size-3" />
                        {r.openActionsCount} niezamkn.
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-muted/50 font-bold border-t-2 border-border text-foreground font-mono text-[11px]">
          <tr>
            <td className="py-2.5 px-3 font-sans border-r border-border">
              {lastMonth > 0 ? `Narastająco do: ${MONTH_NAMES_PL[lastMonth - 1].toLowerCase()}` : "Narastająco"}
            </td>
            {REPORT_METRIC_KEYS.map((k) => (
              <FooterCells key={k} metric={k} comparison={summary.cumulative} active={lastMonth > 0} />
            ))}
            <td className="py-2 px-2 text-center font-sans">
              <ComplianceStatusBadge status={summary.cumulative.status} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SubHeaders({ metric }: { metric: OzipzReportMetricKey }) {
  return (
    <>
      <th className="py-1 px-1.5 text-center w-20" title={`Liczba z wysłanego sprawozdania: ${METRIC_TITLES[metric]}`}>
        Sprawozd.
      </th>
      <th
        className={`py-1 px-1.5 text-center w-24 ${metric.endsWith("Recipients") ? "border-r border-border" : ""}`}
        title={`Wykonanie zapisane w ewidencji: ${METRIC_TITLES[metric]}`}
      >
        Ewidencja
      </th>
    </>
  );
}

function MetricCells({
  row,
  metric,
  comparison,
  editable,
  onCellChange,
}: {
  row: OzipzMonthlyComplianceRow;
  metric: OzipzReportMetricKey;
  comparison: OzipzReportComparison;
  editable: boolean;
  onCellChange: TargetsComplianceTableProps["onCellChange"];
}) {
  return (
    <>
      <td className="p-1 text-center">
        {editable ? (
          <Input
            type="number"
            min={0}
            value={row.hasReport ? comparison.reported[metric] : ""}
            placeholder="–"
            onChange={(e) => onCellChange(row.month, metric, e.target.value)}
            className={`h-6 text-center text-[11px] font-mono mx-auto bg-background p-0.5 ${metric.endsWith("Recipients") ? "w-16" : "w-14"}`}
            title={`${row.monthLabel} – ${METRIC_TITLES[metric]} wg wysłanego sprawozdania`}
          />
        ) : (
          <span className="text-muted-foreground">{fmt(comparison.reported[metric])}</span>
        )}
      </td>
      <RecordedCell comparison={comparison} metric={metric} active={row.hasReport} />
    </>
  );
}

function FooterCells({ metric, comparison, active }: { metric: OzipzReportMetricKey; comparison: OzipzReportComparison; active: boolean }) {
  return (
    <>
      <td className="p-1.5 text-center">{fmt(comparison.reported[metric])}</td>
      <RecordedCell comparison={comparison} metric={metric} active={active} />
    </>
  );
}
