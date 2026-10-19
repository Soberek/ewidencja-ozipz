import { useMemo, useState } from "react";
import { Mail, SearchCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { RowActionButton } from "@/components/ui/row-action-button";
import { Select } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzAction, OzipzContact, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { defaultSchoolYear, schoolYearOptions } from "../../../utils/participationUtils";
import { computeProgramCoverage, type MissingFacility } from "../../../utils/programCoverage";
import { FacilityEmailsCopyDialog } from "../../facilities/FacilityEmailsCopyDialog";

export interface ProgramsCoverageTabProps {
  programs: OzipzProgram[];
  facilities: OzipzFacility[];
  participations: OzipzSchoolParticipation[];
  actions: OzipzAction[];
  contacts?: OzipzContact[];
  /** Rodzaj interwencji symboli JRWA ze słownika – zgłoszenia przyjmują tylko programy PROGRAMOWE. */
  jrwaKindMap: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;
  onAddParticipation: (programId: string, facilityId: string) => void;
}

interface MissingRow extends MissingFacility {
  key: string;
  programId: string;
  programName: string;
}

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const contactOf = (row: MissingRow) =>
  [row.facility.email || row.parent?.email, row.facility.phone || row.parent?.phone].filter(Boolean).join(" · ");

function CoverageBar({ done, total }: { done: number; total: number }) {
  const value = percent(done, total);
  return (
    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
      <div className={value === 100 ? "h-full bg-emerald-500" : "h-full bg-primary"} style={{ width: `${value}%` }} />
    </div>
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
}: ProgramsCoverageTabProps) {
  const years = useMemo(() => schoolYearOptions(participations.map((p) => p.schoolYear)), [participations]);
  const [year, setYear] = useState(() => defaultSchoolYear(participations));
  const [programId, setProgramId] = useState("all");
  const [municipality, setMunicipality] = useState("all");
  const [isEmailsOpen, setIsEmailsOpen] = useState(false);

  const coverage = useMemo(
    () => computeProgramCoverage(programs, facilities, participations, actions, year, jrwaKindMap),
    [programs, facilities, participations, actions, year, jrwaKindMap]
  );

  const allRows = useMemo<MissingRow[]>(
    () =>
      coverage.rows.flatMap((row) =>
        row.missing.map((m) => ({ ...m, key: `${row.programId}:${m.facility.id}`, programId: row.programId, programName: row.programName }))
      ),
    [coverage]
  );
  const municipalities = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.facility.municipality.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pl")),
    [allRows]
  );
  const rows = useMemo(
    () =>
      allRows.filter(
        (r) => (programId === "all" || r.programId === programId) && (municipality === "all" || r.facility.municipality.trim() === municipality)
      ),
    [allRows, programId, municipality]
  );
  const emailFacilities = useMemo(() => Array.from(new Map(rows.map((r) => [r.facility.id, r.facility])).values()), [rows]);

  const hasFilters = programId !== "all" || municipality !== "all";
  const clearFilters = () => {
    setProgramId("all");
    setMunicipality("all");
  };

  const columns = useMemo<ColumnDef<MissingRow>[]>(
    () => [
      {
        id: "facility",
        header: "Placówka",
        accessorFn: (row) => row.facility.name,
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[180px] max-w-[320px]">
            <p className="font-medium text-xs text-foreground line-clamp-2" title={row.facility.name}>{row.facility.name}</p>
            {row.parent && <p className="text-[10px] text-muted-foreground truncate" title={row.parent.name}>{row.parent.name}</p>}
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
      {
        id: "educationTypes",
        header: "Rodzaj kształcenia",
        accessorFn: (row) => row.matchedTypes.join(", "),
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.matchedTypes.join(", ")}</span>,
      },
      ...(programId === "all"
        ? [
            {
              id: "program",
              header: "Program",
              accessorFn: (row: MissingRow) => row.programName,
              sortable: true,
              cell: ({ row }: { row: MissingRow }) => (
                <span className="text-xs line-clamp-2 min-w-[160px] max-w-[260px]" title={row.programName}>{row.programName}</span>
              ),
            },
          ]
        : []),
      {
        id: "contact",
        header: "Kontakt",
        accessorFn: contactOf,
        cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{contactOf(row) || "–"}</span>,
      },
      {
        id: "actionsWithoutParticipation",
        header: "Działania bez zgłoszenia",
        accessorKey: "actionsWithoutParticipation",
        sortable: true,
        align: "right",
        cell: ({ row }) =>
          row.actionsWithoutParticipation > 0 ? (
            <span
              className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400"
              title="Działania tego programu w rejestrze w tej placówce w wybranym roku szkolnym, choć placówka nie ma zgłoszenia."
            >
              {row.actionsWithoutParticipation}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">–</span>
          ),
      },
      {
        id: "add",
        header: "",
        align: "right",
        cell: ({ row }) => (
          <RowActionButton
            label={`Dodaj zgłoszenie: ${row.facility.name} – ${row.programName}`}
            icon={UserPlus}
            onClick={() => onAddParticipation(row.programId, row.facility.id)}
          />
        ),
      },
    ],
    [programId, onAddParticipation]
  );

  const exportName = `bez_zgloszen_${year.replace("/", "-")}.csv`;

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
          <p className="text-[11px] text-muted-foreground">
            Placówka kwalifikuje się, gdy jej rodzaj kształcenia jest wpisany w grupie docelowej programu. Udział oznacza zgłoszenie
            w wybranym roku szkolnym; zgłoszenie zespołu obejmuje jego szkoły.
          </p>
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
                subtext={row.eligible === 0 ? "Brak placówek tego rodzaju w bazie" : `bez zgłoszenia: ${row.missing.length} · ${percent(row.participating, row.eligible)}% placówek`}
                icon={<SearchCheck className="size-4" />}
                variant={row.eligible > 0 && row.missing.length === 0 ? "emerald" : "default"}
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
            keyExtractor={(row) => row.key}
            entityLabel="placówek"
            enablePagination
            defaultPageSize={25}
            enableExport
            exportFileName={exportName}
            emptyState={
              <EmptyState
                icon={SearchCheck}
                title={hasFilters ? "Brak placówek dla wybranych filtrów" : "Wszystkie kwalifikujące się placówki mają zgłoszenia"}
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
