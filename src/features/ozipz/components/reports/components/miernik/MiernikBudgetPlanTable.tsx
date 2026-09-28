import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MetricPlanState } from "../reportConstants";

interface MetricSummaryState {
  totalActions: number;
  totalPeople: number;
  programoweActions: number;
  programowePeople: number;
  otherActions: number;
  otherPeople: number;
  totalActionsPercent: number | null;
  totalPeoplePercent: number | null;
  programActionsPercent: number | null;
  programPeoplePercent: number | null;
}

interface MiernikBudgetPlanTableProps {
  year: number;
  metricPlan: MetricPlanState;
  metricSummary: MetricSummaryState;
  onMetricPlanChange: (updater: (prev: MetricPlanState) => MetricPlanState) => void;
}

export function MiernikBudgetPlanTable({
  year,
  metricPlan,
  metricSummary,
  onMetricPlanChange,
}: MiernikBudgetPlanTableProps) {
  const rows = [
    {
      label: "Razem · 20.5.1.W",
      planActionsKey: "razemDzialania" as const,
      planPeopleKey: "razemUczestnicy" as const,
      actions: metricSummary.totalActions,
      people: metricSummary.totalPeople,
      actionsPct: metricSummary.totalActionsPercent,
      peoplePct: metricSummary.totalPeoplePercent,
      strong: true,
    },
    {
      label: "Programy · 20.5.1.2.W",
      planActionsKey: "programyDzialania" as const,
      planPeopleKey: "programyUczestnicy" as const,
      actions: metricSummary.programoweActions,
      people: metricSummary.programowePeople,
      actionsPct: metricSummary.programActionsPercent,
      peoplePct: metricSummary.programPeoplePercent,
      strong: false,
    },
    {
      label: "Akcje · nieprogramowe",
      planActionsKey: null,
      planPeopleKey: null,
      actions: metricSummary.otherActions,
      people: metricSummary.otherPeople,
      actionsPct: null,
      peoplePct: null,
      strong: false,
    },
  ];

  return (
    <Card className="rounded-[3px] border border-border/80 bg-card shadow-none">
      <CardContent className="space-y-2 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Plan roczny i wykonanie
            </h3>
            <p className="text-sm text-muted-foreground">
              Edytuj wartości planowane, a następnie wybierz „Zapisz plan roczny”. Wykonanie dotyczy wybranego okresu.
            </p>
          </div>
          <Badge variant="outline" className="rounded-[2px] font-mono text-[10px]">
            Rok {year}
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-[3px] border border-border/80 bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Składowa Miernika
                </th>
                <th scope="col" className="w-28 px-3 py-2 text-center">
                  Plan działań
                </th>
                <th scope="col" className="w-24 px-3 py-2 text-right">
                  Wykonane działania
                </th>
                <th scope="col" className="w-20 px-3 py-2 text-right">
                  Realizacja działań
                </th>
                <th scope="col" className="w-28 px-3 py-2 text-center">
                  Plan uczestników
                </th>
                <th scope="col" className="w-24 px-3 py-2 text-right">
                  Uczestnicy
                </th>
                <th scope="col" className="w-20 px-3 py-2 text-right">
                  Realizacja uczestników
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    row.strong ? "bg-primary/5 font-semibold" : "bg-card"
                  )}
                >
                  <td className="px-3 py-2 text-xs text-foreground font-medium">{row.label}</td>
                  <td className="px-3 py-1.5 text-center">
                    {row.planActionsKey ? (
                      <Input
                        type="number"
                        min={0}
                        aria-label={`Plan działań: ${row.label}`}
                        value={metricPlan[row.planActionsKey] ?? ""}
                        onChange={(event) => {
                          const key = row.planActionsKey!;
                          onMetricPlanChange((prev) => ({
                            ...prev,
                            [key]: Math.max(0, Number(event.target.value) || 0),
                          }));
                        }}
                        className="h-9 w-24 text-center font-mono text-xs"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {row.actions.toLocaleString("pl-PL")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {row.actionsPct === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant={row.actionsPct >= 100 ? "default" : "secondary"}
                        className="rounded-[2px] font-mono text-[10px]"
                      >
                        {row.actionsPct.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {row.planPeopleKey ? (
                      <Input
                        type="number"
                        min={0}
                        aria-label={`Plan uczestników: ${row.label}`}
                        value={metricPlan[row.planPeopleKey] ?? ""}
                        onChange={(event) => {
                          const key = row.planPeopleKey!;
                          onMetricPlanChange((prev) => ({
                            ...prev,
                            [key]: Math.max(0, Number(event.target.value) || 0),
                          }));
                        }}
                        className="h-9 w-24 text-center font-mono text-xs"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {row.people.toLocaleString("pl-PL")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {row.peoplePct === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant={row.peoplePct >= 100 ? "default" : "secondary"}
                        className="rounded-[2px] font-mono text-[10px]"
                      >
                        {row.peoplePct.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
