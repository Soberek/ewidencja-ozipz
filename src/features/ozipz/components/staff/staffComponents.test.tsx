import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StaffSection } from "./StaffSection";
import { StaffDialog } from "./StaffDialog";
import { StaffStatsHeader } from "./components/StaffStatsHeader";
import type { OzipzStaff } from "../../types/ozipz.types";

describe("Staff Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockStaffList: OzipzStaff[] = [
    {
      id: "staff-1",
      fullName: "Jan Kowalski",
      role: "Młodszy Asystent",
      email: "jan.kowalski@psse.gov.pl",
      phone: "123 456 789",
      active: true,
      specialization: "Oświata Zdrowotna",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "staff-2",
      fullName: "Anna Nowak",
      role: "Starszy Asystent",
      email: "anna.nowak@psse.gov.pl",
      phone: "987 654 321",
      active: false,
      specialization: "Promocja Zdrowia",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  describe("StaffStatsHeader", () => {
    it("renders all 4 KPI metric cards correctly", () => {
      render(<StaffStatsHeader staff={mockStaffList} />);

      expect(screen.getByText("Kadra Pracownicza")).toBeDefined();
      expect(screen.getByText("Aktywni Edukatorzy")).toBeDefined();
      expect(screen.getByText("Starsza Kadra")).toBeDefined();
      expect(screen.getByText("Z Kontaktem Bezpośrednim")).toBeDefined();
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("StaffSection", () => {
    it("renders staff members table with details and active statuses", () => {
      render(
        <StaffSection
          staff={mockStaffList}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Jan Kowalski")).toBeDefined();
      expect(screen.getByText("Anna Nowak")).toBeDefined();
      expect(screen.getByText("Aktywny")).toBeDefined();
      expect(screen.getByText("Nieaktywny")).toBeDefined();
      expect(screen.getByText(/jan.kowalski@psse.gov.pl/)).toBeDefined();
    });

    it("filters staff by search query in name or role", () => {
      render(
        <StaffSection
          staff={mockStaffList}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText("Szukaj pracownika, roli...");
      fireEvent.change(searchInput, { target: { value: "Nowak" } });

      expect(screen.queryByText("Jan Kowalski")).toBeNull();
      expect(screen.getByText("Anna Nowak")).toBeDefined();
    });

    it("filters staff by active status chip", () => {
      render(
        <StaffSection
          staff={mockStaffList}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const activeChip = screen.getByRole("button", { name: "Aktywni" });
      fireEvent.click(activeChip);

      expect(screen.getByText("Jan Kowalski")).toBeDefined();
      expect(screen.queryByText("Anna Nowak")).toBeNull();
    });

    it("toggles KPI summary visibility", () => {
      render(
        <StaffSection
          staff={mockStaffList}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Kadra Pracownicza")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      fireEvent.click(toggleBtn);

      expect(screen.queryByText("Kadra Pracownicza")).toBeNull();
    });

    it("calls onDelete when delete button is confirmed", () => {
      const handleDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <StaffSection
          staff={mockStaffList}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={handleDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: /usuń pracownika/i });
      fireEvent.click(deleteButtons[0]);

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("StaffDialog", () => {
    it("renders modal in create mode", () => {
      render(
        <StaffDialog
          isOpen={true}
          onClose={vi.fn()}
          editingStaff={null}
          staffRoles={["Młodszy Asystent", "Starszy Asystent"]}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Nowy Pracownik Sekcji OZiPZ")).toBeDefined();
    });

    it("renders modal in edit mode with prefilled staff values", () => {
      render(
        <StaffDialog
          isOpen={true}
          onClose={vi.fn()}
          editingStaff={mockStaffList[0]}
          staffRoles={["Młodszy Asystent", "Starszy Asystent"]}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Edycja Pracownika / Edukatora")).toBeDefined();
      expect(screen.getByDisplayValue("Jan Kowalski")).toBeDefined();
      expect(screen.getByDisplayValue("jan.kowalski@psse.gov.pl")).toBeDefined();
    });
  });
});
