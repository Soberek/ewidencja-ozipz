import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicationsSection } from "./PublicationsSection";
import type { OzipzPublication } from "../../types/ozipz.types";

vi.mock("./sources/webFetch", () => ({ fetchSourcePage: vi.fn().mockRejectedValue(new Error("offline")) }));

const mockPublications: OzipzPublication[] = [
  {
    id: "pub-1",
    title: "Europejski Tydzień Szczepień - komunikat",
    channel: "Strona www PSSE Myślibórz (gov.pl)",
    publicationDate: "2026-04-24",
    topic: "Szczepienia ochronne",
    link: "https://www.gov.pl/web/psse-mysliborz/europejski-tydzien-szczepien",
    reachCount: 350,
    author: "Jan Kowalski",
    createdAt: "2026-04-24T10:00:00Z",
    updatedAt: "2026-04-24T10:00:00Z",
  },
];

describe("PublicationsSection Component & Gov.pl Scraper", () => {
  it("renders publication list tab with correct item count and columns", () => {
    render(<PublicationsSection publications={mockPublications} />);

    expect(screen.getByText("Publikacje i media")).toBeDefined();
    expect(screen.getByText("Europejski Tydzień Szczepień - komunikat")).toBeDefined();
    expect(screen.getByText("Jan Kowalski")).toBeDefined();
  });

  it("switches to the gov.pl import tab and explains the duplicate check", async () => {
    render(<PublicationsSection publications={mockPublications} />);

    fireEvent.click(screen.getByRole("button", { name: /Import z gov\.pl/i }));

    expect(screen.getByText("Aktualności PSSE Myślibórz – gov.pl")).toBeDefined();
    expect(screen.getByRole("button", { name: /Odśwież/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Do decyzji/i })).toBeDefined();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Nie udało się pobrać aktualności"));
  });

  it("switches to the X tab with paste-links fallback", async () => {
    render(<PublicationsSection publications={mockPublications} />);

    fireEvent.click(screen.getByRole("button", { name: /Import z X/i }));

    expect(screen.getByText("Profil X – @PSSEMysliborz")).toBeDefined();
    expect(screen.getByLabelText("Linki do wpisów X")).toBeDefined();
    await waitFor(() => expect(screen.getByRole("button", { name: /Pobierz najnowsze/i }).hasAttribute("disabled")).toBe(false));
  });

  it("renders KPI metric cards in PublicationsStatsHeader", () => {
    render(<PublicationsSection publications={mockPublications} />);

    expect(screen.getByText("Wszystkie Publikacje")).toBeDefined();
    expect(screen.getByText("Łączny Zasięg")).toBeDefined();
    expect(screen.getAllByText("350 os.").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Z Odnośnikiem WWW")).toBeDefined();
  });

  it("filters publications using quick chips", () => {
    const multiPubs: OzipzPublication[] = [
      ...mockPublications,
      {
        id: "pub-2",
        title: "Światowy Dzień Zdrowia post na X",
        channel: "Profil X (Twitter)",
        publicationDate: "2026-04-07",
        topic: "Dni Zdrowia",
        link: "https://x.com/PSSEMysliborz/status/123",
        reachCount: 520,
        author: "Anna Nowak",
        createdAt: "2026-04-07T10:00:00Z",
        updatedAt: "2026-04-07T10:00:00Z",
      },
    ];

    render(<PublicationsSection publications={multiPubs} />);

    expect(screen.getByText("Europejski Tydzień Szczepień - komunikat")).toBeDefined();
    expect(screen.getByText("Światowy Dzień Zdrowia post na X")).toBeDefined();

    // Click quick chip "Profil X (Twitter)"
    const xChip = screen.getByRole("button", { name: /^Profil X/ });
    fireEvent.click(xChip);

    expect(screen.queryByText("Europejski Tydzień Szczepień - komunikat")).toBeNull();
    expect(screen.getByText("Światowy Dzień Zdrowia post na X")).toBeDefined();

    // Click "Wszystkie"
    const allChip = screen.getByRole("button", { name: /^Wszystkie/ });
    fireEvent.click(allChip);

    expect(screen.getByText("Europejski Tydzień Szczepień - komunikat")).toBeDefined();
    expect(screen.getByText("Światowy Dzień Zdrowia post na X")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Filtruj kanał publikacji"), {
      target: { value: "Strona www PSSE Myślibórz (gov.pl)" },
    });
    fireEvent.click(xChip);
    expect(screen.queryByText("Europejski Tydzień Szczepień - komunikat")).toBeNull();
    expect(screen.getByText("Światowy Dzień Zdrowia post na X")).toBeDefined();
  });

  it("toggles and persists KPI summary collapse in localStorage", () => {
    localStorage.clear();
    render(<PublicationsSection publications={mockPublications} />);

    // Initially visible
    expect(screen.getByText("Wszystkie Publikacje")).toBeDefined();

    // Collapse
    const toggleBtn = screen.getByRole("button", { name: /zwiń wskaźniki kpi|zwiń kpi/i });
    fireEvent.click(toggleBtn);

    expect(screen.queryByText("Wszystkie Publikacje")).toBeNull();
    expect(localStorage.getItem("oz.publicationsShowKpiSummary")).toBe("false");

    // Expand
    const expandBtn = screen.getByRole("button", { name: /pokaż wskaźniki kpi|pokaż kpi/i });
    fireEvent.click(expandBtn);

    expect(screen.getByText("Wszystkie Publikacje")).toBeDefined();
    expect(localStorage.getItem("oz.publicationsShowKpiSummary")).toBe("true");
  });

  it("triggers onOpenEdit on row click and isolates edit and delete buttons", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <PublicationsSection
        publications={mockPublications}
        onOpenEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const titleEl = screen.getByText("Europejski Tydzień Szczepień - komunikat");
    const rowEl = titleEl.closest("tr");
    expect(rowEl).not.toBeNull();

    fireEvent.click(rowEl!);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockPublications[0]);

    // Click edit action button
    const editBtn = screen.getByRole("button", { name: "Edytuj publikację" });
    fireEvent.click(editBtn);
    // Should call handleEdit again, but row click should not double trigger
    expect(handleEdit).toHaveBeenCalledTimes(2);
  });

  it("opens ConfirmDialog on delete click and calls onDelete after confirmation", async () => {
    const handleDelete = vi.fn();

    render(
      <PublicationsSection
        publications={mockPublications}
        onDelete={handleDelete}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: "Usuń publikację" });
    fireEvent.click(deleteBtn);

    // ConfirmDialog opens
    expect(screen.getByText("Potwierdź usunięcie publikacji")).toBeDefined();
    expect(screen.getByText(/Czy na pewno chcesz usunąć publikację/i)).toBeDefined();

    // Click confirm
    const confirmBtn = screen.getByRole("button", { name: "Usuń publikację" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith(mockPublications[0].id);
    });
  });

  it("keeps delete confirmation open when deletion fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("Błąd bazy"));
    render(<PublicationsSection publications={mockPublications} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Usuń publikację" }));
    fireEvent.click(screen.getByRole("button", { name: "Usuń publikację" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Błąd bazy"));
    expect(screen.getByText("Potwierdź usunięcie publikacji")).toBeDefined();
  });
});
