import { describe, expect, it } from "vitest";
import { participationFileBaseName, participationFileName, participationFilePreviewType } from "./participation-files";

describe("pliki zgłoszeń", () => {
  it("rozpoznaje pliki z podglądem w aplikacji", () => {
    expect(participationFilePreviewType("Zgłoszenia/2026-2027/skan.PDF")).toBe("application/pdf");
    expect(participationFilePreviewType("Zgłoszenia/2026-2027/zdjęcie.jpeg")).toBe("image/jpeg");
    expect(participationFilePreviewType("Zgłoszenia/2026-2027/deklaracja.docx")).toBeNull();
    expect(participationFilePreviewType("Zgłoszenia/2026-2027/bez-rozszerzenia")).toBeNull();
  });

  it("pokazuje samą nazwę pliku z ścieżki względnej lub źródłowej", () => {
    expect(participationFileName("Zgłoszenia/2026-2027/Program – SP 1.pdf")).toBe("Program – SP 1.pdf");
    expect(participationFileName("C:\\Users\\Jan\\Skany\\deklaracja.pdf")).toBe("deklaracja.pdf");
  });

  it("nazywa kopię programem i placówką", () => {
    expect(participationFileBaseName(" Trzymaj formę! ", "SP nr 1 w Myśliborzu")).toBe("Trzymaj formę! – SP nr 1 w Myśliborzu");
    expect(participationFileBaseName("", "SP nr 1")).toBe("SP nr 1");
  });
});
