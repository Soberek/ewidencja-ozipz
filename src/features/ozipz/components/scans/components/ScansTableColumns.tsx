import { useState } from "react";
import { FileText, FileSearch, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzScan } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";

interface CreateScanColumnsOptions {
  onDelete: (id: string) => void;
  onOpen?: (scan: OzipzScan) => void;
}

export function createScanColumns({
  onDelete,
  onOpen,
}: CreateScanColumnsOptions): ColumnDef<OzipzScan>[] {
  return [
    {
      id: "title",
      header: "Nazwa Dokumentu / Skany PDF",
      sortable: true,
      accessorKey: "title",
      minWidth: "220px",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground leading-snug flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary shrink-0" />
            {row.title}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {row.fileName} {row.fileSizeKb ? "(" + row.fileSizeKb + " KB)" : ""}
          </span>
        </div>
      ),
    },
    {
      id: "docType",
      header: "Typ Dokumentu",
      sortable: true,
      accessorKey: "documentType",
      width: "160px",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.documentType.replace("_", " ")}
        </Badge>
      ),
    },
    {
      id: "facility",
      header: "Placówka / Program",
      sortable: true,
      accessorKey: "facilityName",
      minWidth: "180px",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-foreground">{row.facilityName}</span>
          {row.programName && <span className="text-[10px] text-indigo-600 font-semibold">{row.programName}</span>}
        </div>
      ),
    },
    {
      id: "scanDate",
      header: "Data Skany",
      sortable: true,
      accessorKey: "scanDate",
      width: "120px",
      cell: ({ row }) => <span className="font-mono text-xs text-foreground font-medium">{row.scanDate}</span>,
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "100px",
      cell: ({ row }) => <ScanActionCell row={row} onDelete={onDelete} onOpen={onOpen} />,
    },
  ];
}

function ScanActionCell({
  row,
  onDelete,
  onOpen,
}: {
  row: OzipzScan;
  onDelete: (id: string) => void;
  onOpen?: (scan: OzipzScan) => void;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        {onOpen && <RowActionButton label="Otwórz skan" icon={FileSearch} onClick={() => onOpen(row)} tone="primary" />}
        <RowActionButton
          label="Usuń skan"
          icon={Trash2}
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno usunąć ten skan z rejestru?",
              () => onDelete(row.id),
              () => setIsConfirmOpen(true)
            );
          }}
          tone="destructive"
          tooltip="Usuń wpis skanu"
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          onDelete(row.id);
          setIsConfirmOpen(false);
        }}
        title="Usuń skan"
        description={
          <span>
            Czy na pewno chcesz usunąć skan{" "}
            <strong>«{row.title || row.fileName || "Bez tytułu"}»</strong> z rejestru?
          </span>
        }
        variant="destructive"
        confirmText="Usuń skan"
        cancelText="Anuluj"
      />
    </>
  );
}
