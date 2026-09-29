import { create } from "zustand";

interface GlobalSearchState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Okno globalnej wyszukiwarki (Ctrl+K). */
export const useGlobalSearchStore = create<GlobalSearchState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
