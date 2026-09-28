import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, type ColumnDef } from "./data-table";
import { useUIStore } from "@/features/ozipz/store/useUIStore";

interface TestItem {
  id: string;
  name: string;
  count: number;
}

const testData: TestItem[] = [
  { id: "1", name: "Alpha", count: 10 },
  { id: "2", name: "Beta", count: 20 },
];

const testColumns: ColumnDef<TestItem>[] = [
  { id: "id", header: "ID", accessorKey: "id" },
  { id: "name", header: "Nazwa", accessorKey: "name", sortable: true },
  { id: "count", header: "Liczba", accessorKey: "count", align: "right" },
];

describe("DataTable component", () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({ tableDensity: "normal" });
  });

  it("renders table with data rows", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        entityLabel="elementów"
      />
    );

    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();
    expect(screen.getByText(/Liczba pozycji:/)).toBeDefined();
  });

  it("allows toggling table density between normal and compact", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        showDensityToggle={true}
      />
    );

    const densityBtn = screen.getByTitle(/Gęstość: Standardowy/);
    expect(densityBtn).toBeDefined();

    fireEvent.click(densityBtn);
    expect(useUIStore.getState().tableDensity).toBe("compact");
  });

  it("toggles density when the density prop comes from the shared store", () => {
    function TableWithStoreDensity() {
      const density = useUIStore((state) => state.tableDensity);
      return <DataTable data={testData} columns={testColumns} density={density} />;
    }

    render(<TableWithStoreDensity />);
    fireEvent.click(screen.getByTitle(/Gęstość: Standardowy/));

    expect(useUIStore.getState().tableDensity).toBe("compact");
    expect(screen.getByTitle(/Gęstość: Zwarty/)).toBeDefined();
  });

  it("filters items when enableSearch is active", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        enableSearch={true}
        searchPlaceholder="Szukaj test"
      />
    );

    const searchInput = screen.getByPlaceholderText("Szukaj test");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.queryByText("Beta")).toBeNull();
  });

  it("renders CSV export button when enableExport is true and triggers download", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        enableExport={true}
      />
    );

    const exportBtn = screen.getByRole("button", { name: /CSV/i });
    expect(exportBtn).toBeDefined();

    fireEvent.click(exportBtn);
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it("sanitizes embedded newlines and quotes in CSV export", () => {
    let exportedBlobContent = "";
    const originalBlob = globalThis.Blob;
    vi.spyOn(globalThis, "Blob").mockImplementation((parts?: BlobPart[], options?: BlobPropertyBag) => {
      exportedBlobContent = (parts ?? []).map(String).join("");
      return new originalBlob(parts, options);
    });

    const multilineData: TestItem[] = [
      { id: "1", name: 'Alpha "Special"\nLine 2\r\nLine 3', count: 42 },
    ];

    render(
      <DataTable
        data={multilineData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        enableExport={true}
      />
    );

    const exportBtn = screen.getByRole("button", { name: /CSV/i });
    fireEvent.click(exportBtn);

    expect(exportedBlobContent).toContain('"Alpha ""Special"" Line 2 Line 3"');
    // Ensure no unexpected literal newlines break the data row
    const lines = exportedBlobContent.replace("\uFEFF", "").split("\r\n");
    expect(lines.length).toBe(2); // Header row and single data row
  });

  it("handles preset filters and allows switching presets", () => {
    const handlePresetChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        presetFilters={{
          presets: [
            { id: "all", label: "Wszystkie", count: 2 },
            { id: "active", label: "Aktywne", count: 1 },
          ],
          activePreset: "all",
          onPresetChange: handlePresetChange,
        }}
      />
    );

    expect(screen.getByText("Wszystkie")).toBeDefined();
    const activeBtn = screen.getByText("Aktywne");
    fireEvent.click(activeBtn);
    expect(handlePresetChange).toHaveBeenCalledWith("active");
  });

  it("clears search input when clear button is clicked", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        enableSearch={true}
      />
    );

    const input = screen.getByPlaceholderText("Filtruj wiersze...");
    fireEvent.change(input, { target: { value: "Alpha" } });
    expect(input).toHaveProperty("value", "Alpha");

    const clearBtn = screen.getByTitle("Wyczyść wyszukiwanie");
    fireEvent.click(clearBtn);
    expect(input).toHaveProperty("value", "");
    expect(screen.getByText("Beta")).toBeDefined();
  });

  it("sorts rows ascending and descending when header is clicked", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
      />
    );

    const sortHeader = screen.getByText("Nazwa");
    // Initial order: Alpha, Beta
    fireEvent.click(sortHeader); // asc
    fireEvent.click(sortHeader); // desc

    const cells = screen.getAllByRole("cell");
    const nameTexts = cells.map((c) => c.textContent).filter((t) => t === "Alpha" || t === "Beta");
    expect(nameTexts[0]).toBe("Beta");
    expect(nameTexts[1]).toBe("Alpha");
  });

  it("respects sortDirection and defaultSortDirection with custom sortFn", () => {
    const customSortColumns: ColumnDef<TestItem>[] = [
      { id: "id", header: "ID", accessorKey: "id" },
      {
        id: "count",
        header: "Liczba",
        accessorKey: "count",
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
      },
    ];

    const { unmount } = render(
      <DataTable
        data={testData}
        columns={customSortColumns}
        keyExtractor={(item) => item.id}
        defaultSortField="count"
        defaultSortDirection="desc"
      />
    );

    // Initial order should be desc (20 then 10)
    let rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("20");
    expect(rows[1].textContent).toContain("10");

    // Click header to toggle to asc (10 then 20)
    const headerBtn = screen.getByText("Liczba");
    fireEvent.click(headerBtn);

    rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("10");
    expect(rows[1].textContent).toContain("20");

    unmount();
  });

  it("expands and collapses all rows with renderSubComponent", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        renderSubComponent={({ row }) => <div data-testid={`sub-${row.id}`}>Detail {row.name}</div>}
      />
    );

    const expandAllBtn = screen.getByText("Rozwiń wszystkie");
    fireEvent.click(expandAllBtn);

    expect(screen.getByTestId("sub-1")).toBeDefined();
    expect(screen.getByTestId("sub-2")).toBeDefined();
    expect(screen.getByText("Zwiń wszystkie")).toBeDefined();

    fireEvent.click(screen.getByText("Zwiń wszystkie"));
    expect(screen.queryByTestId("sub-1")).toBeNull();
  });

  it("expands and collapses only the rows on the current page", () => {
    const rows = [
      ...testData,
      { id: "3", name: "Gamma", count: 30 },
      { id: "4", name: "Delta", count: 40 },
    ];
    render(
      <DataTable
        data={rows}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        enablePagination
        defaultPageSize={2}
        pageSizeOptions={[2]}
        renderSubComponent={({ row }) => <div data-testid={`sub-${row.id}`}>Detail {row.name}</div>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rozwiń wszystkie" }));
    fireEvent.click(screen.getByTitle("Następna strona"));
    fireEvent.click(screen.getByRole("button", { name: "Rozwiń wszystkie" }));
    expect(screen.getByTestId("sub-3")).toBeDefined();
    expect(screen.getByTestId("sub-4")).toBeDefined();

    fireEvent.click(screen.getByTitle("Poprzednia strona"));
    expect(screen.getByTestId("sub-1")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Zwiń wszystkie" }));
    expect(screen.queryByTestId("sub-1")).toBeNull();

    fireEvent.click(screen.getByTitle("Następna strona"));
    expect(screen.getByTestId("sub-3")).toBeDefined();
  });

  it("supports keyboard row opening and exposes selection, expansion and sort states", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
        selectable
        renderSubComponent={({ row }) => <div>Detail {row.name}</div>}
      />
    );

    const row = screen.getByText("Alpha").closest("tr")!;
    expect(row.tabIndex).toBe(0);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);

    const rowCheckbox = screen.getByRole("checkbox", { name: "Wiersz 1" });
    const allCheckbox = screen.getByRole("checkbox", { name: "Zaznacz wszystkie wiersze na stronie" });
    expect(rowCheckbox.tagName).toBe("BUTTON");
    expect(rowCheckbox.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(rowCheckbox);
    expect(rowCheckbox.getAttribute("aria-checked")).toBe("true");
    expect(allCheckbox.getAttribute("aria-checked")).toBe("mixed");
    expect(onRowClick).toHaveBeenCalledTimes(2);

    const expandButton = screen.getByRole("button", { name: "Szczegóły wiersza 1" });
    expect(expandButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expandButton);
    expect(expandButton.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(expandButton.getAttribute("aria-controls")!)).toHaveProperty("textContent", "Detail Alpha");
    expect(onRowClick).toHaveBeenCalledTimes(2);

    const nameHeader = screen.getByRole("columnheader", { name: /Nazwa/ });
    fireEvent.click(screen.getByRole("button", { name: "Nazwa" }));
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });

});
