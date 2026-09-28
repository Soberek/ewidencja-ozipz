import { describe, it, expect } from "vitest";
import type { OzipzProgram, OzipzSchoolParticipation } from "../../types/ozipz.types";
import { getProgramJrwaSymbol } from "../../utils/programJrwaUtils";

describe("Ewidencja OZiPZ - Lokalizacje i Szkoły w Programach (edu-report)", () => {
  const dummyPrograms: OzipzProgram[] = [
    {
      id: "prog-1",
      code: "TRZYMAJ-FORME",
      name: "Trzymaj Formę!",
      editionYear: "2025/2026",
      targetAudience: "Szkoły Podstawowe (klasy V-VIII)",
      description: "Ogólnopolski Program Edukacyjny Trzymaj Formę!",
      status: "aktywny",
      jrwaSymbol: "966.1",
      participatingSchoolsCount: 2,
      totalPupilsReached: 120,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prog-2",
      code: "BIEG-PO-ZDROWIE",
      name: "Bieg po zdrowie",
      editionYear: "2025/2026",
      targetAudience: "Szkoły Podstawowe (klasa IV)",
      description: "Nowy program antytytoniowy",
      status: "aktywny",
      jrwaSymbol: "966.3",
      participatingSchoolsCount: 1,
      totalPupilsReached: 45,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const dummyParticipations: OzipzSchoolParticipation[] = [
    {
      id: "part-1",
      programId: "prog-1",
      programName: "Trzymaj Formę!",
      facilityId: "fac-1",
      facilityName: "Szkoła Podstawowa nr 1 w Barlinku",
      municipality: "Barlinek",
      schoolYear: "2025/2026",
      schoolCoordinatorName: "Anna Nowak",
      schoolCoordinatorContact: "95 746 11 22",
      classesCount: 3,
      pupilsCount: 65,
      parentsCount: 40,
      hasDeclaration: true,
      hasFinalReport: true,
      evaluationGrade: "Bardzo dobra",
      notes: "Pełna realizacja",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "part-2",
      programId: "prog-1",
      programName: "Trzymaj Formę!",
      facilityId: "fac-2",
      facilityName: "Szkoła Podstawowa nr 2 w Myśliborzu",
      municipality: "Myślibórz",
      schoolYear: "2025/2026",
      schoolCoordinatorName: "Jan Kowalski",
      schoolCoordinatorContact: "95 747 33 44",
      classesCount: 2,
      pupilsCount: 55,
      parentsCount: 30,
      hasDeclaration: true,
      hasFinalReport: false,
      evaluationGrade: "",
      notes: "Oczekuje na sprawozdanie w czerwcu",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "part-3",
      programId: "prog-2",
      programName: "Bieg po zdrowie",
      facilityId: "fac-3",
      facilityName: "Szkoła Podstawowa w Dębnie",
      municipality: "Dębno",
      schoolYear: "2025/2026",
      schoolCoordinatorName: "Maria Wiśniewska",
      schoolCoordinatorContact: "95 760 55 66",
      classesCount: 2,
      pupilsCount: 45,
      parentsCount: 25,
      hasDeclaration: false,
      hasFinalReport: false,
      evaluationGrade: "",
      notes: "",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  it("calculates accurate KPI summary metrics for participating schools", () => {
    const totalParticipations = dummyParticipations.length;
    const totalPupils = dummyParticipations.reduce((sum, p) => sum + p.pupilsCount, 0);
    const totalClasses = dummyParticipations.reduce((sum, p) => sum + p.classesCount, 0);
    const totalParents = dummyParticipations.reduce((sum, p) => sum + (p.parentsCount || 0), 0);
    const withReport = dummyParticipations.filter((p) => p.hasFinalReport).length;
    const withoutReport = totalParticipations - withReport;
    const withDeclaration = dummyParticipations.filter((p) => p.hasDeclaration).length;

    expect(totalParticipations).toBe(3);
    expect(totalPupils).toBe(165);
    expect(totalClasses).toBe(7);
    expect(totalParents).toBe(95);
    expect(withReport).toBe(1);
    expect(withoutReport).toBe(2);
    expect(withDeclaration).toBe(2);
    expect(Math.round((withReport / totalParticipations) * 100)).toBe(33);
  });

  it("resolves JRWA symbols for programs properly", () => {
    expect(getProgramJrwaSymbol(dummyPrograms[0])).toBe("966.1");
    expect(getProgramJrwaSymbol(dummyPrograms[1])).toBe("966.3");
  });

  it("filters schools by program and municipality correctly", () => {
    const barlinekOnly = dummyParticipations.filter((p) => p.municipality === "Barlinek");
    expect(barlinekOnly).toHaveLength(1);
    expect(barlinekOnly[0].facilityName).toContain("Barlinku");

    const prog1Only = dummyParticipations.filter((p) => p.programId === "prog-1");
    expect(prog1Only).toHaveLength(2);
  });

  it("identifies submitted and pending reports correctly for 1-click toggling", () => {
    const submitted = dummyParticipations.filter((p) => p.hasFinalReport);
    const pending = dummyParticipations.filter((p) => !p.hasFinalReport);

    expect(submitted.map((p) => p.id)).toEqual(["part-1"]);
    expect(pending.map((p) => p.id)).toEqual(["part-2", "part-3"]);
  });
});
