import type { ColumnDef } from "./types";
import { getTodayIsoDate } from "@/features/ozipz/utils/dateUtils";
import { csvCell } from "@/lib/csv";

/**
 * Eksportuje dane tabeli do pliku CSV z kodowaniem UTF-8 (BOM)
 * oraz sanitizacją znaków nowej linii i cudzysłowów.
 */
export function exportDataTableToCsv<T>(
  columns: ColumnDef<T>[],
  data: T[],
  fileName?: string
): void {
  const exportCols = columns.filter((c) => c.accessorKey || c.accessorFn);
  if (exportCols.length === 0 || data.length === 0) return;

  const headerRow = exportCols
    .map((c) => {
      const raw = typeof c.header === "string" ? c.header : c.id;
      return csvCell(raw);
    })
    .join(";");

  const dataRows = data.map((row) => {
    return exportCols
      .map((col) => {
        let val: unknown = "";
        if (col.accessorKey) {
          val = (row as Record<string, unknown>)[col.accessorKey as string];
        } else if (col.accessorFn) {
          val = col.accessorFn(row);
        }
        return csvCell(typeof val === "number" ? val : String(val ?? "").replace(/\r\n|\r|\n/g, " "));
      })
      .join(";");
  });

  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName ?? `eksport_${getTodayIsoDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
