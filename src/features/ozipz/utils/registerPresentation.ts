import ExcelJS from "exceljs";
import { csvCell } from "@/lib/csv";
import type { OfficialRegisterKey, OzipzAction, OzipzFacility } from "../types/ozipz.types";
import { OFFICIAL_REGISTERS_CONFIG, INFORMACJE_OFFICIAL_FOOTER } from "./registerConfig";
import { downloadBlob } from "./downloadHelper";
import { getTodayIsoDate } from "./dateUtils";

export function formatActionIzrzNumber(action: OzipzAction): string {
  if (action.izrzSign && action.izrzSign.trim()) return action.izrzSign.trim();
  return "—";
}

export function formatActionInterventionType(action: OzipzAction): "programowa" | "nieprogramowa" {
  if (action.programId || (action.programName && action.programName.trim())) {
    return "programowa";
  }
  return "nieprogramowa";
}

export function formatActionPrzedmiot(action: OzipzAction): string {
  const parts: string[] = [];
  if (action.title && action.title.trim()) parts.push(action.title.trim());
  if (action.topic && action.topic.trim() && action.topic !== action.title) parts.push(action.topic.trim());
  if (action.actionType && action.actionType.trim() && !parts.includes(action.actionType.trim())) {
    parts.push(`[${action.actionType.trim()}]`);
  }
  return parts.join(" - ") || "—";
}

export function formatActionLocationDetails(
  action: OzipzAction,
  facility?: OzipzFacility | null
): string {
  if (facility) {
    const parts: string[] = [facility.name];
    if (facility.address) parts.push(facility.address);
    if (facility.postalCode || facility.city) {
      parts.push([facility.postalCode, facility.city].filter(Boolean).join(" "));
    }
    if (facility.municipality && facility.municipality !== facility.city) {
      parts.push(`gm. ${facility.municipality}`);
    }
    return parts.filter(Boolean).join(", ");
  }

  const parts: string[] = [];
  if (action.facilityName) parts.push(action.facilityName);
  if (action.municipality) parts.push(`gm. ${action.municipality}`);
  return parts.filter(Boolean).join(", ") || "—";
}

export function formatActionRecipientCount(action: OzipzAction): number {
  return Number(action.participantsCount) || 0;
}

export function exportRegisterToCsv(
  registerKey: OfficialRegisterKey,
  actions: OzipzAction[],
  facilitiesMap: Map<string, OzipzFacility>
): void {
  const meta = OFFICIAL_REGISTERS_CONFIG[registerKey];
  let headers: string[] = [];
  let rows: string[][] = [];

  if (registerKey === "informacje") {
    headers = [
      "Lp.",
      "Nr informacji",
      "Data realizacji zadania",
      "Przedmiot sprawy",
      "Rodzaj interwencji",
      "Liczba odbiorców",
      "Osoba odpowiedzialna",
      "Uwagi",
    ];
    rows = actions.map((a, idx) => [
      String(idx + 1),
      formatActionIzrzNumber(a),
      a.date || "",
      formatActionPrzedmiot(a),
      formatActionInterventionType(a),
      String(formatActionRecipientCount(a)),
      a.leadEducator || "",
      a.notes || "",
    ]);
  } else if (registerKey === "publikacje") {
    headers = [
      "Lp.",
      "Data publikacji informacji",
      "Tematyka informacji",
      "Osoba odpowiedzialna",
      "Uwagi",
    ];
    rows = actions.map((a, idx) => [
      String(idx + 1),
      a.date || "",
      formatActionPrzedmiot(a),
      a.leadEducator || "",
      a.notes || "",
    ]);
  } else {
    headers = [
      "Nr protokołu",
      "Data protokołu",
      "Przedmiot wizytacji",
      "Dane wizytowanej placówki",
      "Osoba odpowiedzialna",
      "Uwagi",
    ];
    rows = actions.map((a) => {
      const fac = a.facilityId ? facilitiesMap.get(a.facilityId) : null;
      return [
        formatActionIzrzNumber(a),
        a.date || "",
        formatActionPrzedmiot(a),
        formatActionLocationDetails(a, fac),
        a.leadEducator || "",
        a.notes || "",
      ];
    });
  }

  const csvContent =
    "\uFEFF" +
    [
      `# ${meta.title}`,
      ...(registerKey === "informacje" ? [`# ${INFORMACJE_OFFICIAL_FOOTER}`] : []),
      headers.map(csvCell).join(";"),
      ...rows.map((r) => r.map(csvCell).join(";")),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `rejestr_${registerKey}_${getTodayIsoDate()}.csv`);
}

export async function exportRegisterToExcel(
  registerKey: OfficialRegisterKey,
  actions: OzipzAction[],
  facilitiesMap: Map<string, OzipzFacility>
): Promise<void> {
  const meta = OFFICIAL_REGISTERS_CONFIG[registerKey];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(meta.label);

  // Tytuł rejestru
  worksheet.addRow([meta.title]);
  worksheet.getRow(1).font = { bold: true, size: 14 };

  if (registerKey === "informacje") {
    worksheet.addRow([INFORMACJE_OFFICIAL_FOOTER]);
    worksheet.getRow(2).font = { italic: true, size: 9, color: { argb: "FF555555" } };
    worksheet.addRow([]); // pusta linia
  } else {
    worksheet.addRow([]);
  }

  if (registerKey === "informacje") {
    const headerRow = worksheet.addRow([
      "Lp.",
      "Nr informacji",
      "Data realizacji zadania",
      "Przedmiot sprawy",
      "Rodzaj interwencji",
      "Liczba odbiorców",
      "Osoba odpowiedzialna",
      "Uwagi",
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0F2FE" },
    };

    actions.forEach((a, idx) => {
      worksheet.addRow([
        idx + 1,
        formatActionIzrzNumber(a),
        a.date || "",
        formatActionPrzedmiot(a),
        formatActionInterventionType(a),
        formatActionRecipientCount(a),
        a.leadEducator || "",
        a.notes || "",
      ]);
    });
  } else if (registerKey === "publikacje") {
    const headerRow = worksheet.addRow([
      "Lp.",
      "Data publikacji informacji",
      "Tematyka informacji",
      "Osoba odpowiedzialna",
      "Uwagi",
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0F2FE" },
    };

    actions.forEach((a, idx) => {
      worksheet.addRow([
        idx + 1,
        a.date || "",
        formatActionPrzedmiot(a),
        a.leadEducator || "",
        a.notes || "",
      ]);
    });
  } else {
    const headerRow = worksheet.addRow([
      "Nr protokołu",
      "Data protokołu",
      "Przedmiot wizytacji",
      "Dane wizytowanej placówki",
      "Osoba odpowiedzialna",
      "Uwagi",
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0F2FE" },
    };

    actions.forEach((a) => {
      const fac = a.facilityId ? facilitiesMap.get(a.facilityId) : null;
      worksheet.addRow([
        formatActionIzrzNumber(a),
        a.date || "",
        formatActionPrzedmiot(a),
        formatActionLocationDetails(a, fac),
        a.leadEducator || "",
        a.notes || "",
      ]);
    });
  }

  // Automatyczna szerokość kolumn
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLength) maxLength = Math.min(len + 3, 50);
    });
    column.width = maxLength;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `rejestr_${registerKey}_${getTodayIsoDate()}.xlsx`);
}
