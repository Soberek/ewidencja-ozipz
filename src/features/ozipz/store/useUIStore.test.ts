import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./useUIStore";

describe("useUIStore Zustand Store", () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({ isSidebarCollapsed: false, tableDensity: "normal" });
  });

  it("initializes with isSidebarCollapsed = false and tableDensity = normal", () => {
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
    expect(useUIStore.getState().tableDensity).toBe("normal");
  });

  it("toggles sidebar state with toggleSidebar()", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });

  it("sets explicit sidebar state with setSidebarCollapsed()", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    useUIStore.getState().setSidebarCollapsed(false);
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });

  it("persists collapsed state to localStorage when toggling", () => {
    useUIStore.getState().toggleSidebar();
    expect(localStorage.getItem("ozipz_sidebar_collapsed")).toBe("true");

    useUIStore.getState().toggleSidebar();
    expect(localStorage.getItem("ozipz_sidebar_collapsed")).toBe("false");
  });

  it("persists collapsed state to localStorage when set explicitly", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(localStorage.getItem("ozipz_sidebar_collapsed")).toBe("true");

    useUIStore.getState().setSidebarCollapsed(false);
    expect(localStorage.getItem("ozipz_sidebar_collapsed")).toBe("false");
  });

  it("synchronizes collapsed state when storage event fires from another tab", () => {
    useUIStore.setState({ isSidebarCollapsed: false });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "ozipz_sidebar_collapsed",
        newValue: "true",
      })
    );
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "ozipz_sidebar_collapsed",
        newValue: "false",
      })
    );
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });

  it("toggles table density between normal and compact", () => {
    expect(useUIStore.getState().tableDensity).toBe("normal");
    useUIStore.getState().toggleTableDensity();
    expect(useUIStore.getState().tableDensity).toBe("compact");
    expect(localStorage.getItem("ozipz_table_density")).toBe("compact");

    useUIStore.getState().toggleTableDensity();
    expect(useUIStore.getState().tableDensity).toBe("normal");
    expect(localStorage.getItem("ozipz_table_density")).toBe("normal");
  });

  it("sets explicit table density and syncs via storage event", () => {
    useUIStore.getState().setTableDensity("compact");
    expect(useUIStore.getState().tableDensity).toBe("compact");

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "ozipz_table_density",
        newValue: "normal",
      })
    );
    expect(useUIStore.getState().tableDensity).toBe("normal");
  });
});
