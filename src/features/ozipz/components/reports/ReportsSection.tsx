import { useState } from "react";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzMaterial,
  OzipzDistribution,
  OzipzScheduleEvent,
  OzipzFacility,
  OzipzPublication,
} from "../../types/ozipz.types";
import { ReportHeaderCard } from "./components/ReportHeaderCard";
import { ReportFilterBar, type ReportViewMode } from "./components/ReportFilterBar";
import { ReportSummaryTab } from "./components/ReportSummaryTab";
import { ReportWakacjeTab } from "./components/ReportWakacjeTab";
import { ReportActionBreakdownTab } from "./components/ReportActionBreakdownTab";
import { ReportMiernikTab } from "./components/ReportMiernikTab";
import { MonthlyTargetsComplianceTab } from "./components/MonthlyTargetsComplianceTab";
import { MunicipalityDetailedTab } from "./MunicipalityDetailedTab";
import { ReportGisTab } from "./gis/ReportGisTab";
import {
  useActions,
  usePrograms,
  useMaterials,
  useFacilities,
  useDictionaries,
} from "../../store/useOzipzDbStore";
import { useReportsData } from "./useReportsData";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

interface ReportsSectionProps {
  initialMode?: ReportViewMode;
  actions?: OzipzAction[];
  programs?: OzipzProgram[];
  participations?: OzipzSchoolParticipation[];
  materials?: OzipzMaterial[];
  distributions?: OzipzDistribution[];
  scheduleEvents?: OzipzScheduleEvent[];
  facilities?: OzipzFacility[];
  publications?: OzipzPublication[];
  municipalities?: string[];
}

export function ReportsSection(props: ReportsSectionProps) {
  const actionsStore = useActions();
  const programsStore = usePrograms();
  const materialsStore = useMaterials();
  const facilitiesStore = useFacilities();
  const dictStore = useDictionaries();

  const allActions = props.actions ?? actionsStore.actions;
  const participations = props.participations ?? programsStore.participations;
  const facilities = props.facilities ?? facilitiesStore.facilities;
  const distributions = props.distributions ?? materialsStore.distributions;
  const municipalities = props.municipalities ?? dictStore.municipalities.map((m) => m.label || m.code);

  const [exportOpen, setExportOpen] = useState(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [months, setMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [reportMode, setReportMode] = useState<ReportViewMode>(props.initialMode ?? "summary");
  const [breakdownSelection, setBreakdownSelection] = useState("");
  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("reports");

  const reportsData = useReportsData({
    allActions,
    year,
    months,
  });

  const {
    metricPlan,
    setMetricPlan,
    handlePersistMetricPlan,
    exportError,
    exportSuccess,
    exportPending,
    preparedPersonId,
    setPreparedPersonId,
    persons,
    yearActions,
    filteredActions,
    summary,
    vacationActionSummary,
    monthlyRows,
    maxMonthlyActions,
    statisticsRows,
    metricSummary,
    reportHierarchy,
    vacationSummary,
    handleExportXlsx,
    handleExportAnnex,
  } = reportsData;

  return (
    <div className="space-y-4 select-none">
      <ReportHeaderCard
        miernikMode={reportMode === "miernik"}
        onOpenMiernikExport={() => setExportOpen(true)}
        year={year}
        onYearChange={setYear}
        months={months}
        actions={filteredActions}
        preparedPersonId={preparedPersonId}
        onPreparedPersonChange={setPreparedPersonId}
        persons={persons}
        exportPending={exportPending}
        exportError={exportError}
        exportSuccess={exportSuccess}
        onExportWorkbook={handleExportXlsx}
        onExportAnnex={(variant) => handleExportAnnex(variant)}
      />

      <ReportFilterBar
        reportMode={reportMode}
        onReportModeChange={(mode) => {
          if (mode === "miernik" && months.length === 0) setMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
          setReportMode(mode);
        }}
        months={months}
        onMonthsChange={setMonths}
        showKpiSummary={showKpiSummary}
        onToggleKpiSummary={toggleKpiSummary}
      />

      {reportMode === "summary" && (
        <ReportSummaryTab
          year={year}
          months={months}
          actions={filteredActions}
          monthlyRows={monthlyRows}
          statisticsRows={statisticsRows}
          reportHierarchy={reportHierarchy}
          maxMonthlyActions={maxMonthlyActions}
          summary={summary}
          showKpiSummary={showKpiSummary}
        />
      )}

      {reportMode === "akcja" && (
        <ReportActionBreakdownTab
          yearActions={yearActions}
          filteredActions={filteredActions}
          year={year}
          months={months}
          selected={breakdownSelection}
          onSelectedChange={setBreakdownSelection}
          showKpiSummary={showKpiSummary}
        />
      )}

      {reportMode === "wakacje" && (
        <ReportWakacjeTab
          monthsCount={months.length}
          summary={vacationActionSummary}
          vacationSummary={vacationSummary}
          showKpiSummary={showKpiSummary}
        />
      )}

      {reportMode === "miernik" && (
        <ReportMiernikTab
          exportOpen={exportOpen}
          onExportOpenChange={setExportOpen}
          preparedBy={preparedPersonId}
          onPreparedByChange={setPreparedPersonId}
          year={year}
          months={months}
          onMonthsChange={setMonths}
          metricPlan={metricPlan}
          metricSummary={metricSummary}
          onMetricPlanChange={setMetricPlan}
          onPersistMetricPlan={handlePersistMetricPlan}
          showKpiSummary={showKpiSummary}
        />
      )}

      {reportMode === "gis" && (
        <ReportGisTab actions={filteredActions} facilities={facilities} year={year} months={months} />
      )}

      {reportMode === "gminy" && (
        <MunicipalityDetailedTab
          participations={participations}
          actions={filteredActions}
          facilities={facilities}
          distributions={distributions}
          municipalities={municipalities}
        />
      )}

      {reportMode === "cele_miesieczne" && (
        <MonthlyTargetsComplianceTab
          year={year}
          actions={allActions}
          onYearChange={setYear}
          showKpiSummary={showKpiSummary}
        />
      )}
    </div>
  );
}
