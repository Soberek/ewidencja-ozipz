import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { discardScanFile, importScanFile } from "@/db/scan-files";
import { ScanDialog } from "./ScanDialog";

vi.mock("@/db/scan-files", () => ({
  importScanFile: vi.fn().mockResolvedValue("scan:stored"),
  discardScanFile: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => vi.clearAllMocks());

it("requires a real file before recording a scan", async () => {
  const onSave = vi.fn();
  render(<ScanDialog isOpen onClose={vi.fn()} facilities={[]} programs={[]}
    documentTypes={["Deklaracja"]} onSave={onSave} />);
  fireEvent.change(screen.getByRole("textbox", { name: /Tytuł Dokumentu/i }), { target: { value: "Deklaracja szkoły" } });
  fireEvent.click(screen.getByRole("button", { name: /Typ Dokumentu/i }));
  fireEvent.click(screen.getByText("Deklaracja"));
  fireEvent.click(screen.getByRole("button", { name: "Dodaj Skan do Archiwum" }));

  expect(await screen.findByText("Wybierz plik ze skanem.")).toBeDefined();
  expect(importScanFile).not.toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});

it("discards an imported file on rejected metadata save and permits a retry", async () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockRejectedValueOnce(new Error("Baza niedostępna")).mockResolvedValueOnce(undefined);
  render(<ScanDialog isOpen onClose={onClose} facilities={[]} programs={[]}
    documentTypes={["Deklaracja"]} onSave={onSave} />);
  fireEvent.change(screen.getByLabelText(/Wybierz plik ze skanem/i), {
    target: { files: [new File(["pdf"], "deklaracja.pdf", { type: "application/pdf" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: /Typ Dokumentu/i }));
  fireEvent.click(screen.getByText("Deklaracja"));
  fireEvent.click(screen.getByRole("button", { name: "Dodaj Skan do Archiwum" }));

  expect(await screen.findByText("Baza niedostępna")).toBeDefined();
  expect(discardScanFile).toHaveBeenCalledWith("scan:stored");
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Dodaj Skan do Archiwum" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(importScanFile).toHaveBeenCalledTimes(2);
  expect(onSave.mock.calls[1][0].filePath).toBe("scan:stored");
});
