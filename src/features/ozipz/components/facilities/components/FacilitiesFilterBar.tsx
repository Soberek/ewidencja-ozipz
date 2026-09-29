import { AlertTriangle, FileSpreadsheet, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar, KpiToggleButton, ResultsCount } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { FacilityFilterCriteria, FacilityStructureFilter } from "../../../utils/facilityUtils";
import type { FacilityTypeOption } from "../hooks/useFacilitiesView";
import { FacilityEducationTypeFilterRow } from "./FacilityEducationTypeFilterRow";

export interface FacilitiesFilterBarProps {
  filters: FacilityFilterCriteria;
  onFiltersChange: (patch: Partial<FacilityFilterCriteria>) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  resultsCount: number;
  typeOptions: FacilityTypeOption[];
  municipalityOptions: string[];
  educationTypeCounts?: Record<string, number>;
  issuesCount: number;
  onOpenEmailsCopy: () => void;
  onOpenAdd: () => void;
  onOpenImport?: () => void;
  onToggleKpi?: () => void;
  isKpiVisible?: boolean;
}

const STRUCTURE_OPTIONS: { id: FacilityStructureFilter; label: string }[] = [
  { id: "all", label: "Wszystkie placówki" },
  { id: "complex", label: "Zespoły szkół" },
  { id: "standalone", label: "Placówki samodzielne" },
  { id: "in_complex", label: "W składzie zespołu" },
];

export function FacilitiesFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFiltersCount,
  resultsCount,
  typeOptions,
  municipalityOptions,
  educationTypeCounts,
  issuesCount,
  onOpenEmailsCopy,
  onOpenAdd,
  onOpenImport,
  onToggleKpi,
  isKpiVisible = true,
}: FacilitiesFilterBarProps) {
  const toggleType = (code: string) =>
    onFiltersChange({ types: filters.types.includes(code) ? filters.types.filter((t) => t !== code) : [...filters.types, code] });
  const toggleEducationType = (type: string) =>
    onFiltersChange({
      educationTypes: filters.educationTypes.includes(type)
        ? filters.educationTypes.filter((t) => t !== type)
        : [...filters.educationTypes, type],
    });

  return (
    <FilterBar
      actions={
        <>
          {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
          <Button variant="outline" onClick={onOpenEmailsCopy} className="font-medium">
            <Mail className="size-3.5 text-muted-foreground" />
            <span>Kopiuj e-maile</span>
          </Button>
          {onOpenImport && (
            <Button variant="outline" onClick={onOpenImport} className="font-medium">
              <FileSpreadsheet className="size-3.5 text-muted-foreground" />
              <span>Import z Excela</span>
            </Button>
          )}
          <Button onClick={onOpenAdd}>
            <Plus className="size-3.5" />
            <span>Nowa placówka</span>
          </Button>
        </>
      }
      rows={
        <>
          <ChipGroup label="Struktura" trailing={<ResultsCount shown={resultsCount} />}>
            {STRUCTURE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                active={filters.structure === option.id}
                onClick={() => onFiltersChange({ structure: option.id })}
              >
                {option.label}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="Typ placówki">
            <Chip active={filters.types.length === 0} onClick={() => onFiltersChange({ types: [] })}>
              Wszystkie typy
            </Chip>
            {typeOptions.map((option) => (
              <Chip
                key={option.code}
                active={filters.types.includes(option.code)}
                onClick={() => toggleType(option.code)}
                count={option.count}
              >
                <span className="first-letter:uppercase">{option.label}</span>
              </Chip>
            ))}
          </ChipGroup>
          <FacilityEducationTypeFilterRow
            selectedEducationTypes={filters.educationTypes}
            onToggleEducationType={toggleEducationType}
            onSelectEducationTypePreset={(types) => onFiltersChange({ educationTypes: types })}
            onClearEducationTypes={() => onFiltersChange({ educationTypes: [] })}
            educationTypeCounts={educationTypeCounts}
          />
        </>
      }
    >
      <SearchInput
        value={filters.search}
        onValueChange={(search) => onFiltersChange({ search })}
        placeholder="Nazwa, miejscowość, e-mail, koordynator…"
        aria-label="Szukaj placówek"
      />
      <div className="w-48">
        <Select
          value={filters.municipality}
          onChange={(val) => onFiltersChange({ municipality: val || "all" })}
          options={[{ value: "all", label: "Wszystkie gminy" }, ...municipalityOptions.map((m) => ({ value: m, label: m }))]}
          searchable={municipalityOptions.length > 6}
          placeholder="Wszystkie gminy"
        />
      </div>
      <Chip
        tone="warning"
        active={filters.onlyWithIssues}
        onClick={() => onFiltersChange({ onlyWithIssues: !filters.onlyWithIssues })}
        title="Placówki z brakami lub niespójnymi danymi"
        icon={<AlertTriangle className={filters.onlyWithIssues ? undefined : "text-amber-500"} />}
        count={issuesCount}
        className="h-8"
      >
        Do uzupełnienia
      </Chip>
      {activeFiltersCount > 0 && <ClearFiltersButton onClick={onClearFilters} count={activeFiltersCount} />}
    </FilterBar>
  );
}
