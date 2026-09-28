import React from "react";
import { ChevronRight, ChevronDown, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDef, TableDensity } from "./types";

interface DataTableRowProps<T> {
  item: T;
  index: number;
  columns: ColumnDef<T>[];
  rowKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  selectable: boolean;
  hasExpandable: boolean;
  onRowClick?: (item: T) => void;
  onToggleSelectRow: (key: string) => void;
  onToggleRow: (key: string) => void;
  renderSubComponent?: (props: { row: T; isExpanded: boolean }) => React.ReactNode;
  rowClassName?: (item: T, isExpanded: boolean, isSelected: boolean) => string;
  density?: TableDensity;
}

function DataTableRowInner<T>({
  item,
  index,
  columns,
  rowKey,
  isSelected,
  isExpanded,
  selectable,
  hasExpandable,
  onRowClick,
  onToggleSelectRow,
  onToggleRow,
  renderSubComponent,
  rowClassName,
  density = "normal",
}: DataTableRowProps<T>) {
  const isCompact = density === "compact";
  const customClass = rowClassName?.(item, isExpanded, isSelected) || "";
  const detailsId = React.useId();

  return (
    <React.Fragment key={rowKey}>
      <tr
        onClick={() => onRowClick?.(item)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !onRowClick) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onRowClick(item);
          }
        }}
        tabIndex={onRowClick ? 0 : undefined}
        aria-description={onRowClick ? "Naciśnij Enter lub spację, aby otworzyć wiersz" : undefined}
        className={cn(
          "border-b border-border/60 transition-colors text-xs group",
          index % 2 === 1 ? "bg-muted/10" : "bg-card",
          isSelected && "bg-primary/5 dark:bg-primary/10",
          onRowClick && "cursor-pointer hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          !onRowClick && "hover:bg-muted/20",
          customClass
        )}
      >
        {selectable && (
          <td
            className={cn(isCompact ? "w-8 px-2 py-1" : "w-9 px-2.5 py-2.5", "text-center")}
          >
            <button
              type="button"
              role="checkbox"
              aria-label={`Wiersz ${index + 1}`}
              aria-checked={isSelected}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelectRow(rowKey);
              }}
              className="size-7 rounded-[2px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSelected ? (
                <CheckSquare className="size-4 text-primary" />
              ) : (
                <Square className="size-4 opacity-50 group-hover:opacity-100" />
              )}
            </button>
          </td>
        )}

        {hasExpandable && (
          <td
            className={cn(isCompact ? "w-7 px-1.5 py-1" : "w-8 px-2 py-2.5", "text-center")}
          >
            <button
              type="button"
              aria-label={`Szczegóły wiersza ${index + 1}`}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? detailsId : undefined}
              onClick={(event) => {
                event.stopPropagation();
                onToggleRow(rowKey);
              }}
              className="size-7 text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-[2px] cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5 opacity-50 group-hover:opacity-100" />
              )}
            </button>
          </td>
        )}

        {columns.map((col) => {
          let cellContent: React.ReactNode = null;
          if (col.cell) {
            cellContent = col.cell({ row: item, index, isExpanded, isSelected, density });
          } else if (col.accessorKey) {
            const rawVal = item[col.accessorKey];
            cellContent = rawVal !== undefined && rawVal !== null ? String(rawVal) : "-";
          } else if (col.accessorFn) {
            const rawVal = col.accessorFn(item);
            cellContent = rawVal !== undefined && rawVal !== null ? String(rawVal) : "-";
          }

          return (
            <td
              key={col.id}
              style={{
                width: col.width,
                minWidth: col.minWidth,
                maxWidth: col.maxWidth,
              }}
              className={cn(
                isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-2.5 text-xs",
                "align-middle",
                col.align === "center" && "text-center",
                col.align === "right" && "text-right",
                col.className
              )}
            >
              {cellContent}
            </td>
          );
        })}
      </tr>

      {hasExpandable && isExpanded && renderSubComponent && (
        <tr className="bg-muted/30 border-b border-border">
          <td id={detailsId} colSpan={columns.length + (selectable ? 1 : 0) + 1} className="p-0">
            {renderSubComponent({ row: item, isExpanded })}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

/** Wiersz renderuje się ponownie tylko przy zmianie własnych danych — stabilne `columns`/handlery omijają pozostałe wiersze. */
export const DataTableRow = React.memo(DataTableRowInner) as typeof DataTableRowInner;
