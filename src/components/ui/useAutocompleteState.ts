import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type {
  AutocompleteOption,
  AutocompleteOptionInput,
} from "./autocompleteUtils";
import { normalizeForSearch } from "./autocompleteUtils";

export interface UseAutocompleteStateParams {
  value?: string;
  options: AutocompleteOptionInput[];
  onChange?: (value: string) => void;
  onSelectOption?: (option: AutocompleteOption) => void;
  onCreateOption?: (customValue: string) => void;
  allowCustomValue?: boolean;
  maxSuggestions?: number;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function useAutocompleteState({
  value = "",
  options,
  onChange,
  onSelectOption,
  onCreateOption,
  allowCustomValue = true,
  maxSuggestions = 500,
  disabled = false,
  onKeyDown,
}: UseAutocompleteStateParams) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Synchronizacja z zewnętrznym value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Normalizacja opcji do postaci AutocompleteOption[]
  const normalizedOptions: AutocompleteOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const lastValidValueRef = useRef("");
  useEffect(() => {
    if (!value || normalizedOptions.some((opt) => opt.label.toLowerCase().trim() === value.toLowerCase().trim())) {
      lastValidValueRef.current = value;
    }
  }, [normalizedOptions, value]);

  // Filtrowanie opcji na podstawie wpisanego tekstu
  const filteredOptions = useMemo(() => {
    const q = (inputValue || "").trim();
    if (!q) {
      return maxSuggestions ? normalizedOptions.slice(0, maxSuggestions) : normalizedOptions;
    }

    const tokens = normalizeForSearch(q).split(/\s+/).filter(Boolean);

    const matches = normalizedOptions.filter((opt) => {
      const combined = normalizeForSearch(
        `${opt.label} ${opt.value} ${opt.description || ""} ${opt.group || ""} ${opt.badge || ""}`
      );
      return tokens.every((token) => combined.includes(token));
    });

    return maxSuggestions ? matches.slice(0, maxSuggestions) : matches;
  }, [normalizedOptions, inputValue, maxSuggestions]);

  // Sprawdzenie czy wpisana wartość istnieje dokładnie na liście
  const exactMatchExists = useMemo(() => {
    const q = (inputValue || "").toLowerCase().trim();
    if (!q) return true;
    return normalizedOptions.some((opt) => opt.label.toLowerCase().trim() === q);
  }, [normalizedOptions, inputValue]);

  // Grupowanie opcji
  const groupedOptions = useMemo(() => {
    const groups: { name?: string; options: AutocompleteOption[] }[] = [];
    const groupMap = new Map<string, AutocompleteOption[]>();
    const ungrouped: AutocompleteOption[] = [];

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

  // Płaska lista opcji do nawigacji strzałkami
  const flatSelectableOptions = useMemo(() => {
    return groupedOptions.flatMap((group) => group.options).filter((opt) => !opt.disabled);
  }, [groupedOptions]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (!allowCustomValue) {
      if (exactMatchExists) {
        lastValidValueRef.current = inputValue;
      } else {
        setInputValue(lastValidValueRef.current);
        if (inputValue !== lastValidValueRef.current) onChange?.(lastValidValueRef.current);
      }
    }
  }, [allowCustomValue, exactMatchExists, inputValue, onChange]);

  // Zamknięcie po kliknięciu na zewnątrz
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Zmiana tekstu w inpucie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    onChange?.(newVal);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  // Wybór opcji z listy
  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      if (disabled || option.disabled) return;
      setInputValue(option.label);
      lastValidValueRef.current = option.label;
      onChange?.(option.label);
      onSelectOption?.(option);
      setIsOpen(false);
    },
    [disabled, onChange, onSelectOption]
  );

  // Wybór wartości niestandardowej
  const handleCreateCustom = useCallback(() => {
    const customVal = inputValue.trim();
    if (!customVal || disabled) return;
    onChange?.(customVal);
    onCreateOption?.(customVal);
    setIsOpen(false);
  }, [inputValue, disabled, onChange, onCreateOption]);

  // Czyszczenie
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue("");
      lastValidValueRef.current = "";
      onChange?.("");
      internalInputRef.current?.focus();
      setIsOpen(false);
    },
    [onChange]
  );

  // Klawiatura
  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
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
          handleSelect(flatSelectableOptions[highlightedIndex]);
        } else if (allowCustomValue && inputValue.trim()) {
          handleCreateCustom();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll do podświetlonej opcji
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-highlighted="true"]`
      ) as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return {
    inputValue,
    setInputValue,
    isOpen,
    setIsOpen,
    highlightedIndex,
    setHighlightedIndex,
    containerRef,
    internalInputRef,
    listRef,
    normalizedOptions,
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
  };
}
