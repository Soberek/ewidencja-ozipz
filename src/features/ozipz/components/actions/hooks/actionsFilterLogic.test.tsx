import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";
import { useActionsFiltering } from "./useActionsFiltering";
import { ACTION_FILTERS_STORAGE_KEY } from "./useActionFilterState";

// Filtry są zapamiętywane – każdy test zaczyna od domyślnych.
beforeEach(() => localStorage.removeItem(ACTION_FILTERS_STORAGE_KEY));

it("finds legacy actions by a selected program's name and shows that name in the filter chip", () => {
  const actions = [{ id: "legacy", title: "Prelekcja", actionType: "Prelekcja", date: "2026-09-10", programName: "Trzymaj Formę!", status: "wykonane" }] as OzipzAction[];
  const programs = [{ id: "prog-1", name: "Trzymaj Formę!" }] as OzipzProgram[];
  const { result } = renderHook(() => useActionsFiltering({ actions, programs, onDeleteAction: vi.fn(), onUpdateAction: vi.fn() }));

  act(() => result.current.setSelectedPrograms(["prog-1"]));

  expect(result.current.filteredActions.map((action) => action.id)).toEqual(["legacy"]);
  expect(result.current.activeFilterChips.find((chip) => chip.id === "prog-prog-1")?.value).toBe("Trzymaj Formę!");
});

it("publication quick filter does not match a talk whose title contains 'post'", () => {
  const actions = [
    { id: "talk", title: "Postawa zdrowotna", actionType: "Prelekcja", date: "2026-09-10", participantsCount: 20 },
    { id: "post", title: "Wpis o zdrowiu", actionType: "Publikacja media (Facebook)", date: "2026-09-10", participantsCount: 20 },
  ] as OzipzAction[];
  const { result } = renderHook(() => useActionsFiltering({ actions, onDeleteAction: vi.fn(), onUpdateAction: vi.fn() }));
  act(() => result.current.setPublicationsMode("tylko"));
  expect(result.current.filteredActions.map((action) => action.id)).toEqual(["post"]);
});
