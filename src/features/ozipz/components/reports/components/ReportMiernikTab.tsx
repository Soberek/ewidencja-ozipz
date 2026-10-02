import { useState, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useDictionaries } from "../../../store/useOzipzDbStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MetricPlanState } from "./reportConstants";
import type { MetricPlanSource } from "../useReportsData";
import {
  aggregateActionsToProgramsData,
  exportToTemplate,
  exportToCumulativeTemplate,
  exportToExcel,
  downloadFullReportWorkbook,
  buildDefaultHeaderTitle,
  formatPeriodForHeader,
} from "../../../utils/reportAnnex";
import { MiernikExportCard } from "./miernik/MiernikExportCard";
import { MiernikBudgetPlanTable } from "./miernik/MiernikBudgetPlanTable";
import { MiernikAnnexProgramsTable } from "./miernik/MiernikAnnexProgramsTable";
import type { OzipzAction } from "../../../types/ozipz.types";

export interface MetricSummaryState {
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

interface ReportMiernikTabProps {
  exportOpen?: boolean;
  onExportOpenChange?: (open: boolean) => void;
  preparedBy?: string;
  onPreparedByChange?: (name: string) => void;
  year: number;
  yearActions: OzipzAction[];
  filteredActions: OzipzAction[];
  months?: number[];
  onMonthsChange?: (months: number[]) => void;
  metricPlan: MetricPlanState;
  metricSummary: MetricSummaryState;
  onMetricPlanChange: (updater: (prev: MetricPlanState) => MetricPlanState) => void;
  onPersistMetricPlan: () => Promise<boolean>;
  metricPlanSource: MetricPlanSource;
  showKpiSummary?: boolean;
}

export function ReportMiernikTab({
  exportOpen = false,
  onExportOpenChange,
  preparedBy = "",
  onPreparedByChange,
  onPersistMetricPlan,
  metricPlanSource,
  year,
  yearActions,
  filteredActions,
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  metricPlan,
  metricSummary,
  onMetricPlanChange,
  showKpiSummary = true,
}: ReportMiernikTabProps) {
  const { jrwaInterventionKindMap, jrwaInterventionNamesMap } = useDictionaries();

  const selectedMonths = months.length > 0 ? months : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Konfiguracja eksportu (Stacja, Sporządzający, Tytuł A1)
  const [stationName, setStationName] = useState("Myślibórz");
  const [customHeaderTitle, setCustomHeaderTitle] = useState("");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Dynamiczny domyślny nagłówek A1
  const defaultHeaderTitleZal1 = useMemo(
    () => buildDefaultHeaderTitle(1, stationName, selectedMonths, year),
    [stationName, selectedMonths, year]
  );
  const effectiveHeaderTitleZal1 = customHeaderTitle.trim() || defaultHeaderTitleZal1;

  const aggregatedData = useMemo(() => {
    return aggregateActionsToProgramsData(
      filteredActions,
      undefined,
      jrwaInterventionKindMap,
      jrwaInterventionNamesMap
    );
  }, [filteredActions, jrwaInterventionKindMap, jrwaInterventionNamesMap]);

  const cumulativeMonths = useMemo(() => Array.from({ length: Math.max(...selectedMonths) }, (_, index) => index + 1), [selectedMonths]);
  const cumulativeData = useMemo(() => aggregateActionsToProgramsData(
    yearActions,
    cumulativeMonths,
    jrwaInterventionKindMap,
    jrwaInterventionNamesMap
  ), [yearActions, cumulativeMonths, jrwaInterventionKindMap, jrwaInterventionNamesMap]);

  // Handlery eksportu
  const handleExportZal1 = async () => {
    setIsExporting("zal1");
    try {
      const ok = await exportToTemplate(
        aggregatedData,
        `Zalacznik_nr_1_OZIPZ_${year}_${formatPeriodForHeader(selectedMonths).replace(/[\s/\\:]+/g, "_")}`,
        preparedBy,
        effectiveHeaderTitleZal1
      );
      if (ok) toast.success("Pobrano plik Załącznika nr 1 (.xlsx)");
      else toast.error("Błąd podczas generowania Załącznika nr 1");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportZal2 = async () => {
    setIsExporting("zal2");
    try {
      const ok = await exportToCumulativeTemplate(
        cumulativeData,
        `Zalacznik_nr_2_narastajacy_OZIPZ_${year}_${formatPeriodForHeader(cumulativeMonths).replace(/[\s/\\:]+/g, "_")}`,
        preparedBy,
        customHeaderTitle.trim() || buildDefaultHeaderTitle(2, stationName, cumulativeMonths, year)
      );
      if (ok) toast.success("Pobrano plik Załącznika nr 2 (.xlsx)");
      else toast.error("Błąd podczas generowania Załącznika nr 2");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportStandardExcel = async () => {
    setIsExporting("excel");
    try {
      const ok = await exportToExcel(
        aggregatedData,
        `Miernik_Budzetowy_OZIPZ_${year}_${formatPeriodForHeader(selectedMonths).replace(/[\s/\\:]+/g, "_")}`
      );
      if (ok) toast.success("Pobrano arkusz Miernika Budżetowego (.xlsx)");
      else toast.error("Błąd podczas generowania Miernika Excel");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportFullWorkbook = async () => {
    setIsExporting("full");
    try {
      await downloadFullReportWorkbook(yearActions, year, selectedMonths, preparedBy);
      toast.success("Pobrano pełny skoroszyt sprawozdawczy OZiPZ (.xlsx)");
    } catch {
      toast.error("Błąd podczas generowania pełnego skoroszytu");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4 select-none">
        <p className="text-sm text-muted-foreground">
          {formatPeriodForHeader(selectedMonths)} {year} · Wykonanie za wybrany okres względem planu rocznego.
        </p>
        {showKpiSummary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Działania ogółem", code: "20.5.1.W", value: metricSummary.totalActions, plan: metricPlan.razemDzialania, percent: metricSummary.totalActionsPercent, unit: "działań" },
              { label: "Uczestnicy ogółem", code: "20.5.1.W", value: metricSummary.totalPeople, plan: metricPlan.razemUczestnicy, percent: metricSummary.totalPeoplePercent, unit: "uczestników" },
              { label: "Działania programowe", code: "20.5.1.2.W", value: metricSummary.programoweActions, plan: metricPlan.programyDzialania, percent: metricSummary.programActionsPercent, unit: "działań" },
              { label: "Uczestnicy programów", code: "20.5.1.2.W", value: metricSummary.programowePeople, plan: metricPlan.programyUczestnicy, percent: metricSummary.programPeoplePercent, unit: "uczestników" },
            ].map((item) => (
              <Card key={item.label} className="p-4 space-y-2 shadow-none">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.code}</div>
                <div className="text-2xl font-bold tabular-nums">{item.value.toLocaleString("pl-PL")}</div>
                <div className="text-sm tabular-nums">
                  {item.percent === null ? "Brak planu rocznego" : `${item.percent.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% planu rocznego`}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, item.percent ?? 0))}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.plan ? (item.value >= item.plan ? "Plan zrealizowany" : `Do planu brakuje ${(item.plan - item.value).toLocaleString("pl-PL")} ${item.unit}`) : "Uzupełnij plan w tabeli poniżej."}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* TABELA MIERNIKA BUDŻETOWEGO */}
        <MiernikBudgetPlanTable
          year={year}
          metricPlan={metricPlan}
          metricSummary={metricSummary}
          onMetricPlanChange={onMetricPlanChange}
        />

        <div className="flex items-center justify-end gap-3">
          <p className="text-xs text-muted-foreground">
            {metricPlanSource.kind === "loading"
              ? `Wczytywanie planu na ${year} r.…`
              : metricPlanSource.kind === "saved"
              ? `Plan na ${year} r. jest zapisany w bazie – zmiany w tabeli zapisują się automatycznie.`
              : metricPlanSource.kind === "inherited"
                ? `Brak planu na ${year} r. – podpowiedziano plan z ${metricPlanSource.fromYear} r. Zatwierdź go albo wpisz nowe wartości.`
                : `Brak planu na ${year} r. – wpisz wartości planowane w tabeli.`}
          </p>
          {metricPlanSource.kind !== "saved" && metricPlanSource.kind !== "loading" && (
            <Button
              variant="outline"
              onClick={async () => {
                if (await onPersistMetricPlan()) toast.success(`Zapisano plan miernika na ${year} r.`);
              }}
            >
              Zapisz plan roczny
            </Button>
          )}
        </div>
        <Dialog open={exportOpen} onOpenChange={onExportOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Eksport miernika</DialogTitle>
              <DialogDescription>{formatPeriodForHeader(selectedMonths)} {year}. Wybierz format i sprawdź dane podpisu.</DialogDescription>
            </DialogHeader>
        {/* PANEL EKSPORTU DO XLSX */}
        <MiernikExportCard
          stationName={stationName}
          preparedBy={preparedBy}
          customHeaderTitle={customHeaderTitle}
          defaultHeaderTitleZal1={defaultHeaderTitleZal1}
          isExporting={isExporting}
          totalActions={aggregatedData.allActions}
          cumulativeActions={cumulativeData.allActions}
          yearActionsCount={yearActions.length}
          onStationNameChange={setStationName}
          onPreparedByChange={(name) => onPreparedByChange?.(name)}
          onCustomHeaderTitleChange={setCustomHeaderTitle}
          onExportZal1={handleExportZal1}
          onExportZal2={handleExportZal2}
          onExportStandardExcel={handleExportStandardExcel}
          onExportFullWorkbook={handleExportFullWorkbook}
        />

          </DialogContent>
        </Dialog>

        {/* TABELA PROGRAMÓW (ZAŁĄCZNIK NR 1) */}
        <MiernikAnnexProgramsTable aggregatedData={aggregatedData} />
      </div>
    </TooltipProvider>
  );
}
