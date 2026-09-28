import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OzipzAction } from "../../../types/ozipz.types";
import { ClipboardList, Activity, Users, Package } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { ReportGridTable } from "./ReportGridTable";
import { monthEmojis } from "./reportConstants";
import { SourceEntriesCard } from "./summary/SourceEntriesCard";
import { ReportHierarchyCard, type HierarchySection } from "./summary/ReportHierarchyCard";

export type { HierarchySection };

export interface MonthlyBreakdownItem {
  month: number;
  label: string;
  tasks: number;
  actions: number;
  recipients: number;
  materials: number;
  completed: number;
}

export interface ProgramStatisticsItem {
  month: number;
  label: string;
  programActions: number;
  otherActions: number;
  totalActions: number;
  programRecipients: number;
  otherRecipients: number;
  totalRecipients: number;
}

interface ReportSummaryTabProps {
  year: number;
  months: number[];
  actions: OzipzAction[];
  monthlyRows: MonthlyBreakdownItem[];
  statisticsRows: ProgramStatisticsItem[];
  reportHierarchy: HierarchySection[];
  maxMonthlyActions: number;
  summary: {
    tasks: number;
    actions: number;
    recipients: number;
    materials: number;
    completed: number;
  };
  showKpiSummary?: boolean;
}

export function ReportSummaryTab({
  year,
  months,
  actions,
  monthlyRows,
  statisticsRows,
  reportHierarchy,
  summary,
  showKpiSummary = true,
}: ReportSummaryTabProps) {
  return (
    <div className="space-y-4 select-none">
      {/* 1. KPI Cards */}
      {showKpiSummary && (
        <StatsGrid>
          <MetricCard title="Zadania w planie" value={summary.tasks.toLocaleString("pl-PL")} subtext={`${summary.completed} wykonanych`} icon={<ClipboardList className="size-4" />} />
          <MetricCard
            title="Działania edukacyjne"
            value={summary.actions.toLocaleString("pl-PL")}
            subtext={`dla ${months.length} wybranych m-cy`}
            icon={<Activity className="size-4" />}
            variant="primary"
          />
          <MetricCard title="Łączna liczba odbiorców" value={summary.recipients.toLocaleString("pl-PL")} subtext="uczestnicy bezpośredni i pośredni" icon={<Users className="size-4" />} variant="purple" />
          <MetricCard title="Wydane materiały" value={summary.materials.toLocaleString("pl-PL")} subtext="broszury, ulotki, plakaty" icon={<Package className="size-4" />} variant="amber" />
        </StatsGrid>
      )}

      {/* 2. Monthly Breakdown Table */}
      <Card className="rounded-[3px] border border-border bg-card shadow-none">
        <CardContent className="space-y-2 p-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Podsumowanie miesięczne
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Zestawienie liczby zadań, działań, odbiorców i materiałów w poszczególnych miesiącach.
              </p>
            </div>
          </div>

          <ReportGridTable
            minWidth={700}
            headers={["Miesiąc", "Planowane", "Wykonane", "Działania", "Odbiorcy", "Materiały", "Status"]}
            rows={monthlyRows
              .filter((row) => months.includes(row.month))
              .map((row) => [
                <div
                  key={`month-${row.month}`}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground"
                >
                  <span>{monthEmojis[row.month - 1]}</span>
                  <span>
                    {row.label} {year}
                  </span>
                </div>,
                <span key="tasks" className="font-mono text-xs text-foreground">
                  {row.tasks}
                </span>,
                <span key="comp" className="font-mono text-xs font-semibold text-emerald-700">
                  {row.completed}
                </span>,
                <strong key="act" className="font-mono text-xs text-primary">
                  {row.actions}
                </strong>,
                <span key="rec" className="font-mono text-xs font-semibold text-foreground">
                  {row.recipients.toLocaleString("pl-PL")}
                </span>,
                <span key="mat" className="font-mono text-xs text-foreground">
                  {row.materials.toLocaleString("pl-PL")}
                </span>,
                <Badge
                  key="st"
                  variant="outline"
                  className="h-5 rounded-[2px] font-mono text-[9px] font-bold border-border text-muted-foreground"
                >
                  {row.tasks > 0 ? `${Math.round((row.completed / row.tasks) * 100)}%` : "0%"}
                </Badge>,
              ])}
          />
        </CardContent>
      </Card>

      {/* 3. Program Breakdown Table */}
      <Card className="rounded-[3px] border border-border bg-card shadow-none">
        <CardContent className="space-y-2 p-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Statystyki programowe
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Działania i odbiorcy w podziale na programowe i pozaprogramowe.
              </p>
            </div>
          </div>

          <ReportGridTable
            minWidth={740}
            headers={[
              "Miesiąc",
              "Programowe (dz.)",
              "Pozaprogramowe (dz.)",
              "Razem działania",
              "Odbiorcy P",
              "Odbiorcy N",
              "Razem odbiorcy",
            ]}
            rows={statisticsRows
              .filter((row) => months.includes(row.month))
              .map((row) => [
                <div
                  key={`stat-${row.month}`}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground"
                >
                  <span>{monthEmojis[row.month - 1]}</span>
                  <span>
                    {row.label} {year}
                  </span>
                </div>,
                <span key="pa" className="font-mono text-xs font-bold text-primary">
                  {row.programActions}
                </span>,
                <span key="oa" className="font-mono text-xs text-foreground">
                  {row.otherActions}
                </span>,
                <strong key="ta" className="font-mono text-xs text-foreground">
                  {row.totalActions}
                </strong>,
                <span key="pr" className="font-mono text-xs font-semibold text-indigo-700">
                  {row.programRecipients.toLocaleString("pl-PL")}
                </span>,
                <span key="or" className="font-mono text-xs text-foreground">
                  {row.otherRecipients.toLocaleString("pl-PL")}
                </span>,
                <strong key="tr" className="font-mono text-xs text-foreground">
                  {row.totalRecipients.toLocaleString("pl-PL")}
                </strong>,
              ])}
          />
        </CardContent>
      </Card>

      {/* 4. Hierarchical Structure Table */}
      <ReportHierarchyCard reportHierarchy={reportHierarchy} />

      {/* 5. Source Entries Collapsible Card */}
      <SourceEntriesCard actions={actions} />
    </div>
  );
}
