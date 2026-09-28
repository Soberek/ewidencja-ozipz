import { describe, it, expect, beforeEach } from "vitest";
import { useOzipzDbStore } from "./useOzipzDbStore";

describe("Adversarial Verification Part 2: Edge Cases & Material Cascades", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useOzipzDbStore.getState().loadAll();
  });

  it("updates action and synchronizes distributions in updateActionWithRelations", async () => {
    const state = useOzipzDbStore.getState();

    const action = await state.addAction({
      title: "Akcja bazowa",
      actionType: "wykład",
      date: "2026-10-01",
      facilityName: "Liceum 1",
      municipality: "Myślibórz",
      topic: "inne",
      audienceGroup: "Młodzież",
      participantsCount: 30,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 10,
      ezdStatus: "brak",
      status: "wykonane",
      leadEducator: "Marek",
    });

    // Add initial distribution
    const dist1 = await state.addDistribution({
      materialTitle: "Stara ulotka",
      quantity: 10,
      actionId: action.id,
      distributionDate: "2026-10-01",
      recipientName: "Liceum 1",
      assignedEducator: "Marek",
      purpose: "Przekazanie",
    });

    expect(useOzipzDbStore.getState().distributions.some((d) => d.id === dist1.id)).toBe(true);

    // Call updateActionWithRelations with replacement distributions (including one with qty 0 that must be ignored)
    await state.updateActionWithRelations(
      action.id,
      { title: "Zaktualizowana akcja", participantsCount: 35 },
      [
        { materialId: "mat-new", title: "Nowy plakat", type: "plakat", quantity: 20 },
        { materialId: "mat-zero", title: "Pusty materiał", type: "ulotka", quantity: 0 },
      ]
    );

    const s = useOzipzDbStore.getState();
    const updatedAction = s.actions.find((a) => a.id === action.id);
    expect(updatedAction?.title).toBe("Zaktualizowana akcja");
    expect(updatedAction?.participantsCount).toBe(35);

    // Old distribution must be removed
    expect(s.distributions.some((d) => d.id === dist1.id)).toBe(false);

    // Only non-zero new distribution should exist for this action
    const actionDists = s.distributions.filter((d) => d.actionId === action.id);
    expect(actionDists.length).toBe(1);
    expect(actionDists[0].materialTitle).toBe("Nowy plakat");
    expect(actionDists[0].quantity).toBe(20);

    // Now update action without passing distributionMaterials -> distributions must remain intact
    await state.updateActionWithRelations(action.id, { notes: "Dodatkowa notatka" });
    const sAfter = useOzipzDbStore.getState();
    const actionDistsAfter = sAfter.distributions.filter((d) => d.actionId === action.id);
    expect(actionDistsAfter.length).toBe(1);
    expect(actionDistsAfter[0].materialTitle).toBe("Nowy plakat");
  });

  it("cascades unlinking when deleting a material across actions and distributions", async () => {
    const state = useOzipzDbStore.getState();

    const mat = await state.addMaterial({
      title: "Broszura Bezpieczne Wakacje",
      materialType: "broszura",
      topic: "bezpieczenstwo",
      publisher: "PSSE",
    });

    const action = await state.addAction({
      title: "Akcja z materiałem",
      actionType: "prelekcja",
      date: "2026-10-05",
      facilityName: "Szkoła 2",
      municipality: "Barlinek",
      topic: "inne",
      audienceGroup: "Dzieci",
      participantsCount: 15,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 20,
      ezdStatus: "w_ezd",
      status: "wykonane",
      leadEducator: "Jan",
      materialId: mat.id,
    });

    const dist = await state.addDistribution({
      materialId: mat.id,
      materialTitle: mat.title,
      quantity: 20,
      distributionDate: "2026-10-05",
      recipientName: "Szkoła 2",
      assignedEducator: "Jan",
      purpose: "Edukacja",
    });

    expect(useOzipzDbStore.getState().actions.find((a) => a.id === action.id)?.materialId).toBe(mat.id);
    expect(useOzipzDbStore.getState().distributions.find((d) => d.id === dist.id)?.materialId).toBe(mat.id);

    // Act: Delete material
    await state.deleteMaterial(mat.id);

    const s = useOzipzDbStore.getState();
    expect(s.materials.some((m) => m.id === mat.id)).toBe(false);
    expect(s.actions.find((a) => a.id === action.id)?.materialId).toBeUndefined();
    expect(s.distributions.find((d) => d.id === dist.id)?.materialId).toBeUndefined();
  });

  it("handles batchUpsertFacilities deduplicating and updating records correctly", async () => {
    const state = useOzipzDbStore.getState();

    const initialCount = state.facilities.length;
    const existing = state.facilities[0];

    const updatedExisting = { ...existing, notes: "Zaktualizowana notatka batch" };
    const newFac = {
      id: "fac-batch-1",
      name: "Nowa placówka batchowa",
      type: "szkola_podstawowa",
      address: "Polna 1",
      city: "Barlinek",
      postalCode: "74-320",
      municipality: "Barlinek",
      county: "myśliborski",
      leadingAuthority: "Gmina Barlinek",
      isComplex: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await state.batchUpsertFacilities([updatedExisting, newFac]);
    expect(res.length).toBe(initialCount + 1);

    const s = useOzipzDbStore.getState();
    expect(s.facilities.length).toBe(initialCount + 1);
    expect(s.facilities.find((f) => f.id === existing.id)?.notes).toBe("Zaktualizowana notatka batch");
    expect(s.facilities.find((f) => f.id === "fac-batch-1")?.name).toBe("Nowa placówka batchowa");
  });

  it("handles non-existent entity IDs gracefully without throwing or mutating other state", async () => {
    const state = useOzipzDbStore.getState();
    const snapshotActionsCount = state.actions.length;
    const snapshotProgramsCount = state.programs.length;
    const snapshotFacilitiesCount = state.facilities.length;

    await expect(state.deleteAction("non-existent-action-id")).resolves.not.toThrow();
    await expect(state.deleteProgram("non-existent-prog-id")).resolves.not.toThrow();
    await expect(state.deleteFacility("non-existent-fac-id")).resolves.not.toThrow();
    await expect(state.deleteScheduleEvent("non-existent-sched-id")).resolves.not.toThrow();

    const s = useOzipzDbStore.getState();
    expect(s.actions.length).toBe(snapshotActionsCount);
    expect(s.programs.length).toBe(snapshotProgramsCount);
    expect(s.facilities.length).toBe(snapshotFacilitiesCount);
  });

  it("executes minimal saveActionWithRelations without autoCreateJrwa or distributions", async () => {
    const state = useOzipzDbStore.getState();

    const sched = await state.addScheduleEvent({
      title: "Harmonogram minimalistyczny",
      eventDate: "2026-10-10",
      location: "Przedszkole 1",
      month: 10,
      year: 2026,
      status: "planned",
      responsiblePerson: "Kamil",
    });

    const initialJrwaCount = state.jrwaCases.length;
    const initialDistCount = state.distributions.length;

    const res = await state.saveActionWithRelations({
      action: {
        title: "Prosta akcja",
        actionType: "pogadanka",
        date: "2026-10-10",
        facilityName: "Przedszkole 1",
        municipality: "Myślibórz",
        topic: "inne",
        audienceGroup: "Dzieci",
        participantsCount: 15,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        ezdStatus: "brak",
        status: "wykonane",
        leadEducator: "Kamil",
        scheduleEventId: sched.id,
      },
    });

    expect(res.action.id).toBeDefined();
    expect(res.jrwaCase).toBeUndefined();
    expect(res.distribution).toBeUndefined();

    const s = useOzipzDbStore.getState();
    expect(s.jrwaCases.length).toBe(initialJrwaCount);
    expect(s.distributions.length).toBe(initialDistCount);

    const updatedSched = s.scheduleEvents.find((e) => e.id === sched.id);
    expect(updatedSched?.status).toBe("done");
    expect(updatedSched?.actionId).toBe(res.action.id);
  });

  it("handles toggleScheduleStatus for both 'done' and 'zrealizowane' synonyms", async () => {
    const state = useOzipzDbStore.getState();

    const sched = await state.addScheduleEvent({
      title: "Zadanie z polskim statusem",
      eventDate: "2026-10-15",
      location: "PSSE Myślibórz",
      month: 10,
      year: 2026,
      status: "zrealizowane",
      responsiblePerson: "Jan",
    });

    await state.toggleScheduleStatus(sched.id, "zrealizowane");
    expect(useOzipzDbStore.getState().scheduleEvents.find((e) => e.id === sched.id)?.status).toBe("zaplanowane");

    await state.toggleScheduleStatus(sched.id, "zaplanowane");
    expect(useOzipzDbStore.getState().scheduleEvents.find((e) => e.id === sched.id)?.status).toBe("wykonane");
  });
});
