import { useMemo } from "react";
import type { OzipzDictionaryItem } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { buildDictionaryUsageIndex, type DictionaryUsageIndex } from "../../utils/dictionaryUsage";

const EMPTY_INDEX: DictionaryUsageIndex = new Map();

/** Indeks użycia pozycji słownikowych liczony na danych ze store'a. */
export function useDictionaryUsageIndex(items: OzipzDictionaryItem[], enabled = true): DictionaryUsageIndex {
  const actions = useOzipzDbStore((s) => s.actions);
  const scheduleEvents = useOzipzDbStore((s) => s.scheduleEvents);
  const materials = useOzipzDbStore((s) => s.materials);
  const distributions = useOzipzDbStore((s) => s.distributions);
  const facilities = useOzipzDbStore((s) => s.facilities);
  const jrwaCases = useOzipzDbStore((s) => s.jrwaCases);
  const staff = useOzipzDbStore((s) => s.staff);
  const contacts = useOzipzDbStore((s) => s.contacts);
  const scans = useOzipzDbStore((s) => s.scans);

  return useMemo(() => {
    if (!enabled) return EMPTY_INDEX;
    return buildDictionaryUsageIndex(items, {
      actions,
      scheduleEvents,
      materials,
      distributions,
      facilities,
      jrwaCases,
      staff,
      contacts,
      scans,
    });
  }, [enabled, items, actions, scheduleEvents, materials, distributions, facilities, jrwaCases, staff, contacts, scans]);
}
