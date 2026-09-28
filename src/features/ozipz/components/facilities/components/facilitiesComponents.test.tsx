import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { FacilitiesStatsHeader } from "./FacilitiesStatsHeader";
import { FacilitiesFilterBar } from "./FacilitiesFilterBar";
import { FacilitiesTableView } from "./FacilitiesTableView";
import { FacilitiesSection } from "../FacilitiesSection";
import { FacilityDialog } from "../FacilityDialog";
import { EMPTY_FACILITY_FILTERS } from "../../../utils/facilityUtils";
import type { OzipzAction, OzipzFacility, OzipzSchoolParticipation } from "../../../types/ozipz.types";

const base = { county: "powiat myśliborski", isComplex: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" };

const mockFacilities: OzipzFacility[] = [
  {
    ...base,
    id: "fac-1",
    name: "Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku",
    type: "szkola",
    educationTypes: ["Szkoła podstawowa"],
    municipality: "Barlinek",
    address: "ul. Szosowa 2",
    city: "Barlinek",
    postalCode: "74-320",
    leadingAuthority: "Gmina Barlinek",
    email: "sp_barlinek@oswiata.pl",
    phone: "95 746 12 34",
    defaultCoordinatorName: "Anna Nowak",
    defaultCoordinatorEmail: "anna.nowak@oswiata.pl",
  },
  {
    ...base,
    id: "fac-2",
    name: "Zespół Szkół im. Noblistów Polskich w Myśliborzu",
    type: "szkola",
    municipality: "Myślibórz",
    address: "ul. Za Bramką 8",
    city: "Myślibórz",
    postalCode: "74-300",
    leadingAuthority: "Powiat Myśliborski",
    email: "zs@mysliborz.pl",
    isComplex: true,
  },
  {
    ...base,
    id: "fac-3",
    name: "II Liceum Ogólnokształcące w Myśliborzu",
    type: "szkola",
    educationTypes: ["Liceum"],
    municipality: "Myślibórz",
    address: "ul. Za Bramką 8",
    city: "Myślibórz",
    postalCode: "74-300",
    leadingAuthority: "Powiat Myśliborski",
    parentFacilityId: "fac-2",
  },
  {
    ...base,
    id: "fac-4",
    name: "Apteka Centrum Zdrowia",
    type: "apteka",
    municipality: "Dębno",
    address: "ul. Kościuszki 1",
    city: "Dębno",
    postalCode: "74400",
    leadingAuthority: "",
  },
];

const tableProps = {
  childrenMap: new Map<string, OzipzFacility[]>(),
  parentMap: new Map<string, OzipzFacility>(),
  onOpenAdd: vi.fn(),
  onClearFilters: vi.fn(),
  isFiltered: false,
};

describe("FacilitiesStatsHeader", () => {
  it("renders metrics without duplicating the issues filter control", () => {
    render(
      <FacilitiesStatsHeader totalFacilities={60} educationCount={41} complexCount={12} municipalitiesCount={5} issuesCount={7} />
    );
    for (const value of ["60", "41", "12", "5", "7"]) expect(screen.getByText(value)).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("FacilitiesFilterBar", () => {
  const renderBar = (overrides = {}) => {
    const props = {
      filters: EMPTY_FACILITY_FILTERS,
      onFiltersChange: vi.fn(),
      onClearFilters: vi.fn(),
      activeFiltersCount: 0,
      resultsCount: 17,
      typeOptions: [{ code: "szkola", label: "szkoła", count: 3 }, { code: "apteka", label: "apteka", count: 1 }],
      municipalityOptions: ["Barlinek", "Dębno"],
      issuesCount: 2,
      onOpenEmailsCopy: vi.fn(),
      onOpenAdd: vi.fn(),
      onToggleKpi: vi.fn(),
      ...overrides,
    };
    render(<FacilitiesFilterBar {...props} />);
    return props;
  };

  it("reports search, type, structure and issue changes as patches", () => {
    const props = renderBar();
    fireEvent.change(screen.getByLabelText("Szukaj placówek"), { target: { value: "liceum" } });
    expect(props.onFiltersChange).toHaveBeenCalledWith({ search: "liceum" });
    fireEvent.click(screen.getByRole("button", { name: /apteka/ }));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ types: ["apteka"] });
    fireEvent.click(screen.getByRole("button", { name: "Zespoły szkół" }));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ structure: "complex" });
    fireEvent.click(screen.getByRole("button", { name: /Do uzupełnienia/ }));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ onlyWithIssues: true });
  });

  it("shows result count, clear button and KPI toggle label", () => {
    const props = renderBar({ activeFiltersCount: 2, filters: { ...EMPTY_FACILITY_FILTERS, types: ["apteka"] } });
    expect(screen.getByText("17")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Wyczyść \(2\)/ }));
    expect(props.onClearFilters).toHaveBeenCalledOnce();
    expect(screen.getByTitle("Zwiń karty podsumowania KPI")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /apteka/ }));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ types: [] });
  });
});

describe("FacilitiesTableView", () => {
  it("shows institution and coordinator contacts separately", () => {
    render(<FacilitiesTableView {...tableProps} facilities={mockFacilities} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("sp_barlinek@oswiata.pl").closest("a")?.getAttribute("href")).toBe("mailto:sp_barlinek@oswiata.pl");
    expect(screen.getByText("95 746 12 34").closest("a")?.getAttribute("href")).toBe("tel:957461234");
    expect(screen.getByText("Anna Nowak")).toBeDefined();
    expect(screen.getByText("anna.nowak@oswiata.pl")).toBeDefined();
  });

  it("opens edit on row click but not from links or action buttons", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<FacilitiesTableView {...tableProps} facilities={[mockFacilities[0]]} onEdit={onEdit} onDelete={onDelete} />);

    const email = screen.getByText("sp_barlinek@oswiata.pl");
    email.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(email);
    fireEvent.click(screen.getByRole("button", { name: "Usuń placówkę" }));
    expect(onDelete).toHaveBeenCalledWith("fac-1");
    expect(onEdit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(mockFacilities[0].name).closest("tr")!);
    expect(onEdit).toHaveBeenCalledWith(mockFacilities[0]);
  });

  it("clamps long names and exposes the full name as title", () => {
    render(<FacilitiesTableView {...tableProps} facilities={[mockFacilities[0]]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const name = screen.getByText(mockFacilities[0].name);
    expect(name.className).toContain("line-clamp-2");
    expect(name.className).toContain("break-words");
    expect(name.getAttribute("title")).toBe(mockFacilities[0].name);
  });

  it("marks facilities with data issues", () => {
    const issues = new Map([["fac-4", [{ code: "invalid-postal-code" as const, message: "Zły kod" }]]]);
    render(<FacilitiesTableView {...tableProps} facilities={[mockFacilities[3]]} issues={issues} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByLabelText("Do uzupełnienia: 1")).toBeDefined();
  });
});

describe("FacilitiesSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("filters by search without diacritics and by dictionary type code", () => {
    render(<FacilitiesSection facilities={mockFacilities} participations={[]} actions={[]} />);
    fireEvent.change(screen.getByLabelText("Szukaj placówek"), { target: { value: "noblistow" } });
    // Liceum trafia przez nazwę swojego zespołu.
    expect(screen.getByText(mockFacilities[2].name)).toBeDefined();
    expect(screen.queryByText(mockFacilities[0].name)).toBeNull();
    expect(screen.queryByText("Apteka Centrum Zdrowia")).toBeNull();

    fireEvent.change(screen.getByLabelText("Szukaj placówek"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /apteka/ }));
    expect(screen.getByText("Apteka Centrum Zdrowia")).toBeDefined();
    expect(screen.queryByText(mockFacilities[0].name)).toBeNull();
  });

  it("shows only facilities needing attention", () => {
    render(<FacilitiesSection facilities={mockFacilities} participations={[]} actions={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Do uzupełnienia/ }));
    // Apteka: zły kod pocztowy; zespół: brak jednostek nie dotyczy (ma liceum) → tylko apteka.
    expect(screen.getByText("Apteka Centrum Zdrowia")).toBeDefined();
    expect(screen.queryByText(mockFacilities[0].name)).toBeNull();
    expect(screen.queryByText(mockFacilities[2].name)).toBeNull();
  });

  it("shows activity counts and opens a participation for the chosen school", () => {
    const onOpenParticipation = vi.fn();
    const onOpenEdit = vi.fn();
    render(
      <FacilitiesSection
        facilities={[mockFacilities[0]]}
        participations={[{ facilityId: "fac-1" } as OzipzSchoolParticipation]}
        actions={[{ facilityId: "fac-1" } as OzipzAction, { facilityId: "fac-1" } as OzipzAction]}
        onOpenParticipation={onOpenParticipation}
        onOpenEdit={onOpenEdit}
      />
    );
    const row = screen.getByText(mockFacilities[0].name).closest("tr")!;
    expect(within(row).getByTitle("Zarejestrowane działania").textContent).toContain("2");
    expect(within(row).getByTitle("Zgłoszenia do programów").textContent).toContain("1");
    fireEvent.click(screen.getByRole("button", { name: `Dodaj zgłoszenie do programu: ${mockFacilities[0].name}` }));
    expect(onOpenParticipation).toHaveBeenCalledWith(mockFacilities[0]);
    expect(onOpenEdit).not.toHaveBeenCalled();
  });

  it("asks for confirmation before deleting", async () => {
    const onDelete = vi.fn();
    render(<FacilitiesSection facilities={[mockFacilities[0]]} participations={[]} actions={[]} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Usuń placówkę" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Usunąć placówkę?")).toBeDefined();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Usuń placówkę" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("fac-1"));
  });

  it("persists the KPI collapse preference", () => {
    render(<FacilitiesSection facilities={mockFacilities} participations={[]} actions={[]} />);
    fireEvent.click(screen.getByTitle("Zwiń karty podsumowania KPI"));
    expect(localStorage.getItem("oz.facilitiesShowKpiSummary")).toBe("false");
    expect(screen.getByTitle("Rozwiń karty podsumowania KPI")).toBeDefined();
  });
});

describe("FacilityDialog", () => {
  const renderDialog = (editing: OzipzFacility | null, onSave = vi.fn(), onUpdate = vi.fn()) =>
    render(
      <FacilityDialog isOpen onClose={vi.fn()} editingFacility={editing} locationTypes={[]}
        facilities={mockFacilities} municipalities={["Gmina Barlinek"]} onSave={onSave} onUpdate={onUpdate} />
    );

  it("rejects a malformed postal code and e-mail", async () => {
    const onUpdate = vi.fn();
    renderDialog({ ...mockFacilities[0], postalCode: "74320" }, vi.fn(), onUpdate);
    fireEvent.change(screen.getByLabelText(/^E-mail$/, { selector: "#facility-email" }), { target: { value: "zly-adres" } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
    expect((await screen.findAllByText(/Kod pocztowy w formacie 00-000/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Niepoprawny adres e-mail placówki/).length).toBeGreaterThan(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("saves the secretariat contact and strips the Gmina prefix", async () => {
    const onUpdate = vi.fn();
    renderDialog({ ...mockFacilities[0], municipality: "Gmina Barlinek" }, vi.fn(), onUpdate);
    fireEvent.change(screen.getByLabelText(/^Telefon$/, { selector: "#facility-phone" }), { target: { value: " 95 111 22 33 " } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(onUpdate.mock.calls[0][1]).toMatchObject({
      municipality: "Barlinek", email: "sp_barlinek@oswiata.pl", phone: "95 111 22 33", defaultCoordinatorName: "Anna Nowak",
    });
  });

  it("warns about a duplicate name", () => {
    renderDialog(null);
    fireEvent.change(screen.getByPlaceholderText(/Szkoła Podstawowa nr 1 im/), { target: { value: "apteka centrum zdrowia" } });
    expect(screen.getByText(/W bazie jest już placówka o tej nazwie/)).toBeDefined();
  });
});
