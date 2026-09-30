import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, FileCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OzipzAction } from "../../../types/ozipz.types";
import {
  calculateMonthlyComplianceMatrix,
  getDefaultMonthlyTargets,
  loadMonthlyTargets,
  saveMonthlyTargets as saveMonthlyTargetsLocalStorage,
  monthlyTargetsArrayToYearlyMap,
  type OzipzYearlyMonthlyTargets,
  type OzipzReportMetricKey,
} from "../../../utils/monthlyTargetsUtils";
import { useMonthlyTargets, useDictionaries } from "../../../store/useOzipzDbStore";
import { TargetsSummaryKpiCards } from "./targets/TargetsSummaryKpiCards";
import { TargetsComplianceTable, type ComplianceViewMode } from "./targets/TargetsComplianceTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";

export interface MonthlyTargetsComplianceTabProps {
  year: number;
  actions: OzipzAction[];
  onYearChange?: (year: number) => void;
  showKpiSummary?: boolean;
}

export function MonthlyTargetsComplianceTab({
  year,
  actions,
  showKpiSummary = true,
}: MonthlyTargetsComplianceTabProps) {
  const { monthlyTargets: dbMonthlyTargets, saveMonthlyTargets } = useMonthlyTargets(year);
  const { jrwaInterventionKindMap } = useDictionaries();

  const [targets, setTargets] = useState<OzipzYearlyMonthlyTargets>(() => {
    if (dbMonthlyTargets && dbMonthlyTargets.length > 0) {
      return monthlyTargetsArrayToYearlyMap(dbMonthlyTargets);
    }
    const legacy = loadMonthlyTargets(year);
    const hasLegacy = Object.values(legacy).some(
      (m) => m.programActions > 0 || m.programRecipients > 0 || m.otherActions > 0 || m.otherRecipients > 0
    );
    return hasLegacy ? legacy : getDefaultMonthlyTargets();
  });

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ComplianceViewMode>("monthly");

  const prevYearRef = useRef(year);

  // Synchronizacja przy zmianie roku lub po załadowaniu danych z bazy
  useEffect(() => {
    if (prevYearRef.current !== year) {
      prevYearRef.current = year;
      setIsDirty(false);
      if (dbMonthlyTargets && dbMonthlyTargets.length > 0) {
        setTargets(monthlyTargetsArrayToYearlyMap(dbMonthlyTargets));
      } else {
        const legacy = loadMonthlyTargets(year);
        const hasLegacy = Object.values(legacy).some(
          (m) => m.programActions > 0 || m.programRecipients > 0 || m.otherActions > 0 || m.otherRecipients > 0
        );
        setTargets(hasLegacy ? legacy : getDefaultMonthlyTargets());
      }
    } else if (!isDirty) {
      if (dbMonthlyTargets && dbMonthlyTargets.length > 0) {
        setTargets(monthlyTargetsArrayToYearlyMap(dbMonthlyTargets));
      } else {
        const legacy = loadMonthlyTargets(year);
        const hasLegacy = Object.values(legacy).some(
          (m) => m.programActions > 0 || m.programRecipients > 0 || m.otherActions > 0 || m.otherRecipients > 0
        );
        setTargets(hasLegacy ? legacy : getDefaultMonthlyTargets());
      }
    }
  }, [year, dbMonthlyTargets, isDirty]);

  // Porównanie wpisanych sprawozdań z ewidencją (miesięcznie i narastająco)
  const { rows, summary } = useMemo(() => {
    return calculateMonthlyComplianceMatrix({
      actions,
      targets,
      year,
      customKindMap: jrwaInterventionKindMap,
    });
  }, [actions, targets, year, jrwaInterventionKindMap]);

  // Aktualizacja pojedynczej liczby ze sprawozdania
  const handleCellChange = (month: number, field: OzipzReportMetricKey, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setTargets((prev) => ({
      ...prev,
      [month]: {
        ...(prev[month] || {
          month,
          programActions: 0,
          programRecipients: 0,
          otherActions: 0,
          otherRecipients: 0,
        }),
        [field]: num,
      },
    }));
    setIsDirty(true);
  };

  // Trwały zapis liczb ze sprawozdań do bazy danych
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveMonthlyTargets(year, targets);
      saveMonthlyTargetsLocalStorage(year, targets);
      setIsDirty(false);
      toast.success(`Zapisano liczby ze sprawozdań za rok ${year}`);
    } catch (err) {
      console.error("Błąd zapisu sprawozdań w bazie danych:", err);
      toast.error("Nie udało się zapisać sprawozdań w bazie danych");
    } finally {
      setIsSaving(false);
    }
  };

  const performResetDefaults = () => {
    setTargets(getDefaultMonthlyTargets());
    setIsDirty(true);
    toast.info("Wyczyszczono wpisane sprawozdania. Kliknij 'Zapisz', aby utrwalić zmianę.");
  };

  // Wyczyszczenie wszystkich wpisanych sprawozdań roku
  const handleResetDefaults = () => {
    executeConfirmedAction(
      `Czy na pewno chcesz wyczyścić wszystkie wpisane sprawozdania za rok ${year}?`,
      performResetDefaults,
      () => setShowConfirmReset(true)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-[3px] text-xs text-purple-900 dark:text-purple-300">
        <FileCheck2 className="size-4 text-purple-600 shrink-0 mt-0.5" />
        <span>
          <strong>Zgodność ze sprawozdaniami:</strong> wpisz liczby z miesięcznych sprawozdań wysłanych do kierownictwa.
          Aplikacja porównuje je z wykonaniem zapisanym w ewidencji (tylko działania wykonane) – miesięcznie i narastająco.
          Każda różnica oznacza, że ewidencja nie odpowiada temu, co zostało wysłane.
        </span>
      </div>

      {showKpiSummary && <TargetsSummaryKpiCards summary={summary} />}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-40 bg-foreground text-background"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>{isSaving ? "Zapisywanie..." : "Zapisz"}</span>
            {isDirty && !isSaving && <span className="text-[10px] bg-red-500 rounded-full h-2 w-2" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetDefaults}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Wyczyść</span>
          </Button>
        </div>

        <div className="inline-flex rounded-[3px] border border-border p-0.5 text-xs" role="group" aria-label="Sposób porównania">
          {([
            ["monthly", "Miesięcznie"],
            ["cumulative", "Narastająco"],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`px-3 py-1 rounded-[2px] cursor-pointer transition-colors ${
                viewMode === mode ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <TargetsComplianceTable rows={rows} viewMode={viewMode} onCellChange={handleCellChange} summary={summary} />

      <ConfirmDialog
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={() => {
          performResetDefaults();
          setShowConfirmReset(false);
        }}
        title="Wyczyść wpisane sprawozdania"
        description={`Czy na pewno chcesz wyczyścić wszystkie wpisane sprawozdania za rok ${year}? Wszystkie liczby zostaną wyzerowane.`}
        variant="destructive"
        confirmText="Wyczyść sprawozdania"
        cancelText="Anuluj"
      />
    </div>
  );
}
