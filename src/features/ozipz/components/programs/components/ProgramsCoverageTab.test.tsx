import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { ProgramsCoverageTab } from "./ProgramsCoverageTab";

const program = (overrides: Partial<OzipzProgram>) =>
  ({ id: "higiena", name: "Higiena naszą tarczą ochronną", jrwaSymbol: "966.4", status: "aktywny", targetAudience: "Szkoła podstawowa", ...overrides }) as OzipzProgram;

const facility = (overrides: Partial<OzipzFacility>) =>
  ({ id: "sp1", name: "SP 1 w Myśliborzu", type: "szkola", municipality: "Myślibórz", educationTypes: ["Szkoła podstawowa"], email: "sp1@szkola.pl", ...overrides }) as OzipzFacility;

const programs = [
  program({}),
  program({ id: "zeby", name: "Zdrowe zęby mamy", jrwaSymbol: "966.3", targetAudience: "Przedszkole, Żłobek, Oddział przedszkolny" }),
  program({ id: "mlodzi", name: "#MłodziŚwiadomi", jrwaSymbol: "966.18", targetAudience: "Młodzież szkół ponadpodstawowych" }),
];
const facilities = [
  facility({}),
  facility({ id: "sp2", name: "SP 2 w Dębnie", municipality: "Dębno", educationTypes: ["Szkoła podstawowa", "Oddział przedszkolny"], email: "", phone: "95 760 00 00" }),
  facility({ id: "p1", name: "Przedszkole Słoneczko", type: "przedszkole", educationTypes: ["Przedszkole"] }),
];
// Rok bez zgłoszeń w bieżącym roku szkolnym – zakładka startuje od najnowszego roku ze zgłoszeniami.
const participations = [
  { id: "z1", programId: "higiena", facilityId: "sp1", facilityName: "SP 1 w Myśliborzu", municipality: "Myślibórz", schoolYear: "2024/2025" },
] as OzipzSchoolParticipation[];
const kinds = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([["966.3", "PROGRAMOWE"], ["966.4", "PROGRAMOWE"], ["966.18", "PROGRAMOWE"]]);

function renderTab() {
  const onAddParticipation = vi.fn();
  render(
    <ProgramsCoverageTab
      programs={programs}
      facilities={facilities}
      participations={participations}
      actions={[]}
      jrwaKindMap={kinds}
      onAddParticipation={onAddParticipation}
    />
  );
  return { onAddParticipation };
}

describe("zakładka Bez zgłoszeń", () => {
  it("pokazuje pokrycie programów i placówki bez zgłoszenia", () => {
    renderTab();

    expect(screen.getByText("1/2")).toBeDefined();
    expect(screen.getByText("0/2")).toBeDefined();
    const table = screen.getByRole("table");
    expect(within(table).queryByText("SP 1 w Myśliborzu")).toBeNull();
    expect(within(table).getAllByText("SP 2 w Dębnie")).toHaveLength(2);
    expect(within(table).getByText("Przedszkole Słoneczko")).toBeDefined();
    expect(within(table).getAllByText("95 760 00 00")).toHaveLength(2);
    expect(screen.getByText(/Poza zestawieniem/).textContent).toContain("#MłodziŚwiadomi");
  });

  it("karta programu zawęża listę, a przycisk otwiera zgłoszenie dla placówki", () => {
    const { onAddParticipation } = renderTab();

    fireEvent.click(screen.getByRole("button", { name: /^Zdrowe zęby mamy/ }));
    const table = screen.getByRole("table");
    expect(within(table).queryByText("Higiena naszą tarczą ochronną")).toBeNull();
    expect(within(table).getByText("Oddział przedszkolny")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Dodaj zgłoszenie: SP 2 w Dębnie – Zdrowe zęby mamy" }));
    expect(onAddParticipation).toHaveBeenCalledWith("zeby", "sp2");
  });
});
