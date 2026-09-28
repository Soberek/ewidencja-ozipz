import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { OzipzAction } from "../../types/ozipz.types";
import { useDictionaries } from "../../store/useOzipzDbStore";
import {
  isProgramAction,
  isExcludedNieprogramoweWizytacja,
} from "../../utils/ozipzCalculations";
import { MiernikReconciliationRow } from "./MiernikReconciliationRow";
import { ReconciliationSummaryHeader } from "./components/reconciliation/ReconciliationSummaryHeader";
import { ReconciliationTableFooter } from "./components/reconciliation/ReconciliationTableFooter";

export interface MonthlyReconciliationRowInput {
  progDz?: number;
  progOdb?: number;
  nieprogDz?: number;
  nieprogOdb?: number;
}

export type YearReconciliationMap = Record<number, MonthlyReconciliationRowInput>;

interface MiernikMonthlyReconciliationProps {
  actions: OzipzAction[];
  year: string;
}

const MONTH_FULL_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export function MiernikMonthlyReconciliation({
  actions,
  year,
}: MiernikMonthlyReconciliationProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [expectedValues, setExpectedValues] = useState<YearReconciliationMap>(() => {
    try {
      const saved = localStorage.getItem(`oz.reconciliation.${year}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`oz.reconciliation.${year}`);
      if (saved) {
        setExpectedValues(JSON.parse(saved));
      } else {
        setExpectedValues({});
      }
    } catch {
      // ignore
    }
  }, [year]);

  const { jrwaInterventionKindMap } = useDictionaries();

  const monthlyActuals = useMemo(() => {
    const map: Record<
      number,
      { progDz: number; progOdb: number; nieprogDz: number; nieprogOdb: number }
    > = {};

    for (let m = 1; m <= 12; m++) {
      map[m] = { progDz: 0, progOdb: 0, nieprogDz: 0, nieprogOdb: 0 };
    }

    const yearActions = actions.filter((a) => {
      if (!a.date) return false;
      if (year !== "all" && !a.date.startsWith(year)) return false;
      if (a.status === "odroczone" || a.status === "anulowane") return false;
      if (isExcludedNieprogramoweWizytacja(a, jrwaInterventionKindMap)) return false;
      return true;
    });

    for (const a of yearActions) {
      const m = parseInt(a.date.slice(5, 7), 10);
      if (m >= 1 && m <= 12) {
        const isProg = isProgramAction(a, jrwaInterventionKindMap);
        const count = Number(a.numberOfActions) || 1;
        const people = Number(a.participantsCount) || 0;

        if (isProg) {
          map[m].progDz += count;
          map[m].progOdb += people;
        } else {
          map[m].nieprogDz += count;
          map[m].nieprogOdb += people;
        }
      }
    }

    return map;
  }, [actions, year, jrwaInterventionKindMap]);

  const handleExpectedChange = (
    month: number,
    field: keyof MonthlyReconciliationRowInput,
    valStr: string
  ) => {
    const num = valStr.trim() === "" ? undefined : Math.max(0, parseInt(valStr, 10) || 0);
    setExpectedValues((prev) => {
      const currentMonth = { ...(prev[month] || {}) };
      if (num === undefined) {
        delete currentMonth[field];
      } else {
        currentMonth[field] = num;
      }
      const updated = { ...prev, [month]: currentMonth };
      try {
        localStorage.setItem(`oz.reconciliation.${year}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleAutofillFromDb = () => {
    const filled: YearReconciliationMap = {};
    for (let m = 1; m <= 12; m++) {
      filled[m] = {
        progDz: monthlyActuals[m].progDz,
        progOdb: monthlyActuals[m].progOdb,
        nieprogDz: monthlyActuals[m].nieprogDz,
        nieprogOdb: monthlyActuals[m].nieprogOdb,
      };
    }
    setExpectedValues(filled);
    try {
      localStorage.setItem(`oz.reconciliation.${year}`, JSON.stringify(filled));
    } catch {
      // ignore
    }
  };

  const handleClearAll = () => {
    setExpectedValues({});
    try {
      localStorage.removeItem(`oz.reconciliation.${year}`);
    } catch {
      // ignore
    }
  };

  const summary = useMemo(() => {
    let totalActualProgDz = 0;
    let totalActualProgOdb = 0;
    let totalActualNieprogDz = 0;
    let totalActualNieprogOdb = 0;

    let totalExpProgDz = 0;
    let totalExpProgOdb = 0;
    let totalExpNieprogDz = 0;
    let totalExpNieprogOdb = 0;

    let mismatchesCount = 0;
    let hasAnyInputs = false;

    for (let m = 1; m <= 12; m++) {
      const act = monthlyActuals[m];
      const exp = expectedValues[m] || {};

      totalActualProgDz += act.progDz;
      totalActualProgOdb += act.progOdb;
      totalActualNieprogDz += act.nieprogDz;
      totalActualNieprogOdb += act.nieprogOdb;

      if (
        exp.progDz !== undefined ||
        exp.progOdb !== undefined ||
        exp.nieprogDz !== undefined ||
        exp.nieprogOdb !== undefined
      ) {
        hasAnyInputs = true;
      }

      const eProgDz = exp.progDz ?? act.progDz;
      const eProgOdb = exp.progOdb ?? act.progOdb;
      const eNieprogDz = exp.nieprogDz ?? act.nieprogDz;
      const eNieprogOdb = exp.nieprogOdb ?? act.nieprogOdb;

      totalExpProgDz += eProgDz;
      totalExpProgOdb += eProgOdb;
      totalExpNieprogDz += eNieprogDz;
      totalExpNieprogOdb += eNieprogOdb;

      if (
        (exp.progDz !== undefined && exp.progDz !== act.progDz) ||
        (exp.progOdb !== undefined && exp.progOdb !== act.progOdb) ||
        (exp.nieprogDz !== undefined && exp.nieprogDz !== act.nieprogDz) ||
        (exp.nieprogOdb !== undefined && exp.nieprogOdb !== act.nieprogOdb)
      ) {
        mismatchesCount++;
      }
    }

    return {
      totalActualProgDz,
      totalActualProgOdb,
      totalActualNieprogDz,
      totalActualNieprogOdb,
      totalExpProgDz,
      totalExpProgOdb,
      totalExpNieprogDz,
      totalExpNieprogOdb,
      mismatchesCount,
      hasAnyInputs,
    };
  }, [monthlyActuals, expectedValues]);

  const renderDiff = (actual: number, expected: number | undefined) => {
    if (expected === undefined) return null;
    const diff = actual - expected;
    if (diff === 0) {
      return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">0</span>;
    }
    return (
      <span
        className={`text-[10px] font-black font-mono ${
          diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {diff > 0 ? `+${diff}` : diff}
      </span>
    );
  };

  return (
    <Card className="p-4 bg-card border shadow-none space-y-3.5 text-xs font-sans">
      <ReconciliationSummaryHeader
        year={year}
        isOpen={isOpen}
        mismatchesCount={summary.mismatchesCount}
        hasAnyInputs={summary.hasAnyInputs}
        onToggleOpen={() => setIsOpen(!isOpen)}
        onAutofill={handleAutofillFromDb}
        onClear={handleClearAll}
      />

      {isOpen && (
        <div className="overflow-x-auto border rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              <tr className="border-b border-border/60">
                <th rowSpan={2} className="py-2.5 px-3 w-32 border-r border-border/80">Miesiąc</th>
                <th colSpan={3} className="py-1.5 px-2 text-center bg-sky-100/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border-r border-border/60">Programowe Dz.</th>
                <th colSpan={3} className="py-1.5 px-2 text-center bg-sky-100/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border-r border-border/60">Programowe Odb.</th>
                <th colSpan={3} className="py-1.5 px-2 text-center bg-muted/60 text-foreground border-r border-border/60">Nieprogramowe Dz.</th>
                <th colSpan={3} className="py-1.5 px-2 text-center bg-muted/60 text-foreground border-r border-border/60">Nieprogramowe Odb.</th>
                <th rowSpan={2} className="py-2.5 px-3 text-center w-28">Status Zgodności</th>
              </tr>
              <tr className="bg-muted/30 text-[10px] font-semibold text-muted-foreground">
                {/* Programowe Dz */}
                <th className="py-1 px-1 text-right border-l">Fakt</th>
                <th className="py-1 px-1 text-center">Plan</th>
                <th className="py-1 px-1 text-right border-r border-border/60">±</th>
                {/* Programowe Odb */}
                <th className="py-1 px-1 text-right">Fakt</th>
                <th className="py-1 px-1 text-center">Plan</th>
                <th className="py-1 px-1 text-right border-r border-border/60">±</th>
                {/* Nieprogramowe Dz */}
                <th className="py-1 px-1 text-right">Fakt</th>
                <th className="py-1 px-1 text-center">Plan</th>
                <th className="py-1 px-1 text-right border-r border-border/60">±</th>
                {/* Nieprogramowe Odb */}
                <th className="py-1 px-1 text-right">Fakt</th>
                <th className="py-1 px-1 text-center">Plan</th>
                <th className="py-1 px-1 text-right border-r border-border/60">±</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {MONTH_FULL_NAMES.map((monthName, idx) => {
                const m = idx + 1;
                const act = monthlyActuals[m];
                const exp = expectedValues[m] || {};

                return (
                  <MiernikReconciliationRow
                    key={m}
                    month={m}
                    monthName={monthName}
                    actual={act}
                    expected={exp}
                    onChange={(field, valStr) => handleExpectedChange(m, field, valStr)}
                  />
                );
              })}
            </tbody>
            <ReconciliationTableFooter summary={summary} renderDiff={renderDiff} />
          </table>
        </div>
      )}
    </Card>
  );
}
