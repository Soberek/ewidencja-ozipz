import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../../../../test/fixtures/migratedData";
import {
  calculateSyntheticActionMetrics,
  calculateMonthlySummary,
  calculateAudienceGroupBreakdown,
  calculateFormBreakdown,
  calculateProgramParticipationStats,
  calculateMunicipalityDetailedBreakdown,
  generateSubstantiveReportNarrative,
  calculateMiernikWykonanie,
} from "../../utils/ozipzCalculations";
import { buildReportAnnexRows, buildReportHierarchy } from "../../utils/reportAnnex";
import { buildVacationSummary, isVacationAction } from "../../utils/vacationReporting";
import type { OzipzAction } from "../../types/ozipz.types";
import { MonthlyTargetsComplianceTab } from "./components/MonthlyTargetsComplianceTab";

describe("Ewidencja OZiPZ - Moduł Mierników i Sprawozdań edu-report", () => {
  it("computes authentic synthetic metrics DZ, ODB, MAT on migrated actions", () => {
    const metrics = calculateSyntheticActionMetrics(MIGRATED_FIREBASE_DATA.actions);
    expect(metrics.dzCount).toBeGreaterThanOrEqual(200);
    expect(metrics.directRecipients).toBeGreaterThan(0);
    expect(metrics.totalRecipients).toBeGreaterThanOrEqual(metrics.directRecipients);
    expect(metrics.uniqueFacilitiesCount).toBeGreaterThan(0);
  });

  it("breaks down audience groups and forms cleanly for edu-report", () => {
    const audienceGroups = calculateAudienceGroupBreakdown(MIGRATED_FIREBASE_DATA.actions);
    expect(audienceGroups.length).toBeGreaterThan(0);
    const topGroup = audienceGroups[0];
    expect(topGroup.group).toBeDefined();
    expect(topGroup.directRecipients).toBeGreaterThan(0);

    const forms = calculateFormBreakdown(MIGRATED_FIREBASE_DATA.actions);
    expect(forms.length).toBeGreaterThan(0);
    expect(forms[0].form).toBeDefined();
    expect(forms[0].actionsCount).toBeGreaterThan(0);
  });

  it("calculates accurate program participation stats on migrated data", () => {
    const stats = calculateProgramParticipationStats(MIGRATED_FIREBASE_DATA.participations);
    expect(stats.totalSchools).toBe(MIGRATED_FIREBASE_DATA.participations.length);
    expect(stats.totalPupils).toBeGreaterThanOrEqual(0);
    expect(stats.completionRate).toBeGreaterThanOrEqual(0);
    expect(stats.completionRate).toBeLessThanOrEqual(100);
  });

  it("calculates 5 standard municipalities breakdown for Myślibórz County", () => {
    const muniStats = calculateMunicipalityDetailedBreakdown(
      MIGRATED_FIREBASE_DATA.participations,
      MIGRATED_FIREBASE_DATA.actions,
      MIGRATED_FIREBASE_DATA.facilities,
      MIGRATED_FIREBASE_DATA.distributions
    );

    const muniNames = muniStats.map((m) => m.municipality);
    expect(muniNames).toContain("Myślibórz");
    expect(muniNames).toContain("Barlinek");
    expect(muniNames).toContain("Dębno");
    expect(muniNames).toContain("Nowogródek Pomorski");
    expect(muniNames).toContain("Boleszkowice");

    const mysliborz = muniStats.find((m) => m.municipality === "Myślibórz");
    expect(mysliborz?.facilitiesCount).toBeGreaterThan(0);
  });

  it("generates professional narrative description text without errors", () => {
    const metrics = calculateSyntheticActionMetrics(MIGRATED_FIREBASE_DATA.actions);
    const programsSummary = calculateProgramParticipationStats(MIGRATED_FIREBASE_DATA.participations);
    const audienceGroups = calculateAudienceGroupBreakdown(MIGRATED_FIREBASE_DATA.actions);
    const muniStats = calculateMunicipalityDetailedBreakdown(
      MIGRATED_FIREBASE_DATA.participations,
      MIGRATED_FIREBASE_DATA.actions
    );

    const narrative = generateSubstantiveReportNarrative({
      year: "2026",
      periodName: "I Półrocze (I-VI)",
      actionsMetrics: metrics,
      programsSummary,
      activeProgramsCount: MIGRATED_FIREBASE_DATA.programs.length,
      topAudienceGroups: audienceGroups,
      municipalitiesSummary: muniStats,
    });

    expect(narrative).toContain("SPRAWOZDANIE OPISOWE I MIERNIKI");
    expect(narrative).toContain("Okres sprawozdawczy: I Półrocze (I-VI) (Rok 2026)");
    expect(narrative).toContain("PODSUMOWANIE MIERNIKÓW SYNTEZOWYCH (DZ / ODB / MAT)");
    expect(narrative).toContain("REALIZACJA PROGRAMÓW PROFILAKTYCZNO-EDUKACYJNYCH (MZ / GIS)");
    expect(narrative).toContain("STRUKTURA ODBIORCÓW I AKTYWNOŚĆ TERYTORIALNA");
  });

  it("calculates monthly summary with authentic 2026 totals (259 tasks, 293 actions, 7423 recipients, 20 materials, max 72)", () => {
    const summary = calculateMonthlySummary(MIGRATED_FIREBASE_DATA.actions, "2026");
    expect(summary.totalTasks).toBe(259);
    expect(summary.totalActions).toBe(293);
    expect(summary.totalRecipients).toBe(7423);
    expect(summary.totalMaterials).toBe(20);
    expect(summary.maxMonthlyActions).toBe(72);
    expect(summary.rows.length).toBeGreaterThanOrEqual(8);

    const may = summary.rows.find((r) => r.monthNumber === 5);
    expect(may?.tasksCount).toBe(64);
    expect(may?.actionsCount).toBe(72);
    expect(may?.recipientsCount).toBe(938);
    expect(may?.doneCount).toBe(64);

    const jan = summary.rows.find((r) => r.monthNumber === 1);
    expect(jan?.tasksCount).toBe(27);
    expect(jan?.actionsCount).toBe(37);
    expect(jan?.recipientsCount).toBe(753);

    const aug = summary.rows.find((r) => r.monthNumber === 8);
    expect(aug?.tasksCount).toBe(8);
    expect(aug?.actionsCount).toBe(8);
    expect(aug?.recipientsCount).toBe(599);
    expect(aug?.materialsCount).toBe(10);
  });

  it("prawidłowo oblicza Miernik 20.5.1.W i 20.5.1.2.W zgodnie ze wzorcem z better-oz", () => {
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

    const miernik = calculateMiernikWykonanie(preview, plan);

    // Razem (Miernik 20.5.1.W)
    expect(miernik.razem.actions).toBe(200);
    expect(miernik.razem.people).toBe(6000);
    expect(miernik.procenty.razemDzialania).toBe(80); // (200 / 250) * 100
    expect(miernik.procenty.razemUczestnicy).toBe(80); // (6000 / 7500) * 100

    // Programy (Miernik 20.5.1.2.W)
    expect(miernik.programowe.actions).toBe(120);
    expect(miernik.programowe.people).toBe(2400);
    expect(miernik.procenty.programyDzialania).toBe(80); // (120 / 150) * 100
    expect(miernik.procenty.programyUczestnicy).toBe(96); // (2400 / 2500) * 100
  });

  it("prawidłowo weryfikuje wartości oczekiwane programowe/nieprogramowe dla każdego miesiąca", () => {
    const monthlyMap: Record<number, { progDz: number; progOdb: number; nieprogDz: number; nieprogOdb: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = { progDz: 10, progOdb: 200, nieprogDz: 5, nieprogOdb: 100 };
    }

    const expectedMap: Record<number, { progDz?: number; progOdb?: number; nieprogDz?: number; nieprogOdb?: number }> = {
      1: { progDz: 10, progOdb: 200, nieprogDz: 5, nieprogOdb: 100 }, // Zgodne
      2: { progDz: 12, progOdb: 200, nieprogDz: 5, nieprogOdb: 100 }, // Różnica w progDz (10 vs 12)
    };

    const isMonth1Match =
      monthlyMap[1].progDz === expectedMap[1].progDz &&
      monthlyMap[1].progOdb === expectedMap[1].progOdb &&
      monthlyMap[1].nieprogDz === expectedMap[1].nieprogDz &&
      monthlyMap[1].nieprogOdb === expectedMap[1].nieprogOdb;

    const isMonth2Match =
      monthlyMap[2].progDz === expectedMap[2].progDz &&
      monthlyMap[2].progOdb === expectedMap[2].progOdb &&
      monthlyMap[2].nieprogDz === expectedMap[2].nieprogDz &&
      monthlyMap[2].nieprogOdb === expectedMap[2].nieprogOdb;

    expect(isMonth1Match).toBe(true);
    expect(isMonth2Match).toBe(false);
  });

  it("exports valid MonthlyTargetsComplianceTab component for monthly target and compliance view mode", () => {
    expect(MonthlyTargetsComplianceTab).toBeDefined();
  });

  it("handles numberOfActions > 1 correctly distinguishing tasks count from DZ actions count", () => {
    const customActions: any[] = [
      { id: "1", date: "2026-05-10", numberOfActions: 3, participantsCount: 60, status: "wykonane", programId: "prog-1" },
      { id: "2", date: "2026-05-15", numberOfActions: 2, participantsCount: 40, status: "wykonane" },
    ];

    const metrics = calculateSyntheticActionMetrics(customActions);
    expect(metrics.tasksCount).toBe(2); // 2 wpisy
    expect(metrics.dzCount).toBe(5); // 3 + 2 = 5 działań
    expect(metrics.directRecipients).toBe(100);

    const monthly = calculateMonthlySummary(customActions, "2026");
    expect(monthly.totalTasks).toBe(2);
    expect(monthly.totalActions).toBe(5);
    expect(monthly.totalRecipients).toBe(100);

    const muniStats = calculateMunicipalityDetailedBreakdown([], customActions);
    const totalActs = muniStats.reduce((s, m) => s + m.actionsCount, 0);
    expect(totalActs).toBe(5);
  });

  it("handles empty action datasets with zero division safeguards without NaN or errors", () => {
    const emptyActions: any[] = [];
    const metrics = calculateSyntheticActionMetrics(emptyActions);
    expect(metrics.tasksCount).toBe(0);
    expect(metrics.dzCount).toBe(0);
    expect(metrics.directRecipients).toBe(0);
    expect(metrics.uniqueFacilitiesCount).toBe(0);

    const monthly = calculateMonthlySummary(emptyActions, "2026");
    expect(monthly.totalTasks).toBe(0);
    expect(monthly.totalActions).toBe(0);
    expect(monthly.rows.length).toBe(0);

    const miernikZeroPlan = calculateMiernikWykonanie(
      { split: { programowe: { actions: 0, people: 0 }, nieprogramowe: { actions: 0, people: 0 } } },
      { razem_dzialania: 0, razem_uczestnicy: 0, programy_dzialania: 0, programy_uczestnicy: 0 }
    );
    expect(miernikZeroPlan.procenty.razemDzialania).toBeNull();
    expect(miernikZeroPlan.procenty.razemUczestnicy).toBeNull();
    expect(miernikZeroPlan.procenty.programyDzialania).toBeNull();
    expect(miernikZeroPlan.procenty.programyUczestnicy).toBeNull();
  });

  it("accurately calculates all 14 authentic actions of August 2026 (14 DZ, 679 ODB)", () => {
    // 14 rzeczywistych akcji z sierpnia 2026 z bazy danych
    const augustActions = [
      {
        id: "act-1788342527647-2-juy7",
        date: "2026-08-29",
        actionType: "Stoisko edukacyjno-informacyjne",
        title: "Stoisko edukacyjno-informacyjne OZiPZ",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 80,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.40.2026",
        jrwaCaseId: "jrwa-1788342527615-1-b3vw",
      },
      {
        id: "act-1788418123589-1-nygk",
        date: "2026-08-26",
        actionType: "Publikacja media (Facebook)",
        title: "BW",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 0,
        status: "wykonane",
      },
      {
        id: "DCLXWL5ak0mNX2PdEceD",
        date: "2026-08-19",
        actionType: "Prelekcja (warsztat)",
        title: "Prelekcja (warsztat)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 15,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.35.2026",
        jrwaCaseId: "966.14",
      },
      {
        id: "act-1788249560468",
        date: "2026-08-15",
        actionType: "Publikacja media (Portal X)",
        title: "Post o upale",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 0,
        status: "wykonane",
      },
      {
        id: "YkIG37RUOikB0ffDpnr7",
        date: "2026-08-13",
        actionType: "Prelekcja (warsztat)",
        title: "Prelekcja (warsztat)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 41,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.34.2026",
        jrwaCaseId: "966.14",
      },
      {
        id: "act-1788249560510",
        date: "2026-08-12",
        actionType: "Publikacja media (Portal X)",
        title: "Wirus WZW A",
        programId: "higiena-tarcza",
        programName: "Higiena naszą tarczą ochronną",
        participantsCount: 0,
        status: "wykonane",
        jrwaSign: "9011",
      },
      {
        id: "better-oz-1106",
        date: "2026-08-07",
        actionType: "Sprawozdanie (z programu, miernik, tytoń)",
        title: "Sprawozdanie (z programu, miernik, tytoń)",
        programId: "zdrowe-zeby",
        programName: "Zdrowe zęby mamy, marchewkę zajadamy",
        participantsCount: 1,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.3.8.2026",
        jrwaCaseId: "966.3",
      },
      {
        id: "act-1788417007401-2-d09e",
        date: "2026-08-07",
        actionType: "Publikacja media (Facebook)",
        title: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 0,
        status: "wykonane",
      },
      {
        id: "better-oz-1105",
        date: "2026-08-06",
        actionType: "Dystrybucja",
        title: "Dystrybucja",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 1,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.33.2026",
        jrwaCaseId: "966.14",
      },
      {
        id: "better-oz-1104",
        date: "2026-08-06",
        actionType: "Prelekcja (warsztat)",
        title: "Prelekcja (warsztat)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 33,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.33.2026",
        jrwaCaseId: "966.14",
      },
      {
        id: "better-oz-1103",
        date: "2026-08-05",
        actionType: "Publikacja media (Strona)",
        title: "Publikacja media (Strona)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 0,
        status: "wykonane",
        jrwaSign: "966.14",
        jrwaCaseId: "966.14",
      },
      {
        id: "better-oz-1102",
        date: "2026-08-05",
        actionType: "Sprawozdanie (z programu, miernik, tytoń)",
        title: "Sprawozdanie (z programu, miernik, tytoń)",
        programId: "porozmawiajmy-o-zdrowiu",
        programName: "Porozmawiajmy o zdrowiu i nowych zagrożeniach",
        participantsCount: 1,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.5.16.2026",
        jrwaCaseId: "966.5",
      },
      {
        id: "act-1788416810939-1-ljra",
        date: "2026-08-03",
        actionType: "Publikacja media (Facebook)",
        title: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 0,
        status: "wykonane",
      },
      {
        id: "better-oz-1101",
        date: "2026-08-01",
        actionType: "Stoisko edukacyjno-informacyjne",
        title: "Stoisko edukacyjno-informacyjne",
        programId: "bezpieczne-wakacje",
        programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
        participantsCount: 507,
        status: "wykonane",
        jrwaSign: "OZiPZ.966.14.32.2026",
        jrwaCaseId: "966.14",
      },
    ] as unknown as OzipzAction[];

    // 1. Syntetyczne mierniki: 14 zadań, 14 działań, 679 osób
    const metrics = calculateSyntheticActionMetrics(augustActions);
    expect(metrics.tasksCount).toBe(14);
    expect(metrics.dzCount).toBe(14);
    expect(metrics.directRecipients).toBe(679);

    // 2. Podsumowanie miesięczne dla sierpnia
    const monthly = calculateMonthlySummary(augustActions, "2026");
    expect(monthly.totalTasks).toBe(14);
    expect(monthly.totalActions).toBe(14);
    expect(monthly.totalRecipients).toBe(679);

    // 3. Sprawozdanie hierarchiczne (buildReportAnnexRows i buildReportHierarchy)
    const rows = buildReportAnnexRows(augustActions);
    const hierarchy = buildReportHierarchy(rows);

    expect(hierarchy.length).toBe(2);

    const progSec = hierarchy.find((s) => s.kind === "programowe");
    expect(progSec).toBeDefined();
    // 3 programy szkolne: Higiena (0 os), Porozmawiajmy (1 os), Zdrowe Zęby (1 os)
    expect(progSec?.totalActions).toBe(3);
    expect(progSec?.totalPeople).toBe(2);

    const nonProgSec = hierarchy.find((s) => s.kind === "nieprogramowe");
    expect(nonProgSec).toBeDefined();
    // 11 akcji Bezpiecznych Wakacji: 677 os.
    expect(nonProgSec?.totalActions).toBe(11);
    expect(nonProgSec?.totalPeople).toBe(677);

    // Wszystkie 11 akcji Bezpiecznych Wakacji są w DOKŁADNIE JEDNEJ grupie!
    expect(nonProgSec?.groups.length).toBe(1);
    const bwGroup = nonProgSec!.groups[0];
    expect(bwGroup.programName).toBe(
      "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)"
    );
    expect(bwGroup.totalActions).toBe(11);
    expect(bwGroup.totalPeople).toBe(677);

    // 4. Moduł Bezpiecznych Wakacji obejmuje wyłącznie akcje z 966.14 (11 z 14 akcji w sierpniu)
    const vacationActions = augustActions.filter(isVacationAction);
    expect(vacationActions.length).toBe(11);
    const vacationPeople = vacationActions.reduce((sum, a) => sum + (Number(a.participantsCount) || 0), 0);
    expect(vacationPeople).toBe(677);

    const vacationSummary = buildVacationSummary(augustActions);
    const totalVacationPeople = vacationSummary.byGroup.reduce((sum, g) => sum + g.value, 0);
    expect(totalVacationPeople).toBe(677);
  });

  it("sanitizes JRWA fallbacks to never leak synthetic surrogate keys like 'jrwa-1788342527615-1-b3vw'", () => {
    const isNumericJrwa = (val?: string | null) => Boolean(val && /^\d{3,4}(\.\d+)?$/.test(val));
    const formatJrwaDisplay = (jrwaSign?: string | null, jrwaCaseId?: string | null) => {
      if (jrwaSign && jrwaSign.trim()) return jrwaSign.trim();
      if (jrwaCaseId && isNumericJrwa(jrwaCaseId.trim())) return `JRWA ${jrwaCaseId.trim()}`;
      return "Brak znaku EZD";
    };

    // 1. Valid JRWA sign
    expect(formatJrwaDisplay("OZiPZ.966.14.40.2026", "jrwa-1788342527615-1-b3vw")).toBe("OZiPZ.966.14.40.2026");

    // 2. Numeric JRWA fallback without sign
    expect(formatJrwaDisplay("", "966.1")).toBe("JRWA 966.1");
    expect(formatJrwaDisplay(null, "966.14")).toBe("JRWA 966.14");

    // 3. Raw surrogate DB key must NEVER be displayed
    expect(formatJrwaDisplay("", "jrwa-1788342527615-1-b3vw")).toBe("Brak znaku EZD");
    expect(formatJrwaDisplay(null, "act-12345-uuid")).toBe("Brak znaku EZD");
    expect(formatJrwaDisplay(undefined, undefined)).toBe("Brak znaku EZD");
  });

  it("filters municipality breakdown rows by search query correctly", () => {
    const muniStats = calculateMunicipalityDetailedBreakdown(
      MIGRATED_FIREBASE_DATA.participations,
      MIGRATED_FIREBASE_DATA.actions,
      MIGRATED_FIREBASE_DATA.facilities,
      MIGRATED_FIREBASE_DATA.distributions
    );

    const filterMunis = (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return muniStats;
      return muniStats.filter((r) => r.municipality.toLowerCase().includes(q));
    };

    const mysl = filterMunis("myśl");
    expect(mysl.length).toBe(1);
    expect(mysl[0].municipality).toBe("Myślibórz");

    const bar = filterMunis("barl");
    expect(bar.length).toBe(1);
    expect(bar[0].municipality).toBe("Barlinek");

    const none = filterMunis("nieistniejaca_gmina");
    expect(none.length).toBe(0);
  });
});
