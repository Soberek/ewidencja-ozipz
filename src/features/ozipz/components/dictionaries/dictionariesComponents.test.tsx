import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DictionariesStatsHeader } from "./components/DictionariesStatsHeader";
import { DictionariesCategoryTabs } from "./components/DictionariesCategoryTabs";
import { DictionariesFilterBar } from "./components/DictionariesFilterBar";
import { DictionariesTableView } from "./components/DictionariesTableView";
import type { OzipzDictionaryItem } from "../../types/ozipz.types";
import { DICTIONARY_CATEGORIES_CONFIG } from "../../constants";

describe("Dictionaries Module Components", () => {
  it("renders DictionariesStatsHeader with category info, metrics and usage modules", () => {
    const handleShowUnused = vi.fn();
    render(
      <MemoryRouter>
        <DictionariesStatsHeader
          categoryKey="activityType"
          categoryLabel="Formy Działań"
          categoryDescription="Typy i formy aktywności"
          totalCount={45}
          systemCount={30}
          userCount={15}
          usedCount={40}
          referencesCount={312}
          usageModules={[{ module: "Działania", route: "/dzialania" }]}
          onShowUnused={handleShowUnused}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Formy Działań")).toBeDefined();
    expect(screen.getByText("45")).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("312")).toBeDefined();
    expect(screen.getByRole("link", { name: /Działania/ }).getAttribute("href")).toBe("/dzialania");

    fireEvent.click(screen.getByTitle("Pokaż tylko nieużywane pozycje"));
    expect(handleShowUnused).toHaveBeenCalled();
  });

  it("renders DictionariesCategoryTabs and handles tab switching", () => {
    const handleSelect = vi.fn();
    render(
      <DictionariesCategoryTabs
        categories={Object.values(DICTIONARY_CATEGORIES_CONFIG)}
        selectedCategory="activityType"
        onSelectCategory={handleSelect}
        categoryCounts={{ all: 40, activityType: 10, campaign: 5 }}
      />
    );

    expect(screen.getByText("Wszystkie kategorie")).toBeDefined();
    const campaignBtn = screen.getByText("Akcje Profilaktyczne");
    fireEvent.click(campaignBtn);
    expect(handleSelect).toHaveBeenCalledWith("campaign");
  });

  it("renders DictionariesFilterBar and handles search and filter change", () => {
    const handleSearch = vi.fn();
    const handleFilter = vi.fn();
    const handleAdd = vi.fn();
    const handleClear = vi.fn();

    render(
      <DictionariesFilterBar
        search="pogawędka"
        onSearchChange={handleSearch}
        systemFilter="all"
        onSystemFilterChange={handleFilter}
        totalFilteredCount={10}
        systemCount={8}
        userCount={2}
        activeCategory="activityType"
        activeCategoryLabel="Formy Działań"
        onOpenAdd={handleAdd}
        onClearFilters={handleClear}
      />
    );

    const input = screen.getByPlaceholderText("Szukaj po kodzie, etykiecie, opisie...");
    expect(input).toBeDefined();

    const addBtn = screen.getByText(/Dodaj wpis/);
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalled();
  });

  it("renders DictionariesTableView and displays empty state when items are empty", () => {
    const handleOpenAdd = vi.fn();
    render(
      <DictionariesTableView
        items={[]}
        copiedCodeId={null}
        onCopyCode={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={handleOpenAdd}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    expect(screen.getByText("Kategoria słownika jest pusta")).toBeDefined();
    const addBtn = screen.getByRole("button", { name: "Dodaj pierwszą pozycję" });
    fireEvent.click(addBtn);
    expect(handleOpenAdd).toHaveBeenCalled();
  });

  it("renders DictionariesTableView with rows and handles edit/delete", () => {
    const mockItems: OzipzDictionaryItem[] = [
      {
        id: "dict-1",
        dictType: "activityType",
        code: "WYK",
        label: "Wykład / Prelekcja",
        description: "Standardowa prelekcja",
        isSystem: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <DictionariesTableView
        items={mockItems}
        copiedCodeId={null}
        onCopyCode={vi.fn()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    expect(screen.getByText("WYK")).toBeDefined();
    expect(screen.getByText("Wykład / Prelekcja")).toBeDefined();
  });

  it("renders DictionariesTableView with kind badges for JRWA symbols", () => {
    const mockItems: OzipzDictionaryItem[] = [
      {
        id: "dict-jrwa-1",
        dictType: "jrwaSymbol",
        code: "966.1",
        label: "Trzymaj Formę",
        kind: "PROGRAMOWE",
        isSystem: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "dict-jrwa-14",
        dictType: "jrwaSymbol",
        code: "966.14",
        label: "Bezpieczne Wakacje",
        kind: "NIEPROGRAMOWE",
        isSystem: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    render(
      <DictionariesTableView
        items={mockItems}
        copiedCodeId={null}
        onCopyCode={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    expect(screen.getAllByText("PROGRAMOWE").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("NIEPROGRAMOWE").length).toBeGreaterThanOrEqual(1);
  });

  it("renders kindFilter select in DictionariesFilterBar when activeCategory is jrwaSymbol", () => {
    const handleKindFilter = vi.fn();
    render(
      <DictionariesFilterBar
        search=""
        onSearchChange={vi.fn()}
        systemFilter="all"
        onSystemFilterChange={vi.fn()}
        kindFilter="all"
        onKindFilterChange={handleKindFilter}
        totalFilteredCount={21}
        systemCount={21}
        userCount={0}
        activeCategory="jrwaSymbol"
        activeCategoryLabel="Symbole JRWA"
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    const select = screen.getByDisplayValue("Wszystkie rodzaje");
    expect(select).toBeDefined();
    fireEvent.change(select, { target: { value: "PROGRAMOWE" } });
    expect(handleKindFilter).toHaveBeenCalledWith("PROGRAMOWE");
  });
});
