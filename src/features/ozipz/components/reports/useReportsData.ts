import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { OzipzDbService } from "../../../../db/client";
import type { OzipzAction } from "../../types/ozipz.types";
import { isProgramAction } from "../../utils/ozipzCalculations";
import {
  buildReportAnnexRows,
  buildReportHierarchy,
} from "../../utils/reportAnnex";
import { buildVacationSummary, isVacationAction } from "../../utils/vacationReporting";
import {
  monthLabels,
  emptyMetricPlan,
  recipientCount,
  materialCount,
  isCompletedAction,
  type MetricPlanState,
} from "./components/reportConstants";
import { safeParseDate } from "../../utils/dateUtils";
import { useReportExports } from "./useReportExports";

import { useDictionaries } from "../../store/useOzipzDbStore";

const METRIC_PLAN_LOOKBACK_YEARS = 5;
const METRIC_PLAN_AUTOSAVE_MS = 600;

export type MetricPlanSource = { kind: "saved" } | { kind: "inherited"; fromYear: number } | { kind: "empty" };

interface UseReportsDataParams {
  allActions: OzipzAction[];
  year: number;
  months: number[];
  customInterventionMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;
  customInterventionNames?: ReadonlyMap<string, string>;
}

export function useReportsData({
  allActions,
  year,
  months,
  customInterventionMap,
  customInterventionNames,
}: UseReportsDataParams) {
  const dictStore = useDictionaries();
  const effectiveKindMap = customInterventionMap ?? dictStore.jrwaInterventionKindMap;
  const effectiveNamesMap = customInterventionNames ?? dictStore.jrwaInterventionNamesMap;

  const [metricPlan, setMetricPlanState] = useState<MetricPlanState>(emptyMetricPlan);
  /** Skąd pochodzi plan: zapisany dla roku, przejęty z wcześniejszego roku (jeszcze niezapisany) albo brak. */
  const [metricPlanSource, setMetricPlanSource] = useState<MetricPlanSource>({ kind: "empty" });
  /** Plan zmieniony przez użytkownika i czekający na zapis w bazie. */
  const pendingPlan = useRef<{ year: number; plan: MetricPlanState } | null>(null);
  const [preparedPersonId, setPreparedPersonId] = useState<string>("");


  // Osoby przygotowujące
  const persons = useMemo(() => {
    const educators = new Set<string>();
    for (const a of allActions) {
      if (a.leadEducator && a.leadEducator.trim().length > 0) {
        educators.add(a.leadEducator.trim());
      }
    }
    const list = Array.from(educators).sort();
    return list.map((name) => ({ id: name, name }));
  }, [allActions]);

  // Plan miernika trzymamy w bazie, więc trafia do kopii zapasowej. Rok bez planu
  // podpowiada ostatni zapisany plan z wcześniejszych lat – zapisze się dopiero po zatwierdzeniu lub zmianie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let candidate = year; candidate >= year - METRIC_PLAN_LOOKBACK_YEARS; candidate--) {
        const plan = await OzipzDbService.getMetricPlan(candidate);
        if (cancelled) return;
        if (plan) {
          setMetricPlanState(plan);
          setMetricPlanSource(candidate === year ? { kind: "saved" } : { kind: "inherited", fromYear: candidate });
          return;
        }
      }
      setMetricPlanState(emptyMetricPlan);
      setMetricPlanSource({ kind: "empty" });
    })().catch(() => {
      if (cancelled) return;
      setMetricPlanState(emptyMetricPlan);
      setMetricPlanSource({ kind: "empty" });
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const handlePersistMetricPlan = useCallback(async (updatedPlan?: MetricPlanState, planYear = year): Promise<boolean> => {
    try {
      await OzipzDbService.saveMetricPlan(planYear, updatedPlan || metricPlan);
      if (planYear === year) setMetricPlanSource({ kind: "saved" });
      return true;
    } catch {
      toast.error("Nie udało się zapisać planu miernika");
      return false;
    }
  }, [metricPlan, year]);

  const persistRef = useRef(handlePersistMetricPlan);
  persistRef.current = handlePersistMetricPlan;

  /** Zmiana w tabeli planu – zapis w bazie chwilę po ostatnim wpisanym znaku. */
  const setMetricPlan = useCallback((update: MetricPlanState | ((prev: MetricPlanState) => MetricPlanState)) => {
    setMetricPlanState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      pendingPlan.current = { year, plan: next };
      return next;
    });
  }, [year]);

  useEffect(() => {
    const pending = pendingPlan.current;
    if (!pending || pending.year !== year) return;
    const timer = setTimeout(() => {
      pendingPlan.current = null;
      void persistRef.current(pending.plan, pending.year);
    }, METRIC_PLAN_AUTOSAVE_MS);
    return () => {
      clearTimeout(timer);
      // Zmiana roku albo zamknięcie ekranu przed upływem opóźnienia nie gubi wpisanych wartości.
      if (pendingPlan.current === pending) {
        pendingPlan.current = null;
        void persistRef.current(pending.plan, pending.year);
      }
    };
  }, [metricPlan, year]);

  // Helper do bezpiecznego wyciągania roku i miesiąca
  const getActionYearMonth = (dateStr?: string) => {
    if (!dateStr) return null;
    const parsed = safeParseDate(dateStr);
    if (!parsed) return null;
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
    };
  };

  // Filtrowanie działań
  const yearActions = useMemo(() => {
    return allActions.filter((a) => {
      const ym = getActionYearMonth(a.date);
      return ym !== null && ym.year === year;
    });
  }, [allActions, year]);

  const filteredActions = useMemo(() => {
    return yearActions.filter((a) => {
      const ym = getActionYearMonth(a.date);
      return ym !== null && months.includes(ym.month);
    });
  }, [yearActions, months]);

  // Podsumowanie roczne i miesięczne
  const summary = useMemo(() => {
    return {
      tasks: filteredActions.length,
      actions: filteredActions.reduce((sum, a) => sum + (Number(a.numberOfActions) || 1), 0),
      recipients: filteredActions.reduce((sum, a) => sum + recipientCount(a), 0),
      materials: filteredActions.reduce((sum, a) => sum + materialCount(a), 0),
      completed: filteredActions.filter(isCompletedAction).length,
    };
  }, [filteredActions]);

  const monthlyRows = useMemo(() => {
    const map = new Map<
      number,
      {
        tasks: number;
        actions: number;
        recipients: number;
        materials: number;
        completed: number;
      }
    >();

    for (let m = 1; m <= 12; m++) {
      map.set(m, { tasks: 0, actions: 0, recipients: 0, materials: 0, completed: 0 });
    }

    for (const a of filteredActions) {
      const ym = getActionYearMonth(a.date);
      if (!ym) continue;
      const current = map.get(ym.month);
      if (current) {
        current.tasks += 1;
        current.actions += Number(a.numberOfActions) || 1;
        current.recipients += recipientCount(a);
        current.materials += materialCount(a);
        if (isCompletedAction(a)) current.completed += 1;
      }
    }

    return months.map((m) => {
      const data = map.get(m) || { tasks: 0, actions: 0, recipients: 0, materials: 0, completed: 0 };
      return {
        month: m,
        label: monthLabels[m - 1],
        ...data,
      };
    });
  }, [filteredActions, months]);

  const maxMonthlyActions = useMemo(() => {
    let max = 1;
    for (const row of monthlyRows) {
      if (row.actions > max) max = row.actions;
    }
    return max;
  }, [monthlyRows]);

  // Statystyki programowe
  const statisticsRows = useMemo(() => {
    const map = new Map<
      number,
      {
        programActions: number;
        otherActions: number;
        programRecipients: number;
        otherRecipients: number;
      }
    >();

    for (let m = 1; m <= 12; m++) {
      map.set(m, {
        programActions: 0,
        otherActions: 0,
        programRecipients: 0,
        otherRecipients: 0,
      });
    }

    for (const a of filteredActions) {
      const ym = getActionYearMonth(a.date);
      if (!ym) continue;
      const current = map.get(ym.month);
      if (current) {
        const isProg = isProgramAction(a, effectiveKindMap);
        const actCount = Number(a.numberOfActions) || 1;
        const rec = recipientCount(a);
        if (isProg) {
          current.programActions += actCount;
          current.programRecipients += rec;
        } else {
          current.otherActions += actCount;
          current.otherRecipients += rec;
        }
      }
    }

    return months.map((m) => {
      const data = map.get(m) || {
        programActions: 0,
        otherActions: 0,
        programRecipients: 0,
        otherRecipients: 0,
      };
      return {
        month: m,
        label: monthLabels[m - 1],
        programActions: data.programActions,
        otherActions: data.otherActions,
        totalActions: data.programActions + data.otherActions,
        programRecipients: data.programRecipients,
        otherRecipients: data.otherRecipients,
        totalRecipients: data.programRecipients + data.otherRecipients,
      };
    });
  }, [filteredActions, months, effectiveKindMap]);

  // Miernik Summary
  const metricSummary = useMemo(() => {
    let programoweActions = 0;
    let programowePeople = 0;
    let totalActions = 0;
    let totalPeople = 0;

    for (const a of filteredActions) {
      const rec = recipientCount(a);
      const actCount = Number(a.numberOfActions) || 1;
      totalActions += actCount;
      totalPeople += rec;
      if (isProgramAction(a, effectiveKindMap)) {
        programoweActions += actCount;
        programowePeople += rec;
      }
    }

    const calcPct = (actual: number, planVal: number | null) => {
      if (planVal === null || planVal <= 0 || !Number.isFinite(planVal)) return null;
      return (actual / planVal) * 100;
    };

    return {
      totalActions,
      totalPeople,
      programoweActions,
      programowePeople,
      otherActions: Math.max(0, totalActions - programoweActions),
      otherPeople: Math.max(0, totalPeople - programowePeople),
      totalActionsPercent: calcPct(totalActions, metricPlan.razemDzialania),
      totalPeoplePercent: calcPct(totalPeople, metricPlan.razemUczestnicy),
      programActionsPercent: calcPct(programoweActions, metricPlan.programyDzialania),
      programPeoplePercent: calcPct(programowePeople, metricPlan.programyUczestnicy),
    };
  }, [filteredActions, metricPlan, effectiveKindMap]);

  // Annex Data
  const annexRows = useMemo(() => {
    return buildReportAnnexRows(filteredActions, effectiveKindMap, effectiveNamesMap);
  }, [filteredActions, effectiveKindMap, effectiveNamesMap]);

  const reportHierarchy = useMemo(() => {
    return buildReportHierarchy(annexRows);
  }, [annexRows]);

  const vacationFilteredActions = useMemo(() => {
    return filteredActions.filter(isVacationAction);
  }, [filteredActions]);

  const vacationActionSummary = useMemo(() => {
    let actions = 0;
    let recipients = 0;
    let materials = 0;
    for (const a of vacationFilteredActions) {
      actions += Number(a.numberOfActions) || 1;
      recipients += Number(a.participantsCount) || 0;
      materials += Number(a.materialsDistributedCount) || 0;
    }
    return {
      tasks: vacationFilteredActions.length,
      actions,
      recipients,
      materials,
    };
  }, [vacationFilteredActions]);

  const vacationSummary = useMemo(() => {
    return buildVacationSummary(vacationFilteredActions);
  }, [vacationFilteredActions]);

  const {
    exportError,
    exportSuccess,
    exportPending,
    handleExportXlsx,
    handleExportAnnex,
  } = useReportExports({
    filteredActions,
    annexRows,
    year,
    months,
    preparedPersonId,
    defaultPersonName: persons[0]?.name ?? "",
  });


  return {
    metricPlan,
    metricPlanSource,
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
    monthlyRows,
    maxMonthlyActions,
    statisticsRows,
    metricSummary,
    annexRows,
    reportHierarchy,
    vacationFilteredActions,
    vacationActionSummary,
    vacationSummary,
    handleExportXlsx,
    handleExportAnnex,
  };
}
