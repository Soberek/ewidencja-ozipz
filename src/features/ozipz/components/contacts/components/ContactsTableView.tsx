import { useMemo, useState } from "react";
import { Users, Edit, Trash2, Building2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { OzipzContact } from "../../../types/ozipz.types";
import { digitsOnly, getContactIssues } from "../contactUtils";
import {
  ContactEmail,
  ContactIssuesIndicator,
  ContactPhone,
  ContactProgramsBadge,
  ContactRoleBadge,
} from "./ContactCells";
import { RowActionButton } from "@/components/ui/row-action-button";

export interface ContactsTableViewProps {
  contacts: OzipzContact[];
  programsIndex?: Map<string, string[]>;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onEdit: (contact: OzipzContact) => void;
  onDelete: (id: string) => void | Promise<void>;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function ContactsTableView({
  contacts,
  programsIndex,
  copiedId,
  onCopy,
  onEdit,
  onDelete,
  onOpenAdd,
  onClearFilters,
  isFiltered,
}: ContactsTableViewProps) {
  const [deletingContact, setDeletingContact] = useState<OzipzContact | null>(null);

  const columns = useMemo<ColumnDef<OzipzContact>[]>(() => {
    const requestDelete = (contact: OzipzContact) =>
      executeConfirmedAction(
        `Czy na pewno chcesz usunąć kontakt «${contact.name}»?`,
        () => void onDelete(contact.id),
        () => setDeletingContact(contact)
      );

    return [
      {
        id: "name",
        header: "Imię i Nazwisko",
        accessorKey: "name",
        sortable: true,
        sortFn: (a, b) => (a.name || "").localeCompare(b.name || "", "pl"),
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <div className="flex items-start gap-1.5">
              <span
                className="font-semibold text-xs text-foreground line-clamp-2 break-words leading-tight block"
                title={row.name}
              >
                {row.name}
              </span>
              <ContactIssuesIndicator issues={getContactIssues(row)} />
            </div>
            {row.notes && (
              <p
                className="text-[11px] text-muted-foreground truncate mt-0.5"
                title={row.notes}
              >
                {row.notes}
              </p>
            )}
            <ContactProgramsBadge programs={programsIndex?.get(row.id)} />
          </div>
        ),
      },
      {
        id: "position",
        header: "Stanowisko / Rola",
        accessorKey: "position",
        sortable: true,
        sortFn: (a, b) => (a.position || "").localeCompare(b.position || "", "pl"),
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <ContactRoleBadge position={row.position} />
          </div>
        ),
      },
      {
        id: "facilityName",
        header: "Placówka / Instytucja",
        accessorKey: "facilityName",
        sortable: true,
        sortFn: (a, b) => (a.facilityName || "").localeCompare(b.facilityName || "", "pl"),
        cell: ({ row }) => {
          const facilityTitle = row.facilityName || "Placówka nieokreślona";
          return (
            <div className="min-w-[200px] max-w-[340px] text-xs space-y-0.5">
              <div className="flex items-start gap-1.5 font-medium text-foreground">
                <Building2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span
                  className="line-clamp-2 break-words leading-tight"
                  title={facilityTitle}
                >
                  {facilityTitle}
                </span>
              </div>
              {row.municipality && (
                <p
                  className="text-[11px] text-muted-foreground truncate ml-5"
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
        id: "email",
        header: "Adres E-mail",
        accessorKey: "email",
        sortable: true,
        cell: ({ row }) => (
          <ContactEmail id={row.id} value={row.email} copiedId={copiedId} onCopy={onCopy} />
        ),
      },
      {
        id: "phone",
        header: "Telefon",
        accessorKey: "phone",
        sortable: true,
        sortFn: (a, b) => digitsOnly(a.phone).localeCompare(digitsOnly(b.phone)),
        cell: ({ row }) => (
          <ContactPhone id={row.id} value={row.phone} copiedId={copiedId} onCopy={onCopy} />
        ),
      },
      {
        id: "actions",
        header: "Akcje",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <RowActionButton
              label="Edytuj kontakt"
              icon={Edit}
              onClick={() => onEdit(row)}
            />

            <RowActionButton
              label="Usuń kontakt"
              icon={Trash2}
              onClick={() => requestDelete(row)}
              tone="destructive"
            />
          </div>
        ),
      },
    ];
  }, [copiedId, onCopy, onEdit, onDelete, programsIndex]);

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isFiltered ? "Brak pasujących kontaktów" : "Baza kontaktów jest pusta"}
        description={
          isFiltered
            ? "Żaden kontakt nie spełnia wprowadzonych kryteriów wyszukiwania."
            : "Nie wprowadzono jeszcze osób do kontaktu ani koordynatorów szkolnych."
        }
        actionLabel={isFiltered ? undefined : "Dodaj pierwszy kontakt"}
        onAction={isFiltered ? undefined : onOpenAdd}
        secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
        onSecondaryAction={isFiltered ? onClearFilters : undefined}
        className="my-4"
      />
    );
  }

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <DataTable
          data={contacts}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={(row) => onEdit(row)}
          rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
          entityLabel="kontaktów"
          enablePagination
          defaultPageSize={25}
          pageSizeOptions={[15, 25, 50, 100]}
          enableExport={true}
          exportFileName="spis_kontaktow.csv"
        />
      </TooltipProvider>

      <ConfirmDialog
        isOpen={Boolean(deletingContact)}
        onClose={() => setDeletingContact(null)}
        onConfirm={async () => {
          if (deletingContact) {
            await onDelete(deletingContact.id);
          }
        }}
        title="Potwierdź usunięcie kontaktu"
        description={
          <span>
            Czy na pewno chcesz usunąć{" "}
            <strong className="text-foreground">«{deletingContact?.name}»</strong>
            {deletingContact?.facilityName ? ` (${deletingContact.facilityName})` : ""} ze spisu
            kontaktów? Ta operacja jest nieodwracalna.
          </span>
        }
        confirmText="Usuń kontakt"
        variant="destructive"
      />
    </>
  );
}
