import { describe, it, expect } from "vitest";
import {
  defaultRegistersForActivity,
  resolveActionRegisters,
  OFFICIAL_REGISTERS_CONFIG,
  INFORMACJE_OFFICIAL_FOOTER,
} from "../../utils/registerConfig";
import {
  formatActionIzrzNumber,
  formatActionInterventionType,
  formatActionPrzedmiot,
  formatActionLocationDetails,
  formatActionRecipientCount,
} from "../../utils/registerPresentation";
import { buildRegisterPrintHtml } from "../../utils/registerPrint";
import type { OzipzAction, OzipzFacility } from "../../types/ozipz.types";

describe("Ewidencja OZiPZ - Oficjalne Rejestry Urzędowe (Wzór better-oz & edu-report)", () => {
  const sampleAction: OzipzAction = {
    id: "act-101",
    date: "2026-05-15",
    title: "Prelekcja o zdrowym żywieniu",
    topic: "Choroby dietozależne",
    actionType: "Prelekcja",
    status: "wykonane",
    ezdStatus: "w_ezd",
    programId: "prog-1",
    programName: "Trzymaj Formę!",
    facilityId: "fac-1",
    facilityName: "Szkoła Podstawowa nr 1",
    municipality: "Myślibórz",
    izrzSign: "IZRZ.966.1.2026",
    jrwaSign: "OZiPZ.966.1.1.2026",
    leadEducator: "Krzysztof Palpuchowski",
    audienceGroup: "dzieci_szkolne",
    participantsCount: 45,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 10,
    notes: "Wszystko zgodnie z planem",
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-05-15T10:00:00.000Z",
  };

  const sampleFacility: OzipzFacility = {
    id: "fac-1",
    name: "Szkoła Podstawowa nr 1 w Myśliborzu",
    type: "szkola_podstawowa",
    municipality: "Myślibórz",
    county: "powiat myśliborski",
    leadingAuthority: "Gmina Myślibórz",
    address: "ul. Piłsudskiego 10",
    city: "Myślibórz",
    postalCode: "74-300",
    isComplex: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const facilitiesMap = new Map<string, OzipzFacility>([["fac-1", sampleFacility]]);

  describe("Heurystyka i Kwalifikacja Działań do Rejestrów", () => {
    it("classifies educational actions (prelekcja, warsztat, szkolenie, dystrybucja) to Informacje by default", () => {
      expect(defaultRegistersForActivity("Prelekcja")).toContain("informacje");
      expect(defaultRegistersForActivity("Szkolenie koordynatorów")).toContain("informacje");
      expect(defaultRegistersForActivity("Warsztaty profilaktyczne")).toContain("informacje");
      expect(defaultRegistersForActivity("Dystrybucja ulotek")).toContain("informacje");
    });

    it("classifies media, articles, and posts to Publikacje", () => {
      expect(defaultRegistersForActivity("Publikacja na portalu gov.pl")).toContain("publikacje");
      expect(defaultRegistersForActivity("Post na Facebooku")).toContain("publikacje");
      expect(defaultRegistersForActivity("Artykuł prasowy")).toContain("publikacje");
    });

    it("classifies visits and field inspections to Wizytacje", () => {
      expect(defaultRegistersForActivity("Wizytacja placówki")).toContain("wizytacje");
      expect(defaultRegistersForActivity("Kontrola w terenie")).toContain("wizytacje");
    });

    it("resolveActionRegisters respects custom mapping overrides", () => {
      const customMappings = [
        {
          id: "map-1",
          activityType: "Prelekcja",
          registers: ["informacje", "publikacje"] as ("informacje" | "publikacje" | "wizytacje")[],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ];

      const keys = resolveActionRegisters({
        action: sampleAction,
        mappings: customMappings,
      });

      expect(keys).toContain("informacje");
      expect(keys).toContain("publikacje");
    });
  });

  describe("Formatery Danych Tabelarycznych", () => {
    it("formats IZRZ number accurately and returns dash if not present (without case sign fallback)", () => {
      expect(formatActionIzrzNumber(sampleAction)).toBe("IZRZ.966.1.2026");
      expect(formatActionIzrzNumber({ ...sampleAction, izrzSign: undefined, jrwaSign: "OZiPZ.966.1.1.2026" })).toBe("—");
      expect(formatActionIzrzNumber({ ...sampleAction, izrzSign: "", jrwaSign: "OZiPZ.966.1.1.2026" })).toBe("—");
    });

    it("formats intervention type as programowa / nieprogramowa", () => {
      expect(formatActionInterventionType(sampleAction)).toBe("programowa");
      expect(formatActionInterventionType({ ...sampleAction, programId: undefined, programName: undefined })).toBe("nieprogramowa");
    });

    it("formats action subject combining title and topic", () => {
      const przedmiot = formatActionPrzedmiot(sampleAction);
      expect(przedmiot).toContain("Prelekcja o zdrowym żywieniu");
      expect(przedmiot).toContain("Choroby dietozależne");
    });

    it("formats facility location with address and municipality", () => {
      const details = formatActionLocationDetails(sampleAction, sampleFacility);
      expect(details).toBe("Szkoła Podstawowa nr 1 w Myśliborzu, ul. Piłsudskiego 10, 74-300 Myślibórz");
    });

    it("counts direct recipients correctly", () => {
      expect(formatActionRecipientCount(sampleAction)).toBe(45);
    });
  });

  describe("Oficjalna Stopka i Druk Urzędowy", () => {
    it("includes WSSE Szczecin PZ.110.1.2024 footer in Informacje register print", () => {
      const html = buildRegisterPrintHtml({
        registerKey: "informacje",
        actions: [sampleAction],
        facilitiesMap,
        filters: { year: "2026", month: "5" },
      });

      expect(html).toContain(INFORMACJE_OFFICIAL_FOOTER);
      expect(html).toContain(OFFICIAL_REGISTERS_CONFIG.informacje.title);
      expect(html).toContain("IZRZ.966.1.2026");
      expect(html).toContain("Prelekcja o zdrowym żywieniu");
    });

    it("renders table for Publikacje and Wizytacje with correct headers", () => {
      const pubHtml = buildRegisterPrintHtml({
        registerKey: "publikacje",
        actions: [sampleAction],
        facilitiesMap,
      });
      expect(pubHtml).toContain("Data publ.");
      expect(pubHtml).toContain("Tematyka informacji");

      const wizHtml = buildRegisterPrintHtml({
        registerKey: "wizytacje",
        actions: [sampleAction],
        facilitiesMap,
      });
      expect(wizHtml).toContain("Nr protokołu");
      expect(wizHtml).toContain("Dane wizytowanej placówki");
    });
  });
});
