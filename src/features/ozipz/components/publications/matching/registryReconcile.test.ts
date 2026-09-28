import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";
import { planRegistryReconcile } from "./registryReconcile";

const action = (over: Partial<OzipzAction>): OzipzAction =>
  ({ id: "a", title: "", actionType: "Publikacja media (Strona)", date: "2026-08-05", topic: "", leadEducator: "Anna Nowak", ...over }) as OzipzAction;

describe("planRegistryReconcile", () => {
  it("attaches existing publications to their actions and proposes entries for the remaining ones", () => {
    const publications = [
      { id: "p1", title: "Jasne, białe ubrania", channel: "Portal X (@PSSEMysliborz)", publicationDate: "2026-08-15", link: "https://x.com/PSSEMysliborz/status/2088667997883732462" },
      { id: "p2", title: "Ma już działanie", channel: "facebook", publicationDate: "2026-08-01", actionId: "a-fb" },
    ] as OzipzPublication[];
    const actions = [
      action({ id: "a-x", actionType: "Publikacja media (Portal X)", title: "Jasne…", date: "2026-08-15", notes: "Link: https://x.com/PSSEMysliborz/status/2088667997883732462" }),
      action({ id: "a-fb", actionType: "Publikacja media (Facebook)", title: "Ma już działanie", date: "2026-08-01" }),
      action({ id: "a-www", title: "Publikacja media (Strona)", notes: "Kleszcze: małe, ale groźne!", programName: "Choroby odkleszczowe" }),
      action({ id: "a-prog", actionType: "Publikacja media (Facebook)", title: "Bezpieczne wakacje", programName: "Bezpieczne wakacje", notes: "Uwagi: Relacja z festiwalu https://t.co/abc" }),
      action({ id: "a-lekcja", actionType: "Prelekcja", title: "Lekcja w szkole" }),
    ];

    const plan = planRegistryReconcile(publications, actions);

    expect(plan.attach.map((a) => [a.publication.id, a.action.id])).toEqual([["p1", "a-x"]]);
    expect(plan.create.map((c) => c.action.id)).toEqual(["a-www", "a-prog"]);
    expect(plan.create[0].publication).toMatchObject({
      title: "Kleszcze: małe, ale groźne!",
      channel: "Strona www PSSE Myślibórz (gov.pl)",
      publicationDate: "2026-08-05",
      topic: "Choroby odkleszczowe",
      author: "Anna Nowak",
      actionId: "a-www",
      link: undefined,
    });
    expect(plan.create[1].publication.title).toBe("Relacja z festiwalu");
    expect(plan.create[1].publication.channel).toBe("Facebook PSSE Myślibórz");
  });

  it("returns an empty plan when everything is consistent", () => {
    expect(planRegistryReconcile([], [action({ actionType: "Prelekcja" })])).toEqual({ attach: [], create: [] });
  });
});
