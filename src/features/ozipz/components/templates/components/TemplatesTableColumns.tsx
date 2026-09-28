import { useState } from "react";
import { Edit, Trash2, Copy, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";

interface CreateTemplateColumnsOptions {
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onPreview: (template: OzipzTemplate) => void;
  onEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
}

export function createTemplateColumns({
  copiedId,
  onCopy,
  onPreview,
  onEdit,
  onDelete,
}: CreateTemplateColumnsOptions): ColumnDef<OzipzTemplate>[] {
  return [
    {
      id: "title",
      header: "Nazwa szablonu",
      sortable: true,
      accessorKey: "title",
      minWidth: "200px",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground leading-snug">{row.title}</span>
          <span className="text-[11px] text-muted-foreground truncate max-w-md">
            {row.descriptionTemplate}
          </span>
        </div>
      ),
    },
    {
      id: "topic",
      header: "Tematyka",
      sortable: true,
      accessorKey: "topic",
      width: "170px",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className="text-[10px] font-bold py-0.5 px-2 truncate max-w-[160px] bg-primary/10 text-primary border border-primary/20"
        >
          {row.topic || "Ogólne OZiPZ"}
        </Badge>
      ),
    },
    {
      id: "actionType",
      header: "Forma Działania",
      sortable: true,
      accessorKey: "actionType",
      width: "140px",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.actionType}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "120px",
      cell: ({ row }) => (
        <TemplateActionButtons
          row={row}
          copiedId={copiedId}
          onCopy={onCopy}
          onPreview={onPreview}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

function TemplateActionButtons({
  row,
  copiedId,
  onCopy,
  onPreview,
  onEdit,
  onDelete,
}: {
  row: OzipzTemplate;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onPreview: (template: OzipzTemplate) => void;
  onEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              disabled={!row.descriptionTemplate?.trim()}
              onClick={(e) => {
                e.stopPropagation();
                onCopy(row.descriptionTemplate, row.id);
              }}
              className="size-6 text-primary hover:bg-primary/10 cursor-pointer"
              aria-label="Kopiuj opis"
            >
              {copiedId === row.id ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Kopiuj szablon opisu</TooltipContent>
        </Tooltip>

        <RowActionButton
          label="Podgląd szablonu"
          icon={Eye}
          onClick={() => onPreview(row)}
          tooltip="Pełny podgląd szablonu"
        />

        <RowActionButton
          label="Edytuj szablon"
          icon={Edit}
          onClick={() => onEdit(row)}
        />

        <RowActionButton
          label="Usuń szablon"
          icon={Trash2}
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno usunąć ten szablon opisu?",
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
        title="Usuń szablon opisu"
        description={
          <span>
            Czy na pewno chcesz usunąć szablon{" "}
            <strong>«{row.title || "Bez tytułu"}»</strong>?
          </span>
        }
        variant="destructive"
        confirmText="Usuń szablon"
        cancelText="Anuluj"
      />
    </>
  );
}
