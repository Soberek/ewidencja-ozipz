import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { OzipzAction } from "../../../types/ozipz.types";
import { getActionEzdState } from "../actionEzdStatus";
import { buildHealthPromotionReportCsv } from "../../../utils/reportExport";
import { downloadBlob } from "../../../utils/downloadHelper";
import { INSTITUTION_FILE_PREFIX } from "../../../constants";

export interface UseActionSelectionParams {
  actions: OzipzAction[];
  filteredActions: OzipzAction[];
  onDeleteAction: (id: string) => Promise<void>;
  onUpdateAction: (id: string, updates: Partial<OzipzAction>) => Promise<void>;
}

export function useActionSelection({
  actions,
  filteredActions,
  onDeleteAction,
  onUpdateAction,
}: UseActionSelectionParams) {
  const [selectedIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(filteredActions.map((a) => a.id)), [filteredActions]);
  const selectedActionIds = useMemo(
    () => new Set([...selectedIds].filter((id) => visibleIds.has(id))),
    [selectedIds, visibleIds]
  );

  useEffect(() => {
    setSelectedActionIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIds]);

  const selectedMetrics = useMemo(() => {
    let recipients = 0;
    let materials = 0;
    let doEzd = 0;
    for (const a of actions) {
      if (selectedActionIds.has(a.id)) {
        recipients += Number(a.participantsCount) || 0;
        materials += Number(a.materialsDistributedCount) || 0;
        if (getActionEzdState(a) === "pending") doEzd++;
      }
    }
    return { recipients, materials, doEzd };
  }, [actions, selectedActionIds]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedActionIds(checked ? new Set(filteredActions.map((a) => a.id)) : new Set());
  }, [filteredActions]);

  const handleSelectFirstN = useCallback((count: number) => {
    const ids = new Set(filteredActions.slice(0, count).map((a) => a.id));
    setSelectedActionIds(ids);
    toast.info(`Wybrano ${ids.size} pierwszych działań z przefiltrowanej listy`);
  }, [filteredActions]);

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedActionIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedActionIds.size) return;
    try {
      for (const id of selectedActionIds) {
        await onDeleteAction(id);
        setSelectedActionIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      toast.success("Usunięto wybrane działania");
    } catch (error) {
      toast.error("Błąd podczas usuwania wybranych działań");
      throw error;
    }
  }, [selectedActionIds, onDeleteAction]);



  const handleBulkMarkEzd = useCallback(async (status: "do_ezd" | "w_ezd") => {
    if (!selectedActionIds.size) return;
    try {
      for (const id of selectedActionIds) await onUpdateAction(id, { ezdStatus: status });
      toast.success(`Zaktualizowano status EZD (${status}) dla ${selectedActionIds.size} działań`);
    } catch {
      toast.error("Błąd podczas aktualizacji statusu EZD");
    }
  }, [selectedActionIds, onUpdateAction]);

  const handleBulkExportCsv = useCallback(() => {
    const selected = actions.filter((a) => selectedActionIds.has(a.id));
    if (!selected.length) return;
    const csv = buildHealthPromotionReportCsv(selected);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${INSTITUTION_FILE_PREFIX}_wybrane-dzialania-${selected.length}.csv`);
    toast.success(`Wyeksportowano ${selected.length} wybranych działań do pliku CSV`);
  }, [actions, selectedActionIds]);

  const handleBulkCopySummary = useCallback(() => {
    const selected = actions.filter((a) => selectedActionIds.has(a.id));
    if (!selected.length) return;
    const direct = selected.reduce((s, a) => s + (Number(a.participantsCount) || 0), 0);
    const mat = selected.reduce((s, a) => s + (Number(a.materialsDistributedCount) || 0), 0);
    const summary =
      `Wybrane Działania OZiPZ (${selected.length}):\n` +
      selected
        .map((a) => `- ${a.date} | ${a.title} | ${a.facilityName || a.municipality || "-"} | ODB: ${a.participantsCount || 0} | MAT: ${a.materialsDistributedCount || 0}`)
        .join("\n") +
      `\n\nPodsumowanie: ${selected.length} działań, ${direct} odbiorców bezpośrednich, ${mat} rozdanych materiałów.`;
    navigator.clipboard.writeText(summary);
    toast.success("Skopiowano podsumowanie wybranych działań do schowka");
  }, [actions, selectedActionIds]);

  const isAllSelected = filteredActions.length > 0 && selectedActionIds.size === filteredActions.length;

  return {
    selectedActionIds,
    setSelectedActionIds,
    selectedMetrics,
    handleSelectAll,
    handleSelectFirstN,
    handleToggleSelect,
    handleBulkDelete,
    handleBulkMarkEzd,
    handleBulkExportCsv,
    handleBulkCopySummary,
    isAllSelected,
  };
}
