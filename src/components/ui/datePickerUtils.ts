export const MONTH_NAMES_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
] as const;

export const WEEKDAY_NAMES_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"] as const;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
}

export function getDayOfWeekShort(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate + "T12:00:00");
    const day = d.getDay(); // 0 = niedziela
    const map = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];
    return map[day] || "";
  } catch {
    return "";
  }
}

export interface CalendarDayItem {
  dateIso: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isDisabled: boolean;
}

export function generateCalendarDays(params: {
  viewYear: number;
  viewMonth: number;
  value?: string;
  minDate?: string;
  maxDate?: string;
}): CalendarDayItem[] {
  const { viewYear, viewMonth, value, minDate, maxDate } = params;
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // 0 = Niedziela -> konwersja na Pn=0, Nd=6
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay < 0) startingDay = 6;

  const daysInMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: CalendarDayItem[] = [];

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  // Dni z poprzedniego miesiąca
  for (let i = startingDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateIso = `${prevYear}-${pad2(prevMonth + 1)}-${pad2(dayNum)}`;
    const dayOfWeek = new Date(prevYear, prevMonth, dayNum).getDay();
    days.push({
      dateIso,
      dayNum,
      isCurrentMonth: false,
      isToday: dateIso === todayIso,
      isSelected: dateIso === value,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isDisabled: Boolean(
        (minDate && dateIso < minDate) || (maxDate && dateIso > maxDate)
      ),
    });
  }

  // Dni z bieżącego miesiąca
  for (let i = 1; i <= daysInMonth; i++) {
    const dateIso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(i)}`;
    const dayOfWeek = new Date(viewYear, viewMonth, i).getDay();
    days.push({
      dateIso,
      dayNum: i,
      isCurrentMonth: true,
      isToday: dateIso === todayIso,
      isSelected: dateIso === value,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isDisabled: Boolean(
        (minDate && dateIso < minDate) || (maxDate && dateIso > maxDate)
      ),
    });
  }

  // Dni z następnego miesiąca dopełniające do pełnych wierszy (35 lub 42 komórki)
  const remaining = (7 - (days.length % 7)) % 7;
  const totalNeeded = days.length + remaining < 35 ? 35 - days.length : remaining;
  for (let i = 1; i <= totalNeeded; i++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateIso = `${nextYear}-${pad2(nextMonth + 1)}-${pad2(i)}`;
    const dayOfWeek = new Date(nextYear, nextMonth, i).getDay();
    days.push({
      dateIso,
      dayNum: i,
      isCurrentMonth: false,
      isToday: dateIso === todayIso,
      isSelected: dateIso === value,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isDisabled: Boolean(
        (minDate && dateIso < minDate) || (maxDate && dateIso > maxDate)
      ),
    });
  }

  return days;
}

export type DatePickerQuickSelectType = "today" | "yesterday" | "lastWeek" | "startOfMonth";

export function getQuickDateIso(type: DatePickerQuickSelectType, baseDate: Date = new Date()): string {
  const target = new Date(baseDate.getTime());

  if (type === "yesterday") {
    target.setDate(target.getDate() - 1);
  } else if (type === "lastWeek") {
    target.setDate(target.getDate() - 7);
  } else if (type === "startOfMonth") {
    target.setDate(1);
  }

  return `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(target.getDate())}`;
}

export function isQuickDateDisabled(
  type: DatePickerQuickSelectType,
  minDate?: string,
  maxDate?: string,
  baseDate?: Date
): boolean {
  const iso = getQuickDateIso(type, baseDate);
  return Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate));
}


