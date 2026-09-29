import { describe, it, expect, beforeEach, vi } from "vitest";
import { OzipzDbService } from "../../../db/client";
import {
  useOzipzDbStore,
  useActions,
  usePrograms,
  useFacilities,
  useDictionaries,
  useSchedule,
  useRelationalSelectors,
} from "./useOzipzDbStore";
import { seedFallbackStorage } from "../../../test/fixtures/seedFallbackStorage";

describe("useOzipzDbStore & Domain Hooks", () => {
  beforeEach(async () => {
    localStorage.clear(); seedFallbackStorage();
    await useOzipzDbStore.getState().loadAll();
  });

  it("does not start duplicate collection reads during initialization", async () => {
    const actions = useOzipzDbStore.getState().actions;
    let release!: (value: typeof actions) => void;
    const spy = vi.spyOn(OzipzDbService, "getActions").mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const first = useOzipzDbStore.getState().loadAll();
    const second = useOzipzDbStore.getState().loadAll();
    expect(spy).toHaveBeenCalledTimes(1);
    release(actions);
    await Promise.all([first, second]);
    expect(useOzipzDbStore.getState().isInitialized).toBe(true);
    spy.mockRestore();
  });

  it("loads all 16 collections from default dataset", () => {
    const state = useOzipzDbStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.actions.length).toBeGreaterThanOrEqual(68);
    expect(state.programs.length).toBeGreaterThan(0);
    expect(state.materials.length).toBeGreaterThan(0);
    expect(state.facilities.length).toBeGreaterThanOrEqual(0);
    expect(state.jrwaCases.length).toBe(109);
  });

  it("exposes a failed database load instead of marking stale data as initialized", async () => {
    const getActionsSpy = vi.spyOn(OzipzDbService, "getActions").mockRejectedValueOnce(new Error("Baza niedostępna"));

    await useOzipzDbStore.getState().loadAll();

    expect(useOzipzDbStore.getState().isInitialized).toBe(false);
    expect(useOzipzDbStore.getState().loadError).toContain("Baza niedostępna");
    getActionsSpy.mockRestore();
  });

  it("adds and removes an action reactivity in store", async () => {
    const state = useOzipzDbStore.getState();
    const created = await state.addAction({
      title: "Testowe Działanie Edukacyjne",
      actionType: "prelekcja",
      date: "2026-09-01",
      facilityName: "SP 1",
      municipality: "Barlinek",
      topic: "zywienie_i_aktywnosc",
      audienceGroup: "Dzieci",
      participantsCount: 25,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan Kowalski",
    });

    expect(created.id).toBeDefined();
    expect(useOzipzDbStore.getState().actions.some((a) => a.id === created.id)).toBe(true);

    await state.deleteAction(created.id);
    expect(useOzipzDbStore.getState().actions.some((a) => a.id === created.id)).toBe(false);
  });

  it("persists month locks through the store and blocks changes until unlocked", async () => {
    const state = useOzipzDbStore.getState();
    const action = await state.addAction({
      title: "Działanie do rozliczenia", actionType: "Prelekcja", date: "2026-08-20",
      facilityName: "Szkoła", municipality: "Myślibórz", topic: "Zdrowie", audienceGroup: "Uczniowie",
      participantsCount: 20, indirectRecipientsCount: 0, materialsDistributedCount: 0,
      ezdStatus: "w_ezd", status: "wykonane", leadEducator: "Jan",
    });
    await state.setMonthClosed("2026-08", true);
    await state.loadAll();
    expect(useOzipzDbStore.getState().closedMonths).toContain("2026-08");
    await expect(state.updateAction(action.id, { title: "Zmienione" })).rejects.toThrow(/zamknięt/);
    await expect(state.updateActionWithRelations(action.id, { title: "Zmienione" })).rejects.toThrow(/zamknięt/);
    await expect(state.deleteAction(action.id)).rejects.toThrow(/zamknięt/);

    await state.setMonthClosed("2026-08", false);
    await state.setMonthClosed("2026-09", true);
    await state.loadAll();
    expect(useOzipzDbStore.getState().closedMonths).toEqual(["2026-09"]);
    await expect(state.updateAction(action.id, { date: "2026-09-01" })).rejects.toThrow(/zamknięt/);
    await expect(state.updateActionWithRelations(action.id, { date: "2026-09-01" })).rejects.toThrow(/zamknięt/);

    expect(useOzipzDbStore.getState().actions.find((item) => item.id === action.id)).toEqual(action);
    expect((await OzipzDbService.getActions()).find((item) => item.id === action.id)).toEqual(action);

    await state.setMonthClosed("2026-09", false);
    await state.updateAction(action.id, { date: "2026-09-01" });
    expect(useOzipzDbStore.getState().actions.find((item) => item.id === action.id)?.date).toBe("2026-09-01");
    await state.deleteAction(action.id);
    expect((await OzipzDbService.getActions()).some((item) => item.id === action.id)).toBe(false);
  });

  it("performs atomic saveActionWithRelations with JRWA case creation and distribution", async () => {
    const state = useOzipzDbStore.getState();
    const initialActionsCount = state.actions.length;
    const initialJrwaCount = state.jrwaCases.length;
    const initialDistCount = state.distributions.length;

    const res = await state.saveActionWithRelations({
      action: {
        title: "Działanie ze Sprawą i Rozdzielnikiem",
        actionType: "warsztat",
        date: "2026-09-10",
        facilityName: "ZSP Barlinek",
        municipality: "Barlinek",
        topic: "tyton",
        audienceGroup: "Młodzież",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 50,
        ezdStatus: "w_ezd",
        status: "wykonane",
        leadEducator: "Anna Nowak",
      },
      autoCreateJrwa: {
        section: "OZiPZ",
        jrwaSymbol: "0442",
        caseNumber: 99,
        year: 2026,
        fullCaseSign: "OZiPZ.0442.99.2026",
      },
      distributionMaterial: {
        materialId: "mat-1",
        title: "Broszura Antytytoniowa",
        type: "ulotka",
        quantity: 50,
      },
    });

    expect(res.action.id).toBeDefined();
    expect(res.jrwaCase).toBeDefined();
    expect(res.jrwaCase?.fullCaseSign).toBe("OZiPZ.0442.99.2026");
    expect(res.distribution).toBeDefined();
    expect(res.distribution?.quantity).toBe(50);

    const updatedState = useOzipzDbStore.getState();
    expect(updatedState.actions.length).toBe(initialActionsCount + 1);
    expect(updatedState.jrwaCases.length).toBe(initialJrwaCount + 1);
    expect(updatedState.distributions.length).toBe(initialDistCount + 1);
  });

  it("cascades foreign key unlinking on deleteProgram", async () => {
    const state = useOzipzDbStore.getState();
    const prog = await state.addProgram({
      name: "Program Testowy",
      code: "PROG_TEST",
      editionYear: "2026",
      jrwaSymbol: "966.1",
      description: "Opis",
      targetAudience: "Wszyscy",
      status: "aktywny",
      participatingSchoolsCount: 0,
      totalPupilsReached: 0,
    });

    const action = await state.addAction({
      title: "Akcja podpięta pod program",
      actionType: "spotkanie",
      date: "2026-09-15",
      facilityName: "SP Test",
      municipality: "Myślibórz",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 10,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan",
      programId: prog.id,
      programName: prog.name,
    });

    expect(useOzipzDbStore.getState().actions.find((a) => a.id === action.id)?.programId).toBe(prog.id);

    await state.deleteProgram(prog.id);

    const updatedAction = useOzipzDbStore.getState().actions.find((a) => a.id === action.id);
    expect(updatedAction?.programId).toBeUndefined();
    expect(updatedAction?.programName).toBeUndefined();
    expect(useOzipzDbStore.getState().programs.some((p) => p.id === prog.id)).toBe(false);
  });

  it("handles schedule status toggle correctly", async () => {
    const state = useOzipzDbStore.getState();
    const ev = await state.addScheduleEvent({
      title: "Zadanie harmonogramu test",
      eventDate: "2026-10-01",
      location: "SP 1",
      month: 10,
      year: 2026,
      status: "planned",
      responsiblePerson: "Jan",
    });

    expect(ev.id).toBeDefined();
    await state.toggleScheduleStatus(ev.id, "zaplanowane");
    expect(useOzipzDbStore.getState().scheduleEvents.find((e) => e.id === ev.id)?.status).toBe("wykonane");

    await state.toggleScheduleStatus(ev.id, "wykonane");
    expect(useOzipzDbStore.getState().scheduleEvents.find((e) => e.id === ev.id)?.status).toBe("zaplanowane");
  });

  it("prevents deletion of system dictionary items", async () => {
    const state = useOzipzDbStore.getState();
    const systemItem = state.dictionaryItems.find((d) => d.isSystem);
    expect(systemItem).toBeDefined();

    if (systemItem) {
      const countBefore = state.dictionaryItems.length;
      await state.deleteDictionaryItem(systemItem.id);
      expect(useOzipzDbStore.getState().dictionaryItems.length).toBe(countBefore);
    }
  });

  it("re-exports domain hooks correctly from main entry", () => {
    expect(typeof useActions).toBe("function");
    expect(typeof usePrograms).toBe("function");
    expect(typeof useFacilities).toBe("function");
    expect(typeof useDictionaries).toBe("function");
    expect(typeof useSchedule).toBe("function");
    expect(typeof useRelationalSelectors).toBe("function");
  });
});
