import { useMemo } from "react";
import { useOzipzDbStore } from "../store/useOzipzDbStore";
import { calculateTotalRecipients } from "../utils/ozipzCalculations";
import { resolveActionRegisters } from "../utils/registerConfig";
import { CANONICAL_EDUCATION_TYPES } from "../constants";
import type { OzipzDictionaryItem } from "../types/ozipz.types";

/** Gminy ze słownika bez duplikatów (po kodzie lub etykiecie). */
export function selectMunicipalities(dictionaryItems: OzipzDictionaryItem[]): OzipzDictionaryItem[] {
  const seen = new Set<string>();
  return dictionaryItems.filter((item) => {
    if (item.dictType !== "municipality" && item.dictType !== "gmina") return false;
    const key = item.code || item.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function selectTopics(dictionaryItems: OzipzDictionaryItem[]): OzipzDictionaryItem[] {
  return dictionaryItems.filter((d) => d.dictType === "topic" || d.dictType === "tematyki");
}

export function useOzipzDb() {
  const store = useOzipzDbStore();

  const activityTypes = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "activityType"),
    [store.dictionaryItems]
  );
  const locationTypes = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "locationType"),
    [store.dictionaryItems]
  );
  const recipientGroups = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "recipientGroup"),
    [store.dictionaryItems]
  );
  const materialTypes = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "materialType"),
    [store.dictionaryItems]
  );
  const campaigns = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "campaign"),
    [store.dictionaryItems]
  );
  const annotationReasons = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "annotationReason"),
    [store.dictionaryItems]
  );
  const jrwaSymbols = useMemo(() => {
    const items = store.dictionaryItems.filter(
      (d) => d.dictType === "jrwaSymbol" && d.code !== "070" && d.code !== "9010" && !d.id.startsWith("dict-jrw-")
    );
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.code)) return false;
      seen.add(item.code);
      return true;
    });
  }, [store.dictionaryItems]);

  const municipalities = useMemo(() => selectMunicipalities(store.dictionaryItems), [store.dictionaryItems]);

  const staffRoles = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "staffRole"),
    [store.dictionaryItems]
  );
  const contactPositions = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "contactPosition"),
    [store.dictionaryItems]
  );
  const documentTypes = useMemo(
    () => store.dictionaryItems.filter((d) => d.dictType === "documentType"),
    [store.dictionaryItems]
  );
  const topics = useMemo(() => selectTopics(store.dictionaryItems), [store.dictionaryItems]);
  const educationTypes = useMemo(() => {
    const fromDict = store.dictionaryItems
      .filter((d) => d.dictType === "educationType")
      .map((d) => d.label);
    if (fromDict.length > 0) return fromDict;
    return [...CANONICAL_EDUCATION_TYPES];
  }, [store.dictionaryItems]);

  const stats = useMemo(() => {
    const rec = calculateTotalRecipients(store.actions);
    return {
      totalActions: store.actions.length,
      totalPrograms: store.programs.length,
      totalSchools: store.participations.length,
      totalRecipients: rec.total,
      directRecipients: rec.direct,
      indirectRecipients: rec.indirect,
      materialsDistributed: rec.materialsCount,
      totalMaterials: store.materials.length,
      totalDistributions: store.distributions.length,
      totalScheduleEvents: store.scheduleEvents.length,
      totalJrwaCases: store.jrwaCases.length,
      totalPublications: store.publications.length,
      totalFacilities: store.facilities.length,
      totalDictionaryItems: store.dictionaryItems.length,
      totalLetters: store.letters.length,
      totalScans: store.scans.length,
      totalTemplates: store.templates.length,
      totalStaff: store.staff.length,
      totalContacts: store.contacts.length,
      totalRegisters: store.registers.length,
    };
  }, [
    store.actions,
    store.programs.length,
    store.participations.length,
    store.materials.length,
    store.distributions.length,
    store.scheduleEvents.length,
    store.jrwaCases.length,
    store.publications.length,
    store.facilities.length,
    store.dictionaryItems.length,
    store.letters.length,
    store.scans.length,
    store.templates.length,
    store.staff.length,
    store.contacts.length,
    store.registers.length,
  ]);

  // Memoized relational getters
  const relational = useMemo(
    () => ({
      getActionsForFacility: (facilityId: string) => store.actions.filter((a) => a.facilityId === facilityId),
      getActionsForProgram: (programId: string) => store.actions.filter((a) => a.programId === programId),
      getParticipationsForFacility: (facilityId: string) => store.participations.filter((p) => p.facilityId === facilityId),
      getParticipationsForProgram: (programId: string) => store.participations.filter((p) => p.programId === programId),
      getDistributionsForMaterial: (materialId: string) => store.distributions.filter((d) => d.materialId === materialId),
      getDistributionsForFacility: (facilityId: string) => store.distributions.filter((d) => d.facilityId === facilityId),
      getDistributionsForAction: (actionId: string) => store.distributions.filter((d) => d.actionId === actionId),
      getScheduleForFacility: (facilityId: string) => store.scheduleEvents.filter((s) => s.facilityId === facilityId),
      getScheduleForProgram: (programId: string) => store.scheduleEvents.filter((s) => s.programId === programId),
      getJrwaCasesForFacility: (facilityId: string) => store.jrwaCases.filter((j) => j.facilityId === facilityId),
      getJrwaCasesForProgram: (programId: string) => store.jrwaCases.filter((j) => j.programId === programId),
      getContactsForFacility: (facilityId: string) => store.contacts.filter((c) => c.facilityId === facilityId),
      getLettersForFacility: (facilityId: string) => store.letters.filter((l) => l.facilityId === facilityId),
      getLettersForProgram: (programId: string) => store.letters.filter((l) => l.programId === programId),
      getScansForFacility: (facilityId: string) => store.scans.filter((s) => s.facilityId === facilityId),
      getScansForProgram: (programId: string) => store.scans.filter((s) => s.programId === programId),
      getRegistersForFacility: (facilityId: string) => store.registers.filter((r) => r.facilityId === facilityId),
      getRegistersForProgram: (programId: string) => store.registers.filter((r) => r.programId === programId),
      getPublicationsForAction: (actionId: string) => store.publications.filter((p) => p.actionId === actionId),
    }),
    [
      store.actions,
      store.participations,
      store.distributions,
      store.scheduleEvents,
      store.jrwaCases,
      store.contacts,
      store.letters,
      store.scans,
      store.registers,
      store.publications,
    ]
  );

  const registerMappings = useMemo(() => {
    return store.dictionaryItems
      .filter((d) => d.dictType === "register_mapping")
      .map((d) => {
        let registers: ("informacje" | "publikacje" | "wizytacje")[] = [];
        try {
          registers = JSON.parse(d.description || "[]");
        } catch {
          registers = [];
        }
        return {
          id: d.id,
          activityType: d.code,
          registers,
          updatedAt: d.updatedAt,
        };
      });
  }, [store.dictionaryItems]);

  const registerActions = useMemo(() => {
    const result: Record<"informacje" | "publikacje" | "wizytacje", typeof store.actions> = {
      informacje: [],
      publikacje: [],
      wizytacje: [],
    };

    store.actions.forEach((a) => {
      const matched = resolveActionRegisters({ action: a, mappings: registerMappings });
      matched.forEach((key) => {
        if (result[key]) result[key].push(a);
      });
    });

    return result;
  }, [store.actions, registerMappings]);

  return {
    ...store,
    activityTypes,
    locationTypes,
    recipientGroups,
    materialTypes,
    campaigns,
    annotationReasons,
    jrwaSymbols,
    municipalities,
    staffRoles,
    contactPositions,
    documentTypes,
    topics,
    educationTypes,
    registerMappings,
    registerActions,
    stats,
    ...relational,
    batchImportFacilities: store.batchUpsertFacilities,
    getFacilitySummary: store.getFacilityActivitySummary,
  };
}
