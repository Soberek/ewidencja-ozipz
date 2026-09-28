import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublicationDialog } from "./PublicationDialog";

it("keeps the publication form open after a failed save and permits retry", async () => {
  const onSave = vi.fn().mockRejectedValueOnce(new Error("Błąd bazy")).mockResolvedValueOnce(undefined);
  const onClose = vi.fn();
  render(
    <PublicationDialog
      isOpen
      onClose={onClose}
      editingPublication={null}
      programs={[]}
      jrwaSymbols={[]}
      onSave={onSave}
      onUpdate={vi.fn()}
    />
  );

  fireEvent.change(screen.getByPlaceholderText(/Światowy Dzień Rzucania Palenia/i), {
    target: { value: "Komunikat o szczepieniach" },
  });
  fireEvent.change(screen.getByPlaceholderText(/Facebook, Gov.pl, Portal X/i), {
    target: { value: "Portal gov.pl" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Opublikuj Wpis" }));

  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Błąd bazy"));
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Opublikuj Wpis" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(onSave).toHaveBeenCalledTimes(2);
});
