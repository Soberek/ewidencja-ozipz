import type { KeyboardEvent } from "react";

/**
 * Skróty zapisu w formularzu działania: ⌘/Ctrl+Enter zapisuje,
 * ⌘/Ctrl+Shift+Enter zapisuje i przygotowuje kolejne podobne działanie (tylko dla nowych wpisów).
 */
export function handleActionSaveShortcut(
  event: KeyboardEvent<HTMLFormElement>,
  { enabled, onSaveAndAddSimilar }: { enabled: boolean; onSaveAndAddSimilar?: () => void }
): void {
  if (!enabled || event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  if (event.shiftKey && onSaveAndAddSimilar) onSaveAndAddSimilar();
  else event.currentTarget.requestSubmit();
}
