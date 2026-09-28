import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OzipzAction, OzipzFacility } from "../../../types/ozipz.types";
import { useDictionaries } from "../../../store/useOzipzDbStore";
import { formatReportMonthLabel } from "../../../utils/reportAnnex";
import { buildJrwaInterventionKindMap } from "../../../utils/ozipzCalculations";
import {
  GIS_REPORT_CATEGORIES,
  buildJrwaGisCategoryMap,
  calculateGisReports,
  type GisProgramType,
  type GisReportCategoryId,
} from "../../../utils/gis";
import { GisCategorizationPanel } from "./GisCategorizationPanel";
import { GisReportSection } from "./GisReportSection";

interface ReportGisTabProps {
  /** Działania już przefiltrowane do wybranego roku i miesięcy */
  actions: OzipzAction[];
  facilities: OzipzFacility[];
  year: number;
  months: number[];
}

const PROGRAM_TYPES: ReadonlyArray<{ value: GisProgramType; label: string }> = [
  { value: "programowe", label: "PROGRAMOWE" },
  { value: "nieprogramowe", label: "NIEPROGRAMOWE" },
];

const pillClass = (active: boolean) =>
  cn(
    "inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-xs font-semibold transition-colors",
    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

export function ReportGisTab({ actions, facilities, year, months }: ReportGisTabProps) {
  const { dictionaryItems } = useDictionaries();
  const [activeCategory, setActiveCategory] = useState<GisReportCategoryId>(GIS_REPORT_CATEGORIES[0].id);
  const [programType, setProgramType] = useState<GisProgramType>("programowe");

  const { reports, stats } = useMemo(
    () =>
      calculateGisReports(actions, {
        gisCategoryMap: buildJrwaGisCategoryMap(dictionaryItems),
        kindMap: buildJrwaInterventionKindMap(dictionaryItems),
        facilities,
      }),
    [actions, facilities, dictionaryItems]
  );

  const activeConfig = GIS_REPORT_CATEGORIES.find((category) => category.id === activeCategory) ?? GIS_REPORT_CATEGORIES[0];
  const categoryReports = reports[activeConfig.id];
  const periodLabel = `${formatReportMonthLabel(months)} ${year}`;

  return (
    <div className="space-y-3">
      <Card className="rounded-[3px] border border-border shadow-none">
        <CardContent className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[3px] border border-primary/30 bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Sprawozdanie kwartalne GIS</h3>
              <p className="text-[11px] text-muted-foreground">
                Art. 6 · okres: {periodLabel} · kwartał wybierz w polu „Zakres” powyżej
              </p>
            </div>
          </div>
          <Badge variant="outline" className="h-7 rounded-[2px] px-3 font-mono text-xs font-bold">
            {stats.categorizedActions} działań · {stats.categorizedRecipients.toLocaleString("pl-PL")} odbiorców
          </Badge>
        </CardContent>
      </Card>

      {stats.totalActions === 0 ? (
        <div className="flex items-center gap-2.5 rounded-[3px] border border-amber-200 bg-amber-50/80 p-4 text-xs font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          Brak działań w wybranym okresie. Zmień rok lub zakres miesięcy.
        </div>
      ) : (
        <>
          <GisCategorizationPanel stats={stats} />

          <Card className="rounded-[3px] border border-border shadow-none">
            <CardContent className="space-y-4 p-3.5">
              <div className="flex flex-col gap-2">
                <div role="tablist" aria-label="Obszar sprawozdania" className="flex flex-wrap gap-0.5 rounded-[3px] border border-border bg-muted/40 p-0.5">
                  {GIS_REPORT_CATEGORIES.map((category) => {
                    const count = reports[category.id].programowe.liczbaDzialan + reports[category.id].nieprogramowe.liczbaDzialan;
                    const active = category.id === activeConfig.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setActiveCategory(category.id);
                          setProgramType("programowe");
                        }}
                        className={pillClass(active)}
                      >
                        {category.label}
                        <span className={cn("font-mono text-[10px]", active ? "opacity-90" : "opacity-70")}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div role="tablist" aria-label="Typ interwencji" className="inline-flex w-fit gap-0.5 rounded-[3px] border border-border bg-muted/40 p-0.5">
                  {PROGRAM_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      role="tab"
                      aria-selected={programType === type.value}
                      onClick={() => setProgramType(type.value)}
                      className={pillClass(programType === type.value)}
                    >
                      {type.label}
                      <span className="font-mono text-[10px] opacity-80">{categoryReports[type.value].liczbaDzialan}</span>
                    </button>
                  ))}
                </div>
              </div>

              <GisReportSection
                reportData={categoryReports[programType]}
                categoryLabel={activeConfig.label}
                typeLabel={programType === "programowe" ? "PROGRAMOWE" : "NIEPROGRAMOWE"}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
