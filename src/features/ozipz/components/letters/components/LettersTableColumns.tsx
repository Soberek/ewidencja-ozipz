import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzLetter } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";
import { describeDaysLeft, letterDeadlineState } from "../../../utils/deadlineUtils";
import { formatDatePl } from "../../../utils/dateUtils";

const DEADLINE_VARIANTS = { overdue: "destructive-soft", today: "warning-soft", soon: "info-soft" } as const;

interface CreateLetterColumnsOptions {
  onEdit: (letter: OzipzLetter) => void;
  onDelete: (id: string) => void;
}

export function createLetterColumns({
  onEdit,
  onDelete,
}: CreateLetterColumnsOptions): ColumnDef<OzipzLetter>[] {
  return [
    {
      id: "letterNumber",
      header: "Numer / Znak Pisma",
      sortable: true,
      accessorKey: "letterNumber",
      width: "160px",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-primary">{row.letterNumber}</span>
          {row.caseSign && <span className="text-[10px] text-muted-foreground font-mono">{row.caseSign}</span>}
        </div>
      ),
    },
    {
      id: "direction",
      header: "Kierunek",
      sortable: true,
      accessorKey: "direction",
      width: "120px",
      cell: ({ row }) => (
        <Badge
          variant={row.direction === "wychodzace" ? "default" : "secondary"}
          className="text-[10px] font-bold uppercase"
        >
          {row.direction === "wychodzace" ? "Wychodzące" : "Przychodzące"}
        </Badge>
      ),
    },
    {
      id: "subject",
      header: "Dotyczy / Sprawa",
      sortable: true,
      accessorKey: "subject",
      minWidth: "220px",
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-[340px] space-y-0.5">
          <p
            className="font-bold text-foreground line-clamp-2 break-words leading-tight"
            title={row.subject}
          >
            {row.subject}
          </p>
          {row.senderRecipient && (
            <p
              className="text-[11px] text-muted-foreground line-clamp-1 break-words truncate"
              title={row.senderRecipient}
            >
              {row.senderRecipient}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "date",
      header: "Data Pisma",
      sortable: true,
      accessorKey: "letterDate",
      width: "110px",
      cell: ({ row }) => <span className="font-mono text-xs text-foreground font-medium">{row.letterDate}</span>,
    },
    {
      id: "assigned",
      header: "Prowadzący",
      sortable: true,
      accessorKey: "assignedPerson",
      width: "140px",
      cell: ({ row }) => (
        <span
          className="text-xs text-muted-foreground font-semibold truncate block"
          title={row.assignedPerson || ""}
        >
          {row.assignedPerson}
        </span>
      ),
    },
    {
      id: "responseDueDate",
      header: "Termin",
      sortable: true,
      accessorKey: "responseDueDate",
      width: "120px",
      cell: ({ row }) => {
        if (!row.responseDueDate) return <span className="text-muted-foreground">—</span>;
        const state = letterDeadlineState(row);
        return (
          <span className="flex flex-col items-start gap-0.5 text-xs">
            <span>{formatDatePl(row.responseDueDate)}</span>
            {state && state.daysLeft <= 7 && <Badge variant={DEADLINE_VARIANTS[state.severity]} className="text-[10px]">{describeDaysLeft(state.daysLeft)}</Badge>}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessorKey: "status",
      width: "110px",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold">
          {row.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "80px",
      cell: ({ row }) => <LetterActionCell row={row} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

function LetterActionCell({
  row,
  onEdit,
  onDelete,
}: {
  row: OzipzLetter;
  onEdit: (letter: OzipzLetter) => void;
  onDelete: (id: string) => void;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <RowActionButton
          label="Edytuj pismo"
          icon={Edit}
          onClick={() => onEdit(row)}
        />

        <RowActionButton
          label="Usuń pismo"
          icon={Trash2}
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno usunąć to pismo z ewidencji?",
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
        title="Usuń pismo"
        description={
          <span>
            Czy na pewno chcesz usunąć pismo{" "}
            <strong>«{row.subject || row.letterNumber || "Bez tytułu"}»</strong> z ewidencji?
          </span>
        }
        variant="destructive"
        confirmText="Usuń pismo"
        cancelText="Anuluj"
      />
    </>
  );
}
