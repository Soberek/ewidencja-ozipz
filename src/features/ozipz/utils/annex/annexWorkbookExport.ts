import ExcelJS from "exceljs";
import type { OzipzAction } from "../../types/ozipz.types";
import { downloadBlob } from "../downloadHelper";
import { getTodayIsoDate } from "../dateUtils";
import { isProgramAction } from "../calculators/jrwaClassification";
import type { AggregatedMiernikData } from "./annexTypes";
import { aggregateActionsToProgramsData } from "./annexAggregation";
import { POLISH_MONTHS, formatPeriodForHeader } from "./annexConstants";

const LINE_HEIGHT_PT = 15;

/**
 * Eksport w standardowym formacie Excel (arkusz Miernik)
 */
export async function exportToExcel(
  data: AggregatedMiernikData | readonly OzipzAction[],
  customFileName?: string
): Promise<boolean> {
  try {
    const aggregatedData: AggregatedMiernikData = Array.isArray(data)
      ? aggregateActionsToProgramsData(data)
      : (data as AggregatedMiernikData);

    if (!aggregatedData.aggregated || Object.keys(aggregatedData.aggregated).length === 0) {
      console.warn("Brak danych do eksportu.");
      return false;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Miernik");
    const COLUMN_WIDTHS = [15, 45, 12, 12];
    worksheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

    const addAutoHeightRow = (values: (string | number | null)[], isProgram = false) => {
      const row = worksheet.addRow(values);
      let maxLines = 1;
      values.forEach((val, i) => {
        if (typeof val === "string" && val.length > 0) {
          const colWidth = COLUMN_WIDTHS[i] ?? 10;
          const lines = Math.ceil(val.length / colWidth);
          maxLines = Math.max(maxLines, lines);
          row.getCell(i + 1).alignment = { wrapText: true, vertical: "middle" };
        }
      });
      row.height = maxLines * LINE_HEIGHT_PT;
      if (isProgram) row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFF0000" } };
    };

    Object.entries(aggregatedData.aggregated).forEach(([programType, programData]) => {
      const headerRow = worksheet.addRow([programType.toUpperCase(), null, null, null]);
      headerRow.font = { bold: true, size: 12 };

      Object.entries(programData).forEach(([programName, actions]) => {
        addAutoHeightRow([`1.`, programName, null, null], true);
        Object.entries(actions).forEach(([actionName, actionData], actionIdx) => {
          addAutoHeightRow([`1.${actionIdx + 1}`, actionName, actionData.actionNumber, actionData.people]);
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileName = `${customFileName || `miernik_budzetowy_${getTodayIsoDate()}`}.xlsx`;
    downloadBlob(blob, fileName);

    return true;
  } catch (error) {
    console.error("Błąd eksportu do Excel:", error);
    return false;
  }
}

/**
 * Generuje pełny wieloarkuszowy skoroszyt sprawozdawczy Excel
 */
export async function downloadFullReportWorkbook(
  actions: readonly OzipzAction[],
  year: number,
  months: readonly number[],
  preparedBy: string = "Krzysztof Palpuchowski"
): Promise<void> {
  const monthText = formatPeriodForHeader(months);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ewidencja OZiPZ";
  wb.created = new Date();

  // 1. Arkusz: Podsumowanie Miesięczne
  const ws1 = wb.addWorksheet("Mierniki Miesięczne");
  ws1.addRow([`Mierniki syntetyczne OZiPZ — Rok ${year} (${monthText})`]);
  ws1.addRow([`Sporządził: ${preparedBy}`]);
  ws1.addRow([]);
  ws1.addRow(["Miesiąc", "Zadania", "Działania", "Odbiorcy", "Materiały", "Wykonane"]);

  for (let m = 1; m <= 12; m++) {
    if (!months.includes(m)) continue;
    const mPad = String(m).padStart(2, "0");
    const mActions = actions.filter((a) => (a.date || "").startsWith(`${year}-${mPad}`));
    const tasks = mActions.length;
    const acts = mActions.reduce((s, a) => s + (Number(a.numberOfActions) || 1), 0);
    const recs = mActions.reduce((s, a) => s + (Number(a.participantsCount) || 0), 0);
    const mats = mActions.reduce((s, a) => s + (Number(a.materialsDistributedCount) || 0), 0);
    const done = mActions.filter((a) => a.status === "wykonane").length;
    ws1.addRow([POLISH_MONTHS[m - 1], tasks, acts, recs, mats, done]);
  }

  // 2. Arkusz: Statystyki Programowe
  const ws2 = wb.addWorksheet("Statystyki Programowe");
  ws2.addRow([`Podział na działania Programowe i Pozaprogramowe — Rok ${year}`]);
  ws2.addRow([]);
  ws2.addRow(["Miesiąc", "Programowe (dz.)", "Pozaprogramowe (dz.)", "Razem działania", "Odbiorcy P", "Odbiorcy N", "Razem odbiorcy"]);

  for (let m = 1; m <= 12; m++) {
    if (!months.includes(m)) continue;
    const mPad = String(m).padStart(2, "0");
    const mActions = actions.filter((a) => (a.date || "").startsWith(`${year}-${mPad}`));
    let pAct = 0, nAct = 0, pRec = 0, nRec = 0;
    mActions.forEach((a) => {
      const isProg = isProgramAction(a);
      const acts = Number(a.numberOfActions) || 1;
      const rec = Number(a.participantsCount) || 0;
      if (isProg) { pAct += acts; pRec += rec; } else { nAct += acts; nRec += rec; }
    });
    ws2.addRow([POLISH_MONTHS[m - 1], pAct, nAct, pAct + nAct, pRec, nRec, pRec + nRec]);
  }

  // 3. Arkusz: Wykaz Programów i Działań
  const ws3 = wb.addWorksheet("Wykaz Programów i Działań");
  ws3.addRow([`Hierarchia programów i działań OZiPZ — Rok ${year}`]);
  ws3.addRow([]);
  const headerRow = ws3.addRow(["Lp.", "Program / Forma Działania", "Działania", "Odbiorcy"]);
  headerRow.font = { bold: true };

  const aggregatedData = aggregateActionsToProgramsData(actions, months);
  let pCount = 0;

  Object.entries(aggregatedData.aggregated).forEach(([type, programs]) => {
    const secRow = ws3.addRow(["", type.toUpperCase(), "", ""]);
    secRow.font = { bold: true };

    Object.entries(programs).forEach(([pName, acts]) => {
      pCount++;
      const pRow = ws3.addRow([`${pCount}.`, pName, "", ""]);
      pRow.font = { bold: true, color: { argb: "FFFF0000" } };

      Object.entries(acts).forEach(([actName, stat], actIdx) => {
        ws3.addRow([`${pCount}.${actIdx + 1}`, `  ↳ ${actName}`, stat.actionNumber, stat.people]);
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `Sprawozdanie_Pelne_OZIPZ_${year}_${monthText.replace(/[\s/\\:]+/g, "_")}.xlsx`);
}
