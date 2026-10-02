import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readScanFile } from "@/db/scan-files";
import { downloadBlob } from "@/db/backup-storage";
import { ScansSection } from "./ScansSection";
import { ScanFilePreviewDialog } from "./components/ScanFilePreviewDialog";
import type { OzipzScan } from "../../types/ozipz.types";

vi.mock("@/db/scan-files", () => ({ readScanFile: vi.fn() }));
vi.mock("@/db/backup-storage", () => ({ downloadBlob: vi.fn() }));
const NativeURL = URL;
const revoke = vi.fn();
const scan: OzipzScan = {
  id: "scan-1", title: "Deklaracja", fileName: "document.png", filePath: "scan:file-1", facilityName: "",
  documentType: "deklaracja", scanDate: "2026-10-01", createdAt: "2026-10-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal("URL", class extends NativeURL {
    static override createObjectURL = vi.fn(() => "blob:stored-scan");
    static override revokeObjectURL = revoke;
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("opens a search result after scans load and downloads its stored bytes", async () => {
  const blob = new Blob(["stored image content"], { type: "image/png" });
  vi.mocked(readScanFile).mockResolvedValue(blob);
  const props = { onOpenAdd: vi.fn(), onDelete: vi.fn(), initialScanId: scan.id };
  const { rerender } = render(<ScansSection {...props} scans={[]} />);
  expect(screen.queryByRole("dialog")).toBeNull();
  rerender(<ScansSection {...props} scans={[scan]} />);
  await waitFor(() => expect(screen.getByRole("img", { name: scan.title }).getAttribute("src")).toBe("blob:stored-scan"));
  expect(readScanFile).toHaveBeenCalledWith(scan.filePath);
  fireEvent.click(screen.getByRole("button", { name: "Pobierz plik" }));
  expect(downloadBlob).toHaveBeenCalledWith(blob, "document.png");
  fireEvent.click(screen.getAllByRole("button", { name: /^Zamknij$/ })[0]);
  await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:stored-scan"));
  rerender(<ScansSection {...props} scans={[{ ...scan }]} />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("shows missing legacy file errors and prevents downloading unavailable data", async () => {
  vi.mocked(readScanFile).mockRejectedValue(new Error("Dodaj dokument ponownie do archiwum."));
  render(<ScanFilePreviewDialog scan={{ ...scan, filePath: "/old/document.pdf" }} onClose={vi.fn()} />);
  expect(await screen.findByText("Dodaj dokument ponownie do archiwum.")).toBeDefined();
  expect((screen.getByRole("button", { name: "Pobierz plik" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByTitle("Podgląd skanu")).toBeNull();
});
