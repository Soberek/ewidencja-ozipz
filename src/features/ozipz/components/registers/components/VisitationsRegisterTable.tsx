import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { OzipzAction, OzipzFacility } from "../../../types/ozipz.types";
import {
  formatActionIzrzNumber,
  formatActionPrzedmiot,
  formatActionLocationDetails,
} from "../../../utils/registerPresentation";

export interface VisitationsRegisterTableProps {
  actions: OzipzAction[];
  facilitiesMap: Map<string, OzipzFacility>;
  onActionClick: (action: OzipzAction) => void;
}

export function VisitationsRegisterTable({
  actions,
  facilitiesMap,
  onActionClick,
}: VisitationsRegisterTableProps) {
  const columns: ColumnDef<OzipzAction>[] = [
    {
      id: "izrzNumber",
      header: "Nr protokołu / IZRZ",
      width: "160px",
      sortable: true,
      accessorFn: (row) => formatActionIzrzNumber(row),
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold text-foreground">
          {formatActionIzrzNumber(row)}
        </span>
      ),
    },
    {
      id: "date",
      header: "Data protokołu",
      width: "120px",
      sortable: true,
      accessorKey: "date",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {row.date || "—"}
        </span>
      ),
    },
    {
      id: "subject",
      header: "Przedmiot wizytacji",
      minWidth: "220px",
      sortable: true,
      accessorFn: (row) => formatActionPrzedmiot(row),
      cell: ({ row }) => {
        const r = row as OzipzAction & { subject?: string };
        const displaySubject = r.subject || row.title || formatActionPrzedmiot(row) || "—";
        const tooltipText = r.subject || formatActionPrzedmiot(row) || row.title || "";
        return (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <span
              className="text-xs font-semibold text-foreground leading-tight line-clamp-2 break-words block"
              title={tooltipText}
            >
              {displaySubject}
            </span>
            {row.topic && row.topic !== row.title && row.topic !== r.subject ? (
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
      id: "facilityDetails",
      header: "Dane wizytowanej placówki",
      minWidth: "250px",
      sortable: true,
      accessorFn: (row) => {
        const fac = row.facilityId ? facilitiesMap.get(row.facilityId) : null;
        return formatActionLocationDetails(row, fac);
      },
      cell: ({ row }) => {
        const fac = row.facilityId ? facilitiesMap.get(row.facilityId) : null;
        const details = formatActionLocationDetails(row, fac);
        return (
          <span className="text-xs text-foreground font-medium line-clamp-2" title={details}>
            {details}
          </span>
        );
      },
    },
    {
      id: "leadEducator",
      header: "Osoba odpowiedzialna",
      width: "160px",
      sortable: true,
      accessorKey: "leadEducator",
      cell: ({ row }) => {
        const educatorText = row.leadEducator || "—";
        return (
          <span
            className="text-xs font-medium text-foreground truncate block max-w-[150px]"
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
      entityLabel="wizytacji i kontroli"
      totalCount={actions.length}
      enableExport={true}
      exportFileName="rejestr_wizytacji_i_kontroli.csv"
      onRowClick={onActionClick}
      rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
    />
  );
}
