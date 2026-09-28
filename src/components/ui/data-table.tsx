import { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTableHeader } from "./data-table/data-table-header";
import { DataTablePagination } from "./data-table/data-table-pagination";
import { DataTableRow } from "./data-table/data-table-row";
import { DataTableToolbar } from "./data-table/data-table-toolbar";
import { exportDataTableToCsv } from "./data-table/data-table-export";
import { useUIStore } from "@/features/ozipz/store/useUIStore";
import type { ColumnDef, SortDirection, PresetFilterOption, DataTableProps, TableDensity } from "./data-table/types";

export type { ColumnDef, SortDirection, PresetFilterOption, DataTableProps, TableDensity };

export function DataTable<T>({
  data,
  columns,
  keyExtractor = (item: T) => ((item as Record<string, unknown>)?.id as string) ?? String(item),
  defaultSortField,
  defaultSortDirection = "asc",
  onRowClick,
  renderSubComponent,
  presetFilters,
  totalCount,
  entityLabel = "pozycji",
  emptyState,
  className,
  headerRightActions,
  rowClassName,
  isLoading = false,
  selectable = false,
  selectedIds,
  onSelectionChange,
  enablePagination = false,
  defaultPageSize = 25,
  pageSizeOptions = [15, 25, 50, 100],
  density: explicitDensity,
  showDensityToggle = true,
  enableExport = false,
  exportFileName,
  enableSearch = false,
  searchPlaceholder = "Filtruj wiersze...",
}: DataTableProps<T>) {
  const globalDensity = useUIStore((s) => s.tableDensity);
  const toggleGlobalDensity = useUIStore((s) => s.toggleTableDensity);

  const effectiveDensity = explicitDensity ?? globalDensity;

  const [internalSearch, setInternalSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | undefined>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());

  const activeSelectedIds = selectedIds ?? internalSelectedIds;
  const setActiveSelectedIds = onSelectionChange ?? setInternalSelectedIds;

  const toggleRow = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (columnId: string, col: ColumnDef<T>) => {
      if (!col.sortable && !col.accessorKey && !col.accessorFn && !col.sortFn) return;
      if (sortField === columnId) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(columnId);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  // Optional quick search filtering across columns
  const filteredData = useMemo(() => {
    if (!enableSearch || !internalSearch.trim()) return data;
    const query = internalSearch.toLowerCase().trim();

    return data.filter((item) => {
      return columns.some((col) => {
        let val: unknown = "";
        if (col.accessorKey) {
          val = (item as Record<string, unknown>)[col.accessorKey as string];
        } else if (col.accessorFn) {
          val = col.accessorFn(item);
        }
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, columns, enableSearch, internalSearch]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    const col = columns.find((c) => c.id === sortField);
    if (!col) return filteredData;

    const list = [...filteredData];
    list.sort((a, b) => {
      if (col.sortFn) {
        const customComparison = col.sortFn(a, b);
        return sortDirection === "asc" ? customComparison : -customComparison;
      }

      let valA: unknown = col.accessorKey ? a[col.accessorKey] : col.accessorFn ? col.accessorFn(a) : "";
      let valB: unknown = col.accessorKey ? b[col.accessorKey] : col.accessorFn ? col.accessorFn(b) : "";

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else if (typeof valA === "string" && typeof valB === "string") {
        comparison = valA.localeCompare(valB, "pl", { numeric: true, sensitivity: "base" });
      } else {
        comparison = String(valA).localeCompare(String(valB), "pl", { numeric: true });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return list;
  }, [filteredData, columns, sortField, sortDirection]);

  // CSV Export
  const handleExportCsv = useCallback(() => {
    exportDataTableToCsv(columns, sortedData, exportFileName);
  }, [columns, sortedData, exportFileName]);

  // Pagination calculation
  const totalItems = sortedData.length;
  const totalPages = enablePagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, enablePagination, safeCurrentPage, pageSize]);

  const allCurrentKeys = useMemo(() => paginatedData.map((item) => keyExtractor(item)), [paginatedData, keyExtractor]);
  const isAllExpanded = allCurrentKeys.length > 0 && allCurrentKeys.every((key) => expandedIds.has(key));

  // Expand All / Collapse All
  const handleExpandAll = useCallback(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      allCurrentKeys.forEach((key) => isAllExpanded ? next.delete(key) : next.add(key));
      return next;
    });
  }, [allCurrentKeys, isAllExpanded]);

  // Selection
  const isAllSelected = allCurrentKeys.length > 0 && allCurrentKeys.every((k) => activeSelectedIds.has(k));
  const isSomeSelected = allCurrentKeys.some((k) => activeSelectedIds.has(k)) && !isAllSelected;

  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      const next = new Set(activeSelectedIds);
      allCurrentKeys.forEach((k) => next.delete(k));
      setActiveSelectedIds(next);
    } else {
      const next = new Set(activeSelectedIds);
      allCurrentKeys.forEach((k) => next.add(k));
      setActiveSelectedIds(next);
    }
  }, [isAllSelected, allCurrentKeys, activeSelectedIds, setActiveSelectedIds]);

  // Ref zamiast zależności od zaznaczenia: handler jest stabilny, więc zmemoizowane wiersze nie renderują się wszystkie naraz.
  const selectedIdsRef = useRef(activeSelectedIds);
  selectedIdsRef.current = activeSelectedIds;
  const handleToggleSelectRow = useCallback(
    (key: string) => {
      const next = new Set(selectedIdsRef.current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setActiveSelectedIds(next);
    },
    [setActiveSelectedIds]
  );

  const hasExpandable = Boolean(renderSubComponent);
  const total = totalCount ?? data.length;

  return (
    <div className={cn("border border-border rounded-[3px] overflow-hidden bg-card shadow-none select-none", className)}>
      {/* Top Toolbar */}
      <DataTableToolbar
        presetFilters={presetFilters}
        onResetPage={() => setCurrentPage(1)}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        searchQuery={internalSearch}
        onSearchChange={setInternalSearch}
        sortedCount={sortedData.length}
        totalCount={total}
        entityLabel={entityLabel}
        enableExport={enableExport}
        onExportCsv={handleExportCsv}
        showDensityToggle={showDensityToggle}
        density={effectiveDensity}
        onToggleDensity={toggleGlobalDensity}
        headerRightActions={headerRightActions}
        hasExpandable={hasExpandable}
        hasRows={paginatedData.length > 0}
        isAllExpanded={isAllExpanded}
        onToggleExpandAll={handleExpandAll}
      />

      {/* Main Table Content */}
      {isLoading ? (
        <div className="p-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted/40 animate-pulse rounded-[2px]" />
          ))}
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="p-4">
          {emptyState ?? (
            <EmptyState
              title={`Brak ${entityLabel}`}
              description="Brak danych spełniających wybrane kryteria filtrowania."
              className="py-10 border-0"
            />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <DataTableHeader
              columns={columns}
              hasExpandable={hasExpandable}
              selectable={selectable}
              isAllSelected={isAllSelected}
              isSomeSelected={isSomeSelected}
              onToggleSelectAll={handleToggleSelectAll}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              density={effectiveDensity}
            />
            <tbody className="divide-y divide-border/40">
              {paginatedData.map((item, index) => {
                const key = keyExtractor(item);
                const isExpanded = expandedIds.has(key);
                const isSelected = activeSelectedIds.has(key);

                return (
                  <DataTableRow
                    key={key}
                    item={item}
                    index={index}
                    columns={columns}
                    rowKey={key}
                    isSelected={isSelected}
                    isExpanded={isExpanded}
                    selectable={selectable}
                    hasExpandable={hasExpandable}
                    onRowClick={onRowClick}
                    onToggleSelectRow={handleToggleSelectRow}
                    onToggleRow={toggleRow}
                    renderSubComponent={renderSubComponent}
                    rowClassName={rowClassName}
                    density={effectiveDensity}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Pagination */}
      {enablePagination && totalItems > 0 && (
        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
