import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OzipzAction, OzipzFacility, OzipzSchoolParticipation } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { countBy } from "../../utils/facilityUtils";
import { useFacilitiesView } from "./hooks/useFacilitiesView";
import { FacilityEmailsCopyDialog } from "./FacilityEmailsCopyDialog";
import { FacilityImportDialog } from "./FacilityImportDialog";
import { FacilitiesStatsHeader } from "./components/FacilitiesStatsHeader";
import { FacilitiesFilterBar } from "./components/FacilitiesFilterBar";
import { FacilitiesTableView } from "./components/FacilitiesTableView";

export interface FacilitiesSectionProps {
  facilities?: OzipzFacility[];
  participations?: OzipzSchoolParticipation[];
  actions?: OzipzAction[];
  onOpenAdd?: () => void;
  onOpenEdit?: (fac: OzipzFacility) => void;
  onOpenParticipation?: (fac: OzipzFacility) => void;
  /** Zastępuje domyślne usuwanie ze store (potwierdzenie i tak jest wyświetlane). */
  onDelete?: (id: string) => void | Promise<void>;
}

export function FacilitiesSection(props: FacilitiesSectionProps) {
  const storedFacilities = useOzipzDbStore((s) => s.facilities);
  const storedParticipations = useOzipzDbStore((s) => s.participations);
  const storedActions = useOzipzDbStore((s) => s.actions);
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const deleteFacility = useOzipzDbStore((s) => s.deleteFacility);
  const openModal = useModalStore((s) => s.openModal);

  const facilities = props.facilities ?? storedFacilities;
  const participations = props.participations ?? storedParticipations;
  const actions = props.actions ?? storedActions;

  const locationTypes = useMemo(() => dictionaryItems.filter((d) => d.dictType === "locationType"), [dictionaryItems]);
  const municipalityItems = useMemo(
    () => dictionaryItems.filter((d) => d.dictType === "municipality" || d.dictType === "gmina"),
    [dictionaryItems]
  );
  const view = useFacilitiesView(facilities, locationTypes, municipalityItems);

  const participationCounts = useMemo(() => countBy(participations, (p) => p.facilityId), [participations]);
  const actionCounts = useMemo(() => countBy(actions, (a) => a.facilityId), [actions]);

  const [isEmailsCopyOpen, setIsEmailsCopyOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<OzipzFacility | null>(null);

  const onOpenAdd = props.onOpenAdd ?? (() => openModal("facility"));
  const onOpenEdit = useCallback(
    (fac: OzipzFacility) => (props.onOpenEdit ? props.onOpenEdit(fac) : openModal("facility", { item: fac })),
    [props, openModal]
  );
  const onOpenParticipation =
    props.onOpenParticipation ?? ((fac: OzipzFacility) => openModal("participation", { facilityId: fac.id }));
  const requestDelete = useCallback((id: string) => setPendingDelete(view.byId.get(id) ?? null), [view.byId]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (props.onDelete) {
      await props.onDelete(pendingDelete.id);
      return;
    }
    // Błąd (np. placówka ze zgłoszeniami) zostaje w oknie potwierdzenia.
    await deleteFacility(pendingDelete.id);
    toast.success("Usunięto placówkę");
  };

  const deleteDescription = pendingDelete && (
    <div className="space-y-1.5 text-sm">
      <p>Placówka <strong>{pendingDelete.name}</strong> zostanie trwale usunięta.</p>
      {(participationCounts.get(pendingDelete.id) || 0) > 0 && (
        <p className="text-destructive">
          Ma {participationCounts.get(pendingDelete.id)} zgłoszeń do programów — usuń je najpierw w module Programy.
        </p>
      )}
      {(actionCounts.get(pendingDelete.id) || 0) > 0 && (
        <p>Powiązane działania ({actionCounts.get(pendingDelete.id)}) zachowają nazwę placówki, ale stracą powiązanie.</p>
      )}
      {(view.childrenMap.get(pendingDelete.id)?.length || 0) > 0 && (
        <p>Jednostki zespołu ({view.childrenMap.get(pendingDelete.id)?.length}) staną się placówkami samodzielnymi.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {view.showKpi && (
        <FacilitiesStatsHeader
          totalFacilities={view.stats.total}
          educationCount={view.stats.education}
          complexCount={view.stats.complexes}
          municipalitiesCount={view.stats.municipalities}
          issuesCount={view.stats.withIssues}
        />
      )}

      <FacilitiesFilterBar
        filters={view.filters}
        onFiltersChange={view.updateFilters}
        onClearFilters={view.clearFilters}
        activeFiltersCount={view.activeFiltersCount}
        resultsCount={view.filtered.length}
        typeOptions={view.typeOptions}
        municipalityOptions={view.municipalityOptions}
        educationTypeCounts={view.educationTypeCounts}
        issuesCount={view.stats.withIssues}
        onOpenEmailsCopy={() => setIsEmailsCopyOpen(true)}
        onOpenAdd={onOpenAdd}
        onOpenImport={() => setIsImportOpen(true)}
        onToggleKpi={view.toggleKpi}
        isKpiVisible={view.showKpi}
      />

      <FacilitiesTableView
        facilities={view.filtered}
        childrenMap={view.childrenMap}
        parentMap={view.byId}
        participationCounts={participationCounts}
        actionCounts={actionCounts}
        issues={view.issues}
        typeLabels={view.typeLabels}
        onEdit={onOpenEdit}
        onOpenParticipation={onOpenParticipation}
        onDelete={requestDelete}
        onOpenAdd={onOpenAdd}
        onClearFilters={view.clearFilters}
        isFiltered={view.activeFiltersCount > 0}
      />

      <FacilityEmailsCopyDialog open={isEmailsCopyOpen} onOpenChange={setIsEmailsCopyOpen} facilities={view.filtered} />
      <FacilityImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Usunąć placówkę?"
        description={deleteDescription}
        confirmText="Usuń placówkę"
        variant="destructive"
      />
    </div>
  );
}

export default FacilitiesSection;
