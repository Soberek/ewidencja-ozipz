import ExcelJS from "exceljs";
import type { OzipzAction } from "../../types/ozipz.types";
import { downloadBlob } from "../downloadHelper";
import { getTodayIsoDate } from "../dateUtils";
import type {
  AggregatedMiernikData,
  ProgramsData,
  ReportAnnexRow,
} from "./annexTypes";
import { aggregateActionsToProgramsData } from "./annexAggregation";
import { formatPeriodForHeader, buildDefaultHeaderTitle } from "./annexConstants";

const CELL_STYLES = {
  programName: { font: { name: "Calibri", size: 11, bold: true, color: { argb: "FFFF0000" } } },
  actionName: { font: { name: "Calibri", size: 11, bold: false, color: { argb: "FF000000" } } },
} as const;

const isProgramNumber = (value: unknown): boolean => /^\d+\.$/.test(String(value || "").trim());

const styleProgramNameCell = (cell: ExcelJS.Cell, numberCell: ExcelJS.Cell): void => {
  const style = isProgramNumber(numberCell.value) ? CELL_STYLES.programName : CELL_STYLES.actionName;
  cell.style = { ...cell.style, ...style };
};

const LINE_HEIGHT_PT = 15;

const applyNameCellAutoHeight = (cell: ExcelJS.Cell, colWidth: number): void => {
  const text = typeof cell.value === "string" ? cell.value : "";
  if (text.length === 0) return;
  const lines = Math.ceil(text.length / colWidth);
  cell.alignment = { ...cell.alignment, wrapText: true, vertical: "middle" };
  if (lines > 1) {
    const row = cell.worksheet.getRow(cell.row as unknown as number);
    const currentLines = row.height ? Math.round(row.height / LINE_HEIGHT_PT) : 1;
    row.height = Math.max(currentLines, lines) * LINE_HEIGHT_PT;
  }
};

const COLUMN_CONFIG = {
  programowe: { number: "A", name: "B", copy: "G", action: "C", wizytacja: "D", people: "H" },
  nieprogramowe: { number: "I", name: "J", copy: "N", action: "K", wizytacja: "D", people: "O" },
} as const;

const fillSection = (
  worksheet: ExcelJS.Worksheet,
  data: ProgramsData,
  columns: (typeof COLUMN_CONFIG)[keyof typeof COLUMN_CONFIG]
): number => {
  let currentRow = 7;
  let programCounter = 0;

  Object.entries(data).forEach(([, programData]) => {
    Object.entries(programData).forEach(([programName, actions]) => {
      programCounter++;

      const numberCell = worksheet.getCell(`${columns.number}${currentRow}`);
      numberCell.value = `${programCounter}.`;
      styleProgramNameCell(numberCell, numberCell);

      const copyCell = worksheet.getCell(`${columns.copy}${currentRow}`);
      copyCell.value = `${programCounter}.`;

      const nameCell = worksheet.getCell(`${columns.name}${currentRow}`);
      nameCell.value = programName;
      styleProgramNameCell(nameCell, numberCell);
      applyNameCellAutoHeight(nameCell, (worksheet.getColumn(nameCell.col as unknown as number).width ?? 40) as number);

      currentRow++;

      Object.entries(actions).forEach(([actionName, actionData], actionIdx) => {
        const actionIndex = `${programCounter}.${actionIdx + 1}`;

        worksheet.getCell(`${columns.number}${currentRow}`).value = actionIndex;
        worksheet.getCell(`${columns.copy}${currentRow}`).value = actionIndex;

        const actionNameCell = worksheet.getCell(`${columns.name}${currentRow}`);
        actionNameCell.value = actionName;
        applyNameCellAutoHeight(actionNameCell, (worksheet.getColumn(actionNameCell.col as unknown as number).width ?? 40) as number);

        const isVisit = actionName.toLowerCase() === "wizytacja";
        const countCell = isVisit ? columns.wizytacja : columns.action;
        worksheet.getCell(`${countCell}${currentRow}`).value = actionData.actionNumber;
        worksheet.getCell(`${columns.people}${currentRow}`).value = actionData.people;

        currentRow++;
      });
    });
  });

  return currentRow;
};

function createFallbackAnnexWorkbook(
  data: AggregatedMiernikData,
  annexNumber: 1 | 2,
  headerTitle: string,
  preparedBy: string
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Załącznik ${annexNumber}`);

  ws.addRow([headerTitle]);
  ws.addRow([`Sporządził/a: ${preparedBy}`]);
  ws.addRow([]);
  ws.addRow(["Lp.", "Rodzaj", "Program / Tematyka", "Działanie", "Liczba działań", "Odbiorcy"]);

  let idx = 0;
  Object.entries(data.aggregated).forEach(([type, programs]) => {
    Object.entries(programs).forEach(([pName, actions]) => {
      Object.entries(actions).forEach(([actName, stats]) => {
        idx++;
        ws.addRow([idx, type, pName, actName, stats.actionNumber, stats.people]);
      });
    });
  });

  return wb;
}

/** Wiersze danych w szablonach: od 7. do wiersza nad „RAZEM” (wzory sum obejmują tylko ten zakres). */
const TEMPLATE_LAST_DATA_ROW: Record<string, number> = {
  "/generate-templates/zalnr1.xlsx": 121,
  "/generate-templates/zalnr2.xlsx": 149,
};

const sectionRowCount = (programs: Record<string, Record<string, unknown>> = {}) =>
  Object.values(programs).reduce((rows, actions) => rows + 1 + Object.keys(actions).length, 0);

/**
 * Sekcja dłuższa niż miejsce w szablonie nadpisałaby wiersz „RAZEM” i wzory sum – wtedy eksport się zatrzymuje.
 */
export function assertAnnexFitsTemplate(data: AggregatedMiernikData, templatePath: string): void {
  const lastRow = TEMPLATE_LAST_DATA_ROW[templatePath];
  if (!lastRow) return;
  const capacity = lastRow - 7 + 1;
  for (const [section, label] of [["PROGRAMOWE", "programowych"], ["NIEPROGRAMOWE", "nieprogramowych"]] as const) {
    const needed = sectionRowCount(data.aggregated[section]);
    if (needed > capacity) {
      throw new Error(`Część działań ${label} zajmuje ${needed} wierszy, a szablon załącznika mieści ${capacity}. Wybierz krótszy okres albo poszerz szablon.`);
    }
  }
}

async function exportToTemplateGeneric(
  data: AggregatedMiernikData,
  templatePath: string,
  defaultFileName: string,
  customFileName?: string,
  preparedByCell?: string,
  preparedBy: string = "",
  headerTitle?: string
): Promise<boolean> {
  assertAnnexFitsTemplate(data, templatePath);
  try {
    if (!data.aggregated || Object.keys(data.aggregated).length === 0) {
      console.warn("Brak danych do eksportu miernika.");
      return false;
    }

    const annexNum = defaultFileName.includes("2") ? 2 : 1;
    const finalHeaderTitle = headerTitle?.trim() || `Załącznik nr ${annexNum} OZiPZ PSSE w Myśliborzu mierniki`;

    let workbook: ExcelJS.Workbook;
    try {
      const response = await fetch(templatePath, { cache: "no-store" });
      if (!response.ok) throw new Error(`Błąd wczytywania szablonu: ${templatePath}`);
      const arrayBuffer = await response.arrayBuffer();
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      workbook = createFallbackAnnexWorkbook(data, annexNum, finalHeaderTitle, preparedBy);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("Nie odnaleziono arkusza w szablonie");

    const programoweData: ProgramsData = { PROGRAMOWE: data.aggregated.PROGRAMOWE || {} };
    const nieprogramoweData: ProgramsData = { NIEPROGRAMOWE: data.aggregated.NIEPROGRAMOWE || {} };

    fillSection(worksheet, programoweData, COLUMN_CONFIG.programowe);
    fillSection(worksheet, nieprogramoweData, COLUMN_CONFIG.nieprogramowe);

    if (finalHeaderTitle) {
      worksheet.getCell("A1").value = finalHeaderTitle;
    }

    if (preparedByCell && preparedBy.trim()) {
      worksheet.getCell(preparedByCell).value = `Sporządził/a: ${preparedBy.trim()}`;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileName = `${customFileName || `${defaultFileName}_${getTodayIsoDate()}`}.xlsx`;
    downloadBlob(blob, fileName);

    return true;
  } catch (error) {
    console.error("Błąd podczas eksportu do szablonu Excel:", error);
    return false;
  }
}

/**
 * Eksport do szablonu Załącznika Nr 1 (zalnr1.xlsx)
 */
export async function exportToTemplate(
  data: AggregatedMiernikData | readonly OzipzAction[],
  customFileName?: string,
  preparedBy: string = "",
  headerTitle?: string
): Promise<boolean> {
  const aggregatedData: AggregatedMiernikData = Array.isArray(data)
    ? aggregateActionsToProgramsData(data)
    : (data as AggregatedMiernikData);

  return exportToTemplateGeneric(
    aggregatedData,
    "/generate-templates/zalnr1.xlsx",
    "zalnr1",
    customFileName,
    "B131",
    preparedBy,
    headerTitle
  );
}

/**
 * Eksport do szablonu Załącznika Nr 2 Narastający (zalnr2.xlsx)
 */
export async function exportToCumulativeTemplate(
  data: AggregatedMiernikData | readonly OzipzAction[],
  customFileName?: string,
  preparedBy: string = "",
  headerTitle?: string
): Promise<boolean> {
  const aggregatedData: AggregatedMiernikData = Array.isArray(data)
    ? aggregateActionsToProgramsData(data)
    : (data as AggregatedMiernikData);

  return exportToTemplateGeneric(
    aggregatedData,
    "/generate-templates/zalnr2.xlsx",
    "zalnr2_narastajacy",
    customFileName,
    "B165",
    preparedBy,
    headerTitle
  );
}

/**
 * Kompatybilność z istniejącym kodem pobierania załącznika
 */
export async function downloadAnnexReportExcel(
  rows: readonly ReportAnnexRow[],
  annexNumber: 1 | 2,
  year: number,
  months: readonly number[],
  preparedBy: string = ""
): Promise<void> {
  const monthText = formatPeriodForHeader(months);
  const templatePath = `/generate-templates/zalnr${annexNumber}.xlsx`;
  const defaultFileName = `Zalacznik_nr_${annexNumber}_OZIPZ_${year}_${monthText.replace(/[\s/\\:]+/g, "_")}`;
  const headerTitle = buildDefaultHeaderTitle(annexNumber, "Myślibórz", months, year);

  const mockAggregated: AggregatedMiernikData = {
    aggregated: { PROGRAMOWE: {}, NIEPROGRAMOWE: {} },
    allPeople: 0,
    allActions: 0,
    warnings: [],
  };

  rows.forEach((r) => {
    const type = r.kind === "programowe" ? "PROGRAMOWE" : "NIEPROGRAMOWE";
    mockAggregated.aggregated[type] ??= {};
    mockAggregated.aggregated[type][r.programName] ??= {};
    mockAggregated.aggregated[type][r.programName][r.actionName] = {
      actionNumber: r.actions || (r.visits ? r.visits : 1),
      people: r.people || 0,
    };
    mockAggregated.allActions += r.actions || r.visits || 1;
    mockAggregated.allPeople += r.people || 0;
  });

  const exported = await exportToTemplateGeneric(
    mockAggregated,
    templatePath,
    defaultFileName,
    defaultFileName,
    annexNumber === 1 ? "B131" : "B165",
    preparedBy,
    headerTitle
  );
  if (!exported) throw new Error(`Nie udało się wygenerować Załącznika nr ${annexNumber}`);
}
