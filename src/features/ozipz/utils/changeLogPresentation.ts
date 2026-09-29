import type { ChangeLogEntry, ChangeRecord } from "../../../db/change-log";

/** Nazwy modułów dla tabel bazy, w kolejności wyświetlania w filtrze. */
export const CHANGE_LOG_TABLE_LABELS: Record<string, string> = {
  ozipz_actions: "Działania",
  ozipz_schedule: "Harmonogram",
  ozipz_jrwa_cases: "Sprawy JRWA",
  ozipz_letters: "Pisma",
  ozipz_registers: "Rejestry",
  ozipz_scans: "Skany",
  ozipz_materials: "Materiały",
  ozipz_distributions: "Rozdzielniki",
  ozipz_publications: "Publikacje",
  ozipz_facilities: "Placówki",
  ozipz_programs: "Programy",
  ozipz_participations: "Udział w programach",
  ozipz_contacts: "Kontakty",
  ozipz_dictionaries: "Słowniki",
  ozipz_templates: "Szablony zadań",
  ozipz_staff: "Kadra",
  ozipz_monthly_targets: "Plan miesięczny",
  ozipz_closed_months: "Zamknięte miesiące",
};

export const OPERATION_LABELS: Record<ChangeLogEntry["operation"], string> = {
  INSERT: "Dodano",
  UPDATE: "Zmieniono",
  DELETE: "Usunięto",
};

const LABEL_COLUMNS = [
  "title", "name", "full_name", "label", "full_case_sign", "letter_number", "material_title",
  "recipient_name", "facility_name", "program_name", "month_key",
];
/** Kolumny techniczne pomijane w porównaniu wersji. */
const HIDDEN_COLUMNS = new Set(["id", "created_at", "updated_at"]);

export function tableLabel(tableName: string): string {
  return CHANGE_LOG_TABLE_LABELS[tableName] ?? tableName.replace(/^ozipz_/, "").replace(/_/g, " ");
}

export function recordLabel(entry: ChangeLogEntry): string {
  const data: ChangeRecord = entry.newData ?? entry.oldData ?? {};
  for (const column of LABEL_COLUMNS) {
    const value = data[column];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (entry.tableName === "ozipz_monthly_targets" && data.year && data.month) return `${String(data.month).padStart(2, "0")}.${data.year}`;
  return entry.rowId;
}

/** „program_name” → „program name”. */
export function columnLabel(column: string): string {
  return column.replace(/_/g, " ");
}

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString("pl-PL");
    if (/^[[{]/.test(value)) {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(", ") || "—";
      } catch { /* Zwykły tekst zaczynający się od nawiasu. */ }
    }
    return value;
  }
  return String(value);
}

export interface FieldChange {
  column: string;
  before: unknown;
  after: unknown;
}

/** Pola, które zmieniły się w danym wpisie (dla dodania i usunięcia — wszystkie wypełnione pola). */
export function changedFields(entry: ChangeLogEntry): FieldChange[] {
  const before = entry.oldData ?? {};
  const after = entry.newData ?? {};
  const columns = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((column) => !HIDDEN_COLUMNS.has(column));
  return columns
    .map((column) => ({ column, before: before[column] ?? null, after: after[column] ?? null }))
    .filter(({ before: previous, after: next }) => entry.operation === "UPDATE" ? previous !== next : (previous ?? next) !== null && (previous ?? next) !== "");
}

export function formatChangeMoment(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
