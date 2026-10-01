import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActiveFilterItem {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActionsFilterChipsProps {
  filters: ActiveFilterItem[];
  /** Przywraca widok domyślny (bieżący miesiąc, aktywne działania, publikacje schowane). */
  onClearAll: () => void;
}

export function ActionsFilterChips({
  filters,
  onClearAll,
}: ActionsFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs select-none">
      <span className="text-[11px] font-semibold text-muted-foreground mr-0.5">
        Aktywne filtry:
      </span>

      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="h-6 gap-1 pl-2 pr-1 text-[11px] font-medium bg-muted border border-border text-foreground hover:bg-muted/80 transition-colors"
        >
          <span>
            <strong className="font-semibold text-muted-foreground">{filter.label}:</strong> {filter.value}
          </span>
          <button
            type="button"
            onClick={filter.onRemove}
            className="rounded-full p-0.5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={`Usuń filtr ${filter.label}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-semibold cursor-pointer"
      >
        Wyczyść filtry ({filters.length})
      </Button>
    </div>
  );
}
