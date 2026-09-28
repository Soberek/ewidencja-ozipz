import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MetricCard } from "./metric-card";
import { Activity } from "lucide-react";

describe("MetricCard component", () => {
  it("renders title, value, subtext, and icon", () => {
    render(
      <MetricCard
        title="Wszystkie Działania"
        value={142}
        subtext="Łącznie zrealizowanych"
        icon={<Activity data-testid="metric-icon" />}
      />
    );

    expect(screen.getByText("Wszystkie Działania")).toBeDefined();
    expect(screen.getByText("142")).toBeDefined();
    expect(screen.getByText("Łącznie zrealizowanych")).toBeDefined();
    expect(screen.getByTestId("metric-icon")).toBeDefined();
  });

  it("handles onClick when clickable", () => {
    const handleClick = vi.fn();
    render(
      <MetricCard
        title="Klikalna Karta"
        value={25}
        icon={<Activity />}
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText("Klikalna Karta"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("exposes only actionable metrics to keyboard users", () => {
    const { rerender } = render(
      <MetricCard title="Suma" value={25} icon={<Activity />} />
    );
    expect(screen.queryByRole("button")).toBeNull();

    const handleClick = vi.fn();
    rerender(
      <MetricCard title="Suma" value={25} icon={<Activity />} onClick={handleClick} />
    );
    const card = screen.getByRole("button", { name: /Suma/ });
    expect(card.tagName).toBe("DIV");
    expect(card.tabIndex).toBe(0);
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("supports compact mode styling and custom variants", () => {
    const { container } = render(
      <MetricCard
        title="Zwarty Widok"
        value="99%"
        icon={<Activity />}
        variant="emerald"
        compact={true}
      />
    );

    expect(screen.getByText("Zwarty Widok")).toBeDefined();
    expect(screen.getByText("99%")).toBeDefined();
    expect(container.querySelector(".p-2")).not.toBeNull();
  });
});
