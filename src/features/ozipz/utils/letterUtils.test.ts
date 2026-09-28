import { describe, it, expect } from "vitest";
import {
  oneSentencePismoSummary,
  ensurePismoDotyczy,
  uwagiZZalacznikow,
  PISMA_ORG_DEFAULTS,
} from "./letterUtils";

describe("letterUtils", () => {
  it("should summarize text to first complete sentence", () => {
    const text = "Dotyczy organizacji programu profilaktyki tytoniowej w szkołach. Prosimy o wyznaczenie koordynatora szkolnego. W załączeniu przesyłamy deklaracje.";
    expect(oneSentencePismoSummary(text)).toBe("Dotyczy organizacji programu profilaktyki tytoniowej w szkołach.");
  });

  it("should ensure subject is set from text if missing", () => {
    const item: { dotyczy?: string; tresc: string } = { tresc: "Informacja o szkoleniu dla nauczycieli w dniu 12 maja." };
    const withDotyczy = ensurePismoDotyczy(item);
    expect(withDotyczy?.dotyczy).toBe("Informacja o szkoleniu dla nauczycieli w dniu 12 maja.");
    expect(withDotyczy?.dotyczy_fallback).toBe(true);
  });

  it("should format attachment notes", () => {
    const notes = uwagiZZalacznikow(["Deklaracja uczestnictwa", "Harmonogram spotkań"]);
    expect(notes).toContain("Załączniki:");
    expect(notes).toContain("1. Deklaracja uczestnictwa");
    expect(notes).toContain("2. Harmonogram spotkań");
  });

  it("should provide PSSE Myślibórz organizational defaults", () => {
    expect(PISMA_ORG_DEFAULTS.skrocona_nazwa_komorki).toBe("OZiPZ");
    expect(PISMA_ORG_DEFAULTS.nadawca).toContain("Państwowy Powiatowy Inspektor Sanitarny w Myśliborzu");
  });
});
