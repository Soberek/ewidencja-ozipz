import { useState, useMemo } from "react";
import { Globe } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzPublication } from "../../../types/ozipz.types";
import { createPublicationColumns } from "./PublicationsTableColumns";

interface PublicationsTableViewProps {
  publications: OzipzPublication[];
  totalCount: number;
  onOpenEdit: (pub: OzipzPublication) => void;
  onDelete: (id: string) => void | Promise<void>;
  onOpenAction?: (pub: OzipzPublication) => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function PublicationsTableView({
  publications,
  totalCount,
  onOpenEdit,
  onDelete,
  onOpenAction,
  onClearFilters,
  isFiltered,
}: PublicationsTableViewProps) {
  const [deletingPublication, setDeletingPublication] = useState<OzipzPublication | null>(null);

  const columns = useMemo(
    () =>
      createPublicationColumns({
        onEdit: onOpenEdit,
        onRequestDelete: (pub) => setDeletingPublication(pub),
        onOpenAction,
      }),
    [onOpenEdit, onOpenAction]
  );

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <DataTable
        data={publications}
        columns={columns}
        keyExtractor={(item) => item.id}
        defaultSortField="date"
        defaultSortDirection="desc"
        entityLabel="publikacji"
        totalCount={totalCount}
        enablePagination={true}
        defaultPageSize={25}
        enableExport={true}
        exportFileName="rejestr_publikacji_ozipz.csv"
        onRowClick={onOpenEdit}
        emptyState={
          <EmptyState
            icon={Globe}
            title={isFiltered ? "Brak publikacji spełniających kryteria" : "Brak zarejestrowanych publikacji"}
            description={
              isFiltered
                ? "Zmień kryteria wyszukiwania lub filtry wybranego kanału medialnego."
                : "Zarejestruj pierwszą publikację lub pobierz posty automatycznie z portalu gov.pl lub platformy X."
            }
            actionLabel={isFiltered && onClearFilters ? "Wyczyść filtry" : undefined}
            onAction={isFiltered ? onClearFilters : undefined}
          />
        }
      />
      </TooltipProvider>

      <ConfirmDialog
        isOpen={Boolean(deletingPublication)}
        onClose={() => setDeletingPublication(null)}
        onConfirm={async () => {
          if (deletingPublication) {
            await onDelete(deletingPublication.id);
          }
        }}
        title="Potwierdź usunięcie publikacji"
        description={
          <span>
            Czy na pewno chcesz usunąć publikację{" "}
            <strong className="text-foreground">
              «{deletingPublication?.title || "Bez tytułu"}»
            </strong>{" "}
            z ewidencji medialnej? Ta operacja jest nieodwracalna.
          </span>
        }
        confirmText="Usuń publikację"
        variant="destructive"
      />
    </>
  );
}
