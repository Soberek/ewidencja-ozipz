import type { OzipzContact, OzipzFacility } from "../types/ozipz.types";
import { normalizeNavQuery } from "../components/layout/navigation";

/** Wiersz arkusza: znormalizowany nagłówek kolumny → tekst komórki. */
export type SheetRow = Record<string, string>;

export interface ImportIssue {
  /** Numer wiersza w arkuszu (1 = nagłówek). */
  row: number;
  message: string;
}

export interface ImportPlan<T> {
  toCreate: T[];
  toUpdate: T[];
  /** Wiersze pominięte lub zaimportowane z zastrzeżeniem. */
  warnings: ImportIssue[];
  errors: ImportIssue[];
}

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  /** Inne nazwy nagłówka spotykane w arkuszach (bez polskich znaków, małymi literami). */
  aliases: string[];
}

const normalizeHeader = (value: string) => normalizeNavQuery(value).replace(/[^a-z0-9]+/g, " ").trim();

/** Czyta arkusz CSV (średnik, przecinek lub tabulator; cudzysłowy jak w Excelu). */
export function parseCsv(text: string): string[][] {
  const content = text.replace(/^﻿/, "");
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ";");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (quoted) {
      if (char === '"' && content[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell); cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

/** Pierwszy arkusz pliku .xlsx jako tablica wierszy tekstu. */
async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let column = 1; column <= sheet.columnCount; column += 1) {
      cells.push(row.getCell(column).text?.trim() ?? "");
    }
    rows.push(cells);
  });
  return rows;
}

/** Odczytuje plik .xlsx lub .csv i przypisuje komórki do kolumn po nazwach nagłówków. */
export async function readSpreadsheet(file: File, columns: ImportColumn[]): Promise<{ rows: SheetRow[]; missingColumns: string[] }> {
  const table = /\.csv$/i.test(file.name) ? parseCsv(await file.text()) : await readXlsx(await file.arrayBuffer());
  if (table.length === 0) return { rows: [], missingColumns: columns.filter((column) => column.required).map((column) => column.label) };
  const headers = table[0].map(normalizeHeader);
  const positions = new Map<string, number>();
  for (const column of columns) {
    const candidates = [column.label, ...column.aliases].map(normalizeHeader);
    const position = headers.findIndex((header) => candidates.includes(header));
    if (position >= 0) positions.set(column.key, position);
  }
  const missingColumns = columns.filter((column) => column.required && !positions.has(column.key)).map((column) => column.label);
  const rows = table.slice(1).map((cells) => {
    const row: SheetRow = {};
    for (const [key, position] of positions) row[key] = (cells[position] ?? "").trim();
    return row;
  });
  return { rows, missingColumns };
}

/** Wzór arkusza z nagłówkami, które import rozpoznaje. */
export async function downloadImportTemplate(columns: ImportColumn[], fileName: string, example: string[]): Promise<void> {
  const [{ default: ExcelJS }, { downloadBlob }] = await Promise.all([import("exceljs"), import("./downloadHelper")]);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Import");
  sheet.addRow(columns.map((column) => column.required ? `${column.label} *` : column.label)).font = { bold: true };
  sheet.addRow(example);
  sheet.columns.forEach((column) => { column.width = 24; });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

const key = (...parts: Array<string | undefined>) => parts.map((part) => normalizeNavQuery(part ?? "")).join("|");
const requiredMissing = (row: SheetRow, columns: ImportColumn[]) =>
  columns.filter((column) => column.required && !row[column.key]).map((column) => column.label);

// ---------- Placówki ----------

export const FACILITY_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name", label: "Nazwa", required: true, aliases: ["nazwa placowki", "nazwa szkoly", "placowka"] },
  { key: "type", label: "Typ", required: true, aliases: ["typ placowki", "rodzaj", "rodzaj placowki"] },
  { key: "address", label: "Adres", required: true, aliases: ["ulica", "ulica i numer"] },
  { key: "postalCode", label: "Kod pocztowy", required: true, aliases: ["kod"] },
  { key: "city", label: "Miejscowość", required: true, aliases: ["miasto", "poczta"] },
  { key: "municipality", label: "Gmina", required: true, aliases: [] },
  { key: "county", label: "Powiat", aliases: [] },
  { key: "leadingAuthority", label: "Organ prowadzący", aliases: ["organ"] },
  { key: "email", label: "E-mail", aliases: ["email", "adres e mail", "mail"] },
  { key: "phone", label: "Telefon", aliases: ["tel", "nr telefonu"] },
  { key: "notes", label: "Uwagi", aliases: ["notatki"] },
];

type FacilityDraft = Omit<OzipzFacility, "id" | "createdAt" | "updatedAt"> & { id?: string };

/** Nowe placówki i uzupełnienia istniejących (dopasowanie po nazwie i miejscowości). */
export function planFacilityImport(rows: SheetRow[], existing: OzipzFacility[]): ImportPlan<FacilityDraft> {
  const byKey = new Map(existing.map((facility) => [key(facility.name, facility.city), facility]));
  const seen = new Set<string>();
  const plan: ImportPlan<FacilityDraft> = { toCreate: [], toUpdate: [], warnings: [], errors: [] };
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (Object.values(row).every((value) => !value)) return;
    const missing = requiredMissing(row, FACILITY_IMPORT_COLUMNS);
    if (missing.length) { plan.errors.push({ row: rowNumber, message: `Brak: ${missing.join(", ")}` }); return; }
    const identity = key(row.name, row.city);
    if (seen.has(identity)) { plan.warnings.push({ row: rowNumber, message: `Powtórzona placówka „${row.name}” w pliku` }); return; }
    seen.add(identity);
    const current = byKey.get(identity);
    const optional = (field: keyof SheetRow, fallback?: string) => row[field] || fallback || undefined;
    const draft: FacilityDraft = {
      ...(current ?? {}),
      id: current?.id,
      name: row.name,
      type: row.type,
      address: row.address,
      postalCode: row.postalCode,
      city: row.city,
      municipality: row.municipality,
      county: row.county || current?.county || "",
      leadingAuthority: optional("leadingAuthority", current?.leadingAuthority) ?? "",
      isComplex: current?.isComplex ?? false,
      email: optional("email", current?.email),
      phone: optional("phone", current?.phone),
      notes: optional("notes", current?.notes),
    };
    (current ? plan.toUpdate : plan.toCreate).push(draft);
  });
  return plan;
}

// ---------- Kontakty ----------

export const CONTACT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name", label: "Imię i nazwisko", required: true, aliases: ["nazwisko i imie", "osoba", "nazwisko", "kontakt"] },
  { key: "position", label: "Stanowisko", aliases: ["funkcja", "rola"] },
  { key: "facilityName", label: "Placówka", aliases: ["instytucja", "szkola", "nazwa placowki"] },
  { key: "municipality", label: "Gmina", aliases: [] },
  { key: "phone", label: "Telefon", aliases: ["tel", "nr telefonu"] },
  { key: "email", label: "E-mail", aliases: ["email", "adres e mail", "mail"] },
  { key: "notes", label: "Uwagi", aliases: ["notatki"] },
];

type ContactDraft = Omit<OzipzContact, "id" | "createdAt" | "updatedAt">;

/** Nowe kontakty; placówkę wiążemy po nazwie, a istniejące osoby w tej samej placówce pomijamy. */
export function planContactImport(rows: SheetRow[], existing: OzipzContact[], facilities: OzipzFacility[]): ImportPlan<ContactDraft> {
  const facilityByName = new Map(facilities.map((facility) => [key(facility.name), facility]));
  const known = new Set(existing.map((contact) => key(contact.name, contact.facilityName)));
  const plan: ImportPlan<ContactDraft> = { toCreate: [], toUpdate: [], warnings: [], errors: [] };
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (Object.values(row).every((value) => !value)) return;
    const missing = requiredMissing(row, CONTACT_IMPORT_COLUMNS);
    if (missing.length) { plan.errors.push({ row: rowNumber, message: `Brak: ${missing.join(", ")}` }); return; }
    const facility = row.facilityName ? facilityByName.get(key(row.facilityName)) : undefined;
    const facilityName = facility?.name ?? row.facilityName ?? "";
    const identity = key(row.name, facilityName);
    if (known.has(identity)) { plan.warnings.push({ row: rowNumber, message: `„${row.name}” już jest w spisie kontaktów` }); return; }
    known.add(identity);
    if (row.facilityName && !facility) {
      plan.warnings.push({ row: rowNumber, message: `Placówka „${row.facilityName}” nie jest w bazie — kontakt zostanie dodany bez powiązania` });
    }
    plan.toCreate.push({
      name: row.name,
      position: row.position ?? "",
      facilityId: facility?.id,
      facilityName,
      municipality: row.municipality || facility?.municipality || undefined,
      phone: row.phone ?? "",
      email: row.email ?? "",
      notes: row.notes || undefined,
    });
  });
  return plan;
}
