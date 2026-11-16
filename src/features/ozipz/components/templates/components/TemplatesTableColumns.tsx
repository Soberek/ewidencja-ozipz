import { useState } from "react";
import { Edit, FilePlus2, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import { RowActionButton } from "@/components/ui/row-action-button";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import type { TemplateContent, TemplateDescription, TemplateDetailRow } from "../../../utils/templateUtils";
import { TemplatePreviewTooltip } from "./TemplatePreview";

/** Wiersz tabeli: szablon z odczytaną treścią i opisem (program, odbiorcy, materiały po nazwach z katalogów). */
export interface TemplateListRow extends OzipzTemplate {
  content: TemplateContent;
  summary: TemplateDescription;
  details: TemplateDetailRow[];
}

interface CreateTemplateColumnsOptions {
  onUse: (template: OzipzTemplate) => void;
  onEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (template: OzipzTemplate) => void;
}

const muted = (text: string) => text || <span className="text-muted-foreground">—</span>;

export function createTemplateColumns({ onUse, onEdit, onDelete, onTogglePin }: CreateTemplateColumnsOptions): ColumnDef<TemplateListRow>[] {
  return [
    {
      id: "title",
      header: "Szablon",
      sortable: true,
      accessorKey: "title",
      minWidth: "220px",
      // Jeden wiersz na szablon — tytuł działania, prowadzący i opis są w podglądzie po najechaniu.
      cell: ({ row }) => (
        <TemplatePreviewTooltip name={row.title} rows={row.details} side="right">
          <span className="flex min-w-0 max-w-[24rem] items-center gap-1">
            {row.pinned && <Pin aria-label="Przypięty" className="size-3 shrink-0 fill-current text-primary" />}
            <span className="cursor-help truncate font-medium text-foreground decoration-dotted underline-offset-2 hover:underline">{row.title}</span>
          </span>
        </TemplatePreviewTooltip>
      ),
    },
    {
      id: "actionType",
      header: "Forma",
      sortable: true,
      accessorKey: "actionType",
      width: "150px",
      cell: ({ row }) => (
        <span className="block truncate">{row.actionType}{row.content.numberOfActions > 1 && <span className="ml-1 tabular-nums text-muted-foreground">×{row.content.numberOfActions}</span>}</span>
      ),
    },
    {
      id: "classification",
      header: "Program lub JRWA",
      sortable: true,
      accessorFn: (row) => row.summary.classification,
      minWidth: "180px",
      cell: ({ row }) => (
        <span className="flex min-w-0 max-w-[17rem] items-baseline gap-1.5" title={row.summary.classification}>
          {row.summary.jrwaSymbol && <span className="shrink-0 tabular-nums text-muted-foreground">{row.summary.jrwaSymbol}</span>}
          <span className="truncate">{muted(row.summary.programName || row.summary.classification)}</span>
        </span>
      ),
    },
    {
      id: "audience",
      header: "Odbiorcy",
      accessorFn: (row) => row.summary.audience,
      minWidth: "180px",
      cell: ({ row }) => <span className="block max-w-[13rem] truncate" title={row.summary.audience}>{muted(row.summary.audience)}</span>,
    },
    {
      id: "materials",
      header: "Materiały",
      accessorFn: (row) => row.summary.materials,
      minWidth: "140px",
      cell: ({ row }) => <span className="block max-w-[10rem] truncate text-muted-foreground" title={row.summary.materials}>{muted(row.summary.materials)}</span>,
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "180px",
      cell: ({ row }) => <TemplateActionButtons row={row} onUse={onUse} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} />,
    },
  ];
}

function TemplateActionButtons({ row, onUse, onEdit, onDelete, onTogglePin }: { row: TemplateListRow } & CreateTemplateColumnsOptions) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onUse(row)}
          aria-label={`Użyj szablonu ${row.title}`} title="Otwórz nowe działanie wypełnione tym szablonem">
          <FilePlus2 className="size-3.5" /> Użyj
        </Button>
        {onTogglePin && <RowActionButton label={row.pinned ? "Odepnij z początku listy szablonów" : "Przypnij na początek listy szablonów"}
          icon={Pin} onClick={() => onTogglePin(row)} />}
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
