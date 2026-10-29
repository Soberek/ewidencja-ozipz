import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";
import { JRWA_DICTIONARY_FIXTURE } from "../../../../../test/fixtures/jrwaCatalog";
import { buildJrwaInterventionKindMap } from "../../../utils/calculators/jrwaClassification";
import { buildClassificationOptions } from "../../../utils/programJrwaUtils";
import { createActionColumns } from "../../actions/list/ActionsTableColumns";
import { ProgramsCatalogTab } from "./ProgramsCatalogTab";

/** Oznaczenie programowe/nieprogramowe przy wyborze programu i w tabelach – według rodzaju symbolu programu. */

const KIND_MAP = buildJrwaInterventionKindMap(JRWA_DICTIONARY_FIXTURE);

const program = (id: string, name: string, jrwaSymbol: string): OzipzProgram => ({
  id,
  code: id,
  name,
  editionYear: "2025/2026",
  jrwaSymbol,
  targetAudience: "",
  description: "",
  status: "aktywny",
  participatingSchoolsCount: 0,
  totalPupilsReached: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const PROGRAMS = [
  program("bezpieczne-wakacje", "Bezpieczne wakacje", "966.14"),
  program("seniorzy", "Seniorzy (Senior w roli głównej)", "966.19"),
  program("bez-teczki", "Program bez teczki", "999.9"),
];

beforeEach(() => {
  useOzipzDbStore.setState({ programs: PROGRAMS });
});

describe("Wybór programu lub klasyfikacji", () => {
  const options = buildClassificationOptions(
    PROGRAMS,
    [
      { symbol: "966.15", label: "Seniorzy (Senior w Roli Głównej)" },
      { symbol: "966.19", label: "Senior w roli głównej" },
    ],
    KIND_MAP
  );

  it("grupuje programy według rodzaju – programowe na początku – i podaje rodzaj w opisie", () => {
    expect(options.map((o) => [o.value, o.group, o.description])).toEqual([
      ["prog:seniorzy", "Programy – PROGRAMOWE", "JRWA 966.19 · programowe"],
      ["prog:bezpieczne-wakacje", "Programy – NIEPROGRAMOWE", "JRWA 966.14 · nieprogramowe"],
      ["prog:bez-teczki", "Programy – bez rodzaju w słowniku JRWA", "JRWA 999.9"],
      ["jrwa:966.15", "Klasyfikacja bez programu", "bez programu · nieprogramowe"],
    ]);
  });

  it("symbol przypisany programowi nie powtarza się jako osobna klasyfikacja", () => {
    expect(options.some((o) => o.value === "jrwa:966.19")).toBe(false);
  });
});

describe("Katalog programów", () => {
  it("pokazuje rodzaj każdego programu, a program bez rodzaju w słowniku oznacza ostrzeżeniem", () => {
    render(<ProgramsCatalogTab programs={PROGRAMS} onOpenAdd={() => {}} onEdit={() => {}} onDelete={() => {}} jrwaKindMap={KIND_MAP} />);

    expect(screen.getByRole("columnheader", { name: /Rodzaj/ })).toBeTruthy();
    expect(screen.getAllByText("PROGRAMOWE")).toHaveLength(1);
    expect(screen.getAllByText("NIEPROGRAMOWE")).toHaveLength(1);
    expect(screen.getByText("brak rodzaju")).toBeTruthy();
  });
});

describe("Rejestr działań – kolumna programu", () => {
  const programCell = (action: Partial<OzipzAction>) => {
    const column = createActionColumns({
      onToggleSelect: () => {},
      onSelectAll: () => {},
      isAllSelected: false,
      closedMonths: new Set(),
      copiedSignId: null,
      onCopySign: () => {},
      onOpenIzrz: () => {},
      onEdit: () => {},
      onDelete: () => {},
      jrwaKindMap: KIND_MAP,
    }).find((c) => c.id === "programName")!;
    const row = { id: "a-1", title: "Wykład", actionType: "Wykład", ...action } as OzipzAction;
    render(<>{column.cell!({ row, index: 0, isExpanded: false, isSelected: false })}</>);
  };

  it("oznacza działanie rodzajem wybranego programu, nie znakiem sprawy", () => {
    programCell({ programId: "seniorzy", programName: "Seniorzy (Senior w roli głównej)", jrwaSign: "966.15.1.2026" });
    expect(screen.getByText("PROGRAMOWE")).toBeTruthy();
  });

  it("działanie bez programu jest nieprogramowe, nawet ze znakiem z teczki programowej", () => {
    programCell({ jrwaSign: "OZiPZ.966.19.3.2026" });
    expect(screen.getByText("NIEPROGRAMOWE")).toBeTruthy();
  });
});
