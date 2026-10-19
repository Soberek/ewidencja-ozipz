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
// Brak zgłoszeń w bieżącym roku szkolnym – zakładka startuje od najnowszego roku ze zgłoszeniami.
const zgloszenie = {
  id: "z1", programId: "higiena", programName: "Higiena", facilityId: "sp1", facilityName: "SP 1 w Myśliborzu", municipality: "Myślibórz",
  schoolYear: "2024/2025", schoolCoordinatorName: "Anna Nowak", pupilsCount: 48, hasDeclaration: true, hasFinalReport: false,
} as OzipzSchoolParticipation;
const kinds = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">([["966.3", "PROGRAMOWE"], ["966.4", "PROGRAMOWE"], ["966.18", "PROGRAMOWE"]]);

function renderTab() {
  const onAddParticipation = vi.fn();
  const onEditParticipation = vi.fn();
  render(
    <ProgramsCoverageTab
      programs={programs}
      facilities={facilities}
      participations={[zgloszenie]}
      actions={[]}
      jrwaKindMap={kinds}
      onAddParticipation={onAddParticipation}
      onEditParticipation={onEditParticipation}
    />
  );
  return { onAddParticipation, onEditParticipation };
}

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;

describe("zakładka Przegląd placówek", () => {
  it("pokazuje w jednym wierszu, do których programów placówka jest zgłoszona, a do których nie", () => {
    renderTab();

    expect(screen.getByRole("button", { name: /^Higiena naszą tarczą ochronną\s*1\/2/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Zdrowe zęby mamy\s*0\/2/ })).toBeDefined();
    within(rowOf("SP 1 w Myśliborzu")).getByRole("img", { name: "Higiena naszą tarczą ochronną: zgłoszona" });
    within(rowOf("SP 1 w Myśliborzu")).getByRole("img", { name: "Zdrowe zęby mamy: nie dotyczy" });
    within(rowOf("SP 2 w Dębnie")).getByRole("img", { name: "Higiena naszą tarczą ochronną: brak zgłoszenia" });
    within(rowOf("SP 2 w Dębnie")).getByRole("img", { name: "Zdrowe zęby mamy: brak zgłoszenia" });
    expect(within(rowOf("SP 2 w Dębnie")).getByText("0/2")).toBeDefined();
    expect(screen.getByText(/Poza zestawieniem/).textContent).toContain("#MłodziŚwiadomi");
  });

  it("filtruje placówki z brakami i według programu z karty", () => {
    renderTab();

    fireEvent.click(screen.getByRole("button", { name: "Z brakującymi zgłoszeniami" }));
    expect(screen.queryByText("SP 1 w Myśliborzu")).toBeNull();
    expect(screen.getByText("SP 2 w Dębnie")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Wszystkie placówki" }));
    fireEvent.click(screen.getByRole("button", { name: /^Zdrowe zęby mamy\s*0\/2/ }));
    expect(screen.queryByText("SP 1 w Myśliborzu")).toBeNull();
    expect(screen.getByText("Przedszkole Słoneczko")).toBeDefined();
  });

  it("kliknięcie placówki pokazuje zgłoszenia i braki z przyciskami", () => {
    const { onAddParticipation, onEditParticipation } = renderTab();

    fireEvent.click(rowOf("SP 1 w Myśliborzu"));
    const signed = screen.getByRole("region", { name: "Zgłoszenia placówki" });
    expect(signed.textContent).toContain("koordynator: Anna Nowak");
    expect(signed.textContent).toContain("uczniowie: 48");
    expect(signed.textContent).toContain("sprawozdanie: oczekuje");
    fireEvent.click(within(signed).getByRole("button", { name: "Edytuj zgłoszenie: Higiena naszą tarczą ochronną" }));
    expect(onEditParticipation).toHaveBeenCalledWith(zgloszenie);

    fireEvent.click(rowOf("SP 2 w Dębnie"));
    fireEvent.click(screen.getByRole("button", { name: "Dodaj zgłoszenie: SP 2 w Dębnie – Zdrowe zęby mamy" }));
    expect(onAddParticipation).toHaveBeenCalledWith("zeby", "sp2");
  });
});
