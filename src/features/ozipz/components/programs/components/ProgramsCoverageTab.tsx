import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Mail, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzAction, OzipzContact, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { defaultSchoolYear, schoolYearOptions } from "../../../utils/participationUtils";
import { buildLectureIndex } from "../../../utils/participationLectures";
import { computeProgramCoverage, type FacilityCoverageRow, type FacilityProgramEntry } from "../../../utils/programCoverage";
import { FacilityEmailsCopyDialog } from "../../facilities/FacilityEmailsCopyDialog";
import { FacilityCoverageDetails } from "./FacilityCoverageDetails";

export interface ProgramsCoverageTabProps {
  programs: OzipzProgram[];
  facilities: OzipzFacility[];
  participations: OzipzSchoolParticipation[];
  actions: OzipzAction[];
  contacts?: OzipzContact[];
  /** Rodzaj interwencji symboli JRWA ze słownika – zgłoszenia przyjmują tylko programy PROGRAMOWE. */
  jrwaKindMap: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;
  onAddParticipation: (programId: string, facilityId: string) => void;
  onEditParticipation: (participation: OzipzSchoolParticipation) => void;
}

type StatusFilter = "all" | "missing" | "none";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Wszystkie placówki" },
  { id: "missing", label: "Z brakującymi zgłoszeniami" },
  { id: "none", label: "Bez żadnego zgłoszenia" },
];

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const isSigned = (entry: FacilityProgramEntry) => entry.participations.length > 0;
const statusText = (entry: FacilityProgramEntry | undefined) => (!entry ? "" : isSigned(entry) ? "zgłoszona" : "brak");

function CoverageBar({ done, total }: { done: number; total: number }) {
  const value = percent(done, total);
  return (
    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
      <div className={value === 100 ? "h-full bg-emerald-500" : "h-full bg-primary"} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusCell({ entry, programName }: { entry?: FacilityProgramEntry; programName: string }) {
  if (!entry) {
    return (
      <span role="img" aria-label={`${programName}: nie dotyczy`} title="Nie dotyczy" className="text-muted-foreground/60">
        ·
      </span>
    );
  }
  if (isSigned(entry)) {
    return (
      <span role="img" aria-label={`${programName}: zgłoszona`} title="Zgłoszona" className="inline-flex">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </span>
    );
  }
  const label = `${programName}: brak zgłoszenia${entry.actions ? ` (działania w rejestrze: ${entry.actions})` : ""}`;
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex items-center gap-0.5">
      <CircleDashed className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
      {entry.actions > 0 && <span className="font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400">{entry.actions}</span>}
    </span>
  );
}

export function ProgramsCoverageTab({
  programs,
  facilities,
  participations,
  actions,
  contacts = [],
  jrwaKindMap,
  onAddParticipation,
  onEditParticipation,
}: ProgramsCoverageTabProps) {
  const years = useMemo(() => schoolYearOptions(participations.map((p) => p.schoolYear)), [participations]);
  const [year, setYear] = useState(() => defaultSchoolYear(participations));
  const [programId, setProgramId] = useState("all");
  const [municipality, setMunicipality] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [isEmailsOpen, setIsEmailsOpen] = useState(false);

  const coverage = useMemo(
    () => computeProgramCoverage(programs, facilities, participations, actions, year, jrwaKindMap),
    [programs, facilities, participations, actions, year, jrwaKindMap]
  );
  const lectureIndex = useMemo(() => buildLectureIndex(actions), [actions]);

  const municipalities = useMemo(
    () =>
      Array.from(new Set(coverage.facilities.map((r) => r.facility.municipality.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pl")
      ),
    [coverage]
  );
  const rows = useMemo(
    () =>
      coverage.facilities.filter((row) => {
        const entry = programId === "all" ? undefined : row.programs[programId];
        if (programId !== "all" && !entry) return false;
        if (municipality !== "all" && row.facility.municipality.trim() !== municipality) return false;
        if (status === "missing") return entry ? !isSigned(entry) : row.missing > 0;
        if (status === "none") return row.signed === 0 && row.otherParticipations.length === 0;
        return true;
      }),
    [coverage, programId, municipality, status]
  );
  const emailFacilities = useMemo(() => rows.map((r) => r.facility), [rows]);

  const hasFilters = programId !== "all" || municipality !== "all" || status !== "all";
  const clearFilters = () => {
    setProgramId("all");
    setMunicipality("all");
    setStatus("all");
  };

  const columns = useMemo<ColumnDef<FacilityCoverageRow>[]>(
    () => [
      {
        id: "facility",
        header: "Placówka",
        accessorFn: (row) => row.facility.name,
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[180px] max-w-[300px]">
            <p className="font-medium text-xs text-foreground line-clamp-2" title={row.facility.name}>{row.facility.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {row.parent?.name || (row.facility.educationTypes ?? []).join(", ")}
            </p>
          </div>
        ),
      },
      {
        id: "municipality",
        header: "Gmina",
        accessorFn: (row) => row.facility.municipality,
        sortable: true,
        cell: ({ row }) => <span className="text-xs">{row.facility.municipality}</span>,
      },
      ...coverage.rows.map<ColumnDef<FacilityCoverageRow>>((program) => ({
        id: `program-${program.programId}`,
        header: program.programName,
        accessorFn: (row) => statusText(row.programs[program.programId]),
        align: "center",
        maxWidth: "112px",
        headerClassName: `normal-case tracking-normal leading-tight text-[10px] ${program.programId === programId ? "bg-primary/10 text-primary" : ""}`,
        cell: ({ row }) => <StatusCell entry={row.programs[program.programId]} programName={program.programName} />,
      })),
      {
        id: "summary",
        header: "Zgłoszenia",
        accessorFn: (row) => `${row.signed}/${row.signed + row.missing}`,
        sortFn: (a, b) => b.missing - a.missing,
        align: "right",
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs font-semibold ${row.missing > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}
          >
            {row.signed}/{row.signed + row.missing}
          </span>
        ),
      },
    ],
    [coverage.rows, programId]
  );

  return (
    <div className="space-y-4">
      <FilterBar
        actions={
          <Button variant="outline" onClick={() => setIsEmailsOpen(true)} disabled={rows.length === 0} className="font-medium">
            <Mail className="size-3.5 text-muted-foreground" />
            <span>Kopiuj e-maile</span>
          </Button>
        }
        rows={
          <>
            <ChipGroup label="Pokaż">
              {STATUS_OPTIONS.map((option) => (
                <Chip key={option.id} active={status === option.id} onClick={() => setStatus(option.id)}>
                  {option.label}
                </Chip>
              ))}
            </ChipGroup>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden /> zgłoszona
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleDashed className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden /> brak zgłoszenia (liczba = działania w rejestrze)
              </span>
              <span>· nie dotyczy</span>
              <span>
                Placówka kwalifikuje się, gdy jej rodzaj kształcenia jest w grupie docelowej programu; zgłoszenie zespołu obejmuje jego szkoły.
                Kliknij placówkę, aby zobaczyć szczegóły.
              </span>
            </p>
          </>
        }
      >
        <div className="w-48">
          <Select
            value={year}
            onChange={(value) => value && setYear(value)}
            options={years.map((y) => ({ value: y, label: `Rok szkolny ${y}` }))}
            placeholder="Rok szkolny"
          />
        </div>
        <div className="w-64">
          <Select
            value={programId}
            onChange={(value) => setProgramId(value || "all")}
            options={[{ value: "all", label: "Wszystkie programy" }, ...coverage.rows.map((r) => ({ value: r.programId, label: r.programName }))]}
            searchable={coverage.rows.length > 5}
            placeholder="Wszystkie programy"
          />
        </div>
        <div className="w-44">
          <Select
            value={municipality}
            onChange={(value) => setMunicipality(value || "all")}
            options={[{ value: "all", label: "Wszystkie gminy" }, ...municipalities.map((m) => ({ value: m, label: m }))]}
            searchable={municipalities.length > 5}
            placeholder="Wszystkie gminy"
          />
        </div>
        {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
      </FilterBar>

      {coverage.rows.length === 0 ? (
        <EmptyState
          icon={SearchCheck}
          title="Brak programów z określonymi placówkami"
          description="Wpisz w grupie docelowej programu rodzaje kształcenia po przecinku, np. „Szkoła podstawowa, Szkoła podstawowa specjalna” albo „Przedszkole, Żłobek, Oddział przedszkolny”."
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          {/* Liczba kolumn dzieląca karty na równe wiersze (np. 6 → 3 + 3), żeby ostatni wiersz nie był pojedynczy. */}
          <StatsGrid columns={coverage.rows.length % 3 === 0 ? 3 : coverage.rows.length % 4 === 0 ? 4 : 5}>
            {coverage.rows.map((row) => (
              <MetricCard
                key={row.programId}
                title={row.programName}
                hint={`${row.programName} – kwalifikują się: ${row.targetTypes.join(", ")}`}
                value={`${row.participating}/${row.eligible}`}
                subtext={row.eligible === 0 ? "Brak placówek tego rodzaju w bazie" : `bez zgłoszenia: ${row.missing} · ${percent(row.participating, row.eligible)}% placówek`}
                icon={<SearchCheck className="size-4" />}
                variant={row.eligible > 0 && row.missing === 0 ? "emerald" : "default"}
                compact
                active={programId === row.programId}
                onClick={() => setProgramId(programId === row.programId ? "all" : row.programId)}
                footer={<CoverageBar done={row.participating} total={row.eligible} />}
              />
            ))}
          </StatsGrid>

          <DataTable
            data={rows}
            columns={columns}
            keyExtractor={(row) => row.facility.id}
            entityLabel="placówek"
            expandOnRowClick
            renderSubComponent={({ row }) => (
              <FacilityCoverageDetails
                row={row}
                programs={coverage.rows}
                schoolYear={year}
                lectureIndex={lectureIndex}
                onAddParticipation={onAddParticipation}
                onEditParticipation={onEditParticipation}
              />
            )}
            enablePagination
            defaultPageSize={50}
            pageSizeOptions={[25, 50, 100]}
            enableExport
            exportFileName={`przeglad_placowek_${year.replace("/", "-")}.csv`}
            emptyState={
              <EmptyState
                icon={SearchCheck}
                title="Brak placówek dla wybranych filtrów"
                description={`Rok szkolny ${year}.`}
                secondaryActionLabel={hasFilters ? "Wyczyść filtry" : undefined}
                onSecondaryAction={hasFilters ? clearFilters : undefined}
                className="py-8 border-0"
              />
            }
          />
        </TooltipProvider>
      )}

      {coverage.withoutEducationTypes.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Poza zestawieniem – grupa docelowa bez rodzaju kształcenia:{" "}
          <span className="text-foreground">{coverage.withoutEducationTypes.map((p) => p.name).join(", ")}</span>. Aby je objąć, wpisz
          w programie rodzaje kształcenia po przecinku, np. „Liceum, Technikum, Szkoła branżowa”.
        </p>
      )}

      <FacilityEmailsCopyDialog open={isEmailsOpen} onOpenChange={setIsEmailsOpen} facilities={emailFacilities} contacts={contacts} />
    </div>
  );
}
