import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardKpiBanner } from "./DashboardKpiBanner";
import { DashboardRecentActionsCard } from "./DashboardRecentActionsCard";
import type { OzipzAction } from "../../types/ozipz.types";
import { currentYearExecutedActions } from "../DashboardSection";

describe("dashboard navigation", () => {
  it("counts current-year actions without cancelled and postponed ones", () => {
    const actions = [
      { id: "done", date: "10.05.2026", status: "wykonane" },
      { id: "no-status", date: "2026-05-11", status: "" },
      { id: "cancelled", date: "2026-05-12", status: "odwolane" },
      { id: "postponed", date: "2026-05-13", status: "odroczone" },
      { id: "old", date: "2025-05-14", status: "wykonane" },
    ] as OzipzAction[];
    expect(currentYearExecutedActions(actions, 2026).map((action) => action.id)).toEqual(["done", "no-status"]);
  });

  it("exposes each summary card as a named button that navigates", () => {
    const onNavigateTab = vi.fn();
    render(
      <DashboardKpiBanner
        actions={[]}
        programs={[]}
        participations={[]}
        scheduleEvents={[]}
        recipients={{ total: 0, materialsCount: 0 }}
        upcomingEventsCount={0}
        onNavigateTab={onNavigateTab}
      />
    );

    const routes = [
      ["Przejdź do rejestru działań", "dzialania"],
      ["Przejdź do udziału szkół w programach", "szkoly-w-programie"],
      ["Przejdź do sprawozdań", "sprawozdania"],
      ["Przejdź do harmonogramu", "harmonogram"],
    ];
    for (const [name, route] of routes) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(onNavigateTab).toHaveBeenLastCalledWith(route);
    }
  });

  it("exposes recent actions as named buttons that navigate", () => {
    const onNavigateTab = vi.fn();
    const action = {
      id: "action-1",
      title: "Prelekcja w szkole",
      date: "2026-09-26",
      participantsCount: 20,
    } as OzipzAction;
    render(
      <DashboardRecentActionsCard
        actionsCount={1}
        recentActions={[action]}
        onNavigateTab={onNavigateTab}
        onOpenAddAction={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Otwórz rejestr działań: Prelekcja w szkole" }));
    expect(onNavigateTab).toHaveBeenCalledWith("dzialania");
  });
});
