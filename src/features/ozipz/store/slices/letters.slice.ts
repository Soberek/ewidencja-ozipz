import { OzipzDbService } from "../../../../db/client";
import type { LettersSlice, SliceCreator } from "./types";

export const createLettersSlice: SliceCreator<LettersSlice> = (set) => ({
  letters: [],

  addLetter: async (letter) => {
    const created = await OzipzDbService.addLetter(letter);
    set((state) => ({ letters: [created, ...state.letters] }));
    return created;
  },

  updateLetter: async (id, updates) => {
    await OzipzDbService.updateLetter(id, updates);
    set((state) => ({
      letters: state.letters.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      ),
    }));
  },

  deleteLetter: async (id) => {
    await OzipzDbService.deleteLetter(id);
    set((state) => ({ letters: state.letters.filter((l) => l.id !== id) }));
  },
});
