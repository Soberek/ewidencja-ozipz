import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";

type StaffStatusFilter = "all" | "active" | "inactive";

interface StaffFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StaffStatusFilter;
  onStatusFilterChange: (value: StaffStatusFilter) => void;
  isKpiVisible: boolean;
  onToggleKpi: () => void;
  onOpenAdd: () => void;
}

const STATUS_CHIPS: { id: StaffStatusFilter; label: string }[] = [
  { id: "all", label: "Wszyscy pracownicy" },
  { id: "active", label: "Aktywni" },
  { id: "inactive", label: "Nieaktywni" },
];

export function StaffFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isKpiVisible,
  onToggleKpi,
  onOpenAdd,
}: StaffFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" /> Dodaj Pracownika OZiPZ
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Status">
          {STATUS_CHIPS.map((chip) => (
            <Chip key={chip.id} active={statusFilter === chip.id} onClick={() => onStatusFilterChange(chip.id)}>
              {chip.label}
            </Chip>
          ))}
        </ChipGroup>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj pracownika, roli..." />
    </FilterBar>
  );
}
