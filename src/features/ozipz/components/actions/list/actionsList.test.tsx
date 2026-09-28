import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActionsFilterBar } from "./ActionsFilterBar";
import { ActionsBulkToolbar } from "./ActionsBulkToolbar";
import { ActionsMonthManagementModal } from "./ActionsMonthManagementModal";
import { ActionsAdvancedFiltersPanel } from "./ActionsAdvancedFiltersPanel";
import { ActionsFilterChips } from "./ActionsFilterChips";
import { createActionColumns } from "./ActionsTableColumns";
import { ActionsTableView } from "./ActionsTableView";
import type {
  OzipzDictionaryItem,
  OzipzProgram,
  OzipzStaff,
} from "../../../types/ozipz.types";

describe("Actions List Components", () => {
  it("renders ActionsFilterBar and fires search, advanced and quick filter callbacks", () => {
    const handleSearch = vi.fn();
    const handleToggleEzd = vi.fn();
    const handleToggleMaterials = vi.fn();
    const handleTogglePublications = vi.fn();
    const handleToggleAdvanced = vi.fn();

    render(
      <ActionsFilterBar
        search="Higiena"
        onSearchChange={handleSearch}
        selectedMonth=""
        onMonthChange={vi.fn()}
        statusFilter="aktywne"
        onStatusFilterChange={vi.fn()}
        quickFilterEzd={false}
        onToggleEzd={handleToggleEzd}
        quickFilterCurrentMonth={false}
        onToggleCurrentMonth={vi.fn()}
        quickFilterProgramOnly={false}
        onToggleProgramOnly={vi.fn()}
        quickFilterInProgress={false}
        onToggleInProgress={vi.fn()}
        materialsOnlyFilter={false}
        onToggleMaterialsOnly={handleToggleMaterials}
        quickFilterPublications={false}
        onTogglePublications={handleTogglePublications}
        hidePublications={true}
        onToggleHidePublications={vi.fn()}
        isAdvancedOpen={false}
        onToggleAdvanced={handleToggleAdvanced}
        advancedFiltersCount={2}
        activeFiltersCount={3}
        onClearFilters={vi.fn()}
      />
    );

    const hidePubBtn = screen.getByText("Schowaj publikacje");
    expect(hidePubBtn).toBeDefined();

    const ezdBtn = screen.getByText("! Wymaga EZD");
    fireEvent.click(ezdBtn);
    expect(handleToggleEzd).toHaveBeenCalled();

    const pubBtn = screen.getByText("Publikacje (X, FB, www)");
    fireEvent.click(pubBtn);
    expect(handleTogglePublications).toHaveBeenCalled();

    const matBtn = screen.getByText(/Materiały \(MAT > 0\)/i);
    fireEvent.click(matBtn);
    expect(handleToggleMaterials).toHaveBeenCalled();

    const advBtn = screen.getByText("Więcej filtrów");
    fireEvent.click(advBtn);
    expect(handleToggleAdvanced).toHaveBeenCalled();  });

  it("renders ActionsAdvancedFiltersPanel with dynamic dictionary options", () => {
    const onToggleMunicipality = vi.fn();
    const mockMunicipalities: OzipzDictionaryItem[] = [
      { id: "m1", dictType: "municipality", code: "mysliborz", label: "Myślibórz", isSystem: true, createdAt: "", updatedAt: "" },
      { id: "m2", dictType: "municipality", code: "barlinek", label: "Barlinek", isSystem: true, createdAt: "", updatedAt: "" },
    ];
    const mockPrograms: OzipzProgram[] = [
      { id: "p1", code: "TF", name: "Trzymaj Formę!", editionYear: "2026", jrwaSymbol: "966.1", targetAudience: "Dzieci", description: "", status: "aktywny", participatingSchoolsCount: 10, totalPupilsReached: 200, createdAt: "", updatedAt: "" },
    ];
    const mockActivityTypes: OzipzDictionaryItem[] = [
      { id: "a1", dictType: "activity_type", code: "prelekcja", label: "Prelekcja (warsztat)", isSystem: true, createdAt: "", updatedAt: "" },
    ];
    const mockTopics: OzipzDictionaryItem[] = [
      { id: "t1", dictType: "topic", code: "tyton", label: "Tytoń i e-papierosy", isSystem: true, createdAt: "", updatedAt: "" },
    ];
    const mockStaff: OzipzStaff[] = [
      { id: "s1", fullName: "Jan Kowalski", role: "asystent", email: "jan@psse.gov.pl", phone: "123", active: true, createdAt: "", updatedAt: "" },
    ];

    const { rerender } = render(
      <ActionsAdvancedFiltersPanel
        isOpen={false}
        municipalityFilter=""
        onMunicipalityChange={vi.fn()}
        programFilter=""
        onProgramChange={vi.fn()}
        activityTypeFilter=""
        onActivityTypeChange={vi.fn()}
        topicFilter=""
        onTopicChange={vi.fn()}
        educatorFilter=""
        onEducatorChange={vi.fn()}
        ezdFilter="all"
        onEzdChange={vi.fn()}
        municipalities={mockMunicipalities}
        programs={mockPrograms}
        activityTypes={mockActivityTypes}
        topics={mockTopics}
        staff={mockStaff}
      />
    );

    // Should not render when isOpen is false
    expect(screen.queryByText("Gmina")).toBeNull();

    // Rerender with isOpen = true
    rerender(
      <ActionsAdvancedFiltersPanel
        isOpen={true}
        municipalityFilter="Barlinek"
        onMunicipalityChange={vi.fn()}
        selectedMunicipalities={["Barlinek"]}
        onToggleMunicipality={onToggleMunicipality}
        programFilter=""
        onProgramChange={vi.fn()}
        activityTypeFilter=""
        onActivityTypeChange={vi.fn()}
        topicFilter=""
        onTopicChange={vi.fn()}
        educatorFilter=""
        onEducatorChange={vi.fn()}
        ezdFilter="all"
        onEzdChange={vi.fn()}
        municipalities={mockMunicipalities}
        programs={mockPrograms}
        activityTypes={mockActivityTypes}
        topics={mockTopics}
        staff={mockStaff}
      />
    );

    expect(screen.getByText(/Gmina/)).toBeDefined();
    expect(screen.getByText(/Program/)).toBeDefined();
    expect(screen.getByText(/Forma/)).toBeDefined();
    expect(screen.getByText(/Tematyka/)).toBeDefined();
    expect(screen.getAllByText(/Edukator/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Status EZD/).length).toBeGreaterThanOrEqual(1);
    for (const name of ["Gmina (1)", "Program", "Forma", "Tematyka", "Edukator", "Status EZD"]) {
      expect(screen.getByLabelText(name).tagName).toBe("BUTTON");
    }
    fireEvent.click(screen.getByRole("button", { name: "Usuń filtr gminy Barlinek" }));
    expect(onToggleMunicipality).toHaveBeenCalledWith("Barlinek");
  });

  it("renders ActionsFilterChips with removable active filters and counts", () => {
    const handleRemoveMuni = vi.fn();
    const handleClearAll = vi.fn();

    render(
      <ActionsFilterChips
        filters={[
          { id: "muni", label: "Gmina", value: "Barlinek", onRemove: handleRemoveMuni },
          { id: "prog", label: "Program", value: "Trzymaj Formę!", onRemove: vi.fn() },
        ]}
        onClearAll={handleClearAll}
        filteredCount={5}
        totalCount={32}
      />
    );

    expect(screen.getByText(/Gmina:/)).toBeDefined();
    expect(screen.getByText(/Barlinek/)).toBeDefined();
    expect(screen.getByText(/Program:/)).toBeDefined();
    expect(screen.getByText(/Trzymaj Formę!/)).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();

    const removeBtn = screen.getByLabelText("Usuń filtr Gmina");
    fireEvent.click(removeBtn);
    expect(handleRemoveMuni).toHaveBeenCalledTimes(1);

    const clearAllBtn = screen.getByText("Wyczyść wszystkie (2)");
    fireEvent.click(clearAllBtn);
    expect(handleClearAll).toHaveBeenCalledTimes(1);
  });

  it("renders ActionsBulkToolbar with metrics, quick selection and delete confirmation", async () => {
    const handleBulkDelete = vi.fn();
    const handleClear = vi.fn();
    const handleSelectFirstN = vi.fn();
    const handleBulkExport = vi.fn();

    render(
      <ActionsBulkToolbar
        selectedCount={4}
        totalFilteredCount={20}
        selectedRecipientsCount={150}
        selectedMaterialsCount={40}
        selectedDoEzdCount={2}
        onSelectAll={vi.fn()}
        onSelectFirstN={handleSelectFirstN}
        onClearSelection={handleClear}
        onBulkExportCsv={handleBulkExport}
        onBulkDelete={handleBulkDelete}
      />
    );

    expect(screen.getByText("Wybrano 4 z 20 działań")).toBeDefined();
    expect(screen.getByText("150")).toBeDefined();
    expect(screen.getByText("40")).toBeDefined();
    expect(screen.getByText("2 do EZD")).toBeDefined();

    const quick5Btn = screen.getByText("Wybierz 5");
    fireEvent.click(quick5Btn);
    expect(handleSelectFirstN).toHaveBeenCalledWith(5);

    const exportBtn = screen.getByText("Eksportuj (.csv)");
    fireEvent.click(exportBtn);
    expect(handleBulkExport).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByText("Usuń");
    fireEvent.click(deleteBtn);
    expect(handleBulkDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Usuń wybrane działania")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Usuń działania" }));
    await waitFor(() => expect(handleBulkDelete).toHaveBeenCalledTimes(1));
  });

  it("renders ActionsMonthManagementModal and toggles lock", () => {
    const handleToggle = vi.fn();
    render(
      <ActionsMonthManagementModal
        isOpen={true}
        onClose={vi.fn()}
        currentYear={2026}
        closedMonths={new Set(["2026-07"])}
        onToggleMonthLock={handleToggle}
      />
    );

    expect(screen.getByText("Blokada Miesięcy Sprawozdawczych (2026)")).toBeDefined();
    expect(screen.getByText("07. Lipiec")).toBeDefined();
    expect(screen.getByText("Zamknięty")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Rok"), { target: { value: "2025" } });
    fireEvent.click(screen.getAllByTitle("Zablokuj miesiąc")[0]);
    expect(handleToggle).toHaveBeenCalledWith("2025-01");
  });

  it("offers to add the first action when the register is empty", () => {
    const onOpenAdd = vi.fn();
    render(<ActionsTableView filteredActions={[]} columns={[]} totalCount={0} selectedActionIds={new Set()} onOpenEdit={vi.fn()} onClearFilters={vi.fn()} onOpenAdd={onOpenAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj działanie" }));
    expect(onOpenAdd).toHaveBeenCalledOnce();
  });

  it("renders only the action form in the Działanie column", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const actionCol = columns.find((c) => c.id === "actionType");
    expect(actionCol).toBeDefined();
    expect(actionCol?.header).toBe("Działanie");

    const mockAction = {
      id: "act-1",
      actionType: "Prelekcja (warsztat)",
      title: "Pogadanka o zdrowiu",
    };

    const { container } = render((actionCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("Prelekcja (warsztat)")).toBeDefined();
    expect(screen.queryByText("Pogadanka o zdrowiu")).toBeNull();

    const typeBadge = container.querySelector(".font-medium");
    expect(typeBadge).toBeDefined();
    expect(typeBadge?.textContent).toBe("Prelekcja (warsztat)");
  });

  it("links a companion distribution with the action it was saved with, both ways", () => {
    const onEdit = vi.fn();
    const parent = { id: "act-1", actionType: "Stoisko edukacyjno-informacyjne", izrzSign: "98/2026", date: "2026-09-21" } as any;
    const distribution = { id: "dist-1", actionType: "Dystrybucja", linkedActionId: "act-1", materialsDistributedCount: 60 } as any;
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit,
      onDelete: vi.fn(),
      actionsById: new Map([[parent.id, parent], [distribution.id, distribution]]),
      linkedDistributionByActionId: new Map([[parent.id, distribution]]),
    });
    const actionCol = columns.find((c) => c.id === "actionType")!;

    const { unmount } = render((actionCol.cell as any)({ row: distribution }));
    fireEvent.click(screen.getByRole("button", { name: /z działania 98\/2026/ }));
    expect(onEdit).toHaveBeenLastCalledWith(parent);
    unmount();

    render((actionCol.cell as any)({ row: parent }));
    fireEvent.click(screen.getByRole("button", { name: /\+ dystrybucja \(60 szt\.\)/ }));
    expect(onEdit).toHaveBeenLastCalledWith(distribution);
  });

  it("normalizes action codes without mixing titles into the action form", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const actionCol = columns.find((c) => c.id === "actionType");

    const mockAction1 = {
      id: "act-1",
      actionType: "prelekcja",
      title: "Prelekcja (warsztat)",
    };

    const { container, unmount } = render((actionCol!.cell as any)({ row: mockAction1 }));
    const typeBadge = container.querySelector(".font-medium");
    expect(typeBadge?.textContent).toBe("Prelekcja (warsztat)");
    unmount();

    const mockAction2 = {
      id: "act-2",
      actionType: "publikacja_x",
      title: "Jasne, zwłaszcza białe ubrania...",
    };

    const { container: container2 } = render((actionCol!.cell as any)({ row: mockAction2 }));
    expect(container2.querySelector(".font-medium")?.textContent).toBe("Publikacja media (Portal X)");
    expect(screen.queryByText("Jasne, zwłaszcza białe ubrania...")).toBeNull();
  });

  it("renders Kopiuj zadanie button in row actions and fires onDuplicate", () => {
    const handleDuplicate = vi.fn();
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDuplicate: handleDuplicate,
      onDelete: vi.fn(),
    });

    const actionsCol = columns.find((c) => c.id === "actions");
    expect(actionsCol).toBeDefined();

    const mockAction = {
      id: "act-10",
      title: "Spotkanie profilaktyczne",
      actionType: "prelekcja",
      date: "2026-05-10",
    } as any;

    render(
      <TooltipProvider>
        {(actionsCol!.cell as any)({ row: mockAction })}
      </TooltipProvider>
    );

    const copyBtn = screen.getByTitle("Kopiuj zadanie");
    expect(copyBtn).toBeDefined();
    fireEvent.click(copyBtn);
    expect(handleDuplicate).toHaveBeenCalledWith(mockAction);
  });

  it("renders Kopiuj zadanie button in ActionsBulkToolbar when selectedCount is 1", () => {
    const handleDuplicateSingle = vi.fn();
    render(
      <ActionsBulkToolbar
        selectedCount={1}
        totalFilteredCount={10}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onDuplicateSingle={handleDuplicateSingle}
        onBulkDelete={vi.fn()}
      />
    );

    const copyBtn = screen.getByText("Kopiuj zadanie");
    expect(copyBtn).toBeDefined();
    fireEvent.click(copyBtn);
    expect(handleDuplicateSingle).toHaveBeenCalledTimes(1);
  });

  it("does not render lead educator in facilityName Lokalizacja column per user request", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const facCol = columns.find((c) => c.id === "facilityName");
    expect(facCol).toBeDefined();

    const mockAction = {
      id: "act-edu",
      facilityName: "Szkoła Podstawowa",
      leadEducator: "Krzysztof Palpuchowski",
    } as any;

    render((facCol!.cell as any)({ row: mockAction }));
    expect(screen.queryByText("Krzysztof Palpuchowski")).toBeNull();
    expect(screen.getByText("Szkoła Podstawowa")).toBeDefined();
  });

  it("renders facilityName column with facility, municipality, and audienceGroup", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const facCol = columns.find((c) => c.id === "facilityName");
    expect(facCol).toBeDefined();

    const mockAction = {
      id: "act-fac",
      facilityName: "Szkoła Podstawowa nr 3 w Myśliborzu",
      municipality: "Myślibórz",
      audienceGroup: "Uczniowie SP (klasy 4-8)",
    } as any;

    render((facCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("Szkoła Podstawowa nr 3 w Myśliborzu")).toBeDefined();
    expect(screen.getByText("Gmina: Myślibórz")).toBeDefined();
    expect(screen.getByText("Uczniowie SP (klasy 4-8)")).toBeDefined();
  });

  it("renders participantsCount column with ODB, POŚR, and MAT (materials) metrics", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const partCol = columns.find((c) => c.id === "participantsCount");
    expect(partCol).toBeDefined();

    const mockAction = {
      id: "act-metrics",
      participantsCount: 86,
      indirectRecipientsCount: 200,
      materialsDistributedCount: 45,
    } as any;

    render((partCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("86 os.")).toBeDefined();
    expect(screen.getByText("+200 pośr.")).toBeDefined();
    expect(screen.getByText("45")).toBeDefined();
  });

  it("keeps notes out of the action form column", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const actionCol = columns.find((c) => c.id === "actionType");

    const mockAction = {
      id: "act-prog",
      actionType: "Prelekcja (warsztat)",
      title: "Profilaktyka chorób odkleszczowych",
      topic: "Borelioza i KZM",
      notes: "Bardzo aktywna dyskusja z uczniami",
    } as any;

    render(
      <TooltipProvider>
        {(actionCol!.cell as any)({ row: mockAction })}
      </TooltipProvider>
    );

    expect(screen.getByText("Prelekcja (warsztat)")).toBeDefined();
    expect(screen.queryByText("Borelioza i KZM")).toBeNull();
    expect(screen.queryByText("Profilaktyka chorób odkleszczowych")).toBeNull();
    expect(columns.some((c) => c.id === "notes" || c.id === "leadEducator")).toBe(false);
  });

  it("renders non-standard action status badge (W toku, Odwołane, Planowane) in actionType column", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const actionCol = columns.find((c) => c.id === "actionType");

    const mockInProgressAction = {
      id: "act-in-progress",
      actionType: "Prelekcja (warsztat)",
      title: "Warsztaty w toku",
      status: "w_toku",
    } as any;

    render(
      <TooltipProvider>
        {(actionCol!.cell as any)({ row: mockInProgressAction })}
      </TooltipProvider>
    );
    expect(screen.getByText("W toku")).toBeDefined();

    const mockCancelledAction = {
      id: "act-cancelled",
      actionType: "Prelekcja (warsztat)",
      title: "Warsztaty odwołane",
      status: "odwolane",
    } as any;

    render(
      <TooltipProvider>
        {(actionCol!.cell as any)({ row: mockCancelledAction })}
      </TooltipProvider>
    );
    expect(screen.getByText("Odwołane")).toBeDefined();
  });

  it("renders facilityName column cleanly in compact density mode without educator", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      density: "compact",
    });

    const facCol = columns.find((c) => c.id === "facilityName");
    const mockAction = {
      id: "act-edu-compact",
      facilityName: "Szkoła Podstawowa w Myśliborzu",
      leadEducator: "Krzysztof Palpuchowski",
    } as any;

    render((facCol!.cell as any)({ row: mockAction, density: "compact" }));
    expect(screen.queryByText("K. Palpuchowski")).toBeNull();
    expect(screen.getByText("Szkoła Podstawowa w Myśliborzu")).toBeDefined();
  });

  it("renders publication reach with wyśw. suffix in participantsCount column", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const partCol = columns.find((c) => c.id === "participantsCount");
    const mockPubAction = {
      id: "act-pub",
      actionType: "publikacja_x",
      participantsCount: 1500,
    } as any;

    render((partCol!.cell as any)({ row: mockPubAction }));
    expect(screen.getByText(/1[\s\u00a0]?500 wyśw\./)).toBeDefined();
  });

  it("renders columns in the exact concise order matching official register spreadsheet", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const columnIds = columns.map((c) => c.id);
    expect(columnIds).toEqual([
      "select",
      "izrzSign",
      "jrwaSign",
      "programName",
      "actionType",
      "numberOfActions",
      "participantsCount",
      "date",
      "facilityName",
      "actions",
    ]);

    expect(columns.find((c) => c.id === "izrzSign")?.header).toBe("Nr informacji");
    expect(columns.find((c) => c.id === "jrwaSign")?.header).toBe("Numer sprawy JRWA");
    expect(columns.find((c) => c.id === "programName")?.header).toBe("Nazwa programu");
    expect(columns.find((c) => c.id === "actionType")?.header).toBe("Działanie");
    expect(columns.find((c) => c.id === "numberOfActions")?.header).toBe("Liczba działań");
    expect(columns.find((c) => c.id === "participantsCount")?.header).toBe("Liczba odbiorców");
    expect(columns.find((c) => c.id === "date")?.header).toBe("Data");
    expect(columns.find((c) => c.id === "facilityName")?.header).toBe("Lokalizacja");
    expect(columns.find((c) => c.id === "actions")?.header).toBe("Akcje");
  });

  it("renders izrzSign column with information card number or dash placeholder", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const izrzCol = columns.find((c) => c.id === "izrzSign");
    expect(izrzCol).toBeDefined();

    const mockActionWithSign = {
      id: "act-izrz-1",
      izrzSign: "74/2026",
    } as any;

    const { unmount } = render((izrzCol!.cell as any)({ row: mockActionWithSign }));
    expect(screen.getByText("74/2026")).toBeDefined();
    unmount();

    const mockActionWithPrefix = {
      id: "act-izrz-2",
      izrzSign: "IZRZ: 37/2026",
    } as any;
    const { unmount: unmount2 } = render((izrzCol!.cell as any)({ row: mockActionWithPrefix }));
    expect(screen.getByText("37/2026")).toBeDefined();
    unmount2();

    const mockActionWithoutSign = {
      id: "act-izrz-3",
      izrzSign: undefined,
    } as any;
    render((izrzCol!.cell as any)({ row: mockActionWithoutSign }));
    expect(screen.getByText("-")).toBeDefined();
  });

  it("renders jrwaSign column with case number and EZD status", () => {
    const handleCopySign = vi.fn();
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: handleCopySign,
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const jrwaCol = columns.find((c) => c.id === "jrwaSign");
    expect(jrwaCol).toBeDefined();

    const mockAction = {
      id: "act-jrwa-1",
      jrwaSign: "OZiPZ.966.14.20.2026",
      ezdStatus: "w_ezd",
    } as any;

    render((jrwaCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("OZiPZ.966.14.20.2026")).toBeDefined();
    expect(screen.getByText("w EZD")).toBeDefined();

    const copyBtn = screen.getByTitle("Kopiuj znak JRWA");
    fireEvent.click(copyBtn);
    expect(handleCopySign).toHaveBeenCalledWith("act-jrwa-1", "OZiPZ.966.14.20.2026");
  });

  it("renders programName in separate column and actionType column independently", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const progCol = columns.find((c) => c.id === "programName");
    const actCol = columns.find((c) => c.id === "actionType");
    expect(progCol).toBeDefined();
    expect(actCol).toBeDefined();

    const mockAction = {
      id: "act-prog-1",
      actionType: "Prelekcja (warsztat)",
      title: "Pogadanka o bezpiecznych feriach",
      programName: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego",
      campaignName: "Bezpieczne wakacje",
    } as any;

    const { unmount: unmountProg } = render((progCol!.cell as any)({ row: mockAction }));
    expect(
      screen.getByText("Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego")
    ).toBeDefined();
    expect(screen.getByText("Bezpieczne wakacje")).toBeDefined();
    unmountProg();

    render((actCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("Prelekcja (warsztat)")).toBeDefined();
    expect(screen.queryByText("Pogadanka o bezpiecznych feriach")).toBeNull();
    expect(
      screen.queryByText("Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego")
    ).toBeNull();
  });

  it("renders action forms as plain spreadsheet text", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const actCol = columns.find((c) => c.id === "actionType");
    expect(actCol).toBeDefined();

    const actionSprawozdanie = {
      id: "act-spraw",
      actionType: "Sprawozdanie (z programu, miernik, tytoń)",
      title: "Sprawozdanie roczne",
    };
    const actionDystrybucja = {
      id: "act-dyst",
      actionType: "Dystrybucja",
      title: "Rozdanie ulotek",
    };

    const { container: c1 } = render((actCol!.cell as any)({ row: actionSprawozdanie }));
    expect(c1.textContent).toContain("Sprawozdanie");
    expect(c1.querySelector(".bg-indigo-100")).toBeNull();

    const { container: c2 } = render((actCol!.cell as any)({ row: actionDystrybucja }));
    expect(c2.textContent).toContain("Dystrybucja");
    expect(c2.querySelector(".bg-amber-100")).toBeNull();
  });

  it("renders numberOfActions column with numeric action count", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const numCol = columns.find((c) => c.id === "numberOfActions");
    expect(numCol).toBeDefined();

    const mockAction = {
      id: "act-num-1",
      numberOfActions: 2,
    } as any;

    render((numCol!.cell as any)({ row: mockAction }));
    expect(screen.getByText("2")).toBeDefined();
  });

  it("sorts izrzSign naturally and places empty signs at the end", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const izrzCol = columns.find((c) => c.id === "izrzSign");
    expect(izrzCol?.sortFn).toBeDefined();

    const a1 = { izrzSign: "8/2026" } as any;
    const a2 = { izrzSign: "74/2026" } as any;
    const a3 = { izrzSign: "102/2026" } as any;
    const aEmpty = { izrzSign: undefined } as any;

    expect(izrzCol!.sortFn!(a1, a2)).toBeLessThan(0);
    expect(izrzCol!.sortFn!(a2, a3)).toBeLessThan(0);
    expect(izrzCol!.sortFn!(a1, aEmpty)).toBeLessThan(0);
    expect(izrzCol!.sortFn!(aEmpty, a1)).toBeGreaterThan(0);
  });

  it("provides numeric sorting and fallback to 1 for numberOfActions", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const numCol = columns.find((c) => c.id === "numberOfActions");
    expect(numCol?.accessorFn).toBeDefined();
    expect(numCol?.sortFn).toBeDefined();

    const aDefault = {} as any;
    const aTwo = { numberOfActions: 2 } as any;

    expect(numCol!.accessorFn!(aDefault)).toBe(1);
    expect(numCol!.accessorFn!(aTwo)).toBe(2);
    expect(numCol!.sortFn!(aDefault, aTwo)).toBeLessThan(0);
  });

  it("provides numeric sorting for participantsCount", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const partCol = columns.find((c) => c.id === "participantsCount");
    expect(partCol?.accessorFn).toBeDefined();
    expect(partCol?.sortFn).toBeDefined();

    const a25 = { participantsCount: 25 } as any;
    const a100 = { participantsCount: 100 } as any;

    expect(partCol!.accessorFn!(a25)).toBe(25);
    expect(partCol!.sortFn!(a25, a100)).toBeLessThan(0);
  });

  it("sorts table by date descending by default (newest first) and allows re-sorting by headers", () => {
    const columns = createActionColumns({
      onToggleSelect: vi.fn(),
      onSelectAll: vi.fn(),
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: vi.fn(),
      onOpenIzrz: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    const mockActions = [
      { id: "act-1", title: "Akcja 1", date: "2026-09-05", numberOfActions: 3, participantsCount: 10 } as any,
      { id: "act-2", title: "Akcja 2", date: "2026-09-28", numberOfActions: 1, participantsCount: 50 } as any,
      { id: "act-3", title: "Akcja 3", date: "2026-09-12", numberOfActions: 2, participantsCount: 30 } as any,
    ];

    const { unmount } = render(
      <TooltipProvider>
        <ActionsTableView
          filteredActions={mockActions}
          columns={columns}
          totalCount={mockActions.length}
          selectedActionIds={new Set()}
          onOpenEdit={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </TooltipProvider>
    );

    // Initial state: defaultSortField="date", defaultSortDirection="desc" -> 2026-09-28 first, then 2026-09-12, then 2026-09-05
    let rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("Akcja 2");
    expect(rows[1].textContent).toContain("Akcja 3");
    expect(rows[2].textContent).toContain("Akcja 1");

    // Click "Data" header -> toggles to asc (2026-09-05 first)
    const dateHeaderBtn = screen.getByRole("button", { name: /Data/i });
    fireEvent.click(dateHeaderBtn);

    rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("Akcja 1");
    expect(rows[1].textContent).toContain("Akcja 3");
    expect(rows[2].textContent).toContain("Akcja 2");

    // Click "Liczba działań" header -> sorts by numberOfActions asc (1, 2, 3 -> Akcja 2, Akcja 3, Akcja 1)
    const numHeaderBtn = screen.getByRole("button", { name: /Liczba działań/i });
    fireEvent.click(numHeaderBtn);

    rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("Akcja 2"); // 1 działanie
    expect(rows[1].textContent).toContain("Akcja 3"); // 2 działania
    expect(rows[2].textContent).toContain("Akcja 1"); // 3 działania

    unmount();
  });
});
