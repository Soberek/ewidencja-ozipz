import { describe, expect, it } from "vitest";
import {
  currentSchoolYear,
  isSchoolYear,
  schoolYearOptions,
  findDuplicateParticipation,
  coordinatorContactLine,
  syncCoordinatorContact,
  participationCoordinators,
  unlinkCoordinatorContact,
} from "./participationUtils";
import type { OzipzContact, OzipzSchoolParticipation } from "../types/ozipz.types";

describe("udział placówki w programie", () => {
  it("zmienia rok szkolny we wrześniu", () => {
    expect(currentSchoolYear(new Date(2026, 7, 31))).toBe("2025/2026");
    expect(currentSchoolYear(new Date(2026, 8, 1))).toBe("2026/2027");
    expect(isSchoolYear("2026/2028")).toBe(false);
    expect(isSchoolYear("2026")).toBe(false);
    expect(isSchoolYear("2026/2027")).toBe(true);
  });
  const entry = { id: "1", programId: "p", facilityId: "f", facilityName: "Szkoła", municipality: "Gmina", schoolYear: "2026/2027" } as OzipzSchoolParticipation;
  it("wykrywa tę samą placówkę mimo zmiany nazwy, pomija edytowany wpis", () => {
    expect(findDuplicateParticipation([entry], { ...entry, facilityName: "Nowa nazwa" })).toBe(entry);
    expect(findDuplicateParticipation([entry], entry, "1")).toBeUndefined();
    expect(findDuplicateParticipation([entry], { ...entry, schoolYear: "2027/2028" })).toBeUndefined();
    expect(findDuplicateParticipation([entry], { ...entry, programId: "inny" })).toBeUndefined();
  });
  it("pozwala zgłosić tę samą szkołę drugi raz z innym koordynatorem (np. drugi budynek)", () => {
    const withCoordinator = { ...entry, schoolCoordinatorName: "Anna Nowak" };
    expect(findDuplicateParticipation([withCoordinator], { ...withCoordinator, schoolCoordinatorName: "Jan Kowalski" })).toBeUndefined();
    expect(findDuplicateParticipation([withCoordinator], { ...withCoordinator, schoolCoordinatorName: " anna  NOWAK " })).toBe(withCoordinator);
  });
  it("rozpoznaje starsze wpisy bez identyfikatora i rozróżnia placówki", () => {
    expect(findDuplicateParticipation([{ ...entry, facilityId: "" }], { ...entry, facilityName: " SZKOŁA " })).toBeDefined();
    expect(findDuplicateParticipation([entry], { ...entry, facilityId: "inna" })).toBeUndefined();
  });
  it("przenosi aktualne dane kontaktu do powiązanych zgłoszeń i odłącza usunięty kontakt", () => {
    const linked = { ...entry, schoolCoordinatorContactId: "c1", schoolCoordinatorName: "Stare", schoolCoordinatorContact: "" };
    const other = { ...entry, id: "2", schoolCoordinatorName: "Ręczny wpis" };
    const contact = { id: "c1", name: "Anna Nowak", phone: " 600 000 000 ", email: "anna@szkola.pl" } as OzipzContact;

    expect(coordinatorContactLine({ phone: "", email: "anna@szkola.pl" })).toBe("anna@szkola.pl");
    const [synced, untouched] = syncCoordinatorContact([linked, other], contact);
    expect(synced).toMatchObject({ schoolCoordinatorName: "Anna Nowak", schoolCoordinatorContact: "600 000 000 / anna@szkola.pl" });
    expect(untouched).toBe(other);

    const [unlinked] = unlinkCoordinatorContact([synced], "c1");
    expect(unlinked.schoolCoordinatorContactId).toBeUndefined();
    expect(unlinked.schoolCoordinatorName).toBe("Anna Nowak");
  });
  it("synchronizuje i odłącza także drugiego koordynatora", () => {
    const linked = { ...entry, schoolCoordinatorName: "Ręczny wpis", secondCoordinatorContactId: "c2", secondCoordinatorName: "Stare" };
    const contact = { id: "c2", name: "Ewa Lis", phone: "", email: "ewa@szkola.pl" } as OzipzContact;

    const [synced] = syncCoordinatorContact([linked], contact);
    expect(synced).toMatchObject({ schoolCoordinatorName: "Ręczny wpis", secondCoordinatorName: "Ewa Lis", secondCoordinatorContact: "ewa@szkola.pl" });
    expect(participationCoordinators(synced).map((c) => c.name)).toEqual(["Ręczny wpis", "Ewa Lis"]);

    const [unlinked] = unlinkCoordinatorContact([synced], "c2");
    expect(unlinked.secondCoordinatorContactId).toBeUndefined();
    expect(unlinked.secondCoordinatorName).toBe("Ewa Lis");
  });
  it("buduje słownik lat szkolnych z bieżącym, poprzednimi, następnym i użytymi w danych", () => {
    const options = schoolYearOptions(["2018/2019", "2026", " 2025/2026 ", undefined], new Date(2026, 8, 15), 2);
    expect(options).toEqual(["2027/2028", "2026/2027", "2025/2026", "2024/2025", "2018/2019"]);
  });
});
