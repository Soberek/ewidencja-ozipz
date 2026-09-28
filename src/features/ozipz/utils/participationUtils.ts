import type { OzipzContact, OzipzSchoolParticipation } from "../types/ozipz.types";

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

type ParticipationIdentity = Pick<OzipzSchoolParticipation, "programId" | "facilityId" | "facilityName" | "municipality" | "schoolYear">;
const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pl");

export function findDuplicateParticipation(entries: OzipzSchoolParticipation[], candidate: ParticipationIdentity, editingId?: string) {
  return entries.find((entry) => entry.id !== editingId &&
    entry.programId === candidate.programId && entry.schoolYear.trim() === candidate.schoolYear.trim() &&
    (entry.facilityId && candidate.facilityId
      ? entry.facilityId === candidate.facilityId
      : normalize(entry.facilityName) === normalize(candidate.facilityName) && normalize(entry.municipality) === normalize(candidate.municipality)));
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
