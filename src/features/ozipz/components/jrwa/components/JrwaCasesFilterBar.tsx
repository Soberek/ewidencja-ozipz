import { Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SearchableSelect } from "@/components/ui/select";
import type { OzipzDictionaryItem, OzipzStaff } from "../../../types/ozipz.types";

const QUICK_STATUS_FILTERS = [
  { id: "all", label: "Wszystkie sprawy" },
  { id: "w_toku", label: "W toku" },
  { id: "zakonczona", label: "Zakończone" },
];

export interface JrwaCasesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedEducator: string;
  onEducatorChange: (educator: string) => void;
  availableYears: number[];
  jrwaDictItems: OzipzDictionaryItem[];
  staff: OzipzStaff[];
  isGuideOpen: boolean;
  onToggleGuide: () => void;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  activeQuickFilter?: string;
  onQuickFilterChange?: (filter: string) => void;
  requiresEzdFilter?: boolean;
  onToggleRequiresEzd?: () => void;
  isKpiVisible?: boolean;
  onToggleKpi?: () => void;
}

export function JrwaCasesFilterBar({
  search,
  onSearchChange,
  selectedSymbol,
  onSymbolChange,
  selectedYear,
  onYearChange,
  selectedStatus,
  onStatusChange,
  selectedEducator,
  onEducatorChange,
  availableYears,
  jrwaDictItems,
  staff,
  isGuideOpen,
  onToggleGuide,
  onOpenAdd,
  onClearFilters,
  activeFiltersCount,
  activeQuickFilter,
  onQuickFilterChange,
  requiresEzdFilter = false,
  onToggleRequiresEzd,
  isKpiVisible = true,
  onToggleKpi,
}: JrwaCasesFilterBarProps) {
  const isQuickFilterActive = (id: string) =>
    (activeQuickFilter ?? (selectedStatus === id ? id : selectedStatus === "all" && id === "all" ? "all" : "")) === id;

  return (
    <FilterBar
      actions={
        <>
          {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
          <Button
            variant={isGuideOpen ? "secondary" : "outline"}
            onClick={onToggleGuide}
            aria-expanded={isGuideOpen}
            className="font-medium"
          >
            <HelpCircle className="size-3.5 text-info" />
            <span>Wykaz JRWA</span>
          </Button>
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" />
            <span>Nowa Sprawa</span>
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Szybkie filtry">
          {QUICK_STATUS_FILTERS.map((tab) => (
            <Chip
              key={tab.id}
              active={isQuickFilterActive(tab.id)}
              onClick={() => (onQuickFilterChange ? onQuickFilterChange(tab.id) : onStatusChange(tab.id))}
            >
              {tab.label}
            </Chip>
          ))}
          <Chip tone="destructive" active={requiresEzdFilter} onClick={onToggleRequiresEzd}>
            ! Wymaga EZD
          </Chip>
        </ChipGroup>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj po znaku, tytule sprawy, symbolu..." />

      <div className="w-56">
        <SearchableSelect
          value={selectedSymbol}
          onChange={onSymbolChange}
          options={[
            { value: "all", label: "Wszystkie symbole JRWA" },
            ...jrwaDictItems.map((d) => ({ value: d.code, label: `${d.code} - ${d.label}`, badge: d.code })),
          ]}
          placeholder="Wszystkie symbole JRWA"
          searchPlaceholder="Szukaj symbolu JRWA..."
        />
      </div>

      <div className="w-36">
        <Select
          value={selectedYear}
          onChange={onYearChange}
          options={[{ value: "all", label: "Wszystkie lata" }, ...availableYears.map((y) => ({ value: String(y), label: `Rok ${y}` }))]}
          searchable={false}
        />
      </div>

      <div className="w-40">
        <Select
          value={selectedStatus}
          onChange={onStatusChange}
          options={[
            { value: "all", label: "Wszystkie statusy" },
            { value: "w_toku", label: "W toku", badge: "W toku", badgeVariant: "warning" },
            { value: "zakonczona", label: "Zakończona", badge: "Koniec", badgeVariant: "success" },
            { value: "zarchiwizowana", label: "Zarchiwizowana", badge: "Archiwum", badgeVariant: "secondary" },
          ]}
          searchable={false}
        />
      </div>

      {staff.length > 0 && (
        <div className="w-48">
          <Select
            value={selectedEducator}
            onChange={onEducatorChange}
            options={[
              { value: "all", label: "Wszyscy pracownicy" },
              ...staff.map((s) => ({ value: s.fullName, label: s.fullName, description: s.role })),
            ]}
            placeholder="Wszyscy pracownicy"
            searchPlaceholder="Szukaj pracownika..."
          />
        </div>
      )}

      {activeFiltersCount > 0 && <ClearFiltersButton onClick={onClearFilters} count={activeFiltersCount} />}
    </FilterBar>
  );
}
