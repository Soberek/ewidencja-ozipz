import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { OzipzProgram, OzipzSchoolParticipation } from "../../types/ozipz.types";
import { useActions, useContacts, useFacilities, usePrograms } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { participationCoordinators } from "../../utils/participationUtils";
import { ProgramsStatsHeader } from "./components/ProgramsStatsHeader";
import { ProgramsViewSwitcher, type ProgramsView } from "./components/ProgramsViewSwitcher";
import { SchoolParticipationsTab } from "./components/SchoolParticipationsTab";
import { ProgramsCatalogTab } from "./components/ProgramsCatalogTab";
import { ProgramsStatisticsTab } from "./components/ProgramsStatisticsTab";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface ProgramsSectionProps {
  programs?: OzipzProgram[];
  participations?: OzipzSchoolParticipation[];
  defaultView?: "programs" | "schools";
  onOpenAddProgram?: () => void;
  onOpenEditProgram?: (prog: OzipzProgram) => void;
  onOpenAddParticipation?: (programId?: string) => void;
  onOpenEditParticipation?: (part: OzipzSchoolParticipation) => void;
  onDeleteParticipation?: (id: string) => void;
  onUpdateParticipation?: (id: string, data: Partial<OzipzSchoolParticipation>) => Promise<void> | void;
}

export function ProgramsSection(props: ProgramsSectionProps) {
  const programsStore = usePrograms();
  const { contacts } = useContacts();
  const { actions } = useActions();
  const { facilities } = useFacilities();
  const [pendingDelete, setPendingDelete] = useState<OzipzSchoolParticipation | null>(null);
  const openModal = useModalStore((s) => s.openModal);

  const programs = props.programs ?? programsStore.programs;
  const participations = props.participations ?? programsStore.participations;

  const onOpenAddProgram = props.onOpenAddProgram ?? (() => openModal("program"));
  const onOpenEditProgram =
    props.onOpenEditProgram ?? ((prog: OzipzProgram) => openModal("program", { item: prog }));
  const onOpenAddParticipation =
    props.onOpenAddParticipation ??
    ((programId?: string) => openModal("participation", { programId }));
  const onOpenEditParticipation =
    props.onOpenEditParticipation ??
    ((part: OzipzSchoolParticipation) => openModal("participation", { item: part }));

  const onDeleteParticipation =
    props.onDeleteParticipation ??
    (async (id: string) => {
      try {
        await programsStore.deleteParticipation(id);
        toast.success("Usunięto zgłoszenie szkoły");
      } catch {
        toast.error("Błąd podczas usuwania zgłoszenia");
      }
    });

  const handleDeleteProgram = async (id: string) => {
    try {
      await programsStore.deleteProgram(id);
      toast.success("Usunięto program profilaktyczny");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Błąd podczas usuwania programu");
    }
  };

  const [activeTab, setActiveTab] = useState<ProgramsView>(
    props.defaultView === "schools" ? "schools" : "programs"
  );

  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("programs");

  // Statystyki
  const stats = useMemo(() => {
    const uniqueSchools = new Set(
      participations.map((p) => p.facilityId?.trim() || p.facilityName?.trim()).filter(Boolean)
    ).size;
    const coordinators = new Set(participations.flatMap((p) => participationCoordinators(p).map((c) => c.name))).size;

    return {
      programsCount: programs.length,
      participationsCount: participations.length,
      uniqueSchoolsCount: uniqueSchools,
      reportedCoordinatorsCount: coordinators,
    };
  }, [programs, participations]);

  return (
    <div className="space-y-4">
      {/* KPI Stats Header */}
      {showKpiSummary && activeTab !== "stats" && (
        <ProgramsStatsHeader
          programsCount={stats.programsCount}
          participationsCount={stats.participationsCount}
          uniqueSchoolsCount={stats.uniqueSchoolsCount}
          reportedCoordinatorsCount={stats.reportedCoordinatorsCount}
        />
      )}

      {/* Switcher & Add Actions */}
      <ProgramsViewSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        participationsCount={stats.participationsCount}
        programsCount={stats.programsCount}
        onOpenAddParticipation={() => onOpenAddParticipation()}
        onOpenAddProgram={onOpenAddProgram}
        isKpiVisible={showKpiSummary}
        onToggleKpi={toggleKpiSummary}
      />

      {/* Aktywna zakładka */}
      {activeTab === "stats" ? (
        <ProgramsStatisticsTab participations={participations} programs={programs} actions={actions} facilities={facilities} />
      ) : activeTab === "schools" ? (
        <SchoolParticipationsTab
          participations={participations}
          programs={programs}
          contacts={contacts}
          onOpenAdd={() => onOpenAddParticipation()}
          onEdit={onOpenEditParticipation}
          onDelete={(id) => setPendingDelete(participations.find((p) => p.id === id) || null)}
        />
      ) : (
        <ProgramsCatalogTab
          programs={programs}
          onOpenAdd={onOpenAddProgram}
          onEdit={onOpenEditProgram}
          onDelete={handleDeleteProgram}
          onOpenAddParticipation={onOpenAddParticipation}
        />
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await onDeleteParticipation(pendingDelete.id);
          setPendingDelete(null);
        }}
        title="Usunąć zgłoszenie placówki?"
        description={
          pendingDelete
            ? `${pendingDelete.facilityName} – ${pendingDelete.programName} (${pendingDelete.schoolYear}). Usunięte zostaną dane koordynatora, liczba uczniów i statusy dokumentów tego zgłoszenia.`
            : undefined
        }
        confirmText="Usuń zgłoszenie"
        variant="destructive"
      />
    </div>
  );
}

export default ProgramsSection;
