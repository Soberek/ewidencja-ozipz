import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MaterialDialog } from "../materials/MaterialDialog";
import { DistributionDialog } from "../materials/DistributionDialog";
import { MaterialsSection } from "../materials/MaterialsSection";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import type { OzipzDistribution, OzipzFacility, OzipzMaterial } from "../../types/ozipz.types";

const material: OzipzMaterial = {
  id: "material-1", title: "Plakat profilaktyczny", materialType: "Plakat", topic: "",
  publisher: "", createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

const facility: OzipzFacility = {
  id: "facility-1", name: "Szkoła A", type: "szkola", address: "Szkolna 1",
  city: "Myślibórz", postalCode: "74-300", municipality: "Myślibórz",
  county: "powiat myśliborski", leadingAuthority: "", isComplex: false,
  educationTypes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

const distribution: OzipzDistribution = {
  id: "distribution-1", materialId: material.id, materialTitle: material.title,
  materialType: material.materialType, facilityId: facility.id, recipientName: facility.name,
  municipality: facility.municipality, quantity: 10, distributionDate: "2026-10-01",
  assignedEducator: "", purpose: "", createdAt: "2026-10-01", updatedAt: "2026-10-01",
};

it("keeps material form and values for retry after save fails", async () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn().mockRejectedValueOnce(new Error("Baza niedostępna")).mockResolvedValueOnce(undefined);
  render(<MaterialDialog isOpen onClose={onClose} editingMaterial={material} materialTypes={[]}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  const title = screen.getByRole("textbox", { name: /Tytuł Materiału/i }) as HTMLInputElement;
  fireEvent.change(title, { target: { value: "Nowy tytuł" } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  expect(await screen.findByText("Baza niedostępna")).toBeDefined();
  expect(title.value).toBe("Nowy tytuł");
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(onUpdate).toHaveBeenCalledTimes(2);
});

it("fills title and type when a rozdzielnik starts from a catalog material", async () => {
  render(<DistributionDialog isOpen onClose={vi.fn()} editingDistribution={null}
    initialMaterialId={material.id} materials={[material]}
    materialTypes={[{ id: "type-1", dictType: "materialType", code: "Plakat", label: "Plakat", isSystem: false,
      createdAt: "2026-01-01", updatedAt: "2026-01-01" }]}
    facilities={[]} staff={[]} onSave={vi.fn()} onUpdate={vi.fn()} />);

  expect((screen.getByRole("textbox", { name: /Nazwa \/ Tytuł/i }) as HTMLInputElement).value).toBe(material.title);
  expect(screen.getByRole("button", { name: /Typ Materiału/i }).textContent).toContain(material.materialType);
});

it("removes a facility link when a distribution recipient is changed to a custom name", async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  render(<DistributionDialog isOpen onClose={vi.fn()} editingDistribution={distribution}
    materials={[material]} materialTypes={[]} facilities={[facility]} staff={[]}
    onSave={vi.fn()} onUpdate={onUpdate} />);

  fireEvent.change(screen.getByRole("combobox", { name: /Wybierz Placówkę/i }), { target: { value: "Stowarzyszenie B" } });
  fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

  await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
  expect(onUpdate.mock.calls[0][1]).toMatchObject({ recipientName: "Stowarzyszenie B", facilityId: undefined });
});

it("uses linked material and facility details in the rozdzielnik print preview", async () => {
  useOzipzDbStore.setState({ facilities: [facility] });
  render(<MaterialsSection materials={[material]} distributions={[distribution]} materialTypes={[]}
    defaultTab="distributions" />);

  fireEvent.click(screen.getByRole("button", { name: "Drukuj blankiet rozdzielnika" }));
  expect(await screen.findByText("Szkolna 1, Myślibórz")).toBeDefined();
  expect(screen.getByText("Typ: Plakat")).toBeDefined();
});
