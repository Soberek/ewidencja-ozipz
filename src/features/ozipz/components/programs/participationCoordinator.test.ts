import { describe, expect, it } from "vitest";
import type { OzipzContact, OzipzFacility } from "../../types/ozipz.types";
import {
  buildCoordinatorOptions,
  DEFAULT_COORDINATOR_POSITION,
  facilityCardCoordinator,
  isContactOfFacility,
  isContactWithoutFacility,
  matchCoordinatorContact,
  pickCoordinatorPosition,
  splitContactLine,
  suggestCoordinator,
} from "./participationCoordinator";

const facility = { id: "f1", name: "Szkoła Podstawowa nr 1 w Dębnie" } as OzipzFacility;
const otherFacility = { id: "f2", name: "Przedszkole w Karsku" } as OzipzFacility;

const make = (overrides: Partial<OzipzContact>): OzipzContact => ({
  id: "c1", name: "Anna Nowak", position: "Pedagog Szkolny", facilityName: "", phone: "", email: "",
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
  ...overrides,
});

describe("wybór szkolnego koordynatora programu", () => {
  it("rozpoznaje kontakty placówki po powiązaniu albo nazwie placówki", () => {
    expect(isContactOfFacility(make({ facilityId: "f1" }), facility)).toBe(true);
    expect(isContactOfFacility(make({ facilityName: "szkoła podstawowa NR 1 w Dębnie " }), facility)).toBe(true);
    expect(isContactOfFacility(make({ facilityId: "f2", facilityName: facility.name }), facility)).toBe(false);
    expect(isContactOfFacility(make({ facilityId: "f1" }), null)).toBe(false);
  });

  it("uznaje kontakt z ogólnym opisem placówki za nieprzypisany", () => {
    const all = [facility, otherFacility];
    expect(isContactWithoutFacility(make({ facilityName: "Placówka oświatowa powiatu myśliborskiego" }), all)).toBe(true);
    expect(isContactWithoutFacility(make({ facilityName: "" }), all)).toBe(true);
    expect(isContactWithoutFacility(make({ facilityId: "usunieta" }), all)).toBe(true);
    expect(isContactWithoutFacility(make({ facilityId: "f2" }), all)).toBe(false);
    expect(isContactWithoutFacility(make({ facilityName: "Przedszkole w Karsku" }), all)).toBe(false);
  });

  it("układa listę: najpierw kontakty placówki, koordynatorzy przed innymi osobami", () => {
    const options = buildCoordinatorOptions([
      make({ id: "a", name: "Zofia Obca", facilityId: "f2", facilityName: "Przedszkole w Karsku", position: "Szkolny Koordynator" }),
      make({ id: "b", name: "Bartosz Własny", facilityId: "f1" }),
      make({ id: "c", name: "Zenon Własny", facilityId: "f1", position: "Szkolny Koordynator Programu" }),
    ], facility);

    expect(options.map((o) => o.value)).toEqual(["c", "b", "a"]);
    expect(options[0]).toMatchObject({ group: "Kontakty placówki (2)", badge: "Koordynator" });
    expect(options[2].group).toBe("Pozostałe kontakty ze spisu");
    expect(options[2].description).toContain("Przedszkole w Karsku");
  });

  it("dopasowuje wpisane nazwisko tylko przy jednoznacznym wyniku", () => {
    const own = make({ id: "own", facilityId: "f1" });
    const foreign = make({ id: "foreign", facilityId: "f2" });
    expect(matchCoordinatorContact("mgr Anna Nowak", [own], facility)?.id).toBe("own");
    expect(matchCoordinatorContact("Anna Nowak", [own, foreign], facility)?.id).toBe("own");
    expect(matchCoordinatorContact("Anna Nowak", [foreign, make({ id: "x", facilityId: "f2" })], facility)).toBeUndefined();
    expect(matchCoordinatorContact("Ann", [own], facility)).toBeUndefined();
  });

  it("podpowiada koordynatora z karty placówki albo jedynego koordynatora placówki", () => {
    const coordinator = make({ id: "k", name: "Ewa Mazur", facilityId: "f1", position: "Szkolny Koordynator Programu" });
    expect(suggestCoordinator([coordinator], facility)?.id).toBe("k");
    expect(suggestCoordinator([coordinator, { ...coordinator, id: "k2", name: "Olga Kos" }], facility)).toBeUndefined();

    const fromCard = { ...facility, defaultCoordinatorName: "Olga Kos" };
    expect(suggestCoordinator([coordinator, { ...coordinator, id: "k2", name: "Olga Kos" }], fromCard)?.id).toBe("k2");
    expect(suggestCoordinator([coordinator], null)).toBeUndefined();
  });

  it("proponuje dopisanie koordynatora z karty placówki, którego brak w spisie", () => {
    const card = { ...facility, defaultCoordinatorName: " Jan Kowal ", defaultCoordinatorPhone: "600 000 000" };
    expect(facilityCardCoordinator(card, [])).toEqual({ name: "Jan Kowal", phone: "600 000 000", email: "" });
    expect(facilityCardCoordinator(card, [make({ name: "Jan Kowal" })])).toBeNull();
    expect(facilityCardCoordinator(facility, [])).toBeNull();
  });

  it("rozdziela zapisany kontakt na telefon i e-mail", () => {
    expect(splitContactLine("600 000 000 / a.nowak@szkola.pl")).toEqual({ phone: "600 000 000", email: "a.nowak@szkola.pl" });
    expect(splitContactLine("a.nowak@szkola.pl")).toEqual({ phone: "", email: "a.nowak@szkola.pl" });
    expect(splitContactLine("95 747 22 33 a.nowak@szkola.pl")).toEqual({ phone: "95 747 22 33", email: "a.nowak@szkola.pl" });
    expect(splitContactLine("")).toEqual({ phone: "", email: "" });
  });

  it("wybiera stanowisko koordynatora ze słownika", () => {
    expect(pickCoordinatorPosition(["Dyrektor", "Szkolny Koordynator Programów Edukacyjnych"])).toBe("Szkolny Koordynator Programów Edukacyjnych");
    expect(pickCoordinatorPosition(["Dyrektor"])).toBe(DEFAULT_COORDINATOR_POSITION);
  });
});
