import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useActions,
  usePrograms,
  useMaterials,
  useSchedule,
  useFacilities,
  useJrwa,
  useDictionaries,
  useStaff,
  useContacts,
  useLetters,
  useScans,
  useRegisters,
  useTemplates,
  usePublications,
  useRelationalSelectors,
  useMonthlyTargets,
} from "./domainHooks";
import * as mainStoreEntry from "./useOzipzDbStore";
import { useOzipzDbStore } from "./useOzipzDbStore";
import { MIGRATED_FIREBASE_DATA } from "../../../test/fixtures/migratedData";
import type {
  OzipzAction,
  OzipzMonthlyTarget,
  OzipzSchoolParticipation,
  OzipzDistribution,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzContact,
  OzipzLetter,
  OzipzScan,
  OzipzRegisterItem,
  OzipzPublication,
} from "../types/ozipz.types";

describe("Empirical Challenge: Domain Hooks (domainHooks.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useOzipzDbStore.setState({
        isInitialized: true,
        isLoading: false,
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
        monthlyTargets: [],
      });
    });
  });

  describe("1. Completeness & Correct Selection for All 16 Hooks", () => {
    it("verifies all 16 hooks select correct initial collections and handlers", () => {
      const hActions = renderHook(() => useActions()).result.current;
      expect(Array.isArray(hActions.actions)).toBe(true);
      expect(typeof hActions.addAction).toBe("function");

      const hPrograms = renderHook(() => usePrograms()).result.current;
      expect(Array.isArray(hPrograms.programs)).toBe(true);
      expect(Array.isArray(hPrograms.participations)).toBe(true);

      const hMaterials = renderHook(() => useMaterials()).result.current;
      expect(Array.isArray(hMaterials.materials)).toBe(true);
      expect(Array.isArray(hMaterials.distributions)).toBe(true);
      expect(Array.isArray(hMaterials.materialTypes)).toBe(true);

      const hSchedule = renderHook(() => useSchedule()).result.current;
      expect(Array.isArray(hSchedule.scheduleEvents)).toBe(true);

      const hFacilities = renderHook(() => useFacilities()).result.current;
      expect(Array.isArray(hFacilities.facilities)).toBe(true);
      expect(Array.isArray(hFacilities.locationTypes)).toBe(true);
      expect(Array.isArray(hFacilities.municipalities)).toBe(true);

      const hJrwa = renderHook(() => useJrwa()).result.current;
      expect(Array.isArray(hJrwa.jrwaCases)).toBe(true);

      const hDict = renderHook(() => useDictionaries()).result.current;
      expect(Array.isArray(hDict.dictionaryItems)).toBe(true);
      expect(typeof hDict.getByCategory).toBe("function");

      const hStaff = renderHook(() => useStaff()).result.current;
      expect(Array.isArray(hStaff.staff)).toBe(true);

      const hContacts = renderHook(() => useContacts()).result.current;
      expect(Array.isArray(hContacts.contacts)).toBe(true);

      const hLetters = renderHook(() => useLetters()).result.current;
      expect(Array.isArray(hLetters.letters)).toBe(true);

      const hScans = renderHook(() => useScans()).result.current;
      expect(Array.isArray(hScans.scans)).toBe(true);

      const hRegisters = renderHook(() => useRegisters()).result.current;
      expect(Array.isArray(hRegisters.registers)).toBe(true);

      const hTemplates = renderHook(() => useTemplates()).result.current;
      expect(Array.isArray(hTemplates.templates)).toBe(true);

      const hPublications = renderHook(() => usePublications()).result.current;
      expect(Array.isArray(hPublications.publications)).toBe(true);

      const hRelational = renderHook(() => useRelationalSelectors()).result.current;
      expect(typeof hRelational.getActionsForFacility).toBe("function");

      const hTargets = renderHook(() => useMonthlyTargets()).result.current;
      expect(Array.isArray(hTargets.monthlyTargets)).toBe(true);
    });
  });

  describe("2. Reactivity & State Propagation", () => {
    it("updates useActions reactively when store changes", () => {
      const { result } = renderHook(() => useActions());
      const initialCount = result.current.actions.length;

      act(() => {
        const dummy: OzipzAction = {
          id: "act-challenge-1",
          title: "Challenger Action",
          actionType: "warsztat",
          date: "2026-09-05",
          facilityName: "SP 1",
          municipality: "Barlinek",
          topic: "tyton",
          audienceGroup: "Dzieci",
          participantsCount: 20,
          materialsDistributedCount: 10,
          ezdStatus: "w_ezd",
          status: "wykonane",
          leadEducator: "Jan",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        useOzipzDbStore.setState((s) => ({ actions: [dummy, ...s.actions] }));
      });

      expect(result.current.actions.length).toBe(initialCount + 1);
      expect(result.current.actions[0].id).toBe("act-challenge-1");
    });

    it("recalculates derived materialTypes in useMaterials when dictionaryItems change", () => {
      const { result } = renderHook(() => useMaterials());
      const initialTypeCount = result.current.materialTypes.length;

      act(() => {
        useOzipzDbStore.setState((s) => ({
          dictionaryItems: [
            ...s.dictionaryItems,
            { id: "dict-mat-new", dictType: "materialType", code: "plakat_a2", label: "Plakat A2", isSystem: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }));
      });

      expect(result.current.materialTypes.length).toBe(initialTypeCount + 1);
      expect(result.current.materialTypes.some((m) => m.code === "plakat_a2")).toBe(true);
    });

    it("recalculates municipalities and locationTypes in useFacilities", () => {
      const { result } = renderHook(() => useFacilities());
      const initMunCount = result.current.municipalities.length;

      act(() => {
        useOzipzDbStore.setState((s) => ({
          dictionaryItems: [
            ...s.dictionaryItems,
            { id: "dict-mun-new", dictType: "municipality", code: "nowa_gmina", label: "Nowa Gmina", isSystem: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }));
      });

      expect(result.current.municipalities.length).toBe(initMunCount + 1);
      expect(result.current.municipalities.some((m) => m.code === "nowa_gmina")).toBe(true);
    });
  });

  describe("3. Granular Selectors & Non-Interference", () => {
    it("preserves stable identity for hooks when unrelated slices change", () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useActions();
      });

      const initialCount = renderCount;
      const initialActions = result.current.actions;

      act(() => {
        useOzipzDbStore.setState((s) => ({
          letters: [
            ...s.letters,
            { id: "let-unrelated", direction: "wychodzace" as const, letterNumber: "1/2026", letterDate: "2026-09-05", senderRecipient: "PSSE", subject: "Pismo testowe", assignedPerson: "Jan", status: "nowe", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }));
      });

      expect(result.current.actions).toBe(initialActions);
      expect(renderCount).toBe(initialCount);
    });
  });

  describe("4. Exhaustive Verification of All 19 useRelationalSelectors Getters", () => {
    it("correctly queries all 19 relational associations and updates reactively", () => {
      const { result } = renderHook(() => useRelationalSelectors());

      const fId = "f-rel-test";
      const pId = "p-rel-test";
      const mId = "m-rel-test";
      const aId = "a-rel-test";

      // Empty queries
      expect(result.current.getActionsForFacility(fId)).toEqual([]);
      expect(result.current.getActionsForProgram(pId)).toEqual([]);
      expect(result.current.getParticipationsForFacility(fId)).toEqual([]);
      expect(result.current.getParticipationsForProgram(pId)).toEqual([]);
      expect(result.current.getDistributionsForMaterial(mId)).toEqual([]);
      expect(result.current.getDistributionsForFacility(fId)).toEqual([]);
      expect(result.current.getDistributionsForAction(aId)).toEqual([]);
      expect(result.current.getScheduleForFacility(fId)).toEqual([]);
      expect(result.current.getScheduleForProgram(pId)).toEqual([]);
      expect(result.current.getJrwaCasesForFacility(fId)).toEqual([]);
      expect(result.current.getJrwaCasesForProgram(pId)).toEqual([]);
      expect(result.current.getContactsForFacility(fId)).toEqual([]);
      expect(result.current.getLettersForFacility(fId)).toEqual([]);
      expect(result.current.getLettersForProgram(pId)).toEqual([]);
      expect(result.current.getScansForFacility(fId)).toEqual([]);
      expect(result.current.getScansForProgram(pId)).toEqual([]);
      expect(result.current.getRegistersForFacility(fId)).toEqual([]);
      expect(result.current.getRegistersForProgram(pId)).toEqual([]);
      expect(result.current.getPublicationsForAction(aId)).toEqual([]);

      // Populate test records
      act(() => {
        useOzipzDbStore.setState((s) => ({
          actions: [{ id: aId, title: "A", facilityId: fId, programId: pId } as unknown as OzipzAction, ...s.actions],
          participations: [{ id: "part-1", facilityId: fId, programId: pId } as unknown as OzipzSchoolParticipation, ...s.participations],
          distributions: [{ id: "dist-1", materialId: mId, facilityId: fId, actionId: aId } as unknown as OzipzDistribution, ...s.distributions],
          scheduleEvents: [{ id: "sch-1", facilityId: fId, programId: pId } as unknown as OzipzScheduleEvent, ...s.scheduleEvents],
          jrwaCases: [{ id: "jr-1", facilityId: fId, programId: pId } as unknown as OzipzJrwaCase, ...s.jrwaCases],
          contacts: [{ id: "con-1", facilityId: fId } as unknown as OzipzContact, ...s.contacts],
          letters: [{ id: "let-1", facilityId: fId, programId: pId } as unknown as OzipzLetter, ...s.letters],
          scans: [{ id: "scn-1", facilityId: fId, programId: pId } as unknown as OzipzScan, ...s.scans],
          registers: [{ id: "reg-1", facilityId: fId, programId: pId } as unknown as OzipzRegisterItem, ...s.registers],
          publications: [{ id: "pub-1", actionId: aId } as unknown as OzipzPublication, ...s.publications],
        }));
      });

      // Verify all 19 selectors resolve the populated records
      expect(result.current.getActionsForFacility(fId).length).toBe(1);
      expect(result.current.getActionsForProgram(pId).length).toBe(1);
      expect(result.current.getParticipationsForFacility(fId).length).toBe(1);
      expect(result.current.getParticipationsForProgram(pId).length).toBe(1);
      expect(result.current.getDistributionsForMaterial(mId).length).toBe(1);
      expect(result.current.getDistributionsForFacility(fId).length).toBe(1);
      expect(result.current.getDistributionsForAction(aId).length).toBe(1);
      expect(result.current.getScheduleForFacility(fId).length).toBe(1);
      expect(result.current.getScheduleForProgram(pId).length).toBe(1);
      expect(result.current.getJrwaCasesForFacility(fId).length).toBe(1);
      expect(result.current.getJrwaCasesForProgram(pId).length).toBe(1);
      expect(result.current.getContactsForFacility(fId).length).toBe(1);
      expect(result.current.getLettersForFacility(fId).length).toBe(1);
      expect(result.current.getLettersForProgram(pId).length).toBe(1);
      expect(result.current.getScansForFacility(fId).length).toBe(1);
      expect(result.current.getScansForProgram(pId).length).toBe(1);
      expect(result.current.getRegistersForFacility(fId).length).toBe(1);
      expect(result.current.getRegistersForProgram(pId).length).toBe(1);
      expect(result.current.getPublicationsForAction(aId).length).toBe(1);
    });
  });

  describe("5. useMonthlyTargets Filtering & Year Scoping", () => {
    it("filters targets by year when specified and returns all when omitted", () => {
      const dummyTargets: OzipzMonthlyTarget[] = [
        { id: "t-2025-1", year: 2025, month: 1, programActions: 10, programRecipients: 100, otherActions: 2, otherRecipients: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "t-2026-1", year: 2026, month: 1, programActions: 15, programRecipients: 150, otherActions: 3, otherRecipients: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "t-2026-2", year: 2026, month: 2, programActions: 20, programRecipients: 200, otherActions: 4, otherRecipients: 40, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      act(() => {
        useOzipzDbStore.setState({ monthlyTargets: dummyTargets });
      });

      const { result: allResult } = renderHook(() => useMonthlyTargets());
      expect(allResult.current.monthlyTargets.length).toBe(3);
      expect(allResult.current.allMonthlyTargets.length).toBe(3);

      const { result: filtered2026 } = renderHook(() => useMonthlyTargets(2026));
      expect(filtered2026.current.monthlyTargets.length).toBe(2);

      const { result: filtered2025 } = renderHook(() => useMonthlyTargets(2025));
      expect(filtered2025.current.monthlyTargets.length).toBe(1);
      expect(filtered2025.current.monthlyTargets[0].year).toBe(2025);
    });
  });

  describe("6. Zero/Empty State Resilience", () => {
    it("renders all 16 hooks gracefully when store collections are empty", () => {
      act(() => {
        useOzipzDbStore.setState({
          actions: [],
          programs: [],
          participations: [],
          materials: [],
          distributions: [],
          scheduleEvents: [],
          jrwaCases: [],
          publications: [],
          facilities: [],
          dictionaryItems: [],
          letters: [],
          scans: [],
          templates: [],
          staff: [],
          contacts: [],
          registers: [],
          monthlyTargets: [],
        });
      });

      expect(renderHook(() => useActions()).result.current.actions).toEqual([]);
      expect(renderHook(() => useMaterials()).result.current.materialTypes).toEqual([]);
      expect(renderHook(() => useFacilities()).result.current.municipalities).toEqual([]);
      expect(renderHook(() => useDictionaries()).result.current.jrwaSymbols).toEqual([]);
      expect(renderHook(() => useRelationalSelectors()).result.current.getActionsForFacility("test")).toEqual([]);
      expect(renderHook(() => useMonthlyTargets()).result.current.monthlyTargets).toEqual([]);
    });
  });

  describe("7. Re-export Parity with useOzipzDbStore", () => {
    it("confirms main entrypoint re-exports domain hooks identically", () => {
      expect(mainStoreEntry.useActions).toBe(useActions);
      expect(mainStoreEntry.usePrograms).toBe(usePrograms);
      expect(mainStoreEntry.useMaterials).toBe(useMaterials);
      expect(mainStoreEntry.useSchedule).toBe(useSchedule);
      expect(mainStoreEntry.useFacilities).toBe(useFacilities);
      expect(mainStoreEntry.useJrwa).toBe(useJrwa);
      expect(mainStoreEntry.useDictionaries).toBe(useDictionaries);
      expect(mainStoreEntry.useStaff).toBe(useStaff);
      expect(mainStoreEntry.useContacts).toBe(useContacts);
      expect(mainStoreEntry.useLetters).toBe(useLetters);
      expect(mainStoreEntry.useScans).toBe(useScans);
      expect(mainStoreEntry.useRegisters).toBe(useRegisters);
      expect(mainStoreEntry.useTemplates).toBe(useTemplates);
      expect(mainStoreEntry.usePublications).toBe(usePublications);
      expect(mainStoreEntry.useRelationalSelectors).toBe(useRelationalSelectors);
      expect(mainStoreEntry.useMonthlyTargets).toBe(useMonthlyTargets);
    });
  });
});
