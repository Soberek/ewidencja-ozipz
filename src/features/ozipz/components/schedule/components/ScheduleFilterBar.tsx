import { Plus, LayoutList, Kanban, CalendarDays, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { value: "table", icon: LayoutList, title: "Widok tabeli" },
  { value: "kanban", icon: Kanban, title: "Widok tablicy Kanban" },
  { value: "calendar", icon: CalendarDays, title: "Widok kalendarza" },
] as const;

const QUICK_FILTERS: { id: ScheduleFilterMode; label: string }[] = [
  { id: "do_realizacji", label: "Do realizacji" },
  { id: "zrealizowane", label: "Zrealizowane" },
  { id: "z_adnotacja", label: "Z adnotacją" },
];

export type ScheduleFilterMode =
  | "all"
  | "do_realizacji"
  | "zrealizowane"
  | "niezrealizowane"
  | "z_adnotacja";

const MONTHS_SHORT = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];

export interface ScheduleFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  selectedMonth: number | null;
  onSelectMonth: (month: number | null) => void;
  currentMonth: number;
  filterType: ScheduleFilterMode;
  onFilterTypeChange: (type: ScheduleFilterMode) => void;
  viewMode: "table" | "kanban" | "calendar";
  onViewModeChange: (mode: "table" | "kanban" | "calendar") => void;
  onOpenCopyPlan: () => void;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  isKpiVisible?: boolean;
  onToggleKpi?: () => void;
}

export function ScheduleFilterBar({
  search,
  onSearchChange,
  selectedYear,
  availableYears,
  onSelectYear,
  selectedMonth,
  onSelectMonth,
  currentMonth,
  filterType,
  onFilterTypeChange,
  viewMode,
  onViewModeChange,
  onOpenCopyPlan,
  onOpenAdd,
  onClearFilters,
  isFiltered,
  isKpiVisible = true,
  onToggleKpi,
}: ScheduleFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
          <SegmentedControl aria-label="Widok harmonogramu" value={viewMode} onChange={onViewModeChange} options={VIEW_OPTIONS} />
          <Button variant="outline" onClick={onOpenCopyPlan} title="Kopiuj plan pracy z poprzedniego roku" className="font-medium">
            <Copy className="size-3.5 text-muted-foreground" />
            <span>Kopiuj Plan</span>
          </Button>
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" />
            <span>Nowe Zadanie</span>
          </Button>
        </>
      }
      rows={
        <>
          <ChipGroup>
            <label htmlFor="schedule-year" className="sr-only">Rok harmonogramu</label>
            <select
              id="schedule-year"
              value={selectedYear}
              onChange={(event) => onSelectYear(Number(event.target.value))}
              className="mr-1 h-6 rounded-[3px] border border-input bg-background px-1.5 text-[11px] font-semibold text-foreground cursor-pointer hover:border-muted-foreground/40 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <Chip active={selectedMonth === null} onClick={() => onSelectMonth(null)}>
              Cały Rok
            </Chip>
            {MONTHS_SHORT.map((m, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              const isCurrent = currentMonth === mNum;
              return (
                <Chip
                  key={m}
                  active={isSelected}
                  onClick={() => onSelectMonth(mNum)}
                  title={isCurrent ? "Bieżący miesiąc" : undefined}
                  className={cn(
                    "relative min-w-[38px] justify-center",
                    isCurrent && !isSelected && "border-info/40 text-info font-semibold"
                  )}
                >
                  {m}
                  {isCurrent && !isSelected && (
                    <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-info" aria-hidden="true" />
                  )}
                </Chip>
              );
            })}
          </ChipGroup>
          <ChipGroup label="Szybkie filtry">
            {QUICK_FILTERS.map((filter) => (
              <Chip
                key={filter.id}
                active={filterType === filter.id}
                onClick={() => onFilterTypeChange(filterType === filter.id ? "all" : filter.id)}
              >
                {filter.label}
              </Chip>
            ))}
          </ChipGroup>
        </>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj po tytule zadania, placówce, programie..." />

      <div className="w-56">
        <Select
          value={filterType}
          onChange={(val) => onFilterTypeChange((val || "all") as ScheduleFilterMode)}
          options={[
            { value: "all", label: "Wszystkie zadania" },
            { value: "do_realizacji", label: "Do realizacji (w toku)", badge: "Plan", badgeVariant: "secondary" },
            { value: "zrealizowane", label: "Zrealizowane", badge: "OK", badgeVariant: "success" },
            { value: "niezrealizowane", label: "Niezrealizowane", badge: "Brak", badgeVariant: "destructive" },
            { value: "z_adnotacja", label: "Z adnotacją / odroczone", badge: "Adnotacja", badgeVariant: "warning" },
          ]}
          searchable={false}
        />
      </div>

      {isFiltered && <ClearFiltersButton onClick={onClearFilters} />}
    </FilterBar>
  );
}
