import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DictionariesSection } from "./DictionariesSection";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import type { OzipzAction, OzipzDictionaryItem } from "../../types/ozipz.types";

const dict = (id: string, dictType: string, code: string, label: string, isSystem = false): OzipzDictionaryItem => ({
  id,
  dictType,
  code,
  label,
  isSystem,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const items = [
  dict("a1", "activityType", "prelekcja", "Prelekcja (warsztat)", true),
  dict("a2", "activityType", "quiz", "Quiz wiedzy"),
  dict("r1", "recipientGroup", "uczniowie", "Uczniowie szkół podstawowych"),
  dict("rm", "register_mapping", "prelekcja", "prelekcja"),
];

const renderSection = (onDelete = vi.fn(), initialEntry = "/slowniki") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DictionariesSection dictionaryItems={items} onDelete={onDelete} />
    </MemoryRouter>
  );

describe("DictionariesSection", () => {
  beforeEach(() => {
    useOzipzDbStore.setState({
      actions: [{ actionType: "Prelekcja (warsztat)", audienceGroup: "x" } as OzipzAction],
      scheduleEvents: [],
    });
  });

  it("shows grouped category navigation without internal entries", () => {
    renderSection();
    const nav = screen.getByRole("navigation", { name: "Kategorie słowników" });
    expect(within(nav).getByText("Działania i plan pracy")).toBeDefined();
    expect(within(nav).queryByText("register_mapping")).toBeNull();
    expect(screen.getByText("Quiz wiedzy")).toBeDefined();
  });

  it("filters unused items and shows usage counts", () => {
    renderSection();
    fireEvent.change(screen.getByLabelText("Użycie w rekordach"), { target: { value: "unused" } });
    expect(screen.queryByText("Prelekcja (warsztat)")).toBeNull();
    expect(screen.getByText("Quiz wiedzy")).toBeDefined();
  });

  it("hints matches in other categories and switches category", () => {
    renderSection();
    fireEvent.change(screen.getByLabelText("Szukaj w słownikach"), { target: { value: "uczniowie" } });
    const hint = screen.getByText(/występuje także w/).parentElement!;
    fireEvent.click(within(hint).getByRole("button", { name: /Grupy Odbiorców/ }));
    expect(screen.getByText("Uczniowie szkół podstawowych")).toBeDefined();
  });

  it("reads the category from the URL", () => {
    renderSection(vi.fn(), "/slowniki?kategoria=recipientGroup");
    expect(screen.getByText("Uczniowie szkół podstawowych")).toBeDefined();
    expect(screen.queryByText("Quiz wiedzy")).toBeNull();
  });

  it("asks for confirmation before deleting", async () => {
    const onDelete = vi.fn();
    renderSection(onDelete);
    fireEvent.click(screen.getByRole("button", { name: "Usuń Quiz wiedzy" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Usuń pozycję" }));
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalledWith("a2"));
  });
});
