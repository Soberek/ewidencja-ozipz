import { useCallback, useState } from "react";

function readBoolean(storageKey: string, defaultValue: boolean): boolean {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return defaultValue;
    return saved === "true";
  } catch {
    return defaultValue;
  }
}

/**
 * Przełącznik boolean zapamiętywany w localStorage (np. widoczność kart KPI).
 * Brak dostępu do pamięci przeglądarki nie jest błędem — preferencja widoku nie jest krytyczna.
 */
export function usePersistentToggle(storageKey: string, defaultValue = true) {
  const [value, setValueState] = useState<boolean>(() => readBoolean(storageKey, defaultValue));

  const setValue = useCallback(
    (next: boolean) => {
      setValueState(next);
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Preferencja widoku nie jest krytyczna.
      }
    },
    [storageKey]
  );

  const toggle = useCallback(() => {
    setValueState((prev) => {
      try {
        localStorage.setItem(storageKey, String(!prev));
      } catch {
        // Preferencja widoku nie jest krytyczna.
      }
      return !prev;
    });
  }, [storageKey]);

  return [value, toggle, setValue] as const;
}

/** Widoczność kart podsumowania KPI danej sekcji (klucz `oz.<sekcja>ShowKpiSummary`). */
export function useKpiVisibility(section: string) {
  const [visible, toggle] = usePersistentToggle(`oz.${section}ShowKpiSummary`, true);
  return { isKpiVisible: visible, toggleKpi: toggle };
}
