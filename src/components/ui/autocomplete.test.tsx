import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Autocomplete, type AutocompleteOption } from "./autocomplete";
import { School, Building, Sparkles } from "lucide-react";

describe("Design System - Autocomplete Component", () => {
  const sampleStringOptions = [
    "Szkoła Podstawowa nr 1 w Myśliborzu",
    "Szkoła Podstawowa nr 2 w Myśliborzu",
    "Zespół Szkół nr 1 w Dębnie",
    "Przedszkole Miejskie w Barlinku",
  ];

  const sampleRichOptions: AutocompleteOption[] = [
    { value: "sp1", label: "Szkoła Podstawowa nr 1", group: "Myślibórz", icon: School, badge: "SP", description: "ul. Piłsudskiego 1" },
    { value: "sp2", label: "Szkoła Podstawowa nr 2", group: "Myślibórz", icon: School, badge: "SP" },
    { value: "zs1", label: "Zespół Szkół nr 1", group: "Dębno", icon: Building, badge: "ZS" },
  ];

  it("renders with placeholder and custom label", () => {
    render(<Autocomplete options={sampleStringOptions} label="Nazwa Placówki" placeholder="Wpisz nazwę..." required />);
    expect(screen.getByText("Nazwa Placówki")).toBeDefined();
    expect(screen.getByText("*")).toBeDefined();
    expect(screen.getByPlaceholderText("Wpisz nazwę...")).toBeDefined();
  });

  it("shows suggestions dropdown when user focuses input", () => {
    render(<Autocomplete options={sampleStringOptions} />);
    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);

    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("Szkoła Podstawowa nr 1 w Myśliborzu")).toBeDefined();
  });

  it("filters suggestions dynamically as user types", () => {
    render(<Autocomplete options={sampleStringOptions} />);
    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Dębnie" } });

    expect(screen.getByText(/Zespół Szkół nr 1/i)).toBeDefined();
    expect(screen.queryByText("Przedszkole Miejskie w Barlinku")).toBeNull();
  });

  it("calls onChange and onSelectOption when an option is clicked", () => {
    const handleChange = vi.fn();
    const handleSelectOption = vi.fn();

    render(
      <Autocomplete
        options={sampleRichOptions}
        onChange={handleChange}
        onSelectOption={handleSelectOption}
      />
    );

    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);

    const option = screen.getByText("Szkoła Podstawowa nr 1");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("Szkoła Podstawowa nr 1");
    expect(handleSelectOption).toHaveBeenCalledWith(
      expect.objectContaining({ value: "sp1", label: "Szkoła Podstawowa nr 1" })
    );
  });

  it("allows typing custom value and shows create option prompt", () => {
    const handleCreate = vi.fn();
    render(
      <Autocomplete
        options={sampleStringOptions}
        allowCustomValue={true}
        onCreateOption={handleCreate}
      />
    );

    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Niestandardowa Nowa Szkoła" } });

    const createPrompt = screen.getByText(/Niestandardowa Nowa Szkoła/i);
    expect(createPrompt).toBeDefined();

    fireEvent.click(createPrompt);
    expect(handleCreate).toHaveBeenCalledWith("Niestandardowa Nowa Szkoła");
  });

  it("renders clear button and clears input on click", () => {
    const handleChange = vi.fn();
    render(
      <Autocomplete
        options={sampleStringOptions}
        value="Dębno"
        clearable={true}
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByLabelText("Wyczyść pole");
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("handles keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)", () => {
    const handleChange = vi.fn();
    render(<Autocomplete options={sampleStringOptions} onChange={handleChange} />);

    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);

    // Arrow down & Enter
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleChange).toHaveBeenCalled();

    // Escape closes listbox
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders error message and highlights error border", () => {
    render(<Autocomplete options={sampleStringOptions} error="To pole jest wymagane" />);
    expect(screen.getByText("To pole jest wymagane")).toBeDefined();
  });

  it("supports startIcon decoration", () => {
    render(<Autocomplete options={sampleStringOptions} startIcon={Sparkles} />);
    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    expect(input.className).toContain("pl-8");
  });

  it("renders more than 10 options without truncation and matches diacritics insensitively", () => {
    const largeList = Array.from({ length: 50 }, (_, i) => `Szkoła Podstawowa nr ${i + 1} w Myśliborzu`);
    render(<Autocomplete options={largeList} />);
    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);

    // Matches with latin 'mysliborzu' and 'szkola'
    fireEvent.change(input, { target: { value: "szkola mysliborzu 45" } });
    expect(screen.getByText("Szkoła Podstawowa nr 45 w Myśliborzu")).toBeDefined();
  });

  it("does not log React DOM property warnings when searchPlaceholder is provided", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Autocomplete
        options={["Test"]}
        searchPlaceholder="Szukaj testu..."
      />
    );
    expect(screen.getByPlaceholderText("Szukaj testu...")).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("prefers explicit placeholder over searchPlaceholder", () => {
    render(
      <Autocomplete
        options={["Test"]}
        placeholder="Główny placeholder"
        searchPlaceholder="Zapasowy placeholder"
      />
    );
    expect(screen.getByPlaceholderText("Główny placeholder")).toBeDefined();
    expect(screen.queryByPlaceholderText("Zapasowy placeholder")).toBeNull();
  });

  it("scrolls option into view on ArrowDown keyboard navigation", () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    render(<Autocomplete options={sampleStringOptions} />);
    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(scrollMock).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("reverts unlisted typed value on click outside when allowCustomValue is false", () => {
    const handleChange = vi.fn();
    render(
      <div>
        <Autocomplete
          options={sampleStringOptions}
          value=""
          allowCustomValue={false}
          onChange={handleChange}
        />
        <div data-testid="outside-element">Zewnętrzny element</div>
      </div>
    );

    const input = screen.getByPlaceholderText("Wpisz lub wybierz z listy...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "NiedozwolonaWartosc" } });
    expect((input as HTMLInputElement).value).toBe("NiedozwolonaWartosc");

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside-element"));
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("reverts unlisted typed value when focus leaves with Tab", () => {
    function Controlled() {
      const [value, setValue] = useState("Szkoła");
      return (
        <div>
          <Autocomplete options={["Szkoła"]} value={value} allowCustomValue={false} onChange={setValue} />
          <button type="button">Dalej</button>
          <output>{value}</output>
        </div>
      );
    }
    render(<Controlled />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "Nie ma na liście" } });
    act(() => screen.getByRole("button", { name: "Dalej" }).focus());

    expect(input.value).toBe("Szkoła");
    expect(screen.getByRole("status").textContent).toBe("Szkoła");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("navigates grouped suggestions in their displayed order", () => {
    const handleSelect = vi.fn();
    render(
      <Autocomplete
        options={[
          { value: "grouped", label: "W grupie", group: "Grupa" },
          { value: "plain", label: "Bez grupy" },
        ]}
        onSelectOption={handleSelect}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Bez grupy", "W grupie"]);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "plain" }));
  });

  it("connects the required combobox to its options and allows keyboard focus on a custom value", () => {
    const onCreateOption = vi.fn();
    render(
      <Autocomplete
        label="Placówka"
        required
        error="Wybierz placówkę"
        options={["Szkoła"]}
        onCreateOption={onCreateOption}
      />
    );

    const input = screen.getByRole("combobox", { name: /Placówka/ }) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.checkValidity()).toBe(false);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)).toHaveProperty("textContent", "Wybierz placówkę");

    act(() => input.focus());
    const listbox = screen.getByRole("listbox");
    expect(input.getAttribute("aria-controls")).toBe(listbox.id);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(document.getElementById(input.getAttribute("aria-activedescendant")!)?.getAttribute("role")).toBe("option");

    fireEvent.change(input, { target: { value: "Nowa placówka" } });
    const createButton = screen.getByRole("button", { name: /Użyj wartości:.*Nowa placówka/ });
    expect(createButton.tagName).toBe("BUTTON");
    fireEvent.keyDown(input, { key: "Tab" });
    act(() => createButton.focus());
    expect(screen.getByRole("listbox")).toBeDefined();
    fireEvent.click(createButton);
    expect(onCreateOption).toHaveBeenCalledWith("Nowa placówka");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
