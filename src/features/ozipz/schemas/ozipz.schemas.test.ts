import { describe, it, expect } from "vitest";
import {
  ActionSchema,
  JrwaCaseSchema,
  MaterialSchema,
  DistributionSchema,
  FacilitySchema,
  DictionaryItemSchema,
  ContactSchema,
} from "./ozipz.schemas";

describe("Ewidencja OZiPZ - Walidacja Globalnych Schematów Zod", () => {
  it("poprawnie waliduje poprawne Działanie Edukacyjne (ActionSchema)", () => {
    const validAction = {
      id: "act-1",
      title: "Prelekcja o higienie",
      actionType: "prelekcja",
      date: "2026-02-15",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "higiena",
      audienceGroup: "uczniowie_sp",
      participantsCount: 45,
      leadEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-02-15T10:00:00Z",
      updatedAt: "2026-02-15T10:00:00Z",
    };

    const parsed = ActionSchema.safeParse(validAction);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.participantsCount).toBe(45);
      expect(parsed.data.materialsDistributedCount).toBe(0);
    }
  });

  it("odrzuca nieprawidłowe Działanie Edukacyjne (pusty tytuł, ujemni uczestnicy)", () => {
    const invalidAction = {
      id: "act-2",
      title: "A", // za krótki
      actionType: "prelekcja",
      date: "2026-02-15",
      facilityName: "SP 1",
      municipality: "Myślibórz",
      topic: "higiena",
      audienceGroup: "uczniowie_sp",
      participantsCount: -5, // ujemna liczba
      leadEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-02-15T10:00:00Z",
      updatedAt: "2026-02-15T10:00:00Z",
    };

    const parsed = ActionSchema.safeParse(invalidAction);
    expect(parsed.success).toBe(false);
  });

  it("odrzuca niemożliwe daty i przyjmuje poprawny starszy zapis polski", () => {
    const action = {
      id: "act-date", title: "Prelekcja", actionType: "prelekcja", date: "2026-02-15",
      facilityName: "SP 1", municipality: "Myślibórz", audienceGroup: "uczniowie",
      participantsCount: 1, leadEducator: "Jan", createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-02-15T10:00:00Z",
    };
    expect(ActionSchema.safeParse({ ...action, date: "2026-02-31" }).success).toBe(false);
    expect(ActionSchema.safeParse({ ...action, date: "31.02.2026" }).success).toBe(false);
    expect(ActionSchema.safeParse({ ...action, date: "15.02.2026" }).success).toBe(true);
  });

  it("poprawnie waliduje Znak Sprawy JRWA (JrwaCaseSchema)", () => {
    const validJrwa = {
      id: "jrwa-1",
      section: "OZ",
      jrwaSymbol: "966.1",
      caseNumber: 15,
      year: 2026,
      referentInitials: "KP",
      fullCaseSign: "OZ.966.1.15.2026.KP",
      title: "Koordynacja programu w szkołach",
      archivalCategory: "B5",
      status: "w_toku",
      assignedEducator: "Krzysztof Palpuchowski",
      createdAt: "2026-02-01T08:00:00Z",
      updatedAt: "2026-02-01T08:00:00Z",
    };

    const parsed = JrwaCaseSchema.safeParse(validJrwa);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fullCaseSign).toBe("OZ.966.1.15.2026.KP");
      expect(parsed.data.archivalCategory).toBe("B5");
    }
  });

  it("poprawnie waliduje Materiał Oświatowy i Rozdzielnik (MaterialSchema, DistributionSchema)", () => {
    const validMaterial = {
      id: "mat-1",
      title: "Broszura o zdrowym żywieniu",
      materialType: "broszura",
      topic: "zywienie_i_aktywnosc",
      publisher: "GIS / WSSE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(MaterialSchema.safeParse(validMaterial).success).toBe(true);

    const validDistribution = {
      id: "dist-1",
      materialTitle: "Broszura o zdrowym żywieniu",
      recipientName: "Szkoła Podstawowa nr 2",
      quantity: 50,
      distributionDate: "2026-02-20",
      assignedEducator: "Krzysztof Palpuchowski",
      purpose: "Zajęcia warsztatowe",
      createdAt: "2026-02-20T00:00:00Z",
    };
    expect(DistributionSchema.safeParse(validDistribution).success).toBe(true);
  });

  it("poprawnie waliduje Placówki, Kontakty i Słowniki (FacilitySchema, ContactSchema, DictionaryItemSchema)", () => {
    const validFacility = {
      id: "fac-1",
      name: "Szkoła Podstawowa nr 1",
      type: "szkola_podstawowa",
      address: "ul. Piłsudskiego 1",
      city: "Myślibórz",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "myśliborski",
      leadingAuthority: "Gmina Myślibórz",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(FacilitySchema.safeParse(validFacility).success).toBe(true);

    const validContact = {
      id: "con-1",
      name: "Anna Nowak",
      position: "Koordynator szkolny",
      facilityName: "SP 1",
      phone: "123456789",
      email: "anna.nowak@szkola.pl",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(ContactSchema.safeParse(validContact).success).toBe(true);

    const validDict = {
      id: "dict-1",
      dictType: "activityType",
      code: "prelekcja",
      label: "Prelekcja",
      isSystem: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(DictionaryItemSchema.safeParse(validDict).success).toBe(true);

    const validJrwaProg = {
      ...validDict,
      dictType: "jrwaSymbol",
      code: "966.1",
      label: "Trzymaj Formę",
      kind: "PROGRAMOWE",
    };
    expect(DictionaryItemSchema.safeParse(validJrwaProg).success).toBe(true);

    const validJrwaNieprog = {
      ...validDict,
      dictType: "jrwaSymbol",
      code: "966.14",
      label: "Bezpieczne Wakacje",
      kind: "NIEPROGRAMOWE",
    };
    expect(DictionaryItemSchema.safeParse(validJrwaNieprog).success).toBe(true);

    const invalidJrwaKind = {
      ...validDict,
      kind: "INNE_NIEZNANE",
    };
    expect(DictionaryItemSchema.safeParse(invalidJrwaKind).success).toBe(false);
  });
});
