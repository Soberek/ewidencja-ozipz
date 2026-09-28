import { OzipzDbService } from "../../../../db/client";
import type { StaffSlice, SliceCreator } from "./types";

export const createStaffSlice: SliceCreator<StaffSlice> = (set) => ({
  staff: [],

  addStaff: async (st) => {
    const created = await OzipzDbService.addStaff(st);
    set((state) => ({ staff: [...state.staff, created] }));
    return created;
  },

  updateStaff: async (id, updates) => {
    await OzipzDbService.updateStaff(id, updates);
    set((state) => ({
      staff: state.staff.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  },

  deleteStaff: async (id) => {
    await OzipzDbService.deleteStaff(id);
    set((state) => ({ staff: state.staff.filter((s) => s.id !== id) }));
  },
});
