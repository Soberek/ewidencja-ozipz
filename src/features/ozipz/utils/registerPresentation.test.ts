import { expect, it, vi } from "vitest";
import type { OzipzAction } from "../types/ozipz.types";
import * as downloadHelper from "./downloadHelper";
import { exportRegisterToCsv } from "./registerPresentation";

it("quotes every register cell and neutralizes spreadsheet formulas", async () => {
  const download = vi.spyOn(downloadHelper, "downloadBlob").mockImplementation(() => {});
  exportRegisterToCsv("informacje", [{
    izrzSign: "=1+1",
    date: "2026-09-26",
    title: "+SUM(1)",
    leadEducator: " \t@SUM(1)",
    notes: 'Said "hello"',
  } as OzipzAction], new Map());

  const [blob, filename] = download.mock.calls[0];
  const csv = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
  expect(filename).toMatch(/^rejestr_informacje_\d{4}-\d{2}-\d{2}\.csv$/);
  expect(csv).toContain('"\'=1+1";"2026-09-26";"\'+SUM(1)"');
  expect(csv).toContain('"\' \t@SUM(1)";"Said ""hello"""');
  download.mockRestore();
});
