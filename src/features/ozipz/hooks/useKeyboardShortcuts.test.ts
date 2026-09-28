import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useModalStore } from "../store/useModalStore";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    useModalStore.getState().closeModal();
  });

  it("triggers onOpenNewAction on Cmd+N / Ctrl+N", () => {
    const onNewActionMock = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onOpenNewAction: onNewActionMock }));

    const event = new KeyboardEvent("keydown", {
      key: "n",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(onNewActionMock).toHaveBeenCalledTimes(1);
  });

  it("triggers onSearchFocus on Cmd+K / Ctrl+K", () => {
    const onSearchMock = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus: onSearchMock }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(onSearchMock).toHaveBeenCalledTimes(1);
  });

  it("triggers onScheduleViewChange on key 1, 2, 3 when not typing in input", () => {
    const onViewChangeMock = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onScheduleViewChange: onViewChangeMock }));

    const event1 = new KeyboardEvent("keydown", { key: "1", bubbles: true });
    window.dispatchEvent(event1);
    expect(onViewChangeMock).toHaveBeenCalledWith(1);

    const event2 = new KeyboardEvent("keydown", { key: "2", bubbles: true });
    window.dispatchEvent(event2);
    expect(onViewChangeMock).toHaveBeenCalledWith(2);
  });
});
