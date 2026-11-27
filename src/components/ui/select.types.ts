import type React from "react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
  disabled?: boolean;
}

export type SelectOptionInput = string | SelectOption;

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOptionInput[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  helperText?: string;
  id?: string;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
  emptyText?: string;
  /**
   * Akcja „dodaj nową pozycję” na dole listy (np. nowa grupa odbiorców). Dostaje wpisaną frazę wyszukiwania,
   * żeby okno dodawania mogło ją podpowiedzieć jako nazwę.
   */
  onCreate?: (query: string) => void;
  /** Podpis akcji dodawania; domyślnie „Dodaj nową pozycję”. */
  createLabel?: (query: string) => string;
}
