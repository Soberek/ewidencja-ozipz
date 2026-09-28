import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "./migratedData";
import { DICTIONARY_CATEGORIES_CONFIG } from "../constants";

describe("Ewidencja OZiPZ - Edu-Report-V3 Data Integrity & Dictionaries", () => {
  it("contains authentic migrated actions for 2026", () => {
    expect(MIGRATED_FIREBASE_DATA.actions).toBeDefined();
    expect(MIGRATED_FIREBASE_DATA.actions.length).toBeGreaterThan(0);
  });

  it("has authentic facilities mapped from PSSE database", () => {
    expect(MIGRATED_FIREBASE_DATA.facilities).toBeDefined();
    expect(MIGRATED_FIREBASE_DATA.facilities.length).toBe(89);
  });

  it("ensures all preschools, kindergartens and nurseries are mapped to 'przedszkole' type", () => {
    MIGRATED_FIREBASE_DATA.facilities.forEach((f) => {
      const nameLow = f.name.toLowerCase();
      if (
        nameLow.includes("przedszkol") ||
        nameLow.includes("żłobek") ||
        nameLow.includes("zlobek") ||
        nameLow.includes("klub dziecięcy")
      ) {
        expect(f.type).toBe("przedszkole");
      }
    });
  });

  it("contains clean, canonical dictionary items across 11 categories", () => {
    expect(MIGRATED_FIREBASE_DATA.dictionaryItems.length).toBe(129);
  });

  it("contains all 11 edu-report dictionary types with valid codes and labels, and does not contain deprecated topic", () => {
    const types = new Set(MIGRATED_FIREBASE_DATA.dictionaryItems.map((d) => d.dictType));
    
    expect(types.has("activityType")).toBe(true);
    expect(types.has("recipientGroup")).toBe(true);
    expect(types.has("locationType")).toBe(true);
    expect(types.has("materialType")).toBe(true);
    expect(types.has("campaign")).toBe(true);
    expect(types.has("annotationReason")).toBe(true);
    expect(types.has("topic")).toBe(false);
    expect(types.has("jrwaSymbol")).toBe(true);
    expect(types.has("municipality")).toBe(true);
    expect(types.has("staffRole")).toBe(true);
    expect(types.has("contactPosition")).toBe(true);
    expect(types.has("documentType")).toBe(true);
    expect(types.has("publicationChannel")).toBe(false);

    // No broken hash codes
    MIGRATED_FIREBASE_DATA.dictionaryItems.forEach((d) => {
      expect(d.code).toBeDefined();
      expect(d.code.length).toBeGreaterThan(0);
      expect(d.label).toBeDefined();
      expect(d.label.length).toBeGreaterThan(0);
    });
  });

  it("contains authentic breakdown: 18 activityType, 11 recipientGroup, 7 locationType, 7 materialType, 8 campaign, 30 annotationReason, 21 jrwaSymbol, 5 municipality, 6 staffRole, 9 contactPosition, 7 documentType", () => {
    const byType: Record<string, number> = {};
    MIGRATED_FIREBASE_DATA.dictionaryItems.forEach((d) => {
      byType[d.dictType] = (byType[d.dictType] || 0) + 1;
    });

    expect(byType.activityType).toBe(18);
    expect(byType.recipientGroup).toBe(11);
    expect(byType.locationType).toBe(7);
    expect(byType.materialType).toBe(7);
    expect(byType.campaign).toBe(8);
    expect(byType.annotationReason).toBe(30);
    expect(byType.topic).toBeUndefined();
    expect(byType.jrwaSymbol).toBe(21);
    expect(byType.municipality).toBe(5);
    expect(byType.publicationChannel).toBeUndefined();
    expect(byType.staffRole).toBe(6);
    expect(byType.contactPosition).toBe(9);
    expect(byType.documentType).toBe(7);
  });

  it("has valid metadata for all dictionary categories in config (excluding topic)", () => {
    expect(DICTIONARY_CATEGORIES_CONFIG.activityType.label).toBe("Formy Działań");
    expect(DICTIONARY_CATEGORIES_CONFIG.recipientGroup.label).toBe("Grupy Odbiorców");
    expect(DICTIONARY_CATEGORIES_CONFIG.locationType.label).toBe("Typy Lokalizacji");
    expect(DICTIONARY_CATEGORIES_CONFIG.materialType.label).toBe("Typy Materiałów");
    expect(DICTIONARY_CATEGORIES_CONFIG.campaign.label).toBe("Akcje Profilaktyczne");
    expect(DICTIONARY_CATEGORIES_CONFIG.annotationReason.label).toBe("Powody Adnotacji i Odroczeń");
    expect(DICTIONARY_CATEGORIES_CONFIG.topic).toBeUndefined();
    expect(DICTIONARY_CATEGORIES_CONFIG.jrwaSymbol.label).toBe("Symbole JRWA");
    expect(DICTIONARY_CATEGORIES_CONFIG.municipality.label).toBe("Gminy Powiatu");
    expect(DICTIONARY_CATEGORIES_CONFIG.staffRole.label).toBe("Stanowiska Pracowników");
    expect(DICTIONARY_CATEGORIES_CONFIG.contactPosition.label).toBe("Stanowiska Koordynatorów / Kontaktów");
    expect(DICTIONARY_CATEGORIES_CONFIG.documentType.label).toBe("Typy Dokumentów i Skanów");
  });

  it("strictly guarantees uniqueness of (dictType, code) pairs across all 129 dictionary items", () => {
    const seen = new Set<string>();
    for (const item of MIGRATED_FIREBASE_DATA.dictionaryItems) {
      const key = `${item.dictType}:${item.code}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(129);
  });

  it("assigns valid Polish postal codes (format XX-XXX) to all canonical municipalities", () => {
    const munis = MIGRATED_FIREBASE_DATA.dictionaryItems.filter((d) => d.dictType === "municipality");
    expect(munis.length).toBe(5);
    munis.forEach((m) => {
      expect(m.postalCode).toBeDefined();
      expect(m.postalCode).toMatch(/^\d{2}-\d{3}$/);
    });

    const mysliborz = munis.find((m) => m.code === "mysliborz");
    expect(mysliborz?.postalCode).toBe("74-300");

    const barlinek = munis.find((m) => m.code === "barlinek");
    expect(barlinek?.postalCode).toBe("74-320");

    const debno = munis.find((m) => m.code === "debno");
    expect(debno?.postalCode).toBe("74-400");
  });

  it("assigns valid kind (PROGRAMOWE or NIEPROGRAMOWE) to all 21 JRWA symbols", () => {
    const jrwas = MIGRATED_FIREBASE_DATA.dictionaryItems.filter((d) => d.dictType === "jrwaSymbol");
    expect(jrwas.length).toBe(21);
    jrwas.forEach((j) => {
      expect(j.kind).toBeDefined();
      expect(["PROGRAMOWE", "NIEPROGRAMOWE"]).toContain(j.kind);
    });

    const tf = jrwas.find((j) => j.code === "966.1");
    expect(tf?.kind).toBe("PROGRAMOWE");

    const bw = jrwas.find((j) => j.code === "966.14");
    expect(bw?.kind).toBe("NIEPROGRAMOWE");
  });
});
