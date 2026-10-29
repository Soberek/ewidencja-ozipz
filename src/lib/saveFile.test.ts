import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dialogSave = vi.fn();
const invoke = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({ save: dialogSave }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

const { saveFileAs, suggestedSavePath, fileNameFromPath } = await import("./saveFile");

const options = {
  fileName: "IZRZ_87-2026_2026-07-24.docx",
  filterName: "Dokument Word",
  extension: "docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

describe("suggestedSavePath", () => {
  it("places the file in the last used folder with its native separator", () => {
    expect(suggestedSavePath("a.docx", null)).toBe("a.docx");
    expect(suggestedSavePath("a.docx", "/Users/ola/Dokumenty")).toBe("/Users/ola/Dokumenty/a.docx");
    expect(suggestedSavePath("a.docx", "C:\\Users\\ola\\Dokumenty\\")).toBe("C:\\Users\\ola\\Dokumenty\\a.docx");
    expect(fileNameFromPath("C:\\IZRZ\\a.docx")).toBe("a.docx");
  });
});

describe("saveFileAs in the desktop app", () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    localStorage.clear();
    dialogSave.mockReset();
    invoke.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it("writes the document to the chosen path and suggests that folder next time", async () => {
    dialogSave.mockResolvedValueOnce("/Users/ola/IZRZ/raport");
    const saved = await saveFileAs(new Blob([new Uint8Array([1, 2, 3])]), options);

    expect(saved).toEqual({ fileName: "raport.docx", path: "/Users/ola/IZRZ/raport.docx" });
    expect(dialogSave.mock.calls[0][0]).toMatchObject({ defaultPath: options.fileName });
    expect(invoke).toHaveBeenCalledWith("save_generated_file", {
      destinationPath: "/Users/ola/IZRZ/raport.docx",
      contents: [1, 2, 3],
    });

    dialogSave.mockResolvedValueOnce(null);
    await saveFileAs(new Blob([]), options);
    expect(dialogSave.mock.calls[1][0]).toMatchObject({ defaultPath: `/Users/ola/IZRZ/${options.fileName}` });
  });

  it("returns null and writes nothing when the user cancels", async () => {
    dialogSave.mockResolvedValueOnce(null);
    expect(await saveFileAs(new Blob([]), options)).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("saveFileAs in the browser", () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).showSaveFilePicker;
  });

  it("uses the system save picker when the browser offers one", async () => {
    const write = vi.fn();
    const close = vi.fn();
    (window as unknown as Record<string, unknown>).showSaveFilePicker = vi.fn().mockResolvedValue({
      name: "wybrany.docx",
      createWritable: async () => ({ write, close }),
    });
    const blob = new Blob(["x"]);

    expect(await saveFileAs(blob, options)).toEqual({ fileName: "wybrany.docx" });
    expect(write).toHaveBeenCalledWith(blob);
    expect(close).toHaveBeenCalled();
  });

  it("treats a dismissed picker as a cancellation", async () => {
    (window as unknown as Record<string, unknown>).showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(new DOMException("Anulowano", "AbortError"));
    expect(await saveFileAs(new Blob([]), options)).toBeNull();
  });
});
