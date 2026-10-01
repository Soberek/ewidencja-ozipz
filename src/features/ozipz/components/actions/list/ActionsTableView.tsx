import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import "./actions-table.css";
import { DataTable, type ColumnDef, type TableDensity } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, RotateCcw } from "lucide-react";
import type { OzipzAction } from "../../../types/ozipz.types";
import { INSTITUTION_FILE_PREFIX } from "../../../constants";
import { cn } from "@/lib/utils";

// Stała referencja (stan zaznaczenia przychodzi z DataTable), żeby wiersze mogły pomijać zbędne rendery.
const actionRowClassName = (row: OzipzAction, _isExpanded: boolean, isSelected: boolean) =>
  cn(
    isSelected
      ? "bg-primary/10 hover:bg-primary/15 font-medium border-l-2 border-l-primary cursor-pointer transition-colors"
      : "hover:bg-muted/40 cursor-pointer transition-colors",
    // Dystrybucja zapisana razem z innym działaniem: pasek z lewej, żeby było widać, że to „dodatek” do tamtego wiersza.
    row.linkedActionId && "[&>td:first-child]:shadow-[inset_3px_0_0_#b45309]"
  );

export interface ActionsTableViewProps {
  filteredActions: OzipzAction[];
  columns: ColumnDef<OzipzAction>[];
  totalCount: number;
  /** Czy widok odbiega od domyślnego – bez tego pusta lista oznacza po prostu brak działań w bieżącym okresie. */
  hasActiveFilters?: boolean;
  selectedActionIds: Set<string>;
  onOpenEdit: (action: OzipzAction) => void;
  onClearFilters: () => void;
  onOpenAdd?: () => void;
  density?: TableDensity;
}

export function ActionsTableView({
  filteredActions,
  columns,
  totalCount,
  hasActiveFilters = true,
  selectedActionIds,
  onOpenEdit,
  onClearFilters,
  onOpenAdd,
  density,
}: ActionsTableViewProps) {
  const [fontSize, setFontSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("oz.actionsTableFontSize"));
      return Number.isInteger(saved) && saved >= 9 && saved <= 18 ? saved : 12;
    } catch { return 12; }
  });
  const changeFontSize = (value: number) => {
    setFontSize(value);
    try { localStorage.setItem("oz.actionsTableFontSize", String(value)); } catch { /* Rozmiar nadal działa w bieżącym widoku. */ }
  };
  if (filteredActions.length === 0) {
    if (totalCount && hasActiveFilters) {
      return (
        <EmptyState
          icon={Activity}
          title="Brak działań edukacyjnych spełniających kryteria"
          description="Zmień filtry wyszukiwania albo wróć do widoku domyślnego."
          actionLabel="Wyczyść filtry"
          onAction={onClearFilters}
        />
      );
    }
    return (
      <EmptyState
        icon={Activity}
        title={totalCount ? "Brak działań w bieżącym miesiącu" : "Brak zarejestrowanych działań"}
        description={totalCount ? "Wybierz inny okres lub rok, albo dodaj nowe działanie." : "Dodaj pierwsze działanie edukacyjne."}
        actionLabel="Dodaj działanie"
        onAction={onOpenAdd}
      />
    );
  }

  return (
    <div className="actions-register" style={{ "--actions-font-size": `${fontSize}px` } as CSSProperties}>
    <DataTable
      className="[&_th]:border-r [&_th]:border-border [&_td]:border-r [&_td]:border-border/70 [&_td]:align-middle [&_tbody_tr:nth-child(even)]:bg-blue-50/60 dark:[&_tbody_tr:nth-child(even)]:bg-slate-900/40"
      data={filteredActions}
      columns={columns}
      density={density}
      entityLabel="działań"
      defaultSortField="date"
      defaultSortDirection="desc"
      totalCount={totalCount}
      enablePagination={true}
      defaultPageSize={25}
      enableExport={true}
      exportFileName={`${INSTITUTION_FILE_PREFIX}_rejestr_dzialan_edukacyjnych.csv`}
      selectedIds={selectedActionIds}
      rowClassName={actionRowClassName}
      onRowClick={onOpenEdit}
      headerRightActions={
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Czcionka tabeli">
          <label htmlFor="actions-table-font-size" className="sr-only">Czcionka tabeli</label>
          <Button variant="outline" size="sm" className="h-6 px-1.5 text-[11px]" aria-label="Zmniejsz czcionkę tabeli" disabled={fontSize <= 9} onClick={() => changeFontSize(fontSize - 1)}>A−</Button>
          <input id="actions-table-font-size" type="range" min={9} max={18} step={1} value={fontSize} onChange={(event) => changeFontSize(Number(event.target.value))} className="w-16 accent-primary" />
          <output htmlFor="actions-table-font-size" className="w-8 tabular-nums">{fontSize} px</output>
          <Button variant="outline" size="sm" className="h-6 px-1.5 text-[11px]" aria-label="Zwiększ czcionkę tabeli" disabled={fontSize >= 18} onClick={() => changeFontSize(fontSize + 1)}>A+</Button>
          {fontSize !== 12 && (
            <Button variant="ghost" size="sm" className="h-6 px-1.5" aria-label="Przywróć 12 px" title="Przywróć 12 px" onClick={() => changeFontSize(12)}>
              <RotateCcw className="size-3" />
            </Button>
          )}
        </div>
      }
    />
    </div>
  );
}
