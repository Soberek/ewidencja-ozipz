import ExcelJS from "exceljs";
import { downloadBlob } from "./downloadHelper";
import { formatDatePl } from "./dateUtils";
import { buildCampaignFormReport } from "./campaignFormReport";
import { actionBreakdownPeriodLabel, type ActionBreakdown, type ActionBreakdownRow } from "./actionBreakdown";

function addTable(ws: ExcelJS.Worksheet, title: string, firstHeader: string, rows: readonly ActionBreakdownRow[]) {
  if (!rows.length) return;
  ws.addRow([]);
  ws.addRow([title]).font = { bold: true, size: 12 };
  ws.addRow([firstHeader, "Wpisy", "Działania", "Odbiorcy", "Materiały"]).font = { bold: true };
  for (const row of rows) ws.addRow([row.label, row.entries, row.actions, row.recipients, row.materials]);
}

export async function downloadActionBreakdownWorkbook(
  breakdown: ActionBreakdown,
  { label, year, months }: { label: string; year: number; months: readonly number[] }
): Promise<void> {
  const period = actionBreakdownPeriodLabel(year, months);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ewidencja OZiPZ";
  wb.created = new Date();

  const summary = wb.addWorksheet("Podsumowanie");
  summary.columns = [{ width: 60 }, { width: 10 }, { width: 11 }, { width: 11 }, { width: 11 }];
  summary.addRow([`Rozpiska: ${label}`]).font = { bold: true, size: 14 };
  summary.addRow([`Okres: ${period}`]);
  summary.addRow([]);
  const t = breakdown.totals;
  summary.addRow(["Wpisy", t.entries]);
  summary.addRow(["Działania", t.actions]);
  summary.addRow(["Odbiorcy", t.recipients]);
  summary.addRow(["Materiały (szt.)", t.materials]);
  summary.addRow(["Placówki", t.facilities]);
  summary.addRow(["Gminy", t.municipalities]);
  addTable(summary, "Miesiące", "Miesiąc", breakdown.byMonth);
  addTable(summary, "Formy działań", "Forma", breakdown.byForm);
  addTable(summary, "Gminy", "Gmina", breakdown.byMunicipality);
  addTable(
    summary,
    "Placówki",
    "Placówka",
    breakdown.byFacility.map((row) => ({ ...row, label: row.municipality ? `${row.label} (${row.municipality})` : row.label }))
  );
  if (breakdown.materials.length) {
    summary.addRow([]);
    summary.addRow(["Materiały"]).font = { bold: true, size: 12 };
    summary.addRow(["Tytuł", "Sztuki"]).font = { bold: true };
    for (const m of breakdown.materials) summary.addRow([m.title, m.quantity]);
  }

  const form = wb.addWorksheet("Formularz kampanii");
  form.columns = [{ width: 6 }, { width: 22 }, { width: 55 }, { width: 70 }];
  form.addRow(["Nr", "Sekcja", "Pozycja", "Wartość"]).font = { bold: true };
  for (const section of buildCampaignFormReport(breakdown)) {
    for (const item of section.items) {
      form.addRow([item.no, section.title, item.label, item.value]).alignment = { vertical: "top", wrapText: true };
    }
  }

  const list = wb.addWorksheet("Wykaz działań");
  list.columns = [
    { header: "Data", width: 12 },
    { header: "Forma", width: 28 },
    { header: "Tytuł", width: 36 },
    { header: "Placówka", width: 40 },
    { header: "Gmina", width: 16 },
    { header: "Odbiorcy (grupy)", width: 50 },
    { header: "Działania", width: 10 },
    { header: "Odbiorcy", width: 10 },
    { header: "Materiały", width: 10 },
    { header: "Tytuły materiałów", width: 36 },
    { header: "Prowadzący", width: 24 },
    { header: "Status", width: 12 },
    { header: "Opis", width: 60 },
  ];
  list.getRow(1).font = { bold: true };
  for (const e of breakdown.entries) {
    const row = list.addRow([
      formatDatePl(e.date, e.date),
      e.form,
      e.title,
      e.facility,
      e.municipality,
      e.audience,
      e.actions,
      e.recipients,
      e.materials,
      e.materialTitles.join("; "),
      e.educator,
      e.status,
      e.notes,
    ]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const safeLabel = label.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "akcja";
  downloadBlob(blob, `Rozpiska_${safeLabel}_${year}_${period.replace(/[^\p{L}\p{N}]+/gu, "_")}.xlsx`);
}
