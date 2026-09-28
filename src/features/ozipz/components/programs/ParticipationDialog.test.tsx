import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ParticipationDialog } from "./ParticipationDialog";
import type { OzipzContact, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../../types/ozipz.types";

const facility: OzipzFacility = {
  id: "school-1", name: "Szkoła nr 1", type: "szkola", address: "Szkolna 1",
  city: "Myślibórz", postalCode: "74-300", municipality: "Myślibórz",
  county: "powiat myśliborski", leadingAuthority: "", isComplex: false,
  educationTypes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

const program: OzipzProgram = {
  id: "program-1", code: "TEST", name: "Program szkolny", editionYear: "2026/2027",
  jrwaSymbol: "966.1", targetAudience: "Szkoły", description: "", status: "aktywny",
  participatingSchoolsCount: 0, totalPupilsReached: 0,
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

const contact = (overrides: Partial<OzipzContact>): OzipzContact => ({
  id: "cnt-1", name: "Anna Nowak", position: "Szkolny Koordynator Programu",
  facilityId: facility.id, facilityName: facility.name, municipality: facility.municipality,
  phone: "600 000 000", email: "anna@szkola.pl", createdAt: "2026-01-01", updatedAt: "2026-01-01",
  ...overrides,
});

const participation = (overrides: Partial<OzipzSchoolParticipation>): OzipzSchoolParticipation => ({
  id: "part-1", programId: program.id, programName: program.name,
  facilityId: facility.id, facilityName: facility.name, municipality: facility.municipality,
  schoolYear: "2026/2027", schoolCoordinatorName: "Anna Nowak", schoolCoordinatorContact: "",
  classesCount: 2, pupilsCount: 48, parentsCount: 0, hasDeclaration: true,
  hasFinalReport: false, evaluationGrade: "", notes: "",
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
  ...overrides,
});

type DialogProps = Parameters<typeof ParticipationDialog>[0];

function renderDialog(props: Partial<DialogProps> = {}) {
  const all: DialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    editingParticipation: null,
    initialProgramId: program.id,
    initialFacilityId: facility.id,
    programs: [program],
    facilities: [facility],
    contacts: [],
    onSave: vi.fn(),
    onUpdate: vi.fn(),
    ...props,
  };
  const view = render(<ParticipationDialog {...all} />);
  return { ...all, ...view, rerenderWith: (next: Partial<DialogProps>) => view.rerender(<ParticipationDialog {...all} {...next} />) };
}

const pupilsInput = () => screen.getByLabelText(/Uczniowie ogółem/) as HTMLInputElement;
const save = (name = "Zapisz Zgłoszenie") => fireEvent.click(screen.getByRole("button", { name }));

describe("ParticipationDialog – szkolny koordynator ze Spisu Kontaktów", () => {
  it("podpowiada jedynego koordynatora placówki i zapisuje powiązanie z kontaktem", async () => {
    const { onSave, onClose } = renderDialog({ contacts: [contact({})] });

    expect(screen.getByText("Anna Nowak")).toBeDefined();
    expect(screen.getByText("anna@szkola.pl")).toBeDefined();
    fireEvent.change(pupilsInput(), { target: { value: "120" } });
    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      schoolCoordinatorContactId: "cnt-1",
      schoolCoordinatorName: "Anna Nowak",
      schoolCoordinatorContact: "600 000 000 / anna@szkola.pl",
      pupilsCount: 120,
      facilityId: facility.id,
    }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("wybiera koordynatora z listy – kontakty placówki są na górze", async () => {
    const other = contact({ id: "cnt-2", name: "Piotr Zieliński", facilityId: "school-2", facilityName: "Szkoła nr 2", position: "Pedagog" });
    const own = contact({ id: "cnt-3", name: "Ewa Mazur", position: "Pedagog Szkolny" });
    const { onSave } = renderDialog({ contacts: [other, own] });

    fireEvent.click(screen.getByLabelText(/Szkolny Koordynator Programu/));
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option").map((o) => o.textContent);
    expect(options[0]).toContain("Ewa Mazur");
    expect(within(listbox).getByText("Pozostałe kontakty ze spisu")).toBeDefined();

    fireEvent.click(within(listbox).getByText("Piotr Zieliński"));
    fireEvent.change(pupilsInput(), { target: { value: "30" } });
    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ schoolCoordinatorContactId: "cnt-2", schoolCoordinatorName: "Piotr Zieliński" }));
  });

  it("szybko dodaje brakującego koordynatora bez utraty wpisanych danych", async () => {
    const created = contact({ id: "cnt-new", name: "Jan Kowal", phone: "601 222 333", email: "" });
    const onQuickAddContact = vi.fn().mockResolvedValue(created);
    const { onSave, rerenderWith } = renderDialog({ onQuickAddContact, contactPositions: ["Dyrektor", "Szkolny Koordynator Programu"] });

    fireEvent.change(pupilsInput(), { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: /Nowy kontakt/ }));
    const panel = screen.getByRole("group", { name: /Nowy kontakt/ });
    fireEvent.change(within(panel).getByLabelText(/Imię i nazwisko/), { target: { value: "Jan Kowal" } });
    fireEvent.change(within(panel).getByLabelText("Telefon"), { target: { value: "601222333" } });
    // Enter w panelu dodaje kontakt – nie wysyła zgłoszenia.
    fireEvent.keyDown(within(panel).getByLabelText(/Imię i nazwisko/), { key: "Enter" });

    await waitFor(() => expect(onQuickAddContact).toHaveBeenCalledOnce());
    expect(onQuickAddContact).toHaveBeenCalledWith(expect.objectContaining({
      name: "Jan Kowal",
      position: "Szkolny Koordynator Programu",
      phone: "601 222 333",
      facilityId: facility.id,
      facilityName: facility.name,
    }));
    expect(onSave).not.toHaveBeenCalled();

    // Store dopisuje kontakt do listy – formularz nie może się przez to zresetować.
    rerenderWith({ onQuickAddContact, contacts: [created] });
    await waitFor(() => expect(screen.queryByRole("group", { name: /Nowy kontakt/ })).toBeNull());
    expect(pupilsInput().value).toBe("75");

    save();
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ schoolCoordinatorContactId: "cnt-new", pupilsCount: 75 }));
  });

  it("zostawia panel z danymi, gdy dodanie kontaktu się nie powiedzie", async () => {
    const onQuickAddContact = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onQuickAddContact });

    fireEvent.click(screen.getByRole("button", { name: /Nowy kontakt/ }));
    const panel = screen.getByRole("group", { name: /Nowy kontakt/ });
    fireEvent.change(within(panel).getByLabelText(/Imię i nazwisko/), { target: { value: "Jan Kowal" } });
    fireEvent.click(within(panel).getByRole("button", { name: /Dodaj i wybierz/ }));

    expect(await within(panel).findByRole("alert")).toBeDefined();
    expect((within(panel).getByLabelText(/Imię i nazwisko/) as HTMLInputElement).value).toBe("Jan Kowal");
  });

  it("proponuje dodanie koordynatora z karty placówki, gdy nie ma go w spisie", async () => {
    const onQuickAddContact = vi.fn().mockResolvedValue(contact({ id: "cnt-card" }));
    renderDialog({
      onQuickAddContact,
      facilities: [{ ...facility, defaultCoordinatorName: "Anna Nowak", defaultCoordinatorEmail: "anna@szkola.pl" }],
    });

    fireEvent.click(screen.getByRole("button", { name: /Karta placówki wskazuje koordynatora Anna Nowak/ }));
    const panel = screen.getByRole("group", { name: /Nowy kontakt/ });
    expect((within(panel).getByLabelText(/Imię i nazwisko/) as HTMLInputElement).value).toBe("Anna Nowak");
    expect((within(panel).getByLabelText("E-mail") as HTMLInputElement).value).toBe("anna@szkola.pl");
  });

  it("ostrzega przed duplikatem kontaktu i pozwala wybrać istniejącą osobę", async () => {
    const existing = contact({ id: "cnt-dup", name: "Anna Nowak", facilityId: undefined, facilityName: "" });
    const onQuickAddContact = vi.fn();
    const { onSave } = renderDialog({ onQuickAddContact, contacts: [existing], initialFacilityId: undefined });

    fireEvent.click(screen.getByRole("button", { name: /Nowy kontakt/ }));
    const panel = screen.getByRole("group", { name: /Nowy kontakt/ });
    fireEvent.change(within(panel).getByLabelText(/Imię i nazwisko/), { target: { value: "mgr Anna Nowak" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Wybierz tę osobę" }));

    expect(onQuickAddContact).not.toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: /Nowy kontakt/ })).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("nie zapisuje zgłoszenia bez koordynatora", async () => {
    const { onSave } = renderDialog();
    fireEvent.change(pupilsInput(), { target: { value: "20" } });
    save();

    expect((await screen.findAllByText("Wybierz szkolnego koordynatora programu")).length).toBeGreaterThan(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("wymaga liczby uczniów biorących udział w programie", async () => {
    const { onSave } = renderDialog({ contacts: [contact({})] });
    save();

    expect((await screen.findAllByText("Podaj liczbę uczniów biorących udział w programie (ogółem)")).length).toBeGreaterThan(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("przypisuje wybrany kontakt bez placówki do placówki zgłoszenia", async () => {
    const loose = contact({ id: "cnt-loose", facilityId: undefined, facilityName: "Placówka oświatowa powiatu myśliborskiego" });
    const onUpdateContact = vi.fn();
    renderDialog({
      editingParticipation: participation({ schoolCoordinatorContactId: "cnt-loose" }),
      contacts: [loose],
      onUpdateContact,
    });

    const checkbox = screen.getByRole("checkbox", { name: /Przypisz ten kontakt do placówki/ }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    save("Zapisz Zmiany");

    await waitFor(() => expect(onUpdateContact).toHaveBeenCalledWith("cnt-loose", {
      facilityId: facility.id, facilityName: facility.name, municipality: facility.municipality,
    }));
  });

  it("nie przypisuje kontaktu, gdy odznaczono opcję", async () => {
    const loose = contact({ id: "cnt-loose", facilityId: undefined, facilityName: "" });
    const onUpdateContact = vi.fn();
    const onUpdate = vi.fn();
    renderDialog({
      editingParticipation: participation({ schoolCoordinatorContactId: "cnt-loose" }),
      contacts: [loose],
      onUpdate,
      onUpdateContact,
    });

    fireEvent.click(screen.getByRole("checkbox", { name: /Przypisz ten kontakt do placówki/ }));
    save("Zapisz Zmiany");

    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(onUpdateContact).not.toHaveBeenCalled();
  });

  it("wiąże ręcznie wpisanego koordynatora z pasującym kontaktem", async () => {
    const onUpdate = vi.fn();
    renderDialog({
      editingParticipation: participation({ schoolCoordinatorName: "mgr Anna Nowak", schoolCoordinatorContact: "600 000 000" }),
      contacts: [contact({})],
      onUpdate,
    });

    expect(screen.getByText(/nie jest powiązany ze Spisem Kontaktów/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Powiąż z kontaktem Anna Nowak/ }));
    save("Zapisz Zmiany");

    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(onUpdate).toHaveBeenCalledWith("part-1", expect.objectContaining({
      schoolCoordinatorContactId: "cnt-1",
      schoolCoordinatorName: "Anna Nowak",
    }));
  });

  it("zachowuje ręcznie wpisanego koordynatora, gdy nie ma go w spisie", async () => {
    const onUpdate = vi.fn();
    renderDialog({
      editingParticipation: participation({ schoolCoordinatorName: "Jan Kowal", schoolCoordinatorContact: "601 222 333" }),
      onUpdate,
      onQuickAddContact: vi.fn(),
    });

    expect(screen.getByRole("button", { name: /Dodaj do Spisu Kontaktów/ })).toBeDefined();
    save("Zapisz Zmiany");

    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(onUpdate).toHaveBeenCalledWith("part-1", expect.objectContaining({
      schoolCoordinatorName: "Jan Kowal",
      schoolCoordinatorContact: "601 222 333",
      schoolCoordinatorContactId: undefined,
    }));
  });

  it("rok szkolny wybiera się ze słownika, bez ręcznego wpisywania", async () => {
    const { onSave } = renderDialog({ contacts: [contact({})], participations: [participation({ id: "old", facilityId: "x", schoolYear: "2015/2016" })] });

    expect(screen.queryByPlaceholderText("np. 2025/2026")).toBeNull();
    const yearSelect = screen.getByRole("combobox", { name: /Rok Szkolny/ });
    expect(yearSelect.textContent).toContain("2026/2027");
    fireEvent.click(yearSelect);
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("2015/2016")).toBeDefined();
    fireEvent.click(within(listbox).getByText("2025/2026"));
    fireEvent.change(pupilsInput(), { target: { value: "40" } });
    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ schoolYear: "2025/2026" })));
  });

  it("nie zapisuje zgłoszenia z rokiem szkolnym spoza słownika", async () => {
    const onUpdate = vi.fn();
    renderDialog({ editingParticipation: participation({ schoolYear: "2026" }), contacts: [contact({})], onUpdate });

    save("Zapisz Zmiany");

    expect((await screen.findAllByText("Wybierz rok szkolny z listy")).length).toBeGreaterThan(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("od razu ostrzega, że placówka jest już zgłoszona do programu w tym roku", () => {
    renderDialog({ participations: [participation({ id: "existing" })] });
    expect(screen.getByRole("alert").textContent).toContain("jest już zgłoszona do tego programu");
  });

  it("nie zapisuje zgłoszenia powiązanego z usuniętym programem", async () => {
    const onUpdate = vi.fn();
    renderDialog({
      editingParticipation: participation({ programId: "missing", programName: "Usunięty program" }),
      contacts: [contact({})],
      onUpdate,
    });

    save("Zapisz Zmiany");

    expect((await screen.findAllByText("Wybierz program z katalogu.")).length).toBeGreaterThan(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
