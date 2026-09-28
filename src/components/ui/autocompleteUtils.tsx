import type React from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
  disabled?: boolean;
}

export type AutocompleteOptionInput = string | AutocompleteOption;

export interface AutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value?: string;
  onChange?: (value: string) => void;
  onSelectOption?: (option: AutocompleteOption) => void;
  options: AutocompleteOptionInput[];
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
  allowCustomValue?: boolean;
  highlightMatches?: boolean;
  maxSuggestions?: number;
  loading?: boolean;
  error?: boolean | string;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  helperText?: string;
  required?: boolean;
  emptyText?: string;
  createLabelPrefix?: string;
  onCreateOption?: (value: string) => void;
  startIcon?: React.ComponentType<{ className?: string }>;
}

export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l")
    .trim();
}

export function renderHighlightedText(text: string, query: string, highlightMatches = true): React.ReactNode {
  if (!highlightMatches || !query.trim()) return text;
  const q = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <strong className="text-primary font-bold bg-primary/10 rounded-[1px] px-0.5">
        {match}
      </strong>
      {after}
    </>
  );
}
