import { describe, it, expect, vi } from "vitest";
import PizZip from "pizzip";
import {
  prepareIzrzData,
  buildIzrzDocxFileName,
  generateIzrzDocxBlob,
  downloadIzrzDocx,
  getIzrzWarnings,
  composeIzrzRemarks,
  formatIzrzMaterials,
  isIzrzDraftNumber,
  IZRZ_DRAFT_NUMBER,
} from "./izrzGenerator";
import type { OzipzAction, OzipzFacility } from "../types/ozipz.types";

function createMinimalDocxTemplate(content = "{znak_sprawy} - {numer_izrz} - {nazwa_programu}"): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>'
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>'
  );
  zip.file(
    "word/document.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body><w:p><w:r><w:t>${content}</w:t></w:r></w:p></w:body>` +
    '</w:document>'
  );
  return zip.generate({ type: "arraybuffer" });
}

describe("IZRZ Generator (edu-report-v3 standard)", () => {
  const dummyAction: OzipzAction = {
    id: "act-1",
    title: "Prelekcja o zdrowym żywieniu",
    actionType: "Prelekcja (warsztat)",
    date: "2026-05-14",
    facilityName: "Szkoła Podstawowa nr 1 im. Tadeusza Kościuszki",
    facilityId: "fac-1",
    municipality: "Myślibórz",
    programName: "Trzymaj Formę!",
    programId: "prog-tf",
    topic: "zdrowe_zywienie",
    audienceGroup: "Uczniowie kl. 7A (13-14 lat) - 22, Uczniowie kl. 7B (13-14 lat) - 20",
    status: "wykonane",
    ezdStatus: "w_ezd",
    participantsCount: 42,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 42,
    leadEducator: "Krzysztof Palpuchowski",
    notes: "Przeprowadzono warsztat edukacyjny z wykorzystaniem piramidy żywienia.",
    jrwaSign: "OZ.966.1.12.2026",
    izrzSign: "IZRZ: 12/2026",
    createdAt: "2026-05-14T10:00:00Z",
    updatedAt: "2026-05-14T10:00:00Z",
  };

  const dummyFacility: OzipzFacility = {
    id: "fac-1",
    name: "Szkoła Podstawowa nr 1 im. Tadeusza Kościuszki",
    type: "szkola_podstawowa",
    address: "ul. Kombatantów 1",
    city: "Myślibórz",
    postalCode: "74-300",
    municipality: "Myślibórz",
    county: "Myśliborski",
    leadingAuthority: "Gmina Myślibórz",
    isComplex: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("prepares complete IzrzGeneratorData matching edu-report standard", () => {
    const data = prepareIzrzData(dummyAction, dummyFacility);

    expect(data.caseNumber).toBe("OZiPZ.966.1.12.2026");
    expect(data.reportNumber).toBe("12/2026");
    expect(data.programName).toBe("Trzymaj Formę!");
    expect(data.taskType).toBe("Prelekcja (warsztat)");
    expect(data.city).toBe("Myślibórz");
    expect(data.address).toContain("ul. Kombatantów 1");
    expect(data.address).toContain("74-300 Myślibórz");
    expect(data.dateIso).toBe("2026-05-14");
    expect(data.dateFormatted).toBe("14.05.2026");
    expect(data.viewerCount).toBe(42);
    expect(data.viewerCountDescription).toBe(
      "Uczniowie kl. 7A (13-14 lat) - 22\nUczniowie kl. 7B (13-14 lat) - 20"
    );
    expect(data.taskDescription).toBe(
      "Przeprowadzono warsztat edukacyjny z wykorzystaniem piramidy żywienia."
    );
    expect(data.hasDistributionList).toBe(true);
    expect(data.leadEducator).toBe("Krzysztof Palpuchowski");
  });

  it("uses the local day in a report when the action has no date", () => {
    vi.stubEnv("TZ", "Europe/Warsaw");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T23:30:00Z"));
      const data = prepareIzrzData({ title: "Projekt", date: "" });
      expect(data.dateIso).toBe("2026-01-02");
      expect(data.dateFormatted).toBe("02.01.2026");
      expect(buildIzrzDocxFileName(data)).toContain("2026-01-02");
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });

  it("handles fallback address and leaves missing description empty instead of inventing text", () => {
    const actionWithoutFacility: Partial<OzipzAction> = {
      title: "Spotkanie z mieszkańcami",
      municipality: "Barlinek",
      participantsCount: 15,
      date: "2026-06-20",
    };

    const data = prepareIzrzData(actionWithoutFacility, null);
    expect(data.city).toBe("Barlinek");
    expect(data.address).toBe("Placówka nieokreślona, 74-320 Barlinek");
    expect(data.taskDescription).toBe("");
    expect(data.viewerCountDescription).toBe("Uczestnicy - 15");
    expect(data.hasDistributionList).toBe(false);
    expect(getIzrzWarnings(data)).toContain("Uzupełnij zakres czynności wykonanych (pkt 6).");
  });

  it("handles village facilities like Rataje with header locality and postal town address", () => {
    const ratajeAction: Partial<OzipzAction> = {
      title: "Warsztaty w szkole",
      facilityName: "Szkoła Podstawowa w Ratajach",
      municipality: "Myślibórz",
      date: "2026-09-29",
      participantsCount: 30,
    };
    const ratajeFacility: OzipzFacility = {
      id: "fac-rataje",
      name: "Szkoła Podstawowa w Ratajach",
      type: "szkola_podstawowa",
      address: "Rataje 25",
      city: "Rataje",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "Myśliborski",
      leadingAuthority: "Gmina Myślibórz",
      isComplex: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const data = prepareIzrzData(ratajeAction, ratajeFacility);
    expect(data.city).toBe("Rataje");
    expect(data.address).toBe("Szkoła Podstawowa w Ratajach, Rataje 25, 74-300 Myślibórz");
  });

  it("builds authentic IZRZ docx file name matching edu-report scheme", () => {
    const data = prepareIzrzData(dummyAction, dummyFacility);
    const fileName = buildIzrzDocxFileName(data);

    expect(fileName).toMatch(/^IZRZ_12-2026_2026-05-14_Mysliborz_Trzymaj-Forme\.docx$/);
  });

  it("generates valid Word docx Blob from template and data", async () => {
    const templateBuffer = createMinimalDocxTemplate(
      "{znak_sprawy} - {numer_izrz} - {nazwa_programu} - {liczba_osob}"
    );

    const data = prepareIzrzData(dummyAction, dummyFacility);
    data.hasAttendanceList = true;
    data.hasDistributionList = true;

    const blob = await generateIzrzDocxBlob(templateBuffer, data);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("downloads IZRZ docx by fetching template and triggering download", async () => {
    const templateBuffer = createMinimalDocxTemplate("{znak_sprawy}");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => templateBuffer,
    } as Response);

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = () => "";
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = () => {};
    }

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === "a") el.click = clickMock;
      return el;
    });

    const fileName = await downloadIzrzDocx(prepareIzrzData(dummyAction, dummyFacility));
    expect(fileName).toMatch(/^IZRZ_/);
    expect(clickMock).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("throws descriptive error when IZRZ template fetch fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
    } as Response);

    await expect(downloadIzrzDocx(prepareIzrzData(dummyAction, dummyFacility))).rejects.toThrow(
      "Brak szablonu IZRZ w aplikacji (/generate-templates/izrz.docx)."
    );

    fetchSpy.mockRestore();
  });

  it("marks a document without IZRZ number as draft and never mentions indirect recipients", () => {
    const draftAction: Partial<OzipzAction> = {
      title: "Pogadanka o zdrowiu",
      actionType: "Prelekcja",
      date: "2026-06-10",
      participantsCount: 30,
      indirectRecipientsCount: 50,
      audienceGroup: "Młodzież",
      materialsDistributedCount: 30,
    };

    const data = prepareIzrzData(draftAction, null, {
      materials: [{ title: "Ulotka Profilaktyka Tytoniowa", quantity: 30 }],
    });
    expect(data.reportNumber).toBe(IZRZ_DRAFT_NUMBER);
    expect(isIzrzDraftNumber(data.reportNumber)).toBe(true);
    expect(buildIzrzDocxFileName(data)).toMatch(/^IZRZ_PROJEKT_2026-06-10_/);
    expect(data.viewerCount).toBe(30);
    expect(data.viewerCountDescription).toBe("Młodzież - 30");
    expect(JSON.stringify(data)).not.toMatch(/pośredn/i);
    expect(data.additionalInfo).toBe("Przekazano materiały edukacyjne: Ulotka Profilaktyka Tytoniowa – 30 szt.");
  });

  it("renders every template field, with line breaks and attachment list, into the docx", async () => {
    const templateBuffer = createMinimalDocxTemplate(
      "{numer_izrz}|{liczba_osob}|{liczba_osob_opis}|{dodatkowe_informacje}"
    );
    const data = prepareIzrzData(
      {
        ...dummyAction,
        numberOfActions: 2,
        audienceGroup:
          "Grupa 1: Uczniowie szkół podstawowych - 20, Kadra pedagogiczna - 2; Grupa 2: Uczniowie szkół podstawowych - 20",
      },
      dummyFacility,
      { materials: [{ title: "Ulotka", quantity: 42 }] }
    );
    data.hasAttendanceList = true;

    const blob = await generateIzrzDocxBlob(templateBuffer, data);
    const zip = new PizZip(await blob.arrayBuffer());
    const xml = zip.file("word/document.xml")!.asText();
    const text = xml.replace(/<w:br\/>/g, "\n").replace(/<[^>]+>/g, "");

    expect(text).toContain("12/2026|42|");
    expect(text).toContain("Prelekcja 1:\nUczniowie szkół podstawowych - 20\nKadra pedagogiczna - 2\nPrelekcja 2:");
    expect(text).toContain("Załączniki:\n1. Potwierdzenie spotkania zał. F/PT/PZ/01/02\n2. Rozdzielnik materiałów zał. F/PT/PZ/01/01");
  });

  it("composes remarks and reports inconsistencies before generation", () => {
    const data = prepareIzrzData({ ...dummyAction, audienceGroup: "Uczniowie - 20, Nauczyciele - 2" }, dummyFacility);
    expect(getIzrzWarnings(data)).toContain(
      "Suma liczebności grup (22) różni się od liczby osób objętych zadaniem (42)."
    );
    expect(composeIzrzRemarks({ ...data, additionalInfo: "", hasDistributionList: false })).toBe("");
    expect(formatIzrzMaterials([{ title: "A", quantity: 2 }, { title: "B", quantity: 3 }])).toBe(
      "Przekazano materiały edukacyjne (łącznie 5 szt.):\n- A – 2 szt.\n- B – 3 szt."
    );
    expect(formatIzrzMaterials([{ title: "", quantity: 7 }])).toBe("Przekazano materiały edukacyjne – 7 szt.");
  });

  it("does not use a dictionary code or the action form as intervention name", () => {
    expect(
      prepareIzrzData({ title: "Prelekcja (warsztat)", actionType: "Prelekcja (warsztat)", topic: "inne" }).programName
    ).toBe("");
    expect(
      prepareIzrzData({ title: "Stoisko", actionType: "Stoisko edukacyjno-informacyjne", campaignName: "Bezpieczne Wakacje" })
        .programName
    ).toBe("Bezpieczne Wakacje");
  });
});
