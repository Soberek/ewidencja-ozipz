import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

interface ScansFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  availableTypes: { value: string; label: string }[];
  isKpiVisible: boolean;
  onToggleKpi: () => void;
  onOpenAdd: () => void;
}

export function ScansFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  availableTypes,
  isKpiVisible,
  onToggleKpi,
  onOpenAdd,
}: ScansFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" /> Zarejestruj Skan PDF / Dokument
          </Button>
        </>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj skanu, sprawozdania, placówki..." />
      <div className="w-48">
        <Select
          value={typeFilter}
          onChange={(val) => onTypeFilterChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie typy" }, ...availableTypes]}
          searchable={availableTypes.length > 6}
        />
      </div>
    </FilterBar>
  );
}
