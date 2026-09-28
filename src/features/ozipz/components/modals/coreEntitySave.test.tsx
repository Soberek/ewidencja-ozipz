import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FacilityDialog } from "../facilities/FacilityDialog";
import { ProgramDialog } from "../programs/ProgramDialog";
import type { OzipzFacility, OzipzProgram } from "../../types/ozipz.types";

const facility: OzipzFacility = {
  id: "school-1", name: "Szkoła nr 1", type: "szkola", address: "Szkolna 1",
  city: "Myślibórz", postalCode: "74-300", municipality: "Myślibórz",
  county: "powiat myśliborski", leadingAuthority: "", isComplex: false,
  educationTypes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

const program: OzipzProgram = {
  id: "program-1", code: "TEST", name: "Program szkolny", editionYear: "2026/2027",
  jrwaSymbol: "966.1", targetAudience: "Szkoły", description: "", status: "aktywny",
  participatingSchoolsCount: 0, totalPupilsReached: 0,
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

it("keeps the school form open after a failed save and closes after a retry", async () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn().mockRejectedValueOnce(new Error("Baza niedostępna")).mockResolvedValueOnce(undefined);
  render(<FacilityDialog isOpen onClose={onClose} editingFacility={facility} locationTypes={[]}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  expect(await screen.findByText("Baza niedostępna")).toBeDefined();
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(onUpdate).toHaveBeenCalledTimes(2);
});

it("does not save a school with a blank name", async () => {
  const onUpdate = vi.fn();
  render(<FacilityDialog isOpen onClose={vi.fn()} editingFacility={facility} locationTypes={[]}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  fireEvent.change(screen.getByPlaceholderText(/Szkoła Podstawowa nr 1 im/i), { target: { value: "   " } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

  expect((await screen.findAllByText("Nazwa placówki jest wymagana")).length).toBeGreaterThan(0);
  expect(onUpdate).not.toHaveBeenCalled();
});

it("does not turn a school complex into a standalone school while it has children", async () => {
  const onUpdate = vi.fn();
  const complex = { ...facility, isComplex: true };
  const child = { ...facility, id: "school-2", parentFacilityId: complex.id };
  render(<FacilityDialog isOpen onClose={vi.fn()} editingFacility={complex}
    facilities={[complex, child]} locationTypes={[]}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  fireEvent.click(screen.getByRole("checkbox", { name: /Ta placówka jest/i }));
  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

  expect(await screen.findByText("Najpierw przenieś placówki należące do tego zespołu.")).toBeDefined();
  expect(onUpdate).not.toHaveBeenCalled();
});

it("offers only marked top-level school complexes as parents", () => {
  const complex = { ...facility, id: "complex", name: "Zespół właściwy", isComplex: true };
  const mislabeled = { ...facility, id: "mislabeled", name: "Zespół tylko z nazwy" };
  const nested = { ...complex, id: "nested", name: "Zespół podległy", parentFacilityId: complex.id };
  render(<FacilityDialog isOpen onClose={vi.fn()} editingFacility={facility}
    facilities={[complex, mislabeled, nested]} locationTypes={[]}
    onSave={vi.fn()} onUpdate={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: /Brak \(Placówka samodzielna\)/i }));
  expect(screen.getByText("Zespół właściwy")).toBeDefined();
  expect(screen.queryByText("Zespół tylko z nazwy")).toBeNull();
  expect(screen.queryByText("Zespół podległy")).toBeNull();
});

it("keeps the program form open after a failed save and closes after a retry", async () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn().mockRejectedValueOnce(new Error("Zapis odrzucony")).mockResolvedValueOnce(undefined);
  render(<ProgramDialog isOpen onClose={onClose} editingProgram={program}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  expect(await screen.findByText("Zapis odrzucony")).toBeDefined();
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(onUpdate).toHaveBeenCalledTimes(2);
});
