import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalDialog } from "./modal-dialog";

describe("ModalDialog Component", () => {
  it("renders when isOpen is true with title and description", () => {
    const handleClose = vi.fn();
    render(
      <ModalDialog
        isOpen={true}
        onClose={handleClose}
        title="Test Modal Title"
        description="Test Modal Description"
      >
        <div>Modal Body Content</div>
      </ModalDialog>
    );

    expect(screen.getByText("Test Modal Title")).toBeDefined();
    expect(screen.getByText("Test Modal Description")).toBeDefined();
    expect(screen.getByText("Modal Body Content")).toBeDefined();
    expect(screen.getByRole("button", { name: "Zamknij" }).classList.contains("size-8")).toBe(true);
    expect(screen.getByText("Test Modal Title").closest(".pr-10")).not.toBeNull();
  });

  it("renders error banner when error prop is provided", () => {
    render(
      <ModalDialog
        isOpen={true}
        onClose={() => {}}
        title="Dialog with Error"
        error="Proszę wypełnić wymagane pola"
      >
        <div>Content</div>
      </ModalDialog>
    );

    expect(screen.getByRole("alert").textContent).toBe("Proszę wypełnić wymagane pola");
  });

  it("handles form submission properly", () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    render(
      <ModalDialog
        isOpen={true}
        onClose={() => {}}
        title="Form Dialog"
        onSubmit={handleSubmit}
        submitText="Zapisz wpis"
      >
        <input placeholder="Pole testowe" defaultValue="Test" />
      </ModalDialog>
    );

    const submitBtn = screen.getByText("Zapisz wpis");
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps a pending form open and disables its close control", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <ModalDialog isOpen onClose={handleClose} title="Zapis" onSubmit={(event) => event.preventDefault()} isSubmitting>
        <input aria-label="Pole" />
      </ModalDialog>
    );

    expect(screen.getByRole("button", { name: "Zamknij" }).hasAttribute("disabled")).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).not.toHaveBeenCalled();

    rerender(
      <ModalDialog isOpen onClose={handleClose} title="Zapis" onSubmit={(event) => event.preventDefault()}>
        <input aria-label="Pole" />
      </ModalDialog>
    );
    fireEvent.click(screen.getByRole("button", { name: "Zamknij" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
