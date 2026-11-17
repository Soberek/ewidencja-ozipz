import { describe, it, expect } from "vitest";
import { buildEzdTitles } from "./ezdTitles";
import { prepareIzrzData } from "./izrzGenerator";

const action = {
  actionType: "Stoisko edukacyjne",
  title: "Stoisko edukacyjne",
  date: "2026-05-14",
  facilityName: "Szkoła Podstawowa nr 1",
  municipality: "Myślibórz",
  programName: "Trzymaj Formę!",
  izrzSign: "IZRZ: 12/2026",
  jrwaSign: "OZ.966.1.12.2026",
  participantsCount: 20,
};

describe("buildEzdTitles", () => {
  it("builds case, IZRZ and attachment titles in one scheme", () => {
    const data = prepareIzrzData(action, null, { materials: [{ title: "Ulotka", quantity: 20 }] });
    data.hasAttendanceList = true;
    const titles = Object.fromEntries(buildEzdTitles(data).map((t) => [t.id, t.text]));

    expect(titles.case).toBe(
      "Stoisko edukacyjne, dystrybucja – Szkoła Podstawowa nr 1, Myślibórz – Trzymaj Formę! – 14.05.2026"
    );
    expect(titles.izrz).toBe("IZRZ 12/2026 – Stoisko edukacyjne, dystrybucja – Szkoła Podstawowa nr 1, Myślibórz – 14.05.2026");
    expect(titles.attendance).toBe("Potwierdzenie spotkania zał. F/PT/PZ/01/02 – Szkoła Podstawowa nr 1, Myślibórz – 14.05.2026");
    expect(titles.distribution).toContain("Rozdzielnik materiałów zał. F/PT/PZ/01/01");
  });

  it("skips attachments that are not part of the document, the missing program, and a duplicated city", () => {
    const data = prepareIzrzData(
      { ...action, programName: "", izrzSign: "", facilityName: "Przedszkole w Myśliborzu" },
      null
    );
    const titles = buildEzdTitles(data);
    expect(titles.map((t) => t.id)).toEqual(["case", "izrz"]);
    expect(titles[0].text).toBe("Stoisko edukacyjne – Przedszkole w Myśliborzu – 14.05.2026");
    expect(titles[1].text).toMatch(/^IZRZ – /);
  });
});
