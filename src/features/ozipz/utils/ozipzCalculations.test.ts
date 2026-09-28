import { describe, it, expect } from "vitest";
import {
  calculateTotalRecipients,
  calculateSyntheticActionMetrics,
  calculateMonthlySummary,
  reconcileMonthlySummary,
  isProgramAction,
  extractCleanJrwaSymbol,
  calculateAudienceGroupBreakdown,
  calculateFormBreakdown,
  filterActionsByPeriod,
  calculateTopicDistribution,
  calculateActionTypeStats,
  calculateMaterialTypeStats,
  calculateProgramReach,
  calculateProgramParticipationStats,
  calculateMunicipalityDetailedBreakdown,
  generateSubstantiveReportNarrative,
  compareJrwa,
  sanitizeRecentDate,
  validateIntegerAtLeast,
  nonNegativeInt,
  calculatePercent,
  calculateMiernikWykonanie,
  isExcludedNieprogramoweWizytacja,
  DEFAULT_INTERWENCJE_JRWA,
  JRWA_INTERVENTION_KIND_MAP,
  buildJrwaInterventionKindMap,
  buildJrwaInterventionNamesMap,
  getActiveJrwaKindMap,
} from "./ozipzCalculations";
import type {
  OzipzAction,
  OzipzMaterial,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzFacility,
  OzipzDistribution,
} from "../types/ozipz.types";

describe("ozipzCalculations", () => {
  describe("calculateTotalRecipients", () => {
    it("calculates total recipients accurately", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { participantsCount: 30, indirectRecipientsCount: 10, materialsDistributedCount: 30 },
        { participantsCount: 50, indirectRecipientsCount: 20, materialsDistributedCount: 50 },
      ];

      const stats = calculateTotalRecipients(mockActions as OzipzAction[]);
      expect(stats.direct).toBe(80);
      expect(stats.indirect).toBe(30);
      expect(stats.total).toBe(110);
      expect(stats.materialsCount).toBe(80);
    });

    it("handles empty or missing recipient counts cleanly", () => {
      const stats = calculateTotalRecipients([{} as OzipzAction]);
      expect(stats.direct).toBe(0);
      expect(stats.indirect).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.materialsCount).toBe(0);
    });
  });

  describe("calculateSyntheticActionMetrics", () => {
    it("calculates synthetic action metrics (DZ, ODB_B, ODB_P, MAT)", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { id: "1", title: "Prelekcja", participantsCount: 25, indirectRecipientsCount: 0, materialsDistributedCount: 25, status: "wykonane", facilityName: "SP 1", topic: "zywienie_i_aktywnosc" },
        { id: "2", title: "Warsztat", participantsCount: 15, indirectRecipientsCount: 50, materialsDistributedCount: 30, status: "wykonane", facilityName: "LO 1", topic: "zdrowie_psychiczne" },
        { id: "3", title: "Stoisko", participantsCount: 100, indirectRecipientsCount: 200, materialsDistributedCount: 150, status: "planowane", facilityName: "Rynek", topic: "narkotyki" },
      ];

      const metrics = calculateSyntheticActionMetrics(mockActions as OzipzAction[]);
      expect(metrics.tasksCount).toBe(3);
      expect(metrics.dzCount).toBe(3);
      expect(metrics.directRecipients).toBe(140);
      expect(metrics.indirectRecipients).toBe(250);
      expect(metrics.totalRecipients).toBe(390);
      expect(metrics.materialsDistributed).toBe(205);
      expect(metrics.executedCount).toBe(2);
      expect(metrics.plannedCount).toBe(1);
      expect(metrics.uniqueFacilitiesCount).toBe(3);
      expect(metrics.uniqueTopicsCount).toBe(3);
    });

    it("respects custom numberOfActions and facilityId over facilityName", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { id: "1", numberOfActions: 4, participantsCount: 80, facilityId: "fac-100", facilityName: "Szkoła", status: "planned" },
      ];
      const metrics = calculateSyntheticActionMetrics(mockActions as OzipzAction[]);
      expect(metrics.dzCount).toBe(4);
      expect(metrics.plannedCount).toBe(1);
      expect(metrics.executedCount).toBe(0);
      expect(metrics.uniqueFacilitiesCount).toBe(1);
    });
  });

  describe("isProgramAction & JRWA mappings", () => {
    it("correctly determines program action based on actionType, JRWA and programId", () => {
      expect(isProgramAction({ actionType: "programowe" })).toBe(true);
      expect(isProgramAction({ actionType: "nieprogramowe" })).toBe(false);
      expect(isProgramAction({ actionType: "wlasne" })).toBe(false);
      expect(isProgramAction({ actionType: "akcyjne" })).toBe(false);

      // JRWA 966.1 (Trzymaj Formę) -> PROGRAMOWE
      expect(isProgramAction({ jrwaCaseId: "966.1" })).toBe(true);
      // JRWA 966.14 (Bezpieczne Wakacje) -> NIEPROGRAMOWE
      expect(isProgramAction({ jrwaSign: "OZiPZ.966.14.2.2026" })).toBe(false);

      // Bezpieczne Wakacje z technicznym UUID SQLite w jrwaCaseId nie może być zaklasyfikowane jako programowe
      expect(
        isProgramAction({
          programId: "bezpieczne-wakacje",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
          jrwaCaseId: "jrwa-1788342527615-1-b3vw",
          jrwaSign: "OZiPZ.966.14.40.2026",
        })
      ).toBe(false);

      // Publikacja Bezpieczne Wakacje bez znaku sprawy też jest nieprogramowa
      expect(
        isProgramAction({
          programId: "bezpieczne-wakacje",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
          actionType: "Publikacja media (Facebook)",
        })
      ).toBe(false);

      // ProgramId fallback
      expect(isProgramAction({ programId: "prog-tf" })).toBe(true);
      expect(isProgramAction({ programId: "inne" })).toBe(false);
      expect(isProgramAction({ programId: "brak" })).toBe(false);
      expect(isProgramAction({})).toBe(false);
    });

    it("extractCleanJrwaSymbol extracts valid JRWA symbols and ignores database UUIDs", () => {
      expect(extractCleanJrwaSymbol({ jrwaSign: "OZiPZ.966.14.40.2026" })).toBe("966.14");
      expect(extractCleanJrwaSymbol({ jrwaSign: "OZiPZ.966.4.1.2026" })).toBe("966.4");
      expect(extractCleanJrwaSymbol({ programId: "bezpieczne-wakacje" })).toBe("966.14");
      expect(extractCleanJrwaSymbol({ programName: "Higiena naszą tarczą ochronną" })).toBe("966.4");
      expect(extractCleanJrwaSymbol({ programId: "trzymaj-forme" })).toBe("966.1");

      // Techniczne UUID SQLite nie jest zwracane jako symbol JRWA
      expect(extractCleanJrwaSymbol({ jrwaCaseId: "jrwa-1788342527615-1-b3vw" })).toBeNull();
      // Ale jeśli encja ma też programName, to symbol zostanie prawidłowo wydedukowany
      expect(
        extractCleanJrwaSymbol({
          jrwaCaseId: "jrwa-1788342527615-1-b3vw",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego",
        })
      ).toBe("966.14");
    });

    it("contains expected default JRWA interventions list", () => {
      expect(DEFAULT_INTERWENCJE_JRWA.length).toBeGreaterThanOrEqual(18);
      expect(JRWA_INTERVENTION_KIND_MAP.get("966.1")).toBe("PROGRAMOWE");
      expect(JRWA_INTERVENTION_KIND_MAP.get("966.14")).toBe("NIEPROGRAMOWE");
    });

    it("buildJrwaInterventionKindMap builds dynamic map from dictionary items overriding defaults", () => {
      const customItems = [
        {
          id: "dict-custom-1",
          dictType: "jrwaSymbol",
          code: "966.14",
          label: "Bezpieczne Wakacje (Jako program)",
          kind: "PROGRAMOWE" as const,
          isSystem: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "dict-custom-2",
          dictType: "jrwaSymbol",
          code: "966.99",
          label: "Nowy Program Lokalny",
          kind: "PROGRAMOWE" as const,
          isSystem: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const kindMap = buildJrwaInterventionKindMap(customItems);
      // Overridden from default NIEPROGRAMOWE to PROGRAMOWE:
      expect(kindMap.get("966.14")).toBe("PROGRAMOWE");
      // Newly added symbol:
      expect(kindMap.get("966.99")).toBe("PROGRAMOWE");
      // Existing untouched symbol remains intact:
      expect(kindMap.get("966.1")).toBe("PROGRAMOWE");
    });

    it("buildJrwaInterventionNamesMap builds dynamic map of names from dictionary items", () => {
      const customItems = [
        {
          id: "dict-custom-1",
          dictType: "jrwaSymbol",
          code: "966.99",
          label: "Specjalny Program Profilaktyczny",
          kind: "PROGRAMOWE" as const,
          isSystem: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const namesMap = buildJrwaInterventionNamesMap(customItems);
      expect(namesMap.get("966.99")).toBe("Specjalny Program Profilaktyczny");
      expect(namesMap.get("966.1")).toBe("Trzymaj Formę");
    });

    it("getActiveJrwaKindMap returns non-empty map with canonical keys", () => {
      const activeMap = getActiveJrwaKindMap();
      expect(activeMap.size).toBeGreaterThan(0);
      expect(activeMap.get("966.1")).toBe("PROGRAMOWE");
      expect(activeMap.get("966.14")).toBe("NIEPROGRAMOWE");
    });

    it("isProgramAction respects customKindMap and dynamically added JRWA symbols", () => {
      const customKindMap = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([
        ["966.14", "PROGRAMOWE"], // user re-classified 966.14 as PROGRAMOWE
        ["966.99", "PROGRAMOWE"], // newly registered JRWA symbol
        ["966.1", "NIEPROGRAMOWE"], // user re-classified 966.1 as NIEPROGRAMOWE
      ]);

      expect(isProgramAction({ jrwaSign: "OZiPZ.966.14.1.2026" }, customKindMap)).toBe(true);
      expect(isProgramAction({ jrwaSign: "OZiPZ.966.99.1.2026" }, customKindMap)).toBe(true);
      expect(isProgramAction({ jrwaSign: "OZiPZ.966.1.1.2026" }, customKindMap)).toBe(false);
    });

    it("extractCleanJrwaSymbol recognizes custom JRWA symbols passed via knownSymbols", () => {
      expect(extractCleanJrwaSymbol({ jrwaSign: "OZiPZ.966.99.5.2026" }, ["966.99"])).toBe("966.99");
      expect(extractCleanJrwaSymbol({ jrwaCaseId: "966.99" }, ["966.99"])).toBe("966.99");
    });
  });

  describe("calculateAudienceGroupBreakdown", () => {
    it("breaks down audience groups with cleaned labels and sorts descending", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { audienceGroup: "Uczniowie szkoły podstawowej - 25", participantsCount: 25 },
        { audienceGroup: "Uczniowie szkoły podstawowej - 30", participantsCount: 30 },
        { audienceGroup: "Dzieci w wieku przedszkolnym - 18", participantsCount: 18 },
        { audienceGroup: undefined, participantsCount: 10 },
      ];

      const breakdown = calculateAudienceGroupBreakdown(mockActions as OzipzAction[]);
      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].group).toBe("Uczniowie szkoły podstawowej");
      expect(breakdown[0].directRecipients).toBe(55);
      expect(breakdown[0].actionsCount).toBe(2);
      expect(breakdown[1].group).toBe("Dzieci w wieku przedszkolnym");
      expect(breakdown[2].group).toBe("Inni odbiorcy");
    });

    it("preserves age ranges with hyphens (e.g. Dzieci 6-9 lat)", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { audienceGroup: "Dzieci 6-9 lat", participantsCount: 15 },
        { audienceGroup: "Młodzież 15-18 lat", participantsCount: 20 },
      ];
      const breakdown = calculateAudienceGroupBreakdown(mockActions as OzipzAction[]);
      expect(breakdown).toHaveLength(2);
      expect(breakdown.map((b) => b.group)).toContain("Dzieci 6-9 lat");
      expect(breakdown.map((b) => b.group)).toContain("Młodzież 15-18 lat");
    });
  });

  describe("calculateFormBreakdown", () => {
    it("breaks down actions by form title/type and sorts by actions count", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { title: "Prelekcja (warsztat)", participantsCount: 20, materialsDistributedCount: 20 },
        { title: "Prelekcja (warsztat)", participantsCount: 15, materialsDistributedCount: 15 },
        { title: "Konkurs (quiz)", participantsCount: 40, materialsDistributedCount: 0 },
      ];

      const breakdown = calculateFormBreakdown(mockActions as OzipzAction[]);
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].form).toBe("Prelekcja (warsztat)");
      expect(breakdown[0].actionsCount).toBe(2);
      expect(breakdown[0].directRecipients).toBe(35);
      expect(breakdown[0].materialsDistributed).toBe(35);
    });
  });

  describe("filterActionsByPeriod", () => {
    it("filters actions by year and period (halves, quarters, months)", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { id: "1", date: "2026-01-15" },
        { id: "2", date: "2026-03-20" },
        { id: "3", date: "2026-05-10" },
        { id: "4", date: "2026-08-10" },
        { id: "5", date: "2026-11-20" },
        { id: "6", date: "2025-12-05" },
      ];

      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "H1")).toHaveLength(3);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "H2")).toHaveLength(2);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "Q1")).toHaveLength(2);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "Q2")).toHaveLength(1);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "Q3")).toHaveLength(1);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "Q4")).toHaveLength(1);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "08")).toHaveLength(1);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "2026", "all")).toHaveLength(5);
      expect(filterActionsByPeriod(mockActions as OzipzAction[], "all", "all")).toHaveLength(6);
    });
  });

  describe("calculateTopicDistribution & calculateActionTypeStats", () => {
    it("aggregates topic distribution with participants counts", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { topic: "zdrowe_zywienie", participantsCount: 30 },
        { topic: "zdrowe_zywienie", participantsCount: 20 },
        { topic: "profilaktyka_tytoniowa", participantsCount: 15 },
      ];

      const topics = calculateTopicDistribution(mockActions as OzipzAction[]);
      expect(topics).toHaveLength(2);
      const zywienie = topics.find((t) => t.topic === "zdrowe_zywienie");
      expect(zywienie?.count).toBe(2);
      expect(zywienie?.participants).toBe(50);
    });

    it("aggregates action type stats", () => {
      const mockActions: Partial<OzipzAction>[] = [
        { actionType: "prelekcja", participantsCount: 40 },
        { actionType: "warsztat", participantsCount: 25 },
        { actionType: "prelekcja", participantsCount: 35 },
      ];

      const stats = calculateActionTypeStats(mockActions as OzipzAction[]);
      expect(stats).toHaveLength(2);
      const prelekcja = stats.find((s) => s.type === "prelekcja");
      expect(prelekcja?.count).toBe(2);
      expect(prelekcja?.participants).toBe(75);
    });
  });

  describe("calculateMaterialTypeStats", () => {
    it("calculates material type stats correctly", () => {
      const mockMaterials: Partial<OzipzMaterial>[] = [
        { id: "1", title: "Ulotka A", materialType: "ulotka" },
        { id: "2", title: "Ulotka B", materialType: "ulotka" },
        { id: "3", title: "Broszura C", materialType: "broszura" },
        { id: "4", title: "Plakat D", materialType: "plakat" },
      ];

      const typeStats = calculateMaterialTypeStats(mockMaterials as OzipzMaterial[]);
      expect(typeStats).toHaveLength(3);
      const ulotki = typeStats.find((t) => t.type === "ulotka");
      expect(ulotki?.count).toBe(2);
    });
  });

  describe("calculateProgramReach & calculateProgramParticipationStats", () => {
    it("calculates program reach summary across programs", () => {
      const programs: Partial<OzipzProgram>[] = [
        { id: "p1", name: "Trzymaj Formę!" },
        { id: "p2", name: "Bieg po zdrowie" },
      ];
      const participations: Partial<OzipzSchoolParticipation>[] = [
        { id: "s1", programId: "p1", pupilsCount: 100, parentsCount: 50 },
        { id: "s2", programId: "p1", pupilsCount: 80, parentsCount: 30 },
        { id: "s3", programId: "p2", pupilsCount: 60, parentsCount: 20 },
      ];
      const actions: Partial<OzipzAction>[] = [
        { id: "a1", programId: "p1" },
        { id: "a2", programId: "p1" },
        { id: "a3", programId: "p2" },
      ];

      const reach = calculateProgramReach(
        programs as OzipzProgram[],
        participations as OzipzSchoolParticipation[],
        actions as OzipzAction[]
      );

      expect(reach).toHaveLength(2);
      expect(reach[0].programName).toBe("Trzymaj Formę!");
      expect(reach[0].participatingSchools).toBe(2);
      expect(reach[0].totalPupils).toBe(180);
      expect(reach[0].totalParents).toBe(80);
      expect(reach[0].actionsCount).toBe(2);

      expect(reach[1].programName).toBe("Bieg po zdrowie");
      expect(reach[1].totalPupils).toBe(60);
    });

    it("computes program participation metrics and handles 0 schools", () => {
      expect(calculateProgramParticipationStats([])).toEqual({
        totalSchools: 0,
        totalPupils: 0,
        totalParents: 0,
        declarationsCount: 0,
        finalReportsCount: 0,
        completionRate: 0,
      });

      const mockParts: Partial<OzipzSchoolParticipation>[] = [
        { pupilsCount: 50, parentsCount: 10, hasDeclaration: true, hasFinalReport: true },
        { pupilsCount: 30, parentsCount: 5, hasDeclaration: true, hasFinalReport: false },
      ];

      const stats = calculateProgramParticipationStats(mockParts as OzipzSchoolParticipation[]);
      expect(stats.totalSchools).toBe(2);
      expect(stats.totalPupils).toBe(80);
      expect(stats.totalParents).toBe(15);
      expect(stats.declarationsCount).toBe(2);
      expect(stats.finalReportsCount).toBe(1);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe("calculateMunicipalityDetailedBreakdown", () => {
    it("calculates integrated municipality detailed breakdown including default 5 counties", () => {
      const mockParts: Partial<OzipzSchoolParticipation>[] = [
        { id: "p1", municipality: "Myślibórz", facilityId: "f1", programId: "prog1", classesCount: 2, pupilsCount: 50, parentsCount: 30, hasFinalReport: true },
        { id: "p2", municipality: "Barlinek", facilityId: "f2", programId: "prog1", classesCount: 3, pupilsCount: 75, parentsCount: 40, hasFinalReport: false },
      ];
      const mockActions: Partial<OzipzAction>[] = [
        { id: "a1", municipality: "Myślibórz", participantsCount: 20, materialsDistributedCount: 20, facilityId: "f1" },
      ];
      const mockDistributions: Partial<OzipzDistribution>[] = [
        { municipality: "Myślibórz", quantity: 50 },
      ];
      const mockFacilities: Partial<OzipzFacility>[] = [
        { id: "f1", municipality: "Myślibórz" },
        { id: "f2", municipality: "Barlinek" },
      ];

      const muniStats = calculateMunicipalityDetailedBreakdown(
        mockParts as OzipzSchoolParticipation[],
        mockActions as OzipzAction[],
        mockFacilities as OzipzFacility[],
        mockDistributions as OzipzDistribution[]
      );

      expect(muniStats.length).toBeGreaterThanOrEqual(5);
      const mysliborz = muniStats.find((m) => m.municipality === "Myślibórz");
      expect(mysliborz?.pupilsCount).toBe(50);
      expect(mysliborz?.actionsCount).toBe(1);
      expect(mysliborz?.materialsDistributed).toBe(70);
      expect(mysliborz?.reportingRate).toBe(100);
    });
  });

  describe("generateSubstantiveReportNarrative", () => {
    it("generates structured Polish narrative report", () => {
      const narrative = generateSubstantiveReportNarrative({
        year: "2026",
        periodName: "I Półrocze",
        actionsMetrics: {
          dzCount: 15,
          tasksCount: 15,
          directRecipients: 450,
          indirectRecipients: 1200,
          totalRecipients: 1650,
          materialsDistributed: 500,
          executedCount: 15,
          plannedCount: 0,
          uniqueFacilitiesCount: 8,
          uniqueTopicsCount: 5,
        },
        programsSummary: {
          totalSchools: 12,
          totalPupils: 850,
          totalParents: 400,
          declarationsCount: 12,
          finalReportsCount: 10,
          completionRate: 83,
        },
        activeProgramsCount: 6,
        topAudienceGroups: [
          { group: "Uczniowie szkoły podstawowej", actionsCount: 8, directRecipients: 250 },
        ],
        municipalitiesSummary: [
          {
            municipality: "Myślibórz",
            facilitiesCount: 5,
            participationsCount: 8,
            programsCount: 4,
            actionsCount: 7,
            classesCount: 10,
            pupilsCount: 350,
            parentsCount: 150,
            materialsDistributed: 200,
            finalReportsCount: 6,
            reportingRate: 75,
          },
        ],
      });

      expect(narrative).toContain("SPRAWOZDANIE OPISOWE");
      expect(narrative).toContain("Okres sprawozdawczy: I Półrocze (Rok 2026)");
      expect(narrative).toContain("Liczba bezpośrednich uczestników prelekcji, warsztatów i pogadanek (ODB_B): 450 osób.");
      expect(narrative).toContain("Łączna liczba objętych dzieci i młodzieży szkolnej: 850 uczniów.");
      expect(narrative).toContain("Wskaźnik kompletności nadesłanych sprawozdań końcowych z placówek: 83%");
    });
  });

  describe("calculateMonthlySummary & reconcileMonthlySummary", () => {
    it("calculates accurate monthly breakdown matching numbers", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        { id: "1", date: "2026-01-10", numberOfActions: 2, participantsCount: 40, materialsDistributedCount: 0, status: "wykonane" },
        { id: "2", date: "2026-01-20", numberOfActions: 1, participantsCount: 30, materialsDistributedCount: 0, status: "wykonane" },
        { id: "3", date: "2026-02-15", numberOfActions: 3, participantsCount: 60, materialsDistributedCount: 10, status: "wykonane" },
      ];

      const monthly = calculateMonthlySummary(sampleActions as OzipzAction[], "2026");
      expect(monthly.totalTasks).toBe(3);
      expect(monthly.totalActions).toBe(6);
      expect(monthly.totalRecipients).toBe(130);
      expect(monthly.totalMaterials).toBe(10);
      expect(monthly.totalDone).toBe(3);
      expect(monthly.maxMonthlyActions).toBe(3);
      expect(monthly.rows).toHaveLength(2);
      expect(monthly.rows[0].label).toContain("Sty 2026");
      expect(monthly.rows[0].actionsCount).toBe(3);
      expect(monthly.rows[1].label).toContain("Lut 2026");
      expect(monthly.rows[1].actionsCount).toBe(3);
    });

    it("accurately reconciles expected target values against actual calculations with diffs", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        { id: "1", date: "2026-01-10", numberOfActions: 2, participantsCount: 40, materialsDistributedCount: 0, status: "wykonane" },
        { id: "2", date: "2026-01-20", numberOfActions: 1, participantsCount: 30, materialsDistributedCount: 0, status: "wykonane" },
        { id: "3", date: "2026-02-15", numberOfActions: 3, participantsCount: 60, materialsDistributedCount: 10, status: "wykonane" },
      ];

      const monthly = calculateMonthlySummary(sampleActions as OzipzAction[], "2026");

      // Case 1: Exact Match
      const perfectTargets = {
        "01": { tasksCount: 2, actionsCount: 3, recipientsCount: 70, materialsCount: 0, doneCount: 2 },
        "02": { tasksCount: 1, actionsCount: 3, recipientsCount: 60, materialsCount: 10, doneCount: 1 },
      };
      const perfectRec = reconcileMonthlySummary(monthly, perfectTargets);
      expect(perfectRec.allMatched).toBe(true);
      expect(perfectRec.totalMismatchesCount).toBe(0);
      expect(perfectRec.rows[0].isReconciled).toBe(true);
      expect(perfectRec.rows[1].isReconciled).toBe(true);

      // Case 2: Mismatch
      const mismatchTargets = {
        "01": { tasksCount: 2, actionsCount: 5, recipientsCount: 70, materialsCount: 0, doneCount: 2 },
      };
      const mismatchRec = reconcileMonthlySummary(monthly, mismatchTargets);
      expect(mismatchRec.allMatched).toBe(false);
      expect(mismatchRec.totalMismatchesCount).toBe(1);
      expect(mismatchRec.rows[0].isReconciled).toBe(false);
      expect(mismatchRec.rows[0].fieldDiffs.actions.diff).toBe(-2);
      expect(mismatchRec.rows[0].fieldDiffs.actions.matches).toBe(false);
    });
  });

  describe("compareJrwa, sanitizeRecentDate, helpers", () => {
    it("compares JRWA natural dot-separated segments correctly", () => {
      expect(compareJrwa("966.2", "966.10")).toBeLessThan(0);
      expect(compareJrwa("966.10", "966.2")).toBeGreaterThan(0);
      expect(compareJrwa("966.1", "966.1")).toBe(0);
      expect(compareJrwa("0442", "966.1")).toBeLessThan(0);
      expect(compareJrwa("966.18", "9011.1")).toBeLessThan(0);
      expect(compareJrwa(null, "966.1")).toBeLessThan(0);
      expect(compareJrwa(undefined, undefined)).toBe(0);
    });

    it("sanitizes recent OCR dates, substituting aberrant years", () => {
      expect(sanitizeRecentDate("2026-05-12", { nowYear: 2026 })).toBe("2026-05-12");
      expect(sanitizeRecentDate("2025-05-12", { nowYear: 2026, maxDelta: 1 })).toBe("2025-05-12");
      expect(sanitizeRecentDate("1998-05-12", { nowYear: 2026, maxDelta: 1 })).toBe("2026-05-12");
      expect(sanitizeRecentDate(null)).toBeNull();
      expect(sanitizeRecentDate("invalid")).toBe("invalid");
    });

    it("validates positive integers and non-negative values", () => {
      expect(validateIntegerAtLeast(5, 1, "Wartość")).toBe(5);
      expect(() => validateIntegerAtLeast(0, 1, "Wartość")).toThrow("Wartość musi być liczbą całkowitą ≥ 1");
      expect(() => validateIntegerAtLeast("abc", 1, "Wartość")).toThrow();

      expect(nonNegativeInt(10)).toBe(10);
      expect(nonNegativeInt(-5)).toBe(0);
      expect(nonNegativeInt("15.7")).toBe(16);
      expect(nonNegativeInt("abc")).toBe(0);
      expect(nonNegativeInt(null)).toBe(0);
    });

    it("calculates percentages safely", () => {
      expect(calculatePercent(50, 100)).toBe(50);
      expect(calculatePercent(75, 200)).toBe(38);
      expect(calculatePercent(10, 0)).toBeNull();
      expect(calculatePercent(10, -5)).toBeNull();
    });
  });

  describe("calculateMiernikWykonanie (MZ-54/MZ-06 / 20.5.1.W & 20.5.1.2.W)", () => {
    it("calculates execution metrics and percentages accurately", () => {
      const preview = {
        split: {
          programowe: { actions: 120, people: 2400 },
          nieprogramowe: { actions: 80, people: 3600 },
        },
      };
      const plan = {
        razem_dzialania: 250,
        razem_uczestnicy: 7500,
        programy_dzialania: 150,
        programy_uczestnicy: 2500,
      };

      const result = calculateMiernikWykonanie(preview, plan);

      expect(result.programowe.actions).toBe(120);
      expect(result.programowe.people).toBe(2400);
      expect(result.akcje.actions).toBe(80);
      expect(result.akcje.people).toBe(3600);
      expect(result.razem.actions).toBe(200);
      expect(result.razem.people).toBe(6000);

      expect(result.planowane.razemDzialania).toBe(250);
      expect(result.planowane.razemUczestnicy).toBe(7500);

      expect(result.procenty.razemDzialania).toBe(80);
      expect(result.procenty.razemUczestnicy).toBe(80);
      expect(result.procenty.programyDzialania).toBe(80);
      expect(result.procenty.programyUczestnicy).toBe(96);
    });

    it("handles empty preview and plan inputs gracefully", () => {
      const result = calculateMiernikWykonanie({}, {});
      expect(result.razem.actions).toBe(0);
      expect(result.razem.people).toBe(0);
      expect(result.procenty.razemDzialania).toBeNull();
      expect(result.procenty.razemUczestnicy).toBeNull();
    });
  });

  describe("isExcludedNieprogramoweWizytacja", () => {
    it("identifies when non-program Wizytacja should be excluded", () => {
      expect(
        isExcludedNieprogramoweWizytacja({
          actionType: "nieprogramowe",
          title: "Wizytacja",
        })
      ).toBe(true);

      expect(
        isExcludedNieprogramoweWizytacja({
          actionType: "programowe",
          title: "Wizytacja",
        })
      ).toBe(false);

      expect(
        isExcludedNieprogramoweWizytacja({
          actionType: "nieprogramowe",
          title: "Prelekcja",
        })
      ).toBe(false);

      const dynamicMap = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([
        ["966.88", "PROGRAMOWE"],
        ["966.99", "NIEPROGRAMOWE"],
      ]);

      // Custom JRWA classified as PROGRAMOWE -> not excluded even if title is Wizytacja
      expect(
        isExcludedNieprogramoweWizytacja(
          {
            jrwaSign: "OZiPZ.966.88.1.2026",
            title: "Wizytacja",
          },
          dynamicMap
        )
      ).toBe(false);

      // Custom JRWA classified as NIEPROGRAMOWE -> excluded when title is Wizytacja
      expect(
        isExcludedNieprogramoweWizytacja(
          {
            jrwaSign: "OZiPZ.966.99.1.2026",
            title: "Wizytacja",
          },
          dynamicMap
        )
      ).toBe(true);
    });
  });
});
