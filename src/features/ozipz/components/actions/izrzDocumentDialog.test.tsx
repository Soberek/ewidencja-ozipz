import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PizZip from "pizzip";
import { render, screen, fireEvent } from "@testing-library/react";
import type { OzipzAction, OzipzMaterial } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { generateIzrzDocxBlob, prepareIzrzData } from "../../utils/izrzGenerator";
import { IzrzDocumentDialog } from "./IzrzDocumentDialog";

const prelekcja: OzipzAction = {
  id: "act-main",
  title: "Prelekcja (warsztat)",
  actionType: "Prelekcja (warsztat)",
  date: "2026-07-24",
  facilityName: "Półkolonie w Myśliborzu",
  municipality: "Myślibórz",
  programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
  topic: "inne",
  audienceGroup: "Opiekunowie - 3, Uczestnicy półkolonii - 30",
  jrwaSign: "OZiPZ.966.14.33.2026",
  izrzSign: "87/2026",
  ezdStatus: "w_ezd",
  status: "wykonane",
  participantsCount: 33,
  materialsDistributedCount: 0,
  leadEducator: "Jan Kowalski",
  notes: "Przeprowadzono prelekcję dotyczącą bezpieczeństwa dzieci podczas wypoczynku letniego.",
  createdAt: "2026-07-24",
  updatedAt: "2026-07-24",
};

const dystrybucja: OzipzAction = {
  ...prelekcja,
  id: "act-dist",
  title: "Dystrybucja",
  actionType: "Dystrybucja",
  audienceGroup: "Uczestnicy półkolonii - 1",
  participantsCount: 1,
  materialsDistributedCount: 10,
  materialId: "mat-1",
  linkedActionId: "act-main",
  notes: "Dokonano dystrybucji materiałów.",
};

const material: OzipzMaterial = {
  id: "mat-1",
  title: "Bezpieczne wakacje – ulotka",
  materialType: "ulotka",
  topic: "",
  publisher: "",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const valueOf = (el: HTMLElement) =>
  el instanceof HTMLInputElement && el.type === "number" ? Number(el.value) : (el as HTMLTextAreaElement).value;

describe("IzrzDocumentDialog", () => {
  beforeEach(() => {
    useOzipzDbStore.setState({
      actions: [prelekcja, dystrybucja],
      materials: [material],
      distributions: [],
      facilities: [],
    });
  });

  it("shows the document of the main action with its linked distribution and no indirect recipients", () => {
    render(<IzrzDocumentDialog isOpen onClose={() => {}} action={dystrybucja} />);

    expect(screen.getByText(/IZRZ opisuje to działanie główne/)).toBeTruthy();
    expect(valueOf(screen.getByLabelText("Liczba osób objętych zadaniem"))).toBe(33);
    expect(valueOf(screen.getByLabelText("Grupa docelowa"))).toBe("Opiekunowie - 3\nUczestnicy półkolonii - 30");
    expect(valueOf(screen.getByLabelText("Uwagi"))).toBe(
      "Przekazano materiały edukacyjne: Bezpieczne wakacje – ulotka – 10 szt."
    );
    expect(screen.getByText(/2\. Rozdzielnik materiałów|1\. Rozdzielnik materiałów/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/pośredn/i);
  });

  it("lets the user edit the sheet and restore the data from the action", () => {
    render(<IzrzDocumentDialog isOpen onClose={() => {}} action={prelekcja} />);

    const description = screen.getByLabelText("Zakres czynności");
    fireEvent.change(description, { target: { value: "" } });
    expect(screen.getByText("Uzupełnij zakres czynności wykonanych (pkt 6).")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Przywróć dane z działania/ }));
    expect(valueOf(screen.getByLabelText("Zakres czynności"))).toBe(prelekcja.notes);
    expect(screen.queryByRole("button", { name: /Przywróć dane z działania/ })).toBeNull();
  });
});

describe("IZRZ template (public/generate-templates/izrz.docx)", () => {
  it("fills every placeholder of the official template", async () => {
    const template = readFileSync(resolve(process.cwd(), "public/generate-templates/izrz.docx"));
    const data = prepareIzrzData(prelekcja, null, { materials: [{ title: "Ulotka", quantity: 10 }] });
    const blob = await generateIzrzDocxBlob(new Uint8Array(template).buffer, data);

    const xml = new PizZip(await blob.arrayBuffer()).file("word/document.xml")!.asText();
    const text = xml.replace(/<[^>]+>/g, "");
    expect(text).not.toMatch(/[{}]/);
    expect(text).toContain("INFORMACJA DOTYCZĄCA REALIZACJI ZADANIA 87/2026");
    expect(text).toContain("Znak sprawy: OZiPZ.966.14.33.2026");
    expect(text).toContain("Grupa docelowa i liczba osób objętych zadaniem: 33");
    expect(text).toContain("Uczestnicy półkolonii - 30");
    expect(text).not.toMatch(/pośredn/i);
  });
});
