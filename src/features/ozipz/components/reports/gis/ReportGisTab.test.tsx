import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import type { OzipzAction, OzipzDictionaryItem } from "../../../types/ozipz.types";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";
import { ReportGisTab } from "./ReportGisTab";

function action(id: string, overrides: Partial<OzipzAction>): OzipzAction {
  return {
    id,
    title: "Działanie",
    actionType: "Prelekcja (warsztat)",
    date: "2026-08-10",
    facilityName: "Szkoła Podstawowa nr 1",
    municipality: "Myślibórz",
    topic: "",
    audienceGroup: "Uczniowie szkół podstawowych",
    ezdStatus: "",
    status: "wykonane",
    participantsCount: 0,
    indirectRecipientsCount: 0,
    materialsDistributedCount: 0,
    leadEducator: "Jan Kowalski",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

const actions = [
  action("a1", { jrwaSign: "OZiPZ.966.6.1.2026", programName: "Profilaktyka substancji psychoaktywnych", participantsCount: 25 }),
  action("a2", { jrwaSign: "OZiPZ.966.18.1.2026", programName: "#MłodziŚwiadomi", participantsCount: 30, indirectRecipientsCount: 4 }),
  action("a3", { jrwaSign: "OZiPZ.966.16.1.2026", programName: "Promocja zdrowia psychicznego", participantsCount: 10 }),
];

function rowValue(label: RegExp): HTMLElement {
  const row = screen.getByText(label).closest("div.border-b") as HTMLElement;
  return row;
}

describe("ReportGisTab", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    useOzipzDbStore.setState({ dictionaryItems: [] });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("shows the report for the active area and program type", () => {
    render(<ReportGisTab actions={actions} facilities={[]} year={2026} months={[7, 8, 9]} />);

    expect(screen.getByText(/Lipiec–Wrzesień 2026/)).toBeDefined();
    expect(screen.getByText(/PROFILAKTYKA UZALEŻNIEŃ – PROGRAMOWE/)).toBeDefined();
    expect(within(rowValue(/^4\. Liczba odbiorców/)).getByText("0")).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: /NIEPROGRAMOWE/ }));
    expect(within(rowValue(/^4\. Liczba odbiorców/)).getByText("25")).toBeDefined();
    expect(within(rowValue(/^14\. Liczba prelekcji/)).getByText("1")).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: /STI/ }));
    expect(screen.getByText(/STI \(INFEKCJE PRZENOSZONE DROGĄ PŁCIOWĄ\) – PROGRAMOWE/)).toBeDefined();
    expect(within(rowValue(/^4\. Liczba odbiorców/)).getByText("34")).toBeDefined();
  });

  it("uses the GIS category configured in the dictionary", () => {
    const override: OzipzDictionaryItem = {
      id: "dict-966-16",
      dictType: "jrwaSymbol",
      code: "966.16",
      label: "Promocja Zdrowia Psychicznego",
      kind: "NIEPROGRAMOWE",
      gisCategory: "uzaleznienia",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    useOzipzDbStore.setState({ dictionaryItems: [override] });

    render(<ReportGisTab actions={actions} facilities={[]} year={2026} months={[7, 8, 9]} />);
    fireEvent.click(screen.getByRole("tab", { name: /NIEPROGRAMOWE/ }));
    expect(within(rowValue(/^4\. Liczba odbiorców/)).getByText("35")).toBeDefined();
  });

  it("marks visitation conclusions as manual and copies values to the clipboard", async () => {
    render(<ReportGisTab actions={actions} facilities={[]} year={2026} months={[7, 8, 9]} />);

    expect(screen.getAllByText("Do sprawdzenia samemu")).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: /NIEPROGRAMOWE/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kopiuj: 4\. Liczba odbiorców/ }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("25"));
  });

  it("shows an empty-period message when there are no actions", () => {
    render(<ReportGisTab actions={[]} facilities={[]} year={2026} months={[1, 2, 3]} />);
    expect(screen.getByText(/Brak działań w wybranym okresie/)).toBeDefined();
  });
});
