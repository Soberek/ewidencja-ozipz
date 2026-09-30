import { AlertTriangle, Building2, CheckCircle2, Edit, Link2Off, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzContact, OzipzSchoolParticipation, OzipzProgram } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";
import { participationCoordinators } from "../../../utils/participationUtils";

export interface SchoolParticipationsColumnsProps {
  programMap: Map<string, OzipzProgram>;
  /** Kontakty po id – koordynator powiązany ze spisem pokazuje aktualne dane z kartoteki. */
  contactsById?: Map<string, OzipzContact>;
  onEdit: (item: OzipzSchoolParticipation) => void;
  onDelete: (id: string) => void;
}

export function createSchoolParticipationsColumns({
  programMap,
  contactsById = new Map(),
  onEdit,
  onDelete,
}: SchoolParticipationsColumnsProps): ColumnDef<OzipzSchoolParticipation>[] {
  return [
    {
      id: "facilityName",
      header: "Placówka Edukacyjna",
      accessorKey: "facilityName",
      sortable: true,
      cell: ({ row }) => {
        const facilityTitle = row.facilityName || "Brak nazwy";
        return (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <div className="flex items-start gap-1.5 font-medium text-xs text-foreground">
              <Building2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-2 break-words leading-tight" title={facilityTitle}>
                {facilityTitle}
              </span>
            </div>
            {row.municipality && (
              <p
                className="text-[11px] text-muted-foreground ml-5 truncate"
                title={`Gmina: ${row.municipality}`}
              >
                Gmina: {row.municipality}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "programName",
      header: "Program",
      accessorKey: "programName",
      sortable: true,
      cell: ({ row }) => {
        const prog = programMap.get(row.programId);
        const programLabel = row.programName || prog?.name || "Program";
        return (
          <div className="min-w-[180px] max-w-[300px] space-y-0.5">
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-800 border-purple-200 text-[11px] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 line-clamp-2 break-words leading-tight text-left whitespace-normal h-auto py-0.5"
              title={programLabel}
            >
              {programLabel}
            </Badge>
            {row.schoolYear && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Rok szkolny: {row.schoolYear}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "coordinator",
      header: "Szkolny Koordynator",
      accessorKey: "schoolCoordinatorName",
      sortable: true,
      cell: ({ row }) => {
        const coordinators = participationCoordinators(row);
        if (coordinators.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              Brak koordynatora
            </span>
          );
        }
        return (
          <div className="text-xs min-w-[140px] max-w-[200px] space-y-1">
            {coordinators.map((coordinator) => {
              const contact = coordinator.contactId ? contactsById.get(coordinator.contactId) : undefined;
              const details = contact ? [contact.phone, contact.email].filter(Boolean) : [coordinator.contact].filter(Boolean);
              return (
                <div key={coordinator.contactId || coordinator.name}>
                  <span className="font-medium text-foreground">{contact?.name || coordinator.name}</span>
                  {!contact && (
                    <span
                      className="ml-1 inline-flex items-center align-middle text-muted-foreground"
                      title="Wpis spoza Spisu Kontaktów – powiąż go w edycji zgłoszenia"
                    >
                      <Link2Off className="size-3" />
                    </span>
                  )}
                  {details.map((line) => (
                    <p key={line} className="text-[10px] text-muted-foreground truncate mt-0.5" title={line}>
                      {line}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "counts",
      header: "Uczniowie",
      accessorKey: "pupilsCount",
      sortable: true,
      cell: ({ row }) => (
        <div className="text-xs font-mono font-bold text-foreground whitespace-nowrap">{row.pupilsCount ?? "-"}</div>
      ),
    },
    {
      id: "declarationStatus",
      header: "Deklaracja",
      cell: ({ row }) => <Badge variant="outline">{row.hasDeclaration ? "Złożona" : "Brak"}</Badge>,
    },
    {
      id: "reportStatus",
      header: "Sprawozdanie",
      cell: ({ row }) => (
        <div>
          {row.hasFinalReport ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Złożone
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
              Oczekuje
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Akcje",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <RowActionButton
            label="Edytuj zgłoszenie"
            icon={Edit}
            onClick={() => onEdit(row)}
          />

          <RowActionButton
            label="Usuń zgłoszenie"
            icon={Trash2}
            onClick={() => onDelete(row.id)}
            tone="destructive"
          />
        </div>
      ),
    },
  ];
}
