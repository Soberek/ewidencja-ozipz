import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ScheduleDialog, ScheduleFormSchema } from "./ScheduleDialog";
import type { OzipzDictionaryItem, OzipzFacility, OzipzStaff } from "../../types/ozipz.types";

it("validates dates and the reason for postponing a task", () => {
  const task = {
    title: "  Prelekcja  ",
    activityTypeCode: "prelekcja",
    eventDate: "2026-09-26",
    endDate: "2026-09-25",
    location: "  Szkoła  ",
    status: "odroczone",
    responsiblePerson: "Anna Nowak",
  };
  const invalid = ScheduleFormSchema.safeParse(task);
  expect(invalid.success).toBe(false);
  if (!invalid.success) {
    expect(invalid.error.issues.map((issue) => issue.path.join("."))).toEqual(["endDate", "annotationReasonCode"]);
  }
  const valid = ScheduleFormSchema.parse({ ...task, endDate: "2026-09-27", annotationReasonCode: "FERIE" });
  expect(valid.title).toBe("Prelekcja");
  expect(valid.location).toBe("Szkoła");
  expect(ScheduleFormSchema.safeParse({ ...task, eventDate: "2025-02-29", endDate: "", status: "zaplanowane" }).success).toBe(false);
});

it("updates year and month from the date without losing archived dictionary labels", async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  render(<ScheduleDialog isOpen onClose={vi.fn()} onSave={vi.fn()} onUpdate={onUpdate}
    editingEvent={{
      id: "task-1", title: "Archiwalne zadanie", activityTypeCode: "old-type", activityTypeName: "Stara forma",
      eventDate: "2026-09-26", month: 1, year: 2025, location: "Szkoła", status: "odroczone",
      annotationReasonCode: "old-reason", annotationReasonLabel: "Dawny powód", annotationText: "Uzasadnienie",
      responsiblePerson: "Anna Nowak", programId: "old-program", programName: "Archiwalny program",
      createdAt: "2025-01-01", updatedAt: "2025-01-01",
    }} />);

  fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
  await waitFor(() => expect(onUpdate).toHaveBeenCalledWith("task-1", expect.objectContaining({
    year: 2026, month: 9, monthName: "wrzesień", activityTypeName: "Stara forma", programName: "Archiwalny program",
    annotationReasonLabel: "Dawny powód", annotationText: "Uzasadnienie",
  })));
});

it("keeps task details after a failed save and clears a facility link when the place changes", async () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockRejectedValueOnce(new Error("Brak zapisu")).mockResolvedValueOnce(undefined);
  const activityTypes = [{ code: "prelekcja", label: "Prelekcja" }] as OzipzDictionaryItem[];
  const facilities = [{ id: "school-1", name: "Szkoła Podstawowa nr 1", city: "Myślibórz", municipality: "Myślibórz", address: "Szkolna 1" }] as OzipzFacility[];
  const staff = [{ fullName: "Anna Nowak", role: "Edukator" }] as OzipzStaff[];

  render(<ScheduleDialog isOpen onClose={onClose} activityTypes={activityTypes} facilities={facilities} staff={staff}
    onSave={onSave} onUpdate={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: /Forma działania/ }));
  fireEvent.click(screen.getByText("Prelekcja"));
  expect((screen.getByRole("textbox", { name: /Tytuł zadania/ }) as HTMLInputElement).value).toBe("Prelekcja");

  const location = screen.getByRole("combobox", { name: /Miejsce realizacji/ });
  fireEvent.change(location, { target: { value: "Szkoła" } });
  fireEvent.click(screen.getByRole("option", { name: /Szkoła Podstawowa nr 1/ }));
  expect((location as HTMLInputElement).value).toBe("Szkoła Podstawowa nr 1, Myślibórz");

  fireEvent.click(screen.getByRole("button", { name: /Osoba odpowiedzialna/ }));
  fireEvent.click(screen.getByText("Anna Nowak"));
  fireEvent.click(screen.getByRole("button", { name: "Dodaj zadanie" }));

  expect(await screen.findByText("Brak zapisu")).toBeDefined();
  expect(onClose).not.toHaveBeenCalled();
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ facilityId: "school-1" }));

  fireEvent.change(location, { target: { value: "Sala szkolna" } });
  fireEvent.click(screen.getByRole("button", { name: "Dodaj zadanie" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ location: "Sala szkolna", facilityId: undefined }));
});
