import { resolveReferenceNames } from "../../../../db/reference-names";
import { OzipzDbService } from "../../../../db/client";
import type { FacilitiesSlice, SliceCreator } from "./types";

export const createFacilitiesSlice: SliceCreator<FacilitiesSlice> = (set) => ({
  facilities: [],

  addFacility: async (fac) => {
    const created = await OzipzDbService.addFacility(fac);
    set((state) => ({ facilities: [created, ...state.facilities] }));
    return created;
  },

  updateFacility: async (id, updates) => {
    await OzipzDbService.updateFacility(id, updates);
    set((state) => {
      const facilities = state.facilities.map((row) => row.id === id ? { ...row, ...updates, updatedAt: new Date().toISOString() } : row);
      return {
        facilities,
        participations: resolveReferenceNames(state.participations, facilities, state.programs),
        actions: resolveReferenceNames(state.actions, facilities, state.programs),
        jrwaCases: resolveReferenceNames(state.jrwaCases, facilities, state.programs),
        scans: resolveReferenceNames(state.scans, facilities, state.programs),
        contacts: resolveReferenceNames(state.contacts, facilities, state.programs),
        registers: resolveReferenceNames(state.registers, facilities, state.programs),
        scheduleEvents: resolveReferenceNames(state.scheduleEvents, facilities, state.programs),
      };
    });
  },

  deleteFacility: async (id) => {
    await OzipzDbService.deleteFacility(id);
    set((state) => ({
      facilities: state.facilities
        .filter((f) => f.id !== id)
        .map((f) => (f.parentFacilityId === id ? { ...f, parentFacilityId: undefined } : f)),
      participations: state.participations.filter((part) => part.facilityId !== id),
      actions: state.actions.map((a) =>
        a.facilityId === id ? { ...a, facilityId: undefined } : a
      ),
      distributions: state.distributions.map((d) =>
        d.facilityId === id ? { ...d, facilityId: undefined } : d
      ),
      scheduleEvents: state.scheduleEvents.map((s) =>
        s.facilityId === id ? { ...s, facilityId: undefined } : s
      ),
      jrwaCases: state.jrwaCases.map((j) =>
        j.facilityId === id ? { ...j, facilityId: undefined, facilityName: undefined } : j
      ),
      letters: state.letters.map((l) =>
        l.facilityId === id ? { ...l, facilityId: undefined } : l
      ),
      scans: state.scans.map((s) =>
        s.facilityId === id ? { ...s, facilityId: undefined } : s
      ),
      contacts: state.contacts.map((c) =>
        c.facilityId === id ? { ...c, facilityId: undefined } : c
      ),
      registers: state.registers.map((r) =>
        r.facilityId === id ? { ...r, facilityId: undefined, facilityName: undefined } : r
      ),
    }));
  },

  batchUpsertFacilities: async (facs) => {
    const res = await OzipzDbService.batchUpsertFacilities(facs);
    set((state) => {
      const existingMap = new Map(state.facilities.map((f) => [f.id, f]));
      for (const f of res) {
        existingMap.set(f.id, f);
      }
      const facilities = Array.from(existingMap.values());
      return {
        facilities,
        participations: resolveReferenceNames(state.participations, facilities, state.programs),
        actions: resolveReferenceNames(state.actions, facilities, state.programs),
        jrwaCases: resolveReferenceNames(state.jrwaCases, facilities, state.programs),
        scans: resolveReferenceNames(state.scans, facilities, state.programs),
        contacts: resolveReferenceNames(state.contacts, facilities, state.programs),
        registers: resolveReferenceNames(state.registers, facilities, state.programs),
        scheduleEvents: resolveReferenceNames(state.scheduleEvents, facilities, state.programs),
      };
    });
    return res;
  },

  getFacilityActivitySummary: async (facilityId) => {
    return OzipzDbService.getFacilityActivitySummary(facilityId);
  },
});
