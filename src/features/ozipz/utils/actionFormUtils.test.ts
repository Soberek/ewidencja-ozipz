import { describe, it, expect } from "vitest";
import { resolveActivityFormLabel } from "./actionFormUtils";

describe("actionFormUtils", () => {
  describe("resolveActivityFormLabel", () => {
    it("preserves and standardizes official dictionary activity types", () => {
      expect(resolveActivityFormLabel({ actionType: "Publikacja media (Portal X)" })).toBe("Publikacja media (Portal X)");
      expect(resolveActivityFormLabel({ actionType: "Publikacja media (Facebook)" })).toBe("Publikacja media (Facebook)");
      expect(resolveActivityFormLabel({ actionType: "Publikacja media (Strona)" })).toBe("Publikacja media (Strona)");
      expect(resolveActivityFormLabel({ actionType: "Prelekcja (warsztat)" })).toBe("Prelekcja (warsztat)");
      expect(resolveActivityFormLabel({ actionType: "Wykład" })).toBe("Wykład");
      expect(resolveActivityFormLabel({ actionType: "Stoisko edukacyjno-informacyjne" })).toBe("Stoisko edukacyjno-informacyjne");
      expect(resolveActivityFormLabel({ actionType: "Dystrybucja" })).toBe("Dystrybucja");
      expect(resolveActivityFormLabel({ actionType: "Konkurs (quiz)" })).toBe("Konkurs (quiz)");
      expect(resolveActivityFormLabel({ actionType: "Pismo (list intencyjny)" })).toBe("Pismo (list intencyjny)");
      expect(resolveActivityFormLabel({ actionType: "Rozmowa indywidualna (instruktaż)" })).toBe("Rozmowa indywidualna (instruktaż)");
      expect(resolveActivityFormLabel({ actionType: "Szkolenie" })).toBe("Szkolenie");
      expect(resolveActivityFormLabel({ actionType: "Narada" })).toBe("Narada");
      expect(resolveActivityFormLabel({ actionType: "Happening (przemarsz, gra, event)" })).toBe("Happening (przemarsz, gra, event)");
      expect(resolveActivityFormLabel({ actionType: "Sprawozdanie (z programu, miernik, tytoń)" })).toBe("Sprawozdanie (z programu, miernik, tytoń)");
    });

    it("maps shorthand and legacy variants to standard dictionary forms", () => {
      expect(resolveActivityFormLabel({ actionType: "prelekcja" })).toBe("Prelekcja (warsztat)");
      expect(resolveActivityFormLabel({ actionType: "warsztat" })).toBe("Prelekcja (warsztat)");
      expect(resolveActivityFormLabel({ actionType: "pogadanka" })).toBe("Prelekcja (warsztat)");
      expect(resolveActivityFormLabel({ actionType: "wyklad" })).toBe("Wykład");
      expect(resolveActivityFormLabel({ actionType: "Stoisko edukacyjno-informacyjne OZiPZ" })).toBe("Stoisko edukacyjno-informacyjne");
      expect(resolveActivityFormLabel({ actionType: "Dystrybucja materiałów oświatowo-zdrowotnych" })).toBe("Dystrybucja");
      expect(resolveActivityFormLabel({ actionType: "Dystrybucja materiałów" })).toBe("Dystrybucja");
      expect(resolveActivityFormLabel({ actionType: "instruktaż" })).toBe("Rozmowa indywidualna (instruktaż)");
      expect(resolveActivityFormLabel({ actionType: "konkurs" })).toBe("Konkurs (quiz)");
      expect(resolveActivityFormLabel({ actionType: "pismo" })).toBe("Pismo (list intencyjny)");
    });

    it("never returns raw tweet content, program names, or abbreviations as action form", () => {
      // Raw tweet content
      const tweetAction = {
        title: "Jasne, zwłaszcza białe ubrania, odbijają więcej promieniowania słonecznego niż ciemne... ☀️ #Lato #Upał https://t.co/xyz",
        actionType: "Publikacja media (Portal X)",
      };
      expect(resolveActivityFormLabel(tweetAction)).toBe("Publikacja media (Portal X)");

      // Abbreviation in title
      const bwAction = {
        title: "BW",
        actionType: "Publikacja media (Facebook)",
      };
      expect(resolveActivityFormLabel(bwAction)).toBe("Publikacja media (Facebook)");

      // Program name in title
      const progTitleAction = {
        title: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego na terenie powiatu myśliborskiego",
        actionType: "Publikacja media (Facebook)",
      };
      expect(resolveActivityFormLabel(progTitleAction)).toBe("Publikacja media (Facebook)");
    });

    it("infers activity form when actionType is missing but title/context contains clear cues", () => {
      expect(resolveActivityFormLabel({ title: "Post na Twitterze o kleszczach #BezpieczneWakacje" })).toBe("Publikacja media (Portal X)");
      expect(resolveActivityFormLabel({ title: "Post na Facebooku o słońcu" })).toBe("Publikacja media (Facebook)");
      expect(resolveActivityFormLabel({ title: "Artykuł na stronie gov.pl o bezpiecznych feriach" })).toBe("Publikacja media (Strona)");
      expect(resolveActivityFormLabel({ title: "Stoisko profilaktyczne na festynie" })).toBe("Stoisko edukacyjno-informacyjne");
      expect(resolveActivityFormLabel({ title: "Wykład dla seniorów" })).toBe("Wykład");
      expect(resolveActivityFormLabel({ title: "Prelekcja o kleszczach w szkole" })).toBe("Prelekcja (warsztat)");
      expect(resolveActivityFormLabel({ title: "Rozdanie ulotek na rynku" })).toBe("Dystrybucja");
    });

    it("handles fallback cleanly without leaking arbitrary text", () => {
      expect(resolveActivityFormLabel(null)).toBe("Inna forma");
      expect(resolveActivityFormLabel(undefined)).toBe("Inna forma");
      expect(resolveActivityFormLabel({ title: "Nietypowa akcja bez formy" })).toBe("Inna forma");
    });
  });
});
