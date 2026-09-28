import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasMockConfirm, executeConfirmedAction } from "./confirmHelper";

describe("confirmHelper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("identifies when window.confirm is not a vitest mock", () => {
    // Standard function without .mock
    const fakeConfirm = () => true;
    const orig = window.confirm;
    window.confirm = fakeConfirm as unknown as typeof window.confirm;

    expect(hasMockConfirm()).toBe(false);

    window.confirm = orig;
  });

  it("identifies when window.confirm is a vitest mock", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    expect(hasMockConfirm()).toBe(true);
  });

  it("calls mocked window.confirm and invokes action on accept", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn();
    const openDialog = vi.fn();

    executeConfirmedAction("Czy usunąć?", action, openDialog);

    expect(window.confirm).toHaveBeenCalledWith("Czy usunąć?");
    expect(action).toHaveBeenCalledTimes(1);
    expect(openDialog).not.toHaveBeenCalled();
  });

  it("calls mocked window.confirm and does not invoke action on reject", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn();
    const openDialog = vi.fn();

    executeConfirmedAction("Czy usunąć?", action, openDialog);

    expect(window.confirm).toHaveBeenCalledWith("Czy usunąć?");
    expect(action).not.toHaveBeenCalled();
    expect(openDialog).not.toHaveBeenCalled();
  });

  it("opens dialog when window.confirm is not mocked", () => {
    const orig = window.confirm;
    // Set to native-like function
    window.confirm = (() => true) as unknown as typeof window.confirm;

    const action = vi.fn();
    const openDialog = vi.fn();

    executeConfirmedAction("Czy usunąć?", action, openDialog);

    expect(openDialog).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();

    window.confirm = orig;
  });
});
