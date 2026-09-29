import type { OzipzAction, OzipzLetter, OzipzProgram, OzipzScheduleEvent } from "../types/ozipz.types";
import { enrichScheduleEvents } from "./scheduleExecutionUtils";
import { getTodayIsoDate } from "./dateUtils";

/** Ile dni naprzód pokazujemy nadchodzące terminy. */
export const DEADLINE_HORIZON_DAYS = 7;
/** Starsze zaległości harmonogramu nie zaśmiecają pulpitu — widać je w module Harmonogram. */
export const SCHEDULE_OVERDUE_LOOKBACK_DAYS = 90;
/** Od tego dnia miesiąca przypominamy o zamknięciu poprzedniego miesiąca. */
export const CLOSE_MONTH_REMINDER_DAY = 5;

const FINISHED_LETTER_STATUSES = new Set(["zakonczone", "archiwalne"]);

export type DeadlineSeverity = "overdue" | "today" | "soon";

export interface DeadlineItem {
  key: string;
  kind: "letter" | "schedule" | "closeMonth";
  title: string;
  detail: string;
  dueDate: string;
  daysLeft: number;
  severity: DeadlineSeverity;
  /** Ścieżka modułu, w którym załatwia się sprawę. */
  path: string;
  letter?: OzipzLetter;
  scheduleEvent?: OzipzScheduleEvent;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Liczba dni kalendarzowych od `today` do `date` (obie w formacie RRRR-MM-DD). */
export function daysBetween(today: string, date: string): number {
  return Math.round((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
}

function severityFor(daysLeft: number): DeadlineSeverity {
  if (daysLeft < 0) return "overdue";
  return daysLeft === 0 ? "today" : "soon";
}

export function isLetterOpen(letter: OzipzLetter): boolean {
  return !FINISHED_LETTER_STATUSES.has(letter.status);
}

/** Stan terminu pisma do oznaczenia w tabeli (null, gdy brak terminu lub pismo jest zakończone). */
export function letterDeadlineState(letter: OzipzLetter, today = getTodayIsoDate()): { daysLeft: number; severity: DeadlineSeverity } | null {
  if (!letter.responseDueDate || !isLetterOpen(letter)) return null;
  const daysLeft = daysBetween(today, letter.responseDueDate);
  return { daysLeft, severity: severityFor(daysLeft) };
}

export function describeDaysLeft(daysLeft: number): string {
  if (daysLeft < -1) return `${-daysLeft} dni po terminie`;
  if (daysLeft === -1) return "wczoraj minął termin";
  if (daysLeft === 0) return "dziś";
  if (daysLeft === 1) return "jutro";
  return `za ${daysLeft} dni`;
}

const previousMonthKey = (today: string) => {
  const [year, month] = today.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
};

interface DeadlineSources {
  letters: OzipzLetter[];
  scheduleEvents: OzipzScheduleEvent[];
  actions: OzipzAction[];
  programs?: OzipzProgram[];
  closedMonths: string[];
  today?: string;
}

/** Zaległe i nadchodzące terminy: odpowiedzi na pisma, zadania harmonogramu i zamknięcie miesiąca. */
export function collectDeadlines({ letters, scheduleEvents, actions, programs, closedMonths, today = getTodayIsoDate() }: DeadlineSources): DeadlineItem[] {
  const items: DeadlineItem[] = [];

  for (const letter of letters) {
    const state = letterDeadlineState(letter, today);
    if (!state || state.daysLeft > DEADLINE_HORIZON_DAYS) continue;
    items.push({
      key: `letter-${letter.id}`,
      kind: "letter",
      title: letter.subject,
      detail: `Pismo ${letter.letterNumber}${letter.senderRecipient ? ` · ${letter.senderRecipient}` : ""}`,
      dueDate: letter.responseDueDate!,
      daysLeft: state.daysLeft,
      severity: state.severity,
      path: "/pisma",
      letter,
    });
  }

  for (const event of enrichScheduleEvents(scheduleEvents, actions, programs)) {
    if (event.effectiveStatus !== "zaplanowane" && event.effectiveStatus !== "w_trakcie") continue;
    const start = event.eventDate?.slice(0, 10);
    if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
    const end = event.endDate?.slice(0, 10) || start;
    const untilStart = daysBetween(today, start);
    const untilEnd = daysBetween(today, end);
    const isOverdue = untilEnd < 0 && untilEnd >= -SCHEDULE_OVERDUE_LOOKBACK_DAYS;
    const isUpcoming = untilStart >= 0 && untilStart <= DEADLINE_HORIZON_DAYS;
    if (!isOverdue && !isUpcoming) continue;
    const { matchedActions: _matched, ...plainEvent } = event;
    items.push({
      key: `schedule-${event.id}`,
      kind: "schedule",
      title: event.title,
      detail: isOverdue ? "Harmonogram · termin minął — dodaj działanie albo adnotację" : `Harmonogram${event.location ? ` · ${event.location}` : ""}`,
      dueDate: isOverdue ? end : start,
      daysLeft: isOverdue ? untilEnd : untilStart,
      severity: severityFor(isOverdue ? untilEnd : untilStart),
      path: "/harmonogram",
      scheduleEvent: plainEvent,
    });
  }

  const dayOfMonth = Number(today.slice(8, 10));
  const lastMonth = previousMonthKey(today);
  if (dayOfMonth >= CLOSE_MONTH_REMINDER_DAY && !closedMonths.includes(lastMonth) && actions.some((action) => action.date.startsWith(lastMonth))) {
    const [year, month] = lastMonth.split("-");
    items.push({
      key: `close-${lastMonth}`,
      kind: "closeMonth",
      title: `Zablokuj miesiąc ${month}.${year}`,
      detail: "Rejestr działań · sprawdź działania z poprzedniego miesiąca i zablokuj go (Blokada miesięcy), aby sprawozdanie się nie zmieniło",
      dueDate: `${today.slice(0, 7)}-${String(CLOSE_MONTH_REMINDER_DAY).padStart(2, "0")}`,
      daysLeft: CLOSE_MONTH_REMINDER_DAY - dayOfMonth,
      severity: dayOfMonth > CLOSE_MONTH_REMINDER_DAY ? "overdue" : "today",
      path: "/dzialania",
    });
  }

  return items.sort((left, right) => left.daysLeft - right.daysLeft || left.title.localeCompare(right.title, "pl"));
}
