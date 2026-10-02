import type { OzipzScheduleEvent, OzipzAction } from "../../../features/ozipz/types/ozipz.types";
import type { IScheduleRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { assertNoClosedActionReference, loadFromStorage, saveToStorage, withStorageRollback } from "./storage";

export class FallbackScheduleRepository implements IScheduleRepository {
  async getScheduleEvents(): Promise<OzipzScheduleEvent[]> {
    return loadFromStorage<OzipzScheduleEvent[]>("schedules", []);
  }

  async addScheduleEvent(event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent> {
    const list = await this.getScheduleEvents();
    const id = generateId("sch");
    const now = new Date().toISOString();
    const created: OzipzScheduleEvent = { ...event, id, createdAt: now, updatedAt: now };
    saveToStorage("schedules", [...list, created]);
    return created;
  }

  async updateScheduleEvent(id: string, updates: Partial<OzipzScheduleEvent>): Promise<void> {
    const list = await this.getScheduleEvents();
    const now = new Date().toISOString();
    saveToStorage("schedules", list.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s)));
  }

  async deleteScheduleEvent(id: string): Promise<void> {
    assertNoClosedActionReference("scheduleEventId", id);
    return withStorageRollback(["schedules", "actions"], async () => {
      const list = await this.getScheduleEvents();
      saveToStorage("schedules", list.filter((s) => s.id !== id));
      const actions = loadFromStorage<OzipzAction[]>("actions", []);
      saveToStorage("actions", actions.map((a) => (a.scheduleEventId === id ? { ...a, scheduleEventId: undefined } : a)));
    });
  }

  async toggleScheduleStatus(id: string, currentStatus: string): Promise<void> {
    const nextStatus = currentStatus === "wykonane" ? "planowane" : "wykonane";
    await this.updateScheduleEvent(id, { status: nextStatus });
  }
}
