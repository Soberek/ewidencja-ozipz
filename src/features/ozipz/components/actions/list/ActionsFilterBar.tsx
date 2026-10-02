import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PublicationsMode, StatusFilter } from "../hooks/useActionFilterState";

const PERIOD_OPTIONS = [
  { value: "q1", label: "I Kwartał (I - III)", badge: "Q1" },
  { value: "q2", label: "II Kwartał (IV - VI)", badge: "Q2" },
  { value: "q3", label: "III Kwartał (VII - IX)", badge: "Q3" },
  { value: "q4", label: "IV Kwartał (X - XII)", badge: "Q4" },
  { value: "h1", label: "I Półrocze (I - VI)", badge: "H1" },
  { value: "h2", label: "II Półrocze (VII - XII)", badge: "H2" },
  { value: "01", label: "01 - Styczeń" },
  { value: "02", label: "02 - Luty" },
  { value: "03", label: "03 - Marzec" },
  { value: "04", label: "04 - Kwiecień" },
  { value: "05", label: "05 - Maj" },
  { value: "06", label: "06 - Czerwiec" },
  { value: "07", label: "07 - Lipiec" },
  { value: "08", label: "08 - Sierpień" },
  { value: "09", label: "09 - Wrzesień" },
  { value: "10", label: "10 - Październik" },
  { value: "11", label: "11 - Listopad" },
  { value: "12", label: "12 - Grudzień" },
];

const STATUS_OPTIONS = [
  { value: "aktywne", label: "Status: Aktywne", badgeVariant: "success" as const },
  { value: "wszystkie", label: "Status: Wszystkie" },
];

const PUBLICATIONS_OPTIONS = [
  { value: "ukryte", label: "Publikacje: schowane" },
  { value: "widoczne", label: "Publikacje: widoczne" },
  { value: "tylko", label: "Tylko publikacje" },
];

export interface ActionsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  /** Rok rejestru ("" = wszystkie lata); okres (miesiąc/kwartał/półrocze) działa w obrębie wybranego roku. */
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  availableYears?: string[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  /** Publikacje w mediach (FB, X, www): schowane, widoczne razem z innymi działaniami albo same. */
  publicationsMode: PublicationsMode;
  onPublicationsModeChange: (mode: PublicationsMode) => void;
  quickFilterEzd: boolean;
  onToggleEzd: () => void;
  quickFilterProgramOnly: boolean;
  onToggleProgramOnly: () => void;
  materialsOnlyFilter?: boolean;
  onToggleMaterialsOnly?: () => void;
  isAdvancedOpen?: boolean;
  onToggleAdvanced?: () => void;
  advancedFiltersCount?: number;
}

export function ActionsFilterBar({
  search,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  selectedYear = "",
  onYearChange,
  availableYears = [],
  statusFilter,
  onStatusFilterChange,
  publicationsMode,
  onPublicationsModeChange,
  quickFilterEzd,
  onToggleEzd,
  quickFilterProgramOnly,
  onToggleProgramOnly,
  materialsOnlyFilter = false,
  onToggleMaterialsOnly,
  isAdvancedOpen = false,
  onToggleAdvanced,
  advancedFiltersCount = 0,
}: ActionsFilterBarProps) {
  return (
    <FilterBar
      rows={
        <ChipGroup label="Szybkie filtry">
          <Chip tone="destructive" active={quickFilterEzd} onClick={onToggleEzd}>
            ! Wymaga EZD
          </Chip>
          <Chip active={quickFilterProgramOnly} onClick={onToggleProgramOnly}>
            Tylko programowe
          </Chip>
          {onToggleMaterialsOnly && (
            <Chip active={materialsOnlyFilter} onClick={onToggleMaterialsOnly}>
              Materiały (MAT &gt; 0)
            </Chip>
          )}
        </ChipGroup>
      }
    >
      <SearchInput
        value={search}
        onValueChange={onSearchChange}
        aria-label="Szukaj działań"
        placeholder="Szukaj po zadaniu, szkole, gminie, JRWA, edukatorze..."
      />

      {onYearChange && (
        <div className="w-36">
          <Select
            name="rok"
            value={selectedYear}
            onChange={onYearChange}
            options={[{ value: "", label: "Wszystkie lata" }, ...availableYears.map((year) => ({ value: year, label: year }))]}
            searchable={false}
          />
        </div>
      )}

      <div className="w-48">
        <Select
          value={selectedMonth}
          onChange={onMonthChange}
          options={[{ value: "", label: selectedYear ? `Cały rok ${selectedYear}` : "Wszystkie miesiące" }, ...PERIOD_OPTIONS]}
          searchable={false}
        />
      </div>

      <div className="w-44">
        <Select
          value={statusFilter}
          onChange={(val) => onStatusFilterChange((val || "aktywne") as StatusFilter)}
          options={STATUS_OPTIONS}
          searchable={false}
        />
      </div>

      <div className="w-48">
        <Select
          name="publikacje"
          value={publicationsMode}
          onChange={(val) => onPublicationsModeChange((val || "ukryte") as PublicationsMode)}
          options={PUBLICATIONS_OPTIONS}
          searchable={false}
        />
      </div>

      {onToggleAdvanced && (
        <Button
          variant={isAdvancedOpen || advancedFiltersCount > 0 ? "secondary" : "outline"}
          onClick={onToggleAdvanced}
          aria-expanded={isAdvancedOpen}
          className={cn("font-medium", advancedFiltersCount > 0 && "border-primary/50 text-primary")}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Więcej filtrów</span>
          {advancedFiltersCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {advancedFiltersCount}
            </span>
          )}
        </Button>
      )}
    </FilterBar>
  );
}
