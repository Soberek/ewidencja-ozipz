import { describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsSection } from "./SettingsSection";
import { createDatabaseBackup } from "../../../../db/client";
import { toast } from "sonner";

vi.mock("../../../../db/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../../../db/client")>(),
  createDatabaseBackup: vi.fn(),
}));

describe("Settings Module Components", () => {
  it("does not announce a cancelled backup as successful", async () => {
    vi.mocked(createDatabaseBackup).mockResolvedValue(false);
    const success = vi.spyOn(toast, "success");
    render(<SettingsSection />);
    fireEvent.click(screen.getByRole("button", { name: "Utwórz kopię zapasową" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Utwórz kopię zapasową" }).hasAttribute("disabled")).toBe(false));
    expect(success).not.toHaveBeenCalled();
    success.mockRestore();
  });
  it("renders database diagnostics without any bundled snapshot or reset", async () => {
    render(<SettingsSection />);

    expect(screen.getByText("Baza Danych i Środowisko Aplikacji")).toBeDefined();
    expect(screen.getByText("Lokalizacja Pliku Bazy")).toBeDefined();
    expect(screen.getByText("Integralność Referencyjna")).toBeDefined();
    expect(screen.queryByText(/snapshot/i)).toBeNull();
    await waitFor(() => expect(screen.queryByText("Sprawdzanie aktywnego magazynu danych…")).toBeNull());
  });

  it("renders backup controls when localStorage is unavailable", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage access denied", "SecurityError");
    });
    try {
      await act(async () => { render(<SettingsSection />); });
      expect(screen.getByText(/Ostatnia kopia: brak informacji/)).toBeDefined();
      expect(screen.getByRole("button", { name: "Utwórz kopię zapasową" })).toBeDefined();
    } finally {
      read.mockRestore();
    }
  });
});
