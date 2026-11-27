import type { OzipzDictionaryItem } from "../types/ozipz.types";
import type { AudienceGroupBlock } from "../components/actions/editor/editor.types";
import { parseAudienceGroups } from "../components/actions/editor/audienceUtils";

/**
 * Grupy odbiorców („Kto?”) to zamknięty słownik `recipientGroup`. Działanie wskazuje pozycje słownika po identyfikatorze
 * (`recipientGroupIds`), a pozycja użyta w jakimkolwiek działaniu jest zablokowana (nazwa, kod i usuwanie) – zmiana
 * nazwy przepisałaby wstecz dotychczasowe sprawozdania.
 */
export const RECIPIENT_GROUP_TYPE = "recipientGroup";

type RecipientGroupRef = Pick<OzipzDictionaryItem, "id" | "code" | "label">;

/** Nazwa porównywana bez wielkości liter, zbędnych spacji i różnic w zapisie myślnika. */
export const normalizeRecipientName = (value: string | undefined | null): string =>
  (value ?? "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLocaleLowerCase("pl");

/** Nazwa bez polskich znaków – do wykrywania „podobnych” pozycji (np. „Nauczyciele” i „nauczyciele szkół”). */
const looseKey = (value: string): string =>
  normalizeRecipientName(value).replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export const isRecipientGroupItem = (item: Pick<OzipzDictionaryItem, "dictType">): boolean => item.dictType === RECIPIENT_GROUP_TYPE;

/** Pozycja słownika o danej nazwie (lub kodzie). */
export function findRecipientGroup<T extends RecipientGroupRef>(groups: T[], name: string | undefined | null): T | undefined {
  const key = normalizeRecipientName(name);
  if (!key) return undefined;
  return groups.find((g) => normalizeRecipientName(g.label) === key) ?? groups.find((g) => normalizeRecipientName(g.code) === key);
}

/** Istniejące pozycje o nazwie bliskiej wpisywanej (jedna zawiera drugą) – ostrzeżenie przed dublem. */
export function findSimilarRecipientGroups<T extends RecipientGroupRef>(groups: T[], name: string, limit = 3): T[] {
  const key = looseKey(name);
  if (key.length < 3) return [];
  return groups
    .filter((g) => {
      const other = looseKey(g.label);
      return other !== key && other.length >= 3 && (other.includes(key) || key.includes(other));
    })
    .slice(0, limit);
}

/** Kod pozycji z nazwy: małe litery, cyfry i „_”, unikalny względem istniejących kodów. */
export function uniqueRecipientGroupCode(label: string, existingCodes: Iterable<string>): string {
  const base = label
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30)
    .replace(/_+$/g, "") || "grupa";
  const taken = new Set([...existingCodes].map((c) => c.trim().toLowerCase()));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `_${n}`;
    const candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Przypisuje pozycjom odbiorców identyfikatory słownika po nazwie. Nazwa trafia w kanoniczną postać ze słownika;
 * pozycje spoza słownika (starsze, wpisane ręcznie) zostają bez identyfikatora.
 */
export function linkAudienceGroups(groups: AudienceGroupBlock[], dictionary: RecipientGroupRef[]): AudienceGroupBlock[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const match = findRecipientGroup(dictionary, item.name);
      return match ? { ...item, name: match.label, recipientGroupId: match.id } : { ...item, recipientGroupId: undefined };
    }),
  }));
}

/** Unikalne identyfikatory grup odbiorców użyte w działaniu (w kolejności wystąpienia). */
export function audienceRecipientGroupIds(groups: AudienceGroupBlock[]): string[] {
  const ids: string[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      if (item.name.trim() && item.recipientGroupId && !ids.includes(item.recipientGroupId)) ids.push(item.recipientGroupId);
    }
  }
  return ids;
}

/** Nazwy wpisane w odbiorcach, których nie ma w słowniku. */
export function unlinkedAudienceNames(groups: AudienceGroupBlock[]): string[] {
  const names: string[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      const name = item.name.trim();
      if (name && !item.recipientGroupId && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

/** Ta sama kategoria odbiorców dwa razy w jednej grupie (np. dwa razy „Uczniowie”) – nazwy tych kategorii. */
export function duplicatedAudienceNames(groups: AudienceGroupBlock[]): string[] {
  const duplicated: string[] = [];
  for (const group of groups) {
    const seen = new Set<string>();
    for (const item of group.items) {
      const key = item.recipientGroupId || normalizeRecipientName(item.name);
      if (!key || !item.name.trim()) continue;
      if (seen.has(key) && !duplicated.includes(item.name.trim())) duplicated.push(item.name.trim());
      seen.add(key);
    }
  }
  return duplicated;
}

/**
 * Identyfikatory pozycji słownika wskazane przez zapisany opis odbiorców („Uczniowie - 25, Opiekunowie - 3”).
 * Używane przy przejściu starszych działań na powiązania: dopasowanie wyłącznie dokładne (nazwa lub kod),
 * bez zgadywania.
 */
export function recipientGroupIdsFromAudienceText(audience: string | null | undefined, dictionary: RecipientGroupRef[]): string[] {
  if (!audience?.trim()) return [];
  const linked = linkAudienceGroups(parseAudienceGroups(audience), dictionary);
  return audienceRecipientGroupIds(linked);
}

export const RECIPIENT_GROUP_LOCKED_MESSAGE =
  "Grupa odbiorców jest użyta w działaniach – nie można zmienić jej nazwy ani kodu. Dodaj nową grupę.";
export const RECIPIENT_GROUP_DELETE_MESSAGE = "Grupa odbiorców jest użyta w działaniach – nie można jej usunąć.";

/** Zapis, który kolidowałby z inną pozycją słownika grup odbiorców (ta sama nazwa albo kod). */
export function recipientGroupConflict(
  items: OzipzDictionaryItem[],
  candidate: { id?: string; label: string; code: string }
): string | undefined {
  const others = items.filter((item) => item.dictType === RECIPIENT_GROUP_TYPE && item.id !== candidate.id);
  const label = normalizeRecipientName(candidate.label);
  const code = normalizeRecipientName(candidate.code);
  if (label && others.some((item) => normalizeRecipientName(item.label) === label)) {
    return `Grupa odbiorców „${candidate.label.trim()}” już istnieje.`;
  }
  if (code && others.some((item) => normalizeRecipientName(item.code) === code)) {
    return `Kod „${candidate.code.trim()}” jest już używany przez inną grupę odbiorców.`;
  }
  return undefined;
}

/** Czy zmiana wyróżnia pozycję (nazwa lub kod), czyli dotyka tego, co blokuje użycie w działaniach. */
export function changesRecipientGroupIdentity(
  current: Pick<OzipzDictionaryItem, "code" | "label" | "dictType">,
  next: Partial<Pick<OzipzDictionaryItem, "code" | "label" | "dictType">>
): boolean {
  return (next.label !== undefined && next.label !== current.label) ||
    (next.code !== undefined && next.code !== current.code) ||
    (next.dictType !== undefined && next.dictType !== current.dictType);
}
