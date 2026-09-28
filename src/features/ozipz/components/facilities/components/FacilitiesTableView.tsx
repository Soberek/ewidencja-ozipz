import { useMemo, type MouseEvent, type ReactNode } from "react";
import { AlertTriangle, Building2, Edit, GraduationCap, Layers, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzFacility } from "../../../types/ozipz.types";
import type { FacilityIssue } from "../../../utils/facilityUtils";
import { formatFacilityAddress } from "../../../utils/facilityUtils";

export interface FacilitiesTableViewProps {
  facilities: OzipzFacility[];
  childrenMap: Map<string, OzipzFacility[]>;
  parentMap: Map<string, OzipzFacility>;
  participationCounts?: Map<string, number>;
  actionCounts?: Map<string, number>;
  issues?: Map<string, FacilityIssue[]>;
  typeLabels?: Map<string, string>;
  onEdit: (fac: OzipzFacility) => void;
  onOpenParticipation?: (fac: OzipzFacility) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

const stop = (e: MouseEvent) => e.stopPropagation();

function ContactLink({ href, icon: Icon, children, mono }: { href: string; icon: typeof Mail; children: string; mono?: boolean }) {
  return (
    <a href={href} onClick={stop} className={`flex min-w-0 items-center gap-1 text-[11px] text-blue-700 hover:underline dark:text-blue-400 ${mono ? "font-mono" : ""}`}>
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{children}</span>
    </a>
  );
}

function IconAction({ label, ariaLabel, onClick, className, children }: { label: string; ariaLabel?: string; onClick: () => void; className: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={ariaLabel || label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`h-7 w-7 p-0 ${className}`}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function FacilitiesTableView({
  facilities,
  childrenMap,
  parentMap,
  participationCounts,
  actionCounts,
  issues,
  typeLabels,
  onEdit,
  onOpenParticipation,
  onDelete,
  onOpenAdd,
  onClearFilters,
  isFiltered,
}: FacilitiesTableViewProps) {
  const columns = useMemo<ColumnDef<OzipzFacility>[]>(() => [
    {
      id: "name",
      header: "Placówka",
      accessorKey: "name",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name, "pl"),
      cell: ({ row }) => {
        const parent = row.parentFacilityId ? parentMap.get(row.parentFacilityId) : undefined;
        const rowIssues = issues?.get(row.id) || [];
        return (
          <div className="min-w-[240px] max-w-[420px] space-y-0.5">
            <div className="flex items-start gap-1.5">
              <Building2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2 break-words text-xs font-semibold leading-tight text-foreground" title={row.name}>
                {row.name}
              </span>
              {rowIssues.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-label={`Do uzupełnienia: ${rowIssues.length}`}
                      onClick={stop}
                    >
                      <AlertTriangle className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
                      {rowIssues.map((issue) => <li key={issue.code + issue.message}>{issue.message}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 pl-5">
              {row.isComplex && (
                <Badge className="border-0 bg-purple-100 px-1 py-0 text-[10px] text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  Zespół · {childrenMap.get(row.id)?.length || 0} jedn.
                </Badge>
              )}
              {parent && (
                <span className="flex min-w-0 items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400" title={`Wchodzi w skład: ${parent.name}`}>
                  <Layers className="size-2.5 shrink-0" />
                  <span className="line-clamp-1 break-words">{parent.name}</span>
                </span>
              )}
            </div>
            {row.notes && (
              <p className="truncate pl-5 text-[11px] italic text-muted-foreground" title={row.notes}>{row.notes}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "type",
      header: "Typ / kształcenie",
      accessorFn: (row) => typeLabels?.get(row.type) || row.type,
      sortable: true,
      cell: ({ row }) => (
        <div className="flex min-w-[130px] max-w-[220px] flex-col items-start gap-1">
          <Badge variant="outline" className="text-[11px] font-normal first-letter:uppercase">
            {typeLabels?.get(row.type) || row.type}
          </Badge>
          {row.educationTypes?.length ? (
            <div className="flex flex-wrap gap-1">
              {row.educationTypes.map((et) => (
                <span key={et} className="rounded border border-blue-200/70 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-300">
                  {et}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "municipality",
      header: "Adres / gmina",
      accessorFn: (row) => `${row.municipality}: ${formatFacilityAddress(row)}`,
      sortable: true,
      sortFn: (a, b) => a.municipality.localeCompare(b.municipality, "pl") || a.city.localeCompare(b.city, "pl"),
      cell: ({ row }) => (
        <div className="min-w-[160px] max-w-[240px] text-xs">
          <p className="truncate text-foreground" title={formatFacilityAddress(row)}>{row.address}</p>
          <p className="text-[11px] text-muted-foreground">{[row.postalCode, row.city].filter(Boolean).join(" ")}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MapPin className="size-3 shrink-0" />gm. {row.municipality || "—"}
          </p>
        </div>
      ),
    },
    {
      id: "contacts",
      header: "Kontakt",
      accessorFn: (row) => [row.email, row.phone, row.defaultCoordinatorName, row.defaultCoordinatorEmail].filter(Boolean).join("; "),
      cell: ({ row }) => {
        const hasCoordinator = row.defaultCoordinatorName || row.defaultCoordinatorEmail || row.defaultCoordinatorPhone;
        return (
          <div className="min-w-[160px] max-w-[230px] space-y-0.5">
            {row.email && <ContactLink href={`mailto:${row.email}`} icon={Mail}>{row.email}</ContactLink>}
            {row.phone && <ContactLink href={`tel:${row.phone.replace(/\s+/g, "")}`} icon={Phone} mono>{row.phone}</ContactLink>}
            {!row.email && !row.phone && !hasCoordinator && <span className="text-[10px] italic text-muted-foreground">Brak danych kontaktowych</span>}
            {hasCoordinator && (
              <div className="mt-1 border-t border-border/60 pt-1">
                <p className="flex items-center gap-1 text-[11px] text-foreground">
                  <User className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{row.defaultCoordinatorName || "Koordynator"}</span>
                </p>
                {row.defaultCoordinatorEmail && (
                  <ContactLink href={`mailto:${row.defaultCoordinatorEmail}`} icon={Mail}>{row.defaultCoordinatorEmail}</ContactLink>
                )}
                {row.defaultCoordinatorPhone && (
                  <ContactLink href={`tel:${row.defaultCoordinatorPhone.replace(/\s+/g, "")}`} icon={Phone} mono>{row.defaultCoordinatorPhone}</ContactLink>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "activity",
      header: "Aktywność",
      align: "center",
      accessorFn: (row) => (actionCounts?.get(row.id) || 0) + (participationCounts?.get(row.id) || 0),
      sortable: true,
      cell: ({ row }) => {
        const actions = actionCounts?.get(row.id) || 0;
        const participations = participationCounts?.get(row.id) || 0;
        return (
          <div className="flex flex-col items-center gap-0.5 text-[11px] text-muted-foreground">
            <span title="Zarejestrowane działania"><strong className="font-mono text-foreground">{actions}</strong> dział.</span>
            <span title="Zgłoszenia do programów"><strong className="font-mono text-foreground">{participations}</strong> zgł.</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {onOpenParticipation && (
            <IconAction label="Dodaj zgłoszenie do programu" ariaLabel={`Dodaj zgłoszenie do programu: ${row.name}`} onClick={() => onOpenParticipation(row)} className="text-primary">
              <GraduationCap className="size-3.5" />
            </IconAction>
          )}
          <IconAction label="Edytuj placówkę" onClick={() => onEdit(row)} className="text-muted-foreground hover:text-foreground">
            <Edit className="size-3.5" />
          </IconAction>
          <IconAction label="Usuń placówkę" onClick={() => onDelete(row.id)} className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40">
            <Trash2 className="size-3.5" />
          </IconAction>
        </div>
      ),
    },
  ], [childrenMap, parentMap, participationCounts, actionCounts, issues, typeLabels, onEdit, onOpenParticipation, onDelete]);

  if (facilities.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={isFiltered ? "Brak pasujących placówek" : "Baza placówek jest pusta"}
        description={
          isFiltered
            ? "Żadna placówka nie spełnia wybranych kryteriów."
            : "W bazie nie ma jeszcze zarejestrowanych szkół, przedszkoli ani instytucji."
        }
        actionLabel={isFiltered ? undefined : "Dodaj pierwszą placówkę"}
        onAction={isFiltered ? undefined : onOpenAdd}
        secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
        onSecondaryAction={isFiltered ? onClearFilters : undefined}
        className="my-4"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <DataTable
        data={facilities}
        columns={columns}
        keyExtractor={(item) => item.id}
        entityLabel="placówek"
        enablePagination
        defaultPageSize={25}
        pageSizeOptions={[15, 25, 50, 100]}
        enableExport
        exportFileName="baza_placowek.csv"
        rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
        onRowClick={onEdit}
        renderSubComponent={({ row }) => {
          const units = childrenMap.get(row.id) || [];
          if (units.length === 0) return null;
          return (
            <div className="ml-6 space-y-1.5 rounded-[3px] border border-dashed border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold text-purple-900 dark:text-purple-300">
                Jednostki w składzie zespołu ({units.length}):
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(unit);
                    }}
                    className="rounded-[2px] border border-border bg-background p-2 text-left text-xs hover:border-primary/50"
                  >
                    <p className="truncate font-medium text-foreground">{unit.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {(unit.educationTypes || []).join(", ") || typeLabels?.get(unit.type) || unit.type}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        }}
      />
    </TooltipProvider>
  );
}
