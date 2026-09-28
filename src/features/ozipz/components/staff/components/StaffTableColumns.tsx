import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzStaff } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";

interface CreateStaffColumnsOptions {
  onEdit: (staff: OzipzStaff) => void;
  onDelete: (id: string) => void;
}

export function createStaffColumns({
  onEdit,
  onDelete,
}: CreateStaffColumnsOptions): ColumnDef<OzipzStaff>[] {
  return [
    {
      id: "name",
      header: "Imię i Nazwisko Edukatora",
      sortable: true,
      accessorKey: "fullName",
      minWidth: "200px",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground leading-snug">{row.fullName}</span>
          <span className="text-[11px] text-muted-foreground">
            {row.email} {row.phone ? `• tel. ${row.phone}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Stanowisko / Rola",
      sortable: true,
      accessorKey: "role",
      width: "160px",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      id: "active",
      header: "Status",
      sortable: true,
      accessorKey: "active",
      width: "110px",
      cell: ({ row }) => (
        <Badge variant={row.active ? "default" : "secondary"} className="text-[10px] font-bold">
          {row.active ? "Aktywny" : "Nieaktywny"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "80px",
      cell: ({ row }) => <StaffActionCell row={row} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

function StaffActionCell({
  row,
  onEdit,
  onDelete,
}: {
  row: OzipzStaff;
  onEdit: (staff: OzipzStaff) => void;
  onDelete: (id: string) => void;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <RowActionButton
          label="Edytuj pracownika"
          icon={Edit}
          onClick={() => onEdit(row)}
        />

        <RowActionButton
          label="Usuń pracownika"
          icon={Trash2}
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno usunąć tego pracownika z kadry?",
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
        title="Usuń pracownika"
        description={
          <span>
            Czy na pewno chcesz usunąć pracownika{" "}
            <strong>«{row.fullName || "Bez nazwiska"}»</strong> z kadry OZiPZ?
          </span>
        }
        variant="destructive"
        confirmText="Usuń pracownika"
        cancelText="Anuluj"
      />
    </>
  );
}
