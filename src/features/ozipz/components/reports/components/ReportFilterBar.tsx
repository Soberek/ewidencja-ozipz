import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Check } from "lucide-react";
import {
  monthLabels,
  monthFullLabels,
} from "./reportConstants";

export interface MonthPreset {
  readonly key: string;
  readonly label: string;
  readonly months: readonly number[];
}

export const REPORT_MONTH_PRESETS: readonly MonthPreset[] = [
  { key: "q1", label: "I Kwartał", months: [1, 2, 3] },
  { key: "q2", label: "II Kwartał", months: [4, 5, 6] },
  { key: "h1", label: "I Półrocze", months: [1, 2, 3, 4, 5, 6] },
  { key: "q3", label: "III Kwartał", months: [7, 8, 9] },
  { key: "q4", label: "IV Kwartał", months: [10, 11, 12] },
  { key: "h2", label: "II Półrocze", months: [7, 8, 9, 10, 11, 12] },
  { key: "all", label: "Cały rok", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

export type ReportViewMode = "summary" | "akcja" | "wakacje" | "miernik" | "gis" | "cele_miesieczne" | "gminy";

const REPORT_VIEW_OPTIONS: { value: ReportViewMode; label: string }[] = [
  { value: "summary", label: "Wszystkie działania" },
  { value: "akcja", label: "Rozpiska akcji" },
  { value: "wakacje", label: "Bezpieczne Wakacje" },
  { value: "miernik", label: "Wykonanie miernika" },
  { value: "gis", label: "Sprawozdanie GIS" },
  { value: "cele_miesieczne", label: "Zgodność z planem pracy" },
  { value: "gminy", label: "Zestawienie gminne" },
];

interface ReportFilterBarProps {
  reportMode: ReportViewMode;
  onReportModeChange: (mode: ReportViewMode) => void;
  months: number[];
  onMonthsChange: (months: number[]) => void;
  showKpiSummary?: boolean;
  onToggleKpiSummary?: () => void;
}

export function ReportFilterBar({
  reportMode,
  onReportModeChange,
  months,
  onMonthsChange,
  showKpiSummary = true,
  onToggleKpiSummary,
}: ReportFilterBarProps) {
  const selectedMonthsKey = [...months].sort((a, b) => a - b).join(",");

  return (
    <FilterBar
      className="p-3"
      rows={
        <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-12">
          {monthLabels.map((label, index) => {
            const month = index + 1;
            const selected = months.includes(month);
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const next = selected
                    ? months.filter((value) => value !== month)
                    : [...months, month].sort((a, b) => a - b);
                  if (next.length) onMonthsChange(next);
                }}
                aria-pressed={selected}
                className={cn(
                  "relative flex h-8 items-center justify-center gap-1 rounded-[3px] border px-1 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
                title={monthFullLabels[index]}
              >
                {selected && <Check className="size-3 text-primary" />}
                <span className="font-mono text-xs font-bold leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground">Widok raportu:</span>
          <SegmentedControl aria-label="Widok raportu" value={reportMode} onChange={onReportModeChange} options={REPORT_VIEW_OPTIONS} className="h-auto flex-wrap" />
        </div>
        <ChipGroup
          label="Zakres"
          trailing={
            <>
              <Badge variant="muted" className="font-mono text-[10px] tabular-nums">{months.length}/12</Badge>
              {onToggleKpiSummary && <KpiToggleButton visible={showKpiSummary} onToggle={onToggleKpiSummary} />}
            </>
          }
        >
          {REPORT_MONTH_PRESETS.map((preset) => (
            <Chip
              key={preset.key}
              active={selectedMonthsKey === preset.months.join(",")}
              onClick={() => onMonthsChange([...preset.months])}
            >
              {preset.label}
            </Chip>
          ))}
          {reportMode !== "miernik" && (
            <button
              type="button"
              className="h-6 rounded-[3px] px-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
              onClick={() => onMonthsChange([])}
              disabled={months.length === 0}
            >
              Wyczyść
            </button>
          )}
        </ChipGroup>
      </div>
    </FilterBar>
  );
}
