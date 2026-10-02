import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { Activity, ClipboardCopy, FileSpreadsheet, ListChecks, MapPin, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { Select, type SelectOption } from "@/components/ui/select";
import type { OzipzAction } from "../../../types/ozipz.types";
import { useMaterials } from "../../../store/useOzipzDbStore";
import {
  actionBreakdownPeriodLabel,
  buildActionBreakdown,
  formatActionBreakdownText,
  listActionBreakdownOptions,
  matchesActionBreakdown,
  plural,
  ENTRY_FORMS,
  type ActionBreakdownRow,
} from "../../../utils/actionBreakdown";
import { downloadActionBreakdownWorkbook } from "../../../utils/actionBreakdownExport";
import { formatDatePl } from "../../../utils/dateUtils";
import { POLISH_MONTHS } from "../../../utils/annex/annexConstants";
import { ReportGridTable } from "./ReportGridTable";
import { CampaignFormCard } from "./CampaignFormCard";
import { statusLabels } from "./reportConstants";

interface ReportActionBreakdownTabProps {
  yearActions: OzipzAction[];
  filteredActions: OzipzAction[];
  year: number;
  months: number[];
  selected: string;
  onSelectedChange: (value: string) => void;
  showKpiSummary?: boolean;
}

const n = (value: number) => value.toLocaleString("pl-PL");

function SummaryTable({ title, firstHeader, rows }: { title: string; firstHeader: string; rows: ActionBreakdownRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">{title}</p>
      <ReportGridTable
        minWidth={260}
        headers={[firstHeader, "Dz.", "Odb."]}
        rows={rows.map((row) => [
          <span key="l" className="text-xs">{row.label}</span>,
          <span key="a" className="font-mono text-xs">{n(row.actions)}</span>,
          <span key="r" className="font-mono text-xs font-bold text-foreground">{n(row.recipients)}</span>,
        ])}
      />
    </div>
  );
}

export function ReportActionBreakdownTab({
  yearActions,
  filteredActions,
  year,
  months,
  selected,
  onSelectedChange,
  showKpiSummary = true,
}: ReportActionBreakdownTabProps) {
  const { materials, distributions } = useMaterials();
  const [exporting, setExporting] = useState(false);

  const options = useMemo(() => listActionBreakdownOptions(yearActions, months), [yearActions, months]);
  const selectedOption = options.find((o) => o.value === selected);

  const selectOptions: SelectOption[] = useMemo(
    () =>
      options.map((o) => ({
        value: o.value,
        label: o.label,
        group: o.kind === "program" ? "Zadania z planu pracy" : "Kampanie / akcje",
        badge: String(o.periodEntries),
        badgeVariant: o.periodEntries > 0 ? "secondary" : "outline",
      })),
    [options]
  );

  const breakdown = useMemo(() => {
    if (!selected) return null;
    const scoped = filteredActions.filter((a) => matchesActionBreakdown(a, selected));
    return buildActionBreakdown(scoped, months, { distributions, materials });
  }, [selected, filteredActions, months, distributions, materials]);

  const label = selectedOption?.label ?? "";
  const period = actionBreakdownPeriodLabel(year, months);
  const hasEntries = Boolean(breakdown && breakdown.entries.length > 0);

  const handleCopy = async () => {
    if (!breakdown) return;
    try {
      await navigator.clipboard.writeText(formatActionBreakdownText(breakdown, { label, year, months }));
      toast.success("Skopiowano rozpiskę do schowka");
    } catch {
      toast.error("Nie udało się skopiować do schowka");
    }
  };

  const handleExport = async () => {
    if (!breakdown) return;
    setExporting(true);
    try {
      await downloadActionBreakdownWorkbook(breakdown, { label, year, months });
      toast.success("Pobrano rozpiskę .xlsx");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd eksportu rozpiski");
    } finally {
      setExporting(false);
    }
  };

  let lastMonth: number | null | undefined;

  return (
    <div className="space-y-3">
      <Card className="rounded-[3px] border border-border bg-card shadow-none">
        <CardContent className="space-y-3 p-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 items-end gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[3px] border border-primary/25 bg-primary/10 text-primary">
                <ListChecks className="size-5" />
              </div>
              <Select
                className="min-w-0 flex-1 lg:max-w-xl"
                label="Akcja / zadanie"
                value={selected}
                onChange={onSelectedChange}
                options={selectOptions}
                placeholder="Wybierz akcję, aby zobaczyć rozpiskę"
                searchPlaceholder="Szukaj akcji lub zadania..."
                emptyText={`Brak akcji z wpisami w ${year} r.`}
                clearable
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!hasEntries}>
                <ClipboardCopy className="size-3.5" />
                Kopiuj rozpiskę
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!hasEntries || exporting}>
                <FileSpreadsheet className="size-3.5" />
                {exporting ? "Eksportowanie…" : "Eksport .xlsx"}
              </Button>
            </div>
          </div>
          {selectedOption && (
            <p className="text-[11px] text-muted-foreground">
              {selectedOption.kind === "program" ? "Zadanie z planu pracy" : "Kampania / akcja"} · okres: {period} ·{" "}
              {selectedOption.periodEntries} z {selectedOption.yearEntries} wpisów w roku
            </p>
          )}
        </CardContent>
      </Card>

      {!selected || !breakdown ? (
        <EmptyState
          icon={ListChecks}
          title="Wybierz akcję"
          description="Po wybraniu akcji lub zadania zobaczysz wszystko, co zrobiono w jej ramach w zaznaczonych miesiącach: formy, placówki, odbiorców, materiały i pełny wykaz działań."
        />
      ) : !hasEntries ? (
        <EmptyState
          icon={ListChecks}
          title="Brak działań w wybranych miesiącach"
          description={
            selectedOption && selectedOption.yearEntries > 0
              ? `Ta akcja ma ${plural(selectedOption.yearEntries, ENTRY_FORMS)} w ${year} r., ale żaden nie przypada na okres: ${period}. Zmień zakres miesięcy.`
              : `Brak wpisów dla tej akcji w ${year} r.`
          }
        />
      ) : (
        <>
          {showKpiSummary && (
            <StatsGrid columns={4}>
              <MetricCard
                title="Działania"
                value={n(breakdown.totals.actions)}
                subtext={plural(breakdown.totals.entries, ENTRY_FORMS)}
                icon={<Activity className="size-4" />}
              />
              <MetricCard title="Odbiorcy" value={n(breakdown.totals.recipients)} subtext="wszyscy odbiorcy działań" icon={<Users className="size-4" />} variant="primary" />
              <MetricCard title="Materiały" value={n(breakdown.totals.materials)} subtext="wydane sztuki" icon={<Package className="size-4" />} variant="amber" />
              <MetricCard
                title="Placówki"
                value={n(breakdown.totals.facilities)}
                subtext={`w ${breakdown.totals.municipalities} ${breakdown.totals.municipalities === 1 ? "gminie" : "gminach"}`}
                icon={<MapPin className="size-4" />}
                variant="emerald"
              />
            </StatsGrid>
          )}

          <CampaignFormCard breakdown={breakdown} heading={`Sprawozdanie z kampanii: ${label} (${period})`} />

          <Card className="rounded-[3px] border border-border bg-card shadow-none">
            <CardContent className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryTable title="Miesiące" firstHeader="Miesiąc" rows={breakdown.byMonth} />
              <SummaryTable title="Formy działań" firstHeader="Forma" rows={breakdown.byForm} />
              <SummaryTable title="Gminy" firstHeader="Gmina" rows={breakdown.byMunicipality} />
              {breakdown.materials.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Materiały</p>
                  <ReportGridTable
                    minWidth={260}
                    headers={["Tytuł", "Szt."]}
                    rows={breakdown.materials.map((m) => [
                      <span key="l" className="text-xs">{m.title}</span>,
                      <span key="v" className="font-mono text-xs font-bold text-foreground">{n(m.quantity)}</span>,
                    ])}
                  />
                </div>
              )}
              {breakdown.byEducator.length > 1 && (
                <SummaryTable title="Prowadzący" firstHeader="Osoba" rows={breakdown.byEducator} />
              )}
              <div className="space-y-1.5 sm:col-span-2 xl:col-span-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Placówki</p>
                <ReportGridTable
                  minWidth={480}
                  headers={["Placówka", "Gmina", "Dz.", "Odb."]}
                  rows={breakdown.byFacility.map((row) => [
                    <span key="l" className="text-xs">{row.label}</span>,
                    <span key="g" className="text-xs text-muted-foreground">{row.municipality || "—"}</span>,
                    <span key="a" className="font-mono text-xs">{n(row.actions)}</span>,
                    <span key="r" className="font-mono text-xs font-bold text-foreground">{n(row.recipients)}</span>,
                  ])}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3px] border border-border bg-card shadow-none">
            <CardContent className="space-y-2 p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Wykaz działań</h3>
                <Badge variant="muted" className="font-mono text-[10px] tabular-nums">{plural(breakdown.entries.length, ENTRY_FORMS)}</Badge>
              </div>
              <div className="overflow-x-auto overscroll-x-contain scrollbar-thin rounded-[3px] border border-border">
                <table className="w-full min-w-[860px] border-collapse text-left text-xs">
                  <thead className="border-b border-border bg-muted/40">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-3 py-2 whitespace-nowrap">Data</th>
                      <th scope="col" className="px-3 py-2">Działanie</th>
                      <th scope="col" className="px-3 py-2">Miejsce</th>
                      <th scope="col" className="px-3 py-2">Odbiorcy</th>
                      <th scope="col" className="px-3 py-2 text-right whitespace-nowrap">Dz.</th>
                      <th scope="col" className="px-3 py-2 text-right whitespace-nowrap">Odb.</th>
                      <th scope="col" className="px-3 py-2 text-right whitespace-nowrap">Mat.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {breakdown.entries.map((entry) => {
                      const monthHeader = entry.month !== lastMonth;
                      lastMonth = entry.month;
                      const statusLabel = entry.status && entry.status !== "wykonane" && entry.status !== "done"
                        ? statusLabels[entry.status] ?? entry.status
                        : null;
                      return (
                        <Fragment key={entry.id}>
                          {monthHeader && (
                            <tr className="bg-muted/25">
                              <td colSpan={7} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                                {entry.month ? POLISH_MONTHS[entry.month - 1] : "Bez daty"}
                              </td>
                            </tr>
                          )}
                          <tr className="align-top transition-colors hover:bg-muted/40">
                            <td className="px-3 py-2 font-mono whitespace-nowrap">{formatDatePl(entry.date, entry.date)}</td>
                            <td className="px-3 py-2">
                              <div className="font-semibold text-foreground">{entry.form}</div>
                              {entry.title && <div className="text-muted-foreground break-words">{entry.title}</div>}
                              {entry.materialTitles.length > 0 && (
                                <div className="text-[11px] text-muted-foreground">Materiały: {entry.materialTitles.join(", ")}</div>
                              )}
                              {statusLabel && (
                                <Badge variant="outline" className="mt-1 text-[10px]">{statusLabel}</Badge>
                              )}
                              {entry.notes && (
                                <details className="mt-1 text-[11px] text-muted-foreground">
                                  <summary className="cursor-pointer select-none hover:text-foreground">Opis</summary>
                                  <p className="mt-1 whitespace-pre-line select-text">{entry.notes}</p>
                                </details>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="break-words">{entry.facility || "—"}</div>
                              {entry.municipality && <div className="text-[11px] text-muted-foreground">gm. {entry.municipality}</div>}
                            </td>
                            <td className="px-3 py-2 max-w-[320px] whitespace-pre-line break-words text-muted-foreground">{entry.audience || "—"}</td>
                            <td className="px-3 py-2 text-right font-mono">{n(entry.actions)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-foreground">{n(entry.recipients)}</td>
                            <td className="px-3 py-2 text-right font-mono">{entry.materials ? n(entry.materials) : "—"}</td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
