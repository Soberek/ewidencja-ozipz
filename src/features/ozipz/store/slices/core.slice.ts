import { OzipzDbService } from "../../../../db/client";
import { resolveReferenceNames } from "../../../../db/reference-names";
import type { CoreSlice, SliceCreator } from "./types";

export const createCoreSlice: SliceCreator<CoreSlice> = (set, get) => ({
  monthlyTargets: [],
  closedMonths: [],
  isLoading: false,
  isInitialized: false,
  loadError: null,

  loadAll: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, loadError: null });
    try {
      const [
        actions,
        programs,
        participations,
        materials,
        distributions,
        scheduleEvents,
        jrwaCases,
        publications,
        facilities,
        dictionaryItems,
        letters,
        scans,
        templates,
        staff,
        contacts,
        registers,
        monthlyTargets,
        closedMonths,
      ] = await Promise.all([
        OzipzDbService.getActions(),
        OzipzDbService.getPrograms(),
        OzipzDbService.getParticipations(),
        OzipzDbService.getMaterials(),
        OzipzDbService.getDistributions(),
        OzipzDbService.getScheduleEvents(),
        OzipzDbService.getJrwaCases(),
        OzipzDbService.getPublications(),
        OzipzDbService.getFacilities(),
        OzipzDbService.getDictionaryItems(),
        OzipzDbService.getLetters(),
        OzipzDbService.getScans(),
        OzipzDbService.getTemplates(),
        OzipzDbService.getStaff(),
        OzipzDbService.getContacts(),
        OzipzDbService.getRegisters(),
        OzipzDbService.getMonthlyTargets(),
        OzipzDbService.getClosedMonths(),
      ]);

      set({
        actions: resolveReferenceNames(actions, facilities, programs),
        programs,
        participations: resolveReferenceNames(participations, facilities, programs),
        materials,
        distributions,
        scheduleEvents: resolveReferenceNames(scheduleEvents, facilities, programs),
        jrwaCases: resolveReferenceNames(jrwaCases, facilities, programs),
        publications,
        facilities,
        dictionaryItems,
        letters,
        scans: resolveReferenceNames(scans, facilities, programs),
        templates,
        staff,
        contacts: resolveReferenceNames(contacts, facilities, programs),
        registers: resolveReferenceNames(registers, facilities, programs),
        monthlyTargets,
        closedMonths,
        isLoading: false,
        isInitialized: true,
        loadError: null,
      });
    } catch (err) {
      console.error("Błąd ładowania bazy OZiPZ:", err);
      const message = err instanceof Error ? err.message : "Nieznany błąd odczytu danych";
      set({ isLoading: false, isInitialized: false, loadError: message });
    }
  },

  refreshClosedMonths: async () => {
    const closedMonths = await OzipzDbService.getClosedMonths();
    set({ closedMonths });
  },

  setMonthClosed: async (monthKey, closed) => {
    await OzipzDbService.setMonthClosed(monthKey, closed);
    await get().refreshClosedMonths();
  },

  saveMonthlyTargets: async (year, targets) => {
    const saved = await OzipzDbService.saveMonthlyTargets(year, targets);
    set((state) => ({
      monthlyTargets: [
        ...state.monthlyTargets.filter((t) => t.year !== year),
        ...saved,
      ],
    }));
    return saved;
  },
});
