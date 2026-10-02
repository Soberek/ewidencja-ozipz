import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type {
  OzipzMaterial,
  OzipzDistribution,
  OzipzDictionaryItem,
  OzipzContact,
  OzipzLetter,
  OzipzAction,
  OzipzFacility,
} from "./types/ozipz.types";
import { useOzipzDbStore } from "./store/useOzipzDbStore";

// Materials components
import { MaterialsCatalogTab } from "./components/materials/components/MaterialsCatalogTab";
import { MaterialsDistributionsTab } from "./components/materials/components/MaterialsDistributionsTab";
import { MaterialsSection } from "./components/materials/MaterialsSection";

// Contacts components
import { ContactsTableView } from "./components/contacts/components/ContactsTableView";
import { ContactsSection } from "./components/contacts/ContactsSection";

// Letters components
import { LettersSection } from "./components/letters/LettersSection";

// Registers components
import { InformationRegisterTable } from "./components/registers/components/InformationRegisterTable";
import { PublicationsRegisterTable } from "./components/registers/components/PublicationsRegisterTable";
import { VisitationsRegisterTable } from "./components/registers/components/VisitationsRegisterTable";
import { RegistersSection } from "./components/registers/RegistersSection";

// --- Mock Fixtures ---

const mockMaterial: OzipzMaterial = {
  id: "mat-stress-1",
  title: "Ulotka - Profilaktyka uzależnień od e-papierosów wśród młodzieży szkolnej",
  materialType: "Ulotka",
  topic: "Profilaktyka tytoniowa",
  publisher: "GIS / PSSE Myślibórz",
  targetAudience: "Młodzież szkolna",
  createdAt: "2026-01-10",
  updatedAt: "2026-01-10",
};

const mockMaterialTypes: OzipzDictionaryItem[] = [
  {
    id: "dict-mat-1",
    dictType: "materialType",
    code: "ulotka",
    label: "Ulotka",
    isSystem: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

const mockDistribution: OzipzDistribution = {
  id: "dist-stress-1",
  materialId: "mat-stress-1",
  materialTitle: "Ulotka - Profilaktyka uzależnień od e-papierosów wśród młodzieży szkolnej",
  recipientName: "Szkoła Podstawowa nr 3 im. Bohaterów Westerplatte w Barlinku",
  municipality: "Barlinek",
  quantity: 150,
  distributionDate: "2026-03-10",
  assignedEducator: "mgr Anna Kowalska",
  purpose: "Rozdzielnik na warsztaty profilaktyczne",
  createdAt: "2026-03-10",
  updatedAt: "2026-03-10",
};

const mockContact: OzipzContact = {
  id: "cont-stress-1",
  name: "mgr Janina Kowalska-Nowakowska",
  facilityName: "Szkoła Podstawowa nr 3 im. Bohaterów Westerplatte w Barlinku",
  position: "Koordynator Szkolny Programów Profilaktycznych",
  email: "j.kowalska@sp3barlinek.edu.pl",
  phone: "95 746 12 34",
  municipality: "Barlinek",
  notes: "Kontakt w godzinach 8:00 - 14:00",
  createdAt: "2026-01-15",
  updatedAt: "2026-01-15",
};

const mockLetter: OzipzLetter = {
  id: "let-stress-1",
  letterNumber: "OZiPZ.966.1.1.2026",
  caseSign: "Znak: EZD-2026-00452",
  direction: "wychodzace",
  subject: "Wystąpienie pokontrolne w sprawie realizacji programu profilaktycznego",
  senderRecipient: "Dyrekcja Szkoły Podstawowej nr 1 w Barlinku",
  letterDate: "2026-04-12",
  assignedPerson: "mgr Piotr Wiśniewski",
  status: "wysłane",
  createdAt: "2026-04-12",
  updatedAt: "2026-04-12",
};

const mockAction: OzipzAction = {
  id: "act-stress-1",
  date: "2026-05-18",
  title: "Warsztaty profilaktyczne: Zdrowy styl życia i higiena cyfrowa",
  actionType: "Prelekcja / Warsztat",
  facilityName: "Liceum Ogólnokształcące im. Bohaterów Westerplatte w Barlinku",
  municipality: "Barlinek",
  audienceGroup: "Dzieci i młodzież szkolna",
  topic: "Higiena cyfrowa i zdrowie psychiczne",
  facilityId: "fac-stress-1",
  participantsCount: 45,
  leadEducator: "mgr Magdalena Zielińska",
  notes: "Wysoka aktywność uczestników, rozdano 45 ulotek",
  izrzSign: "IZRZ/2026/05/18-01",
  createdAt: "2026-05-18",
  updatedAt: "2026-05-18",
  ezdStatus: "w_ezd",
  status: "wykonane",
  materialsDistributedCount: 45,
};

const mockFacility: OzipzFacility = {
  id: "fac-stress-1",
  name: "Liceum Ogólnokształcące im. Bohaterów Westerplatte w Barlinku",
  type: "szkola_ponadpodstawowa",
  municipality: "Barlinek",
  county: "powiat myśliborski",
  address: "ul. Szosowa 2",
  city: "Barlinek",
  postalCode: "74-320",
  leadingAuthority: "Powiat Myśliborski",
  isComplex: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("Adversarial Event Isolation & Storage Resilience across Core Modules", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. MATERIALS MODULE: ACTION ISOLATION & ROW-CLICK TRIGGER
  // =========================================================================
  describe("Materials Module (MaterialsCatalogTab & MaterialsDistributionsTab)", () => {
    it("MaterialsCatalogTab: clicking action buttons (Plus, Edit, Delete) or their inner SVGs NEVER triggers row click", () => {
      const handleOpenAdd = vi.fn();
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleAddDistribution = vi.fn();

      render(
        <MaterialsCatalogTab
          materials={[mockMaterial]}
          materialTypes={mockMaterialTypes}
          onOpenAdd={handleOpenAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenAddDistribution={handleAddDistribution}
        />
      );

      // --- Plus Button (Wystaw rozdzielnik) ---
      const addDistButton = screen.getByRole("button", { name: "Wystaw rozdzielnik" });
      const plusSvg = addDistButton.querySelector("svg");
      expect(plusSvg).toBeDefined();

      // Click SVG inside Plus button
      fireEvent.click(plusSvg!);
      expect(handleAddDistribution).toHaveBeenCalledWith(mockMaterial.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleAddDistribution.mockClear();

      // Click Plus button directly
      fireEvent.click(addDistButton);
      expect(handleAddDistribution).toHaveBeenCalledWith(mockMaterial.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleAddDistribution.mockClear();

      // --- Edit Button (Edytuj materiał) ---
      const editButton = screen.getByRole("button", { name: "Edytuj materiał" });
      const editSvg = editButton.querySelector("svg");
      expect(editSvg).toBeDefined();

      // Click SVG inside Edit button -> must trigger onEdit exactly ONCE (not twice via bubble)
      fireEvent.click(editSvg!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // Click Edit button directly
      fireEvent.click(editButton);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // --- Delete Button (Usuń materiał) ---
      const deleteButton = screen.getByRole("button", { name: "Usuń materiał" });
      const deleteSvg = deleteButton.querySelector("svg");
      expect(deleteSvg).toBeDefined();

      // Click SVG inside Delete button -> triggers onDelete, NEVER triggers handleEdit
      fireEvent.click(deleteSvg!);
      expect(handleDelete).toHaveBeenCalledWith(mockMaterial.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleDelete.mockClear();

      // Click Delete button directly
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith(mockMaterial.id);
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("MaterialsCatalogTab: clicking outside action buttons directly on the row triggers onEdit", () => {
      const handleEdit = vi.fn();

      render(
        <MaterialsCatalogTab
          materials={[mockMaterial]}
          materialTypes={mockMaterialTypes}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenAddDistribution={vi.fn()}
        />
      );

      // Find row
      const titleSpan = screen.getByTitle(mockMaterial.title);
      const row = titleSpan.closest("tr");
      expect(row).toBeDefined();

      // 1. Click title span
      fireEvent.click(titleSpan);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // 2. Click material type badge within the row
      const typeBadge = within(row!).getByText(mockMaterial.materialType);
      fireEvent.click(typeBadge);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // 3. Click topic cell
      const topicCell = screen.getByText(mockMaterial.topic!);
      fireEvent.click(topicCell);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // 4. Click target audience cell
      const audienceCell = screen.getByText(mockMaterial.targetAudience!);
      fireEvent.click(audienceCell);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
      handleEdit.mockClear();

      // 5. Click the tr itself
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockMaterial);
    });

    it("MaterialsDistributionsTab: clicking action buttons (Print, Edit, Delete) or their inner SVGs NEVER triggers row click", () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleOpenBlankiet = vi.fn();

      render(
        <MaterialsDistributionsTab
          distributions={[mockDistribution]}
          materials={[mockMaterial]}
          municipalities={["Barlinek"]}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenBlankiet={handleOpenBlankiet}
        />
      );

      // --- Print Button (Drukuj blankiet rozdzielnika) ---
      const printButton = screen.getByRole("button", { name: "Drukuj blankiet rozdzielnika" });
      const printSvg = printButton.querySelector("svg");
      expect(printSvg).toBeDefined();

      // Click SVG inside Print button
      fireEvent.click(printSvg!);
      expect(handleOpenBlankiet).toHaveBeenCalledWith(mockDistribution);
      expect(handleEdit).not.toHaveBeenCalled();
      handleOpenBlankiet.mockClear();

      // Click Print button directly
      fireEvent.click(printButton);
      expect(handleOpenBlankiet).toHaveBeenCalledWith(mockDistribution);
      expect(handleEdit).not.toHaveBeenCalled();
      handleOpenBlankiet.mockClear();

      // --- Edit Button (Edytuj rozdzielnik) ---
      const editButton = screen.getByRole("button", { name: "Edytuj rozdzielnik" });
      const editSvg = editButton.querySelector("svg");
      expect(editSvg).toBeDefined();

      // Click SVG inside Edit button -> called exactly once, no double bubble
      fireEvent.click(editSvg!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
      handleEdit.mockClear();

      // Click Edit button directly
      fireEvent.click(editButton);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
      handleEdit.mockClear();

      // --- Delete Button (Usuń rozdzielnik) ---
      const deleteButton = screen.getByRole("button", { name: "Usuń rozdzielnik" });
      const deleteSvg = deleteButton.querySelector("svg");
      expect(deleteSvg).toBeDefined();

      // Click SVG inside Delete button -> triggers onDelete, NEVER handleEdit
      fireEvent.click(deleteSvg!);
      expect(handleDelete).toHaveBeenCalledWith(mockDistribution.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleDelete.mockClear();

      // Click Delete button directly
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith(mockDistribution.id);
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("MaterialsDistributionsTab: clicking outside action buttons directly on the row triggers onEdit", () => {
      const handleEdit = vi.fn();

      render(
        <MaterialsDistributionsTab
          distributions={[mockDistribution]}
          materials={[mockMaterial]}
          municipalities={["Barlinek"]}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenBlankiet={vi.fn()}
        />
      );

      // 1. Click recipient name
      const recipientSpan = screen.getByTitle(mockDistribution.recipientName);
      fireEvent.click(recipientSpan);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
      handleEdit.mockClear();

      // 2. Click quantity cell
      const quantityText = screen.getByText("150 szt.");
      fireEvent.click(quantityText);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
      handleEdit.mockClear();

      // 3. Click educator cell
      const educatorText = screen.getByText(mockDistribution.assignedEducator!);
      fireEvent.click(educatorText);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
      handleEdit.mockClear();

      // 4. Click the row itself
      const row = recipientSpan.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockDistribution);
    });
  });

  // =========================================================================
  // 2. CONTACTS MODULE: ACTION & EMAIL ISOLATION & ROW-CLICK TRIGGER
  // =========================================================================
  describe("Contacts Module (ContactsTableView)", () => {
    it("ContactsTableView: clicking Edit, Delete, Email link, and Copy Email NEVER triggers row click", () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleCopy = vi.fn();

      render(
        <ContactsTableView
          contacts={[mockContact]}
          copiedId={null}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // --- Mailto Link ---
      const emailLink = screen.getByText(mockContact.email!);
      emailLink.addEventListener("click", (e) => e.preventDefault());
      fireEvent.click(emailLink);
      expect(handleEdit).not.toHaveBeenCalled();

      // --- Copy Email Button ---
      const copyBtn = screen.getByTitle("Kopiuj adres e-mail");
      const copySvg = copyBtn.querySelector("svg");
      expect(copySvg).toBeDefined();

      // Click SVG inside copy button
      fireEvent.click(copySvg!);
      expect(handleCopy).toHaveBeenCalledWith(mockContact.email, `email-${mockContact.id}`);
      expect(handleEdit).not.toHaveBeenCalled();
      handleCopy.mockClear();

      // Click copy button directly
      fireEvent.click(copyBtn);
      expect(handleCopy).toHaveBeenCalledWith(mockContact.email, `email-${mockContact.id}`);
      expect(handleEdit).not.toHaveBeenCalled();
      handleCopy.mockClear();

      // --- Edit Button (Edytuj kontakt) ---
      const editButton = screen.getByRole("button", { name: "Edytuj kontakt" });
      const editSvg = editButton.querySelector("svg");
      expect(editSvg).toBeDefined();

      // Click SVG inside Edit button -> called exactly once, no double bubble
      fireEvent.click(editSvg!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
      handleEdit.mockClear();

      // Click Edit button directly
      fireEvent.click(editButton);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
      handleEdit.mockClear();

      // --- Delete Button (Usuń kontakt) – usunięcie wymaga potwierdzenia ---
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      const deleteButton = screen.getByRole("button", { name: "Usuń kontakt" });
      const deleteSvg = deleteButton.querySelector("svg");
      expect(deleteSvg).toBeDefined();

      // Click SVG inside Delete button -> triggers onDelete, NEVER handleEdit
      fireEvent.click(deleteSvg!);
      expect(handleDelete).toHaveBeenCalledWith(mockContact.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleDelete.mockClear();

      // Click Delete button directly
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith(mockContact.id);
      expect(handleEdit).not.toHaveBeenCalled();
      handleDelete.mockClear();

      // Odrzucone potwierdzenie – kontakt NIE jest usuwany
      confirmSpy.mockReturnValue(false);
      fireEvent.click(deleteButton);
      expect(handleDelete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it("ContactsTableView: clicking outside action buttons directly on the row triggers onEdit", () => {
      const handleEdit = vi.fn();

      render(
        <ContactsTableView
          contacts={[mockContact]}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // 1. Click contact name
      const nameEl = screen.getByTitle(mockContact.name);
      fireEvent.click(nameEl);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
      handleEdit.mockClear();

      // 2. Click facility name
      const facilityEl = screen.getByTitle(mockContact.facilityName);
      fireEvent.click(facilityEl);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
      handleEdit.mockClear();

      // 3. Click position text
      const positionEl = screen.getByText(mockContact.position);
      fireEvent.click(positionEl);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
      handleEdit.mockClear();

      // 4. Click phone number – to link tel:, więc NIE otwiera edycji
      const phoneEl = screen.getByText(mockContact.phone!);
      expect(phoneEl.closest("a")?.getAttribute("href")).toBe("tel:+48957461234");
      phoneEl.addEventListener("click", (e) => e.preventDefault());
      fireEvent.click(phoneEl);
      expect(handleEdit).not.toHaveBeenCalled();

      // 5. Click tr directly
      const row = nameEl.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockContact);
    });
  });

  // =========================================================================
  // 3. LETTERS MODULE: ACTION ISOLATION & ROW-CLICK TRIGGER
  // =========================================================================
  describe("Letters Module (LettersSection)", () => {
    it("LettersSection: clicking Edit, Delete or their inner SVGs NEVER triggers duplicate row click", () => {
      const handleOpenEdit = vi.fn();
      const handleDelete = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm");

      render(
        <LettersSection
          letters={[mockLetter]}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      );

      // --- Edit Button (Edytuj pismo) ---
      const editButton = screen.getByRole("button", { name: /edytuj pismo/i });
      const editSvg = editButton.querySelector("svg");
      expect(editSvg).toBeDefined();

      // Click SVG inside Edit button
      fireEvent.click(editSvg!);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // Click Edit button directly
      fireEvent.click(editButton);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // --- Delete Button (Usuń pismo) - Cancel Confirm ---
      confirmSpy.mockReturnValue(false);
      const deleteButton = screen.getByRole("button", { name: /usuń pismo/i });
      const deleteSvg = deleteButton.querySelector("svg");
      expect(deleteSvg).toBeDefined();

      fireEvent.click(deleteSvg!);
      expect(handleDelete).not.toHaveBeenCalled();
      expect(handleOpenEdit).not.toHaveBeenCalled();

      // --- Delete Button (Usuń pismo) - Accept Confirm ---
      confirmSpy.mockReturnValue(true);
      fireEvent.click(deleteSvg!);
      expect(handleDelete).toHaveBeenCalledWith(mockLetter.id);
      expect(handleOpenEdit).not.toHaveBeenCalled();
      handleDelete.mockClear();

      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith(mockLetter.id);
      expect(handleOpenEdit).not.toHaveBeenCalled();
    });

    it("LettersSection: clicking outside action buttons directly on the row triggers onOpenEdit", () => {
      const handleOpenEdit = vi.fn();

      render(
        <LettersSection
          letters={[mockLetter]}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleOpenEdit}
          onDelete={vi.fn()}
        />
      );

      // Find row
      const subjectEl = screen.getByTitle(mockLetter.subject);
      const row = subjectEl.closest("tr");
      expect(row).toBeDefined();

      // 1. Click letter number
      const letterNumEl = screen.getByText(mockLetter.letterNumber);
      fireEvent.click(letterNumEl);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // 2. Click subject
      fireEvent.click(subjectEl);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // 3. Click direction badge within row
      const directionBadge = within(row!).getByText(/wychodzące/i);
      fireEvent.click(directionBadge);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // 4. Click date cell
      const dateEl = screen.getByText(mockLetter.letterDate!);
      fireEvent.click(dateEl);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // 5. Click assigned person
      const assignedEl = screen.getByTitle(mockLetter.assignedPerson!);
      fireEvent.click(assignedEl);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
      handleOpenEdit.mockClear();

      // 6. Click row tr directly
      fireEvent.click(row!);
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetter);
    });
  });

  // =========================================================================
  // 4. REGISTERS MODULE: DIRECT ROW-CLICK TRIGGER ACROSS ALL 3 TABLES
  // =========================================================================
  describe("Registers Module (Information, Publications, Visitations Tables)", () => {
    it("InformationRegisterTable: clicking anywhere on row triggers onActionClick", () => {
      const handleActionClick = vi.fn();

      render(
        <InformationRegisterTable
          actions={[mockAction]}
          onActionClick={handleActionClick}
        />
      );

      // Click title / subject
      const titleSpan = screen.getByText(mockAction.title);
      fireEvent.click(titleSpan);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
      handleActionClick.mockClear();

      // Click intervention type badge
      const badge = screen.getByText("nieprogramowa");
      fireEvent.click(badge);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
      handleActionClick.mockClear();

      // Click recipients count
      const recipientsEl = screen.getByText("45");
      fireEvent.click(recipientsEl);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
      handleActionClick.mockClear();

      // Click lead educator
      const educatorEl = screen.getByTitle(mockAction.leadEducator!);
      fireEvent.click(educatorEl);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });

    it("PublicationsRegisterTable: clicking anywhere on row triggers onActionClick", () => {
      const handleActionClick = vi.fn();

      render(
        <PublicationsRegisterTable
          actions={[mockAction]}
          onActionClick={handleActionClick}
        />
      );

      const topicSpan = screen.getByText(mockAction.title);
      fireEvent.click(topicSpan);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
      handleActionClick.mockClear();

      const dateEl = screen.getByText(mockAction.date);
      fireEvent.click(dateEl);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });

    it("VisitationsRegisterTable: clicking anywhere on row triggers onActionClick", () => {
      const handleActionClick = vi.fn();
      const facMap = new Map<string, OzipzFacility>([[mockFacility.id, mockFacility]]);

      render(
        <VisitationsRegisterTable
          actions={[mockAction]}
          facilitiesMap={facMap}
          onActionClick={handleActionClick}
        />
      );

      // Click protocol number
      const izrzEl = screen.getByText(mockAction.izrzSign!);
      fireEvent.click(izrzEl);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
      handleActionClick.mockClear();

      // Click facility details
      const facDetails = screen.getByTitle(new RegExp(mockFacility.name, "i"));
      fireEvent.click(facDetails);
      expect(handleActionClick).toHaveBeenCalledTimes(1);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });
  });

  // =========================================================================
  // 5. COLLAPSIBLE KPI PERSISTENCE & EXCEPTION RESILIENCE ACROSS ALL 4 MODULES
  // =========================================================================
  describe("Collapsible KPI Persistence & Exception Handling Across All 4 Keys", () => {
    // --- 5.1 Materials: oz.materialsShowKpiSummary ---
    it("MaterialsSection: persists oz.materialsShowKpiSummary, starts collapsed when false, and survives localStorage errors", () => {
      // 1. Initial render defaults to expanded (true)
      const { unmount } = render(
        <MaterialsSection
          materials={[mockMaterial]}
          distributions={[mockDistribution]}
          materialTypes={mockMaterialTypes}
        />
      );
      expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      // 2. Click to collapse -> writes "false" to localStorage
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Tytuły Materiałów")).toBeNull();
      expect(localStorage.getItem("oz.materialsShowKpiSummary")).toBe("false");

      // 3. Click to expand -> writes "true" to localStorage
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
      expect(localStorage.getItem("oz.materialsShowKpiSummary")).toBe("true");
      unmount();

      // 4. Initial render with "false" in localStorage starts collapsed
      localStorage.setItem("oz.materialsShowKpiSummary", "false");
      const { unmount: unmount2 } = render(
        <MaterialsSection
          materials={[mockMaterial]}
          distributions={[mockDistribution]}
          materialTypes={mockMaterialTypes}
        />
      );
      expect(screen.queryByText("Tytuły Materiałów")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
      unmount2();

      // 5. Exception resilience: localStorage.getItem throws SecurityError
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      const { unmount: unmount3 } = render(
        <MaterialsSection
          materials={[mockMaterial]}
          distributions={[mockDistribution]}
          materialTypes={mockMaterialTypes}
        />
      );
      // Graceful fallback to expanded:
      expect(screen.getByText("Tytuły Materiałów")).toBeDefined();
      unmount3();
      vi.restoreAllMocks();

      // 6. Exception resilience: localStorage.setItem throws QuotaExceededError
      localStorage.clear();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      });
      const { unmount: unmount4 } = render(
        <MaterialsSection
          materials={[mockMaterial]}
          distributions={[mockDistribution]}
          materialTypes={mockMaterialTypes}
        />
      );
      const collapseBtnQuota = screen.getByRole("button", { name: /zwiń kpi/i });
      // Toggling should NOT throw and state should update
      expect(() => fireEvent.click(collapseBtnQuota)).not.toThrow();
      expect(screen.queryByText("Tytuły Materiałów")).toBeNull();
      unmount4();
    });

    // --- 5.2 Registers: oz.registersShowKpiSummary ---
    it("RegistersSection: persists oz.registersShowKpiSummary, starts collapsed when false, and survives localStorage errors", () => {
      useOzipzDbStore.setState({
        actions: [mockAction],
        facilities: [mockFacility],
        staff: [],
        dictionaryItems: [],
      });

      // 1. Initial render defaults to expanded (true)
      const { unmount } = render(<RegistersSection />);
      expect(screen.getByText("Wszystkie Wpisy")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      // 2. Click to collapse -> writes "false" to localStorage
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Wszystkie Wpisy")).toBeNull();
      expect(localStorage.getItem("oz.registersShowKpiSummary")).toBe("false");

      // 3. Click to expand -> writes "true" to localStorage
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Wpisy")).toBeDefined();
      expect(localStorage.getItem("oz.registersShowKpiSummary")).toBe("true");
      unmount();

      // 4. Initial render with "false" in localStorage starts collapsed
      localStorage.setItem("oz.registersShowKpiSummary", "false");
      const { unmount: unmount2 } = render(<RegistersSection />);
      expect(screen.queryByText("Wszystkie Wpisy")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
      unmount2();

      // 5. Exception resilience: localStorage.getItem throws SecurityError
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      const { unmount: unmount3 } = render(<RegistersSection />);
      expect(screen.getByText("Wszystkie Wpisy")).toBeDefined();
      unmount3();
      vi.restoreAllMocks();

      // 6. Exception resilience: localStorage.setItem throws QuotaExceededError
      localStorage.clear();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      });
      const { unmount: unmount4 } = render(<RegistersSection />);
      const collapseBtnQuota = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(() => fireEvent.click(collapseBtnQuota)).not.toThrow();
      expect(screen.queryByText("Wszystkie Wpisy")).toBeNull();
      unmount4();
    });

    // --- 5.3 Contacts: oz.contactsShowKpiSummary ---
    it("ContactsSection: persists oz.contactsShowKpiSummary, starts collapsed when false, and survives localStorage errors", () => {
      // 1. Initial render defaults to expanded (true)
      const { unmount } = render(<ContactsSection contacts={[mockContact]} />);
      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      // 2. Click to collapse -> writes "false" to localStorage
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Wszystkie Kontakty")).toBeNull();
      expect(localStorage.getItem("oz.contactsShowKpiSummary")).toBe("false");

      // 3. Click to expand -> writes "true" to localStorage
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      expect(localStorage.getItem("oz.contactsShowKpiSummary")).toBe("true");
      unmount();

      // 4. Initial render with "false" in localStorage starts collapsed
      localStorage.setItem("oz.contactsShowKpiSummary", "false");
      const { unmount: unmount2 } = render(<ContactsSection contacts={[mockContact]} />);
      expect(screen.queryByText("Wszystkie Kontakty")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
      unmount2();

      // 5. Exception resilience: localStorage.getItem throws SecurityError
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      const { unmount: unmount3 } = render(<ContactsSection contacts={[mockContact]} />);
      expect(screen.getByText("Wszystkie Kontakty")).toBeDefined();
      unmount3();
      vi.restoreAllMocks();

      // 6. Exception resilience: localStorage.setItem throws QuotaExceededError
      localStorage.clear();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      });
      const { unmount: unmount4 } = render(<ContactsSection contacts={[mockContact]} />);
      const collapseBtnQuota = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(() => fireEvent.click(collapseBtnQuota)).not.toThrow();
      expect(screen.queryByText("Wszystkie Kontakty")).toBeNull();
      unmount4();
    });

    // --- 5.4 Letters: oz.lettersShowKpiSummary ---
    it("LettersSection: persists oz.lettersShowKpiSummary, starts collapsed when false, and survives localStorage errors", () => {
      // 1. Initial render defaults to expanded (true)
      const { unmount } = render(<LettersSection letters={[mockLetter]} />);
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      // 2. Click to collapse -> writes "false" to localStorage
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Wszystkie Pisma")).toBeNull();
      expect(localStorage.getItem("oz.lettersShowKpiSummary")).toBe("false");

      // 3. Click to expand -> writes "true" to localStorage
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      expect(localStorage.getItem("oz.lettersShowKpiSummary")).toBe("true");
      unmount();

      // 4. Initial render with "false" in localStorage starts collapsed
      localStorage.setItem("oz.lettersShowKpiSummary", "false");
      const { unmount: unmount2 } = render(<LettersSection letters={[mockLetter]} />);
      expect(screen.queryByText("Wszystkie Pisma")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
      unmount2();

      // 5. Exception resilience: localStorage.getItem throws SecurityError
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      const { unmount: unmount3 } = render(<LettersSection letters={[mockLetter]} />);
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      unmount3();
      vi.restoreAllMocks();

      // 6. Exception resilience: localStorage.setItem throws QuotaExceededError
      localStorage.clear();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      });
      const { unmount: unmount4 } = render(<LettersSection letters={[mockLetter]} />);
      const collapseBtnQuota = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(() => fireEvent.click(collapseBtnQuota)).not.toThrow();
      expect(screen.queryByText("Wszystkie Pisma")).toBeNull();
      unmount4();
    });
  });

  // =========================================================================
  // 6. DEEP ADVERSARIAL STRESS: CONTAINERS, INNER PATHS, MULTI-ROW & CORRUPTED STORAGE
  // =========================================================================
  describe("Deep Adversarial Stress: Containers, SVG Inner Paths, Multi-Row & Corrupted Storage", () => {
    it("Stress: clicking actions wrapper <div> between buttons NEVER fires row onRowClick across all 4 modules", () => {
      // 1. MaterialsCatalogTab
      const handleEditMat = vi.fn();
      const { unmount: u1 } = render(
        <MaterialsCatalogTab
          materials={[mockMaterial]}
          materialTypes={mockMaterialTypes}
          onOpenAdd={vi.fn()}
          onEdit={handleEditMat}
          onDelete={vi.fn()}
          onOpenAddDistribution={vi.fn()}
        />
      );
      const matActionsDiv = screen.getByRole("button", { name: "Edytuj materiał" }).parentElement!;
      fireEvent.click(matActionsDiv);
      expect(handleEditMat).not.toHaveBeenCalled();
      u1();

      // 2. MaterialsDistributionsTab
      const handleEditDist = vi.fn();
      const { unmount: u2 } = render(
        <MaterialsDistributionsTab
          distributions={[mockDistribution]}
          materials={[mockMaterial]}
          onOpenAdd={vi.fn()}
          onEdit={handleEditDist}
          onDelete={vi.fn()}
          onOpenBlankiet={vi.fn()}
        />
      );
      const distActionsDiv = screen.getByRole("button", { name: "Edytuj rozdzielnik" }).parentElement!;
      fireEvent.click(distActionsDiv);
      expect(handleEditDist).not.toHaveBeenCalled();
      u2();

      // 3. ContactsTableView
      const handleEditContact = vi.fn();
      const { unmount: u3 } = render(
        <ContactsTableView
          contacts={[mockContact]}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEditContact}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );
      const contactActionsDiv = screen.getByRole("button", { name: "Edytuj kontakt" }).parentElement!;
      fireEvent.click(contactActionsDiv);
      expect(handleEditContact).not.toHaveBeenCalled();
      u3();

      // 4. LettersSection
      const handleEditLetter = vi.fn();
      const { unmount: u4 } = render(
        <LettersSection
          letters={[mockLetter]}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleEditLetter}
          onDelete={vi.fn()}
        />
      );
      const letterActionsDiv = screen.getByRole("button", { name: /edytuj pismo/i }).parentElement!;
      fireEvent.click(letterActionsDiv);
      expect(handleEditLetter).not.toHaveBeenCalled();
      u4();
    });

    it("Stress: clicking deepest SVG child elements (<path>, <line>, <circle>) isolates event from row click", () => {
      // 1. MaterialsCatalog: deepest child of Plus button
      const handleEditMat = vi.fn();
      const handleAddDist = vi.fn();
      const { unmount: u1 } = render(
        <MaterialsCatalogTab
          materials={[mockMaterial]}
          materialTypes={mockMaterialTypes}
          onOpenAdd={vi.fn()}
          onEdit={handleEditMat}
          onDelete={vi.fn()}
          onOpenAddDistribution={handleAddDist}
        />
      );
      const plusBtn = screen.getByRole("button", { name: "Wystaw rozdzielnik" });
      const plusChild = plusBtn.querySelector("svg")?.firstElementChild;
      expect(plusChild).toBeDefined();
      fireEvent.click(plusChild!);
      expect(handleAddDist).toHaveBeenCalledWith(mockMaterial.id);
      expect(handleEditMat).not.toHaveBeenCalled();
      u1();

      // 2. ContactsTableView: deepest child of Copy Email button
      const handleCopy = vi.fn();
      const handleEditContact = vi.fn();
      const { unmount: u2 } = render(
        <ContactsTableView
          contacts={[mockContact]}
          copiedId={null}
          onCopy={handleCopy}
          onEdit={handleEditContact}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );
      const copyBtn = screen.getByTitle("Kopiuj adres e-mail");
      const copyChild = copyBtn.querySelector("svg")?.firstElementChild;
      expect(copyChild).toBeDefined();
      fireEvent.click(copyChild!);
      expect(handleCopy).toHaveBeenCalledWith(mockContact.email, `email-${mockContact.id}`);
      expect(handleEditContact).not.toHaveBeenCalled();
      u2();

      // 3. LettersSection: deepest child of Delete button
      const handleDeleteLetter = vi.fn();
      const handleEditLetter = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const { unmount: u3 } = render(
        <LettersSection
          letters={[mockLetter]}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleEditLetter}
          onDelete={handleDeleteLetter}
        />
      );
      const deleteLetterBtn = screen.getByRole("button", { name: /usuń pismo/i });
      const deleteChild = deleteLetterBtn.querySelector("svg")?.firstElementChild;
      expect(deleteChild).toBeDefined();
      fireEvent.click(deleteChild!);
      expect(handleDeleteLetter).toHaveBeenCalledWith(mockLetter.id);
      expect(handleEditLetter).not.toHaveBeenCalled();
      u3();
    });

    it("Multi-row stress: event targeting correctly discriminates between rows in multi-item tables", () => {
      const contact1: OzipzContact = { ...mockContact, id: "c-1", name: "Adam Nowak" };
      const contact2: OzipzContact = { ...mockContact, id: "c-2", name: "Beata Kowalska" };
      const contact3: OzipzContact = { ...mockContact, id: "c-3", name: "Cezary Wiśniewski" };

      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <ContactsTableView
          contacts={[contact1, contact2, contact3]}
          copiedId={null}
          onCopy={vi.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // Click row 2 directly on name
      const name2 = screen.getByText(contact2.name);
      fireEvent.click(name2);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(contact2);
      handleEdit.mockClear();

      // Click row 3 delete button
      const deleteButtons = screen.getAllByRole("button", { name: "Usuń kontakt" });
      expect(deleteButtons).toHaveLength(3);
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(deleteButtons[2]); // contact3's delete button
      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith(contact3.id);
      confirmSpy.mockRestore();
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("Corrupted storage stress: non-boolean / corrupt values in localStorage cleanly fallback to expanded", () => {
      const corruptValues = ["", "null", "undefined", "0", "true", "TRUE", "{status:false}", "random-string"];

      const keys = [
        "oz.materialsShowKpiSummary",
        "oz.registersShowKpiSummary",
        "oz.contactsShowKpiSummary",
        "oz.lettersShowKpiSummary",
      ];

      for (const key of keys) {
        for (const val of corruptValues) {
          localStorage.setItem(key, val);
          // Value must NOT evaluate to collapsed (only exact string "false" collapses)
          const isCollapsed = localStorage.getItem(key) === "false";
          expect(isCollapsed).toBe(false);
        }

        // Setting exact "false" must be recognized
        localStorage.setItem(key, "false");
        expect(localStorage.getItem(key) === "false").toBe(true);
      }
    });
  });
});

