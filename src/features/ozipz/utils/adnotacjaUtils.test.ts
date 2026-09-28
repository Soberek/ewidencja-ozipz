import { describe, it, expect } from "vitest";
import {
  ADNOTACJA_POWODY,
  formatDateLongPl,
  effectiveDone,
  effectiveWykonano,
  pctOf,
  passesHarmonogramFilter,
  buildAdnotacjaData,
} from "./adnotacjaUtils";

describe("adnotacjaUtils", () => {
  it("should provide exactly 30 canonical annotation reasons", () => {
    expect(ADNOTACJA_POWODY.length).toBe(30);
    expect(ADNOTACJA_POWODY[0].kod).toBe("brak_terminu");
    expect(ADNOTACJA_POWODY[ADNOTACJA_POWODY.length - 1].kod).toBe("inne_uzasadnione");
  });

  it("should format date into full Polish genitive format", () => {
    expect(formatDateLongPl("2026-05-15")).toBe("15 maja 2026 r.");
    expect(formatDateLongPl("2026-01-01")).toBe("1 stycznia 2026 r.");
  });

  it("should compute effective completion status and counts", () => {
    expect(effectiveDone({ plannedCount: 2, completedCount: 2 })).toBe(true);
    expect(effectiveDone({ plannedCount: 2, completedCount: 1 })).toBe(false);
    expect(effectiveDone({ plannedCount: 2, completedCount: 0, manuallyCompleted: true })).toBe(true);
    expect(effectiveDone({ status: "anulowane", plannedCount: 2, completedCount: 2 })).toBe(false);

    expect(effectiveWykonano({ plannedCount: 2, completedCount: 5 })).toBe(2);
    expect(effectiveWykonano({ plannedCount: 2, completedCount: 1 })).toBe(1);
    expect(effectiveWykonano({ plannedCount: 5, completedCount: 0, manuallyCompleted: true })).toBe(5);

    expect(pctOf(2, 4)).toBe(50);
    expect(pctOf(5, 4)).toBe(100);
  });

  it("should filter harmonogram items by filter key", () => {
    const itemOpen = { plannedCount: 2, completedCount: 0, annotationReasonCode: null };
    const itemWithAdn = { plannedCount: 2, completedCount: 0, annotationReasonCode: "brak_sali" };
    const itemManual = { plannedCount: 2, completedCount: 0, manuallyCompleted: true };

    expect(passesHarmonogramFilter("open", itemOpen)).toBe(true);
    expect(passesHarmonogramFilter("noadn", itemOpen)).toBe(true);
    expect(passesHarmonogramFilter("noadn", itemWithAdn)).toBe(false);
    expect(passesHarmonogramFilter("manual", itemManual)).toBe(true);
  });

  it("should build adnotacja document data structure", () => {
    const data = buildAdnotacjaData({
      pozycja: {
        miesiac: 5,
        rok: 2026,
        jrwa: "966.1",
        interwencja_nazwa: "Trzymaj Formę!",
        dzialanie_nazwa: "Prelekcja",
        planowana_liczba: 2,
        wykonano: 0,
      },
      sporzadzil: "Jan Kowalski",
      stanowisko: "Młodszy Asystent",
      powod: ADNOTACJA_POWODY[0],
      tresc: "Placówka odmówiła terminu z powodu remontu.",
      data: "2026-05-30",
      miasto: "Myślibórz",
    });

    expect(data.miasto).toBe("Myślibórz");
    expect(data.data).toBe("30 maja 2026 r.");
    expect(data.sporzadzil).toBe("Jan Kowalski");
    expect(data.stanowisko_suffix).toBe(", Młodszy Asystent");
    expect(data.powod_tytul).toBe("Brak wolnego terminu u odbiorcy");
  });
});
