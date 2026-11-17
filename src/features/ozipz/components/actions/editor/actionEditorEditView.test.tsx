import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useActionEditorState } from "./useActionEditorState";
import { ActionQuickForm } from "./ActionQuickForm";
import { ActionEzdTitles } from "./ActionEzdTitles";
import { clearActionDraft } from "./actionDraft";
import type { ActionEditorSectionProps } from "./editor.types";
import type { OzipzAction, OzipzTemplate } from "../../../types/ozipz.types";

const ts = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const template = { ...ts, id: "t1", title: "Szablon testowy", actionType: "Prelekcja", content: {} } as unknown as OzipzTemplate;

const editingAction: Partial<OzipzAction> = {
  id: "act-1",
  title: "Kampania EAAD – prośba o upowszechnienie informacji",
  actionType: "Prelekcja",
  date: "2026-10-26",
  facilityName: "Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu",
  municipality: "Myślibórz",
  leadEducator: "Krzysztof Palpuchowski",
  participantsCount: 62,
  audienceGroup: "Uczniowie - 62",
  status: "wykonane",
};

const base: ActionEditorSectionProps = {
  programs: [],
  templates: [template],
  dictionaryItems: [{ ...ts, id: "a1", code: "prelekcja", label: "Prelekcja", dictType: "activityType", isSystem: false }],
  facilities: [],
  municipalities: ["Gmina Myślibórz"],
};

function Harness(props: ActionEditorSectionProps) {
  const state = useActionEditorState(props);
  return (
    <>
      <ActionEzdTitles state={state} programs={props.programs ?? []} />
      <ActionQuickForm state={state} data={props} />
    </>
  );
}

beforeEach(() => clearActionDraft());
afterEach(cleanup);

describe("Edycja istniejącego działania", () => {
  it("pokazuje gotowe tytuły do EZD zbudowane z danych działania", async () => {
    render(<Harness {...base} editingAction={editingAction} />);
    const section = await screen.findByRole("region", { name: "Tytuły do EZD" });
    expect(section).toHaveTextContent(
      "Prelekcja – Kampania EAAD – prośba o upowszechnienie informacji – Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu – 26.10.2026"
    );
    expect(screen.getByRole("button", { name: "Kopiuj: Tytuł sprawy" })).toBeInTheDocument();
  });

  it("zwija listę szablonów i nie powtarza podpowiedzi o polach wymaganych", async () => {
    render(<Harness {...base} editingAction={editingAction} />);
    const toggle = await screen.findByRole("button", { name: /Szablony/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Szablon testowy")).toBeNull();
    expect(screen.queryByText(/Pola oznaczone \* są wymagane/)).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByText("Szablon testowy")).toBeInTheDocument();
  });
});

describe("Nowe działanie", () => {
  it("ma listę szablonów rozwiniętą i podpowiedź o polach wymaganych", () => {
    render(<Harness {...base} />);
    expect(screen.getByRole("button", { name: /Szablony/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Szablon testowy")).toBeInTheDocument();
    expect(screen.getByText(/Pola oznaczone \* są wymagane/)).toBeInTheDocument();
  });
});
