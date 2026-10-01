import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzAction, OzipzDistribution, HealthPromotionTab } from "../../types/ozipz.types";
import { useActions, useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useUIStore } from "../../store/useUIStore";
import { ActionsFilterBar } from "./list/ActionsFilterBar";
import { ActionsAdvancedFiltersPanel } from "./list/ActionsAdvancedFiltersPanel";
import { ActionsFilterChips } from "./list/ActionsFilterChips";
import { ActionsBulkToolbar } from "./list/ActionsBulkToolbar";
import { ActionsModalsContainer } from "./list/ActionsModalsContainer";
import { ActionsTableView } from "./list/ActionsTableView";
import { createActionColumns } from "./list/ActionsTableColumns";
import { useActionsFiltering } from "./hooks/useActionsFiltering";
import { selectMunicipalities, selectTopics } from "../../hooks/useOzipzDb";
import { duplicateActionDraft } from "./editor/editorUtils";
import { isMonthClosed } from "../../utils/dateUtils";

export interface ActionsSectionProps {
  actions?: OzipzAction[];
  distributions?: OzipzDistribution[];
  onOpenAdd?: () => void;
  onOpenEdit?: (action: OzipzAction) => void;
  onDuplicateAction?: (action: OzipzAction) => void;
  onDelete?: (id: string) => void;
  onUpdateAction?: (id: string, updates: Partial<OzipzAction>) => Promise<void>;
  onNavigateTab?: (tab: HealthPromotionTab) => void;
  onOpenAddDistribution?: () => void;
}

export function ActionsSection(props: ActionsSectionProps) {
  const navigate = useNavigate();
  const actionsStore = useActions();

  const actions = props.actions ?? actionsStore.actions;
  const { onOpenAdd: propsOnOpenAdd, onOpenEdit: propsOnOpenEdit, onDelete: propsOnDelete, onUpdateAction: propsOnUpdateAction } = props;
  const storeDeleteAction = actionsStore.deleteAction;
  const storeUpdateAction = actionsStore.updateAction;

  // Stabilne referencje, żeby kolumny tabeli (useMemo niżej) nie przebudowywały się przy każdym renderze.
  const onOpenAdd = useCallback(() => (propsOnOpenAdd ? propsOnOpenAdd() : navigate("/dzialania/nowe")), [propsOnOpenAdd, navigate]);
  const onOpenEdit = useCallback(
    (action: OzipzAction) => (propsOnOpenEdit ? propsOnOpenEdit(action) : navigate(`/dzialania/${action.id}/edytuj`)),
    [propsOnOpenEdit, navigate]
  );
  const deleteAction = useCallback(async (id: string) => {
    if (propsOnDelete) return propsOnDelete(id);
    await storeDeleteAction(id);
  }, [propsOnDelete, storeDeleteAction]);
  const onDeleteAction = useCallback(async (id: string) => {
    try {
      await deleteAction(id);
      toast.success("Usunięto działanie edukacyjne");
    } catch (error) {
      toast.error("Błąd podczas usuwania działania");
      throw error;
    }
  }, [deleteAction]);

  const onUpdateAction = useCallback(async (id: string, updates: Partial<OzipzAction>) => {
    if (propsOnUpdateAction) return propsOnUpdateAction(id, updates);
    await storeUpdateAction(id, updates);
  }, [propsOnUpdateAction, storeUpdateAction]);

  const [selectedIzrzAction, setSelectedIzrzAction] = useState<OzipzAction | null>(null);
  const [selectedBlankietDistribution, setSelectedBlankietDistribution] =
    useState<OzipzDistribution | null>(null);

  // Wąskie subskrypcje: rejestr nie przelicza się przy zmianach innych modułów bazy.
  const programs = useOzipzDbStore((s) => s.programs);
  const staff = useOzipzDbStore((s) => s.staff);
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const dictionaries = useMemo(
    () => ({
      municipalities: selectMunicipalities(dictionaryItems),
      activityTypes: dictionaryItems.filter((d) => d.dictType === "activityType"),
      topics: selectTopics(dictionaryItems),
    }),
    [dictionaryItems]
  );

  const {
    search,
    setSearch,
    selectedMonth,
    setSelectedMonth,
    yearFilter,
    setYearFilter,
    availableYears,
    statusFilter,
    setStatusFilter,
    quickFilterEzd,
    setQuickFilterEzd,
    quickFilterProgramOnly,
    setQuickFilterProgramOnly,
    quickFilterInProgress,
    setQuickFilterInProgress,
    materialsOnlyFilter,
    setMaterialsOnlyFilter,
    publicationsMode,
    setPublicationsMode,
    municipalityFilter,
    setMunicipalityFilter,
    programFilter,
    setProgramFilter,
    activityTypeFilter,
    setActivityTypeFilter,
    topicFilter,
    setTopicFilter,
    educatorFilter,
    setEducatorFilter,
    ezdFilter,
    setEzdFilter,
    selectedMunicipalities,
    setSelectedMunicipalities,
    selectedPrograms,
    setSelectedPrograms,
    selectedActivityTypes,
    setSelectedActivityTypes,
    selectedTopics,
    setSelectedTopics,
    isAdvancedOpen,
    setIsAdvancedOpen,
    activeFilterChips,
    selectedActionIds,
    selectedMetrics,
    handleSelectFirstN,
    handleBulkMarkEzd,
    handleBulkExportCsv,
    handleBulkCopySummary,
    isMonthModalOpen,
    setIsMonthModalOpen,
    closedMonths,
    toggleMonthLock,
    locksStatus,
    refreshClosedMonths,
    pendingMonth,
    copiedSignId,
    handleCopySign,
    filteredActions,
    activeFiltersCount,
    handleClearFilters,
    handleSelectAll,
    handleToggleSelect,
    handleBulkDelete,
    handleBulkMarkDone,
    isAllSelected,
  } = useActionsFiltering({
    actions,
    programs,
    onDeleteAction: deleteAction,
    onUpdateAction,
    defaultMonth: String(new Date().getMonth() + 1).padStart(2, "0"),
    defaultYear: String(new Date().getFullYear()),
  });

  const handleDuplicateAction = useCallback(
    (action: OzipzAction) => {
      if (props.onDuplicateAction) {
        props.onDuplicateAction(action);
        return;
      }
      const draft = duplicateActionDraft(action, props.distributions ?? useOzipzDbStore.getState().distributions);
      navigate("/dzialania/nowe", {
        state: { duplicateFrom: draft, sourceActionId: action.id },
      });
      toast.info(`Skopiowano dane zadania: "${action.title}". Możesz zmienić datę i zapisać.`);
    },
    [props.onDuplicateAction, props.distributions, navigate]
  );

  const tableDensity = useUIStore((s) => s.tableDensity);
  const bulkMutationsDisabled = locksStatus !== "ready" || actions.some((action) => selectedActionIds.has(action.id) && isMonthClosed(action.date, closedMonths));

  const { actionsById, linkedDistributionByActionId } = useMemo(() => {
    const byId = new Map<string, OzipzAction>();
    const byParent = new Map<string, OzipzAction>();
    for (const action of actions) {
      byId.set(action.id, action);
      if (action.linkedActionId) byParent.set(action.linkedActionId, action);
    }
    return { actionsById: byId, linkedDistributionByActionId: byParent };
  }, [actions]);

  const columns = useMemo(
    () =>
      createActionColumns({
        isAllSelected,
        copiedSignId,
        closedMonths,
        locksStatus,
        density: tableDensity,
        onSelectAll: handleSelectAll,
        onToggleSelect: handleToggleSelect,
        onCopySign: handleCopySign,
        onEdit: onOpenEdit,
        onDuplicate: handleDuplicateAction,
        onDelete: onDeleteAction,
        onOpenIzrz: (action) => setSelectedIzrzAction(action),
        actionsById,
        linkedDistributionByActionId,
      }),
    [
      isAllSelected,
      copiedSignId,
      closedMonths,
      locksStatus,
      tableDensity,
      handleSelectAll,
      handleToggleSelect,
      handleCopySign,
      onOpenEdit,
      handleDuplicateAction,
      onDeleteAction,
      actionsById,
      linkedDistributionByActionId,
    ]
  );

  const advancedFiltersCount = [
    municipalityFilter,
    programFilter,
    activityTypeFilter,
    topicFilter,
    educatorFilter,
    ezdFilter !== "all",
  ].filter(Boolean).length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            Rejestr działań
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              {filteredActions.length !== actions.length
                ? `${filteredActions.length} / ${actions.length}`
                : actions.length}
            </span>
          </h1>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" onClick={() => { setIsMonthModalOpen(true); void refreshClosedMonths(); }} className="font-medium">
              <Lock className="size-3 text-muted-foreground" />
              <span>Miesiące</span>
            </Button>
            <Button onClick={onOpenAdd}>
              <Plus className="size-3.5" />
              <span>Nowe Działanie</span>
            </Button>
          </div>
        </div>

        {/* Panel filtrów i wyszukiwania */}
        <ActionsFilterBar
          search={search}
          onSearchChange={setSearch}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={yearFilter}
          onYearChange={setYearFilter}
          availableYears={availableYears}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          publicationsMode={publicationsMode}
          onPublicationsModeChange={setPublicationsMode}
          quickFilterEzd={quickFilterEzd}
          onToggleEzd={() => setQuickFilterEzd(!quickFilterEzd)}
          quickFilterProgramOnly={quickFilterProgramOnly}
          onToggleProgramOnly={() => setQuickFilterProgramOnly(!quickFilterProgramOnly)}
          quickFilterInProgress={quickFilterInProgress}
          onToggleInProgress={() => setQuickFilterInProgress(!quickFilterInProgress)}
          materialsOnlyFilter={materialsOnlyFilter}
          onToggleMaterialsOnly={() => setMaterialsOnlyFilter(!materialsOnlyFilter)}
          isAdvancedOpen={isAdvancedOpen}
          onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
          advancedFiltersCount={advancedFiltersCount}
        />

        {/* Rozwijany panel filtrów zaawansowanych */}
        <ActionsAdvancedFiltersPanel
          isOpen={isAdvancedOpen}
          municipalityFilter={municipalityFilter}
          onMunicipalityChange={setMunicipalityFilter}
          selectedMunicipalities={selectedMunicipalities}
          onToggleMunicipality={(m) => setSelectedMunicipalities((prev) => (prev.includes(m) ? prev.filter((i) => i !== m) : [...prev, m]))}
          programFilter={programFilter}
          onProgramChange={setProgramFilter}
          selectedPrograms={selectedPrograms}
          onToggleProgram={(p) => setSelectedPrograms((prev) => (prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]))}
          activityTypeFilter={activityTypeFilter}
          onActivityTypeChange={setActivityTypeFilter}
          selectedActivityTypes={selectedActivityTypes}
          onToggleActivityType={(a) => setSelectedActivityTypes((prev) => (prev.includes(a) ? prev.filter((i) => i !== a) : [...prev, a]))}
          topicFilter={topicFilter}
          onTopicChange={setTopicFilter}
          selectedTopics={selectedTopics}
          onToggleTopic={(t) => setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((i) => i !== t) : [...prev, t]))}
          educatorFilter={educatorFilter}
          onEducatorChange={setEducatorFilter}
          ezdFilter={ezdFilter}
          onEzdChange={setEzdFilter}
          municipalities={dictionaries.municipalities}
          programs={programs}
          activityTypes={dictionaries.activityTypes}
          topics={dictionaries.topics}
          staff={staff}
        />

        {/* Etykiety aktywnych filtrów */}
        <ActionsFilterChips
          filters={activeFilterChips}
          onClearAll={handleClearFilters}
        />

        {/* Pasek operacji masowych */}
        <ActionsBulkToolbar
          selectedCount={selectedActionIds.size}
          totalFilteredCount={filteredActions.length}
          selectedRecipientsCount={selectedMetrics.recipients}
          selectedMaterialsCount={selectedMetrics.materials}
          selectedDoEzdCount={selectedMetrics.doEzd}
          onSelectAll={() => handleSelectAll(true)}
          onSelectFirstN={handleSelectFirstN}
          onClearSelection={() => handleSelectAll(false)}
          onDuplicateSingle={
            selectedActionIds.size === 1
              ? () => {
                  const selectedId = Array.from(selectedActionIds)[0];
                  const target = actions.find((a) => a.id === selectedId);
                  if (target) handleDuplicateAction(target);
                }
              : undefined
          }
          onBulkMarkDone={handleBulkMarkDone}
          onBulkMarkEzd={handleBulkMarkEzd}
          onBulkExportCsv={handleBulkExportCsv}
          onBulkCopySummary={handleBulkCopySummary}
          onBulkDelete={handleBulkDelete}
          mutationsDisabled={bulkMutationsDisabled}
        />

        {/* Tabela działań */}
        <ActionsTableView
          filteredActions={filteredActions}
          columns={columns}
          totalCount={actions.length}
          hasActiveFilters={activeFiltersCount > 0}
          selectedActionIds={selectedActionIds}
          onOpenEdit={onOpenEdit}
          onClearFilters={handleClearFilters}
          onOpenAdd={onOpenAdd}
          density={tableDensity}
        />

        {/* Modale pomocnicze */}
        <ActionsModalsContainer
          isMonthModalOpen={isMonthModalOpen}
          onCloseMonthModal={() => setIsMonthModalOpen(false)}
          closedMonths={closedMonths}
          onToggleMonthLock={toggleMonthLock}
          locksStatus={locksStatus}
          pendingMonth={pendingMonth}
          onRetryMonthLocks={() => { void refreshClosedMonths(); }}
          selectedIzrzAction={selectedIzrzAction}
          onCloseIzrzDialog={() => setSelectedIzrzAction(null)}
          selectedBlankietDistribution={selectedBlankietDistribution}
          onCloseBlankietDialog={() => setSelectedBlankietDistribution(null)}
        />
      </div>
    </TooltipProvider>
  );
}
