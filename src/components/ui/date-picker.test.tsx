import { describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { DatePicker } from "./date-picker";

describe("DatePicker Component", () => {
  it("renders with formatted date when value is provided", () => {
    render(<DatePicker value="2026-09-02" onChange={vi.fn()} />);
    expect(screen.getByText(/02\.09\.2026/)).toBeDefined();
  });

  it("renders placeholder when no value is provided", () => {
    render(<DatePicker value="" placeholder="Wybierz termin" onChange={vi.fn()} />);
    expect(screen.getByText("Wybierz termin")).toBeDefined();
  });

  it("opens popover on click and allows quick selection of today", () => {
    const handleChange = vi.fn();
    render(<DatePicker value="" onChange={handleChange} />);

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    const todayBtn = screen.getByText("Dziś");
    expect(todayBtn).toBeDefined();

    fireEvent.click(todayBtn);
    expect(handleChange).toHaveBeenCalled();
  });

  it("closes popover when Escape key is pressed", () => {
    render(<DatePicker value="" onChange={vi.fn()} />);

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(screen.getByText("Dziś")).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Dziś")).toBeNull();
  });

  it("closes after focus leaves the calendar and does not steal focus on later Escape", () => {
    render(
      <>
        <DatePicker value="" onChange={vi.fn()} />
        <input aria-label="Następne pole" />
      </>
    );

    const trigger = screen.getByRole("button", { name: "Wybierz datę..." });
    trigger.focus();
    fireEvent.click(trigger);

    const calendarButton = screen.getByRole("button", { name: "Poprzedni miesiąc" });
    calendarButton.focus();
    expect(screen.getByRole("dialog", { name: "Wybierz datę" })).toBeDefined();

    const nextField = screen.getByRole("textbox", { name: "Następne pole" });
    act(() => nextField.focus());
    expect(screen.queryByRole("dialog", { name: "Wybierz datę" })).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(nextField);
  });

  it("renders clear button when allowClear is enabled and value is present, and clears value on click", () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2026-09-02" allowClear={true} onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: /02\.09\.2026/ });
    const clearButton = screen.getByRole("button", { name: "Wyczyść datę" });
    expect(trigger.contains(clearButton)).toBe(false);

    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith("");
    expect(document.activeElement).toBe(trigger);
  });

  it("disables quick select buttons and prevents selection when dates are out of minDate/maxDate bounds", () => {
    const handleChange = vi.fn();
    // Set minDate far in the future so all quick dates (today, yesterday, etc.) are disabled
    render(<DatePicker value="" minDate="2099-01-01" onChange={handleChange} />);

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    const todayBtn = screen.getByText("Dziś");
    expect(todayBtn).toBeDefined();
    expect((todayBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(todayBtn);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("handles minDate === maxDate boundary with exactly one selectable day", () => {
    const handleChange = vi.fn();
    render(
      <DatePicker
        value="2026-05-15"
        minDate="2026-05-15"
        maxDate="2026-05-15"
        onChange={handleChange}
      />
    );

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    // Day 15 should be selectable
    const day15 = screen.getByText("15");
    expect((day15 as HTMLButtonElement).disabled).toBe(false);

    // Other days (e.g. 14 and 16) must be disabled
    const day14 = screen.getByText("14");
    expect((day14 as HTMLButtonElement).disabled).toBe(true);
    const day16 = screen.getByText("16");
    expect((day16 as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(day14);
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.click(day15);
    expect(handleChange).toHaveBeenCalledWith("2026-05-15");
  });

  it("calculates leap day and month-boundary quick dates correctly", async () => {
    const { getQuickDateIso, isQuickDateDisabled } = await import("./datePickerUtils");

    // Leap day arithmetic: March 1, 2024 -> yesterday was Feb 29, 2024
    const leapBase = new Date(2024, 2, 1); // 2024-03-01
    expect(getQuickDateIso("yesterday", leapBase)).toBe("2024-02-29");

    // Non-leap year arithmetic: March 1, 2023 -> yesterday was Feb 28, 2023
    const nonLeapBase = new Date(2023, 2, 1); // 2023-03-01
    expect(getQuickDateIso("yesterday", nonLeapBase)).toBe("2023-02-28");

    // Month boundary: May 1, 2026 -> -7 days is April 24, 2026
    const mayBase = new Date(2026, 4, 1); // 2026-05-01
    expect(getQuickDateIso("lastWeek", mayBase)).toBe("2026-04-24");
    expect(getQuickDateIso("startOfMonth", mayBase)).toBe("2026-05-01");

    // Boundary disabling check with reference date
    expect(isQuickDateDisabled("yesterday", "2024-03-01", undefined, leapBase)).toBe(true);
    expect(isQuickDateDisabled("startOfMonth", "2024-03-01", "2024-03-31", leapBase)).toBe(false);
  });
});
