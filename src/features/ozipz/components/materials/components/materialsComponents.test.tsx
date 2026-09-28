import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaterialsStatsHeader } from "./MaterialsStatsHeader";
import { MaterialsViewSwitcher } from "./MaterialsViewSwitcher";
import { MaterialsCatalogTab } from "./MaterialsCatalogTab";
import { MaterialsDistributionsTab } from "./MaterialsDistributionsTab";
import { MaterialsSection } from "../MaterialsSection";
import type {
  OzipzMaterial,
  OzipzDistribution,
  OzipzDictionaryItem,
} from "../../../types/ozipz.types";

const mockMaterials: OzipzMaterial[] = [
  {
    id: "mat-1",
    title: "Ulotka - Bądź bezpieczny nad wodą podczas letnich wakacji i wyjazdów",
    materialType: "Ulotka",
    topic: "Bezpieczeństwo",
    publisher: "GIS",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "mat-2",
    title: "Broszura - Zdrowe żywienie dzieci i młodzieży w wieku szkolnym",
    materialType: "Broszura",
    topic: "Zdrowe odżywianie",
    publisher: "WSSE",
    createdAt: "2026-01-02",
    updatedAt: "2026-01-02",
  },
];

const mockMaterialTypes: OzipzDictionaryItem[] = [
  {
    id: "dt-1",
    dictType: "materialType",
    code: "ulotka",
    label: "Ulotka",
    isSystem: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "dt-2",
    dictType: "materialType",
    code: "broszura",
    label: "Broszura",
    isSystem: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

const mockDistributions: OzipzDistribution[] = [
  {
    id: "dist-1",
    materialId: "mat-1",
    materialTitle: "Ulotka - Bądź bezpieczny nad wodą podczas letnich wakacji i wyjazdów",
    recipientName: "Szkoła Podstawowa nr 3 im. Polskich Olimpijczyków w Barlinku",
    municipality: "Barlinek",
    quantity: 100,
    distributionDate: "2026-05-10",
    assignedEducator: "Jan Nowak",
    purpose: "Zajęcia profilaktyczne",
    createdAt: "2026-05-10",
    updatedAt: "2026-05-10",
  },
  {
    id: "dist-2",
    materialId: "mat-2",
    materialTitle: "Broszura - Zdrowe żywienie dzieci i młodzieży w wieku szkolnym",
    recipientName: "Przedszkole Miejskie nr 1 im. Juliana Tuwima w Myśliborzu",
    municipality: "Myślibórz",
    quantity: 50,
    distributionDate: "2026-05-12",
    assignedEducator: "Anna Kowalska",
    purpose: "Spotkanie z rodzicami",
    createdAt: "2026-05-12",
    updatedAt: "2026-05-12",
  },
];

describe("Materials Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders MaterialsStatsHeader with stock metrics", () => {
    render(
      <MaterialsStatsHeader
        totalTitles={14}
        totalStock={3500}
        totalDistributed={1200}
        distributionsCount={28}
      />
    );

    expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();
    expect(screen.getByText(/3[\s\u00a0]?500/)).toBeDefined();
    expect(screen.getByText(/1[\s\u00a0]?200/)).toBeDefined();
    expect(screen.getByText("28")).toBeDefined();
  });

  it("renders MaterialsViewSwitcher with tabs and KPI toggle button", () => {
    const handleTabChange = vi.fn();
    const handleAddMat = vi.fn();
    const handleToggleKpi = vi.fn();

    const { rerender } = render(
      <MaterialsViewSwitcher
        activeTab="catalog"
        onTabChange={handleTabChange}
        materialsCount={10}
        distributionsCount={5}
        onOpenAddMaterial={handleAddMat}
        onOpenAddDistribution={vi.fn()}
        isKpiVisible={true}
        onToggleKpi={handleToggleKpi}
      />
    );

    expect(screen.getByText("Katalog Materiałów")).toBeDefined();
    const distBtn = screen.getByText("Ewidencja Rozdzielników");
    fireEvent.click(distBtn);
    expect(handleTabChange).toHaveBeenCalledWith("distributions");

    const addBtn = screen.getByText("Nowy Materiał");
    fireEvent.click(addBtn);
    expect(handleAddMat).toHaveBeenCalled();

    const kpiBtn = screen.getByRole("button", { name: "Zwiń KPI" });
    expect(kpiBtn.getAttribute("aria-expanded")).toBe("true");
    expect(kpiBtn.getAttribute("title")).toBe("Zwiń karty podsumowania KPI");
    fireEvent.click(kpiBtn);
    expect(handleToggleKpi).toHaveBeenCalledTimes(1);

    rerender(
      <MaterialsViewSwitcher
        activeTab="catalog"
        onTabChange={handleTabChange}
        materialsCount={10}
        distributionsCount={5}
        onOpenAddMaterial={handleAddMat}
        onOpenAddDistribution={vi.fn()}
        isKpiVisible={false}
        onToggleKpi={handleToggleKpi}
      />
    );

    const kpiBtnHidden = screen.getByRole("button", { name: "Pokaż KPI" });
    expect(kpiBtnHidden.getAttribute("aria-expanded")).toBe("false");
    expect(kpiBtnHidden.getAttribute("title")).toBe("Rozwiń karty podsumowania KPI");
  });

  it("MaterialsSection toggles collapsible KPI header and persists in localStorage", () => {
    render(
      <MaterialsSection
        materials={mockMaterials}
        distributions={mockDistributions}
        materialTypes={mockMaterialTypes}
      />
    );

    // Domyślnie nagłówek KPI jest widoczny
    expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
    const toggleBtn = screen.getByRole("button", { name: "Zwiń KPI" });
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    // Zwijamy KPI
    fireEvent.click(toggleBtn);
    expect(screen.queryByText("Tytuły Materiałów")).toBeNull();
    expect(localStorage.getItem("oz.materialsShowKpiSummary")).toBe("false");
    expect(screen.getByRole("button", { name: "Pokaż KPI" })).toBeDefined();

    // Rozwijamy KPI z powrotem
    fireEvent.click(screen.getByRole("button", { name: "Pokaż KPI" }));
    expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
    expect(localStorage.getItem("oz.materialsShowKpiSummary")).toBe("true");
  });

  it("MaterialsSection respects false in localStorage on mount", () => {
    localStorage.setItem("oz.materialsShowKpiSummary", "false");

    render(
      <MaterialsSection
        materials={mockMaterials}
        distributions={mockDistributions}
        materialTypes={mockMaterialTypes}
      />
    );

    expect(screen.queryByText("Tytuły Materiałów")).toBeNull();
    expect(screen.getByRole("button", { name: "Pokaż KPI" })).toBeDefined();
  });

  it("MaterialsCatalogTab renders multi-line titles, filters, row click, and safe action isolation", () => {
    const handleOpenAdd = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleAddDist = vi.fn();

    render(
      <MaterialsCatalogTab
        materials={mockMaterials}
        materialTypes={mockMaterialTypes}
        onOpenAdd={handleOpenAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenAddDistribution={handleAddDist}
      />
    );

    // Multi-line text wrapping i title tooltip (R3)
    const titleSpan = screen.getByTitle(mockMaterials[0].title);
    expect(titleSpan.className).toContain("line-clamp-2");
    expect(titleSpan.className).toContain("break-words");
    expect(titleSpan.className).toContain("leading-tight");

    // Wyszukiwanie z przyciskiem X (R1)
    const searchInput = screen.getByPlaceholderText("Szukaj po tytule, wydawcy, tematyce...");
    fireEvent.change(searchInput, { target: { value: "żywienie" } });
    expect(screen.queryByText(mockMaterials[0].title)).toBeNull();
    expect(screen.getByText(mockMaterials[1].title)).toBeDefined();

    const clearSearchBtn = screen.getByRole("button", { name: "Wyczyść wyszukiwanie" });
    fireEvent.click(clearSearchBtn);
    expect(screen.getByText(mockMaterials[0].title)).toBeDefined();
    expect(screen.getByText(mockMaterials[1].title)).toBeDefined();

    // Quick-filter chips typów (R1)
    const chipUlotka = screen.getByRole("button", { name: "Ulotka" });
    fireEvent.click(chipUlotka);
    expect(chipUlotka.className).toContain("bg-primary");
    expect(screen.getByText(mockMaterials[0].title)).toBeDefined();
    expect(screen.queryByText(mockMaterials[1].title)).toBeNull();

    // Kliknięcie aktywnego chipa cofa do "all"
    fireEvent.click(chipUlotka);
    expect(screen.getByText(mockMaterials[0].title)).toBeDefined();
    expect(screen.getByText(mockMaterials[1].title)).toBeDefined();

    // Kliknięcie wiersza wywołuje onEdit (R2)
    fireEvent.click(screen.getByText(mockMaterials[0].title));
    expect(handleEdit).toHaveBeenCalledWith(mockMaterials[0]);
    handleEdit.mockClear();

    // Izolacja akcji stopPropagation (R2)
    // Tabela jest posortowana alfabetycznie po tytule ("Broszura..." [1] przed "Ulotka..." [0])
    const addDistBtn = screen.getAllByRole("button", { name: "Wystaw rozdzielnik" })[0];
    fireEvent.click(addDistBtn);
    expect(handleAddDist).toHaveBeenCalledWith(mockMaterials[1].id);
    expect(handleEdit).not.toHaveBeenCalled();

    const deleteBtn = screen.getAllByRole("button", { name: "Usuń materiał" })[0];
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockMaterials[1].id);
    expect(handleEdit).not.toHaveBeenCalled();

    const editBtn = screen.getAllByRole("button", { name: "Edytuj materiał" })[0];
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockMaterials[1]);
  });

  it("MaterialsDistributionsTab renders multi-line recipient, municipality filters, row click, and safe action isolation", () => {
    const handleOpenAdd = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenBlankiet = vi.fn();

    render(
      <MaterialsDistributionsTab
        distributions={mockDistributions}
        materials={mockMaterials}
        municipalities={["Barlinek", "Myślibórz"]}
        onOpenAdd={handleOpenAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenBlankiet={handleOpenBlankiet}
      />
    );

    // Multi-line text wrapping i title tooltip odbiorcy (R3)
    const recipientSpan = screen.getByTitle(mockDistributions[0].recipientName);
    expect(recipientSpan.className).toContain("line-clamp-2");
    expect(recipientSpan.className).toContain("break-words");
    expect(recipientSpan.className).toContain("leading-tight");

    // Wyszukiwanie i czyszczenie X (R1)
    const searchInput = screen.getByPlaceholderText("Szukaj po tytule materiału, placówce...");
    fireEvent.change(searchInput, { target: { value: "Tuwima" } });
    expect(screen.queryByText(mockDistributions[0].recipientName)).toBeNull();
    expect(screen.getByText(mockDistributions[1].recipientName)).toBeDefined();

    const clearSearchBtn = screen.getByRole("button", { name: "Wyczyść wyszukiwanie" });
    fireEvent.click(clearSearchBtn);
    expect(screen.getByText(mockDistributions[0].recipientName)).toBeDefined();
    expect(screen.getByText(mockDistributions[1].recipientName)).toBeDefined();

    // Quick-filter chips gmin (R1)
    const chipBarlinek = screen.getByRole("button", { name: "Barlinek" });
    fireEvent.click(chipBarlinek);
    expect(chipBarlinek.className).toContain("bg-primary");
    expect(screen.getByText(mockDistributions[0].recipientName)).toBeDefined();
    expect(screen.queryByText(mockDistributions[1].recipientName)).toBeNull();

    // Ponowne kliknięcie aktywnego chipa gminy cofa do "all"
    fireEvent.click(chipBarlinek);
    expect(screen.getByText(mockDistributions[0].recipientName)).toBeDefined();
    expect(screen.getByText(mockDistributions[1].recipientName)).toBeDefined();

    // Kliknięcie wiersza wywołuje onEdit (R2)
    fireEvent.click(screen.getByText(mockDistributions[0].recipientName));
    expect(handleEdit).toHaveBeenCalledWith(mockDistributions[0]);
    handleEdit.mockClear();

    // Izolacja akcji stopPropagation (R2)
    // Tabela jest posortowana malejąco po dacie (2026-05-12 [1] przed 2026-05-10 [0])
    const printBtn = screen.getAllByRole("button", { name: "Drukuj blankiet rozdzielnika" })[0];
    fireEvent.click(printBtn);
    expect(handleOpenBlankiet).toHaveBeenCalledWith(mockDistributions[1]);
    expect(handleEdit).not.toHaveBeenCalled();

    const deleteBtn = screen.getAllByRole("button", { name: "Usuń rozdzielnik" })[0];
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockDistributions[1].id);
    expect(handleEdit).not.toHaveBeenCalled();

    const editBtn = screen.getAllByRole("button", { name: "Edytuj rozdzielnik" })[0];
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockDistributions[1]);
  });
});
