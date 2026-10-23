import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import { createTemplateColumns, type TemplateListRow } from "./TemplatesTableColumns";

interface TemplatesTableViewProps {
  templates: TemplateListRow[];
  totalCount: number;
  onUse: (template: OzipzTemplate) => void;
  onOpenEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function TemplatesTableView({
  templates,
  totalCount,
  onUse,
  onOpenEdit,
  onDelete,
  onClearFilters,
  isFiltered,
}: TemplatesTableViewProps) {
  const columns = useMemo(
    () => createTemplateColumns({ onUse, onEdit: onOpenEdit, onDelete }),
    [onUse, onOpenEdit, onDelete]
  );

  return (
    <DataTable
      data={templates}
      columns={columns}
      keyExtractor={(item) => item.id}
      defaultSortField="title"
      defaultSortDirection="asc"
      entityLabel="szablonów"
      totalCount={totalCount}
      enablePagination={true}
      defaultPageSize={25}
      enableExport={true}
      exportFileName="szablony_zadan_ozipz.csv"
      onRowClick={onOpenEdit}
      emptyState={
        <EmptyState
          icon={FileText}
          title={isFiltered ? "Brak szablonów spełniających kryteria" : "Brak szablonów"}
          description={
            isFiltered
              ? "Zmień kryteria wyszukiwania lub filtr formy działania."
              : "Szablon zapamiętuje to, co się powtarza: formę, program, odbiorców, materiały i opis. Utwórz go tutaj albo w formularzu działania przyciskiem „Zapisz jako szablon”."
          }
          actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
          onAction={isFiltered ? onClearFilters : undefined}
        />
      }
    />
  );
}
