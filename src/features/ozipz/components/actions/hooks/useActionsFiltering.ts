import { useDeferredValue, useMemo } from "react";
import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";
import { filterActionsList, generateActiveFilterChips } from "./actionsFilterLogic";
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
      quickFilterEzd: filterState.quickFilterEzd,
      quickFilterProgramOnly: filterState.quickFilterProgramOnly,
      materialsOnlyFilter: filterState.materialsOnlyFilter, quickFilterPublications: filterState.quickFilterPublications,
      hidePublications: filterState.hidePublications, selectedMunicipalities: filterState.selectedMunicipalities,
      selectedPrograms: filterState.selectedPrograms, selectedActivityTypes: filterState.selectedActivityTypes,
      selectedTopics: filterState.selectedTopics, educatorFilter: filterState.educatorFilter,
      ezdFilter: filterState.ezdFilter,
    });
  }, [
    actions, programs, deferredSearch, filterState.effectivePeriod, filterState.yearFilter, filterState.statusFilter,
    filterState.quickFilterEzd, filterState.quickFilterProgramOnly,
    filterState.materialsOnlyFilter, filterState.quickFilterPublications,
    filterState.hidePublications, filterState.selectedMunicipalities, filterState.selectedPrograms,
    filterState.selectedActivityTypes, filterState.selectedTopics, filterState.educatorFilter,
    filterState.ezdFilter,
  ]);

  // Setery z useState są stabilne, więc etykiety przeliczają się tylko po zmianie wartości filtrów.
  const activeFilterChips = useMemo(() => generateActiveFilterChips(
    {
      search: filterState.search, effectivePeriod: filterState.effectivePeriod, yearFilter: filterState.yearFilter,
      statusFilter: filterState.statusFilter, publicationsMode: filterState.publicationsMode,
      quickFilterEzd: filterState.quickFilterEzd, quickFilterProgramOnly: filterState.quickFilterProgramOnly,
      materialsOnlyFilter: filterState.materialsOnlyFilter,
      selectedMunicipalities: filterState.selectedMunicipalities, selectedPrograms: filterState.selectedPrograms,
      selectedActivityTypes: filterState.selectedActivityTypes, selectedTopics: filterState.selectedTopics,
      educatorFilter: filterState.educatorFilter, ezdFilter: filterState.ezdFilter,
    },
    filterState,
    { period: filterState.defaultMonth, year: filterState.defaultYear },
    programs
  ), [
    filterState.search, filterState.effectivePeriod, filterState.yearFilter, filterState.statusFilter,
    filterState.publicationsMode, filterState.quickFilterEzd, filterState.quickFilterProgramOnly,
    filterState.materialsOnlyFilter, filterState.selectedMunicipalities,
    filterState.selectedPrograms, filterState.selectedActivityTypes, filterState.selectedTopics,
    filterState.educatorFilter, filterState.ezdFilter, filterState.defaultMonth, filterState.defaultYear, programs,
  ]);

  const selection = useActionSelection({ actions, filteredActions, onDeleteAction, onUpdateAction });

  return {
    ...filterState,
    ...tools,
    ...selection,
    availableYears,
    filteredActions,
    activeFiltersCount: activeFilterChips.length,
    activeFilterChips,
  };
}
