import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";

export type DictionaryUsageFilter = "all" | "used" | "unused";

export interface DictionariesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  systemFilter: string;
  onSystemFilterChange: (value: string) => void;
  kindFilter?: string;
  onKindFilterChange?: (value: string) => void;
  usageFilter?: DictionaryUsageFilter;
  onUsageFilterChange?: (value: DictionaryUsageFilter) => void;
  totalFilteredCount: number;
  systemCount: number;
  userCount: number;
  activeCategory: string;
  activeCategoryLabel: string;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  /** Pokazywanie selektora rodzaju interwencji (PROGRAMOWE / NIEPROGRAMOWE). */
  showKindFilter?: boolean;
}

export function DictionariesFilterBar({
  search,
  onSearchChange,
  systemFilter,
  onSystemFilterChange,
  kindFilter,
  onKindFilterChange,
  usageFilter,
  onUsageFilterChange,
  totalFilteredCount,
  systemCount,
  userCount,
  activeCategory,
  activeCategoryLabel,
  onOpenAdd,
  onClearFilters,
  showKindFilter,
}: DictionariesFilterBarProps) {
  const isFiltered =
    !!search.trim() ||
    systemFilter !== "all" ||
    (!!kindFilter && kindFilter !== "all") ||
    (!!usageFilter && usageFilter !== "all");
  const kindVisible = showKindFilter ?? (activeCategory === "jrwaSymbol" || activeCategory === "all");

  return (
    <FilterBar
      actions={
        <Button onClick={onOpenAdd}>
          <Plus className="size-3.5" />
          <span>Dodaj wpis {activeCategory !== "all" ? `(${activeCategoryLabel})` : ""}</span>
        </Button>
      }
    >
      <SearchInput
        value={search}
        onValueChange={onSearchChange}
        placeholder="Szukaj po kodzie, etykiecie, opisie..."
        aria-label="Szukaj w słownikach"
      />

      <NativeSelect value={systemFilter} onChange={(e) => onSystemFilterChange(e.target.value)} aria-label="Typ wpisu">
        <option value="all">Wszystkie typy ({totalFilteredCount})</option>
        <option value="system">Tylko systemowe ({systemCount})</option>
        <option value="user">Tylko własne ({userCount})</option>
      </NativeSelect>

      {onUsageFilterChange && (
        <NativeSelect
          value={usageFilter || "all"}
          onChange={(e) => onUsageFilterChange(e.target.value as DictionaryUsageFilter)}
          aria-label="Użycie w rekordach"
        >
          <option value="all">Dowolne użycie</option>
          <option value="used">Używane w rekordach</option>
          <option value="unused">Nieużywane</option>
        </NativeSelect>
      )}

      {kindVisible && onKindFilterChange && (
        <NativeSelect value={kindFilter || "all"} onChange={(e) => onKindFilterChange(e.target.value)} aria-label="Rodzaj interwencji">
          <option value="all">Wszystkie rodzaje</option>
          <option value="PROGRAMOWE">Tylko Programowe</option>
          <option value="NIEPROGRAMOWE">Tylko Nieprogramowe</option>
        </NativeSelect>
      )}

      {isFiltered && <ClearFiltersButton onClick={onClearFilters} />}
    </FilterBar>
  );
}
