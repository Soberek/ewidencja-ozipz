import { describe, expect, it } from "vitest";
import type { OzipzContact, OzipzFacility } from "../types/ozipz.types";
import { CONTACT_IMPORT_COLUMNS, parseCsv, planContactImport, planFacilityImport, readSpreadsheet } from "./spreadsheetImport";

const facility = { id: "f1", name: "Szkoła Podstawowa nr 1", city: "Myślibórz", municipality: "Myślibórz", type: "szkoła", address: "ul. Szkolna 1", postalCode: "74-300", county: "powiat myśliborski", leadingAuthority: "", isComplex: false, email: "stary@sp1.pl", createdAt: "2026-01-01", updatedAt: "2026-01-01" } as OzipzFacility;

describe("import z arkusza", () => {
  it("czyta CSV z Excela: średniki, cudzysłowy, BOM i znaki nowej linii w komórce", () => {
    expect(parseCsv('﻿Nazwa;Uwagi\r\n"Szkoła ""Tęcza""";"linia 1\nlinia 2"\r\n;\r\n')).toEqual([
      ["Nazwa", "Uwagi"],
      ['Szkoła "Tęcza"', "linia 1\nlinia 2"],
    ]);
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("rozpoznaje nagłówki bez polskich znaków i z gwiazdką ze wzoru", async () => {
    const file = new File(["Imie i nazwisko *;TELEFON;Szkoła\nJan Nowak;600100200;SP 3"], "kontakty.csv");
    const { rows, missingColumns } = await readSpreadsheet(file, CONTACT_IMPORT_COLUMNS);
    expect(missingColumns).toEqual([]);
    expect(rows).toEqual([{ name: "Jan Nowak", phone: "600100200", facilityName: "SP 3" }]);
  });

  it("czyta pierwszy arkusz pliku .xlsx", async () => {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Import");
    sheet.addRow(["Imię i nazwisko", "E-mail"]);
    sheet.addRow(["Jan Nowak", "jan@szkola.pl"]);
    const buffer = await workbook.xlsx.writeBuffer();
    const { rows } = await readSpreadsheet(new File([buffer], "kontakty.xlsx"), CONTACT_IMPORT_COLUMNS);
    expect(rows).toEqual([{ name: "Jan Nowak", email: "jan@szkola.pl" }]);
  });

  it("zgłasza brak wymaganej kolumny", async () => {
    const { missingColumns } = await readSpreadsheet(new File(["Telefon\n1"], "k.csv"), CONTACT_IMPORT_COLUMNS);
    expect(missingColumns).toEqual(["Imię i nazwisko"]);
  });

  it("uzupełnia istniejącą placówkę zamiast ją dublować i odrzuca niepełne wiersze", () => {
    const base = { type: "szkoła", address: "ul. Szkolna 1", postalCode: "74-300", municipality: "Myślibórz" };
    const plan = planFacilityImport([
      { ...base, name: "szkoła podstawowa NR 1", city: "Mysliborz", phone: "95 111" },
      { ...base, name: "Przedszkole nr 2", city: "Myślibórz" },
      { ...base, name: "Przedszkole nr 2", city: "Myślibórz" },
      { name: "Bez adresu", city: "Dębno" },
    ], [facility]);
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0]).toMatchObject({ id: "f1", phone: "95 111", email: "stary@sp1.pl" });
    expect(plan.toCreate.map((item) => item.name)).toEqual(["Przedszkole nr 2"]);
    expect(plan.warnings.map((issue) => issue.row)).toEqual([4]);
    expect(plan.errors).toEqual([{ row: 5, message: "Brak: Typ, Adres, Kod pocztowy, Gmina" }]);
  });

  it("wiąże kontakt z placówką po nazwie i pomija osoby już zapisane", () => {
    const existing = [{ id: "c1", name: "Anna Kowalska", facilityName: "Szkoła Podstawowa nr 1" }] as OzipzContact[];
    const plan = planContactImport([
      { name: "Anna Kowalska", facilityName: "szkoła podstawowa nr 1" },
      { name: "Jan Nowak", facilityName: "Szkoła Podstawowa nr 1", phone: "600" },
      { name: "Ewa Lis", facilityName: "Nieznana szkoła" },
    ], existing, [facility]);
    expect(plan.toCreate.map((item) => [item.name, item.facilityId])).toEqual([["Jan Nowak", "f1"], ["Ewa Lis", undefined]]);
    expect(plan.toCreate[0].municipality).toBe("Myślibórz");
    expect(plan.warnings.map((issue) => issue.row)).toEqual([2, 4]);
  });
});
