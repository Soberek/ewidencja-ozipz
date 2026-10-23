import { useState } from "react";
import { Edit, FilePlus2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import { RowActionButton } from "@/components/ui/row-action-button";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import type { TemplateContent, TemplateDescription } from "../../../utils/templateUtils";

/** Wiersz tabeli: szablon z odczytaną treścią i opisem (program, odbiorcy, materiały po nazwach z katalogów). */
export interface TemplateListRow extends OzipzTemplate {
  content: TemplateContent;
  summary: TemplateDescription;
}

interface CreateTemplateColumnsOptions {
  onUse: (template: OzipzTemplate) => void;
  onEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
}

const muted = (text: string) => text || <span className="text-muted-foreground">—</span>;

export function createTemplateColumns({ onUse, onEdit, onDelete }: CreateTemplateColumnsOptions): ColumnDef<TemplateListRow>[] {
  return [
    {
      id: "title",
      header: "Szablon",
      sortable: true,
      accessorKey: "title",
      minWidth: "220px",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold leading-snug text-foreground">{row.title}</span>
          {/* Tytuł równy nazwie programu widać już w kolumnie programu. */}
          {row.content.title && row.content.title !== row.title && row.content.title !== row.summary.programName && (
            <span className="text-[11px] text-muted-foreground">Tytuł działania: {row.content.title}</span>
          )}
          {row.content.leadEducator && <span className="text-[11px] text-muted-foreground">Prowadzi: {row.content.leadEducator}</span>}
        </div>
      ),
    },
    {
      id: "actionType",
      header: "Forma",
      sortable: true,
      accessorKey: "actionType",
      width: "150px",
      cell: ({ row }) => (
        <span>{row.actionType}{row.summary.count && <span className="block text-[11px] text-muted-foreground">{row.summary.count}</span>}</span>
      ),
    },
    {
      id: "classification",
      header: "Program lub JRWA",
      sortable: true,
      accessorFn: (row) => row.summary.classification,
      minWidth: "180px",
      cell: ({ row }) => <span className="line-clamp-2">{muted(row.summary.classification)}</span>,
    },
    {
      id: "audience",
      header: "Odbiorcy",
      accessorFn: (row) => row.summary.audience,
      minWidth: "180px",
      cell: ({ row }) => <span className="line-clamp-2">{muted(row.summary.audience)}</span>,
    },
    {
      id: "materials",
      header: "Materiały",
      accessorFn: (row) => row.summary.materials,
      minWidth: "140px",
      cell: ({ row }) => <span className="line-clamp-2">{muted(row.summary.materials)}</span>,
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "150px",
      cell: ({ row }) => <TemplateActionButtons row={row} onUse={onUse} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

function TemplateActionButtons({ row, onUse, onEdit, onDelete }: { row: TemplateListRow } & CreateTemplateColumnsOptions) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onUse(row)}
          aria-label={`Użyj szablonu ${row.title}`} title="Otwórz nowe działanie wypełnione tym szablonem">
          <FilePlus2 className="size-3.5" /> Użyj
        </Button>
        <RowActionButton label="Edytuj szablon" icon={Edit} onClick={() => onEdit(row)} />
        <RowActionButton
          label="Usuń szablon"
          icon={Trash2}
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno usunąć ten szablon?",
              () => onDelete(row.id),
              () => setIsConfirmOpen(true)
            );
          }}
          tone="destructive"
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          onDelete(row.id);
          setIsConfirmOpen(false);
        }}
        title="Usuń szablon"
        description={
          <span>
            Czy na pewno chcesz usunąć szablon <strong>«{row.title || "Bez nazwy"}»</strong>? Zapisane działania pozostają bez zmian.
          </span>
        }
        variant="destructive"
        confirmText="Usuń szablon"
        cancelText="Anuluj"
      />
    </>
  );
}
