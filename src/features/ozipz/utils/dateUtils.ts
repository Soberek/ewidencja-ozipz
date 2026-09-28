import { parseISO, parse, isValid, format } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * Zwraca bieżącą datę w lokalnej strefie czasowej w formacie YYYY-MM-DD.
 * Eliminuje błędy przesunięcia UTC (np. new Date().toISOString().slice(0, 10)).
 */
export function getTodayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Bezpiecznie parsuje string z datą (obsługuje ISO 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss', oraz polski 'DD.MM.YYYY').
 */
export function safeParseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Próba parsowania ISO
  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) {
    return isoParsed;
  }

  // Próba parsowania DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const dotParsed = parse(trimmed, "dd.MM.yyyy", new Date());
    if (isValid(dotParsed)) {
      return dotParsed;
    }
  }

  // Próba parsowania DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const slashParsed = parse(trimmed, "dd/MM/yyyy", new Date());
    if (isValid(slashParsed)) {
      return slashParsed;
    }
  }

  // Ostateczny fallback na natywny konstruktor
  const nativeDate = new Date(trimmed);
  return isValid(nativeDate) ? nativeDate : null;
}

/**
 * Zwraca klucz miesiąca w ustandaryzowanym formacie "YYYY-MM" (np. "2026-08").
 * Zabezpiecza przed błędami manipulacji na surowych stringach.
 */
export function getMonthKey(input: string | Date | null | undefined): string {
  const date = safeParseDate(input);
  if (!date) {
    if (typeof input === "string" && /^\d{4}-\d{2}/.test(input)) {
      return input.slice(0, 7);
    }
    return "";
  }
  return format(date, "yyyy-MM");
}

/**
 * Zwraca rok w formacie "YYYY" (np. "2026").
 */
export function getYearKey(input: string | Date | null | undefined): string {
  const date = safeParseDate(input);
  if (!date) {
    if (typeof input === "string" && /^\d{4}/.test(input)) {
      return input.slice(0, 4);
    }
    return "";
  }
  return format(date, "yyyy");
}

/**
 * Zwraca numer roku jako liczbę lub domyślny rok.
 */
export function getYearNumber(input: string | Date | null | undefined, fallbackYear = new Date().getFullYear()): number {
  const yearStr = getYearKey(input);
  const parsed = parseInt(yearStr, 10);
  return isNaN(parsed) ? fallbackYear : parsed;
}

/**
 * Sprawdza czy data należy do zamkniętego/rozliczonego miesiąca rozliczeniowego.
 */
export function isMonthClosed(
  input: string | Date | null | undefined,
  closedMonths: Set<string> | string[]
): boolean {
  const monthKey = getMonthKey(input);
  if (!monthKey) return false;

  if (closedMonths instanceof Set) {
    return closedMonths.has(monthKey);
  }
  return Array.isArray(closedMonths) && closedMonths.includes(monthKey);
}

/**
 * Formatuje datę w polskim standardzie (np. "30.08.2026").
 */
export function formatDatePl(input: string | Date | null | undefined, fallback = "—"): string {
  const date = safeParseDate(input);
  if (!date) return fallback;
  return format(date, "dd.MM.yyyy");
}

/**
 * Formatuje pełną datę słownie po polsku (np. "30 sierpnia 2026").
 */
export function formatFullDatePl(input: string | Date | null | undefined, fallback = "—"): string {
  const date = safeParseDate(input);
  if (!date) return fallback;
  return format(date, "d MMMM yyyy", { locale: pl });
}

/**
 * Formatuje miesiąc i rok (np. "sierpień 2026").
 */
export function formatMonthYearPl(input: string | Date | null | undefined, fallback = "—"): string {
  const date = safeParseDate(input);
  if (!date) return fallback;
  return format(date, "LLLL yyyy", { locale: pl });
}

/**
 * Bezpieczne sortowanie dat malejąco (najnowsze na górze).
 */
export function compareDatesDesc(a: string | Date | null | undefined, b: string | Date | null | undefined): number {
  const dateA = safeParseDate(a);
  const dateB = safeParseDate(b);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB.getTime() - dateA.getTime();
}

/**
 * Bezpieczne sortowanie dat rosnąco (najstarsze na górze).
 */
export function compareDatesAsc(a: string | Date | null | undefined, b: string | Date | null | undefined): number {
  const dateA = safeParseDate(a);
  const dateB = safeParseDate(b);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.getTime() - dateB.getTime();
}

/**
 * Pobiera zbiór zamkniętych miesięcy z localStorage.
 */
export function getStoredClosedMonths(): Set<string> {
  try {
    const saved = localStorage.getItem("oz.closedMonths");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}
