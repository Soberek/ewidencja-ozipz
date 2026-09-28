import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActionsTableView } from "./ActionsTableView";
import { getActionTypeSolidColor } from "./ActionTableBadges";

afterEach(() => { cleanup(); localStorage.removeItem("oz.actionsTableFontSize"); });
const props = {
  filteredActions: [{ id: "1", title: "Działanie" }] as any,
  columns: [{ id: "title", header: "Działanie", accessorKey: "title" as const }],
  totalCount: 1, selectedActionIds: new Set<string>(), onOpenEdit: vi.fn(), onClearFilters: vi.fn(),
};
it("remembers table font size after remount and restores the default", () => {
  const view = render(<ActionsTableView {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Zmniejsz czcionkę tabeli" }));
  expect(localStorage.getItem("oz.actionsTableFontSize")).toBe("11");
  view.unmount();
  render(<ActionsTableView {...props} />);
  expect((screen.getByLabelText("Czcionka tabeli") as HTMLInputElement).value).toBe("11");
  fireEvent.click(screen.getByRole("button", { name: "Przywróć 12 px" }));
  expect(localStorage.getItem("oz.actionsTableFontSize")).toBe("12");
});
it("ignores invalid saved sizes", () => {
  localStorage.setItem("oz.actionsTableFontSize", "200");
  render(<ActionsTableView {...props} />);
  expect((screen.getByLabelText("Czcionka tabeli") as HTMLInputElement).value).toBe("12");
});
it("uses the same solid color for codes and labels and different colors for action forms", () => {
  expect(getActionTypeSolidColor("prelekcja")).toBe(getActionTypeSolidColor("Prelekcja (warsztat)"));
  expect(getActionTypeSolidColor("prelekcja")).not.toBe(getActionTypeSolidColor("dystrybucja"));
});
