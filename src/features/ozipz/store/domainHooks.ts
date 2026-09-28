import { useMemo } from "react";
import { useOzipzDbStore } from "./useOzipzDbStore";
import { DICTIONARY_CATEGORIES_CONFIG } from "../constants";
import {
  buildJrwaInterventionKindMap,
  buildJrwaInterventionNamesMap,
} from "../utils/calculators/jrwaClassification";

export function useActions() {
  const actions = useOzipzDbStore((s) => s.actions);
  const isLoading = useOzipzDbStore((s) => s.isLoading);
  const addAction = useOzipzDbStore((s) => s.addAction);
  const updateAction = useOzipzDbStore((s) => s.updateAction);
  const updateActionWithRelations = useOzipzDbStore((s) => s.updateActionWithRelations);
  const deleteAction = useOzipzDbStore((s) => s.deleteAction);
  const saveActionWithRelations = useOzipzDbStore((s) => s.saveActionWithRelations);

  return { actions, isLoading, addAction, updateAction, updateActionWithRelations, deleteAction, saveActionWithRelations };
}

export function usePrograms() {
  const programs = useOzipzDbStore((s) => s.programs);
  const participations = useOzipzDbStore((s) => s.participations);
  const isLoading = useOzipzDbStore((s) => s.isLoading);
  const addProgram = useOzipzDbStore((s) => s.addProgram);
  const updateProgram = useOzipzDbStore((s) => s.updateProgram);
  const deleteProgram = useOzipzDbStore((s) => s.deleteProgram);
  const addParticipation = useOzipzDbStore((s) => s.addParticipation);
  const updateParticipation = useOzipzDbStore((s) => s.updateParticipation);
  const deleteParticipation = useOzipzDbStore((s) => s.deleteParticipation);

  return {
    programs,
    participations,
    isLoading,
    addProgram,
    updateProgram,
    deleteProgram,
    addParticipation,
    updateParticipation,
    deleteParticipation,
  };
}

export function useMaterials() {
  const materials = useOzipzDbStore((s) => s.materials);
  const distributions = useOzipzDbStore((s) => s.distributions);
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const materialTypes = dictionaryItems.filter((d) => d.dictType === "materialType");
  const addMaterial = useOzipzDbStore((s) => s.addMaterial);
  const updateMaterial = useOzipzDbStore((s) => s.updateMaterial);
  const deleteMaterial = useOzipzDbStore((s) => s.deleteMaterial);
  const addDistribution = useOzipzDbStore((s) => s.addDistribution);
  const updateDistribution = useOzipzDbStore((s) => s.updateDistribution);
  const deleteDistribution = useOzipzDbStore((s) => s.deleteDistribution);

  return {
    materials,
    distributions,
    materialTypes,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addDistribution,
    updateDistribution,
    deleteDistribution,
  };
}

export function useSchedule() {
  const scheduleEvents = useOzipzDbStore((s) => s.scheduleEvents);
  const isLoading = useOzipzDbStore((s) => s.isLoading);
  const addScheduleEvent = useOzipzDbStore((s) => s.addScheduleEvent);
  const updateScheduleEvent = useOzipzDbStore((s) => s.updateScheduleEvent);
  const deleteScheduleEvent = useOzipzDbStore((s) => s.deleteScheduleEvent);
  const toggleScheduleStatus = useOzipzDbStore((s) => s.toggleScheduleStatus);

  return {
    scheduleEvents,
    isLoading,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    toggleScheduleStatus,
  };
}

export function useFacilities() {
  const facilities = useOzipzDbStore((s) => s.facilities);
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const locationTypes = dictionaryItems.filter((d) => d.dictType === "locationType");
  const municipalities = dictionaryItems.filter((d) => d.dictType === "municipality" || d.dictType === "gmina");
  const addFacility = useOzipzDbStore((s) => s.addFacility);
  const updateFacility = useOzipzDbStore((s) => s.updateFacility);
  const deleteFacility = useOzipzDbStore((s) => s.deleteFacility);
  const batchUpsertFacilities = useOzipzDbStore((s) => s.batchUpsertFacilities);
  const getFacilityActivitySummary = useOzipzDbStore((s) => s.getFacilityActivitySummary);

  return {
    facilities,
    locationTypes,
    municipalities,
    addFacility,
    updateFacility,
    deleteFacility,
    batchUpsertFacilities,
    getFacilityActivitySummary,
  };
}

export function useJrwa() {
  const jrwaCases = useOzipzDbStore((s) => s.jrwaCases);
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const staff = useOzipzDbStore((s) => s.staff);
  const addJrwaCase = useOzipzDbStore((s) => s.addJrwaCase);
  const updateJrwaCase = useOzipzDbStore((s) => s.updateJrwaCase);
  const deleteJrwaCase = useOzipzDbStore((s) => s.deleteJrwaCase);

  return {
    jrwaCases,
    dictionaryItems,
    staff,
    addJrwaCase,
    updateJrwaCase,
    deleteJrwaCase,
  };
}

export function useDictionaries() {
  const dictionaryItems = useOzipzDbStore((s) => s.dictionaryItems);
  const addDictionaryItem = useOzipzDbStore((s) => s.addDictionaryItem);
  const updateDictionaryItem = useOzipzDbStore((s) => s.updateDictionaryItem);
  const deleteDictionaryItem = useOzipzDbStore((s) => s.deleteDictionaryItem);

  const getByCategory = (type: string) => dictionaryItems.filter((d) => d.dictType === type);

  return {
    dictionaryItems,
    categoriesConfig: DICTIONARY_CATEGORIES_CONFIG,
    activityTypes: getByCategory("activityType"),
    recipientGroups: getByCategory("recipientGroup"),
    locationTypes: getByCategory("locationType"),
    materialTypes: getByCategory("materialType"),
    campaigns: getByCategory("campaign"),
    annotationReasons: getByCategory("annotationReason"),
    jrwaSymbols: dictionaryItems.filter(
      (d) => d.dictType === "jrwaSymbol" && d.code !== "070" && d.code !== "9010" && !d.id.startsWith("dict-jrw-")
    ),
    jrwaInterventionKindMap: buildJrwaInterventionKindMap(dictionaryItems),
    jrwaInterventionNamesMap: buildJrwaInterventionNamesMap(dictionaryItems),
    municipalities: dictionaryItems.filter((d) => d.dictType === "municipality" || d.dictType === "gmina"),
    staffRoles: getByCategory("staffRole"),
    contactPositions: getByCategory("contactPosition"),
    documentTypes: getByCategory("documentType"),
    getByCategory,
    addDictionaryItem,
    updateDictionaryItem,
    deleteDictionaryItem,
  };
}

export function useStaff() {
  const staff = useOzipzDbStore((s) => s.staff);
  const addStaff = useOzipzDbStore((s) => s.addStaff);
  const updateStaff = useOzipzDbStore((s) => s.updateStaff);
  const deleteStaff = useOzipzDbStore((s) => s.deleteStaff);

  return { staff, addStaff, updateStaff, deleteStaff };
}

export function useContacts() {
  const contacts = useOzipzDbStore((s) => s.contacts);
  const addContact = useOzipzDbStore((s) => s.addContact);
  const updateContact = useOzipzDbStore((s) => s.updateContact);
  const deleteContact = useOzipzDbStore((s) => s.deleteContact);

  return { contacts, addContact, updateContact, deleteContact };
}

export function useLetters() {
  const letters = useOzipzDbStore((s) => s.letters);
  const addLetter = useOzipzDbStore((s) => s.addLetter);
  const updateLetter = useOzipzDbStore((s) => s.updateLetter);
  const deleteLetter = useOzipzDbStore((s) => s.deleteLetter);

  return { letters, addLetter, updateLetter, deleteLetter };
}

export function useScans() {
  const scans = useOzipzDbStore((s) => s.scans);
  const addScan = useOzipzDbStore((s) => s.addScan);
  const deleteScan = useOzipzDbStore((s) => s.deleteScan);

  return { scans, addScan, deleteScan };
}

export function useRegisters() {
  const registers = useOzipzDbStore((s) => s.registers);
  const addRegister = useOzipzDbStore((s) => s.addRegister);
  const updateRegister = useOzipzDbStore((s) => s.updateRegister);
  const deleteRegister = useOzipzDbStore((s) => s.deleteRegister);

  return { registers, addRegister, updateRegister, deleteRegister };
}

export function useTemplates() {
  const templates = useOzipzDbStore((s) => s.templates);
  const addTemplate = useOzipzDbStore((s) => s.addTemplate);
  const updateTemplate = useOzipzDbStore((s) => s.updateTemplate);
  const deleteTemplate = useOzipzDbStore((s) => s.deleteTemplate);

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}

export function usePublications() {
  const publications = useOzipzDbStore((s) => s.publications);
  const addPublication = useOzipzDbStore((s) => s.addPublication);
  const updatePublication = useOzipzDbStore((s) => s.updatePublication);
  const deletePublication = useOzipzDbStore((s) => s.deletePublication);

  return { publications, addPublication, updatePublication, deletePublication };
}

export function useRelationalSelectors() {
  const actions = useOzipzDbStore((s) => s.actions);
  const participations = useOzipzDbStore((s) => s.participations);
  const distributions = useOzipzDbStore((s) => s.distributions);
  const scheduleEvents = useOzipzDbStore((s) => s.scheduleEvents);
  const jrwaCases = useOzipzDbStore((s) => s.jrwaCases);
  const contacts = useOzipzDbStore((s) => s.contacts);
  const letters = useOzipzDbStore((s) => s.letters);
  const scans = useOzipzDbStore((s) => s.scans);
  const registers = useOzipzDbStore((s) => s.registers);
  const publications = useOzipzDbStore((s) => s.publications);

  return {
    getActionsForFacility: (facilityId: string) => actions.filter((a) => a.facilityId === facilityId),
    getActionsForProgram: (programId: string) => actions.filter((a) => a.programId === programId),
    getParticipationsForFacility: (facilityId: string) => participations.filter((p) => p.facilityId === facilityId),
    getParticipationsForProgram: (programId: string) => participations.filter((p) => p.programId === programId),
    getDistributionsForMaterial: (materialId: string) => distributions.filter((d) => d.materialId === materialId),
    getDistributionsForFacility: (facilityId: string) => distributions.filter((d) => d.facilityId === facilityId),
    getDistributionsForAction: (actionId: string) => distributions.filter((d) => d.actionId === actionId),
    getScheduleForFacility: (facilityId: string) => scheduleEvents.filter((s) => s.facilityId === facilityId),
    getScheduleForProgram: (programId: string) => scheduleEvents.filter((s) => s.programId === programId),
    getJrwaCasesForFacility: (facilityId: string) => jrwaCases.filter((j) => j.facilityId === facilityId),
    getJrwaCasesForProgram: (programId: string) => jrwaCases.filter((j) => j.programId === programId),
    getContactsForFacility: (facilityId: string) => contacts.filter((c) => c.facilityId === facilityId),
    getLettersForFacility: (facilityId: string) => letters.filter((l) => l.facilityId === facilityId),
    getLettersForProgram: (programId: string) => letters.filter((l) => l.programId === programId),
    getScansForFacility: (facilityId: string) => scans.filter((s) => s.facilityId === facilityId),
    getScansForProgram: (programId: string) => scans.filter((s) => s.programId === programId),
    getRegistersForFacility: (facilityId: string) => registers.filter((r) => r.facilityId === facilityId),
    getRegistersForProgram: (programId: string) => registers.filter((r) => r.programId === programId),
    getPublicationsForAction: (actionId: string) => publications.filter((p) => p.actionId === actionId),
  };
}

export function useMonthlyTargets(year?: number) {
  const allTargets = useOzipzDbStore((s) => s.monthlyTargets);
  const saveMonthlyTargets = useOzipzDbStore((s) => s.saveMonthlyTargets);
  const isLoading = useOzipzDbStore((s) => s.isLoading);

  const monthlyTargets = useMemo(() => {
    if (year === undefined) return allTargets;
    return allTargets.filter((t) => t.year === year);
  }, [allTargets, year]);

  return {
    monthlyTargets,
    allMonthlyTargets: allTargets,
    saveMonthlyTargets,
    isLoading,
  };
}
