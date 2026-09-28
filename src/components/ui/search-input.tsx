import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./input";

export interface SearchInputProps extends Omit<InputProps, "value" | "onChange" | "type" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Klasy kontenera (szerokość pola w pasku filtrów). */
  containerClassName?: string;
  size?: "sm" | "md";
}

/** Pole wyszukiwania z ikoną lupy i przyciskiem czyszczenia — jedno źródło dla wszystkich pasków filtrów. */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      containerClassName,
      className,
      size = "md",
      placeholder = "Szukaj...",
      "aria-label": ariaLabel,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const isSmall = size === "sm";
    return (
      <div className={cn("relative min-w-[200px] flex-1 max-w-sm", containerClassName)}>
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            isSmall ? "left-2 size-3" : "left-2.5 size-3.5"
          )}
        />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) {
              event.stopPropagation();
              onValueChange("");
            }
            onKeyDown?.(event);
          }}
          placeholder={placeholder}
          aria-label={ariaLabel ?? (typeof placeholder === "string" ? placeholder : "Szukaj")}
          className={cn(isSmall ? "h-7 pl-6.5 pr-6" : "h-8 pl-8 pr-8", className)}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => onValueChange("")}
            aria-label="Wyczyść wyszukiwanie"
            title="Wyczyść wyszukiwanie"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
              isSmall ? "right-1 size-5" : "right-1.5 size-6"
            )}
          >
            <X className={isSmall ? "size-3" : "size-3.5"} />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
