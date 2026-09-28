import type { FormEvent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("does not submit a form unless explicitly requested", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Pomocniczy</Button>
        <Button type="submit">Zapisz</Button>
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "Pomocniczy" }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not add a button type to a child link", () => {
    render(<Button asChild><a href="#sekcja">Przejdź</a></Button>);
    expect(screen.getByRole("link", { name: "Przejdź" }).getAttribute("type")).toBeNull();
  });
});
