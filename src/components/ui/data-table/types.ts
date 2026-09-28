import React from "react";

export type SortDirection = "asc" | "desc";
export type TableDensity = "compact" | "normal";

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (props: { row: T; index: number; isExpanded: boolean; isSelected: boolean; density?: TableDensity }) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
}

export interface PresetFilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badgeClass?: string;
  activeClass?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (item: T) => string;
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;
  onRowClick?: (item: T) => void;
  renderSubComponent?: (props: { row: T; isExpanded: boolean }) => React.ReactNode;
  presetFilters?: {
    activePreset: string;
    onPresetChange: (presetId: string) => void;
    presets: PresetFilterOption[];
  };
  totalCount?: number;
  entityLabel?: string;
  emptyState?: React.ReactNode;
  className?: string;
  headerRightActions?: React.ReactNode;
  rowClassName?: (item: T, isExpanded: boolean, isSelected: boolean) => string;
  isLoading?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enablePagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  density?: TableDensity;
  showDensityToggle?: boolean;
  enableExport?: boolean;
  exportFileName?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}
