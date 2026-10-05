import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzSchoolParticipation } from "../types/ozipz.types";
import { buildLectureIndex, participationLectures, participationLectureStatus } from "./participationLectures";

const action = (overrides: Partial<OzipzAction>) => ({
  id: "a", title: "Prelekcja w SP 1", actionType: "Prelekcja (warsztat)", date: "2026-10-05",
  programId: "prog", facilityId: "sp1", facilityName: "SP 1", municipality: "Myślibórz", status: "wykonane",
  ...overrides,
}) as OzipzAction;

const entry = {
  programId: "prog", facilityId: "sp1", facilityName: "SP 1", municipality: "Myślibórz", schoolYear: "2026/2027",
} satisfies Partial<OzipzSchoolParticipation>;

describe("prelekcje zgłoszeń szkół", () => {
  it("bierze z rejestru prelekcje i wykłady programu w placówce w roku szkolnym zgłoszenia", () => {
    const index = buildLectureIndex([
      action({ id: "in", date: "2027-03-10" }),
      action({ id: "lecture", actionType: "Wykład", date: "2026-09-01" }),
      action({ id: "legacy", actionType: "prelekcja", facilityId: undefined, facilityName: " sp  1 ", date: "2027-08-31" }),
      action({ id: "prev-year", date: "2026-08-31" }),
      action({ id: "other-program", programId: "other" }),
      action({ id: "other-school", facilityId: "sp2", facilityName: "SP 2" }),
      action({ id: "distribution", actionType: "Dystrybucja" }),
      action({ id: "cancelled", status: "odwolane" }),
      action({ id: "postponed", status: "odroczone" }),
    ]);
    expect(participationLectures(entry, index).map((a) => a.id)).toEqual(["lecture", "in", "legacy"]);
  });

  it("uznaje prelekcję oznaczoną ręcznie, gdy nie ma jej w rejestrze", () => {
    const empty = buildLectureIndex([]);
    expect(participationLectureStatus({ ...entry, lectureDone: true }, empty)).toEqual({ done: true, fromRegister: [], manualOnly: true });
    expect(participationLectureStatus({ ...entry, lectureDone: false }, empty).done).toBe(false);

    const withRegister = participationLectureStatus({ ...entry, lectureDone: true }, buildLectureIndex([action({})]));
    expect(withRegister).toMatchObject({ done: true, manualOnly: false });
    expect(withRegister.fromRegister).toHaveLength(1);
  });

  it("bez poprawnego roku szkolnego nie dopasowuje prelekcji", () => {
    expect(participationLectures({ ...entry, schoolYear: "2026" }, buildLectureIndex([action({})]))).toEqual([]);
  });
});
