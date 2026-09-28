import { OzipzDbService } from "../../../../db/client";
import type { RegistersSlice, SliceCreator } from "./types";

export const createRegistersSlice: SliceCreator<RegistersSlice> = (set) => ({
  registers: [],

  addRegister: async (reg) => {
    const created = await OzipzDbService.addRegister(reg);
    set((state) => ({ registers: [created, ...state.registers] }));
    return created;
  },

  updateRegister: async (id, updates) => {
    await OzipzDbService.updateRegister(id, updates);
    set((state) => ({
      registers: state.registers.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  deleteRegister: async (id) => {
    await OzipzDbService.deleteRegister(id);
    set((state) => ({ registers: state.registers.filter((r) => r.id !== id) }));
  },
});
