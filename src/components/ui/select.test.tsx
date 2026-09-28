import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select, type SelectOption } from "./select";
import { School, Building, ShieldCheck } from "lucide-react";

describe("Design System - Select & SearchableSelect Component", () => {
  const sampleStringOptions = ["Myślibórz", "Dębno", "Barlinek", "Nowogródek Pomorski", "Boleszkowice"];

  const sampleRichOptions: SelectOption[] = [
    { value: "sp1", label: "Szkoła Podstawowa nr 1", group: "Myślibórz", icon: School, badge: "SP", description: "ul. Piłsudskiego 1" },
    { value: "sp2", label: "Szkoła Podstawowa nr 2", group: "Myślibórz", icon: School, badge: "SP" },
    { value: "zs1", label: "Zespół Szkół nr 1", group: "Dębno", icon: Building, badge: "ZS" },
    { value: "prog1", label: "Czyste Powietrze Wokół Nas", badge: "966.1", icon: ShieldCheck, badgeVariant: "success" },
  ];

  it("renders with placeholder when no value is selected", () => {
    render(<Select options={sampleStringOptions} placeholder="-- Wybierz gminę --" />);
    expect(screen.getByText("-- Wybierz gminę --")).toBeDefined();
  });

  it("renders label and required indicator", () => {
    render(<Select options={sampleStringOptions} label="Gmina" required />);
    expect(screen.getByText("Gmina")).toBeDefined();
    expect(screen.getByText("*")).toBeDefined();
  });

  it("renders selected option label and badge", () => {
    render(<Select options={sampleRichOptions} value="prog1" />);
    expect(screen.getByText("Czyste Powietrze Wokół Nas")).toBeDefined();
    expect(screen.getByText("966.1")).toBeDefined();
  });

  it("opens dropdown on click and displays options", () => {
    render(<Select options={sampleStringOptions} />);
    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("Myślibórz")).toBeDefined();
    expect(screen.getByText("Dębno")).toBeDefined();
  });

  it("filters options dynamically via search input", () => {
    render(<Select options={sampleRichOptions} searchPlaceholder="Szukaj placówki..." />);
    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Szukaj placówki...");
    fireEvent.change(searchInput, { target: { value: "Dębno" } });

    expect(screen.getByText("Zespół Szkół nr 1")).toBeDefined();
    expect(screen.queryByText("Szkoła Podstawowa nr 1")).toBeNull();
  });

  it("calls onChange when an option is clicked", () => {
    const handleChange = vi.fn();
    render(<Select options={sampleStringOptions} onChange={handleChange} />);
    
    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    fireEvent.click(trigger);

    const option = screen.getByText("Barlinek");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("Barlinek");
  });

  it("renders clear button and clears value when clicked", () => {
    const handleChange = vi.fn();
    render(<Select options={sampleStringOptions} value="Dębno" clearable onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: /Dębno/ });
    const clearButton = screen.getByRole("button", { name: "Wyczyść wybór" });
    expect(trigger.contains(clearButton)).toBe(false);
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("submits a named selection with the form", () => {
    const { container } = render(<form><Select name="gmina" options={sampleStringOptions} value="Dębno" required /></form>);
    expect(new FormData(container.querySelector("form")!).get("gmina")).toBe("Dębno");
    expect(screen.getByRole("button", { name: /Dębno/ }).getAttribute("aria-required")).toBe("true");
  });

  it("renders groups with headers correctly", () => {
    render(<Select options={sampleRichOptions} />);
    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    fireEvent.click(trigger);

    expect(screen.getByText("Myślibórz")).toBeDefined();
    expect(screen.getByText("Dębno")).toBeDefined();
  });

  it("handles keyboard navigation (Enter and Escape)", () => {
    const handleChange = vi.fn();
    render(<Select options={sampleStringOptions} onChange={handleChange} />);
    
    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    
    // Open with Enter
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeDefined();

    // Close with Escape
    const searchInput = screen.getByPlaceholderText("Szukaj...");
    fireEvent.keyDown(searchInput, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("scrolls option into view on ArrowDown keyboard navigation and selects with Enter", () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    const handleChange = vi.fn();
    render(<Select options={sampleStringOptions} onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: /-- wybierz opcję --/i });
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Szukaj...");
    // First ArrowDown -> selects index 0 ("Myślibórz")
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    // Second ArrowDown -> selects index 1 ("Dębno")
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    // scrollIntoView should have been called on the active option element
    expect(scrollMock).toHaveBeenCalledWith({ block: "nearest" });

    // Press Enter to confirm selection of "Dębno"
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(handleChange).toHaveBeenCalledWith("Dębno");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("navigates grouped options in their visual order", () => {
    const handleChange = vi.fn();
    render(<Select options={sampleRichOptions} onChange={handleChange} />);
    fireEvent.click(screen.getByRole("button", { name: /-- wybierz opcję --/i }));
    const searchInput = screen.getByPlaceholderText("Szukaj...");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(handleChange).toHaveBeenCalledWith("prog1");
  });

  it("announces the highlighted option without search", () => {
    const handleChange = vi.fn();
    render(<Select options={sampleStringOptions} searchable={false} onChange={handleChange} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(document.getElementById(trigger.getAttribute("aria-activedescendant")!)?.textContent).toContain("Myślibórz");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(handleChange).toHaveBeenCalledWith("Myślibórz");
  });

  it("displays error message when error string is provided", () => {
    render(<Select options={sampleStringOptions} error="Pole jest wymagane" />);
    expect(screen.getByText("Pole jest wymagane")).toBeDefined();
  });
});
