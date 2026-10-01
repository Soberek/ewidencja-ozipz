import { describe, expect, it } from "vitest";
import { classifyScheduleEvent, linkedScheduleEventIds } from "./scheduleEventStatus";

const ev = (status: string, extra: { id?: string; actionId?: string } = {}) => ({ id: extra.id ?? "e1", status, actionId: extra.actionId });

describe("classifyScheduleEvent", () => {
  const none = new Set<string>();

  it("rozpoznaje zrealizowane po statusie i po podpiętym działaniu", () => {
    expect(classifyScheduleEvent(ev("wykonane"), none)).toBe("completed");
    expect(classifyScheduleEvent(ev("zaplanowane", { actionId: "a1" }), none)).toBe("completed");
    expect(classifyScheduleEvent(ev("zaplanowane", { id: "e7" }), linkedScheduleEventIds([{ scheduleEventId: "e7" }]))).toBe("completed");
  });

  it("odroczone i odwołane (także w wariantach) nie są zaplanowane", () => {
    for (const s of ["odroczone", "postponed", "odwolane", "odwołane", "cancelled", "anulowane"]) {
      expect(classifyScheduleEvent(ev(s), none)).toBe("postponed");
    }
  });

  it("w toku i zaplanowane", () => {
    expect(classifyScheduleEvent(ev("w_toku"), none)).toBe("in_progress");
    expect(classifyScheduleEvent(ev("zaplanowane"), none)).toBe("planned");
    expect(classifyScheduleEvent(ev(""), none)).toBe("planned");
  });
});
