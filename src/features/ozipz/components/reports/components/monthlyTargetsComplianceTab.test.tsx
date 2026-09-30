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
    });
  });

  it("renders tab with reported values loaded from DB store", () => {
    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    expect(screen.getByText("Zgodność ze sprawozdaniami:")).toBeDefined();
    expect(screen.queryByText("Pobierz z Harmonogramu")).toBeNull();
    expect(screen.getByRole("button", { name: "Miesięcznie" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Narastająco" })).toBeDefined();
    expect(screen.getByTitle("Styczeń – działania programowe wg wysłanego sprawozdania")).toHaveProperty("value", "5");

    const saveButton = screen.getByRole("button", { name: /^Zapisz$/ });
    expect(saveButton.hasAttribute("disabled")).toBe(true);
  });

  it("flags a month whose records differ from the sent report", () => {
    render(
      <MonthlyTargetsComplianceTab
        year={2026}
        actions={[
          {
            id: "a1",
            title: "Prelekcja",
            actionType: "prelekcja",
            date: "2026-01-10",
            programId: "prog-1",
            participantsCount: 100,
            numberOfActions: 5,
            status: "wykonane",
          } as never,
        ]}
      />
    );

    // Styczeń: nieprogramowe w sprawozdaniu 2 DZ / 40 ODB, w ewidencji 0
    expect(screen.getAllByText("Rozbieżność").length).toBeGreaterThan(0);
  });

  it("saves reported values to the database store after editing a cell", async () => {
    const saveMock = vi.fn().mockResolvedValue([]);
    useOzipzDbStore.setState({ saveMonthlyTargets: saveMock });

    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    fireEvent.change(screen.getByTitle("Luty – działania programowe wg wysłanego sprawozdania"), {
      target: { value: "7" },
    });

    const saveButton = screen.getByRole("button", { name: /^Zapisz$/ });
    expect(saveButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(2026, expect.objectContaining({ 2: expect.objectContaining({ programActions: 7 }) }));
    });
  });

  it("opens ConfirmDialog on clear click and clears reported values upon confirmation", async () => {
    render(<MonthlyTargetsComplianceTab year={2026} actions={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Wyczyść" }));
    expect(screen.getByText("Wyczyść wpisane sprawozdania")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Wyczyść sprawozdania" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Wyczyść sprawozdania" })).toBeNull());
    const saveButton = screen.getByRole("button", { name: /^Zapisz$/ });
    expect(saveButton.hasAttribute("disabled")).toBe(false);
  });
});
