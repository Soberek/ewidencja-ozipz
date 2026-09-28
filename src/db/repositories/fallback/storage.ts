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
