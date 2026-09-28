import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog component", () => {
  it("renders title, description and triggers onConfirm", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Usuń wpis"
        description="Czy na pewno chcesz usunąć ten rekord?"
      />
    );

    expect(screen.getByText("Usuń wpis")).toBeDefined();
    expect(screen.getByText("Czy na pewno chcesz usunąć ten rekord?")).toBeDefined();
    expect(screen.getByText("Usuń wpis").closest(".pr-10")).not.toBeNull();

    const confirmBtn = screen.getByRole("button", { name: "Usuń trwale" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onClose when cancel button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Anuluj" });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("shows a rejected confirmation and allows retry without closing", async () => {
    const handleConfirm = vi.fn()
      .mockRejectedValueOnce(new Error("Nie udało się usunąć wpisu"))
      .mockResolvedValueOnce(undefined);
    const handleClose = vi.fn();

    render(<ConfirmDialog isOpen onClose={handleClose} onConfirm={handleConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Usuń trwale" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Nie udało się usunąć wpisu");
    expect(handleClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Usuń trwale" }));
    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
