import { OzipzDbService } from "../../../../db/client";
import type { ActionsSlice, SliceCreator } from "./types";
import { isActionCancelled } from "../../utils/calculators/actionMetrics";

export const createActionsSlice: SliceCreator<ActionsSlice> = (set, get) => ({
  actions: [],

  addAction: async (action) => {
    const created = await OzipzDbService.addAction(action);
    set((state) => ({ actions: [created, ...state.actions] }));
    return created;
  },

  updateAction: (id, updates) => get().updateActionWithRelations(id, updates),

  updateActionWithRelations: async (id, updates, distributionMaterials, companionDistribution) => {
    await OzipzDbService.updateActionWithRelations(id, updates, distributionMaterials, companionDistribution);
    // Baza tworzy lub aktualizuje dystrybucję zapisaną razem z działaniem — wtedy pobieramy ją ponownie.
    const hasLinked = Boolean(companionDistribution) || get().actions.some((a) => a.linkedActionId === id);
    const distributions = distributionMaterials !== undefined || hasLinked
      ? await OzipzDbService.getDistributions()
      : get().distributions;
    const linkedActions = hasLinked
      ? (await OzipzDbService.getActions()).filter((a) => a.linkedActionId === id)
      : [];
    const linkedById = new Map(linkedActions.map((a) => [a.id, a]));

    const isCancelled = isActionCancelled(updates.status);
    const nextScheduleId = isCancelled ? undefined : updates.scheduleEventId;
    const nextUpdates = isCancelled ? { ...updates, scheduleEventId: undefined } : updates;
    set((state) => ({
      actions: [
        ...linkedActions.filter((a) => !state.actions.some((existing) => existing.id === a.id)),
        ...state.actions.map((a) =>
          a.id === id ? { ...a, ...nextUpdates, updatedAt: new Date().toISOString() } : linkedById.get(a.id) ?? a
        ),
      ],
      distributions,
      scheduleEvents: state.scheduleEvents.map((s) => {
        if ((isCancelled || "scheduleEventId" in updates) && s.actionId === id && s.id !== nextScheduleId) {
          return { ...s, actionId: undefined, status: "zaplanowane" };
        }
        if (nextScheduleId && s.id === nextScheduleId) {
          return { ...s, actionId: id, status: "done" };
        }
        return s;
      }),
    }));
  },

  deleteAction: async (id) => {
    await OzipzDbService.deleteAction(id);
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id)
        .map((a) => (a.linkedActionId === id ? { ...a, linkedActionId: undefined } : a)),
      distributions: state.distributions.map((d) => d.actionId === id ? { ...d, actionId: undefined, actionTitle: undefined } : d),
      scheduleEvents: state.scheduleEvents.map((s) =>
        s.actionId === id ? { ...s, actionId: undefined, status: "zaplanowane" } : s
      ),
      jrwaCases: state.jrwaCases.map((j) =>
        j.actionId === id ? { ...j, actionId: undefined } : j
      ),
      publications: state.publications.map((p) =>
        p.actionId === id ? { ...p, actionId: undefined } : p
      ),
    }));
  },

  saveActionWithRelations: async (params) => {
    const res = await OzipzDbService.saveActionWithRelations(params);
    set((state) => {
      const nextActions = res.companionAction
        ? [res.action, res.companionAction, ...state.actions]
        : [res.action, ...state.actions];
      const nextJrwa = res.jrwaCase
        ? [res.jrwaCase, ...state.jrwaCases.filter((j) => j.id !== res.jrwaCase!.id)]
        : state.jrwaCases;

      const addedDists =
        res.distributions && res.distributions.length > 0
          ? res.distributions
          : res.distribution
          ? [res.distribution]
          : [];
      const addedDistIds = new Set(addedDists.map((d) => d.id));
      const nextDist =
        addedDists.length > 0
          ? [...addedDists, ...state.distributions.filter((d) => !addedDistIds.has(d.id))]
          : state.distributions;

      const nextSchedule = res.action.scheduleEventId
        ? state.scheduleEvents.map((ev) =>
            ev.id === res.action.scheduleEventId
              ? { ...ev, status: "done", actionId: res.action.id }
              : ev
          )
        : state.scheduleEvents;

      return {
        actions: nextActions,
        jrwaCases: nextJrwa,
        distributions: nextDist,
        scheduleEvents: nextSchedule,
      };
    });
    return res;
  },
});
