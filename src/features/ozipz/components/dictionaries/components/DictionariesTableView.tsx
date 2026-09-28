import { useMemo } from "react";
import { Copy, Check, Edit, Trash2, BookOpen, ShieldCheck, UserPlus, CopyPlus, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";
import { GIS_CATEGORY_LABELS } from "../../../utils/gis/gisCategories";
import type { DictionaryUsageIndex } from "../../../utils/dictionaryUsage";
import { getCategoryDef } from "../dictionaryCategoryMeta";
import { RowActionButton } from "@/components/ui/row-action-button";

export interface DictionariesTableViewProps {
  items: OzipzDictionaryItem[];
  copiedCodeId: string | null;
  onCopyCode: (id: string, code: string) => void;
  onEdit: (item: OzipzDictionaryItem) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: OzipzDictionaryItem) => void;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  usageIndex?: DictionaryUsageIndex;
  /** Kolumna "Kategoria" — przydatna tylko w widoku wszystkich kategorii. */
  showCategoryColumn?: boolean;
  /** Kolumna klasyfikacji JRWA / GIS; domyślnie gdy którakolwiek pozycja ma rodzaj. */
  showClassificationColumn?: boolean;
  /** Śledzenie użycia dostępne dla wyświetlanych kategorii. */
  showUsageColumn?: boolean;
  exportFileName?: string;
  defaultSortField?: string;
}

const KIND_BADGE: Record<string, string> = {
  PROGRAMOWE:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  NIEPROGRAMOWE:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
};

export function DictionariesTableView({
  items,
  copiedCodeId,
  onCopyCode,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenAdd,
  onClearFilters,
  isFiltered,
  usageIndex,
  showCategoryColumn = true,
  showClassificationColumn,
  showUsageColumn = !!usageIndex,
  exportFileName = "slowniki_ozipz.csv",
  defaultSortField,
}: DictionariesTableViewProps) {
  const hasClassification = showClassificationColumn ?? items.some((i) => i.kind || i.gisCategory);

  const columns = useMemo<ColumnDef<OzipzDictionaryItem>[]>(() => {
    const cols: ColumnDef<OzipzDictionaryItem>[] = [
      {
        id: "code",
        header: "Kod",
        accessorKey: "code",
        sortable: true,
        sortFn: (a, b) => a.code.localeCompare(b.code, "pl", { numeric: true }),
        width: "150px",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-semibold text-foreground break-all">{row.code}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyCode(row.id, row.code);
              }}
              title="Kopiuj kod do schowka"
              aria-label={`Kopiuj kod ${row.code}`}
              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              {copiedCodeId === row.id ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            </button>
          </div>
        ),
      },
      {
        id: "label",
        header: "Nazwa",
        accessorKey: "label",
        sortable: true,
        cell: ({ row }) => (
          <div className="max-w-[420px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-foreground text-xs">{row.label}</span>
              {row.postalCode && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 px-1.5 py-0"
                >
                  {row.postalCode}
                </Badge>
              )}
            </div>
            {row.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5" title={row.description}>
                {row.description}
              </p>
            )}
          </div>
        ),
      },
    ];

    if (hasClassification) {
      cols.push({
        id: "kind",
        header: "Klasyfikacja",
        accessorKey: "kind",
        sortable: true,
        cell: ({ row }) =>
          row.kind ? (
            <div className="flex flex-col items-start gap-1">
              <Badge variant="outline" className={`font-mono text-[10px] px-1.5 py-0.5 font-semibold ${KIND_BADGE[row.kind] ?? ""}`}>
                {row.kind}
              </Badge>
              {row.gisCategory && (
                <span className="text-[10px] font-semibold text-muted-foreground" title="Obszar sprawozdania GIS">
                  GIS: {GIS_CATEGORY_LABELS[row.gisCategory]}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      });
    }

    if (showCategoryColumn) {
      cols.push({
        id: "dictType",
        header: "Kategoria",
        accessorFn: (row) => getCategoryDef(row.dictType).label,
        sortable: true,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-muted/40 text-[11px] font-normal border-border whitespace-nowrap"
          >
            {getCategoryDef(row.dictType).shortLabel}
          </Badge>
        ),
      });
    }

    if (showUsageColumn) {
      cols.push({
        id: "usage",
        header: "Użycie",
        align: "right",
        sortable: true,
        accessorFn: (row) => usageIndex?.get(row.id)?.total ?? 0,
        sortFn: (a, b) => (usageIndex?.get(a.id)?.total ?? 0) - (usageIndex?.get(b.id)?.total ?? 0),
        cell: ({ row }) => {
          const usage = usageIndex?.get(row.id);
          if (!usage || usage.total === 0) {
            return <span className="text-[11px] text-muted-foreground/70">nieużywana</span>;
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help items-center rounded-[2px] bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {usage.total}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-0.5">
                  {usage.byModule.map((m) => (
                    <div key={m.module} className="flex justify-between gap-4">
                      <span>{m.module}</span>
                      <span className="font-mono">{m.count}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      });
    }

    cols.push(
      {
        id: "isSystem",
        header: "Typ",
        accessorKey: "isSystem",
        sortable: true,
        cell: ({ row }) =>
          row.isSystem ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-semibold inline-flex items-center gap-1 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="size-3" />
              Systemowy
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-semibold inline-flex items-center gap-1 dark:bg-amber-950/60 dark:text-amber-300">
              <UserPlus className="size-3" />
              Własny
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "Akcje",
        align: "right",
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5 justify-end" onClick={(e) => e.stopPropagation()}>
            <RowActionButton
              label={`Edytuj ${row.label}`}
              icon={Edit}
              onClick={() => onEdit(row)}
            />

            {onDuplicate && (
              <RowActionButton
                label={`Duplikuj ${row.label}`}
                icon={CopyPlus}
                onClick={() => onDuplicate(row)}
              />
            )}

            {row.isSystem ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground/70">
                    <Lock className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Pozycja systemowa — nie można jej usunąć</TooltipContent>
              </Tooltip>
            ) : (
              <RowActionButton
                label={`Usuń ${row.label}`}
                icon={Trash2}
                onClick={() => onDelete(row.id)}
                tone="destructive"
              />
            )}
          </div>
        ),
      }
    );

    return cols;
  }, [hasClassification, showCategoryColumn, showUsageColumn, usageIndex, copiedCodeId, onCopyCode, onEdit, onDelete, onDuplicate]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={isFiltered ? "Brak pasujących pozycji w słowniku" : "Kategoria słownika jest pusta"}
        description={
          isFiltered
            ? "Żadna pozycja w wybranej kategorii nie odpowiada kryteriom wyszukiwania."
            : "W tej kategorii nie zdefiniowano jeszcze żadnych pozycji słownikowych."
        }
        actionLabel={isFiltered ? undefined : "Dodaj pierwszą pozycję"}
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
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={onEdit}
        rowClassName={() => "cursor-pointer"}
        defaultSortField={defaultSortField}
        enablePagination
        defaultPageSize={50}
        pageSizeOptions={[25, 50, 100, 200]}
        enableExport
        exportFileName={exportFileName}
        entityLabel="pozycji"
      />
    </TooltipProvider>
  );
}
