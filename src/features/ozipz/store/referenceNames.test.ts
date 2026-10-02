import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OzipzDbService } from "../../../db/client";
import { useOzipzDbStore } from "./useOzipzDbStore";
import { seedFallbackStorage } from "../../../test/fixtures/seedFallbackStorage";

beforeEach(async () => { localStorage.clear(); seedFallbackStorage(); await useOzipzDbStore.getState().loadAll(); });
afterEach(() => vi.restoreAllMocks());
it("uses current catalog names when loading a stored school participation", async () => {
  const store = useOzipzDbStore.getState();
  const facility = store.facilities[0];
  const program = store.programs[0];
  const participation = {
    ...store.participations[0],
    id: "stale-participation",
    facilityId: facility.id,
    facilityName: "Stara nazwa placówki",
    municipality: "Stara gmina",
    programId: program.id,
    programName: "Stara nazwa programu",
  };
  vi.spyOn(OzipzDbService, "getParticipations").mockResolvedValueOnce([participation]);

  await store.loadAll();

  expect(useOzipzDbStore.getState().participations[0]).toMatchObject({
    facilityName: facility.name,
    municipality: facility.municipality,
    programName: program.name,
  });
});

it("shows renamed facility and program immediately and after reloading stored records", async () => {
  const store = useOzipzDbStore.getState();
  const facility = store.facilities[0]; const program = store.programs[0];
  const action = await store.addAction({
    title: "Test nazw", actionType: "Prelekcja", date: "2026-09-09", facilityId: facility.id,
    facilityName: facility.name, municipality: facility.municipality, programId: program.id, programName: program.name,
    topic: "", audienceGroup: "Uczniowie", participantsCount: 10, leadEducator: "Test",
    ezdStatus: "", status: "wykonane", materialsDistributedCount: 0,
  });
  await store.updateFacility(facility.id, { name: "Nowa nazwa placówki", municipality: "Nowa gmina" });
  await store.updateProgram(program.id, { name: "Nowa nazwa programu" });
  const expected = { facilityName: "Nowa nazwa placówki", municipality: "Nowa gmina", programName: "Nowa nazwa programu" };
  expect(useOzipzDbStore.getState().actions.find((row) => row.id === action.id)).toMatchObject(expected);
  await store.loadAll();
  expect(useOzipzDbStore.getState().actions.find((row) => row.id === action.id)).toMatchObject(expected);
});

it("propagates a facility rename performed by an import", async () => {
  const store = useOzipzDbStore.getState();
  const facility = store.facilities[0];
  const contact = await store.addContact({ facilityId: facility.id, facilityName: facility.name, municipality: facility.municipality, name: "Test", position: "Koordynator", phone: "", email: "" });
  await store.batchUpsertFacilities([{ ...facility, name: "Nazwa po imporcie" }]);
  expect(useOzipzDbStore.getState().contacts.find((row) => row.id === contact.id)?.facilityName).toBe("Nazwa po imporcie");
  await store.loadAll();
  expect(useOzipzDbStore.getState().contacts.find((row) => row.id === contact.id)?.facilityName).toBe("Nazwa po imporcie");
});
