import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const DEFAULT_PAGE_SIZES = [25, 50, 100] as const;
const ELLIPSIS = "ellipsis";

export interface HealthPromotionPaginationProps {
  itemCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  label?: string;
}

type PageItem = number | typeof ELLIPSIS;

function getPageItems(page: number, pageCount: number): readonly PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  if (page <= 4) return [1, 2, 3, 4, 5, ELLIPSIS, pageCount];
  if (page >= pageCount - 3) return [1, ELLIPSIS, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, ELLIPSIS, page - 1, page, page + 1, ELLIPSIS, pageCount];
}

export function HealthPromotionPagination({
  itemCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  label = "Wiersze",
}: HealthPromotionPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  if (itemCount <= 25 && pageCount <= 1) return null;

  const currentPage = Math.min(Math.max(1, page), pageCount);
  const rangeStart = itemCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, itemCount);
  const pageItems = getPageItems(currentPage, pageCount);

  return (
    <Card className="rounded-[3px] border border-border bg-card shadow-none">
      <CardContent className="flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {label} <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> z <span className="font-semibold text-foreground">{itemCount}</span>
        </p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Na stronie</span>
            <select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-[3px] border border-input bg-background px-2 text-xs font-semibold text-foreground"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={String(opt)}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <nav aria-label="Paginacja rejestru działań" className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="size-7 rounded-[2px] border-input bg-background text-foreground hover:bg-muted"
              aria-label="Pierwsza strona"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-7 rounded-[2px] border-input bg-background text-foreground hover:bg-muted"
              aria-label="Poprzednia strona"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              {pageItems.map((item, index) =>
                item === ELLIPSIS ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    size="sm"
                    variant={item === currentPage ? "default" : "outline"}
                    className={cn(
                      "size-7 rounded-[2px] p-0 text-xs font-semibold transition-colors",
                      item === currentPage
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border-input bg-background text-foreground hover:bg-muted",
                    )}
                    aria-label={`Strona ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="size-7 rounded-[2px] border-input bg-background text-foreground hover:bg-muted"
              aria-label="Następna strona"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-7 rounded-[2px] border-input bg-background text-foreground hover:bg-muted"
              aria-label="Ostatnia strona"
              onClick={() => onPageChange(pageCount)}
              disabled={currentPage === pageCount}
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </nav>
        </div>
      </CardContent>
    </Card>
  );
}
