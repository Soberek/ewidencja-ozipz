import type React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { SelectOption } from "./select.types";

export interface SelectDropdownProps {
  listboxId: string;
  dropdownClassName?: string;
  searchable: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setHighlightedIndex: (idx: number) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  searchPlaceholder: string;
  filteredOptions: SelectOption[];
  groupedOptions: { name?: string; options: SelectOption[] }[];
  flatSelectableOptions: SelectOption[];
  value: string;
  highlightedIndex: number;
  handleSelect: (val: string) => void;
  emptyText: string;
}

export function SelectDropdown({
  listboxId,
  dropdownClassName,
  searchable,
  searchQuery,
  setSearchQuery,
  setHighlightedIndex,
  searchInputRef,
  listRef,
  handleKeyDown,
  searchPlaceholder,
  filteredOptions,
  groupedOptions,
  flatSelectableOptions,
  value,
  highlightedIndex,
  handleSelect,
  emptyText,
}: SelectDropdownProps) {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full min-w-[200px] rounded-[3px] border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100",
        dropdownClassName
      )}
    >
      {/* Search Bar */}
      {searchable && (
        <div className="p-1.5 border-b border-border/60 bg-muted/20">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              aria-controls={listboxId}
              aria-activedescendant={flatSelectableOptions[highlightedIndex] ? `${listboxId}-option-${highlightedIndex}` : undefined}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              className="w-full h-7 pl-8 pr-2.5 text-xs bg-background rounded border border-input focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Wyczyść wyszukiwanie"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Options List */}
      <div
        ref={listRef}
        id={listboxId}
        role="listbox"
        className="max-h-60 overflow-y-auto p-1 text-xs space-y-0.5 focus:outline-none select-none scrollbar-thin"
      >
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          groupedOptions.map((group, gIdx) => (
            <div key={group.name || `group-${gIdx}`} role={group.name ? "group" : undefined} aria-label={group.name} className="space-y-0.5">
              {group.name && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted/30 rounded">
                  {group.name}
                </div>
              )}

              {group.options.map((opt) => {
                const isSelected = opt.value === value;
                const flatIdx = flatSelectableOptions.findIndex((o) => o.value === opt.value);
                const isHighlighted = flatIdx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    id={flatIdx >= 0 ? `${listboxId}-option-${flatIdx}` : undefined}
                    data-index={flatIdx >= 0 ? flatIdx : undefined}
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => !opt.disabled && setHighlightedIndex(flatIdx)}
                    className={cn(
                      "relative flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted/50",
                      opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      {opt.icon && (
                        <opt.icon
                          className={cn(
                            "size-3.5 shrink-0",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      )}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <Badge
                          variant={opt.badgeVariant || "outline"}
                          className="text-[9px] px-1 py-0 uppercase"
                        >
                          {opt.badge}
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="size-3.5 text-primary shrink-0 animate-in zoom-in-50 duration-100" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
