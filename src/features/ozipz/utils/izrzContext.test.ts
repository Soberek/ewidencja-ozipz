import { describe, it, expect } from "vitest";
import type { OzipzAction, OzipzDistribution, OzipzFacility, OzipzMaterial } from "../types/ozipz.types";
import { resolveIzrzContext, type IzrzSources } from "./izrzContext";

const action = (overrides: Partial<OzipzAction>): OzipzAction => ({
  id: "act",
  title: "Prelekcja (warsztat)",
  actionType: "Prelekcja (warsztat)",
  date: "2026-07-10",
  facilityName: "Szkoła Podstawowa w Ratajach",
  municipality: "Myślibórz",
  topic: "",
  audienceGroup: "Uczestnicy półkolonii - 30",
  ezdStatus: "",
  status: "",
  participantsCount: 30,
  indirectRecipientsCount: 0,
  materialsDistributedCount: 0,
  leadEducator: "Jan Kowalski",
  createdAt: "2026-07-10",
  updatedAt: "2026-07-10",
  ...overrides,
});

const distribution = (overrides: Partial<OzipzDistribution>): OzipzDistribution => ({
  id: "dist",
  materialTitle: "Ulotka",
  recipientName: "Szkoła",
  quantity: 1,
  distributionDate: "2026-07-10",
  assignedEducator: "",
  purpose: "",
  createdAt: "2026-07-10",
  ...overrides,
});

const material = (id: string, title: string): OzipzMaterial => ({
  id,
  title,
  materialType: "ulotka",
  topic: "",
  publisher: "",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const facility: OzipzFacility = {
  id: "fac-1",
  name: "Szkoła Podstawowa w Ratajach",
  type: "szkola_podstawowa",
  address: "Rataje 25",
  city: "Rataje",
  postalCode: "74-300",
  municipality: "Myślibórz",
  county: "Myśliborski",
  leadingAuthority: "Gmina Myślibórz",
  isComplex: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

function sources(partial: Partial<IzrzSources>): IzrzSources {
  return { actions: [], distributions: [], materials: [], facilities: [], ...partial };
}

describe("resolveIzrzContext", () => {
  const main = action({ id: "main", izrzSign: "87/2026" });
  const linkedDistribution = action({
    id: "dist-act",
    actionType: "Dystrybucja",
    linkedActionId: "main",
    izrzSign: "87/2026",
    participantsCount: 1,
    materialsDistributedCount: 10,
    materialId: "mat-1",
  });

  it("collects materials of the distribution saved together with the action", () => {
    const ctx = resolveIzrzContext(
      main,
      sources({ actions: [main, linkedDistribution], materials: [material("mat-1", "Bezpieczne wakacje")] })
    );
    expect(ctx.action.id).toBe("main");
    expect(ctx.relatedActions.map((a) => a.id)).toEqual(["dist-act"]);
    expect(ctx.materials).toEqual([{ title: "Bezpieczne wakacje", quantity: 10 }]);
  });

  it("switches to the main action when IZRZ is opened from the linked distribution", () => {
    const ctx = resolveIzrzContext(linkedDistribution, sources({ actions: [main, linkedDistribution] }));
    expect(ctx.action.id).toBe("main");
    expect(ctx.action.participantsCount).toBe(30);
  });

  it("describes the lesson, not the distribution, when both only share the IZRZ number", () => {
    const unlinked = { ...linkedDistribution, linkedActionId: undefined };
    const ctx = resolveIzrzContext(
      unlinked,
      sources({ actions: [unlinked, main], materials: [material("mat-1", "Bezpieczne wakacje")] })
    );
    expect(ctx.action.id).toBe("main");
    expect(ctx.relatedActions.map((a) => a.id)).toEqual(["dist-act"]);
    expect(ctx.materials).toEqual([{ title: "Bezpieczne wakacje", quantity: 10 }]);
  });

  it("keeps a standalone distribution as the subject of its own IZRZ", () => {
    const standalone = { ...linkedDistribution, linkedActionId: undefined, izrzSign: "50/2026" };
    expect(resolveIzrzContext(standalone, sources({ actions: [main, standalone] })).action.id).toBe("dist-act");
  });

  it("keeps a linked entry that has its own, different IZRZ number separate", () => {
    const separate = { ...linkedDistribution, izrzSign: "99/2026" };
    const ctx = resolveIzrzContext(separate, sources({ actions: [main, separate] }));
    expect(ctx.action.id).toBe("dist-act");
    expect(resolveIzrzContext(main, sources({ actions: [main, separate] })).relatedActions).toEqual([]);
  });

  it("prefers distribution register rows and sums the same material", () => {
    const withRows = { ...main, materialsDistributedCount: 99, materialId: "mat-1" };
    const ctx = resolveIzrzContext(
      withRows,
      sources({
        actions: [withRows],
        distributions: [
          distribution({ id: "d1", actionId: "main", materialTitle: "6 kroków do czystych rąk", quantity: 40 }),
          distribution({ id: "d2", actionId: "main", materialTitle: "Aby zdrowy uśmiech mieć", quantity: 60 }),
          distribution({ id: "d3", actionId: "main", materialTitle: "6 kroków do czystych rąk", quantity: 5 }),
          distribution({ id: "d4", actionId: "other", materialTitle: "Obca", quantity: 7 }),
        ],
      })
    );
    expect(ctx.materials).toEqual([
      { title: "6 kroków do czystych rąk", quantity: 45 },
      { title: "Aby zdrowy uśmiech mieć", quantity: 60 },
    ]);
  });

  it("finds the facility by id or by name", () => {
    expect(resolveIzrzContext(action({ facilityId: "fac-1" }), sources({ facilities: [facility] })).facility?.id).toBe(
      "fac-1"
    );
    expect(resolveIzrzContext(action({}), sources({ facilities: [facility] })).facility?.id).toBe("fac-1");
    expect(resolveIzrzContext(action({ facilityName: "Inna" }), sources({ facilities: [facility] })).facility).toBeNull();
  });
});
