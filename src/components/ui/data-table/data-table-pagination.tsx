import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  return (
    <div className="p-2 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span>Wierszy na stronę:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-7 px-1.5 py-0.5 rounded-[2px] border border-input bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden sm:inline">
          Wyświetlanie {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, totalItems)} z {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[11px] mr-2">
          Strona <strong className="text-foreground">{currentPage}</strong> z{" "}
          <strong className="text-foreground">{totalPages}</strong>
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 p-0 cursor-pointer"
          title="Pierwsza strona"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 p-0 cursor-pointer"
          title="Poprzednia strona"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-7 w-7 p-0 cursor-pointer"
          title="Następna strona"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-7 w-7 p-0 cursor-pointer"
          title="Ostatnia strona"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
