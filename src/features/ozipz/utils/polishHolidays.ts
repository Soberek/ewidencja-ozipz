/** Dni ustawowo wolne od pracy w Polsce (ustawa z 18.01.1951 r. o dniach wolnych od pracy). */

export interface PolishHoliday {
  /** Data w formacie ISO (YYYY-MM-DD). */
  date: string;
  name: string;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(year: number, month: number, day: number, days: number): string {
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Niedziela Wielkanocna — algorytm Meeusa/Jonesa/Butchera (kalendarz gregoriański). */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function getPolishHolidays(year: number): PolishHoliday[] {
  const easter = easterSunday(year);
  const fromEaster = (days: number) => addDays(year, easter.month, easter.day, days);

  const holidays: PolishHoliday[] = [
    { date: toIso(year, 1, 1), name: "Nowy Rok" },
    { date: toIso(year, 1, 6), name: "Święto Trzech Króli" },
    { date: fromEaster(0), name: "Wielkanoc" },
    { date: fromEaster(1), name: "Poniedziałek Wielkanocny" },
    { date: toIso(year, 5, 1), name: "Święto Pracy" },
    { date: toIso(year, 5, 3), name: "Święto Konstytucji 3 Maja" },
    { date: fromEaster(49), name: "Zielone Świątki" },
    { date: fromEaster(60), name: "Boże Ciało" },
    { date: toIso(year, 8, 15), name: "Wniebowzięcie Najświętszej Maryi Panny" },
    { date: toIso(year, 11, 1), name: "Wszystkich Świętych" },
    { date: toIso(year, 11, 11), name: "Narodowe Święto Niepodległości" },
    { date: toIso(year, 12, 25), name: "Boże Narodzenie (pierwszy dzień)" },
    { date: toIso(year, 12, 26), name: "Boże Narodzenie (drugi dzień)" },
  ];
  // Wigilia jest dniem wolnym od 2025 r.
  if (year >= 2025) holidays.push({ date: toIso(year, 12, 24), name: "Wigilia Bożego Narodzenia" });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/** Nazwa święta przypadającego w danym dniu albo undefined. */
export function findPolishHoliday(isoDate: string): string | undefined {
  const year = Number(isoDate.slice(0, 4));
  if (!Number.isInteger(year)) return undefined;
  return getPolishHolidays(year).find((holiday) => holiday.date === isoDate)?.name;
}
