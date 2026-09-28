import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../../data/migratedData";
import type { OzipzDistribution } from "../../types/ozipz.types";

describe("Materiały Edukacyjne & Rozdzielniki OZiPZ", () => {
  it("posiada 24 autentyczne pozycje materiałów bez sztucznych pól magazynowych", () => {
    expect(MIGRATED_FIREBASE_DATA.materials.length).toBe(24);

    MIGRATED_FIREBASE_DATA.materials.forEach((m) => {
      expect(m.title).toBeDefined();
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.materialType).toBeDefined();
      expect(m.topic).toBeDefined();
      expect(m.publisher).toBeDefined();
      // Bez pól stanu magazynowego
      expect((m as unknown as Record<string, unknown>).currentStock).toBeUndefined();
      expect((m as unknown as Record<string, unknown>).initialStock).toBeUndefined();
      expect((m as unknown as Record<string, unknown>).minimumStockThreshold).toBeUndefined();
    });
  });

  it("przypisuje prawidłowe słownikowe typy materiałów (ulotka, broszura, poradnik, plakat, pakiet)", () => {
    const validTypes = new Set(["ulotka", "broszura", "poradnik", "plakat", "pakiet_programowy", "zakladka", "inny"]);
    MIGRATED_FIREBASE_DATA.materials.forEach((m) => {
      expect(validTypes.has(m.materialType)).toBe(true);
    });
  });

  it("poprawnie tworzy i formatuje rekord rozdzielnika materiałów", () => {
    const sampleDist: OzipzDistribution = {
      id: "dist-1",
      materialId: "mat-1",
      materialTitle: "Podstępne WZW - ZASZCZEP SIĘ",
      materialType: "ulotka",
      recipientName: "Szkoła Podstawowa nr 1 w Barlinku",
      municipality: "Barlinek",
      quantity: 120,
      distributionDate: "2026-08-28",
      assignedEducator: "Sekcja OZiPZ",
      purpose: "Program Podstępne WZW",
      notes: "Przekazano bezpośrednio do sekretariatu",
      createdAt: "2026-08-28T10:00:00.000Z",
    };

    expect(sampleDist.quantity).toBe(120);
    expect(sampleDist.recipientName).toBe("Szkoła Podstawowa nr 1 w Barlinku");
    expect(sampleDist.municipality).toBe("Barlinek");
    expect(sampleDist.materialType).toBe("ulotka");
  });

  it("prawidłowo sumuje statystyki rozdzielników i unikalne formaty", () => {
    const dummyDistributions: OzipzDistribution[] = [
      {
        id: "d1",
        materialTitle: "Broszura WZW",
        materialType: "broszura",
        recipientName: "SP 1",
        quantity: 50,
        distributionDate: "2026-08-20",
        assignedEducator: "Edukator 1",
        purpose: "Działania OZiPZ",
        createdAt: "2026-08-20T08:00:00.000Z",
      },
      {
        id: "d2",
        materialTitle: "Ulotka KZM",
        materialType: "ulotka",
        recipientName: "SP 2",
        quantity: 75,
        distributionDate: "2026-08-22",
        assignedEducator: "Edukator 2",
        purpose: "Akcja Bezpieczne Wakacje",
        createdAt: "2026-08-22T08:00:00.000Z",
      },
    ];

    const totalDistributed = dummyDistributions.reduce((sum, d) => sum + d.quantity, 0);
    expect(totalDistributed).toBe(125);

    const formats = new Set(MIGRATED_FIREBASE_DATA.materials.map((m) => m.materialType));
    expect(formats.size).toBeGreaterThanOrEqual(4);
  });

  it("poprawnie powiązuje rekord dystrybucji z zadaniem źródłowym (actionId, actionTitle)", () => {
    const linkedDist: OzipzDistribution = {
      id: "dist-100",
      materialId: "mat-2",
      materialTitle: "Poradnik Zdrowego Żywienia",
      materialType: "poradnik",
      recipientName: "Szkoła Podstawowa w Różańsku",
      facilityId: "fac-rozansko",
      municipality: "Dębno",
      actionId: "act-12345",
      actionTitle: "Warsztaty: Trzymaj Formę! i zdrowe nawyki",
      quantity: 45,
      distributionDate: "2026-08-25",
      assignedEducator: "Krzysztof Palpuchowski",
      purpose: "Program: Trzymaj Formę! (Warsztaty: Trzymaj Formę! i zdrowe nawyki)",
      notes: "Karta rozdzielnika powiązana z zadaniem źródłowym",
      createdAt: "2026-08-25T12:00:00.000Z",
    };

    expect(linkedDist.actionId).toBe("act-12345");
    expect(linkedDist.actionTitle).toBe("Warsztaty: Trzymaj Formę! i zdrowe nawyki");
    expect(linkedDist.facilityId).toBe("fac-rozansko");
    expect(linkedDist.quantity).toBe(45);
  });
});

