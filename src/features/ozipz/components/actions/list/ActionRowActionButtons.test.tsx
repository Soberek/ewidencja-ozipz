import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActionRowActionButtons } from "./ActionRowActionButtons";
import type { OzipzAction } from "../../../types/ozipz.types";

const row = { id: "d1", title: "Dystrybucja" } as OzipzAction;
const renderButtons = (onPrintRozdzielnik?: (a: OzipzAction) => void) => render(
  <TooltipProvider><ActionRowActionButtons row={row} isClosed={false} canGenerateIzrz isPub={false} isCancelled={false}
    onOpenIzrz={() => {}} onEdit={() => {}} onDelete={() => {}} onPrintRozdzielnik={onPrintRozdzielnik} /></TooltipProvider>);

afterEach(() => cleanup());

describe("ActionRowActionButtons – druk rozdzielnika", () => {
  it("pokazuje przycisk tylko gdy działanie ma wydane materiały i przekazuje wiersz", () => {
    const onPrint = vi.fn();
    renderButtons(onPrint);
    fireEvent.click(screen.getByRole("button", { name: "Drukuj rozdzielnik" }));
    expect(onPrint).toHaveBeenCalledWith(row);
  });

  it("bez materiałów przycisku nie ma", () => {
    renderButtons();
    expect(screen.queryByRole("button", { name: "Drukuj rozdzielnik" })).toBeNull();
  });
});
