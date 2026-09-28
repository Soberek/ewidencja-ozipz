import { OzipzDbService } from "../../../../db/client";
import type { ScheduleSlice, SliceCreator } from "./types";

export const createScheduleSlice: SliceCreator<ScheduleSlice> = (set, get) => ({
  scheduleEvents: [],

  addScheduleEvent: async (ev) => {
    const created = await OzipzDbService.addScheduleEvent(ev);
    set((state) => ({ scheduleEvents: [created, ...state.scheduleEvents] }));
    return created;
  },

  updateScheduleEvent: async (id, updates) => {
    await OzipzDbService.updateScheduleEvent(id, updates);
    set((state) => ({
      scheduleEvents: state.scheduleEvents.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    }));
  },

  deleteScheduleEvent: async (id) => {
    await OzipzDbService.deleteScheduleEvent(id);
    set((state) => ({
      scheduleEvents: state.scheduleEvents.filter((e) => e.id !== id),
      actions: state.actions.map((a) =>
        a.scheduleEventId === id ? { ...a, scheduleEventId: undefined } : a
      ),
    }));
  },

  toggleScheduleStatus: async (id, currentStatus) => {
    const isDone = currentStatus === "wykonane" || currentStatus === "done" || currentStatus === "zrealizowane";
    const nextStatus = isDone ? "zaplanowane" : "wykonane";
    await get().updateScheduleEvent(id, { status: nextStatus, manuallyCompleted: false });
  },
});
