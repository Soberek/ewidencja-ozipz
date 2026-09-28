import { useState, useEffect, useMemo } from "react";
import type { OzipzAction } from "../../types/ozipz.types";
import { useDictionaries } from "../../store/useOzipzDbStore";
import {
  calculateMiernikWykonanie,
  isProgramAction,
  isExcludedNieprogramoweWizytacja,
  type MiernikPlanInput,
} from "../../utils/ozipzCalculations";
import { formatReportMonthLabel } from "../../utils/reportAnnex";
import { MiernikKpiCards } from "./MiernikKpiCards";
import { MiernikPeriodSelector } from "./MiernikPeriodSelector";
import { MiernikMonthlyReconciliation } from "./MiernikMonthlyReconciliation";
import { MiernikPeriodExecutionCard } from "./components/miernik/MiernikPeriodExecutionCard";
import { MiernikAnnualPlanCard } from "./components/miernik/MiernikAnnualPlanCard";

interface MiernikExecutionTabProps {
  actions: OzipzAction[];
  year: string;
}

const DEFAULT_PLANS: Record<string, MiernikPlanInput> = {
  "2025": {
    razem_dzialania: 250,
    razem_uczestnicy: 7500,
    programy_dzialania: 150,
    programy_uczestnicy: 2500,
  },
  "2026": {
    razem_dzialania: 250,
    razem_uczestnicy: 7500,
    programy_dzialania: 150,
    programy_uczestnicy: 2500,
  },
};

export function MiernikExecutionTab({ actions, year }: MiernikExecutionTabProps) {
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  const [plan, setPlan] = useState<MiernikPlanInput>(() => {
    try {
      const saved = localStorage.getItem(`oz.miernikPlan.${year}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return (
      DEFAULT_PLANS[year] || {
        razem_dzialania: 250,
        razem_uczestnicy: 7500,
        programy_dzialania: 150,
        programy_uczestnicy: 2500,
      }
    );
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`oz.miernikPlan.${year}`);
      if (saved) {
        setPlan(JSON.parse(saved));
      } else {
        setPlan(
          DEFAULT_PLANS[year] || {
            razem_dzialania: 250,
            razem_uczestnicy: 7500,
            programy_dzialania: 150,
            programy_uczestnicy: 2500,
          }
        );
      }
    } catch {
      // ignore
    }
  }, [year]);

  const handlePlanChange = (key: keyof MiernikPlanInput, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const updated = { ...plan, [key]: num };
    setPlan(updated);
    try {
      localStorage.setItem(`oz.miernikPlan.${year}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };
  const handleSelectHalfYear = (half: 1 | 2) => {
    setSelectedMonths(half === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12]);
  };
  const handleSelectQuarter = (q: 1 | 2 | 3 | 4) => {
    const start = (q - 1) * 3 + 1;
    setSelectedMonths([start, start + 1, start + 2]);
  };
  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const { jrwaInterventionKindMap } = useDictionaries();

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (!a.date) return false;
      if (year !== "all" && !a.date.startsWith(year)) return false;
      if (a.status === "odroczone" || a.status === "anulowane") return false;
      if (isExcludedNieprogramoweWizytacja(a, jrwaInterventionKindMap)) return false;

      const m = parseInt(a.date.slice(5, 7), 10);
      return selectedMonths.includes(m);
    });
  }, [actions, year, selectedMonths, jrwaInterventionKindMap]);

  const preview = useMemo(() => {
    let progActions = 0;
    let progPeople = 0;
    let nieprogActions = 0;
    let nieprogPeople = 0;

    for (const a of filteredActions) {
      const isProg = isProgramAction(a, jrwaInterventionKindMap);
      const count = Number(a.numberOfActions) || 1;
      const people = Number(a.participantsCount) || 0;

      if (isProg) {
        progActions += count;
        progPeople += people;
      } else {
        nieprogActions += count;
        nieprogPeople += people;
      }
    }

    return {
      split: {
        programowe: { actions: progActions, people: progPeople },
        nieprogramowe: { actions: nieprogActions, people: nieprogPeople },
      },
    };
  }, [filteredActions, jrwaInterventionKindMap]);

  const miernik = useMemo(() => {
    return calculateMiernikWykonanie(preview, plan);
  }, [preview, plan]);

  const periodLabel = formatReportMonthLabel(selectedMonths);

  return (
    <div className="space-y-4 text-xs font-sans">
      <MiernikPeriodSelector
        year={year}
        periodLabel={periodLabel}
        selectedMonths={selectedMonths}
        onSelectAll={handleSelectAllMonths}
        onSelectHalfYear={handleSelectHalfYear}
        onSelectQuarter={handleSelectQuarter}
        onToggleMonth={toggleMonth}
      />

      <MiernikKpiCards miernik={miernik} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiernikPeriodExecutionCard
          periodLabel={periodLabel}
          year={year}
          filteredActionsCount={filteredActions.length}
          miernik={miernik}
        />
        <MiernikAnnualPlanCard
          year={year}
          plan={plan}
          miernik={miernik}
          onPlanChange={handlePlanChange}
        />
      </div>

      <MiernikMonthlyReconciliation actions={actions} year={year} />
    </div>
  );
}
