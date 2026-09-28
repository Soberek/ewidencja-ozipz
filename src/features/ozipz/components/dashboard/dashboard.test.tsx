import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardCurrentMonthPlanCard } from "./DashboardCurrentMonthPlanCard";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";

describe("Dashboard Current Month Plan Widget", () => {

  it("renders Current Month Plan Card with progress bar and task items", () => {
    const today = new Date().toISOString().slice(0, 10);
    const mockEvents: OzipzScheduleEvent[] = [
      {
        id: "ev-1",
        title: "Prelekcja o FAS w Szkole Podstawowej",
        eventDate: today,
        status: "wykonane",
        category: "Program",
        location: "SP 1 Myślibórz",
        responsiblePerson: "Anna Kowalska",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
      {
        id: "ev-2",
        title: "Warsztaty Trzymaj Formę",
        eventDate: today,
        status: "zaplanowane",
        category: "Program",
        location: "SP 2 Barlinek",
        responsiblePerson: "Jan Nowak",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
    ];

    const onNavigateMock = vi.fn();

    render(
      <DashboardCurrentMonthPlanCard
        scheduleEvents={mockEvents}
        actions={[]}
        onNavigateTab={onNavigateMock}
      />
    );

    expect(screen.getByText(/Wykonanie planu miesięcznego:/i)).toBeDefined();
    expect(screen.getByText(/1 z 2 zadań/i)).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
    expect(screen.getByText("Prelekcja o FAS w Szkole Podstawowej")).toBeDefined();
    expect(screen.getByText("Warsztaty Trzymaj Formę")).toBeDefined();
    expect(screen.getByText(/Zarejestruj wykonanie/i)).toBeDefined();
  });

  it("displays full JRWA dictionary name for events with JRWA code", () => {
    const today = new Date().toISOString().slice(0, 10);
    const mockEvents: OzipzScheduleEvent[] = [
      {
        id: "ev-report",
        title: "Sprawozdanie (z programu, miernik, tytoń) (JRWA 966.14)",
        eventDate: today,
        status: "zaplanowane",
        category: "JRWA 966.14",
        jrwa: "966.14",
        location: "Powiat myśliborski / PSSE",
        responsiblePerson: "Stanowisko Pracy ds. OZiPZ",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
    ];

    render(
      <DashboardCurrentMonthPlanCard
        scheduleEvents={mockEvents}
        actions={[]}
        onNavigateTab={vi.fn()}
      />
    );

    expect(screen.getByText(/Bezpiecz/i)).toBeDefined();
    expect(screen.getByText(/JRWA 966.14:/i)).toBeDefined();
  });

  it("recognizes done, zrealizowane, and action-bound events as completed", () => {
    const today = new Date().toISOString().slice(0, 10);
    const mockEvents: OzipzScheduleEvent[] = [
      {
        id: "ev-done-db",
        title: "Zadanie ze statusem done z bazy",
        eventDate: today,
        status: "done",
        location: "SP 1 Myślibórz",
        responsiblePerson: "Anna Kowalska",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
      {
        id: "ev-bound-action",
        title: "Zadanie z powiązaną akcją",
        eventDate: today,
        status: "zaplanowane",
        location: "SP 2 Barlinek",
        responsiblePerson: "Jan Nowak",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
      {
        id: "ev-postponed",
        title: "Zadanie odroczone",
        eventDate: today,
        status: "postponed",
        location: "PSSE Myślibórz",
        responsiblePerson: "Krzysztof Palpuchowski",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
    ];

    const mockActions = [
      {
        id: "act-1",
        title: "Zrealizowano zadanie powiązane",
        date: today,
        scheduleEventId: "ev-bound-action",
        actionType: "prelekcja",
        facilityName: "SP 1",
        municipality: "Myślibórz",
        topic: "Zdrowy styl życia",
        audienceGroup: "Młodzież",
        participantsCount: 25,
        leadEducator: "Jan Nowak",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      } as any,
    ];

    render(
      <DashboardCurrentMonthPlanCard
        scheduleEvents={mockEvents}
        actions={mockActions}
        onNavigateTab={vi.fn()}
      />
    );

    // 2 z 3 zadań wykonane (ev-done-db + ev-bound-action) -> 67%
    expect(screen.getByText(/2 z 3 zadań/i)).toBeDefined();
    expect(screen.getByText("67%")).toBeDefined();
    expect(screen.getByText(/Odroczone \/ Zmiany:/i)).toBeDefined();
  });
});
