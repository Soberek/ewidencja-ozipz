import { useState, useCallback } from "react";

export interface UseActionFilterStateOptions {
  defaultMonth?: string;
  defaultYear?: string;
}

export function useActionFilterState(options: UseActionFilterStateOptions = {}) {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(options.defaultMonth ?? "");
  const [yearFilter, setYearFilter] = useState<string>(options.defaultYear ?? "");
  const [periodFilter, setPeriodFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"aktywne" | "wszystkie" | "zakonczone">("aktywne");
  const [quickFilterEzd, setQuickFilterEzd] = useState(false);
  const [quickFilterCurrentMonth, setQuickFilterCurrentMonth] = useState(false);
  const [quickFilterProgramOnly, setQuickFilterProgramOnly] = useState(false);
  const [quickFilterInProgress, setQuickFilterInProgress] = useState(false);
  const [materialsOnlyFilter, setMaterialsOnlyFilter] = useState(false);
  const [quickFilterPublications, setQuickFilterPublications] = useState(false);
  const [hidePublications, setHidePublications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("oz.hidePublications");
      if (saved !== null) return saved === "true";
    } catch {
      // ignore
    }
    return true;
  });

  const toggleHidePublications = useCallback(() => {
    setHidePublications((prev) => {
      const next = !prev;
      try { localStorage.setItem("oz.hidePublications", String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const togglePublicationsQuickFilter = useCallback(
    () => setQuickFilterPublications((prev) => !prev),
    []
  );

  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [educatorFilter, setEducatorFilter] = useState("");
  const [ezdFilter, setEzdFilter] = useState("all");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Backward-compatibility single-value setters
  const setMunicipalityFilter = useCallback((val: string) => setSelectedMunicipalities(val ? [val] : []), []);
  const setProgramFilter = useCallback((val: string) => setSelectedPrograms(val ? [val] : []), []);
  const setActivityTypeFilter = useCallback((val: string) => setSelectedActivityTypes(val ? [val] : []), []);
  const setTopicFilter = useCallback((val: string) => setSelectedTopics(val ? [val] : []), []);

  const handleClearFilters = useCallback(() => {
    setSearch(""); setSelectedMonth(""); setYearFilter(""); setPeriodFilter(""); setStatusFilter("wszystkie");
    setQuickFilterEzd(false); setQuickFilterCurrentMonth(false); setQuickFilterProgramOnly(false);
    setQuickFilterInProgress(false); setMaterialsOnlyFilter(false); setQuickFilterPublications(false);
    setSelectedMunicipalities([]); setSelectedPrograms([]); setSelectedActivityTypes([]); setSelectedTopics([]);
    setEducatorFilter(""); setEzdFilter("all"); setHidePublications(false);
    try { localStorage.setItem("oz.hidePublications", "false"); } catch { /* ignore */ }
  }, []);

  const effectivePeriod = periodFilter || selectedMonth;

  return {
    search, setSearch,
    selectedMonth, setSelectedMonth,
    yearFilter, setYearFilter,
    periodFilter, setPeriodFilter,
    effectivePeriod,
    statusFilter, setStatusFilter,
    quickFilterEzd, setQuickFilterEzd,
    quickFilterCurrentMonth, setQuickFilterCurrentMonth,
    quickFilterProgramOnly, setQuickFilterProgramOnly,
    quickFilterInProgress, setQuickFilterInProgress,
    materialsOnlyFilter, setMaterialsOnlyFilter,
    quickFilterPublications, setQuickFilterPublications,
    togglePublicationsQuickFilter,
    hidePublications, setHidePublications, toggleHidePublications,
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
