import { SlidersHorizontal, Globe, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  { value: "zakonczone", label: "Status: Zakończone", badge: "Koniec", badgeVariant: "secondary" as const },
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
  statusFilter: "aktywne" | "wszystkie" | "zakonczone";
  onStatusFilterChange: (status: "aktywne" | "wszystkie" | "zakonczone") => void;
  quickFilterEzd: boolean;
  onToggleEzd: () => void;
  quickFilterCurrentMonth: boolean;
  onToggleCurrentMonth: () => void;
  quickFilterProgramOnly: boolean;
  onToggleProgramOnly: () => void;
  quickFilterInProgress: boolean;
  onToggleInProgress: () => void;
  materialsOnlyFilter?: boolean;
  onToggleMaterialsOnly?: () => void;
  quickFilterPublications?: boolean;
  onTogglePublications?: () => void;
  hidePublications?: boolean;
  onToggleHidePublications?: () => void;
  isAdvancedOpen?: boolean;
  onToggleAdvanced?: () => void;
  advancedFiltersCount?: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
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
  quickFilterEzd,
  onToggleEzd,
  quickFilterCurrentMonth,
  onToggleCurrentMonth,
  quickFilterProgramOnly,
  onToggleProgramOnly,
  quickFilterInProgress,
  onToggleInProgress,
  materialsOnlyFilter = false,
  onToggleMaterialsOnly,
  quickFilterPublications = false,
  onTogglePublications,
  hidePublications = true,
  onToggleHidePublications,
  isAdvancedOpen = false,
  onToggleAdvanced,
  advancedFiltersCount = 0,
  activeFiltersCount,
  onClearFilters,
}: ActionsFilterBarProps) {
  return (
    <FilterBar
      rows={
        <ChipGroup label="Szybkie filtry">
          <Chip tone="destructive" active={quickFilterEzd} onClick={onToggleEzd}>
            ! Wymaga EZD
          </Chip>
          <Chip active={quickFilterCurrentMonth} onClick={onToggleCurrentMonth}>
            Bieżący miesiąc
          </Chip>
          <Chip active={quickFilterProgramOnly} onClick={onToggleProgramOnly}>
            Tylko programowe
          </Chip>
          <Chip active={quickFilterInProgress} onClick={onToggleInProgress}>
            W toku / Planowane
          </Chip>
          {onToggleMaterialsOnly && (
            <Chip active={materialsOnlyFilter} onClick={onToggleMaterialsOnly}>
              Materiały (MAT &gt; 0)
            </Chip>
          )}
          {onToggleHidePublications && (
            <Chip
              active={hidePublications}
              onClick={onToggleHidePublications}
              icon={hidePublications ? <EyeOff /> : <Eye />}
              title={
                hidePublications
                  ? "Filtr aktywny: publikacje (FB, X, www) są schowane w działaniach. Kliknij, aby je pokazać."
                  : "Filtr odkliknięty: publikacje są widoczne w działaniach. Kliknij, aby je schować."
              }
            >
              {hidePublications ? "Schowaj publikacje" : "Publikacje widoczne"}
            </Chip>
          )}
          {onTogglePublications && (
            <Chip
              active={quickFilterPublications}
              onClick={onTogglePublications}
              icon={<Globe />}
              title="Pokaż wyłącznie publikacje (Portal X, Facebook, Strona www)"
            >
              Publikacje (X, FB, www)
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
          onChange={(val) => onStatusFilterChange((val || "aktywne") as "aktywne" | "wszystkie" | "zakonczone")}
          options={STATUS_OPTIONS}
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

      {activeFiltersCount > 0 && <ClearFiltersButton onClick={onClearFilters} count={activeFiltersCount} />}
    </FilterBar>
  );
}
