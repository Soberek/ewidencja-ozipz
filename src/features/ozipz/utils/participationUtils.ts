import type { OzipzContact, OzipzSchoolParticipation } from "../types/ozipz.types";

/** Prefiks wartości listy programów dla symbolu JRWA ze słownika, który nie ma jeszcze programu w katalogu. */
export const JRWA_PROGRAM_PREFIX = "jrwa:";

export function currentSchoolYear(date = new Date()): string {
  const year = date.getFullYear() - (date.getMonth() < 8 ? 1 : 0);
  return `${year}/${year + 1}`;
}

export function isSchoolYear(value: string): boolean {
  return /^\d{4}\/\d{4}$/.test(value) && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1;
}

/**
 * Słownik lat szkolnych do wyboru: od `back` lat wstecz do następnego roku szkolnego
 * oraz poprawne lata już zapisane w danych (np. starsze edycje). Najnowsze na górze.
 */
export function schoolYearOptions(used: Array<string | null | undefined> = [], date = new Date(), back = 5): string[] {
  const start = Number(currentSchoolYear(date).slice(0, 4));
  const years = new Set<string>();
  for (let y = start + 1; y >= start - back; y--) years.add(`${y}/${y + 1}`);
  for (const value of used) {
    const year = value?.trim();
    if (year && isSchoolYear(year)) years.add(year);
  }
  return Array.from(years).sort().reverse();
}

type FacilityIdentity = Pick<OzipzSchoolParticipation, "facilityId" | "facilityName" | "municipality">;
type ParticipationIdentity = FacilityIdentity & Pick<OzipzSchoolParticipation, "programId" | "schoolYear" | "schoolCoordinatorName">;
const normalize = (value: string | null | undefined) => String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pl");

function sameFacility(a: FacilityIdentity, b: FacilityIdentity): boolean {
  return a.facilityId && b.facilityId
    ? a.facilityId === b.facilityId
    : normalize(a.facilityName) === normalize(b.facilityName) && normalize(a.municipality) === normalize(b.municipality);
}

/**
 * Szkoła może mieć w jednym programie i roku kilka zgłoszeń — np. dwa budynki z osobnymi koordynatorami.
 * Duplikatem jest dopiero zgłoszenie tej samej placówki z tym samym koordynatorem.
 */
export function findDuplicateParticipation(entries: OzipzSchoolParticipation[], candidate: ParticipationIdentity, editingId?: string) {
  return entries.find((entry) => entry.id !== editingId &&
    entry.programId === candidate.programId && entry.schoolYear.trim() === candidate.schoolYear.trim() &&
    sameFacility(entry, candidate) &&
    normalize(entry.schoolCoordinatorName) === normalize(candidate.schoolCoordinatorName));
}

/** „telefon / e-mail” – zapis kontaktu koordynatora przechowywany w zgłoszeniu (ten sam format co trigger SQLite). */
export function coordinatorContactLine(contact: Pick<OzipzContact, "phone" | "email">): string {
  return [contact.phone?.trim(), contact.email?.trim()].filter(Boolean).join(" / ");
}

/** Zgłoszenia powiązane z kontaktem dostają jego aktualne nazwisko i dane kontaktowe. */
export function syncCoordinatorContact<T extends OzipzSchoolParticipation>(participations: T[], contact: OzipzContact): T[] {
  return participations.map((p) =>
    p.schoolCoordinatorContactId === contact.id
      ? { ...p, schoolCoordinatorName: contact.name, schoolCoordinatorContact: coordinatorContactLine(contact) }
      : p
  );
}

/** Usunięty kontakt: zgłoszenie zachowuje kopię nazwiska i telefonu, traci tylko powiązanie (jak ON DELETE SET NULL). */
export function unlinkCoordinatorContact<T extends OzipzSchoolParticipation>(participations: T[], contactId: string): T[] {
  return participations.map((p) =>
    p.schoolCoordinatorContactId === contactId ? { ...p, schoolCoordinatorContactId: undefined } : p
  );
}
