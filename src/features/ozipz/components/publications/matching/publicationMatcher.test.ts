import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";
import {
  buildPublicationRegistry,
  channelFamilyOf,
  findPublicationMatch,
  linkKey,
  matchPublicationCandidates,
  normalizeText,
  type MatchCandidate,
} from "./publicationMatcher";

const action = (over: Partial<OzipzAction>): OzipzAction =>
  ({
    id: "a",
    title: "",
    actionType: "Publikacja media (Strona)",
    date: "2026-08-05",
    facilityName: "PSSE",
    municipality: "Myślibórz",
    topic: "",
    audienceGroup: "Internauci",
    leadEducator: "OZiPZ",
    participantsCount: 0,
    materialsDistributedCount: 0,
    numberOfActions: 1,
    createdAt: "",
    updatedAt: "",
    ...over,
  }) as OzipzAction;

const publication = (over: Partial<OzipzPublication>): OzipzPublication =>
  ({ id: "p", title: "", channel: "", publicationDate: "2026-08-15", topic: "", author: "", createdAt: "", updatedAt: "", ...over }) as OzipzPublication;

const gov = (title: string, date: string, slug = "artykul"): MatchCandidate => ({
  urls: [`https://www.gov.pl/web/psse-mysliborz/${slug}`],
  title,
  date,
  channel: "gov",
});

describe("publicationMatcher – rozpoznawanie publikacji już obecnych w systemie", () => {
  it("normalizes links: gov.pl with/without www and trailing slash, X/twitter status IDs", () => {
    expect(linkKey("https://www.gov.pl/web/psse-mysliborz/Kleszcze/")).toBe("gov.pl/web/psse-mysliborz/kleszcze");
    expect(linkKey("https://gov.pl/web/psse-mysliborz/kleszcze?utm=1#x")).toBe("gov.pl/web/psse-mysliborz/kleszcze");
    expect(linkKey("https://twitter.com/PSSEMysliborz/status/2088667997883732462?s=20")).toBe("x:2088667997883732462");
    expect(linkKey("https://x.com/i/status/2088667997883732462")).toBe("x:2088667997883732462");
    expect(linkKey("")).toBeNull();
  });

  it("normalizes Polish text for comparison", () => {
    expect(normalizeText("Kleszcze: małe, ale GROŹNE! https://t.co/x")).toBe("kleszcze male ale grozne");
    expect(channelFamilyOf("Strona www PSSE Myślibórz (gov.pl)")).toBe("gov");
    expect(channelFamilyOf("Portal X (@PSSEMysliborz)")).toBe("x");
    expect(channelFamilyOf("facebook")).toBe("fb");
  });

  it("finds a publication record by exact link (linked)", () => {
    const registry = buildPublicationRegistry(
      [publication({ id: "p1", title: "Jasne, białe ubrania", channel: "Portal X (@PSSEMysliborz)", link: "https://x.com/PSSEMysliborz/status/2088667997883732462" })],
      []
    );
    const match = findPublicationMatch({ urls: ["https://twitter.com/PSSEMysliborz/status/2088667997883732462"], title: "Inny tytuł", date: "2026-08-15", channel: "x" }, registry);
    expect(match?.level).toBe("linked");
    expect(match?.entry.publicationId).toBe("p1");
  });

  it("finds a link stored only in the action notes", () => {
    const registry = buildPublicationRegistry([], [
      action({ id: "a1", actionType: "Publikacja media (Portal X)", notes: "Automatycznie utworzone działanie. Link: https://x.com/PSSEMysliborz/status/2087598747869946059" }),
    ]);
    expect(findPublicationMatch({ urls: ["https://x.com/PSSEMysliborz/status/2087598747869946059"], title: "x", date: "2026-08-12", channel: "x" }, registry)?.level).toBe("linked");
  });

  it("recognizes historical actions without links by title and date (title in title or in notes)", () => {
    const registry = buildPublicationRegistry([], [
      action({ id: "a1", title: "Publikacja media (Strona)", notes: "Kleszcze: małe, ale groźne!", date: "2026-08-05" }),
      action({ id: "a2", title: "Konkurs quiz - Światowy Dzień bez Tytoniu", date: "2026-05-27" }),
      action({ id: "a3", title: "Katalog szczepień", date: "2026-01-19" }),
    ]);
    const kleszcze = findPublicationMatch(gov("Kleszcze: małe, ale groźne!", "2026-08-05"), registry);
    expect(kleszcze?.level).toBe("probable");
    expect(kleszcze?.entry.id).toBe("a1");
    expect(kleszcze?.reason).toContain("Identyczny tytuł");

    expect(findPublicationMatch(gov("Konkurs Quiz - Światowy Dzień Bez Tytoniu 2026", "2026-05-27"), registry)?.entry.id).toBe("a2");
    expect(findPublicationMatch(gov("Katalog szczepień dostępnych w aptekach poszerzony", "2026-01-19"), registry)?.level).toBe("probable");
  });

  it("does not match a similar title published months later (e.g. contest results vs announcement)", () => {
    const registry = buildPublicationRegistry([], [action({ id: "a1", title: "Konkurs fotograficzny „Bezpieczne Wakacje 2026”", date: "2026-07-16" })]);
    expect(findPublicationMatch(gov("Rozstrzygnięcie konkursu fotograficznego „Bezpieczne Wakacje 2026”", "2026-09-23"), registry)).toBeNull();
  });

  it("does not match across channels (an X post is not the gov.pl article)", () => {
    const registry = buildPublicationRegistry([], [action({ id: "a1", actionType: "Publikacja media (Portal X)", title: "Szczepienia chronią nas wszystkich", date: "2026-05-11" })]);
    expect(findPublicationMatch(gov("Szczepienia chronią nas wszystkich", "2026-05-11"), registry)).toBeNull();
  });

  it("matches a short action title contained in a long X post from the same day", () => {
    const registry = buildPublicationRegistry([], [action({ id: "a1", actionType: "Publikacja media (Portal X)", title: "Higiena rąk - Dlaczego warto myć?", date: "2026-05-14" })]);
    const match = findPublicationMatch(
      { urls: ["https://x.com/PSSEMysliborz/status/1"], title: "Myjesz ręce?", text: "Higiena rąk – dlaczego warto myć ręce po powrocie do domu? Sprawdź nasze wskazówki! #higiena", date: "2026-05-14", channel: "x" },
      registry
    );
    expect(match?.level).toBe("probable");
  });

  it("assigns one existing record to only one downloaded item", () => {
    const registry = buildPublicationRegistry([], [action({ id: "a1", title: "Konkurs - Zimowa migawka", date: "2026-01-26" })]);
    const [photo, other] = matchPublicationCandidates(
      [gov("Konkurs fotograficzny „Zimowa Migawka”", "2026-01-26", "a"), gov("Konkurs - Moje podstawy bezpiecznej zimowej zabawy", "2026-01-26", "b")],
      registry
    );
    expect(photo?.entry.id).toBe("a1");
    expect(other).toBeNull();
  });

  it("treats a publication and its action as one record and prefers the publication", () => {
    const registry = buildPublicationRegistry(
      [publication({ id: "p1", title: "Serwis Kąpieliskowy", channel: "Strona www PSSE Myślibórz (gov.pl)", publicationDate: "2026-07-02", actionId: "a1" })],
      [action({ id: "a1", title: "Serwis Kąpieliskowy", date: "2026-07-02" })]
    );
    const match = findPublicationMatch(gov("Serwis Kąpieliskowy", "2026-07-02"), registry);
    expect(match?.entry.kind).toBe("publication");
    expect(match?.entry.actionId).toBe("a1");
  });
});
