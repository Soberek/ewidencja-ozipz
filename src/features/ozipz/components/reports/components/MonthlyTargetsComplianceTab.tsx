import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, Copy, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OzipzAction } from "../../../types/ozipz.types";
import {
  calculateMonthlyComplianceMatrix,
  getDefaultMonthlyTargets,
  loadMonthlyTargets,
  saveMonthlyTargets as saveMonthlyTargetsLocalStorage,
  extractTargetsFromScheduleEvents,
  monthlyTargetsArrayToYearlyMap,
  type OzipzYearlyMonthlyTargets,
} from "../../../utils/monthlyTargetsUtils";
import { useSchedule, useMonthlyTargets, usePrograms, useDictionaries } from "../../../store/useOzipzDbStore";
import { TargetsSummaryKpiCards } from "./targets/TargetsSummaryKpiCards";
import { TargetsDistributeDialog } from "./targets/TargetsDistributeDialog";
import { TargetsComplianceTable } from "./targets/TargetsComplianceTable";
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
  const scheduleStore = useSchedule();
  const scheduleEvents = scheduleStore.scheduleEvents || [];
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
  const [showDistributeDialog, setShowDistributeDialog] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const [evenProgActions, setEvenProgActions] = useState<number>(60);
  const [evenProgRecipients, setEvenProgRecipients] = useState<number>(1500);
  const [evenOtherActions, setEvenOtherActions] = useState<number>(24);
  const [evenOtherRecipients, setEvenOtherRecipients] = useState<number>(600);

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

  // Kalkulacja macierzy zgodności na żywo
  const { rows, summary } = useMemo(() => {
    return calculateMonthlyComplianceMatrix({
      actions,
      targets,
      year,
      customKindMap: jrwaInterventionKindMap,
    });
  }, [actions, targets, year, jrwaInterventionKindMap]);

  // Aktualizacja pojedynczej komórki planu
  const handleCellChange = (
    month: number,
    field: "programActions" | "programRecipients" | "otherActions" | "otherRecipients",
    value: string
  ) => {
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

  // Trwały zapis planu pracy do relacyjnej bazy danych SQLite
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveMonthlyTargets(year, targets);
      saveMonthlyTargetsLocalStorage(year, targets);
      setIsDirty(false);
      toast.success(`Trwale zapisano miesięczny plan pracy na rok ${year} w bazie danych`);
    } catch (err) {
      console.error("Błąd zapisu planu pracy w bazie danych:", err);
      toast.error("Nie udało się zapisać planu pracy w bazie danych");
    } finally {
      setIsSaving(false);
    }
  };

  const programsStore = usePrograms();

  // Pobranie zaplanowanych zadań bezpośrednio z Harmonogramu
  const handlePullFromSchedule = () => {
    const extracted = extractTargetsFromScheduleEvents(scheduleEvents, year, programsStore.programs);
    setTargets(extracted);
    setIsDirty(true);
    toast.success(
      `Wczytano zaplanowane zadania z Harmonogramu / Planu Pracy na rok ${year}. Kliknij 'Zapisz Plan', aby zapisać.`
    );
  };

  // Równomierne rozdzielenie wartości rocznych na 12 miesięcy
  const handleEvenDistribute = () => {
    const newTargets = getDefaultMonthlyTargets();
    for (let m = 1; m <= 12; m++) {
      newTargets[m] = {
        month: m,
        programActions: Math.round(evenProgActions / 12),
        programRecipients: Math.round(evenProgRecipients / 12),
        otherActions: Math.round(evenOtherActions / 12),
        otherRecipients: Math.round(evenOtherRecipients / 12),
      };
    }
    setTargets(newTargets);
    setIsDirty(true);
    setShowDistributeDialog(false);
    toast.info("Rozdzielono zadania roczne równomiernie na 12 miesięcy. Pamiętaj o kliknięciu 'Zapisz Plan'.");
  };

  const performResetDefaults = () => {
    setTargets(getDefaultMonthlyTargets());
    setIsDirty(true);
    toast.info("Wyczyszczono plan. Kliknij 'Zapisz Plan', aby zapisać.");
  };

  // Przywrócenie pustego/domyślnego planu
  const handleResetDefaults = () => {
    executeConfirmedAction(
      "Czy na pewno chcesz wyczyścić plan wykonania na ten rok?",
      performResetDefaults,
      () => setShowConfirmReset(true)
    );
  };

  return (
    <div className="space-y-4">
      {/* Pasek informacyjny zgodności */}
      <div className="flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-[3px] text-xs text-purple-900 dark:text-purple-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-purple-600 shrink-0" />
          <span>
            <strong>Zgodność z Planem Pracy:</strong> Zestawienie faktycznie wykonanych działań z miesięcznym planem pracy w podziale na <strong>działania programowe</strong> i <strong>działania nieprogramowe</strong>.
          </span>
        </div>
      </div>

      {/* KPI Stats Header */}
      {showKpiSummary && <TargetsSummaryKpiCards summary={summary} />}

      {/* Pasek akcji i operacji na planie */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-40 bg-foreground text-background"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>{isSaving ? "Zapisywanie..." : "Zapisz Plan"}</span>
            {isDirty && !isSaving && <span className="text-[10px] bg-red-500 rounded-full h-2 w-2" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePullFromSchedule}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900"
            title="Automatycznie zlicza zaplanowane zadania z Harmonogramu / Miesięcznego Planu Pracy"
          >
            <CalendarDays className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Pobierz z Harmonogramu</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDistributeDialog(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Copy className="size-3.5 text-muted-foreground" />
            <span>Rozdziel Równomiernie</span>
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

        <p className="text-[11px] text-muted-foreground">
          * Wpisz zaplanowaną liczbę zadań programowych i nieprogramowych lub pobierz automatycznie z Harmonogramu.
        </p>
      </div>

      {/* Główna tabela macierzy zgodności planu wykonania */}
      <TargetsComplianceTable
        rows={rows}
        targets={targets}
        onCellChange={handleCellChange}
        summary={summary}
      />

      {/* Modal równomiernego rozłożenia rocznego */}
      <TargetsDistributeDialog
        isOpen={showDistributeDialog}
        onClose={() => setShowDistributeDialog(false)}
        year={year}
        progActions={evenProgActions}
        onProgActionsChange={setEvenProgActions}
        progRecipients={evenProgRecipients}
        onProgRecipientsChange={setEvenProgRecipients}
        otherActions={evenOtherActions}
        onOtherActionsChange={setEvenOtherActions}
        otherRecipients={evenOtherRecipients}
        onOtherRecipientsChange={setEvenOtherRecipients}
        onDistribute={handleEvenDistribute}
      />

      <ConfirmDialog
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={() => {
          performResetDefaults();
          setShowConfirmReset(false);
        }}
        title="Wyczyść plan wykonania"
        description="Czy na pewno chcesz wyczyścić plan wykonania na ten rok? Wszystkie zaplanowane liczby zadań zostaną zresetowane do zera."
        variant="destructive"
        confirmText="Wyczyść plan"
        cancelText="Anuluj"
      />
    </div>
  );
}
