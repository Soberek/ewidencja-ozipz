import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MonthlyTargetsComplianceTab } from "./MonthlyTargetsComplianceTab";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";

describe("MonthlyTargetsComplianceTab", () => {
  beforeEach(() => {
    localStorage.clear();
    useOzipzDbStore.setState({
      monthlyTargets: [
        {
          id: "mt-2026-1",
          year: 2026,
          month: 1,
          programActions: 5,
          programRecipients: 100,
          otherActions: 2,
          otherRecipients: 40,
          notes: "Cel styczeń",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      scheduleEvents: [
        {
          id: "sch-1",
          title: "Zadanie programowe w marcu",
          month: 3,
          year: 2026,
          eventDate: "2026-03-15",
          location: "Szkoła",
          responsiblePerson: "Jan Kowalski",
          status: "zaplanowane",
          programId: "prog-1",
          plannedCount: 3,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
  });

  it("renders tab with initial targets loaded from DB store", () => {
    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    expect(screen.getByText("Zgodność z Planem Pracy:")).toBeDefined();
    expect(screen.getByText("Zapisz Plan")).toBeDefined();
    expect(screen.getByText("Pobierz z Harmonogramu")).toBeDefined();
    expect(screen.getByText("Rozdziel Równomiernie")).toBeDefined();
    expect(screen.getByText("Wyczyść")).toBeDefined();

    const saveButton = screen.getByRole("button", { name: /Zapisz Plan/i });
    expect(saveButton.hasAttribute("disabled")).toBe(true);
  });

  it("allows pulling targets from schedule and enables Save button", async () => {
    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    const pullButton = screen.getByRole("button", { name: /Pobierz z Harmonogramu/i });
    fireEvent.click(pullButton);

    const saveButton = screen.getByRole("button", { name: /Zapisz Plan/i });
    expect(saveButton.hasAttribute("disabled")).toBe(false);
  });

  it("saves targets persistently to the database store when Save is clicked", async () => {
    const saveMock = vi.fn().mockResolvedValue([]);
    useOzipzDbStore.setState({ saveMonthlyTargets: saveMock });

    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    const pullButton = screen.getByRole("button", { name: /Pobierz z Harmonogramu/i });
    fireEvent.click(pullButton);

    const saveButton = screen.getByRole("button", { name: /Zapisz Plan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(2026, expect.any(Object));
    });
  });

  it("opens ConfirmDialog on clear click and clears targets upon confirmation", async () => {
    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    const clearButton = screen.getByRole("button", { name: /Wyczyść/i });
    fireEvent.click(clearButton);

    // Confirm dialog should be visible
    expect(screen.getByText("Wyczyść plan wykonania")).toBeDefined();

    const confirmBtn = screen.getByRole("button", { name: "Wyczyść plan" });
    fireEvent.click(confirmBtn);

    // Save button should now be enabled (dirty state)
    const saveButton = screen.getByRole("button", { name: /Zapisz Plan/i });
    expect(saveButton.hasAttribute("disabled")).toBe(false);
  });
});
