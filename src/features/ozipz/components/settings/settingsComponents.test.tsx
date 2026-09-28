import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  it("renders database diagnostics, migrated records badge, and active storage information", async () => {
    render(<SettingsSection onClearAndReseed={vi.fn()} />);

    expect(screen.getByText("Historyczny snapshot Firebase")).toBeDefined();
    expect(screen.getByText(/rekordów w snapshocie/)).toBeDefined();
    expect(screen.getByText("Baza Danych i Środowisko Aplikacji")).toBeDefined();
    expect(screen.getByText("Lokalizacja Pliku Bazy")).toBeDefined();
    expect(screen.getByText("Integralność Referencyjna")).toBeDefined();
    await waitFor(() => expect(screen.queryByText("Sprawdzanie aktywnego magazynu danych…")).toBeNull());
  });

  it("triggers onClearAndReseed when user confirms maintenance action", async () => {
    const handleReseed = vi.fn();
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    render(<SettingsSection onClearAndReseed={handleReseed} />);

    const reseedBtn = screen.getByText(/Usuń bieżące dane i przywróć snapshot/i);
    fireEvent.click(reseedBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(handleReseed).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText("Sprawdzanie aktywnego magazynu danych…")).toBeNull());

    window.confirm = originalConfirm;
  });

  it("does not trigger onClearAndReseed when user cancels confirmation dialog", async () => {
    const handleReseed = vi.fn();
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(false);

    render(<SettingsSection onClearAndReseed={handleReseed} />);

    const reseedBtn = screen.getByText(/Usuń bieżące dane i przywróć snapshot/i);
    fireEvent.click(reseedBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(handleReseed).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Sprawdzanie aktywnego magazynu danych…")).toBeNull());

    window.confirm = originalConfirm;
  });
});
