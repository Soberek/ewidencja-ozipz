import { useId, forwardRef } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AutocompleteOption,
  AutocompleteOptionInput,
  AutocompleteProps,
} from "./autocompleteUtils";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { useAutocompleteState } from "./useAutocompleteState";

export type { AutocompleteOption, AutocompleteOptionInput, AutocompleteProps };

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      value = "",
      onChange,
      onSelectOption,
      options,
      placeholder,
      searchPlaceholder,
      clearable = true,
      allowCustomValue = true,
      highlightMatches = true,
      maxSuggestions = 500,
      loading = false,
      error,
      className,
      inputClassName,
      dropdownClassName,
      size = "md",
      label,
      helperText,
      id,
      name,
      required,
      disabled,
      autoFocus,
      emptyText = "Brak podpowiedzi",
      createLabelPrefix = "Użyj wartości:",
      onCreateOption,
      startIcon: StartIcon,
      onBlur,
      onFocus,
      onKeyDown,
      ...restInputProps
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const listboxId = `${inputId}-listbox`;
    const descriptionId = `${inputId}-description`;
    const effectivePlaceholder = placeholder || searchPlaceholder || "Wpisz lub wybierz z listy...";

    const {
      inputValue,
      isOpen,
      setIsOpen,
      highlightedIndex,
      setHighlightedIndex,
      containerRef,
      internalInputRef,
      listRef,
      filteredOptions,
      exactMatchExists,
      groupedOptions,
      flatSelectableOptions,
      handleInputChange,
      handleSelect,
      handleCreateCustom,
      handleClear,
      handleKeyDownInternal,
      handleClose,
    } = useAutocompleteState({
      value,
      options,
      onChange,
      onSelectOption,
      onCreateOption,
      allowCustomValue,
      maxSuggestions,
      disabled,
      onKeyDown,
    });


    // Rozmiary inputa
    const sizeClasses = {
      sm: "h-7 text-xs px-2.5 py-1",
      md: "h-9 text-xs px-3 py-1.5",
      lg: "h-10 text-sm px-3.5 py-2",
    }[size];

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div
        className={cn("relative w-full text-left font-sans", className)}
        ref={containerRef}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) handleClose();
        }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-foreground mb-1 select-none"
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {StartIcon && (
            <div className="absolute left-2.5 text-muted-foreground pointer-events-none">
              <StartIcon className="size-3.5" />
            </div>
          )}

          <input
            {...restInputProps}
            ref={(node) => {
              internalInputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            name={name}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={(e) => {
              setIsOpen(true);
              onFocus?.(e);
            }}
            onBlur={onBlur}
            onKeyDown={handleKeyDownInternal}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              isOpen && highlightedIndex >= 0 && highlightedIndex < flatSelectableOptions.length
                ? `${listboxId}-option-${highlightedIndex}`
                : undefined
            }
            aria-invalid={hasError || restInputProps["aria-invalid"]}
            aria-describedby={
              [restInputProps["aria-describedby"], (errorMessage || helperText) && descriptionId]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              "w-full rounded-[3px] border bg-background text-foreground transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
              "placeholder:text-muted-foreground",
              hasError
                ? "border-destructive text-destructive focus:ring-destructive/20 focus:border-destructive"
                : "border-input hover:border-muted-foreground/40",
              disabled && "opacity-50 cursor-not-allowed bg-muted/50",
              sizeClasses,
              StartIcon && "pl-8",
              (clearable || loading) && "pr-8",
              inputClassName
            )}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            {clearable && inputValue && !disabled && !loading && (
              <button
                type="button"
                aria-label="Wyczyść pole"
                onClick={handleClear}
                className="size-7 inline-flex items-center justify-center rounded-[2px] hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {(errorMessage || helperText) && (
          <p
            id={descriptionId}
            className={cn(
              "text-[11px] mt-1 select-none",
              hasError ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            {errorMessage || helperText}
          </p>
        )}

        {isOpen && (
          <AutocompleteDropdown
            listboxId={listboxId}
            dropdownClassName={dropdownClassName}
            listRef={listRef}
            filteredOptions={filteredOptions}
            groupedOptions={groupedOptions}
            flatSelectableOptions={flatSelectableOptions}
            inputValue={inputValue}
            highlightedIndex={highlightedIndex}
            setHighlightedIndex={setHighlightedIndex}
            handleSelect={handleSelect}
            allowCustomValue={allowCustomValue}
            emptyText={emptyText}
            createLabelPrefix={createLabelPrefix}
            exactMatchExists={exactMatchExists}
            handleCreateCustom={handleCreateCustom}
            highlightMatches={highlightMatches}
          />
        )}
      </div>
    );
  }
);

Autocomplete.displayName = "Autocomplete";
