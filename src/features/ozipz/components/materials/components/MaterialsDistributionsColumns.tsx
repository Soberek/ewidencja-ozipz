import { Building2, Edit, Trash2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzDistribution } from "../../../types/ozipz.types";
import { formatDatePl } from "../../../utils/dateUtils";
import { RowActionButton } from "@/components/ui/row-action-button";

export interface CreateDistributionColumnsParams {
  onOpenBlankiet: (item: OzipzDistribution) => void;
  onEdit: (item: OzipzDistribution) => void;
  onDelete: (id: string) => void;
}

export function createDistributionColumns({
  onOpenBlankiet,
  onEdit,
  onDelete,
}: CreateDistributionColumnsParams): ColumnDef<OzipzDistribution>[] {
  return [
    {
      id: "distributionDate",
      header: "Data Przekazania",
      accessorKey: "distributionDate",
      sortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.distributionDate ? formatDatePl(row.distributionDate) : "-"}
        </span>
      ),
    },
    {
      id: "materialTitle",
      header: "Tytuł Materiału",
      accessorKey: "materialTitle",
      sortable: true,
      cell: ({ row }) => (
        <div className="min-w-[180px] max-w-[280px] space-y-0.5">
          <span
            className="font-medium text-xs text-foreground line-clamp-2 break-words leading-tight"
            title={row.materialTitle}
          >
            {row.materialTitle}
          </span>
          {row.materialType && (
            <Badge variant="outline" className="text-[10px] ml-1 py-0 border-border inline-block">
              {row.materialType}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "recipientName",
      header: "Odbiorca / Placówka",
      accessorKey: "recipientName",
      sortable: true,
      cell: ({ row }) => {
        const recipientTitle = row.recipientName || "Odbiorca nieokreślony";
        return (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <div className="flex items-start gap-1 font-medium text-xs text-foreground">
              <Building2 className="size-3 text-muted-foreground shrink-0 mt-0.5" />
              <span
                className="line-clamp-2 break-words leading-tight"
                title={recipientTitle}
              >
                {recipientTitle}
              </span>
            </div>
            {row.municipality && (
              <p
                className="text-[11px] text-muted-foreground truncate ml-4 mt-0.5"
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
      id: "quantity",
      header: "Ilość",
      accessorKey: "quantity",
      sortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {row.quantity ? `${Number(row.quantity).toLocaleString("pl-PL")} szt.` : "-"}
        </span>
      ),
    },
    {
      id: "assignedEducator",
      header: "Wydający",
      accessorKey: "assignedEducator",
      sortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {row.assignedEducator || "-"}
        </span>
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
            label="Drukuj blankiet rozdzielnika"
            icon={Printer}
            onClick={() => onOpenBlankiet(row)}
            tone="primary"
          />

          <RowActionButton
            label="Edytuj rozdzielnik"
            icon={Edit}
            onClick={() => onEdit(row)}
          />

          <RowActionButton
            label="Usuń rozdzielnik"
            icon={Trash2}
            onClick={() => onDelete(row.id)}
            tone="destructive"
          />
        </div>
      ),
    },
  ];
}
