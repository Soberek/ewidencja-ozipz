import { describe, it, expect, vi } from "vitest";
import type { OzipzAction } from "../types/ozipz.types";
import {
  buildReportAnnexRows,
  buildReportHierarchy,
  formatReportMonthLabel,
  aggregateActionsToProgramsData,
  formatStationForHeader,
  buildDefaultHeaderTitle,
  getNormalizedActionType,
  resolveInterventionName,
  exportToExcel,
  exportToTemplate,
  exportToCumulativeTemplate,
  downloadAnnexReportExcel,
  downloadFullReportWorkbook,
  formatPeriodForHeader,
} from "./reportAnnex";
import * as downloadHelper from "./downloadHelper";

describe("reportAnnex (Better-OZ Parity & Excel Export Engine)", () => {
  describe("Header & Period formatting", () => {
    it("formats month labels consistently", () => {
      expect(formatReportMonthLabel([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe("Cały rok");
      expect(formatReportMonthLabel([1, 2, 3, 4, 5, 6])).toBe("I Półrocze (I-VI)");
      expect(formatReportMonthLabel([7, 8, 9, 10, 11, 12])).toBe("II Półrocze (VII-XII)");
      expect(formatReportMonthLabel([8])).toBe("Sierpień");
      expect(formatReportMonthLabel([1, 2, 3])).toBe("Styczeń–Marzec");
      expect(formatReportMonthLabel([1, 3, 5])).toBe("Styczeń, Marzec, Maj");
      expect(formatReportMonthLabel([])).toBe("Cały rok");
    });

    it("formats period for header correctly", () => {
      expect(formatPeriodForHeader([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe("styczeń - grudzień");
      expect(formatPeriodForHeader([5])).toBe("maj");
      expect(formatPeriodForHeader([1, 2, 3])).toBe("styczeń - marzec (I kwartał)");
      expect(formatPeriodForHeader([4, 5, 6])).toBe("kwiecień - czerwiec (II kwartał)");
      expect(formatPeriodForHeader([7, 8, 9])).toBe("lipiec - wrzesień (III kwartał)");
      expect(formatPeriodForHeader([10, 11, 12])).toBe("październik - grudzień (IV kwartał)");
      expect(formatPeriodForHeader([1, 2, 3, 4, 5, 6])).toBe("styczeń - czerwiec (I półrocze)");
      expect(formatPeriodForHeader([7, 8, 9, 10, 11, 12])).toBe("lipiec - grudzień (II półrocze)");
      expect(formatPeriodForHeader([2, 3, 4])).toBe("luty - kwiecień");
    });

    it("formats station and header title for Excel annexes accurately", () => {
      expect(formatStationForHeader("Myślibórz")).toBe("PSSE w Myśliborzu");
      expect(formatStationForHeader("Choszczno")).toBe("PSSE w Choszcznie");
      expect(formatStationForHeader("PSSE w Gryfinie")).toBe("PSSE w Gryfinie");
      expect(formatStationForHeader("")).toBe("PSSE w Myśliborzu");
      expect(formatStationForHeader("w Szczecinie")).toBe("PSSE w Szczecinie");

      const headerZal1 = buildDefaultHeaderTitle(1, "Myślibórz", [1, 2, 3, 4, 5, 6], 2026);
      expect(headerZal1).toBe("Załącznik nr 1 OZiPZ PSSE w Myśliborzu mierniki za styczeń - czerwiec (I półrocze) 2026 r.");

      const headerZal2 = buildDefaultHeaderTitle(2, "Myślibórz", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2026);
      expect(headerZal2).toBe("Załącznik nr 2 OZiPZ PSSE w Myśliborzu mierniki za styczeń - grudzień 2026 r.");
    });
  });

  describe("getNormalizedActionType", () => {
    it("maps diverse raw action types into canonical OZiPZ categories", () => {
      expect(getNormalizedActionType({ actionType: "publikacja_x" })).toBe("Publikacja media (Portal X)");
      expect(getNormalizedActionType({ title: "Nowy post na Twitterze" })).toBe("Publikacja media (Portal X)");
      expect(getNormalizedActionType({ actionType: "publikacja_fb" })).toBe("Publikacja media (Facebook)");
      expect(getNormalizedActionType({ actionType: "publikacja_strona" })).toBe("Publikacja media (Strona)");
      expect(getNormalizedActionType({ title: "Artykuł na stronie gov.pl" })).toBe("Publikacja media (Strona)");
      expect(getNormalizedActionType({ actionType: "prelekcja" })).toBe("Prelekcja (warsztat)");
      expect(getNormalizedActionType({ actionType: "warsztat" })).toBe("Prelekcja (warsztat)");
      expect(getNormalizedActionType({ actionType: "wykład" })).toBe("Wykład");
      expect(getNormalizedActionType({ actionType: "pismo" })).toBe("Pismo (list intencyjny)");
      expect(getNormalizedActionType({ actionType: "konkurs" })).toBe("Konkurs (quiz)");
      expect(getNormalizedActionType({ actionType: "dystrybucja" })).toBe("Dystrybucja");
      expect(getNormalizedActionType({ actionType: "stoisko" })).toBe("Stoisko edukacyjno-informacyjne");
      expect(getNormalizedActionType({ actionType: "sprawozdanie" })).toBe("Sprawozdanie (z programu, miernik, tytoń)");
      expect(getNormalizedActionType({ actionType: "wizytacja" })).toBe("Wizytacja");
      expect(getNormalizedActionType({ actionType: "narada" })).toBe("Narada");
      expect(getNormalizedActionType({ actionType: "szkolenie" })).toBe("Szkolenie");
      expect(getNormalizedActionType({ actionType: "happening" })).toBe("Happening (przemarsz, gra, event)");
      expect(getNormalizedActionType({ actionType: "rozmowa indywidualna" })).toBe("Rozmowa indywidualna (instruktaż)");
      expect(getNormalizedActionType({ actionType: "wywiad" })).toBe("Wywiad do mediów");
      expect(getNormalizedActionType({ actionType: "Krótka forma własna" })).toBe("Krótka forma własna");
      expect(getNormalizedActionType({ actionType: "https://bardzo-dlugi-link-z-opisem-akcji-ktory-przekracza-piecdziesiat-znakow-w-kodzie" })).toBe("Prelekcja (warsztat)");
    });
  });

  describe("resolveInterventionName", () => {
    it("resolves exact program name or JRWA title or keyword matches", () => {
      expect(resolveInterventionName({ programName: "Trzymaj Formę!" }, true)).toBe("Trzymaj Formę!");
      expect(resolveInterventionName({ jrwaCaseId: "966.1" }, true)).toBe("Trzymaj Formę");
      expect(resolveInterventionName({ topic: "Higiena osobista" }, true)).toBe("Higiena osobista");

      expect(resolveInterventionName({ title: "Podstępne WZW typu A i B" }, false)).toContain("Profilaktyka chorób zakaźnych");
      expect(resolveInterventionName({ title: "Zatrucia grzybami kapeluszowymi" }, false)).toContain("bezpiecznego grzybobrania");
      expect(resolveInterventionName({ title: "Kleszczowe zapalenie mózgu i borelioza" }, false)).toBe("Choroby odkleszczowe i borelioza");
      expect(resolveInterventionName({ title: "Rzuć palenie, wybierz zdrowie" }, false)).toBe("Profilaktyka tytoniowa");
      expect(resolveInterventionName({ title: "Bezpieczne ferie zimowe" }, false)).toContain("wypoczynku letniego i zimowego");
      expect(resolveInterventionName({ title: "Europejski tydzień szczepień ochronnych" }, false)).toContain("szczepień ochronnych");
      expect(resolveInterventionName({ title: "Zdrowe odżywianie i cukier" }, false)).toContain("aktywności fizycznej i prawidłowego odżywiania");
      expect(resolveInterventionName({ title: "Czerniak i znamię znam je" }, false)).toContain("Profilaktyka chorób nowotworowych");
      expect(resolveInterventionName({}, true)).toBe("Program profilaktyczny");
      expect(resolveInterventionName({}, false)).toBe("Promocja zdrowego stylu życia i edukacja zdrowotna");
    });
  });

  describe("buildReportAnnexRows & buildReportHierarchy", () => {
    it("builds annex rows with program and non-program grouping", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "act-1",
          title: "Prelekcja o higienie",
          jrwaSign: "966.4.1.2026",
          numberOfActions: 2,
          participantsCount: 50,
          status: "wykonane",
        },
        {
          id: "act-2",
          title: "Stoisko profilaktyczne",
          jrwaSign: "966.14.1.2026",
          numberOfActions: 1,
          participantsCount: 120,
          status: "wykonane",
        },
        {
          id: "act-3",
          title: "Wizytacja",
          jrwaSign: "966.1.1.2026",
          numberOfActions: 1,
          participantsCount: 0,
          status: "wykonane",
        },
      ];

      const rows = buildReportAnnexRows(sampleActions as OzipzAction[]);
      expect(rows.length).toBe(3);

      const progRow = rows.find((r) => r.jrwa === "966.4");
      expect(progRow).toBeDefined();
      expect(progRow?.kind).toBe("programowe");
      expect(progRow?.actions).toBe(2);
      expect(progRow?.people).toBe(50);

      const nonProgRow = rows.find((r) => r.jrwa === "966.14");
      expect(nonProgRow).toBeDefined();
      expect(nonProgRow?.kind).toBe("nieprogramowe");
      expect(nonProgRow?.people).toBe(120);

      const visitRow = rows.find((r) => r.jrwa === "966.1");
      expect(visitRow).toBeDefined();
      expect(visitRow?.visits).toBe(1);
      expect(visitRow?.actions).toBe(0);
    });

    it("builds hierarchy sections correctly", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "act-1",
          title: "Warsztat",
          jrwaSign: "966.1",
          numberOfActions: 1,
          participantsCount: 20,
          status: "wykonane",
        },
        {
          id: "act-2",
          title: "Konkurs",
          jrwaSign: "966.7",
          numberOfActions: 1,
          participantsCount: 15,
          status: "wykonane",
        },
      ];

      const rows = buildReportAnnexRows(sampleActions as OzipzAction[]);
      const hierarchy = buildReportHierarchy(rows);

      expect(hierarchy.length).toBe(2);
      const progSec = hierarchy.find((s) => s.kind === "programowe");
      expect(progSec).toBeDefined();
      expect(progSec?.totalActions).toBe(1);
      expect(progSec?.totalPeople).toBe(20);

      const nonProgSec = hierarchy.find((s) => s.kind === "nieprogramowe");
      expect(nonProgSec).toBeDefined();
      expect(nonProgSec?.totalActions).toBe(1);
      expect(nonProgSec?.totalPeople).toBe(15);
    });

    it("unifies actions from the same program into exactly ONE group without splitting or leaking UUIDs", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "act-stoisko",
          title: "Stoisko edukacyjno-informacyjne OZiPZ",
          actionType: "Stoisko edukacyjno-informacyjne",
          programId: "bezpieczne-wakacje",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
          jrwaSign: "OZiPZ.966.14.40.2026",
          jrwaCaseId: "jrwa-1788342527615-1-b3vw",
          numberOfActions: 1,
          participantsCount: 80,
          status: "wykonane",
        },
        {
          id: "act-fb",
          title: "Post Facebook Bezpieczne Wakacje",
          actionType: "Publikacja media (Facebook)",
          programId: "bezpieczne-wakacje",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
          numberOfActions: 1,
          participantsCount: 0,
          status: "wykonane",
        },
        {
          id: "act-x",
          title: "Wpis na X Bezpieczne Wakacje",
          actionType: "Publikacja media (Portal X)",
          programId: "bezpieczne-wakacje",
          programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
          numberOfActions: 1,
          participantsCount: 0,
          status: "wykonane",
        },
      ];

      const rows = buildReportAnnexRows(sampleActions as OzipzAction[]);
      // Każda unikalna forma działania tworzy jeden wiersz
      expect(rows.length).toBe(3);
      // Żaden wiersz nie może mieć technicznego UUID w polu jrwa
      for (const r of rows) {
        expect(r.jrwa).not.toContain("jrwa-");
        expect(r.jrwa).toBe("966.14");
      }

      const hierarchy = buildReportHierarchy(rows);
      // Wszystkie działania Bezpiecznych Wakacji są nieprogramowe (966.14)
      expect(hierarchy.length).toBe(1);
      const nonProgSec = hierarchy[0];
      expect(nonProgSec.kind).toBe("nieprogramowe");

      // Dokładnie JEDNA grupa programu (zero rozbicia na dwa bloki!)
      expect(nonProgSec.groups.length).toBe(1);
      const group = nonProgSec.groups[0];
      expect(group.programName).toBe(
        "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)"
      );
      expect(group.jrwa).toBe("966.14");
      expect(group.totalActions).toBe(3);
      expect(group.totalPeople).toBe(80);

      // Wszystkie 3 formy działań pod jedną grupą programu
      expect(group.actions.map((a) => a.actionName).sort()).toEqual([
        "Publikacja media (Facebook)",
        "Publikacja media (Portal X)",
        "Stoisko edukacyjno-informacyjne",
      ]);
    });

    it("aggregates actions into edu-report programs data structure", () => {
      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "act-1",
          title: "Prelekcja w szkole",
          actionType: "Prelekcja",
          programName: "Bieg po zdrowie",
          programId: "prog-1",
          date: "2026-04-10",
          numberOfActions: 2,
          participantsCount: 45,
          status: "wykonane",
        },
        {
          id: "act-2",
          title: "Publikacja na portalu",
          actionType: "Publikacja media (Strona)",
          topic: "Bezpieczne Wakacje",
          date: "2026-04-15",
          numberOfActions: 1,
          participantsCount: 0,
          status: "wykonane",
        },
      ];

      const res = aggregateActionsToProgramsData(sampleActions as OzipzAction[], [4]);
      expect(res.allActions).toBe(3);
      expect(res.allPeople).toBe(45);
      expect(res.aggregated.PROGRAMOWE["Bieg po zdrowie"]).toBeDefined();
      expect(res.aggregated.NIEPROGRAMOWE["Bezpieczne Wakacje"]).toBeDefined();
    });

    it("excludes cancelled or postponed actions from aggregation", () => {
      const actions: Partial<OzipzAction>[] = [
        { id: "1", title: "Akcja 1", status: "odwolane", numberOfActions: 1, participantsCount: 10 },
        { id: "2", title: "Akcja 2", status: "cancelled", numberOfActions: 1, participantsCount: 10 },
        { id: "3", title: "Akcja 3", status: "wykonane", numberOfActions: 1, participantsCount: 20 },
      ];
      const res = aggregateActionsToProgramsData(actions as OzipzAction[]);
      expect(res.allActions).toBe(1);
      expect(res.allPeople).toBe(20);
    });
  });

  describe("Excel export functions", () => {
    it("exports data to Excel successfully with downloadBlob", async () => {
      const downloadBlobSpy = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});

      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "1",
          title: "Prelekcja",
          programName: "Trzymaj Formę!",
          programId: "prog-1",
          date: "2026-05-10",
          numberOfActions: 1,
          participantsCount: 30,
          status: "wykonane",
        },
      ];

      const success = await exportToExcel(sampleActions as OzipzAction[], "test_miernik");
      expect(success).toBe(true);
      expect(downloadBlobSpy).toHaveBeenCalledWith(expect.any(Blob), "test_miernik.xlsx");

      downloadBlobSpy.mockRestore();
    });

    it("handles fallback template creation for Załącznik 1 & 2", async () => {
      const downloadBlobSpy = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});

      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "1",
          title: "Prelekcja",
          programName: "Trzymaj Formę!",
          programId: "prog-1",
          date: "2026-05-10",
          numberOfActions: 1,
          participantsCount: 30,
          status: "wykonane",
        },
      ];

      const res1 = await exportToTemplate(sampleActions as OzipzAction[], "zalnr1_test", "Jan Testowy");
      expect(res1).toBe(true);

      const res2 = await exportToCumulativeTemplate(sampleActions as OzipzAction[], "zalnr2_test", "Jan Testowy");
      expect(res2).toBe(true);

      downloadBlobSpy.mockRestore();
    });

    it("generates full multi-sheet report workbook with all 3 sheets", async () => {
      const downloadBlobSpy = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});

      const sampleActions: Partial<OzipzAction>[] = [
        {
          id: "1",
          date: "2026-05-10",
          numberOfActions: 2,
          participantsCount: 50,
          materialsDistributedCount: 10,
          status: "wykonane",
          programName: "Trzymaj Formę!",
          programId: "prog-1",
          actionType: "Prelekcja (warsztat)",
        },
        {
          id: "2",
          date: "2026-06-12",
          numberOfActions: 1,
          participantsCount: 20,
          materialsDistributedCount: 5,
          status: "wykonane",
          title: "Publikacja o kleszczach",
          actionType: "Publikacja media (Portal X)",
        },
      ];

      await downloadFullReportWorkbook(sampleActions as OzipzAction[], 2026, [5, 6], "Krzysztof Palpuchowski");
      expect(downloadBlobSpy).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/^Sprawozdanie_Pelne_OZIPZ_2026_.*\.xlsx$/)
      );

      downloadBlobSpy.mockRestore();
    });

    it("invokes downloadAnnexReportExcel cleanly", async () => {
      const downloadBlobSpy = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});

      const rows = [
        {
          kind: "programowe" as const,
          programName: "Trzymaj Formę!",
          jrwa: "966.1",
          actionName: "Prelekcja (warsztat)",
          actions: 2,
          visits: 0,
          people: 50,
        },
      ];

      await downloadAnnexReportExcel(rows, 1, 2026, [5], "Krzysztof Palpuchowski");
      expect(downloadBlobSpy).toHaveBeenCalled();

      downloadBlobSpy.mockRestore();
    });
  });
});
