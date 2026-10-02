import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JRWA_DICTIONARY_FIXTURE } from "../../test/fixtures/jrwaCatalog";
import { render, screen, fireEvent } from "@testing-library/react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { SearchableSelect } from "@/components/ui/select";
import { MaterialsCatalogTab } from "./components/materials/components/MaterialsCatalogTab";
import { MaterialsDistributionsTab } from "./components/materials/components/MaterialsDistributionsTab";
import { RegistersFilterBar } from "./components/registers/components/RegistersFilterBar";
import { InformationRegisterTable } from "./components/registers/components/InformationRegisterTable";
import { PublicationsRegisterTable } from "./components/registers/components/PublicationsRegisterTable";
import { VisitationsRegisterTable } from "./components/registers/components/VisitationsRegisterTable";
import { ContactsFilterBar } from "./components/contacts/components/ContactsFilterBar";
import { ContactsTableView } from "./components/contacts/components/ContactsTableView";
import { LettersSection } from "./components/letters/LettersSection";
import type {
  OzipzMaterial,
  OzipzDistribution,
  OzipzAction,
  OzipzContact,
  OzipzLetter,
  OzipzDictionaryItem,
  OzipzFacility,
} from "./types/ozipz.types";

// Adversarial extreme string fixtures
const EXTREME_STRINGS = {
  unbrokenLong: "A".repeat(600),
  polishAccents: "Zażółć gęślą jaźń! ĄĆĘŁŃÓŚŹŻ — Szkoła Podstawowa z Oddziałami Integracyjnymi nr 999",
  htmlScriptXss: "<script>alert('xss')</script><b>Pogrubiony Tytuł</b> & \"Cudzysłowy\" 'apostrofy'",
  unicodeAndEmoji: "🔬🧬 Zdrowie dla każdego! 🌟✨ (مدرسة / בית ספר / 學校)",
  specialPunctuation: "Raport // 2026-03 :: [Pilne] -> (OZiPZ #123) / § 4 ust. 2 & 100%*",
};

describe("Core Modules UX/UI Harmonization — Adversarial Challenger Test Suite", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // =========================================================================
  // Challenge 1: Multi-line Text Wrapping & Tooltip Presence with Extreme Data
  // =========================================================================
  describe("Challenge 1: Multi-line Text Wrapping & Tooltips with Adversarial Inputs", () => {
    it("MaterialsCatalogTab: wraps unbroken 600-char titles and retains raw string in title tooltip", () => {
      const materials: OzipzMaterial[] = [
        {
          id: "m-1",
          title: EXTREME_STRINGS.unbrokenLong,
          materialType: "Ulotka",
          topic: "Higiena",
          publisher: EXTREME_STRINGS.polishAccents,
          targetAudience: "Dzieci",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      render(
        <MaterialsCatalogTab
          materials={materials}
          materialTypes={[
            {
              id: "t1",
              dictType: "material_types",
              code: "Ulotka",
              label: "Ulotka",
              isSystem: false,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
            },
          ]}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAddDistribution={vi.fn()}
        />
      );

      const titleEl = screen.getByTitle(EXTREME_STRINGS.unbrokenLong);
      expect(titleEl).toBeDefined();
      expect(titleEl.className).toContain("line-clamp-2");
      expect(titleEl.className).toContain("break-words");
      expect(titleEl.className).toContain("leading-tight");
      expect(titleEl.textContent).toBe(EXTREME_STRINGS.unbrokenLong);

      const pubEl = screen.getByTitle(`Wydawca: ${EXTREME_STRINGS.polishAccents}`);
      expect(pubEl).toBeDefined();
    });

    it("MaterialsDistributionsTab: wraps long recipient names and material titles with tooltips", () => {
      const distributions: OzipzDistribution[] = [
        {
          id: "d-1",
          materialId: "m-1",
          materialTitle: EXTREME_STRINGS.htmlScriptXss,
          recipientName: EXTREME_STRINGS.polishAccents,
          municipality: "Myślibórz",
          distributionDate: "2026-03-01",
          quantity: 250,
          assignedEducator: "Jan Kowalski",
          purpose: "Edukacja",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      render(
        <MaterialsDistributionsTab
          distributions={distributions}
          materials={[]}
          municipalities={["Myślibórz"]}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenBlankiet={vi.fn()}
        />
      );

      // Material title verification
      const titleEl = screen.getByTitle(EXTREME_STRINGS.htmlScriptXss);
      expect(titleEl.className).toContain("line-clamp-2");
      expect(titleEl.className).toContain("break-words");
      expect(titleEl.className).toContain("leading-tight");

      // Recipient name verification
      const recipientEl = screen.getByTitle(EXTREME_STRINGS.polishAccents);
      expect(recipientEl.className).toContain("line-clamp-2");
      expect(recipientEl.className).toContain("break-words");
      expect(recipientEl.className).toContain("leading-tight");
    });

    it("Registers Tables: wraps long subjects in Information, Publications, and Visitations registers", () => {
      const mockAction: OzipzAction = {
        id: "act-1",
        title: EXTREME_STRINGS.unicodeAndEmoji,
        date: "2026-03-01",
        leadEducator: "Jan Kowalski",
        status: "wykonane",
        actionType: "prelekcja",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        audienceGroup: "Dzieci",
        topic: EXTREME_STRINGS.specialPunctuation,
        participantsCount: 50,
        materialsDistributedCount: 0,
        ezdStatus: "w_ezd",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      // 1. InformationRegisterTable
      const expectedInfoTooltip = `${EXTREME_STRINGS.unicodeAndEmoji} - ${EXTREME_STRINGS.specialPunctuation} - [prelekcja]`;
      const { unmount: unmount1 } = render(
        <InformationRegisterTable
          actions={[mockAction]}
          onActionClick={vi.fn()}
        />
      );
      const infoEl = screen.getByTitle(expectedInfoTooltip);
      expect(infoEl.className).toContain("line-clamp-2");
      expect(infoEl.className).toContain("break-words");
      unmount1();

      // 2. PublicationsRegisterTable
      const { unmount: unmount2 } = render(
        <PublicationsRegisterTable
          actions={[mockAction]}
          onActionClick={vi.fn()}
        />
      );
      const pubEls = screen.getAllByTitle(EXTREME_STRINGS.specialPunctuation);
      expect(pubEls.length).toBeGreaterThanOrEqual(1);
      const pubEl = pubEls[0];
      expect(pubEl.className).toContain("line-clamp-2");
      expect(pubEl.className).toContain("break-words");
      unmount2();

      // 3. VisitationsRegisterTable
      const mockFacility: OzipzFacility = {
        id: "fac-1",
        name: EXTREME_STRINGS.polishAccents,
        type: "szkoła podstawowa",
        municipality: "Myślibórz",
        city: "Myślibórz",
        postalCode: "74-300",
        address: "ul. Spokojna 1",
        county: "powiat myśliborski",
        leadingAuthority: "Gmina Myślibórz",
        isComplex: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      const facilitiesMap = new Map<string, OzipzFacility>([["fac-1", mockFacility]]);
      const visitAction: OzipzAction = {
        ...mockAction,
        facilityId: "fac-1",
      };

      render(
        <VisitationsRegisterTable
          actions={[visitAction]}
          facilitiesMap={facilitiesMap}
          onActionClick={vi.fn()}
        />
      );
      const visitEl = screen.getByTitle(expectedInfoTooltip);
      expect(visitEl.className).toContain("line-clamp-2");
      expect(visitEl.className).toContain("break-words");
    });

    it("ContactsTableView: wraps unbroken long contact and facility names with tooltips", () => {
      const mockContact: OzipzContact = {
        id: "c-1",
        name: EXTREME_STRINGS.unbrokenLong,
        position: "Koordynator",
        facilityName: EXTREME_STRINGS.polishAccents,
        municipality: "Barlinek",
        phone: "123456789",
        email: "test@example.com",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      render(
        <ContactsTableView
          contacts={[mockContact]}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const nameEl = screen.getByTitle(EXTREME_STRINGS.unbrokenLong);
      expect(nameEl.className).toContain("line-clamp-2");
      expect(nameEl.className).toContain("break-words");
      expect(nameEl.className).toContain("leading-tight");

      const facEl = screen.getByTitle(EXTREME_STRINGS.polishAccents);
      expect(facEl.className).toContain("line-clamp-2");
      expect(facEl.className).toContain("break-words");
      expect(facEl.className).toContain("leading-tight");
    });

    it("LettersSection: wraps extreme subjects and preserves title tooltips", () => {
      const mockLetter: OzipzLetter = {
        id: "l-1",
        letterNumber: "OZiPZ.070.1.2026",
        direction: "wychodzace",
        subject: EXTREME_STRINGS.htmlScriptXss,
        letterDate: "2026-03-01",
        senderRecipient: EXTREME_STRINGS.polishAccents,
        assignedPerson: "Jan Kowalski",
        status: "wysłane",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      render(
        <LettersSection
          letters={[mockLetter]}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const subjEl = screen.getByTitle(EXTREME_STRINGS.htmlScriptXss);
      expect(subjEl.className).toContain("line-clamp-2");
      expect(subjEl.className).toContain("break-words");
      expect(subjEl.className).toContain("leading-tight");
    });
  });

  // =========================================================================
  // Challenge 2: Quick-Filter Chips Styling & Toggle-to-"all" Behavior
  // =========================================================================
  describe("Challenge 2: Quick-Filter Chips Styling & Click Toggle Behaviors", () => {
    it("MaterialsCatalogTab: active chip has primary styling, inactive has muted, clicking active toggles to 'all'", () => {
      const materialTypes: OzipzDictionaryItem[] = [
        { id: "t1", dictType: "material_types", code: "Broszura", label: "Broszura", isSystem: false, createdAt: "", updatedAt: "" },
        { id: "t2", dictType: "material_types", code: "Plakat", label: "Plakat", isSystem: false, createdAt: "", updatedAt: "" },
      ];

      const materials: OzipzMaterial[] = [
        { id: "m1", title: "Mat 1", materialType: "Broszura", topic: "", publisher: "", createdAt: "", updatedAt: "" },
        { id: "m2", title: "Mat 2", materialType: "Plakat", topic: "", publisher: "", createdAt: "", updatedAt: "" },
      ];

      render(
        <MaterialsCatalogTab
          materials={materials}
          materialTypes={materialTypes}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAddDistribution={vi.fn()}
        />
      );

      const allBtn = screen.getByRole("button", { name: "Wszystkie" });
      const broszuraBtn = screen.getByRole("button", { name: "Broszura" });
      const plakatBtn = screen.getByRole("button", { name: "Plakat" });

      // Initially "Wszystkie" is active
      expect(allBtn.className).toContain("bg-primary");
      expect(allBtn.className).toContain("text-primary-foreground");
      expect(allBtn.className).toContain("border-primary");

      expect(broszuraBtn.className).toContain("bg-muted/40");
      expect(plakatBtn.className).toContain("bg-muted/40");

      // Click Broszura -> Broszura becomes active
      fireEvent.click(broszuraBtn);
      expect(broszuraBtn.className).toContain("bg-primary");
      expect(broszuraBtn.className).toContain("text-primary-foreground");
      expect(broszuraBtn.className).toContain("border-primary");
      expect(allBtn.className).toContain("bg-muted/40");

      // Adversarial Toggle: clicking the already-active "Broszura" chip MUST toggle back to "all"!
      fireEvent.click(broszuraBtn);
      expect(allBtn.className).toContain("bg-primary");
      expect(broszuraBtn.className).toContain("bg-muted/40");
    });

    it("MaterialsDistributionsTab: active municipality chip has primary styling, inactive has muted, clicking active toggles to 'all'", () => {
      const distributions: OzipzDistribution[] = [
        { id: "d1", materialId: "m1", materialTitle: "M1", recipientName: "R1", municipality: "Barlinek", distributionDate: "2026-01-01", quantity: 1, assignedEducator: "", purpose: "", createdAt: "", updatedAt: "" },
        { id: "d2", materialId: "m2", materialTitle: "M2", recipientName: "R2", municipality: "Myślibórz", distributionDate: "2026-01-01", quantity: 1, assignedEducator: "", purpose: "", createdAt: "", updatedAt: "" },
      ];

      render(
        <MaterialsDistributionsTab
          distributions={distributions}
          materials={[]}
          municipalities={["Barlinek", "Myślibórz"]}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenBlankiet={vi.fn()}
        />
      );

      const allBtn = screen.getByRole("button", { name: "Wszystkie" });
      const barlinekBtn = screen.getByRole("button", { name: "Barlinek" });

      // Initially "Wszystkie" is active
      expect(allBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(barlinekBtn.className).toContain("bg-muted/40");

      // Click Barlinek
      fireEvent.click(barlinekBtn);
      expect(barlinekBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(allBtn.className).toContain("bg-muted/40");

      // Adversarial Toggle: click active Barlinek again -> resets to "all"
      fireEvent.click(barlinekBtn);
      expect(allBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(barlinekBtn.className).toContain("bg-muted/40");
    });

    it("RegistersFilterBar: active styling and toggle-to-all click behavior on JRWA and Current Year chips", () => {
      const onYearChange = vi.fn();
      const onJrwaChange = vi.fn();
      const currentYear = new Date().getFullYear();

      const { rerender } = render(
        <RegistersFilterBar
          year=""
          onYearChange={onYearChange}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={onJrwaChange}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={false}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      const allEntriesBtn = screen.getByRole("button", { name: "Wszystkie wpisy" });
      const currentYearBtn = screen.getByRole("button", { name: "Bieżący rok" });
      const jrwa9661Btn = screen.getByRole("button", { name: "966.1" });

      // Initial state: "Wszystkie wpisy" is active
      expect(allEntriesBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(currentYearBtn.className).toContain("bg-muted/40");
      expect(jrwa9661Btn.className).toContain("bg-muted/40");

      // Click "Bieżący rok" -> calls onYearChange with currentYear
      fireEvent.click(currentYearBtn);
      expect(onYearChange).toHaveBeenCalledWith(String(currentYear));

      // Re-render as active currentYear
      rerender(
        <RegistersFilterBar
          year={String(currentYear)}
          onYearChange={onYearChange}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={onJrwaChange}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={true}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );
      expect(currentYearBtn.className).toContain("bg-primary text-primary-foreground border-primary");

      // Adversarial Toggle: clicking active "Bieżący rok" toggles back to "" ("all")
      fireEvent.click(currentYearBtn);
      expect(onYearChange).toHaveBeenCalledWith("");

      // Click "966.1"
      fireEvent.click(jrwa9661Btn);
      expect(onJrwaChange).toHaveBeenCalledWith("966.1");

      // Re-render as active 966.1
      rerender(
        <RegistersFilterBar
          year=""
          onYearChange={onYearChange}
          month=""
          onMonthChange={vi.fn()}
          jrwa="966.1"
          onJrwaChange={onJrwaChange}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={true}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );
      expect(jrwa9661Btn.className).toContain("bg-primary text-primary-foreground border-primary");

      // Adversarial Toggle: clicking active "966.1" toggles back to "" ("all")
      fireEvent.click(jrwa9661Btn);
      expect(onJrwaChange).toHaveBeenCalledWith("");
    });

    it("ContactsFilterBar: verifies active/inactive styling and 'Wszystkie' chip behavior", () => {
      const handleRoleChange = vi.fn();

      render(
        <ContactsFilterBar
          search=""
          onSearchChange={vi.fn()}
          positionFilter="all"
          onPositionFilterChange={vi.fn()}
          positions={[]}
          muniFilter="all"
          onMuniFilterChange={vi.fn()}
          municipalities={[]}
          roleFilter="coordinators"
          onRoleFilterChange={handleRoleChange}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={true}
        />
      );

      const allBtn = screen.getByRole("button", { name: "Wszystkie" });
      const coordBtn = screen.getByRole("button", { name: "Koordynatorzy" });
      const directorsBtn = screen.getByRole("button", { name: "Dyrektorzy" });

      // Active styling on Koordynatorzy
      expect(coordBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      // Inactive styling on others
      expect(allBtn.className).toContain("bg-muted/40");
      expect(directorsBtn.className).toContain("bg-muted/40");

      // Clicking "Wszystkie" resets to "all"
      fireEvent.click(allBtn);
      expect(handleRoleChange).toHaveBeenCalledWith("all");

      // Re-clicking active "Koordynatorzy" chip:
      // Note: ContactsFilterBar relies on the explicit "Wszystkie" chip to return to "all"
      handleRoleChange.mockClear();
      fireEvent.click(coordBtn);
      expect(handleRoleChange).toHaveBeenCalledWith("coordinators");
    });

    it("LettersSection: verifies active/inactive styling and 'Wszystkie' chip behavior", () => {
      render(
        <LettersSection
          letters={[]}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const allBtns = screen.getAllByRole("button", { name: "Wszystkie pisma" });
      // The quick-filter chip follows the dropdown trigger with the same label.
      const allBtn = allBtns[allBtns.length - 1];
      const outBtn = screen.getByRole("button", { name: "Wychodzące" });
      const inBtn = screen.getByRole("button", { name: "Przychodzące" });

      // Initially "Wszystkie pisma" chip is active
      expect(allBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(outBtn.className).toContain("bg-muted/40");
      expect(inBtn.className).toContain("bg-muted/40");

      // Click Wychodzące
      fireEvent.click(outBtn);
      expect(outBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(allBtn.className).toContain("bg-muted/40");

      // Re-click active Wychodzące chip: retains selection (relies on "Wszystkie pisma" chip to reset)
      fireEvent.click(outBtn);
      expect(outBtn.className).toContain("bg-primary text-primary-foreground border-primary");

      // Click "Wszystkie pisma" chip to reset
      fireEvent.click(allBtn);
      expect(allBtn.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(outBtn.className).toContain("bg-muted/40");
    });
  });

  // =========================================================================
  // Challenge 3: React DOM Property Warning Cleanliness Gate (R5)
  // =========================================================================
  describe("Challenge 3: Test Cleanliness & Zero-Warning Gate (R5)", () => {
    it("Autocomplete: renders with searchPlaceholder without logging any React DOM warnings", () => {
      render(
        <Autocomplete
          options={["Barlinek", "Dębno", "Myślibórz"]}
          searchPlaceholder="Szukaj miasta..."
          label="Miejscowość"
        />
      );

      // Verify no warning about searchPlaceholder or unrecognized props
      const domPropertyWarnings = consoleErrorSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("searchPlaceholder") ||
              arg.includes("React does not recognize") ||
              arg.includes("validateDOMNesting"))
        )
      );

      expect(domPropertyWarnings).toHaveLength(0);
    });

    it("SearchableSelect: renders with searchPlaceholder without logging any React DOM warnings", () => {
      render(
        <SearchableSelect
          options={[{ value: "1", label: "Opcja 1" }]}
          searchPlaceholder="Szukaj opcji..."
          placeholder="Wybierz..."
        />
      );

      const domPropertyWarnings = consoleErrorSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("searchPlaceholder") ||
              arg.includes("React does not recognize") ||
              arg.includes("validateDOMNesting"))
        )
      );

      expect(domPropertyWarnings).toHaveLength(0);
    });

    it("Full Module Renders: zero React DOM console errors across all 4 harmonized module views", () => {
      // Mount Materials Catalog
      const { unmount: u1 } = render(
        <MaterialsCatalogTab
          materials={[]}
          materialTypes={[]}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAddDistribution={vi.fn()}
        />
      );
      u1();

      // Mount Registers Filter Bar
      const { unmount: u2 } = render(
        <RegistersFilterBar
          year=""
          onYearChange={vi.fn()}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={vi.fn()}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={[{ id: "s1", dictType: "jrwa_symbols", code: "966.1", label: "OZiPZ", isSystem: true, createdAt: "", updatedAt: "" }]}
          educators={["Jan Kowalski"]}
          isFiltered={false}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );
      u2();

      // Mount Contacts Filter Bar
      const { unmount: u3 } = render(
        <ContactsFilterBar
          search=""
          onSearchChange={vi.fn()}
          positionFilter="all"
          onPositionFilterChange={vi.fn()}
          positions={["Dyrektor"]}
          muniFilter="all"
          onMuniFilterChange={vi.fn()}
          municipalities={["Myślibórz"]}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );
      u3();

      // Mount Letters Section
      const { unmount: u4 } = render(
        <LettersSection
          letters={[]}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      u4();

      const domErrors = consoleErrorSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("React does not recognize") ||
              arg.includes("searchPlaceholder") ||
              arg.includes("Warning:"))
        )
      );

      expect(domErrors).toHaveLength(0);
    });
  });

  // =========================================================================
  // Challenge 4: Safe Event Bubbling & Action Isolation (R2)
  // =========================================================================
  describe("Challenge 4: Event Bubbling & Action Isolation", () => {
    it("MaterialsCatalogTab: action buttons (Edit, Delete, Add Distribution) stop event propagation", () => {
      const onActionEdit = vi.fn();
      const onActionDelete = vi.fn();
      const onAddDist = vi.fn();

      const sampleMaterial: OzipzMaterial = {
        id: "mat-100",
        title: "Testowy Poradnik",
        materialType: "Broszura",
        topic: "",
        publisher: "",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      render(
        <MaterialsCatalogTab
          materials={[sampleMaterial]}
          materialTypes={[]}
          onOpenAdd={vi.fn()}
          onEdit={onActionEdit}
          onDelete={onActionDelete}
          onOpenAddDistribution={onAddDist}
        />
      );

      // Clicking the Add Distribution icon button
      const addDistBtn = screen.getByRole("button", { name: "Wystaw rozdzielnik" });
      fireEvent.click(addDistBtn);
      expect(onAddDist).toHaveBeenCalledWith("mat-100");

      // Clicking Edit icon button
      const editBtn = screen.getByRole("button", { name: "Edytuj materiał" });
      fireEvent.click(editBtn);
      expect(onActionEdit).toHaveBeenCalledWith(sampleMaterial);

      // Clicking Delete icon button
      const deleteBtn = screen.getByRole("button", { name: "Usuń materiał" });
      fireEvent.click(deleteBtn);
      expect(onActionDelete).toHaveBeenCalledWith("mat-100");
    });
  });
});
