import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";

interface LettersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  directionFilter: string;
  onDirectionFilterChange: (value: string) => void;
  isKpiVisible: boolean;
  onToggleKpi: () => void;
  onOpenAdd: () => void;
}

const DIRECTION_CHIPS = [
  { id: "all", label: "Wszystkie pisma" },
  { id: "wychodzace", label: "Wychodzące" },
  { id: "przychodzace", label: "Przychodzące" },
];

export function LettersFilterBar({
  search,
  onSearchChange,
  directionFilter,
  onDirectionFilterChange,
  isKpiVisible,
  onToggleKpi,
  onOpenAdd,
}: LettersFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" /> Zarejestruj Pismo
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Kierunek">
          {DIRECTION_CHIPS.map((chip) => (
            <Chip key={chip.id} active={directionFilter === chip.id} onClick={() => onDirectionFilterChange(chip.id)}>
              {chip.label}
            </Chip>
          ))}
        </ChipGroup>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj pisma, numeru, odbiorcy..." />
    </FilterBar>
  );
}
