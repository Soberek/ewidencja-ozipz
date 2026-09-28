import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ContactsStatsHeader } from "./ContactsStatsHeader";
import {
  ContactsFilterBar,
  type ContactsFilterBarProps,
} from "./ContactsFilterBar";
import { ContactsTableView } from "./ContactsTableView";
import { ContactsSection } from "../ContactsSection";
import type { OzipzContact } from "../../../types/ozipz.types";

const mockContacts: OzipzContact[] = [
  {
    id: "contact-1",
    name: "Jan Kowalski - Koordynator ds. Promocji Zdrowia i Edukacji Ekologicznej",
    position: "Szkolny Koordynator Programów Edukacyjnych",
    facilityName:
      "Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku",
    municipality: "Barlinek",
    email: "jan.kowalski@sp-barlinek.pl",
    phone: "95 746 12 34",
    notes: "Główny kontakt w sprawach programów przedszkolnych",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "contact-2",
    name: "Anna Nowak",
    position: "Dyrektor Szkoły",
    facilityName:
      "Zespół Szkół i Placówek Oświatowych im. Noblistów Polskich w Myśliborzu",
    municipality: "Myślibórz",
    email: "a.nowak@zsipo-mysliborz.pl",
    phone: "95 747 20 00",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "contact-3",
    name: "Piotr Wiśniewski",
    position: "Pedagog Szkolny",
    facilityName: "Szkoła Podstawowa nr 1",
    municipality: "Dębno",
    email: "p.wisniewski@sp1-debno.pl",
    phone: "95 760 11 22",
    notes: "Kontakt w sprawach Bieg po Zdrowie",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

const defaultFilterBarProps: ContactsFilterBarProps = {
  search: "",
  onSearchChange: vi.fn(),
  positionFilter: "all",
  onPositionFilterChange: vi.fn(),
  positions: ["Szkolny Koordynator Programów Edukacyjnych", "Dyrektor Szkoły", "Pedagog Szkolny"],
  muniFilter: "all",
  onMuniFilterChange: vi.fn(),
  municipalities: ["Barlinek", "Dębno", "Myślibórz"],
  onOpenAdd: vi.fn(),
  onClearFilters: vi.fn(),
  isFiltered: false,
};

describe("Contacts Module Harmonization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --- ContactsStatsHeader ---
  describe("ContactsStatsHeader", () => {
    it("renders metrics correctly", () => {
      render(
        <ContactsStatsHeader
          total={58}
          withPhone={45}
          withEmail={50}
          coordinators={38}
        />
      );

      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      expect(screen.getByText("58")).toBeDefined();
      expect(screen.getByText("Koordynatorzy")).toBeDefined();
      expect(screen.getByText("38")).toBeDefined();
      expect(screen.getByText("Z Telefonem")).toBeDefined();
      expect(screen.getByText("45")).toBeDefined();
      expect(screen.getByText("Z Adresem E-mail")).toBeDefined();
      expect(screen.getByText("50")).toBeDefined();
    });
  });

  // --- R1: Filter Bar & Select size="sm" ---
  describe("R1: Filter Bar & Design System Selects & Quick Chips", () => {
    it("renders Design System Select triggers and zero raw HTML select elements", () => {
      const { container } = render(<ContactsFilterBar {...defaultFilterBarProps} />);

      expect(container.querySelectorAll("select").length).toBe(0);
      expect(screen.getByText("Wszystkie stanowiska")).toBeDefined();
      expect(screen.getByText("Wszystkie gminy")).toBeDefined();
    });

    it("renders role quick-filter chips with correct active and inactive styling", () => {
      render(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          roleFilter="coordinators"
        />
      );

      const allChip = screen.getByRole("button", { name: "Wszystkie" });
      const coordChip = screen.getByRole("button", { name: "Koordynatorzy" });
      const directorsChip = screen.getByRole("button", { name: "Dyrektorzy" });
      const pedagoguesChip = screen.getByRole("button", { name: "Pedagodzy" });

      expect(coordChip.getAttribute("aria-pressed")).toBe("true");
      for (const token of ["bg-primary", "text-primary-foreground", "border-primary", "font-semibold"]) {
        expect(coordChip.className).toContain(token);
      }
      for (const chip of [allChip, directorsChip, pedagoguesChip]) {
        expect(chip.getAttribute("aria-pressed")).toBe("false");
        expect(chip.className).toContain("bg-muted/40");
        expect(chip.className).toContain("text-muted-foreground");
      }
    });

    it("calls onRoleFilterChange when clicking quick-filter chips", () => {
      const handleRoleFilterChange = vi.fn();
      render(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          onRoleFilterChange={handleRoleFilterChange}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Koordynatorzy" }));
      expect(handleRoleFilterChange).toHaveBeenCalledWith("coordinators");

      fireEvent.click(screen.getByRole("button", { name: "Dyrektorzy" }));
      expect(handleRoleFilterChange).toHaveBeenCalledWith("directors");

      fireEvent.click(screen.getByRole("button", { name: "Pedagodzy" }));
      expect(handleRoleFilterChange).toHaveBeenCalledWith("pedagogues");

      fireEvent.click(screen.getByRole("button", { name: "Wszystkie" }));
      expect(handleRoleFilterChange).toHaveBeenCalledWith("all");
    });

    it("renders search clear X button when search text is present and clears search on click", () => {
      const handleSearchChange = vi.fn();
      const { rerender } = render(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          search=""
          onSearchChange={handleSearchChange}
        />
      );

      expect(screen.queryByLabelText("Wyczyść wyszukiwanie")).toBeNull();

      rerender(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          search="Kowalski"
          onSearchChange={handleSearchChange}
        />
      );

      const clearSearchBtn = screen.getByLabelText("Wyczyść wyszukiwanie");
      expect(clearSearchBtn).toBeDefined();

      fireEvent.click(clearSearchBtn);
      expect(handleSearchChange).toHaveBeenCalledWith("");
    });

    it("handles clear all filters button when isFiltered is true", () => {
      const handleClearFilters = vi.fn();
      render(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          isFiltered={true}
          activeFiltersCount={2}
          onClearFilters={handleClearFilters}
        />
      );

      const clearBtn = screen.getByRole("button", { name: /wyczyść/i });
      expect(clearBtn).toBeDefined();

      fireEvent.click(clearBtn);
      expect(handleClearFilters).toHaveBeenCalled();
    });
  });

  // --- R2 & R3: Direct Row Click, Safe Action Isolation & Text Wrapping ---
  describe("R2 & R3: Direct Row Click, Action Isolation & Text Wrapping", () => {
    it("renders contacts in ContactsTableView with proper data", () => {
      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      expect(screen.getByText(mockContacts[0].name)).toBeDefined();
      expect(screen.getByText(mockContacts[1].name)).toBeDefined();
      expect(screen.getByText(mockContacts[2].name)).toBeDefined();
    });

    it("triggers onEdit when clicking a table row", () => {
      const handleEdit = vi.fn();

      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const cell = screen.getByText(mockContacts[0].name);
      const row = cell.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContacts[0]);
    });

    it("safely isolates edit action button with e.stopPropagation() preventing duplicate row click", () => {
      const handleEdit = vi.fn();

      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const editButtons = screen.getAllByRole("button", { name: "Edytuj kontakt" });
      expect(editButtons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(editButtons[0]);

      // Called exactly once through edit button, NOT twice via row click
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContacts[0]);
    });

    it("safely isolates delete button with e.stopPropagation() and asks for confirmation before onDelete", async () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: "Usuń kontakt" });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(deleteButtons[0]);

      // Usunięcie wymaga potwierdzenia w oknie dialogowym
      expect(handleDelete).not.toHaveBeenCalled();
      expect(handleEdit).not.toHaveBeenCalled();
      expect(screen.getByText("Potwierdź usunięcie kontaktu")).toBeDefined();

      const dialog = screen.getByRole("dialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "Usuń kontakt" }));
      await waitFor(() => expect(handleDelete).toHaveBeenCalledWith(mockContacts[0].id));
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("stops propagation on mail link and does not trigger onEdit", () => {
      const handleEdit = vi.fn();

      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const emailLink = screen.getByText(mockContacts[0].email!);
      emailLink.addEventListener("click", (e) => e.preventDefault());
      fireEvent.click(emailLink);

      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("renders contact name with line-clamp-2 break-words leading-tight and title attribute", () => {
      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const nameEl = screen.getByText(mockContacts[0].name);
      expect(nameEl.className).toContain("line-clamp-2");
      expect(nameEl.className).toContain("break-words");
      expect(nameEl.className).toContain("leading-tight");
      expect(nameEl.getAttribute("title")).toBe(mockContacts[0].name);
    });

    it("renders facilityName with line-clamp-2 break-words leading-tight items-start and title attribute", () => {
      render(
        <ContactsTableView
          contacts={mockContacts}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const facilityEl = screen.getByText(mockContacts[0].facilityName);
      expect(facilityEl.className).toContain("line-clamp-2");
      expect(facilityEl.className).toContain("break-words");
      expect(facilityEl.className).toContain("leading-tight");
      expect(facilityEl.getAttribute("title")).toBe(mockContacts[0].facilityName);

      const parentFlex = facilityEl.parentElement;
      expect(parentFlex?.className).toContain("items-start");
    });
  });

  // --- R4: Collapsible KPI Header with LocalStorage Persistence ---
  describe("R4: Collapsible KPI Header with localStorage Persistence", () => {
    it("renders KPI toggle button in ContactsFilterBar with proper aria attributes and labels", () => {
      const handleToggleKpi = vi.fn();
      const { rerender } = render(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          onToggleKpi={handleToggleKpi}
          isKpiVisible={true}
        />
      );

      const collapseBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(collapseBtn.getAttribute("aria-expanded")).toBe("true");
      expect(collapseBtn.getAttribute("title")).toBe("Zwiń karty podsumowania KPI");

      fireEvent.click(collapseBtn);
      expect(handleToggleKpi).toHaveBeenCalledTimes(1);

      rerender(
        <ContactsFilterBar
          {...defaultFilterBarProps}
          onToggleKpi={handleToggleKpi}
          isKpiVisible={false}
        />
      );

      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
      expect(expandBtn.getAttribute("title")).toBe("Rozwiń karty podsumowania KPI");
    });

    it("toggles and persists KPI summary in ContactsSection across localStorage", () => {
      render(<ContactsSection contacts={mockContacts} />);

      // Initially expanded
      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      const collapseBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      // Collapse
      fireEvent.click(collapseBtn);
      expect(screen.queryByText("Wszystkie Kontakty")).toBeNull();
      expect(localStorage.getItem("oz.contactsShowKpiSummary")).toBe("false");

      // Expand
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      expect(localStorage.getItem("oz.contactsShowKpiSummary")).toBe("true");
    });

    it("honors pre-existing collapsed preference in localStorage on mount", () => {
      localStorage.setItem("oz.contactsShowKpiSummary", "false");
      render(<ContactsSection contacts={mockContacts} />);

      expect(screen.queryByText("Wszystkie Kontakty")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
    });

    it("handles localStorage errors gracefully", () => {
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access is denied");
      });

      render(<ContactsSection contacts={mockContacts} />);

      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      getItemSpy.mockRestore();
    });
  });

  // --- Integration in ContactsSection ---
  describe("ContactsSection Integration: Quick Chips & Filter Flow", () => {
    it("filters contacts table by role quick chips", () => {
      render(<ContactsSection contacts={mockContacts} />);

      expect(screen.getByText(mockContacts[0].name)).toBeDefined();
      expect(screen.getByText(mockContacts[1].name)).toBeDefined();
      expect(screen.getByText(mockContacts[2].name)).toBeDefined();

      // Filter: Koordynatorzy
      fireEvent.click(screen.getByRole("button", { name: "Koordynatorzy" }));
      expect(screen.getByText(mockContacts[0].name)).toBeDefined();
      expect(screen.queryByText(mockContacts[1].name)).toBeNull();
      expect(screen.queryByText(mockContacts[2].name)).toBeNull();

      // Filter: Dyrektorzy
      fireEvent.click(screen.getByRole("button", { name: "Dyrektorzy" }));
      expect(screen.queryByText(mockContacts[0].name)).toBeNull();
      expect(screen.getByText(mockContacts[1].name)).toBeDefined();
      expect(screen.queryByText(mockContacts[2].name)).toBeNull();

      // Filter: Pedagodzy
      fireEvent.click(screen.getByRole("button", { name: "Pedagodzy" }));
      expect(screen.queryByText(mockContacts[0].name)).toBeNull();
      expect(screen.queryByText(mockContacts[1].name)).toBeNull();
      expect(screen.getByText(mockContacts[2].name)).toBeDefined();

      // Reset: Wszystkie
      fireEvent.click(screen.getByRole("button", { name: "Wszystkie" }));
      expect(screen.getByText(mockContacts[0].name)).toBeDefined();
      expect(screen.getByText(mockContacts[1].name)).toBeDefined();
      expect(screen.getByText(mockContacts[2].name)).toBeDefined();
    });

    it("displays empty state when no contacts match and resets on clear", () => {
      render(<ContactsSection contacts={mockContacts} />);

      const searchInput = screen.getByLabelText("Szukaj kontaktu");
      fireEvent.change(searchInput, { target: { value: "NiemożliweDoZnalezienia" } });

      expect(screen.getByText("Brak pasujących kontaktów")).toBeDefined();

      const clearFiltersBtn = screen.getByRole("button", { name: "Wyczyść filtry" });
      fireEvent.click(clearFiltersBtn);

      expect(screen.getByText(mockContacts[0].name)).toBeDefined();
    });
  });

  describe("Nowe funkcje spisu: jakość danych, widok grupowany, akcje masowe", () => {
    const withIncomplete: OzipzContact[] = [
      ...mockContacts,
      {
        id: "contact-4",
        name: "Ewa Brakdanych",
        position: "Sekretarz",
        facilityName: "Przedszkole Miejskie",
        municipality: "Barlinek",
        email: "",
        phone: "",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    it("shows incomplete chip with count and filters contacts needing attention", () => {
      render(<ContactsSection contacts={withIncomplete} />);
      const chip = screen.getByRole("button", { name: "Do uzupełnienia (1)" });
      fireEvent.click(chip);
      expect(screen.getByText("Ewa Brakdanych")).toBeDefined();
      expect(screen.queryByText("Anna Nowak")).toBeNull();
      fireEvent.click(chip);
      expect(screen.getByText("Anna Nowak")).toBeDefined();
    });

    it("searches without Polish diacritics", () => {
      render(<ContactsSection contacts={mockContacts} />);
      fireEvent.change(screen.getByLabelText("Szukaj kontaktu"), { target: { value: "wisniewski" } });
      expect(screen.getByText("Piotr Wiśniewski")).toBeDefined();
      expect(screen.queryByText("Anna Nowak")).toBeNull();
    });

    it("switches to grouped view by municipality and facility and remembers the choice", () => {
      render(<ContactsSection contacts={mockContacts} />);
      fireEvent.click(screen.getByRole("button", { name: /wg placówek/i }));
      expect(screen.getByRole("region", { name: "Gmina Barlinek" })).toBeDefined();
      expect(screen.getByRole("region", { name: "Gmina Dębno" })).toBeDefined();
      expect(localStorage.getItem("oz.contactsViewMode")).toBe("grouped");
    });

    it("copies e-mails of the filtered contacts separated by semicolons", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      render(<ContactsSection contacts={mockContacts} />);
      fireEvent.click(screen.getByRole("button", { name: "Dyrektorzy" }));
      fireEvent.click(screen.getByRole("button", { name: "Kopiuj e-maile (1)" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith("a.nowak@zsipo-mysliborz.pl"));
    });

    it("renders phone number as a tel: link", () => {
      render(<ContactsSection contacts={mockContacts} />);
      const phone = screen.getByText("95 746 12 34");
      expect(phone.closest("a")?.getAttribute("href")).toBe("tel:+48957461234");
    });
  });
});
