import { useMemo, useState } from "react";
import { Activity, BarChart3, Building2, FileCheck2, MapPin, Paperclip, Users } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzAction, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { currentSchoolYear, schoolYearOptions } from "../../../utils/participationUtils";
import {
  computeProgramStatistics,
  type MunicipalityStatisticsRow,
  type ProgramStatisticsRow,
  type StatisticsYear,
} from "../../../utils/programStatistics";

export interface ProgramsStatisticsTabProps {
  participations: OzipzSchoolParticipation[];
  programs: OzipzProgram[];
  actions: OzipzAction[];
  facilities: OzipzFacility[];
}

const number = (value: number) => value.toLocaleString("pl-PL");
const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

function ProgressCell({ done, total }: { done: number; total: number }) {
  if (total === 0) return <span className="text-muted-foreground text-xs">–</span>;
  const value = percent(done, total);
  return (
    <div className="min-w-[96px] space-y-1">
      <div className="text-xs font-mono">
        <strong className="text-foreground">{done}</strong>
        <span className="text-muted-foreground">/{total}</span>
        <span className="ml-1 text-[10px] text-muted-foreground">({value}%)</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={value === 100 ? "h-full bg-emerald-500" : "h-full bg-primary"} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const programColumns: ColumnDef<ProgramStatisticsRow>[] = [
  {
    id: "programName",
    header: "Program",
    accessorKey: "programName",
    sortable: true,
    cell: ({ row }) => <span className="font-medium text-xs text-foreground line-clamp-2 min-w-[180px] max-w-[320px]" title={row.programName}>{row.programName}</span>,
  },
  { id: "schools", header: "Szkoły / placówki", accessorKey: "schools", sortable: true, align: "right", cell: ({ row }) => <strong className="font-mono text-sm">{row.schools}</strong> },
  { id: "participations", header: "Zgłoszenia", accessorKey: "participations", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs">{row.participations}</span> },
  { id: "pupils", header: "Uczniowie", accessorKey: "pupils", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs font-bold">{number(row.pupils)}</span> },
  { id: "municipalities", header: "Gminy", accessorKey: "municipalities", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs">{row.municipalities}</span> },
  {
    id: "declarations",
    header: "Deklaracje",
    accessorFn: (row) => `${row.declarations}/${row.participations}`,
    sortFn: (a, b) => percent(a.declarations, a.participations) - percent(b.declarations, b.participations),
    sortable: true,
    cell: ({ row }) => <ProgressCell done={row.declarations} total={row.participations} />,
  },
  {
    id: "finalReports",
    header: "Sprawozdania",
    accessorFn: (row) => `${row.finalReports}/${row.participations}`,
    sortFn: (a, b) => percent(a.finalReports, a.participations) - percent(b.finalReports, b.participations),
    sortable: true,
    cell: ({ row }) => <ProgressCell done={row.finalReports} total={row.participations} />,
  },
  {
    id: "files",
    header: "Pliki zgłoszeń",
    accessorFn: (row) => `${row.files}/${row.participations}`,
    align: "right",
    cell: ({ row }) =>
      row.participations > 0 ? (
        <span className="font-mono text-xs">{row.files}/{row.participations}</span>
      ) : (
        <span className="text-muted-foreground text-xs">–</span>
      ),
  },
  {
    id: "withoutCoordinator",
    header: "Bez koordynatora",
    accessorKey: "withoutCoordinator",
    sortable: true,
    align: "right",
    cell: ({ row }) =>
      row.withoutCoordinator > 0 ? (
        <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">{row.withoutCoordinator}</span>
      ) : (
        <span className="text-muted-foreground text-xs">–</span>
      ),
  },
  {
    id: "actions",
    header: "Działania / odbiorcy",
    accessorFn: (row) => `${row.actions} / ${row.actionRecipients}`,
    sortFn: (a, b) => a.actions - b.actions,
    sortable: true,
    align: "right",
    cell: ({ row }) => (
      <span className="font-mono text-xs whitespace-nowrap">
        {row.actions} <span className="text-muted-foreground">/ {number(row.actionRecipients)}</span>
      </span>
    ),
  },
];

const municipalityColumns: ColumnDef<MunicipalityStatisticsRow>[] = [
  { id: "municipality", header: "Gmina", accessorKey: "municipality", sortable: true, cell: ({ row }) => <span className="font-medium text-xs">{row.municipality}</span> },
  { id: "schools", header: "Szkoły / placówki", accessorKey: "schools", sortable: true, align: "right", cell: ({ row }) => <strong className="font-mono text-sm">{row.schools}</strong> },
  { id: "programs", header: "Programy", accessorKey: "programs", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs">{row.programs}</span> },
  { id: "participations", header: "Zgłoszenia", accessorKey: "participations", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs">{row.participations}</span> },
  { id: "pupils", header: "Uczniowie", accessorKey: "pupils", sortable: true, align: "right", cell: ({ row }) => <span className="font-mono text-xs font-bold">{number(row.pupils)}</span> },
];

function SchoolList({ row }: { row: ProgramStatisticsRow }) {
  if (row.schoolList.length === 0) {
    return <p className="text-xs text-muted-foreground">Brak zgłoszeń szkół – program ma tylko działania w ewidencji.</p>;
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
          <th className="py-1 pr-3 font-semibold">Placówka</th>
          <th className="py-1 pr-3 font-semibold">Gmina</th>
          <th className="py-1 pr-3 font-semibold">Typ</th>
          <th className="py-1 pr-3 font-semibold text-right">Uczniowie</th>
          <th className="py-1 pr-3 font-semibold">Deklaracja</th>
          <th className="py-1 pr-3 font-semibold">Sprawozdanie</th>
          <th className="py-1 font-semibold">Plik</th>
        </tr>
      </thead>
      <tbody>
        {row.schoolList.map((school) => (
          <tr key={school.key} className="border-t border-border/50">
            <td className="py-1 pr-3 font-medium text-foreground">{school.facilityName}</td>
            <td className="py-1 pr-3 text-muted-foreground">{school.municipality}</td>
            <td className="py-1 pr-3 text-muted-foreground">{school.facilityType || "–"}</td>
            <td className="py-1 pr-3 text-right font-mono">{number(school.pupils)}</td>
            <td className="py-1 pr-3">{school.hasDeclaration ? "złożona" : <span className="text-amber-700 dark:text-amber-400">brak</span>}</td>
            <td className="py-1 pr-3">{school.hasFinalReport ? <span className="text-emerald-700 dark:text-emerald-400">złożone</span> : "oczekuje"}</td>
            <td className="py-1">{school.hasFile ? <Paperclip className="size-3 text-primary" aria-label="Jest plik zgłoszenia" /> : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Domyślnie bieżący rok szkolny, a gdy nie ma w nim zgłoszeń – najnowszy rok ze zgłoszeniami. */
function defaultYear(participations: OzipzSchoolParticipation[]): StatisticsYear {
  const used = participations.map((p) => p.schoolYear.trim()).filter(Boolean).sort().reverse();
  const current = currentSchoolYear();
  if (used.length === 0 || used.includes(current)) return current;
  return used[0];
}

export function ProgramsStatisticsTab({ participations, programs, actions, facilities }: ProgramsStatisticsTabProps) {
  const years = useMemo(() => schoolYearOptions(participations.map((p) => p.schoolYear)), [participations]);
  const [year, setYear] = useState<StatisticsYear>(() => defaultYear(participations));

  const stats = useMemo(
    () => computeProgramStatistics(participations, programs, actions, facilities, year),
    [participations, programs, actions, facilities, year]
  );
  const { summary } = stats;
  const yearLabel = year === "all" ? "wszystkie lata" : year;
  const fileName = year === "all" ? "wszystkie_lata" : year.replace("/", "-");

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="w-48">
          <Select
            value={year}
            onChange={(value) => setYear(value || "all")}
            options={[...years.map((y) => ({ value: y, label: `Rok szkolny ${y}` })), { value: "all", label: "Wszystkie lata szkolne" }]}
            placeholder="Rok szkolny"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Działania liczone z ewidencji w okresie roku szkolnego (1 IX – 31 VIII).
        </p>
      </FilterBar>

      <StatsGrid>
        <MetricCard
          title="Szkoły i placówki"
          value={summary.schools}
          subtext={`${summary.programs} programów · ${summary.municipalities} gmin`}
          icon={<Building2 className="size-4" />}
          variant="blue"
        />
        <MetricCard
          title="Uczniowie ogółem"
          value={number(summary.pupils)}
          subtext={`${summary.participations} zgłoszeń`}
          icon={<Users className="size-4" />}
          variant="purple"
        />
        <MetricCard
          title="Sprawozdania"
          value={`${percent(summary.finalReports, summary.participations)}%`}
          subtext={`${summary.finalReports} z ${summary.participations} złożonych${summary.withoutCoordinator ? ` · bez koordynatora: ${summary.withoutCoordinator}` : ""}`}
          icon={<FileCheck2 className="size-4" />}
          variant="emerald"
        />
        <MetricCard
          title="Działania programowe"
          value={summary.actions}
          subtext={`${number(summary.actionRecipients)} odbiorców · pliki zgłoszeń: ${summary.files}`}
          icon={<Activity className="size-4" />}
          variant="amber"
        />
      </StatsGrid>

      {stats.rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Brak danych do statystyk"
          description={`Nie ma zgłoszeń szkół ani działań programowych (${yearLabel}).`}
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <BarChart3 className="size-4 text-primary" />
              Programy – {yearLabel}
            </h3>
            <DataTable
              data={stats.rows}
              columns={programColumns}
              keyExtractor={(row) => row.programId}
              renderSubComponent={({ row }) => <SchoolList row={row} />}
              enableExport
              exportFileName={`statystyki_programow_${fileName}.csv`}
            />
          </section>

          {stats.municipalities.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <MapPin className="size-4 text-primary" />
                Gminy – {yearLabel}
              </h3>
              <DataTable
                data={stats.municipalities}
                columns={municipalityColumns}
                keyExtractor={(row) => row.municipality}
                enableExport
                exportFileName={`statystyki_gmin_${fileName}.csv`}
              />
            </section>
          )}
        </TooltipProvider>
      )}
    </div>
  );
}
