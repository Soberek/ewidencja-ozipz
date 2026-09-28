import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCog } from "lucide-react";
import type { OzipzStaff } from "../../../types/ozipz.types";
import { createStaffColumns } from "./StaffTableColumns";

interface StaffTableViewProps {
  staff: OzipzStaff[];
  totalCount: number;
  onOpenEdit: (staff: OzipzStaff) => void;
  onDelete: (id: string) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function StaffTableView({
  staff,
  totalCount,
  onOpenEdit,
  onDelete,
  onClearFilters,
  isFiltered,
}: StaffTableViewProps) {
  const columns = useMemo(
    () =>
      createStaffColumns({
        onEdit: onOpenEdit,
        onDelete,
      }),
    [onOpenEdit, onDelete]
  );

  return (
    <DataTable
      data={staff}
      columns={columns}
      keyExtractor={(item) => item.id}
      defaultSortField="name"
      defaultSortDirection="asc"
      entityLabel="pracowników"
      totalCount={totalCount}
      enablePagination={true}
      defaultPageSize={25}
      enableExport={true}
      exportFileName="kadra_ozipz.csv"
      onRowClick={onOpenEdit}
      emptyState={
        <EmptyState
          icon={UserCog}
          title={isFiltered ? "Brak pracowników spełniających kryteria" : "Brak pracowników w kadrze"}
          description={
            isFiltered
              ? "Zmień kryteria wyszukiwania lub filtry statusu pracownika."
              : "Dodaj pierwszego pracownika sekcji OZiPZ do bazy."
          }
          actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
          onAction={isFiltered ? onClearFilters : undefined}
        />
      }
    />
  );
}
