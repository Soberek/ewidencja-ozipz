import { resolveReferenceNames } from "../../../../db/reference-names";
import { OzipzDbService } from "../../../../db/client";
import type { ProgramsSlice, SliceCreator } from "./types";

export const createProgramsSlice: SliceCreator<ProgramsSlice> = (set) => ({
  programs: [],
  participations: [],

  addProgram: async (prog) => {
    const created = await OzipzDbService.addProgram(prog);
    set((state) => ({ programs: [...state.programs, created] }));
    return created;
  },

  updateProgram: async (id, updates) => {
    await OzipzDbService.updateProgram(id, updates);
    set((state) => {
      const programs = state.programs.map((row) => row.id === id ? { ...row, ...updates, updatedAt: new Date().toISOString() } : row);
      return {
        programs,
        participations: resolveReferenceNames(state.participations, state.facilities, programs),
        actions: resolveReferenceNames(state.actions, state.facilities, programs),
        jrwaCases: resolveReferenceNames(state.jrwaCases, state.facilities, programs),
        scans: resolveReferenceNames(state.scans, state.facilities, programs),
        contacts: resolveReferenceNames(state.contacts, state.facilities, programs),
        registers: resolveReferenceNames(state.registers, state.facilities, programs),
        scheduleEvents: resolveReferenceNames(state.scheduleEvents, state.facilities, programs),
      };
    });
  },

  deleteProgram: async (id) => {
    await OzipzDbService.deleteProgram(id);
    set((state) => ({
      programs: state.programs.filter((p) => p.id !== id),
      participations: state.participations.filter((part) => part.programId !== id),
      actions: state.actions.map((a) =>
        a.programId === id ? { ...a, programId: undefined, programName: undefined } : a
      ),
      scheduleEvents: state.scheduleEvents.map((s) =>
        s.programId === id ? { ...s, programId: undefined, programName: undefined } : s
      ),
      jrwaCases: state.jrwaCases.map((j) =>
        j.programId === id ? { ...j, programId: undefined, programName: undefined } : j
      ),
      letters: state.letters.map((l) =>
        l.programId === id ? { ...l, programId: undefined } : l
      ),
      scans: state.scans.map((s) =>
        s.programId === id ? { ...s, programId: undefined, programName: undefined } : s
      ),
      registers: state.registers.map((r) =>
        r.programId === id ? { ...r, programId: undefined, programName: undefined } : r
      ),
    }));
  },

  addParticipation: async (part) => {
    const created = await OzipzDbService.addParticipation(part);
    set((state) => ({ participations: [created, ...state.participations] }));
    return created;
  },

  updateParticipation: async (id, updates) => {
    await OzipzDbService.updateParticipation(id, updates);
    set((state) => ({
      participations: state.participations.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deleteParticipation: async (id) => {
    await OzipzDbService.deleteParticipation(id);
    set((state) => ({
      participations: state.participations.filter((p) => p.id !== id),
    }));
  },
});
