import type React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { AutocompleteOption } from "./autocompleteUtils";
import { renderHighlightedText } from "./autocompleteUtils";

export interface AutocompleteDropdownProps {
  listboxId: string;
  dropdownClassName?: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  filteredOptions: AutocompleteOption[];
  groupedOptions: { name?: string; options: AutocompleteOption[] }[];
  flatSelectableOptions: AutocompleteOption[];
  inputValue: string;
  highlightedIndex: number;
  setHighlightedIndex: (idx: number) => void;
  handleSelect: (opt: AutocompleteOption) => void;
  allowCustomValue?: boolean;
  emptyText: string;
  createLabelPrefix: string;
  exactMatchExists: boolean;
  handleCreateCustom: () => void;
  highlightMatches?: boolean;
}

export function AutocompleteDropdown({
  listboxId,
  dropdownClassName,
  listRef,
  filteredOptions,
  groupedOptions,
  flatSelectableOptions,
  inputValue,
  highlightedIndex,
  setHighlightedIndex,
  handleSelect,
  allowCustomValue,
  emptyText,
  createLabelPrefix,
  exactMatchExists,
  handleCreateCustom,
  highlightMatches = true,
}: AutocompleteDropdownProps) {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full min-w-[240px] rounded-[3px] border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100",
        dropdownClassName
      )}
    >
      <div
        id={listboxId}
        role="listbox"
        ref={listRef}
        className="max-h-72 overflow-y-auto p-1 text-xs space-y-0.5 focus:outline-none select-none scrollbar-thin"
      >
        {groupedOptions.map((group, gIdx) => (
              <div key={group.name || `group-${gIdx}`} role={group.name ? "group" : undefined} aria-label={group.name} className="space-y-0.5">
                {group.name && (
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted/30 rounded">
                    {group.name}
                  </div>
                )}

                {group.options.map((opt) => {
                  const isSelected =
                    opt.label.toLowerCase() === inputValue.toLowerCase();
                  const flatIdx = flatSelectableOptions.findIndex(
                    (o) => o.value === opt.value
                  );
                  const isHighlighted = flatIdx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      id={flatIdx >= 0 ? `${listboxId}-option-${flatIdx}` : undefined}
                      role="option"
                      data-index={flatIdx >= 0 ? flatIdx : undefined}
                      data-highlighted={isHighlighted ? "true" : undefined}
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => !opt.disabled && handleSelect(opt)}
                      onMouseEnter={() =>
                        !opt.disabled && setHighlightedIndex(flatIdx)
                      }
                      className={cn(
                        "relative flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : isHighlighted
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted/50",
                        opt.disabled &&
                          "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                        {opt.icon && (
                          <opt.icon
                            className={cn(
                              "size-3.5 shrink-0",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        )}
                        <div className="truncate">
                          <div className="truncate">
                            {renderHighlightedText(opt.label, inputValue, highlightMatches)}
                          </div>
                          {opt.description && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              {renderHighlightedText(
                                opt.description,
                                inputValue,
                                highlightMatches
                              )}
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
        ))}
      </div>
      {filteredOptions.length === 0 && (
        <div role="status" className="px-2 py-1 text-center text-xs text-muted-foreground">{emptyText}</div>
      )}
      {allowCustomValue && inputValue.trim() && !exactMatchExists && (
        <button
          type="button"
          onClick={handleCreateCustom}
          className={cn(
            "w-full flex items-center gap-2 rounded text-left cursor-pointer transition-colors text-[11px]",
            filteredOptions.length === 0
              ? "p-2 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20"
              : "p-1.5 px-2 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-t border-border/50"
          )}
        >
          <Plus className="size-3 shrink-0 text-primary" />
          <span className="truncate">
            {createLabelPrefix}{" "}
            <strong className="text-foreground font-bold">"{inputValue.trim()}"</strong>
          </span>
        </button>
      )}
    </div>
  );
}
