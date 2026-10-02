import { beforeEach, expect, it, vi } from "vitest";
import { FallbackFacilitiesRepository } from "./repositories/fallback/fallback-facilities.repository";
import { FallbackProgramsRepository } from "./repositories/fallback/fallback-programs.repository";
import { FallbackMaterialsRepository } from "./repositories/fallback/fallback-materials.repository";
import { FallbackScheduleRepository } from "./repositories/fallback/fallback-schedule.repository";
import { FallbackJrwaRepository } from "./repositories/fallback/fallback-jrwa.repository";
import { FallbackStaffContactsRepository } from "./repositories/fallback/fallback-staff-contacts.repository";
import { FallbackDatabaseService } from "./fallback-service";

beforeEach(() => localStorage.clear());

const deletions = [
  { key: "facilities", field: "facilityId", remove: () => new FallbackFacilitiesRepository().deleteFacility("linked") },
  { key: "programs", field: "programId", remove: () => new FallbackProgramsRepository().deleteProgram("linked") },
  { key: "materials", field: "materialId", remove: () => new FallbackMaterialsRepository().deleteMaterial("linked") },
  { key: "schedules", field: "scheduleEventId", remove: () => new FallbackScheduleRepository().deleteScheduleEvent("linked") },
  { key: "jrwaCases", field: "jrwaCaseId", remove: () => new FallbackJrwaRepository().deleteJrwaCase("linked") },
];

it.each(deletions)("preserves $field on actions from closed months", async ({ key, field, remove }) => {
  const action = { id: "a", date: "2026-09-10", [field]: "linked" };
  localStorage.setItem("ozipz_actions", JSON.stringify([action]));
  localStorage.setItem(`ozipz_${key}`, JSON.stringify([{ id: "linked" }]));
  localStorage.setItem("oz.closedMonths", JSON.stringify(["2026-09"]));

  await expect(remove()).rejects.toThrow("zamkniętego miesiąca");
  expect(JSON.parse(localStorage.getItem("ozipz_actions")!)).toEqual([action]);
  expect(JSON.parse(localStorage.getItem(`ozipz_${key}`)!)).toEqual([{ id: "linked" }]);
});

it("restores earlier collections when a later browser write fails", async () => {
  const facility = { id: "linked", name: "Szkoła" };
  const action = { id: "a", date: "2026-09-10", facilityId: "linked" };
  localStorage.setItem("ozipz_facilities", JSON.stringify([facility]));
  localStorage.setItem("ozipz_actions", JSON.stringify([action]));
  const original = Storage.prototype.setItem;
  let failed = false;
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "ozipz_actions" && !failed) { failed = true; throw new Error("quota"); }
    return original.call(this, key, value);
  });
  try {
    await expect(new FallbackFacilitiesRepository().deleteFacility("linked")).rejects.toThrow("Nie udało się zapisać danych");
  } finally {
    spy.mockRestore();
  }
  expect(JSON.parse(localStorage.getItem("ozipz_facilities")!)).toEqual([facility]);
  expect(JSON.parse(localStorage.getItem("ozipz_actions")!)).toEqual([action]);
});

it("restores a contact when participation synchronization cannot be saved", async () => {
  const contact = { id: "linked", name: "Anna", phone: "111" };
  const participation = { id: "p", schoolCoordinatorContactId: "linked", schoolCoordinatorContact: "111" };
  localStorage.setItem("ozipz_contacts", JSON.stringify([contact]));
  localStorage.setItem("ozipz_participations", JSON.stringify([participation]));
  const original = Storage.prototype.setItem;
  let failed = false;
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "ozipz_participations" && !failed) { failed = true; throw new Error("quota"); }
    return original.call(this, key, value);
  });
  try {
    await expect(new FallbackStaffContactsRepository().deleteContact("linked")).rejects.toThrow("Nie udało się zapisać danych");
  } finally {
    spy.mockRestore();
  }
  expect(JSON.parse(localStorage.getItem("ozipz_contacts")!)).toEqual([contact]);
  expect(JSON.parse(localStorage.getItem("ozipz_participations")!)).toEqual([participation]);
});

it("freezes linked names when a month closes and retains them after parent renames", async () => {
  localStorage.setItem("ozipz_actions", JSON.stringify([{
    id: "a", date: "2026-09-10", facilityId: "f", facilityName: "Old school",
    municipality: "Old municipality", programId: "p", programName: "Old program",
  }]));
  localStorage.setItem("ozipz_facilities", JSON.stringify([{ id: "f", name: "School at close", municipality: "Town at close" }]));
  localStorage.setItem("ozipz_programs", JSON.stringify([{ id: "p", name: "Program at close" }]));
  const service = new FallbackDatabaseService();

  await service.setMonthClosed("2026-09", true);
  await service.updateFacility("f", { name: "Renamed school", municipality: "Renamed town" });
  await service.updateProgram("p", { name: "Renamed program" });
  expect((await service.getActions())[0]).toMatchObject({
    facilityName: "School at close", municipality: "Town at close", programName: "Program at close",
  });

  await service.setMonthClosed("2026-09", false);
  expect((await service.getActions())[0]).toMatchObject({
    facilityName: "Renamed school", municipality: "Renamed town", programName: "Renamed program",
  });
});
