import { OzipzDbService } from "../../../../db/client";
import type { ScansSlice, SliceCreator } from "./types";

export const createScansSlice: SliceCreator<ScansSlice> = (set) => ({
  scans: [],

  addScan: async (scan) => {
    const created = await OzipzDbService.addScan(scan);
    set((state) => ({ scans: [created, ...state.scans] }));
    return created;
  },

  deleteScan: async (id) => {
    await OzipzDbService.deleteScan(id);
    set((state) => ({ scans: state.scans.filter((s) => s.id !== id) }));
  },
});
