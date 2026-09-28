import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Baby, ChevronDown, ChevronUp, Package, SearchX, Sun, UserRound, Users } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { ReportGridTable } from "./ReportGridTable";

export interface VacationAnalyticsSummary {
  recipientsSplit: {
    adults: number;
    childrenWithAge: number;
    childrenWithoutAge: number;
  };
  byActivity: { label: string; value: number }[];
  byGroup: { label: string; value: number }[];
  byMaterial: { label: string; value: number }[];
}

interface ReportWakacjeTabProps {
  monthsCount: number;
  summary: {
    tasks: number;
    actions: number;
    recipients: number;
    materials: number;
  };
  vacationSummary: VacationAnalyticsSummary;
  showKpiSummary?: boolean;
}

export function ReportWakacjeTab({
  monthsCount,
  summary,
  vacationSummary,
  showKpiSummary = true,
}: ReportWakacjeTabProps) {
  const [vacationDetailsOpen, setVacationDetailsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="rounded-[3px] border border-border bg-card shadow-none">
        <CardContent className="p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-[3px] border border-amber-300 bg-amber-50 text-amber-800">
                <Sun className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Bezpieczne Wakacje
                  </h3>
                  <Badge
                    variant="outline"
                    className="rounded-[2px] border-primary/25 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                  >
                    JRWA 966.14
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Kampania profilaktyczna · {monthsCount} {monthsCount === 1 ? "miesiąc" : "miesięcy"} w zestawieniu
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="h-7 rounded-[2px] border-primary/25 bg-primary/10 px-3 font-mono text-xs font-bold text-primary"
            >
              {summary.recipients.toLocaleString("pl-PL")} odbiorców
            </Badge>
          </div>
        </CardContent>
      </Card>

      {showKpiSummary && (
        <StatsGrid columns={3}>
          <MetricCard title="Działania" value={summary.actions.toLocaleString("pl-PL")} subtext={`${summary.tasks} zadań`} icon={<Activity className="size-4" />} />
          <MetricCard title="Odbiorcy" value={summary.recipients.toLocaleString("pl-PL")} subtext="suma wpisów odbiorców" icon={<Users className="size-4" />} variant="primary" />
          <MetricCard title="Materiały" value={summary.materials.toLocaleString("pl-PL")} subtext="wydane sztuki" icon={<Package className="size-4" />} variant="amber" />
          <MetricCard
            title="Dorośli"
            value={vacationSummary.recipientsSplit.adults.toLocaleString("pl-PL")}
            subtext="rodzice, kadra i inni dorośli"
            icon={<UserRound className="size-4" />}
            variant="blue"
          />
          <MetricCard
            title="Dzieci z wiekiem"
            value={vacationSummary.recipientsSplit.childrenWithAge.toLocaleString("pl-PL")}
            subtext="odbiorcy z przedziałem"
            icon={<Baby className="size-4" />}
            variant="emerald"
          />
          <MetricCard
            title="Dzieci bez wieku"
            value={vacationSummary.recipientsSplit.childrenWithoutAge.toLocaleString("pl-PL")}
            subtext="do uzupełnienia"
            icon={<SearchX className="size-4" />}
            variant={vacationSummary.recipientsSplit.childrenWithoutAge > 0 ? "rose" : "default"}
          />
        </StatsGrid>
      )}

      <Card className="rounded-[3px] border border-border bg-card shadow-none">
        <CardContent className="space-y-3 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Szczegółowe tabele analityczne
              </h3>
              <p className="text-[11px] text-muted-foreground">Rozbicie na formy, wiek, grupy, materiały i typy.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-[3px] border-input text-xs font-medium cursor-pointer"
              onClick={() => setVacationDetailsOpen((open) => !open)}
            >
              {vacationDetailsOpen ? <ChevronUp className="size-3.5 mr-1" /> : <ChevronDown className="size-3.5 mr-1" />}
              {vacationDetailsOpen ? "Ukryj szczegóły" : "Pokaż szczegóły"}
            </Button>
          </div>

          {vacationDetailsOpen && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 border-t border-border/60 pt-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Formy działań</p>
                <ReportGridTable
                  minWidth={220}
                  headers={["Forma", "Działania"]}
                  rows={vacationSummary.byActivity.map((row) => [
                    <span key="l" className="text-xs">
                      {row.label}
                    </span>,
                    <span key="v" className="font-mono text-xs font-bold text-foreground">
                      {row.value}
                    </span>,
                  ])}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Grupy odbiorców</p>
                <ReportGridTable
                  minWidth={220}
                  headers={["Grupa", "Osoby"]}
                  rows={vacationSummary.byGroup.map((row) => [
                    <span key="l" className="text-xs">
                      {row.label}
                    </span>,
                    <span key="v" className="font-mono text-xs font-bold text-foreground">
                      {row.value.toLocaleString("pl-PL")}
                    </span>,
                  ])}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Materiały</p>
                <ReportGridTable
                  minWidth={220}
                  headers={["Materiał", "Sztuki"]}
                  rows={vacationSummary.byMaterial.map((row) => [
                    <span key="l" className="text-xs">
                      {row.label}
                    </span>,
                    <span key="v" className="font-mono text-xs font-bold text-foreground">
                      {row.value.toLocaleString("pl-PL")}
                    </span>,
                  ])}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
