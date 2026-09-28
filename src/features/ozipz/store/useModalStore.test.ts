import { describe, it, expect, beforeEach } from "vitest";
import { useModalStore } from "./useModalStore";

describe("useModalStore Zustand Store", () => {
  beforeEach(() => {
    useModalStore.getState().closeModal();
  });

  it("initializes with activeModal null and empty payload", () => {
    const state = useModalStore.getState();
    expect(state.activeModal).toBeNull();
    expect(state.payload).toEqual({});
  });

  it("opens a modal with specified type and payload", () => {
    useModalStore.getState().openModal("schedule", {
      item: {
        id: "sch-1",
        title: "Warsztat",
        eventDate: "2026-08-30",
        location: "SP 1",
        status: "planned",
        responsiblePerson: "Jan Kowalski",
        createdAt: "2026-08-30",
        updatedAt: "2026-08-30",
      },
    });

    const state = useModalStore.getState();
    expect(state.activeModal).toBe("schedule");
    expect(state.payload).toBeDefined();
    expect((state.payload as any).item?.title).toBe("Warsztat");
  });

  it("closes the modal and clears payload", () => {
    useModalStore.getState().openModal("dictionary", { category: "jrwaSymbol" });
    expect(useModalStore.getState().activeModal).toBe("dictionary");

    useModalStore.getState().closeModal();
    expect(useModalStore.getState().activeModal).toBeNull();
    expect(useModalStore.getState().payload).toEqual({});
  });
});
