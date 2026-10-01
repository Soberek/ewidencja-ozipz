import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../types/ozipz.types";
import { computeProgramStatistics, schoolYearDateRange } from "./programStatistics";

const part = (overrides: Partial<OzipzSchoolParticipation>): OzipzSchoolParticipation => ({
  id: "p", programId: "prog-a", programName: "Program A", facilityId: "sp1", facilityName: "SP 1", municipality: "Myślibórz",
  schoolYear: "2026/2027", schoolCoordinatorName: "Anna", pupilsCount: 10, hasDeclaration: true, hasFinalReport: false,
  evaluationGrade: "", notes: "", schoolCoordinatorContact: "", createdAt: "", updatedAt: "", ...overrides,
});

const programs = [{ id: "prog-a", name: "Program A" }, { id: "prog-b", name: "Program B" }] as OzipzProgram[];
const facilities = [{ id: "sp1", type: "Szkoła podstawowa" }, { id: "p1", type: "Przedszkole" }] as OzipzFacility[];
const action = (overrides: Partial<OzipzAction>) => ({ programId: "prog-a", date: "2026-10-05", participantsCount: 25, numberOfActions: 1, ...overrides }) as OzipzAction;

describe("statystyki programów", () => {
  const participations = [
    part({ id: "1" }),
    // Ta sama szkoła, drugi budynek z innym koordynatorem – jedna placówka, uczniowie się sumują.
    part({ id: "2", schoolCoordinatorName: "Jan", pupilsCount: 5, hasFinalReport: true, applicationFile: "Zgłoszenia/2026-2027/a.pdf" }),
    part({ id: "3", facilityId: "p1", facilityName: "Przedszkole 1", municipality: "Barlinek", pupilsCount: 20, schoolCoordinatorName: "" }),
    part({ id: "4", programId: "prog-b", programName: "Program B", pupilsCount: 30 }),
    part({ id: "5", schoolYear: "2025/2026", pupilsCount: 99 }),
  ];
  const actions = [
    action({}),
    action({ date: "2027-08-31", numberOfActions: 2, participantsCount: 40 }),
    action({ date: "2026-08-31" }),
    action({ programId: undefined }),
  ];

  it("liczy szkoły, uczniów i dokumenty w wybranym roku szkolnym", () => {
    const stats = computeProgramStatistics(participations, programs, actions, facilities, "2026/2027");
    const a = stats.rows.find((r) => r.programId === "prog-a")!;
    expect(a).toMatchObject({ schools: 2, participations: 3, pupils: 35, municipalities: 2, declarations: 3, finalReports: 1, files: 1, withoutCoordinator: 1, actions: 3, actionRecipients: 65 });
    expect(a.schoolList.map((s) => [s.facilityName, s.pupils, s.facilityType, s.hasFinalReport, s.hasFile])).toEqual([
      ["Przedszkole 1", 20, "Przedszkole", false, false],
      ["SP 1", 15, "Szkoła podstawowa", false, true],
    ]);
    expect(stats.rows[0].programId).toBe("prog-a");
    expect(stats.summary).toMatchObject({ programs: 2, schools: 2, participations: 4, pupils: 65, municipalities: 2, finalReports: 1, files: 1 });
    expect(stats.municipalities).toEqual([
      { municipality: "Barlinek", schools: 1, participations: 1, programs: 1, pupils: 20 },
      { municipality: "Myślibórz", schools: 1, participations: 3, programs: 2, pupils: 45 },
    ]);
  });

  it("dla wszystkich lat bierze każde zgłoszenie i działanie", () => {
    const stats = computeProgramStatistics(participations, programs, actions, facilities, "all");
    expect(stats.summary.participations).toBe(5);
    expect(stats.rows.find((r) => r.programId === "prog-a")!.actions).toBe(4);
  });

  it("zamienia rok szkolny na zakres dat", () => {
    expect(schoolYearDateRange("2026/2027")).toEqual({ from: "2026-09-01", to: "2027-08-31" });
    expect(schoolYearDateRange("2026")).toBeNull();
  });
});
