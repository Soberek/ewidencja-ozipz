import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { OzipzAction } from "../../../types/ozipz.types";
import { formatActionPrzedmiot } from "../../../utils/registerPresentation";

export interface PublicationsRegisterTableProps {
  actions: OzipzAction[];
  onActionClick: (action: OzipzAction) => void;
}

export function PublicationsRegisterTable({
  actions,
  onActionClick,
}: PublicationsRegisterTableProps) {
  const columns: ColumnDef<OzipzAction>[] = [
    {
      id: "lp",
      header: "Lp.",
      width: "50px",
      align: "center",
      cell: ({ row }) => {
        const index = actions.findIndex((a) => a.id === row.id);
        return <span className="text-xs font-mono font-medium text-muted-foreground">{index + 1}</span>;
      },
    },
    {
      id: "date",
      header: "Data publikacji informacji",
      width: "160px",
      sortable: true,
      accessorKey: "date",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {row.date || "—"}
        </span>
      ),
    },
    {
      id: "topic",
      header: "Tematyka informacji",
      minWidth: "260px",
      sortable: true,
      accessorFn: (row) => formatActionPrzedmiot(row),
      cell: ({ row }) => {
        const topicText = row.topic || row.title || formatActionPrzedmiot(row) || "—";
        return (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <span
              className="text-xs font-semibold text-foreground leading-tight line-clamp-2 break-words block"
              title={row.topic || topicText}
            >
              {row.title || row.topic || formatActionPrzedmiot(row)}
            </span>
            {row.topic && row.topic !== row.title ? (
              <span
                className="text-[11px] text-muted-foreground line-clamp-1 truncate block"
                title={row.topic}
              >
                {row.topic}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "leadEducator",
      header: "Osoba odpowiedzialna",
      width: "180px",
      sortable: true,
      accessorKey: "leadEducator",
      cell: ({ row }) => {
        const educatorText = row.leadEducator || "—";
        return (
          <span
            className="text-xs font-medium text-foreground truncate block max-w-[170px]"
            title={educatorText}
          >
            {educatorText}
          </span>
        );
      },
    },
    {
      id: "notes",
      header: "Uwagi",
      width: "140px",
      cell: ({ row }) => {
        const notesText = row.notes || "—";
        return (
          <span
            className="text-[11px] text-muted-foreground truncate block max-w-[130px]"
            title={row.notes || notesText}
          >
            {row.notes || ""}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      data={actions}
      columns={columns}
      keyExtractor={(item) => item.id}
      defaultSortField="date"
      defaultSortDirection="desc"
      entityLabel="publikacji medialnych"
      totalCount={actions.length}
      enableExport={true}
      exportFileName="rejestr_publikacji_medialnych.csv"
      onRowClick={onActionClick}
      rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
    />
  );
}
