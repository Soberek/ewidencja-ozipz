import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOzipzDb } from "./useOzipzDb";
import { useOzipzDbStore } from "../store/useOzipzDbStore";
import { MIGRATED_FIREBASE_DATA } from "../../../test/fixtures/migratedData";

describe("useOzipzDb Hook - Relational Selectors and Memos", () => {
  beforeEach(() => {
    act(() => {
      useOzipzDbStore.setState({
        isInitialized: true,
        actions: [...MIGRATED_FIREBASE_DATA.actions],
        programs: [...MIGRATED_FIREBASE_DATA.programs],
        participations: [...MIGRATED_FIREBASE_DATA.participations],
        materials: [...MIGRATED_FIREBASE_DATA.materials],
        distributions: [...MIGRATED_FIREBASE_DATA.distributions],
        scheduleEvents: [...MIGRATED_FIREBASE_DATA.schedules],
        jrwaCases: [...MIGRATED_FIREBASE_DATA.jrwaCases],
        publications: [...MIGRATED_FIREBASE_DATA.publications],
        facilities: [...MIGRATED_FIREBASE_DATA.facilities],
        dictionaryItems: [...MIGRATED_FIREBASE_DATA.dictionaryItems],
        letters: [...MIGRATED_FIREBASE_DATA.letters],
        scans: [...MIGRATED_FIREBASE_DATA.scans],
        templates: [...MIGRATED_FIREBASE_DATA.templates],
        staff: [...MIGRATED_FIREBASE_DATA.staff],
        contacts: [...MIGRATED_FIREBASE_DATA.contacts],
        registers: [...MIGRATED_FIREBASE_DATA.registers],
      });
    });
  });

  describe("Dynamic Dictionary Selectors", () => {
    it("extracts and dedupes municipalities", () => {
      const { result } = renderHook(() => useOzipzDb());
      expect(result.current.municipalities.length).toBeGreaterThan(0);
      const codes = result.current.municipalities.map((m) => m.code || m.label);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it("filters and dedupes jrwaSymbols omitting 070, 9010 and legacy dict-jrw- ids", () => {
      const { result } = renderHook(() => useOzipzDb());
      expect(result.current.jrwaSymbols.length).toBeGreaterThan(0);
      for (const item of result.current.jrwaSymbols) {
        expect(item.code).not.toBe("070");
        expect(item.code).not.toBe("9010");
        expect(item.id.startsWith("dict-jrw-")).toBe(false);
      }
    });

    it("extracts specialized dictionary categories properly", () => {
      const { result } = renderHook(() => useOzipzDb());
      expect(Array.isArray(result.current.activityTypes)).toBe(true);
      expect(Array.isArray(result.current.locationTypes)).toBe(true);
      expect(Array.isArray(result.current.recipientGroups)).toBe(true);
      expect(Array.isArray(result.current.materialTypes)).toBe(true);
      expect(Array.isArray(result.current.campaigns)).toBe(true);
      expect(Array.isArray(result.current.annotationReasons)).toBe(true);
      expect(Array.isArray(result.current.staffRoles)).toBe(true);
      expect(Array.isArray(result.current.contactPositions)).toBe(true);
      expect(Array.isArray(result.current.documentTypes)).toBe(true);
      expect(Array.isArray(result.current.topics)).toBe(true);
    });
  });

  describe("Computed Statistics", () => {
    it("computes accurate system-wide stats and recipient counts", () => {
      const { result } = renderHook(() => useOzipzDb());
      const { stats } = result.current;

      expect(stats.totalActions).toBe(MIGRATED_FIREBASE_DATA.actions.length);
      expect(stats.totalPrograms).toBe(MIGRATED_FIREBASE_DATA.programs.length);
      expect(stats.totalSchools).toBe(MIGRATED_FIREBASE_DATA.participations.length);
      expect(stats.totalRecipients).toBeGreaterThan(0);
      expect(stats.directRecipients).toBeGreaterThan(0);
      expect(stats.materialsDistributed).toBeGreaterThanOrEqual(0);
      expect(stats.totalFacilities).toBe(MIGRATED_FIREBASE_DATA.facilities.length);
    });
  });

  describe("Relational Getters", () => {
    it("retrieves actions and participations for a facility", () => {
      const { result } = renderHook(() => useOzipzDb());
      const sampleFacility = result.current.facilities[0];

      if (sampleFacility) {
        const facActions = result.current.getActionsForFacility(sampleFacility.id);
        expect(Array.isArray(facActions)).toBe(true);
        for (const a of facActions) {
          expect(a.facilityId).toBe(sampleFacility.id);
        }

        const facParticipations = result.current.getParticipationsForFacility(sampleFacility.id);
        expect(Array.isArray(facParticipations)).toBe(true);
        for (const p of facParticipations) {
          expect(p.facilityId).toBe(sampleFacility.id);
        }
      }
    });

    it("retrieves distributions for a material", () => {
      const { result } = renderHook(() => useOzipzDb());
      const sampleMaterial = result.current.materials[0];

      if (sampleMaterial) {
        const dists = result.current.getDistributionsForMaterial(sampleMaterial.id);
        expect(Array.isArray(dists)).toBe(true);
        for (const d of dists) {
          expect(d.materialId).toBe(sampleMaterial.id);
        }
      }
    });

    it("retrieves schedule events and JRWA cases for a program", () => {
      const { result } = renderHook(() => useOzipzDb());
      const sampleProgram = result.current.programs[0];

      if (sampleProgram) {
        const schs = result.current.getScheduleForProgram(sampleProgram.id);
        expect(Array.isArray(schs)).toBe(true);
        for (const s of schs) {
          expect(s.programId).toBe(sampleProgram.id);
        }

        const cases = result.current.getJrwaCasesForProgram(sampleProgram.id);
        expect(Array.isArray(cases)).toBe(true);
        for (const c of cases) {
          expect(c.programId).toBe(sampleProgram.id);
        }
      }
    });
  });

  describe("Register Actions Classification", () => {
    it("partitions actions into official registers: informacje, publikacje, wizytacje", () => {
      const { result } = renderHook(() => useOzipzDb());
      const { registerActions } = result.current;

      expect(registerActions.informacje).toBeDefined();
      expect(registerActions.publikacje).toBeDefined();
      expect(registerActions.wizytacje).toBeDefined();

      expect(Array.isArray(registerActions.informacje)).toBe(true);
      expect(Array.isArray(registerActions.publikacje)).toBe(true);
      expect(Array.isArray(registerActions.wizytacje)).toBe(true);
    });
  });
});
