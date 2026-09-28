import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OzipzSidebar, SIDEBAR_GROUPS, SIDEBAR_FOOTER_ITEMS } from "./OzipzSidebar";
import { resolveCurrentPage } from "./navigation";
import { useUIStore } from "../../store/useUIStore";

const ALL_ITEMS = [...SIDEBAR_GROUPS.flatMap((g) => g.items), ...SIDEBAR_FOOTER_ITEMS];

const renderSidebar = (path = "/", props: Parameters<typeof OzipzSidebar>[0] = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <OzipzSidebar isCollapsed={false} onToggleCollapse={() => {}} {...props} />
    </MemoryRouter>
  );

describe("OzipzSidebar routing and navigation", () => {
  beforeEach(() => {
    useUIStore.setState({ collapsedSidebarGroups: [] });
  });

  it("renders all sidebar groups and items with correct links", () => {
    renderSidebar("/", { counts: { dzialania: 12, harmonogram: 5 } });

    expect(screen.getByText("Ewidencja OZiPZ")).toBeDefined();
    for (const group of SIDEBAR_GROUPS) {
      expect(screen.getByRole("button", { name: group.label })).toBeDefined();
    }
    for (const item of ALL_ITEMS) {
      expect(screen.getByText(item.label).closest("a")?.getAttribute("href")).toBe(item.path);
    }
  });

  it("keeps action forms inside the dictionaries center instead of a separate entry", () => {
    renderSidebar();
    expect(screen.queryByText("Formy działań")).toBeNull();
    expect(resolveCurrentPage("/slownik-dzialania")?.item.id).toBe("slowniki");
  });

  it("displays badge counts when provided", () => {
    renderSidebar("/dzialania", { counts: { dzialania: 42, harmonogram: 7 } });
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
  });

  it("marks the parent module active on subpages", () => {
    renderSidebar("/miernik-budzetowy");
    expect(screen.getByText("Mierniki i sprawozdania").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Pulpit główny").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("filters modules by label and keywords", () => {
    renderSidebar();
    fireEvent.change(screen.getByRole("searchbox", { name: "Szukaj modułu" }), { target: { value: "formy dzialan" } });
    expect(screen.getByText("Centrum słowników")).toBeDefined();
    expect(screen.queryByText("Harmonogram")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox", { name: "Szukaj modułu" }), { target: { value: "zzz" } });
    expect(screen.getByText(/Brak modułu/)).toBeDefined();
  });

  it("collapses and expands a group", () => {
    renderSidebar();
    const heading = screen.getByRole("button", { name: "Kancelaria" });
    fireEvent.click(heading);
    expect(screen.queryByText("Pisma i korespondencja")).toBeNull();
    expect(heading.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(heading);
    expect(screen.getByText("Pisma i korespondencja")).toBeDefined();
  });

  it("names navigation groups and icon-only links when collapsed", () => {
    renderSidebar("/", { isCollapsed: true });

    for (const group of SIDEBAR_GROUPS) {
      expect(screen.getByRole("navigation", { name: group.label })).toBeDefined();
    }
    for (const item of ALL_ITEMS) {
      expect(screen.getByRole("link", { name: item.label }).getAttribute("href")).toBe(item.path);
    }
    expect(screen.getByRole("button", { name: "Rozwiń menu" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Nowe działanie" }).getAttribute("href")).toBe("/dzialania/nowe");
  });
});
