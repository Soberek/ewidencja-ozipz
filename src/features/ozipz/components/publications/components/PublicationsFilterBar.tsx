import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { FilterBar, KpiToggleButton, ResultsCount } from "@/components/ui/filter-bar";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";

import type { ChannelFamily } from "../matching/publicationMatcher";

export type PublicationChipId = "all" | "custom" | ChannelFamily;

const QUICK_CHIPS: { id: Exclude<PublicationChipId, "custom">; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "gov", label: "Strona gov.pl" },
  { id: "x", label: "Profil X" },
  { id: "fb", label: "Facebook" },
  { id: "other", label: "Inne media" },
];

interface PublicationsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  channelFilter: string;
  onChannelFilterChange: (val: string) => void;
  availableChannels: string[];
  activeChip: PublicationChipId;
  onActiveChipChange: (chipId: PublicationChipId) => void;
  chipCounts: Record<Exclude<PublicationChipId, "custom">, number>;
  isKpiCollapsed: boolean;
  onToggleKpi: () => void;
  onOpenAdd: () => void;
  totalCount: number;
  filteredCount: number;
}

export function PublicationsFilterBar({
  search,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
  availableChannels,
  activeChip,
  onActiveChipChange,
  chipCounts,
  isKpiCollapsed,
  onToggleKpi,
  onOpenAdd,
  totalCount,
  filteredCount,
}: PublicationsFilterBarProps) {
  return (
    <FilterBar
      actions={
        <>
          <KpiToggleButton visible={!isKpiCollapsed} onToggle={onToggleKpi} />
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" />
            <span>Dodaj Publikację</span>
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Szybki filtr" trailing={<ResultsCount label="Wyświetlono" shown={filteredCount} total={totalCount} />}>
          {QUICK_CHIPS.filter((chip) => chip.id === "all" || chipCounts[chip.id] > 0).map((chip) => (
            <Chip key={chip.id} active={activeChip === chip.id} onClick={() => onActiveChipChange(chip.id)} count={chipCounts[chip.id]}>
              {chip.label}
            </Chip>
          ))}
        </ChipGroup>
      }
    >
      <SearchInput
        value={search}
        onValueChange={onSearchChange}
        placeholder="Szukaj publikacji, tematu, autora..."
        aria-label="Szukaj publikacji"
      />
      <NativeSelect
        value={channelFilter}
        onChange={(e) => {
          onChannelFilterChange(e.target.value);
          onActiveChipChange(e.target.value === "all" ? "all" : "custom");
        }}
        aria-label="Filtruj kanał publikacji"
      >
        <option value="all">Wszystkie kanały</option>
        {availableChannels.map((chan) => (
          <option key={chan} value={chan}>
            {chan}
          </option>
        ))}
      </NativeSelect>
    </FilterBar>
  );
}
