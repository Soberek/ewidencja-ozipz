import { create } from "zustand";

export type TableDensity = "compact" | "normal";

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  collapsedSidebarGroups: string[];
  toggleSidebarGroup: (groupId: string) => void;
  tableDensity: TableDensity;
  toggleTableDensity: () => void;
  setTableDensity: (density: TableDensity) => void;
}

export const SIDEBAR_STORAGE_KEY = "ozipz_sidebar_collapsed";
export const TABLE_DENSITY_STORAGE_KEY = "ozipz_table_density";
export const SIDEBAR_GROUPS_STORAGE_KEY = "ozipz_sidebar_collapsed_groups";

function getInitialSidebarState(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getInitialCollapsedGroups(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getInitialTableDensity(): TableDensity {
  try {
    const saved = localStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
    return saved === "compact" ? "compact" : "normal";
  } catch {
    return "normal";
  }
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: getInitialSidebarState(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarCollapsed;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return { isSidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {}
    set({ isSidebarCollapsed: collapsed });
  },
  collapsedSidebarGroups: getInitialCollapsedGroups(),
  toggleSidebarGroup: (groupId: string) =>
    set((state) => {
      const next = state.collapsedSidebarGroups.includes(groupId)
        ? state.collapsedSidebarGroups.filter((id) => id !== groupId)
        : [...state.collapsedSidebarGroups, groupId];
      try {
        localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return { collapsedSidebarGroups: next };
    }),
  tableDensity: getInitialTableDensity(),
  toggleTableDensity: () =>
    set((state) => {
      const next: TableDensity = state.tableDensity === "compact" ? "normal" : "compact";
      try {
        localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, next);
      } catch {}
      return { tableDensity: next };
    }),
  setTableDensity: (density: TableDensity) => {
    try {
      localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, density);
    } catch {}
    set({ tableDensity: density });
  },
}));

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY && event.newValue !== null) {
      useUIStore.setState({ isSidebarCollapsed: event.newValue === "true" });
    }
    if (event.key === TABLE_DENSITY_STORAGE_KEY && (event.newValue === "compact" || event.newValue === "normal")) {
      useUIStore.setState({ tableDensity: event.newValue });
    }
  });
}
