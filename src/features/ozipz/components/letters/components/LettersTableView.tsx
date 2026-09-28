import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Mail } from "lucide-react";
import type { OzipzLetter } from "../../../types/ozipz.types";
import { createLetterColumns } from "./LettersTableColumns";

interface LettersTableViewProps {
  letters: OzipzLetter[];
  totalCount: number;
  onOpenEdit: (letter: OzipzLetter) => void;
  onDelete: (id: string) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function LettersTableView({
  letters,
  totalCount,
  onOpenEdit,
  onDelete,
  onClearFilters,
  isFiltered,
}: LettersTableViewProps) {
  const columns = useMemo(
    () =>
      createLetterColumns({
        onEdit: onOpenEdit,
        onDelete,
      }),
    [onOpenEdit, onDelete]
  );

  return (
    <DataTable
      data={letters}
      columns={columns}
      keyExtractor={(item) => item.id}
      defaultSortField="date"
      defaultSortDirection="desc"
      entityLabel="pism"
      totalCount={totalCount}
      enablePagination={true}
      defaultPageSize={25}
      enableExport={true}
      exportFileName="rejestr_pism_ozipz.csv"
      onRowClick={onOpenEdit}
      emptyState={
        <EmptyState
          icon={Mail}
          title={isFiltered ? "Brak pism spełniających kryteria" : "Brak zarejestrowanych pism"}
          description={
            isFiltered
              ? "Zmień kryteria wyszukiwania lub filtry kierunku korespondencji."
              : "Rozpocznij prowadzenie dziennika korespondencji, rejestrując pierwsze pismo."
          }
          actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
          onAction={isFiltered ? onClearFilters : undefined}
        />
      }
    />
  );
}
