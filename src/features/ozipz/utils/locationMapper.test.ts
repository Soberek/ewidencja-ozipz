import { describe, it, expect } from "vitest";
import { parseFirebaseRawInput, mapRawLocationToFacility, type RawLocationInput } from "./locationMapper";
import type { OzipzFacility } from "../types/ozipz.types";

describe("locationMapper", () => {
  describe("parseFirebaseRawInput", () => {
    it("returns empty array for falsy or invalid input", () => {
      expect(parseFirebaseRawInput(null)).toEqual([]);
      expect(parseFirebaseRawInput(undefined)).toEqual([]);
      expect(parseFirebaseRawInput("")).toEqual([]);
      expect(parseFirebaseRawInput("not a json string")).toEqual([]);
      expect(parseFirebaseRawInput(123)).toEqual([]);
    });

    it("handles an array of objects directly", () => {
      const input = [
        { id: "1", name: "Szkoła 1" },
        { id: "2", name: "Szkoła 2" },
      ];
      const result = parseFirebaseRawInput(input);
      expect(result).toEqual(input);
    });

    it("parses valid JSON string", () => {
      const input = JSON.stringify([{ id: "fac-1", name: "Przedszkole" }]);
      const result = parseFirebaseRawInput(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Przedszkole");
    });

    it("extracts array from common container keys (locations, facilities, placowki, data, items)", () => {
      expect(parseFirebaseRawInput({ locations: [{ name: "Loc1" }] })).toEqual([{ name: "Loc1" }]);
      expect(parseFirebaseRawInput({ facilities: [{ name: "Fac1" }] })).toEqual([{ name: "Fac1" }]);
      expect(parseFirebaseRawInput({ placowki: [{ name: "Plac1" }] })).toEqual([{ name: "Plac1" }]);
      expect(parseFirebaseRawInput({ data: [{ name: "Data1" }] })).toEqual([{ name: "Data1" }]);
      expect(parseFirebaseRawInput({ items: [{ name: "Item1" }] })).toEqual([{ name: "Item1" }]);
    });

    it("converts key-value object map into array of RawLocationInput", () => {
      const objMap = {
        "-N123": { name: "Szkoła A", city: "Myślibórz" },
        "-N456": { name: "Szkoła B", city: "Barlinek" },
      };
      const result = parseFirebaseRawInput(objMap);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("-N123");
      expect(result[0].name).toBe("Szkoła A");
      expect(result[1].id).toBe("-N456");
      expect(result[1].name).toBe("Szkoła B");
    });
  });

  describe("mapRawLocationToFacility", () => {
    it("maps raw location fields properly into OzipzFacility schema", () => {
      const raw: RawLocationInput = {
        name: "Szkoła Podstawowa nr 2",
        address: "ul. Sportowa 1",
        city: "Myślibórz",
        postalCode: "74-300",
        municipality: "Myślibórz",
        county: "myśliborski",
        type: "szkola",
        notes: "Główny budynek",
      };

      const facility = mapRawLocationToFacility(raw);
      expect(facility.name).toBe("Szkoła Podstawowa nr 2");
      expect(facility.address).toBe("ul. Sportowa 1");
      expect(facility.city).toBe("Myślibórz");
      expect(facility.postalCode).toBe("74-300");
      expect(facility.municipality).toBe("Myślibórz");
      expect(facility.county).toBe("myśliborski");
      expect(facility.type).toBe("szkola");
      expect(facility.notes).toBe("Główny budynek");
      expect(facility.isComplex).toBe(false);
      expect(facility.id).toMatch(/^fac-fb-/);
      expect(facility.createdAt).toBeDefined();
      expect(facility.updatedAt).toBeDefined();
    });

    it("supports Polish field aliases (nazwa, adres, miejscowosc, kodPocztowy, gmina, powiat, organProwadzacy, typ)", () => {
      const raw: RawLocationInput = {
        nazwa: "Zespół Szkół i Placówek Oświatowych",
        adres: "ul. Strzelecka 5",
        miejscowosc: "Barlinek",
        kodPocztowy: "74-320",
        gmina: "Barlinek",
        powiat: "powiat myśliborski",
        organProwadzacy: "Powiat Myśliborski",
        typ: "zespol_szkol",
      };

      const facility = mapRawLocationToFacility(raw);
      expect(facility.name).toBe("Zespół Szkół i Placówek Oświatowych");
      expect(facility.address).toBe("ul. Strzelecka 5");
      expect(facility.city).toBe("Barlinek");
      expect(facility.postalCode).toBe("74-320");
      expect(facility.municipality).toBe("Barlinek");
      expect(facility.county).toBe("powiat myśliborski");
      expect(facility.leadingAuthority).toBe("Powiat Myśliborski");
      expect(facility.type).toBe("zespol_szkol");
      expect(facility.isComplex).toBe(true);
    });

    it("updates existing matching facility without overwriting id and createdAt", () => {
      const existing: OzipzFacility[] = [
        {
          id: "fac-exist-1",
          name: "Liceum Ogólnokształcące",
          city: "Myślibórz",
          address: "ul. Bohaterów Warszawy 1",
          postalCode: "74-300",
          municipality: "Myślibórz",
          county: "myśliborski",
          leadingAuthority: "Powiat Myśliborski",
          type: "liceum",
          isComplex: true,
          parentFacilityId: "fac-parent-1",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
      ];

      const raw: RawLocationInput = {
        name: "Liceum Ogólnokształcące",
        city: "Myślibórz",
        address: "ul. Nowa 10",
      };

      const facility = mapRawLocationToFacility(raw, existing);
      expect(facility.id).toBe("fac-exist-1");
      expect(facility.createdAt).toBe("2025-01-01T00:00:00.000Z");
      expect(facility.address).toBe("ul. Nowa 10");
      expect(facility.isComplex).toBe(true);
      expect(facility.parentFacilityId).toBe("fac-parent-1");
    });
  });
});
