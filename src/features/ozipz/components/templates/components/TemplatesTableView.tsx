import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import { createTemplateColumns } from "./TemplatesTableColumns";

interface TemplatesTableViewProps {
  templates: OzipzTemplate[];
  totalCount: number;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onPreview: (template: OzipzTemplate) => void;
  onOpenEdit: (template: OzipzTemplate) => void;
  onDelete: (id: string) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function TemplatesTableView({
  templates,
  totalCount,
  copiedId,
  onCopy,
  onPreview,
  onOpenEdit,
  onDelete,
  onClearFilters,
  isFiltered,
}: TemplatesTableViewProps) {
  const columns = useMemo(
    () =>
      createTemplateColumns({
        copiedId,
        onCopy,
        onPreview,
        onEdit: onOpenEdit,
        onDelete,
      }),
    [copiedId, onCopy, onPreview, onOpenEdit, onDelete]
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
      exportFileName="szablony_opisow_ozipz.csv"
      onRowClick={onPreview}
      emptyState={
        <EmptyState
          icon={FileText}
          title={isFiltered ? "Brak szablonów spełniających kryteria" : "Brak szablonów w bazie"}
          description={
            isFiltered
              ? "Zmień kryteria wyszukiwania lub filtr formy działania."
              : "Zdefiniuj pierwszy wzorcowy szablon opisu merytorycznego do wykorzystania w rejestrze działań."
          }
          actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
          onAction={isFiltered ? onClearFilters : undefined}
        />
      }
    />
  );
}
