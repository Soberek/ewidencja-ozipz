import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { OzipzAction } from "../../../types/ozipz.types";
import {
  formatActionIzrzNumber,
  formatActionInterventionType,
  formatActionPrzedmiot,
  formatActionRecipientCount,
} from "../../../utils/registerPresentation";
import { INFORMACJE_OFFICIAL_FOOTER } from "../../../utils/registerConfig";

export interface InformationRegisterTableProps {
  actions: OzipzAction[];
  onActionClick: (action: OzipzAction) => void;
}

export function InformationRegisterTable({
  actions,
  onActionClick,
}: InformationRegisterTableProps) {
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
      id: "izrzNumber",
      header: "Nr informacji (IZRZ)",
      width: "140px",
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
      header: "Data realizacji",
      width: "110px",
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
      header: "Przedmiot sprawy (Temat / Forma)",
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
      id: "interventionType",
      header: "Rodzaj interwencji",
      width: "130px",
      sortable: true,
      accessorFn: (row) => formatActionInterventionType(row),
      cell: ({ row }) => {
        const isProg = formatActionInterventionType(row) === "programowa";
        return (
          <Badge
            variant={isProg ? "default" : "secondary"}
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0"
          >
            {isProg ? "programowa" : "nieprogramowa"}
          </Badge>
        );
      },
    },
    {
      id: "recipients",
      header: "Liczba odbiorców",
      width: "110px",
      align: "right",
      sortable: true,
      accessorFn: (row) => formatActionRecipientCount(row),
      cell: ({ row }) => (
        <span className="text-xs font-bold font-mono text-foreground">
          {formatActionRecipientCount(row).toLocaleString("pl-PL")}
        </span>
      ),
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
      width: "120px",
      cell: ({ row }) => {
        const notesText = row.notes || "—";
        return (
          <span
            className="text-[11px] text-muted-foreground truncate block max-w-[110px]"
            title={row.notes || notesText}
          >
            {row.notes || ""}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
      <DataTable
        data={actions}
        columns={columns}
        keyExtractor={(item) => item.id}
        defaultSortField="date"
        defaultSortDirection="desc"
        entityLabel="wpisów rejestru informacji"
        totalCount={actions.length}
        enableExport={true}
        exportFileName="rejestr_dzialan_informacyjnych.csv"
        onRowClick={onActionClick}
        rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
      />

      {/* Oficjalna stopka WSSE Szczecin */}
      <div className="rounded border border-border/60 bg-muted/30 px-3 py-2 text-[11px] italic text-muted-foreground">
        {INFORMACJE_OFFICIAL_FOOTER}
      </div>
    </div>
  );
}
