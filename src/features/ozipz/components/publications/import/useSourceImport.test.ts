import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";
import type { ScrapedPublication } from "../sources/importTypes";
import { useSourceImport } from "./useSourceImport";
import { importPublicationRows } from "./importExecution";
import { toImportRow } from "./importRows";

const mockAddPublication = vi.fn();
const mockUpdatePublication = vi.fn();
const mockAddAction = vi.fn();
const mockDeleteAction = vi.fn();
const mockPublications: Partial<OzipzPublication>[] = [];
const mockActions: Partial<OzipzAction>[] = [];

vi.mock("../../../store/useOzipzDbStore", () => ({
  usePublications: () => ({
    publications: mockPublications,
    addPublication: mockAddPublication,
    updatePublication: mockUpdatePublication,
  }),
  useActions: () => ({ actions: mockActions, addAction: mockAddAction, deleteAction: mockDeleteAction }),
  usePrograms: () => ({ programs: [{ id: "prog-1", name: "Trzymaj Formę", jrwaSymbol: "966.1" }] }),
  useStaff: () => ({ staff: [{ id: "s1", fullName: "Jan Kowalski" }] }),
}));

const govItem = (slug: string, title: string, over: Partial<ScrapedPublication> = {}): ScrapedPublication => ({
  key: `gov.pl/web/psse-mysliborz/${slug}`,
  source: "gov",
  date: "2026-08-10",
  title,
  url: `https://www.gov.pl/web/psse-mysliborz/${slug}`,
  finalUrl: `https://www.gov.pl/web/psse-mysliborz/${slug}`,
  external: false,
  topic: "Szczepienia",
  suggestedJrwa: "9011",
  ...over,
});

const xItem: ScrapedPublication = {
  key: "x:2088667997883732462",
  source: "x",
  date: "2026-08-15",
  title: "Zdrowe odżywianie w szkole",
  text: "Zdrowe odżywianie w szkole – sprawdź zasady.",
  url: "https://x.com/PSSEMysliborz/status/2088667997883732462",
  finalUrl: "https://x.com/PSSEMysliborz/status/2088667997883732462",
  external: false,
  programId: "prog-1",
  programName: "Trzymaj Formę",
  topic: "Trzymaj Formę",
  suggestedJrwa: "966.1",
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockPublications.length = 0;
  mockActions.length = 0;
  mockAddAction.mockResolvedValue({ id: "act-new" });
  mockAddPublication.mockResolvedValue({ id: "pub-new" });
  mockDeleteAction.mockResolvedValue(undefined);
  mockUpdatePublication.mockResolvedValue(undefined);
});

describe("useSourceImport", () => {
  it("imports new gov.pl articles as publication + 'Publikacja media (Strona)' action", async () => {
    const { result } = renderHook(() => useSourceImport("gov"));
    act(() => result.current.addItems([govItem("artykul-1", "Komunikat PSSE o szczepieniach")]));

    expect(result.current.rows[0].status).toBe("new");
    expect(result.current.selectedRows).toHaveLength(1);

    await act(() => result.current.importSelected());

    const actionPayload = mockAddAction.mock.calls[0][0];
    expect(actionPayload.actionType).toBe("Publikacja media (Strona)");
    expect(actionPayload.facilityName).toBe("PSSE Myślibórz (media / publikacja internetowa)");
    expect(actionPayload.participantsCount).toBe(0);
    expect(actionPayload.jrwaCaseId).toBeUndefined();
    expect(mockAddPublication.mock.calls[0][0]).toMatchObject({
      actionId: "act-new",
      link: "https://www.gov.pl/web/psse-mysliborz/artykul-1",
      channel: "Strona www PSSE Myślibórz (gov.pl)",
    });
  });

  it("imports X posts with 'Publikacja media (Portal X)' and the program from the dictionary", async () => {
    const { result } = renderHook(() => useSourceImport("x"));
    act(() => result.current.addItems([xItem]));
    await act(() => result.current.importSelected());

    const actionPayload = mockAddAction.mock.calls[0][0];
    expect(actionPayload.actionType).toBe("Publikacja media (Portal X)");
    expect(actionPayload.facilityName).toBe("Portal X (@PSSEMysliborz)");
    expect(actionPayload.programId).toBe("prog-1");
    expect(actionPayload.programName).toBe("Trzymaj Formę");
  });

  it("rolls back the action when saving the publication fails", async () => {
    mockAddPublication.mockRejectedValueOnce(new Error("Błąd bazy"));
    const { result } = renderHook(() => useSourceImport("x"));
    act(() => result.current.addItems([xItem]));
    await act(() => result.current.importSelected());

    expect(mockDeleteAction).toHaveBeenCalledWith("act-new");
    expect(result.current.selectedRows).toHaveLength(1);
  });

  it("blocks a post whose link is already saved (also under twitter.com)", () => {
    mockPublications.push({ id: "p1", title: "x", channel: "Portal X", publicationDate: "2026-08-15", link: "https://twitter.com/PSSEMysliborz/status/2088667997883732462" });
    const { result } = renderHook(() => useSourceImport("x"));
    act(() => result.current.addItems([xItem]));

    expect(result.current.rows[0].status).toBe("linked");
    expect(result.current.rows[0].selectable).toBe(false);
    act(() => result.current.toggleRow(xItem.key, true));
    expect(result.current.selectedRows).toHaveLength(0);
  });

  it("flags historical actions without link as 'probable', does not preselect, and links instead of duplicating", async () => {
    mockActions.push({ id: "a-old", title: "Publikacja media (Strona)", notes: "Kleszcze: małe, ale groźne!", actionType: "Publikacja media (Strona)", date: "2026-08-05", topic: "Kleszcze", leadEducator: "Anna Nowak" });
    const { result } = renderHook(() => useSourceImport("gov"));
    act(() => result.current.addItems([govItem("kleszcze", "Kleszcze: małe, ale groźne!", { date: "2026-08-05" })]));

    const row = result.current.rows[0];
    expect(row.status).toBe("probable");
    expect(row.match?.entry.id).toBe("a-old");
    expect(row.selected).toBe(false);

    await act(() => result.current.linkToExisting(row.key));
    expect(mockAddAction).not.toHaveBeenCalled();
    expect(mockAddPublication.mock.calls[0][0]).toMatchObject({
      actionId: "a-old",
      link: "https://www.gov.pl/web/psse-mysliborz/kleszcze",
      publicationDate: "2026-08-05",
      author: "Anna Nowak",
    });

    act(() => result.current.toggleRow(row.key, true));
    expect(result.current.selectedRows).toHaveLength(1);
  });

  it("never offers redirected articles of other units for import", () => {
    const { result } = renderHook(() => useSourceImport("gov"));
    act(() => result.current.addItems([govItem("jesien", "Jesień bez infekcji", { external: true, finalUrl: "https://www.gov.pl/web/gis/jesien" })]));
    expect(result.current.rows[0].status).toBe("external");
    expect(result.current.visibleRows).toHaveLength(0); // domyślny filtr „Do decyzji”
    act(() => result.current.setStatusFilter("all"));
    expect(result.current.visibleRows).toHaveLength(1);
  });

  it("remembers skipped items and migrates the previous 'already imported' list", () => {
    localStorage.setItem("ozipz_gov_manual_imported_urls", JSON.stringify(["https://www.gov.pl/web/psse-mysliborz/stary/"]));
    const { result } = renderHook(() => useSourceImport("gov"));
    act(() => result.current.addItems([govItem("stary", "Stary wpis"), govItem("nowy", "Nowy wpis")]));
    expect(result.current.rows.map((r) => r.status)).toEqual(["skipped", "new"]);

    act(() => result.current.setSkippedKeys([govItem("nowy", "").key], true));
    expect(JSON.parse(localStorage.getItem("ozipz_gov_skipped_publications") || "[]")).toContain("gov.pl/web/psse-mysliborz/nowy");
    act(() => result.current.setSkippedKeys([govItem("stary", "").key], false));
    expect(result.current.rows.find((r) => r.title === "Stary wpis")?.status).toBe("new");
  });

  it("ignores a second import click while the first save is running", async () => {
    let finishAction: (value: { id: string }) => void = () => {};
    mockAddAction.mockImplementationOnce(() => new Promise((resolve) => (finishAction = resolve)));
    const { result } = renderHook(() => useSourceImport("x"));
    act(() => result.current.addItems([xItem]));

    await act(async () => {
      const first = result.current.importSelected();
      const second = result.current.importSelected();
      expect(mockAddAction).toHaveBeenCalledTimes(1);
      finishAction({ id: "act-new" });
      await Promise.all([first, second]);
    });
    expect(mockAddPublication).toHaveBeenCalledTimes(1);
  });
});

it("reports only completed rows when a later import fails", async () => {
  const rows = [govItem("artykul-1", "Artykuł 1"), govItem("artykul-2", "Artykuł 2")].map(toImportRow);
  const addAction = vi.fn().mockResolvedValueOnce({ id: "act-1" }).mockResolvedValueOnce({ id: "act-2" });
  const addPublication = vi.fn().mockResolvedValueOnce({ id: "pub-1" }).mockRejectedValueOnce(new Error("Błąd bazy"));
  const deleteAction = vi.fn().mockResolvedValue(undefined);
  const onImported = vi.fn();

  await expect(importPublicationRows(rows, "", [], { addAction, addPublication, deleteAction }, onImported)).rejects.toThrow("Błąd bazy");

  expect(onImported).toHaveBeenCalledExactlyOnceWith(rows[0].key);
  expect(deleteAction).toHaveBeenCalledExactlyOnceWith("act-2");
  expect(addPublication.mock.calls.map(([publication]) => publication.actionId)).toEqual(["act-1", "act-2"]);
});
