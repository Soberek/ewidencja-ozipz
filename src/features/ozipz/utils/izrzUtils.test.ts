import { describe, it, expect } from "vitest";
import {
  parseNumerIzrz,
  formatNumerIzrz,
  normalizeNumerIzrz,
  izrzSeriaForDzialanie,
  formatAdresIzrz,
  extractLocalityFromFacilityName,
  formatOdbiorcaLine,
  buildLiczbaOsobOpis,
  buildIzrzFileName,
  toAsciiSlug,
} from "./izrzUtils";

describe("izrzUtils", () => {
  it("should parse and format standard, wizytacja and narada IZRZ numbers", () => {
    expect(parseNumerIzrz("66/2026")).toEqual({ nr: 66, rok: 2026, seria: "standard" });
    expect(parseNumerIzrz("66/26")).toEqual({ nr: 66, rok: 2026, seria: "standard" });
    expect(parseNumerIzrz("PZ/6/2026")).toEqual({ nr: 6, rok: 2026, seria: "wizytacja" });
    expect(parseNumerIzrz("N/1/2026")).toEqual({ nr: 1, rok: 2026, seria: "narada" });
    expect(parseNumerIzrz("invalid")).toBeNull();
    expect(parseNumerIzrz("")).toBeNull();

    expect(formatNumerIzrz({ nr: 66, rok: 2026, seria: "standard" })).toBe("66/2026");
    expect(formatNumerIzrz({ nr: 6, rok: 2026, seria: "wizytacja" })).toBe("PZ/6/2026");
    expect(formatNumerIzrz({ nr: 1, rok: 2026, seria: "narada" })).toBe("N/1/2026");

    expect(normalizeNumerIzrz("66/26")).toBe("66/2026");
    expect(normalizeNumerIzrz("pz/6/26", { seria: "wizytacja" })).toBe("PZ/6/2026");
  });

  it("should detect series for action names", () => {
    expect(izrzSeriaForDzialanie("Wizytacja w szkole")).toBe("wizytacja");
    expect(izrzSeriaForDzialanie("Narada koordynatorów")).toBe("narada");
    expect(izrzSeriaForDzialanie("Prelekcja")).toBe("standard");
  });

  it("should format address in single line for IZRZ with street or village name", () => {
    const addr = formatAdresIzrz({
      nazwa: "Szkoła Podstawowa nr 1",
      zespol_nazwa: "Zespół Szkół",
      ulica: "Czereśniowa",
      nr_budynku: "4",
      kod_pocztowy: "74-300",
      miasto: "Myślibórz",
    });
    expect(addr).toBe("Zespół Szkół – Szkoła Podstawowa nr 1, ul. Czereśniowa 4, 74-300 Myślibórz");

    const addrRataje = formatAdresIzrz({
      nazwa: "Szkoła Podstawowa w Ratajach",
      ulica: "Rataje 25",
      miasto: "Rataje",
      gmina: "Myślibórz",
      kod_pocztowy: "74-300",
    });
    expect(addrRataje).toBe("Szkoła Podstawowa w Ratajach, Rataje 25, 74-300 Myślibórz");
  });

  it("should extract locality from facility name", () => {
    expect(extractLocalityFromFacilityName("Szkoła Podstawowa w Ratajach")).toBe("Rataje");
    expect(extractLocalityFromFacilityName("Przedszkole w Karsku")).toBe("Karsko");
    expect(extractLocalityFromFacilityName("Szkoła Podstawowa w Smolnicy")).toBe("Smolnica");
    expect(extractLocalityFromFacilityName("Szkoła Podstawowa nr 1")).toBeNull();
  });

  it("should format recipient line correctly", () => {
    expect(
      formatOdbiorcaLine({
        grupa_nazwa: "Uczniowie",
        klasy: "7c, 7b",
        liczba_osob: 15,
      })
    ).toBe("Uczniowie klasy 7c, 7b - 15");

    expect(
      formatOdbiorcaLine({
        grupa_nazwa: "Półkolonie letnie",
        wiek_od: 7,
        wiek_do: 12,
        liczba_osob: 25,
      })
    ).toBe("Półkolonie letnie (7–12 lat) - 25");
  });

  it("should build structured description with action numbers", () => {
    const desc = buildLiczbaOsobOpis(
      [
        { nr_dzialania: 1, grupa_nazwa: "Uczniowie", klasy: "7c", liczba_osob: 15 },
        { nr_dzialania: 1, grupa_nazwa: "Kadra pedagogiczna", liczba_osob: 2 },
        { nr_dzialania: 2, grupa_nazwa: "Uczniowie", klasy: "8a", liczba_osob: 20 },
      ],
      { dzialanieNazwa: "Prelekcja (warsztat)", liczbaDzialan: 2 }
    );

    expect(desc).toContain("Prelekcja 1:");
    expect(desc).toContain("Uczniowie klasy 7c - 15");
    expect(desc).toContain("Nauczyciele - 2");
    expect(desc).toContain("Prelekcja 2:");
    expect(desc).toContain("Uczniowie klasy 8a - 20");
  });

  it("should create ascii slug and file name", () => {
    expect(toAsciiSlug("Zażółć gęślą jaźń")).toBe("Zazolc-gesla-jazn");
    const name = buildIzrzFileName(
      {
        numer_izrz: "66/2026",
        miasto: "Myślibórz",
        nazwa_programu: "Trzymaj Formę!",
        data: "2026-05-15",
      },
      "2026-05-15"
    );
    expect(name).toBe("IZRZ_66-2026_2026-05-15_Mysliborz_Trzymaj-Forme");
  });
});
