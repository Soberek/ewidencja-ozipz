import { useState, useCallback, useEffect } from "react";

export interface UseActionFilterStateOptions {
  defaultMonth?: string;
  defaultYear?: string;
}

export type StatusFilter = "aktywne" | "wszystkie";
/** Publikacje w mediach (FB, X, www): domyślnie schowane, można je pokazać razem z innymi działaniami albo same. */
export type PublicationsMode = "ukryte" | "widoczne" | "tylko";

export const DEFAULT_STATUS_FILTER: StatusFilter = "aktywne";
export const DEFAULT_PUBLICATIONS_MODE: PublicationsMode = "ukryte";

/**
 * Filtry rejestru zapamiętane między uruchomieniami. Bez okresu, roku i wyszukiwania – po ponownym uruchomieniu
 * rejestr otwiera się na bieżącym miesiącu, także po zmianie roku. Preferencja widoku – brak pamięci nie jest błędem.
 */
export const ACTION_FILTERS_STORAGE_KEY = "oz.actionsFilters";
const LEGACY_HIDE_PUBLICATIONS_KEY = "oz.hidePublications";
/**
 * Okres, rok i wyszukiwanie pamiętane tylko do zamknięcia aplikacji – przetrwają przełączanie kart,
 * a po ponownym uruchomieniu rejestr znów startuje od bieżącego miesiąca.
 */
export const ACTION_FILTERS_SESSION_KEY = "oz.actionsFilters.session";

interface SessionActionFilters {
  search: string;
  selectedMonth: string;
  yearFilter: string;
  periodFilter: string;
  /** Widok domyślny z chwili zapisu; po zmianie miesiąca w trakcie sesji zapamiętany okres jest pomijany. */
  defaultMonth: string;
  defaultYear: string;
}

function readSessionFilters(defaultMonth: string, defaultYear: string): Partial<SessionActionFilters> {
  try {
    const raw = JSON.parse(sessionStorage.getItem(ACTION_FILTERS_SESSION_KEY) ?? "null") as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object" || raw.defaultMonth !== defaultMonth || raw.defaultYear !== defaultYear) return {};
    const result: Partial<SessionActionFilters> = {};
    for (const key of ["search", "selectedMonth", "yearFilter", "periodFilter"] as const) {
      if (typeof raw[key] === "string") result[key] = raw[key];
    }
    return result;
  } catch {
    return {};
  }
}

interface SavedActionFilters {
  statusFilter: StatusFilter;
  publicationsMode: PublicationsMode;
  quickFilterEzd: boolean;
  quickFilterProgramOnly: boolean;
  materialsOnlyFilter: boolean;
  selectedMunicipalities: string[];
  selectedPrograms: string[];
  selectedActivityTypes: string[];
  selectedTopics: string[];
  educatorFilter: string;
  ezdFilter: string;
}

function readSavedFilters(): Partial<SavedActionFilters> {
  const result: Partial<SavedActionFilters> = {};
  try {
    const legacy = localStorage.getItem(LEGACY_HIDE_PUBLICATIONS_KEY);
    if (legacy !== null) result.publicationsMode = legacy === "true" ? "ukryte" : "widoczne";
    const raw = JSON.parse(localStorage.getItem(ACTION_FILTERS_STORAGE_KEY) ?? "null") as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") return result;
    for (const key of ["educatorFilter", "ezdFilter"] as const) {
      if (typeof raw[key] === "string") result[key] = raw[key];
    }
    for (const key of ["quickFilterEzd", "quickFilterProgramOnly", "materialsOnlyFilter"] as const) {
      if (typeof raw[key] === "boolean") result[key] = raw[key];
    }
    for (const key of ["selectedMunicipalities", "selectedPrograms", "selectedActivityTypes", "selectedTopics"] as const) {
      const value = raw[key];
      if (Array.isArray(value)) result[key] = value.filter((item): item is string => typeof item === "string");
    }
    if (raw.statusFilter === "aktywne" || raw.statusFilter === "wszystkie") {
      result.statusFilter = raw.statusFilter;
    }
    if (raw.publicationsMode === "ukryte" || raw.publicationsMode === "widoczne" || raw.publicationsMode === "tylko") {
      result.publicationsMode = raw.publicationsMode;
    }
  } catch {
    // Uszkodzony lub niedostępny zapis – zostają filtry domyślne.
  }
  return result;
}

export function useActionFilterState(options: UseActionFilterStateOptions = {}) {
  const defaultMonth = options.defaultMonth ?? "";
  const defaultYear = options.defaultYear ?? "";
  const [saved] = useState(readSavedFilters);
  const [session] = useState(() => readSessionFilters(defaultMonth, defaultYear));
  const [search, setSearch] = useState(session.search ?? "");
  const [selectedMonth, setSelectedMonth] = useState<string>(session.selectedMonth ?? defaultMonth);
  const [yearFilter, setYearFilter] = useState<string>(session.yearFilter ?? defaultYear);
  const [periodFilter, setPeriodFilter] = useState<string>(session.periodFilter ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(saved.statusFilter ?? DEFAULT_STATUS_FILTER);
  const [publicationsMode, setPublicationsMode] = useState<PublicationsMode>(saved.publicationsMode ?? DEFAULT_PUBLICATIONS_MODE);
  const [quickFilterEzd, setQuickFilterEzd] = useState(saved.quickFilterEzd ?? false);
  const [quickFilterProgramOnly, setQuickFilterProgramOnly] = useState(saved.quickFilterProgramOnly ?? false);
  const [materialsOnlyFilter, setMaterialsOnlyFilter] = useState(saved.materialsOnlyFilter ?? false);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>(saved.selectedMunicipalities ?? []);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(saved.selectedPrograms ?? []);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(saved.selectedActivityTypes ?? []);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(saved.selectedTopics ?? []);
  const [educatorFilter, setEducatorFilter] = useState(saved.educatorFilter ?? "");
  const [ezdFilter, setEzdFilter] = useState(saved.ezdFilter ?? "all");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Backward-compatibility single-value setters
  const setMunicipalityFilter = useCallback((val: string) => setSelectedMunicipalities(val ? [val] : []), []);
  const setProgramFilter = useCallback((val: string) => setSelectedPrograms(val ? [val] : []), []);
  const setActivityTypeFilter = useCallback((val: string) => setSelectedActivityTypes(val ? [val] : []), []);
  const setTopicFilter = useCallback((val: string) => setSelectedTopics(val ? [val] : []), []);

  /** Przywraca widok domyślny: bieżący miesiąc i rok, aktywne działania, publikacje schowane. */
  const handleClearFilters = useCallback(() => {
    setSearch(""); setSelectedMonth(defaultMonth); setYearFilter(defaultYear); setPeriodFilter("");
    setStatusFilter(DEFAULT_STATUS_FILTER); setPublicationsMode(DEFAULT_PUBLICATIONS_MODE);
    setQuickFilterEzd(false); setQuickFilterProgramOnly(false); setMaterialsOnlyFilter(false);
    setSelectedMunicipalities([]); setSelectedPrograms([]); setSelectedActivityTypes([]); setSelectedTopics([]);
    setEducatorFilter(""); setEzdFilter("all");
  }, [defaultMonth, defaultYear]);

  useEffect(() => {
    const filters: SavedActionFilters = {
      statusFilter, publicationsMode, quickFilterEzd, quickFilterProgramOnly, materialsOnlyFilter,
      selectedMunicipalities, selectedPrograms, selectedActivityTypes, selectedTopics, educatorFilter, ezdFilter,
    };
    try {
      localStorage.setItem(ACTION_FILTERS_STORAGE_KEY, JSON.stringify(filters));
      localStorage.removeItem(LEGACY_HIDE_PUBLICATIONS_KEY);
    } catch { /* Preferencja widoku nie jest krytyczna. */ }
  }, [
    statusFilter, publicationsMode, quickFilterEzd, quickFilterProgramOnly, materialsOnlyFilter,
    selectedMunicipalities, selectedPrograms, selectedActivityTypes, selectedTopics, educatorFilter, ezdFilter,
  ]);

  useEffect(() => {
    const filters: SessionActionFilters = { search, selectedMonth, yearFilter, periodFilter, defaultMonth, defaultYear };
    try { sessionStorage.setItem(ACTION_FILTERS_SESSION_KEY, JSON.stringify(filters)); } catch { /* Preferencja widoku nie jest krytyczna. */ }
  }, [search, selectedMonth, yearFilter, periodFilter, defaultMonth, defaultYear]);

  const effectivePeriod = periodFilter || selectedMonth;

  return {
    search, setSearch,
    selectedMonth, setSelectedMonth,
    yearFilter, setYearFilter,
    periodFilter, setPeriodFilter,
    effectivePeriod,
    defaultMonth, defaultYear,
    statusFilter, setStatusFilter,
    publicationsMode, setPublicationsMode,
    hidePublications: publicationsMode === "ukryte",
    quickFilterPublications: publicationsMode === "tylko",
    quickFilterEzd, setQuickFilterEzd,
    quickFilterProgramOnly, setQuickFilterProgramOnly,
    materialsOnlyFilter, setMaterialsOnlyFilter,
    selectedMunicipalities, setSelectedMunicipalities,
    selectedPrograms, setSelectedPrograms,
    selectedActivityTypes, setSelectedActivityTypes,
    selectedTopics, setSelectedTopics,
    educatorFilter, setEducatorFilter,
    ezdFilter, setEzdFilter,
    isAdvancedOpen, setIsAdvancedOpen,
    municipalityFilter: selectedMunicipalities[0] || "",
    setMunicipalityFilter,
    programFilter: selectedPrograms[0] || "",
    setProgramFilter,
    activityTypeFilter: selectedActivityTypes[0] || "",
    setActivityTypeFilter,
    topicFilter: selectedTopics[0] || "",
    setTopicFilter,
    handleClearFilters,
  };
}
