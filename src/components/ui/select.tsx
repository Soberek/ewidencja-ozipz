import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { SelectOption, SelectOptionInput, SelectProps } from "./select.types";
import { SelectDropdown } from "./SelectDropdown";

export type { SelectOption, SelectOptionInput, SelectProps };

export function Select({
  value = "",
  onChange,
  options,
  placeholder = "-- Wybierz opcję --",
  searchPlaceholder = "Szukaj...",
  searchable = true,
  clearable = false,
  disabled = false,
  error,
  className,
  triggerClassName,
  dropdownClassName,
  size = "md",
  label,
  helperText,
  id,
  name,
  required,
  autoFocus,
  emptyText = "Brak pasujących wyników",
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalizacja opcji do postaci SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Wybrana opcja
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filtrowane opcje na podstawie wyszukiwania
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const valueMatch = opt.value.toLowerCase().includes(q);
      const descMatch = opt.description ? opt.description.toLowerCase().includes(q) : false;
      const groupMatch = opt.group ? opt.group.toLowerCase().includes(q) : false;
      return labelMatch || valueMatch || descMatch || groupMatch;
    });
  }, [normalizedOptions, searchQuery]);

  // Grupowanie opcji
  const groupedOptions = useMemo(() => {
    const groups: { name?: string; options: SelectOption[] }[] = [];
    const groupMap = new Map<string, SelectOption[]>();
    const ungrouped: SelectOption[] = [];

    filteredOptions.forEach((opt) => {
      if (opt.group) {
        const list = groupMap.get(opt.group) || [];
        list.push(opt);
        groupMap.set(opt.group, list);
      } else {
        ungrouped.push(opt);
      }
    });

    if (ungrouped.length > 0) {
      groups.push({ options: ungrouped });
    }

    groupMap.forEach((opts, groupName) => {
      groups.push({ name: groupName, options: opts });
    });

    return groups;
  }, [filteredOptions]);

  // Płaska lista opcji do nawigacji klawiaturą
  const flatSelectableOptions = useMemo(() => {
    return groupedOptions.flatMap((group) => group.options).filter((opt) => !opt.disabled);
  }, [groupedOptions]);

  // Kliknięcie poza komponentem zamyka listę
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Po otwarciu skup focus na polu wyszukiwania
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
      }
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  // Wybór wartości
  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Wyczyszczenie wartości
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.("");
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Obsługa nawigacji klawiaturą
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatSelectableOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : flatSelectableOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < flatSelectableOptions.length) {
          handleSelect(flatSelectableOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Scroll do podświetlonej opcji
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl =
        listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`) ??
        (listRef.current.children[highlightedIndex] as HTMLElement | undefined);
      if (typeof activeEl?.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Klasy rozmiarów
  const sizeClasses = {
    sm: "h-7 text-xs px-2 py-0.5",
    md: "h-8 text-xs px-2.5 py-1",
    lg: "h-9 text-sm px-3 py-1.5",
  }[size];

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Etykieta formularza */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-foreground mb-1 select-none"
        >
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}

      {/* Trigger Button */}
      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          autoFocus={autoFocus}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          role={searchable ? undefined : "combobox"}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${selectId}-listbox` : undefined}
          aria-activedescendant={
            !searchable && isOpen && flatSelectableOptions[highlightedIndex]
              ? `${selectId}-listbox-option-${highlightedIndex}`
              : undefined
          }
          aria-required={required || undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={errorMessage || helperText ? `${selectId}-hint` : undefined}
          className={cn(
            "w-full flex items-center justify-between rounded-[3px] border bg-background text-foreground transition-colors duration-150 select-none text-left",
            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
            hasError
              ? "border-destructive text-destructive focus:ring-destructive/20 focus:border-destructive"
              : "border-input hover:border-muted-foreground/40",
            disabled && "opacity-50 cursor-not-allowed bg-muted/50",
            sizeClasses,
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
            {selectedOption?.icon && (
              <selectedOption.icon className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {selectedOption ? (
              <span className="truncate font-medium">{selectedOption.label}</span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
            {selectedOption?.badge && (
              <Badge
                variant={selectedOption.badgeVariant || "secondary"}
                className="text-[10px] px-1.5 py-0 shrink-0 uppercase tracking-wider"
              >
                {selectedOption.badge}
              </Badge>
            )}
          </div>

          <div className={cn("flex items-center gap-1 shrink-0 ml-1.5", clearable && selectedOption && !disabled && "ml-7")}>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180 text-foreground"
              )}
            />
          </div>
        </button>

        {clearable && selectedOption && !disabled && (
          <button
            type="button"
            aria-label="Wyczyść wybór"
            onClick={handleClear}
            className="absolute right-7 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Helper text / Error message */}
      {(errorMessage || helperText) && (
        <p
          id={`${selectId}-hint`}
          className={cn(
            "text-[11px] mt-1 select-none",
            hasError ? "text-destructive font-medium" : "text-muted-foreground"
          )}
        >
          {errorMessage || helperText}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <SelectDropdown
          listboxId={`${selectId}-listbox`}
          dropdownClassName={dropdownClassName}
          searchable={searchable}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setHighlightedIndex={setHighlightedIndex}
          searchInputRef={searchInputRef}
          listRef={listRef}
          handleKeyDown={handleKeyDown}
          searchPlaceholder={searchPlaceholder}
          filteredOptions={filteredOptions}
          groupedOptions={groupedOptions}
          flatSelectableOptions={flatSelectableOptions}
          value={value}
          highlightedIndex={highlightedIndex}
          handleSelect={handleSelect}
          emptyText={emptyText}
        />
      )}
    </div>
  );
}

export const SearchableSelect = Select;
