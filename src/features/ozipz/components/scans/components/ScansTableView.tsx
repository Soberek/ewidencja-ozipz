import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FileSearch } from "lucide-react";
import type { OzipzScan } from "../../../types/ozipz.types";
import { createScanColumns } from "./ScansTableColumns";

interface ScansTableViewProps {
  scans: OzipzScan[];
  totalCount: number;
  onDelete: (id: string) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function ScansTableView({
  scans,
  totalCount,
  onDelete,
  onClearFilters,
  isFiltered,
}: ScansTableViewProps) {
  const columns = useMemo(
    () =>
      createScanColumns({
        onDelete,
      }),
    [onDelete]
  );

  return (
    <DataTable
      data={scans}
      columns={columns}
      keyExtractor={(item) => item.id}
      defaultSortField="scanDate"
      defaultSortDirection="desc"
      entityLabel="skanów PDF"
      totalCount={totalCount}
      enablePagination={true}
      defaultPageSize={25}
      enableExport={true}
      exportFileName="rejestr_skanow_ozipz.csv"
      emptyState={
        <EmptyState
          icon={FileSearch}
          title={isFiltered ? "Brak skanów spełniających kryteria" : "Brak skanów w archiwum"}
          description={
            isFiltered
              ? "Zmień parametry wyszukiwania lub filtru typu dokumentu."
              : "Zarejestruj pierwszy skan sprawozdania, zgody lub protokołu z placówki."
          }
          actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
          onAction={isFiltered ? onClearFilters : undefined}
        />
      }
    />
  );
}
