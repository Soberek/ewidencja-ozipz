import { useState } from "react";
import { AlertTriangle, Plus, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar, KpiToggleButton } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { ContactRoleFilter } from "../contactUtils";

export type { ContactRoleFilter };

export const CONTACT_ROLE_OPTIONS: { id: ContactRoleFilter; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "coordinators", label: "Koordynatorzy" },
  { id: "directors", label: "Dyrektorzy" },
  { id: "pedagogues", label: "Pedagodzy" },
];

export interface ContactsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  positionFilter: string;
  onPositionFilterChange: (pos: string) => void;
  positions: string[];
  muniFilter: string;
  onMuniFilterChange: (muni: string) => void;
  municipalities: string[];
  onOpenAdd: () => void;
  onOpenImport?: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  activeFiltersCount?: number;
  roleFilter?: ContactRoleFilter;
  onRoleFilterChange?: (role: ContactRoleFilter) => void;
  /** Liczba kontaktów z brakami – pokazuje dodatkowy chip „Do uzupełnienia”. */
  incompleteCount?: number;
  onToggleKpi?: () => void;
  isKpiVisible?: boolean;
}

export function ContactsFilterBar({
  search,
  onSearchChange,
  positionFilter,
  onPositionFilterChange,
  positions,
  muniFilter,
  onMuniFilterChange,
  municipalities,
  onOpenAdd,
  onOpenImport,
  onClearFilters,
  isFiltered,
  activeFiltersCount,
  roleFilter,
  onRoleFilterChange,
  incompleteCount = 0,
  onToggleKpi,
  isKpiVisible = true,
}: ContactsFilterBarProps) {
  const [internalRoleFilter, setInternalRoleFilter] = useState<ContactRoleFilter>("all");
  const activeRole = roleFilter ?? internalRoleFilter;

  const handleRoleChange = (role: ContactRoleFilter) => {
    setInternalRoleFilter(role);
    onRoleFilterChange?.(role);
  };

  return (
    <FilterBar
      actions={
        <>
          {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
          {onOpenImport && (
            <Button variant="outline" onClick={onOpenImport} className="font-medium">
              <FileSpreadsheet className="size-3.5 text-muted-foreground" />
              <span>Import z Excela</span>
            </Button>
          )}
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" />
            <span>Nowy Kontakt</span>
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Szybkie filtry">
          {CONTACT_ROLE_OPTIONS.map((opt) => (
            <Chip key={opt.id} active={activeRole === opt.id} onClick={() => handleRoleChange(opt.id)}>
              {opt.label}
            </Chip>
          ))}
          {(incompleteCount > 0 || activeRole === "incomplete") && (
            <Chip
              tone="warning"
              active={activeRole === "incomplete"}
              onClick={() => handleRoleChange(activeRole === "incomplete" ? "all" : "incomplete")}
              title="Kontakty bez telefonu i e-maila, z niepoprawnym e-mailem, bez placówki lub stanowiska"
              icon={<AlertTriangle className={activeRole === "incomplete" ? undefined : "text-amber-500"} />}
              className="ml-1"
            >
              Do uzupełnienia ({incompleteCount})
            </Chip>
          )}
        </ChipGroup>
      }
    >
      <SearchInput
        value={search}
        onValueChange={onSearchChange}
        placeholder="Szukaj po nazwisku, placówce, e-mailu, telefonie..."
        aria-label="Szukaj kontaktu"
      />
      <div className="w-52">
        <Select
          value={positionFilter}
          onChange={(val) => onPositionFilterChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie stanowiska" }, ...positions.map((p) => ({ value: p, label: p }))]}
          searchable={positions.length > 5}
          placeholder="Wszystkie stanowiska"
        />
      </div>
      <div className="w-44">
        <Select
          value={muniFilter}
          onChange={(val) => onMuniFilterChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie gminy" }, ...municipalities.map((m) => ({ value: m, label: m }))]}
          searchable={municipalities.length > 5}
          placeholder="Wszystkie gminy"
        />
      </div>
      {isFiltered && <ClearFiltersButton onClick={onClearFilters} count={activeFiltersCount} />}
    </FilterBar>
  );
}
