import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { RozdzielnikPrintSection } from "./RozdzielnikPrintSection";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";

const stamp = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const baseAction = {
  title: "Dystrybucja", actionType: "Dystrybucja", topic: "", audienceGroup: "Uczniowie", ezdStatus: "", status: "", participantsCount: 0,
  materialsDistributedCount: 0, leadEducator: "Jan", municipality: "Myślibórz", ...stamp,
};

describe("RozdzielnikPrintSection", () => {
  beforeEach(() => {
    useOzipzDbStore.setState({
      actions: [{ ...baseAction, id: "d1", date: "2026-09-09", facilityName: "SP 3", programName: "Program testowy" }],
      distributions: [{ id: "r1", actionId: "d1", materialTitle: "Ulotka testowa", quantity: 7, recipientName: "SP 3", distributionDate: "2026-09-09", assignedEducator: "", purpose: "", createdAt: "" }],
      materials: [], facilities: [],
    });
  });
  afterEach(() => cleanup());

  it("otwarty z ?dzialanie=ID od razu uzupełnia program, placówkę i materiały wybranego zadania", async () => {
    render(<MemoryRouter initialEntries={["/narzedzia/druk-rozdzielnika?dzialanie=d1"]}><RozdzielnikPrintSection /></MemoryRouter>);
    expect(await screen.findByLabelText("Program")).toHaveValue("Program testowy");
    expect(screen.getByLabelText("Instytucja/organizacja")).toHaveValue("SP 3");
    expect(screen.getByDisplayValue("Ulotka testowa")).toBeInTheDocument();
  });

  it("bez parametru zostawia formularz pusty", () => {
    render(<MemoryRouter initialEntries={["/narzedzia/druk-rozdzielnika"]}><RozdzielnikPrintSection /></MemoryRouter>);
    expect(screen.getByLabelText("Program")).toHaveValue("");
  });
});
