import { useMemo } from "react";
import { Copy, Check, Edit, Trash2, Eye, Bookmark, CheckCircle2, Clock, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzJrwaCase } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";

export interface JrwaCasesTableProps {
  cases: OzipzJrwaCase[];
  copiedId: string | null;
  onCopySign: (id: string, sign: string) => void;
  onOpenDetails: (item: OzipzJrwaCase) => void;
  onEdit: (item: OzipzJrwaCase) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  ezdStatusMap?: Map<string, { total: number; pendingEzd: number }>;
}

export function JrwaCasesTable({
  cases,
  copiedId,
  onCopySign,
  onOpenDetails,
  onEdit,
  onDelete,
  onOpenAdd,
  onClearFilters,
  isFiltered,
  ezdStatusMap,
}: JrwaCasesTableProps) {
  const columns = useMemo<ColumnDef<OzipzJrwaCase>[]>(() => {
    return [
      {
        id: "fullCaseSign",
        header: "Znak Sprawy",
        accessorKey: "fullCaseSign",
        sortable: true,
        cell: ({ row }) => {
          const sign = row.fullCaseSign || `${row.section}.${row.jrwaSymbol}.${row.caseNumber}.${row.year}`;
          const isCopied = copiedId === row.id;
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="font-bold text-foreground">
                {sign}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopySign(row.id, sign);
                }}
                className="p-1 rounded-[2px] border border-border/40 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
                title="Kopiuj pełny znak sprawy do schowka"
              >
                {isCopied ? (
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        id: "title",
        header: "Tytuł / Przedmiot Sprawy",
        accessorKey: "title",
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[180px] max-w-[320px]">
            <span
              className="font-medium text-xs text-foreground line-clamp-2 break-words leading-tight block"
              title={row.title}
            >
              {row.title}
            </span>
            {row.notes && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={row.notes}>
                {row.notes}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "jrwaSymbol",
        header: "Hasło JRWA",
        accessorKey: "jrwaSymbol",
        sortable: true,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-800 border-blue-200 font-mono text-[11px] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
          >
            <Bookmark className="size-3 mr-1 inline text-blue-600" />
            {row.jrwaSymbol}
          </Badge>
        ),
      },
      {
        id: "assignedEducator",
        header: "Prowadzący",
        accessorKey: "assignedEducator",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.assignedEducator || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        cell: ({ row }) => {
          const s = row.status || "w_toku";
          if (s === "zakonczona") {
            return (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 w-fit dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              >
                <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                Zakończona
              </Badge>
            );
          }
          if (s === "zarchiwizowana") {
            return (
              <Badge
                variant="outline"
                className="text-muted-foreground border-border text-[10px] flex items-center gap-1 w-fit"
              >
                <Archive className="size-3" />
                Archiwum
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold flex items-center gap-1 w-fit dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
            >
              <Clock className="size-3 text-amber-600 dark:text-amber-400" />
              W toku
            </Badge>
          );
        },
      },
      {
        id: "ezdStatus",
        header: "Status EZD",
        cell: ({ row }) => {
          const ezdInfo = ezdStatusMap?.get(row.id) ?? { total: 0, pendingEzd: 0 };
          if (ezdInfo.pendingEzd > 0) {
            return (
              <Badge
                variant="outline"
                className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold flex items-center gap-1 w-fit dark:bg-destructive/20 dark:text-red-300 dark:border-destructive/50"
              >
                <Clock className="size-2.5 text-destructive" />
                ! Wymaga EZD ({ezdInfo.pendingEzd})
              </Badge>
            );
          }
          if (ezdInfo.total > 0 && ezdInfo.pendingEzd === 0) {
            return (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 w-fit dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              >
                <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                w EZD ({ezdInfo.total})
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="text-muted-foreground border-border text-[10px] font-normal"
            >
              Brak pism
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Akcje",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <RowActionButton
              label="Metryka i szczegóły sprawy"
              icon={Eye}
              onClick={() => onOpenDetails(row)}
              tone="primary"
            />

            <RowActionButton
              label="Edytuj sprawę"
              icon={Edit}
              onClick={() => onEdit(row)}
            />

            <RowActionButton
              label="Usuń sprawę"
              icon={Trash2}
              onClick={() => onDelete(row.id)}
              tone="destructive"
            />
          </div>
        ),
      },
    ];
  }, [copiedId, onCopySign, onOpenDetails, onEdit, onDelete, ezdStatusMap]);

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={isFiltered ? "Brak pasujących spraw JRWA" : "Brak zarejestrowanych spraw JRWA"}
        description={
          isFiltered
            ? "Żadna sprawa nie spełnia wprowadzonych kryteriów wyszukiwania lub filtrów."
            : "W wykazie nie ma jeszcze zarejestrowanych teczek spraw."
        }
        actionLabel={isFiltered ? undefined : "Zarejestruj pierwszą sprawę"}
        onAction={isFiltered ? undefined : onOpenAdd}
        secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
        onSecondaryAction={isFiltered ? onClearFilters : undefined}
        className="my-4"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <DataTable
        data={cases}
        columns={columns}
        keyExtractor={(item) => item.id}
        enablePagination
        defaultPageSize={20}
        pageSizeOptions={[15, 20, 50, 100]}
        enableExport={true}
        exportFileName="sprawy_kancelaryjne_jrwa.csv"
        rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
        onRowClick={(row) => onOpenDetails(row)}
      />
    </TooltipProvider>
  );
}
