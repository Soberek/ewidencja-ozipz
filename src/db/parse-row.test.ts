import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { parseRow } from "./parse-row";

const Schema = z.object({ id: z.string(), name: z.string().min(1), status: z.string().default("nowe") });

describe("parseRow", () => {
  it("zwraca dane po walidacji, z wartościami domyślnymi schematu", () => {
    expect(parseRow(Schema, { id: "1", name: "Szkoła" }, "Test")).toEqual({ id: "1", name: "Szkoła", status: "nowe" });
  });

  it("nie blokuje wczytania przy uszkodzonym wierszu — oddaje surowy wiersz i ostrzega", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(parseRow(Schema, { id: "2", name: "" }, "Test")).toEqual({ id: "2", name: "" });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
