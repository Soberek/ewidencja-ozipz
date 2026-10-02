import type { OzipzAction } from "../types/ozipz.types";
import { csvCell } from "@/lib/csv";
import { downloadBlob } from "./downloadHelper";
import { downloadFullReportWorkbook } from "./reportAnnex";

function recipientCount(action: OzipzAction) {
  return (Number(action.participantsCount) || 0);
}

function materialCount(action: OzipzAction) {
  return Number(action.materialsDistributedCount) || 0;
}

export function buildHealthPromotionReportCsv(actions: readonly OzipzAction[]) {
  const header = ["Data", "Zadanie", "JRWA", "Forma", "Status", "Działania", "Odbiorcy", "Materiały"];
  const rows = actions.map((action) => [
    action.date,
    action.title,
    action.jrwaSign || action.jrwaCaseId || "",
    action.actionType || "",
    action.status || "wykonane",
    Number(action.numberOfActions) || 1,
    recipientCount(action),
    materialCount(action),
  ]);
  return "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
}

export function downloadHealthPromotionReportCsv(
  actions: readonly OzipzAction[],
  year: number,
  months: readonly number[]
) {
  const period = months.length === 12 ? String(year) : `${year}-${months.join("-") || "brak"}`;
  downloadBlob(
    new Blob([buildHealthPromotionReportCsv(actions)], { type: "text/csv;charset=utf-8" }),
    `sprawozdanie-promocja-zdrowia-${period}.csv`
  );
}

export async function downloadHealthPromotionReportWorkbook(
  actions: readonly OzipzAction[],
  year: number,
  months: readonly number[],
  preparedBy: string,
  _reportMode?: string,
  _annexNumber: 1 | 2 = 1
) {
  await downloadFullReportWorkbook(actions, year, months, preparedBy);
}
