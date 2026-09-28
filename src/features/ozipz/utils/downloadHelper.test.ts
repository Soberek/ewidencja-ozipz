import { describe, it, expect, vi } from "vitest";
import { downloadBlob } from "./downloadHelper";

describe("downloadHelper", () => {
  it("creates an anchor element, sets object URL, triggers download and cleans up", () => {
    const mockBlob = new Blob(["test-content"], { type: "text/plain" });
    const mockUrl = "blob:http://localhost/test-uuid";

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = () => "";
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = () => {};
    }

    const createObjectURLSpy = vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue(mockUrl);
    const revokeObjectURLSpy = vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => {});

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === "a") {
        el.click = clickMock;
      }
      return el;
    });

    downloadBlob(mockBlob, "raport_2026.txt");

    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
