import { describe, it, expect, vi } from "vitest";
import {
  buildHealthPromotionReportCsv,
  downloadHealthPromotionReportCsv,
  downloadHealthPromotionReportWorkbook,
} from "./reportExport";
import * as downloadHelper from "./downloadHelper";
import * as reportAnnex from "./reportAnnex";
import type { OzipzAction } from "../types/ozipz.types";

describe("reportExport", () => {
  const sampleActions: Partial<OzipzAction>[] = [
    {
      id: "1",
      date: "2026-05-10",
      title: "Prelekcja o higienie",
      jrwaSign: "OZiPZ.966.4.1.2026",
      actionType: "Prelekcja (warsztat)",
      status: "wykonane",
      numberOfActions: 2,
      participantsCount: 50,
      materialsDistributedCount: 50,
    },
    {
      id: "2",
      date: "2026-05-15",
      title: "Publikacja \"Zdrowe Odżywianie\"",
      jrwaSign: "OZiPZ.966.1.2.2026",
      actionType: "Publikacja media (Portal X)",
      status: "wykonane",
      numberOfActions: 1,
      participantsCount: 0,
      materialsDistributedCount: 0,
    },
  ];

  describe("buildHealthPromotionReportCsv", () => {
    it("neutralizes formulas in exported user text", () => {
      const csv = buildHealthPromotionReportCsv([
        { date: "2026-09-26", title: "\t=1+1", jrwaSign: "@SUM(1)" } as OzipzAction,
      ]);
      expect(csv).toContain('"\'\t=1+1";"\'@SUM(1)"');
      expect(csv).toContain('"2026-09-26"');
    });

    it("generates correct UTF-8 BOM CSV with semicolons and escaped quotes", () => {
      const csv = buildHealthPromotionReportCsv(sampleActions as OzipzAction[]);
      expect(csv.startsWith("\uFEFF")).toBe(true);

      const lines = csv.replace("\uFEFF", "").split("\r\n");
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('"Data";"Zadanie";"JRWA";"Forma";"Status";"Działania";"Odbiorcy";"Materiały"');
      expect(lines[1]).toContain('"2026-05-10";"Prelekcja o higienie";"OZiPZ.966.4.1.2026";"Prelekcja (warsztat)";"wykonane";"2";"50";"50"');
      expect(lines[2]).toContain('"2026-05-15";"Publikacja ""Zdrowe Odżywianie""";"OZiPZ.966.1.2.2026";"Publikacja media (Portal X)";"wykonane";"1";"0";"0"');
    });

    it("handles actions with missing optional values cleanly", () => {
      const bareAction: Partial<OzipzAction>[] = [
        {
          id: "3",
          date: "2026-06-01",
          title: "Zadanie",
        },
      ];
      const csv = buildHealthPromotionReportCsv(bareAction as OzipzAction[]);
      expect(csv).toContain('"2026-06-01";"Zadanie";"";"";"wykonane";"1";"0";"0"');
    });
  });

  describe("downloadHealthPromotionReportCsv", () => {
    it("calls downloadBlob with correct filename for full year or month range", () => {
      const downloadBlobSpy = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});

      downloadHealthPromotionReportCsv(sampleActions as OzipzAction[], 2026, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(downloadBlobSpy).toHaveBeenCalledWith(
        expect.any(Blob),
        "sprawozdanie-promocja-zdrowia-2026.csv"
      );

      downloadHealthPromotionReportCsv(sampleActions as OzipzAction[], 2026, [5, 6]);
      expect(downloadBlobSpy).toHaveBeenCalledWith(
        expect.any(Blob),
        "sprawozdanie-promocja-zdrowia-2026-5-6.csv"
      );

      downloadBlobSpy.mockRestore();
    });
  });

  describe("downloadHealthPromotionReportWorkbook", () => {
    it("delegates to downloadFullReportWorkbook", async () => {
      const downloadFullReportWorkbookSpy = vi
        .spyOn(reportAnnex, "downloadFullReportWorkbook")
        .mockResolvedValue(undefined);

      await downloadHealthPromotionReportWorkbook(
        sampleActions as OzipzAction[],
        2026,
        [1, 2, 3, 4, 5, 6],
        "Jan Kowalski"
      );

      expect(downloadFullReportWorkbookSpy).toHaveBeenCalledWith(
        sampleActions,
        2026,
        [1, 2, 3, 4, 5, 6],
        "Jan Kowalski"
      );

      downloadFullReportWorkbookSpy.mockRestore();
    });
  });
});
