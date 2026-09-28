import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScansSection } from "./ScansSection";
import { ScanDialog } from "./ScanDialog";
import { ScansStatsHeader } from "./components/ScansStatsHeader";
import type { OzipzScan, OzipzFacility, OzipzProgram } from "../../types/ozipz.types";

describe("Scans Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockScans: OzipzScan[] = [
    {
      id: "scan-1",
      title: "Deklaracja przystąpienia SP1 do programu",
      fileName: "deklaracja_sp1.pdf",
      filePath: "/scans/deklaracja_sp1.pdf",
      fileSizeKb: 245,
      documentType: "deklaracja",
      scanDate: "2026-02-15",
      facilityId: "fac-1",
      facilityName: "Szkoła Podstawowa nr 1",
      programId: "prog-tf",
      programName: "Trzymaj Formę!",
      createdAt: "2026-02-15",
    },
    {
      id: "scan-2",
      title: "Sprawozdanie końcowe z realizacji",
      fileName: "sprawozdanie_barlinek.pdf",
      filePath: "/scans/sprawozdanie_barlinek.pdf",
      fileSizeKb: 512,
      documentType: "sprawozdanie",
      scanDate: "2026-06-20",
      facilityName: "Szkoła Podstawowa nr 2 w Barlinku",
      createdAt: "2026-06-20",
    },
  ];

  describe("ScansStatsHeader", () => {
    it("renders all 4 KPI metric cards correctly", () => {
      render(<ScansStatsHeader scans={mockScans} />);

      expect(screen.getByText("Wszystkie Dokumenty")).toBeDefined();
      expect(screen.getByText("Sprawozdania i Protokoły")).toBeDefined();
      expect(screen.getByText("Deklaracje i Zgody")).toBeDefined();
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ScansSection", () => {
    it("renders list of scans with document titles and facilities", () => {
      render(
        <ScansSection
          scans={mockScans}
          onOpenAdd={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Deklaracja przystąpienia SP1 do programu")).toBeDefined();
      expect(screen.getByText("Sprawozdanie końcowe z realizacji")).toBeDefined();
      expect(screen.getByText("Szkoła Podstawowa nr 1")).toBeDefined();
      expect(screen.getByText("Szkoła Podstawowa nr 2 w Barlinku")).toBeDefined();
      expect(screen.getByText(/245 KB/)).toBeDefined();
    });

    it("filters scans by search query", () => {
      render(
        <ScansSection
          scans={mockScans}
          onOpenAdd={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Szukaj skanu, sprawozdania, placówki/i);
      fireEvent.change(searchInput, { target: { value: "sprawozdanie" } });

      expect(screen.queryByText("Deklaracja przystąpienia SP1 do programu")).toBeNull();
      expect(screen.getByText("Sprawozdanie końcowe z realizacji")).toBeDefined();
    });

    it("toggles KPI summary visibility", () => {
      render(
        <ScansSection
          scans={mockScans}
          onOpenAdd={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Wszystkie Dokumenty")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      fireEvent.click(toggleBtn);

      expect(screen.queryByText("Wszystkie Dokumenty")).toBeNull();
    });

    it("calls onDelete when delete button is confirmed", () => {
      const handleDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <ScansSection
          scans={mockScans}
          onOpenAdd={vi.fn()}
          onDelete={handleDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: /usuń skan/i });
      fireEvent.click(deleteButtons[0]);

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("ScanDialog", () => {
    const mockFacilities: OzipzFacility[] = [
      {
        id: "fac-1",
        name: "Szkoła Podstawowa nr 1",
        type: "szkola_podstawowa",
        municipality: "Myślibórz",
        county: "powiat myśliborski",
        address: "ul. Piłsudskiego 10",
        city: "Myślibórz",
        postalCode: "74-300",
        leadingAuthority: "Gmina Myślibórz",
        isComplex: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const mockPrograms: OzipzProgram[] = [
      {
        id: "prog-tf",
        code: "TF",
        name: "Trzymaj Formę!",
        editionYear: "2026",
        targetAudience: "Młodzież",
        description: "Program",
        status: "aktywny",
        jrwaSymbol: "966.1",
        participatingSchoolsCount: 5,
        totalPupilsReached: 120,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    it("renders add scan modal with form fields", () => {
      render(
        <ScanDialog
          isOpen={true}
          onClose={vi.fn()}
          facilities={mockFacilities}
          programs={mockPrograms}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByText("Zarejestruj Skan Dokumentu PDF")).toBeDefined();
      expect(screen.getByLabelText(/Tytuł Dokumentu/i)).toBeDefined();
      expect(screen.getByLabelText(/Wybierz plik ze skanem/i).getAttribute("type")).toBe("file");
    });
  });
});
