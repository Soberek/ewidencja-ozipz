import { describe, expect, it } from "vitest";
import { buildAttendanceListHtml } from "./attendanceListPrint";

describe("buildAttendanceListHtml", () => {
  it("wypełnia datę, program i instytucję", () => {
    const html = buildAttendanceListHtml({
      programName: "Profilaktyka chorób zakaźnych (Podstępne WZW, Jesień bez infekcji)",
      date: "2026-09-28",
      institution: "Szkoła Podstawowa nr 3 w Myśliborzu, ul. Lipowa 18a, 74-300 Myślibórz",
    });

    expect(html).toContain("w dniu 28.09.2026 r. w ramach:");
    expect(html).toContain("Profilaktyka chorób zakaźnych (Podstępne WZW, Jesień bez infekcji)");
    expect(html).toContain("ul. Lipowa 18a, 74-300 Myślibórz");
    expect(html).toContain("F/PT/PZ/01/01");
    expect(html).toContain("size: A4 portrait");
  });

  it("zostawia kropki zamiast daty i escapuje tekst", () => {
    const html = buildAttendanceListHtml({ programName: "<b>X</b>", institution: "Linia 1\nLinia 2" });

    expect(html).toContain("w dniu ............ w ramach:");
    expect(html).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(html).toContain("Linia 1<br>Linia 2");
  });
});
