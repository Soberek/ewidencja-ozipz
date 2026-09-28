import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

interface TemplatesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  formFilter: string;
  onFormFilterChange: (value: string) => void;
  availableForms: string[];
  isKpiVisible: boolean;
  onToggleKpi: () => void;
  onOpenAdd: () => void;
}

export function TemplatesFilterBar({
  search,
  onSearchChange,
  formFilter,
  onFormFilterChange,
  availableForms,
  isKpiVisible,
  onToggleKpi,
  onOpenAdd,
}: TemplatesFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" /> Nowy szablon zadania
          </Button>
        </>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj w szablonach zadań..." />
      {availableForms.length > 0 && (
        <div className="w-52">
          <Select
            value={formFilter}
            onChange={(val) => onFormFilterChange(val || "all")}
            options={[{ value: "all", label: "Wszystkie formy działań" }, ...availableForms.map((f) => ({ value: f, label: f }))]}
            searchable={availableForms.length > 6}
          />
        </div>
      )}
    </FilterBar>
  );
}
