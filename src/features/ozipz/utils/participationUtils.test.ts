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
  participationProgramError,
  collectParticipationEmails,
  JRWA_PROGRAM_PREFIX,
} from "./participationUtils";
import type { OzipzContact, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../types/ozipz.types";

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

describe("zgłoszenia tylko do programów PROGRAMOWYCH ze zgłoszeniami szkół", () => {
  const kinds = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([["966.1", "PROGRAMOWE"], ["966.7", "NIEPROGRAMOWE"]]);
  const programs = [
    { id: "prog", jrwaSymbol: "966.1" },
    { id: "akcja", jrwaSymbol: " 966.7 " },
    { id: "bez-symbolu", jrwaSymbol: "" },
    { id: "hiv", name: "HIV/AIDS", jrwaSymbol: "966.1", acceptsParticipations: false },
  ] as OzipzProgram[];

  it("odrzuca program PROGRAMOWY, do którego szkoły się nie zgłaszają", () => {
    expect(participationProgramError("hiv", programs, kinds)).toContain("„HIV/AIDS” szkoły się nie zgłaszają");
  });

  it("odrzuca program i symbol słownika oznaczone jako NIEPROGRAMOWE", () => {
    expect(participationProgramError("akcja", programs, kinds)).toContain("JRWA 966.7");
    expect(participationProgramError(`${JRWA_PROGRAM_PREFIX}966.7`, programs, kinds)).toContain("NIEPROGRAMOWA");
  });

  it("przepuszcza programy PROGRAMOWE i programy bez sklasyfikowanego symbolu", () => {
    expect(participationProgramError("prog", programs, kinds)).toBeUndefined();
    expect(participationProgramError("bez-symbolu", programs, kinds)).toBeUndefined();
    expect(participationProgramError(`${JRWA_PROGRAM_PREFIX}966.99`, programs, kinds)).toBeUndefined();
    expect(participationProgramError("nieznany", programs, kinds)).toBeUndefined();
  });
});

describe("adresy e-mail zgłoszeń", () => {
  const facilities = [
    { id: "sp", name: "SP 1", municipality: "Myślibórz", email: "sekretariat@sp1.pl" },
    { id: "zs", name: "Zespół", municipality: "Dębno", email: "zespol@zs.pl" },
    { id: "zs-sp", name: "SP w Zespole", municipality: "Dębno", email: "", parentFacilityId: "zs" },
  ] as OzipzFacility[];
  const contacts = [{ id: "c1", email: "anna.nowa@sp1.pl" }] as OzipzContact[];
  const zgl = (overrides: Partial<OzipzSchoolParticipation>) =>
    ({ id: "z", programId: "p", facilityId: "sp", facilityName: "SP 1", municipality: "Myślibórz", schoolYear: "2026/2027", schoolCoordinatorName: "Anna", ...overrides }) as OzipzSchoolParticipation;
  const list = [
    zgl({ id: "1", schoolCoordinatorContactId: "c1", schoolCoordinatorContact: "600 100 200 / anna.stara@sp1.pl", secondCoordinatorName: "Ewa", secondCoordinatorContact: "ewa@sp1.pl" }),
    zgl({ id: "2", facilityId: "zs-sp", facilityName: "SP w Zespole", municipality: "Dębno", schoolCoordinatorContact: "600 100 200" }),
    zgl({ id: "3", facilityId: undefined, facilityName: "sp 1", municipality: "myślibórz", schoolCoordinatorContact: "zly@adres" }),
  ];

  it("zbiera e-maile szkół (bez własnego – zespołu) i koordynatorów zgłoszenia, kontakt ze Spisu ma pierwszeństwo", () => {
    expect(collectParticipationEmails(list, "school", facilities, contacts).emails).toEqual(["sekretariat@sp1.pl", "zespol@zs.pl"]);
    const coordinators = collectParticipationEmails(list, "coordinator", facilities, contacts);
    expect(coordinators.emails).toEqual(["anna.nowa@sp1.pl", "ewa@sp1.pl"]);
    expect(coordinators.withoutEmail.map((p) => p.id)).toEqual(["2", "3"]);
    expect(coordinators.invalid).toEqual(["zly@adres"]);
    expect(collectParticipationEmails(list, "both", facilities, contacts).emails).toEqual([
      "sekretariat@sp1.pl", "anna.nowa@sp1.pl", "ewa@sp1.pl", "zespol@zs.pl",
    ]);
  });
});
