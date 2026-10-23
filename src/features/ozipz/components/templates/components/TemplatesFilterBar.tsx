import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

interface TemplatesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  formFilter: string;
  onFormFilterChange: (value: string) => void;
  availableForms: string[];
  onOpenAdd: () => void;
}

export function TemplatesFilterBar({
  search,
  onSearchChange,
  formFilter,
  onFormFilterChange,
  availableForms,
  onOpenAdd,
}: TemplatesFilterBarProps) {
  return (
    <FilterBar
      actions={
        <Button onClick={onOpenAdd}>
          <Plus className="size-3.5" /> Nowy szablon
        </Button>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj szablonu, programu, odbiorców…" />
      {/* Filtr formy ma sens dopiero przy kilku różnych formach. */}
      {availableForms.length > 1 && (
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
