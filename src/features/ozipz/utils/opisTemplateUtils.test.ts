import { describe, it, expect } from "vitest";
import {
  opisSpecificity,
  dopasujOpis,
  renderOpis,
} from "./opisTemplateUtils";

describe("opisTemplateUtils", () => {
  it("should calculate template specificity correctly", () => {
    expect(opisSpecificity({ jrwa: "966.1", dzialanie_id: "1" })).toBe(6);
    expect(opisSpecificity({ jrwa: "966.1", dzialanie_id: null })).toBe(4);
    expect(opisSpecificity({ jrwa: null, dzialanie_id: "1" })).toBe(2);
    expect(opisSpecificity({ jrwa: null, dzialanie_id: null })).toBe(0);
  });

  it("should match best template by specificity and range", () => {
    const templates = [
      { id: "1", jrwa: "966.1", dzialanie_id: null, liczba_od: 1, liczba_do: 10, opis: "Ogólny" },
      { id: "2", jrwa: "966.1", dzialanie_id: "5", liczba_od: 1, liczba_do: 5, opis: "Specyficzny" },
    ];

    const match = dopasujOpis(templates, { jrwa: "966.1", dzialanie_id: "5", liczba_dzialan: 2 });
    expect(match?.id).toBe("2");

    const matchFallback = dopasujOpis(templates, { jrwa: "966.1", dzialanie_id: "9", liczba_dzialan: 2 });
    expect(matchFallback?.id).toBe("1");
  });

  it("should render template placeholders accurately", () => {
    const tpl = "Przeprowadzono {liczba} {dzialanie} w ramach programu {program} w {lokalizacja}. Liczba osób: {liczba_osob}.";
    const rendered = renderOpis(tpl, {
      liczba: 2,
      dzialanie: "prelekcje",
      program: "Trzymaj Formę!",
      lokalizacja: "SP 1 Myślibórz",
      liczba_osob: 45,
    });

    expect(rendered).toBe("Przeprowadzono 2 prelekcje w ramach programu Trzymaj Formę! w SP 1 Myślibórz. Liczba osób: 45.");
  });
});
