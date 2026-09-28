import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { OzipzProgram } from "../../../types/ozipz.types";

export type ParticipationReportStatusFilter = "all" | "submitted" | "pending" | "missing-declaration";

export interface SchoolParticipationsFilterBarProps {
  searchQuery?: string;
  search?: string;
  onSearchChange: (query: string) => void;
  selectedProgramId: string;
  onProgramChange: (programId: string) => void;
  selectedSchoolYear: string;
  onSchoolYearChange: (year: string) => void;
  selectedMunicipality: string;
  onMunicipalityChange: (municipality: string) => void;
  statusFilter: ParticipationReportStatusFilter;
  onStatusFilterChange: (status: ParticipationReportStatusFilter) => void;
  programs: OzipzProgram[];
  schoolYears: string[];
  municipalities: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
}

export const REPORT_STATUS_OPTIONS: { id: ParticipationReportStatusFilter; label: string }[] = [
  { id: "all", label: "Wszystkie zgłoszenia" },
  { id: "submitted", label: "Sprawozdanie złożone" },
  { id: "missing-declaration", label: "Brak deklaracji" },
  { id: "pending", label: "Oczekuje na sprawozdanie" },
];

export function SchoolParticipationsFilterBar({
  searchQuery,
  search,
  onSearchChange,
  selectedProgramId,
  onProgramChange,
  selectedSchoolYear,
  onSchoolYearChange,
  selectedMunicipality,
  onMunicipalityChange,
  statusFilter,
  onStatusFilterChange,
  programs,
  schoolYears,
  municipalities,
  onClearFilters,
  hasActiveFilters,
  activeFiltersCount,
}: SchoolParticipationsFilterBarProps) {
  const currentSearch = searchQuery ?? search ?? "";

  return (
    <FilterBar
      rows={
        <>
          <ChipGroup label="Szybkie filtry">
            {REPORT_STATUS_OPTIONS.map((opt) => (
              <Chip key={opt.id} active={statusFilter === opt.id} onClick={() => onStatusFilterChange(opt.id)}>
                {opt.label}
              </Chip>
            ))}
          </ChipGroup>
          {municipalities.length > 0 && (
            <ChipGroup label="Gmina">
              {municipalities.map((muni) => {
                const isActive = selectedMunicipality === muni;
                return (
                  <Chip key={muni} active={isActive} onClick={() => onMunicipalityChange(isActive ? "all" : muni)}>
                    {muni}
                  </Chip>
                );
              })}
            </ChipGroup>
          )}
        </>
      }
    >
      <SearchInput
        value={currentSearch}
        onValueChange={onSearchChange}
        placeholder="Szukaj po szkole, gminie, koordynatorze..."
        aria-label="Szukaj po szkole, gminie, koordynatorze"
      />
      <div className="w-56">
        <Select
          value={selectedProgramId}
          onChange={(val) => onProgramChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie programy" }, ...programs.map((p) => ({ value: p.id, label: p.name }))]}
          searchable={programs.length > 5}
          placeholder="Wszystkie programy"
        />
      </div>
      <div className="w-44">
        <Select
          value={selectedSchoolYear}
          onChange={(val) => onSchoolYearChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie lata szkolne" }, ...schoolYears.map((y) => ({ value: y, label: y }))]}
          searchable={schoolYears.length > 5}
          placeholder="Wszystkie lata szkolne"
        />
      </div>
      <div className="w-44">
        <Select
          value={selectedMunicipality}
          onChange={(val) => onMunicipalityChange(val || "all")}
          options={[{ value: "all", label: "Wszystkie gminy" }, ...municipalities.map((m) => ({ value: m, label: m }))]}
          searchable={municipalities.length > 5}
          placeholder="Wszystkie gminy"
        />
      </div>
      {hasActiveFilters && <ClearFiltersButton onClick={onClearFilters} count={activeFiltersCount} />}
    </FilterBar>
  );
}
