import type { OzipzAction } from "../../../features/ozipz/types/ozipz.types";
import { getStoredClosedMonths, isMonthClosed } from "../../../features/ozipz/utils/dateUtils";

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem("ozipz_" + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) throw new Error("Nieprawidłowy format kolekcji");
    return parsed as T;
  } catch {
    throw new Error(`Nie można odczytać zapisanych danych (${key}). Przywróć prawidłową kopię zapasową.`);
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem("ozipz_" + key, JSON.stringify(data));
  } catch {
    throw new Error("Nie udało się zapisać danych w pamięci przeglądarki. Zwolnij miejsce i spróbuj ponownie.");
  }
}

/** Restore every affected collection if a multi-collection edit fails. */
export async function withStorageRollback<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
  return withBrowserStorageRollback(keys.map((key) => `ozipz_${key}`), operation);
}

export async function withBrowserStorageRollback<T>(names: string[], operation: () => Promise<T>): Promise<T> {
  const before = names.map((name) => localStorage.getItem(name));
  try {
    return await operation();
  } catch (error) {
    const changed = names.map((name, index) => ({ name, index }))
      .filter(({ name, index }) => localStorage.getItem(name) !== before[index]);
    changed.forEach(({ name }) => localStorage.removeItem(name));
    changed.forEach(({ name, index }) => { if (before[index] !== null) localStorage.setItem(name, before[index]!); });
    throw error;
  }
}

/** Match SQLite's protection for records referenced by actions in closed months. */
export function assertNoClosedActionReference(field: "facilityId" | "programId" | "materialId" | "scheduleEventId" | "jrwaCaseId", id: string): void {
  const closed = getStoredClosedMonths();
  if (!closed.size) return;
  const actions = loadFromStorage<OzipzAction[]>("actions", []);
  if (actions.some((action) => action[field] === id && isMonthClosed(action.date, closed))) {
    throw new Error("Nie można usunąć: rekord jest powiązany z działaniem z zamkniętego miesiąca.");
  }
}
