import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Download, Rows, Search, X } from "lucide-react";
import type { PresetFilterOption, TableDensity } from "./types";

export interface DataTableToolbarProps {
  presetFilters?: {
    presets: PresetFilterOption[];
    activePreset?: string;
    onPresetChange: (presetId: string) => void;
  };
  onResetPage?: () => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortedCount: number;
  totalCount: number;
  entityLabel: string;
  enableExport?: boolean;
  onExportCsv?: () => void;
  showDensityToggle?: boolean;
  density: TableDensity;
  onToggleDensity: () => void;
  headerRightActions?: React.ReactNode;
  hasExpandable?: boolean;
  hasRows?: boolean;
  isAllExpanded?: boolean;
  onToggleExpandAll?: () => void;
}

export function DataTableToolbar({
  presetFilters,
  onResetPage,
  enableSearch,
  searchPlaceholder = "Filtruj wiersze...",
  searchQuery,
  onSearchChange,
  sortedCount,
  totalCount,
  entityLabel,
  enableExport,
  onExportCsv,
  showDensityToggle = true,
  density,
  onToggleDensity,
  headerRightActions,
  hasExpandable,
  hasRows,
  isAllExpanded,
  onToggleExpandAll,
}: DataTableToolbarProps) {
  return (
    <div className="p-2 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Lewa strona: Filtry presetów lub wyszukiwarka lub licznik */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {presetFilters && presetFilters.presets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Filtr:
            </span>
            {presetFilters.presets.map((preset) => {
              const isActive = presetFilters.activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    presetFilters.onPresetChange(preset.id);
                    onResetPage?.();
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-[2px] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                    isActive
                      ? preset.activeClass || "bg-foreground text-background shadow-none"
                      : preset.badgeClass || "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                  {preset.count !== undefined && <span className="opacity-90">({preset.count})</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
            Liczba pozycji: <strong className="text-foreground">{sortedCount}</strong>
          </span>
        )}

        {enableSearch && (
          <div className="relative max-w-xs min-w-[140px] flex-1">
            <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onResetPage?.();
              }}
              className="h-7 pl-6.5 pr-6 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onResetPage?.();
                }}
                className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                title="Wyczyść wyszukiwanie"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prawa strona: statystyki, eksport, gęstość, dodatkowe akcje, rozwiń/zwiń */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {presetFilters && (
          <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline mr-1">
            Wyświetlono: <strong className="text-foreground">{sortedCount}</strong> z {totalCount} {entityLabel}
          </span>
        )}

        {enableExport && sortedCount > 0 && onExportCsv && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground font-semibold gap-1 cursor-pointer"
            title="Eksportuj widoczne dane do pliku CSV"
          >
            <Download className="size-3" />
            <span>CSV</span>
          </Button>
        )}

        {showDensityToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleDensity}
            className={cn(
              "h-6 px-1.5 text-[11px] font-semibold gap-1 transition-colors cursor-pointer",
              density === "compact"
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={
              density === "compact"
                ? "Gęstość: Zwarty (kliknij, aby zmienić na standardowy)"
                : "Gęstość: Standardowy (kliknij, aby zmienić na zwarty)"
            }
          >
            <Rows className="size-3" />
            <span className="hidden sm:inline">
              {density === "compact" ? "Zwarty" : "Standard"}
            </span>
          </Button>
        )}

        {headerRightActions}

        {hasExpandable && hasRows && onToggleExpandAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleExpandAll}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
          >
            {isAllExpanded ? "Zwiń wszystkie" : "Rozwiń wszystkie"}
          </Button>
        )}
      </div>
    </div>
  );
}
