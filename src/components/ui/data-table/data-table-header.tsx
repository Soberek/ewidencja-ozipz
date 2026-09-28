import { ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, MinusSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDef, SortDirection, TableDensity } from "./types";

interface DataTableHeaderProps<T> {
  columns: ColumnDef<T>[];
  hasExpandable: boolean;
  selectable: boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggleSelectAll: () => void;
  sortField?: string;
  sortDirection: SortDirection;
  onSort: (columnId: string, col: ColumnDef<T>) => void;
  density?: TableDensity;
}

export function DataTableHeader<T>({
  columns,
  hasExpandable,
  selectable,
  isAllSelected,
  isSomeSelected,
  onToggleSelectAll,
  sortField,
  sortDirection,
  onSort,
  density = "normal",
}: DataTableHeaderProps<T>) {
  const isCompact = density === "compact";

  const renderSortIcon = (columnId: string, col: ColumnDef<T>) => {
    const isSortable = col.sortable || Boolean(col.accessorKey || col.accessorFn || col.sortFn);
    if (!isSortable) return null;

    if (sortField !== columnId) {
      return <ArrowUpDown className="size-3 opacity-35 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="size-3 text-primary font-bold" />
    ) : (
      <ArrowDown className="size-3 text-primary font-bold" />
    );
  };

  return (
    <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
      <tr>
        {selectable && (
          <th scope="col" className={cn(isCompact ? "w-8 px-2 py-1.5" : "w-9 px-2.5 py-2", "text-center")}>
            <button
              type="button"
              role="checkbox"
              aria-label="Zaznacz wszystkie wiersze na stronie"
              aria-checked={isSomeSelected ? "mixed" : isAllSelected}
              onClick={onToggleSelectAll}
              className="size-7 rounded-[2px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={isAllSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
            >
              {isAllSelected ? (
                <CheckSquare className="size-4 text-primary" />
              ) : isSomeSelected ? (
                <MinusSquare className="size-4 text-primary" />
              ) : (
                <Square className="size-4" />
              )}
            </button>
          </th>
        )}
        {hasExpandable && <th scope="col" aria-label="Szczegóły wiersza" className={cn(isCompact ? "w-7 px-1.5 py-1.5" : "w-8 px-2 py-2", "text-center")} />}
        {columns.map((col) => {
          const isSortable = col.sortable || Boolean(col.accessorKey || col.accessorFn || col.sortFn);
          return (
            <th
              key={col.id}
              scope="col"
              aria-sort={isSortable && sortField === col.id ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
              style={{
                width: col.width,
                minWidth: col.minWidth,
                maxWidth: col.maxWidth,
              }}
              className={cn(
                isCompact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]",
                "text-left font-bold",
                col.align === "center" && "text-center",
                col.align === "right" && "text-right",
                col.headerClassName
              )}
            >
              {isSortable ? (
                <button
                  type="button"
                  onClick={() => onSort(col.id, col)}
                  className={cn(
                    "group flex items-center gap-1.5 hover:text-foreground font-bold transition-colors cursor-pointer text-left w-full",
                    col.align === "center" && "justify-center",
                    col.align === "right" && "justify-end"
                  )}
                >
                  <span>{col.header}</span>
                  {renderSortIcon(col.id, col)}
                </button>
              ) : (
                col.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
