import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzLetter, OzipzScheduleEvent } from "../types/ozipz.types";
import { collectDeadlines, daysBetween, describeDaysLeft, letterDeadlineState } from "./deadlineUtils";

const TODAY = "2026-09-29";
const letter = (overrides: Partial<OzipzLetter>): OzipzLetter => ({
  id: "l1", direction: "przychodzace", letterNumber: "12/2026", letterDate: "2026-09-01", senderRecipient: "Szkoła",
  subject: "Prośba o prelekcję", assignedPerson: "", status: "nowe", createdAt: "", updatedAt: "", ...overrides,
});
const event = (overrides: Partial<OzipzScheduleEvent>): OzipzScheduleEvent => ({
  id: "e1", title: "Prelekcja HIV", eventDate: "2026-10-02", location: "", status: "zaplanowane", responsiblePerson: "",
  createdAt: "", updatedAt: "", ...overrides,
});
const action = (date: string) => ({ id: `a-${date}`, date, title: "Działanie" }) as OzipzAction;

describe("terminy na pulpicie", () => {
  it("liczy dni kalendarzowe niezależnie od strefy czasowej", () => {
    expect(daysBetween(TODAY, "2026-09-29")).toBe(0);
    expect(daysBetween(TODAY, "2026-10-01")).toBe(2);
    expect(daysBetween(TODAY, "2026-09-20")).toBe(-9);
    expect(describeDaysLeft(-3)).toBe("3 dni po terminie");
    expect(describeDaysLeft(1)).toBe("jutro");
  });

  it("przypomina o otwartych pismach z terminem i pomija zakończone", () => {
    expect(letterDeadlineState(letter({ responseDueDate: "2026-09-28" }), TODAY)).toEqual({ daysLeft: -1, severity: "overdue" });
    expect(letterDeadlineState(letter({ responseDueDate: "2026-09-28", status: "zakonczone" }), TODAY)).toBeNull();
    const items = collectDeadlines({
      letters: [letter({ responseDueDate: "2026-10-01" }), letter({ id: "l2", responseDueDate: "2026-12-01" }), letter({ id: "l3" })],
      scheduleEvents: [], actions: [], closedMonths: [], today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual(["letter-l1"]);
  });

  it("liczy termin zadania harmonogramu od jego końca (zadania miesięczne)", () => {
    const items = collectDeadlines({
      letters: [],
      scheduleEvents: [
        event({ id: "september", eventDate: "2026-09-01", endDate: "2026-09-30" }),
        event({ id: "october", eventDate: "2026-10-01", endDate: "2026-10-31" }),
        event({ id: "late", eventDate: "2026-08-01", endDate: "2026-08-31" }),
        event({ id: "day", eventDate: "2026-10-02" }),
        event({ id: "done", eventDate: "2026-09-10", status: "wykonane" }),
        event({ id: "ancient", eventDate: "2025-01-10" }),
        event({ id: "cancelled", eventDate: "2026-09-10", status: "odwolane" }),
      ],
      actions: [], closedMonths: [], today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual(["schedule-late", "schedule-september", "schedule-day"]);
    expect(items.map((item) => item.severity)).toEqual(["overdue", "soon", "soon"]);
  });

  it("przypomina o blokadzie poprzedniego miesiąca po 5. dniu, gdy są w nim działania", () => {
    const base = { letters: [], scheduleEvents: [], actions: [action("2026-08-14")] };
    expect(collectDeadlines({ ...base, closedMonths: [], today: "2026-09-03" })).toEqual([]);
    expect(collectDeadlines({ ...base, closedMonths: [], today: TODAY }).map((item) => item.key)).toEqual(["close-2026-08"]);
    expect(collectDeadlines({ ...base, closedMonths: ["2026-08"], today: TODAY })).toEqual([]);
    expect(collectDeadlines({ ...base, actions: [], closedMonths: [], today: "2026-01-10" })).toEqual([]);
  });
});
