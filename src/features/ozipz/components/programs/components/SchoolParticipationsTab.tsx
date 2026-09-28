import { useState, useMemo } from "react";
import { School } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzContact, OzipzSchoolParticipation, OzipzProgram } from "../../../types/ozipz.types";
import {
  SchoolParticipationsFilterBar,
  type ParticipationReportStatusFilter,
} from "./SchoolParticipationsFilterBar";
import { createSchoolParticipationsColumns } from "./SchoolParticipationsColumns";
import { normalizeText } from "../../contacts/contactUtils";

export interface SchoolParticipationsTabProps {
  participations: OzipzSchoolParticipation[];
  programs: OzipzProgram[];
  contacts?: OzipzContact[];
  onOpenAdd: () => void;
  onEdit: (item: OzipzSchoolParticipation) => void;
  onDelete: (id: string) => void;
}

export function SchoolParticipationsTab({
  participations,
  programs,
  contacts = [],
  onOpenAdd,
  onEdit,
  onDelete,
}: SchoolParticipationsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ParticipationReportStatusFilter>("all");

  const programMap = useMemo(() => {
    const map = new Map<string, OzipzProgram>();
    programs.forEach((p) => map.set(p.id, p));
    return map;
  }, [programs]);

  // Dostępne lata szkolne
  const availableSchoolYears = useMemo(() => {
    const set = new Set<string>();
    participations.forEach((p) => {
      if (p.schoolYear?.trim()) set.add(p.schoolYear.trim());
    });
    return Array.from(set).sort().reverse();
  }, [participations]);

  // Dostępne gminy (wyliczone dynamicznie z danych)
  const uniqueMunicipalities = useMemo(() => {
    const set = new Set<string>();
    participations.forEach((p) => {
      if (p.municipality?.trim()) set.add(p.municipality.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [participations]);

  // Licznik aktywnych filtrów
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedProgramId !== "all") count++;
    if (selectedYear !== "all") count++;
    if (selectedMunicipality !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [search, selectedProgramId, selectedYear, selectedMunicipality, statusFilter]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearFilters = () => {
    setSearch("");
    setSelectedProgramId("all");
    setSelectedYear("all");
    setSelectedMunicipality("all");
    setStatusFilter("all");
  };

  // Filtrowane zgłoszenia
  const filteredParticipations = useMemo(() => {
    return participations
      .filter((p) => {
        if (selectedProgramId !== "all" && p.programId !== selectedProgramId) return false;
        if (selectedYear !== "all" && p.schoolYear !== selectedYear) return false;
        if (selectedMunicipality !== "all" && p.municipality !== selectedMunicipality) return false;

        if (statusFilter === "missing-declaration" && p.hasDeclaration) return false;
        if (statusFilter === "submitted" && !p.hasFinalReport) return false;
        if (statusFilter === "pending" && p.hasFinalReport) return false;

        if (search.trim()) {
          const haystack = normalizeText(
            [p.facilityName, p.municipality, p.programName, p.schoolCoordinatorName, p.schoolCoordinatorContact, p.notes].join(" | ")
          );
          if (!normalizeText(search).split(" ").every((token) => haystack.includes(token))) return false;
        }

        return true;
      })
      .sort((a, b) => (a.facilityName || "").localeCompare(b.facilityName || "", "pl"));
  }, [participations, selectedProgramId, selectedYear, selectedMunicipality, statusFilter, search]);

  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const columns = useMemo(
    () => createSchoolParticipationsColumns({ programMap, contactsById, onEdit, onDelete }),
    [programMap, contactsById, onEdit, onDelete]
  );

  const totals = useMemo(
    () => ({
      facilities: new Set(filteredParticipations.map((p) => p.facilityId || p.facilityName)).size,
      pupils: filteredParticipations.reduce((sum, p) => sum + (Number(p.pupilsCount) || 0), 0),
      withoutCoordinator: filteredParticipations.filter((p) => !p.schoolCoordinatorName?.trim()).length,
    }),
    [filteredParticipations]
  );

  return (
    <div className="space-y-3">
      {/* Pasek filtrów */}
      <SchoolParticipationsFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        selectedProgramId={selectedProgramId}
        onProgramChange={setSelectedProgramId}
        selectedSchoolYear={selectedYear}
        onSchoolYearChange={setSelectedYear}
        selectedMunicipality={selectedMunicipality}
        onMunicipalityChange={setSelectedMunicipality}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        programs={programs}
        schoolYears={availableSchoolYears}
        municipalities={uniqueMunicipalities}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {filteredParticipations.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Zgłoszenia: <strong className="text-foreground">{filteredParticipations.length}</strong> · placówki:{" "}
          <strong className="text-foreground">{totals.facilities}</strong> · uczniowie ogółem:{" "}
          <strong className="text-foreground">{totals.pupils.toLocaleString("pl-PL")}</strong>
          {totals.withoutCoordinator > 0 && (
            <span className="text-amber-700 dark:text-amber-400"> · bez koordynatora: {totals.withoutCoordinator}</span>
          )}
        </p>
      )}

      {/* Tabela zgłoszeń */}
      {participations.length === 0 ? (
        <EmptyState
          icon={School}
          title={hasActiveFilters ? "Brak pasujących zgłoszeń szkół" : "Brak zgłoszeń placówek"}
          description={
            hasActiveFilters
              ? "Żadne zgłoszenie nie odpowiada wprowadzonym kryteriom wyszukiwania lub filtrom."
              : "Nie wprowadzono jeszcze deklaracji uczestnictwa szkół i przedszkoli w programach profilaktycznych."
          }
          actionLabel={hasActiveFilters ? undefined : "Dodaj pierwsze zgłoszenie"}
          onAction={hasActiveFilters ? undefined : onOpenAdd}
          secondaryActionLabel={hasActiveFilters ? "Wyczyść filtry" : undefined}
          onSecondaryAction={hasActiveFilters ? handleClearFilters : undefined}
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          <DataTable
            data={filteredParticipations}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(row) => onEdit(row)}
            rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
            enablePagination
            defaultPageSize={25}
            pageSizeOptions={[15, 25, 50, 100]}
            enableExport={true}
            exportFileName="zgloszenia_szkol_programy.csv"
            emptyState={
              <EmptyState
                icon={School}
                title="Brak pasujących zgłoszeń szkół"
                description="Żadne zgłoszenie nie odpowiada wprowadzonym kryteriom wyszukiwania lub filtrom."
                secondaryActionLabel="Wyczyść filtry"
                onSecondaryAction={handleClearFilters}
                className="py-8 border-0"
              />
            }
          />
        </TooltipProvider>
      )}
    </div>
  );
}
