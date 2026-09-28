import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import { FileText } from "lucide-react";

describe("EmptyState component", () => {
  it("renders title and description correctly", () => {
    render(
      <EmptyState
        title="Brak zarejestrowanych działań"
        description="Nie znaleziono żadnych pozycji spełniających kryteria."
      />
    );
    expect(screen.getByText("Brak zarejestrowanych działań")).toBeDefined();
    expect(
      screen.getByText("Nie znaleziono żadnych pozycji spełniających kryteria.")
    ).toBeDefined();
  });

  it("triggers action button callback when clicked", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        icon={FileText}
        title="Brak danych"
        actionLabel="Dodaj pozycję"
        onAction={handleAction}
      />
    );
    const button = screen.getByRole("button", { name: "Dodaj pozycję" });
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("renders secondary action and handles click", () => {
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        title="Brak wyników"
        secondaryActionLabel="Wyczyść filtry"
        onSecondaryAction={handleSecondary}
      />
    );
    const button = screen.getByRole("button", { name: "Wyczyść filtry" });
    fireEvent.click(button);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });
});
