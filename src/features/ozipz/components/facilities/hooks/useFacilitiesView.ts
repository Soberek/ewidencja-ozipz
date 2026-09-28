import { useCallback, useMemo, useState } from "react";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";
import type { OzipzDictionaryItem, OzipzFacility } from "../../../types/ozipz.types";
import {
  EMPTY_FACILITY_FILTERS,
  buildChildrenMap,
  buildFacilityIssuesIndex,
  countActiveFilters,
  filterFacilities,
  municipalityName,
  municipalityNamesFromDictionary,
  type FacilityFilterCriteria,
} from "../../../utils/facilityUtils";

export interface FacilityTypeOption {
  code: string;
  label: string;
  count: number;
}

/** Stan filtrów i wszystkie dane pochodne widoku Bazy Placówek. */
export function useFacilitiesView(
  facilities: OzipzFacility[],
  locationTypes: OzipzDictionaryItem[],
  municipalityItems: OzipzDictionaryItem[]
) {
  const [filters, setFilters] = useState<FacilityFilterCriteria>(EMPTY_FACILITY_FILTERS);
  const { isKpiVisible: showKpi, toggleKpi } = useKpiVisibility("facilities");

  const updateFilters = useCallback((patch: Partial<FacilityFilterCriteria>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);
  const clearFilters = useCallback(() => setFilters(EMPTY_FACILITY_FILTERS), []);

  const byId = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);
  const childrenMap = useMemo(() => buildChildrenMap(facilities), [facilities]);
  const dictionaryMunicipalities = useMemo(() => municipalityNamesFromDictionary(municipalityItems), [municipalityItems]);
  const issues = useMemo(
    () => buildFacilityIssuesIndex(facilities, new Set(dictionaryMunicipalities)),
    [facilities, dictionaryMunicipalities]
  );
  const typeLabels = useMemo(() => new Map(locationTypes.map((t) => [t.code, t.label])), [locationTypes]);

  /** Typy ze słownika uzupełnione o kody spotkane w danych, a nieobecne w słowniku. */
  const typeOptions = useMemo<FacilityTypeOption[]>(() => {
    const counts = new Map<string, number>();
    facilities.forEach((f) => counts.set(f.type, (counts.get(f.type) || 0) + 1));
    const codes = [...locationTypes.map((t) => t.code), ...Array.from(counts.keys()).filter((c) => !typeLabels.has(c))];
    return Array.from(new Set(codes))
      .map((code) => ({ code, label: typeLabels.get(code) || code, count: counts.get(code) || 0 }))
      .filter((option) => option.count > 0 || filters.types.includes(option.code));
  }, [facilities, locationTypes, typeLabels, filters.types]);

  const municipalityOptions = useMemo(() => {
    const names = [...dictionaryMunicipalities, ...facilities.map((f) => municipalityName(f.municipality))].filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pl"));
  }, [dictionaryMunicipalities, facilities]);

  const educationTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    facilities.forEach((f) => (f.educationTypes || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return counts;
  }, [facilities]);

  const filtered = useMemo(
    () => filterFacilities(facilities, filters, { byId, childrenMap, issues, typeLabels }),
    [facilities, filters, byId, childrenMap, issues, typeLabels]
  );

  const stats = useMemo(() => ({
    total: facilities.length,
    education: facilities.filter((f) => f.educationTypes?.length).length,
    complexes: facilities.filter((f) => f.isComplex).length,
    municipalities: new Set(facilities.map((f) => municipalityName(f.municipality)).filter(Boolean)).size,
    withIssues: issues.size,
  }), [facilities, issues]);

  return {
    filters,
    updateFilters,
    clearFilters,
    activeFiltersCount: countActiveFilters(filters),
    showKpi,
    toggleKpi,
    byId,
    childrenMap,
    issues,
    typeLabels,
    typeOptions,
    municipalityOptions,
    educationTypeCounts,
    filtered,
    stats,
  };
}
