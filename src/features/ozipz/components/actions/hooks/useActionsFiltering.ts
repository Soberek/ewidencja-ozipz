import { useDeferredValue, useMemo } from "react";
import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";
import { filterActionsList, computeActiveFiltersCount, generateActiveFilterChips } from "./actionsFilterLogic";
import { useActionFilterState } from "./useActionFilterState";
import { useActionSelection } from "./useActionSelection";
import { useActionToolsState } from "./useActionToolsState";

export interface UseActionsFilteringParams {
  actions: OzipzAction[];
  programs?: OzipzProgram[];
  onDeleteAction: (id: string) => Promise<void>;
  onUpdateAction: (id: string, updates: Partial<OzipzAction>) => Promise<void>;
  defaultMonth?: string;
  defaultYear?: string;
}

export function useActionsFiltering({ actions, programs, onDeleteAction, onUpdateAction, defaultMonth, defaultYear }: UseActionsFilteringParams) {
  const currentYear = new Date().getFullYear();
  const currentMonthStr = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const filterState = useActionFilterState({ defaultMonth, defaultYear });
  const tools = useActionToolsState();

  const availableYears = useMemo(() => {
    const years = new Set(actions.map((a) => (a.date || "").slice(0, 4)).filter((y) => /^\d{4}$/.test(y)));
    years.add(String(currentYear));
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [actions, currentYear]);

  // Pole wyszukiwania odświeża się od razu, a filtrowanie i tabela nadążają w tle (bez przycinania przy pisaniu).
  const deferredSearch = useDeferredValue(filterState.search);

  const filteredActions = useMemo(() => {
    return filterActionsList(actions, {
      programs,
      search: deferredSearch, effectivePeriod: filterState.effectivePeriod, yearFilter: filterState.yearFilter, statusFilter: filterState.statusFilter,
      quickFilterEzd: filterState.quickFilterEzd, quickFilterCurrentMonth: filterState.quickFilterCurrentMonth,
      quickFilterProgramOnly: filterState.quickFilterProgramOnly, quickFilterInProgress: filterState.quickFilterInProgress,
      materialsOnlyFilter: filterState.materialsOnlyFilter, quickFilterPublications: filterState.quickFilterPublications,
      hidePublications: filterState.hidePublications, selectedMunicipalities: filterState.selectedMunicipalities,
      selectedPrograms: filterState.selectedPrograms, selectedActivityTypes: filterState.selectedActivityTypes,
      selectedTopics: filterState.selectedTopics, educatorFilter: filterState.educatorFilter,
      ezdFilter: filterState.ezdFilter, currentMonthStr,
    });
  }, [
    actions, programs, deferredSearch, filterState.effectivePeriod, filterState.yearFilter, filterState.statusFilter,
    filterState.quickFilterEzd, filterState.quickFilterCurrentMonth, filterState.quickFilterProgramOnly,
    filterState.quickFilterInProgress, filterState.materialsOnlyFilter, filterState.quickFilterPublications,
    filterState.hidePublications, filterState.selectedMunicipalities, filterState.selectedPrograms,
    filterState.selectedActivityTypes, filterState.selectedTopics, filterState.educatorFilter,
    filterState.ezdFilter, currentMonthStr,
  ]);

  const activeFiltersCount = useMemo(() => {
    return computeActiveFiltersCount({
      search: filterState.search, effectivePeriod: filterState.effectivePeriod, yearFilter: filterState.yearFilter,
      quickFilterEzd: filterState.quickFilterEzd, quickFilterCurrentMonth: filterState.quickFilterCurrentMonth,
      quickFilterProgramOnly: filterState.quickFilterProgramOnly, quickFilterInProgress: filterState.quickFilterInProgress,
      materialsOnlyFilter: filterState.materialsOnlyFilter, quickFilterPublications: filterState.quickFilterPublications,
      hidePublications: filterState.hidePublications, statusFilter: filterState.statusFilter, selectedMunicipalities: filterState.selectedMunicipalities,
      selectedPrograms: filterState.selectedPrograms, selectedActivityTypes: filterState.selectedActivityTypes,
      selectedTopics: filterState.selectedTopics, educatorFilter: filterState.educatorFilter, ezdFilter: filterState.ezdFilter,
    });
  }, [
    filterState.search, filterState.effectivePeriod, filterState.yearFilter, filterState.quickFilterEzd,
    filterState.quickFilterCurrentMonth, filterState.quickFilterProgramOnly,
    filterState.quickFilterInProgress, filterState.materialsOnlyFilter,
    filterState.quickFilterPublications, filterState.hidePublications, filterState.statusFilter,
    filterState.selectedMunicipalities, filterState.selectedPrograms,
    filterState.selectedActivityTypes, filterState.selectedTopics,
    filterState.educatorFilter, filterState.ezdFilter,
  ]);

  const activeFilterChips = useMemo(() => {
    return generateActiveFilterChips(
      {
        selectedMunicipalities: filterState.selectedMunicipalities,
        selectedPrograms: filterState.selectedPrograms,
        selectedActivityTypes: filterState.selectedActivityTypes,
        selectedTopics: filterState.selectedTopics,
        educatorFilter: filterState.educatorFilter,
        effectivePeriod: filterState.effectivePeriod,
        ezdFilter: filterState.ezdFilter,
        materialsOnlyFilter: filterState.materialsOnlyFilter,
        quickFilterPublications: filterState.quickFilterPublications,
        yearFilter: filterState.yearFilter,
      },
      filterState,
      programs
    );
  }, [
    filterState.selectedMunicipalities, filterState.selectedPrograms, programs,
    filterState.selectedActivityTypes, filterState.selectedTopics,
    filterState.educatorFilter, filterState.effectivePeriod, filterState.ezdFilter,
    filterState.materialsOnlyFilter, filterState.quickFilterPublications, filterState.yearFilter,
    filterState.setYearFilter, filterState.setSelectedMunicipalities, filterState.setSelectedPrograms,
    filterState.setSelectedActivityTypes, filterState.setSelectedTopics,
    filterState.setEducatorFilter, filterState.setSelectedMonth,
    filterState.setPeriodFilter, filterState.setEzdFilter,
    filterState.setMaterialsOnlyFilter, filterState.setQuickFilterPublications,
  ]);

  const selection = useActionSelection({ actions, filteredActions, onDeleteAction, onUpdateAction });

  return {
    ...filterState,
    ...tools,
    ...selection,
    availableYears,
    filteredActions,
    activeFiltersCount,
    activeFilterChips,
  };
}
