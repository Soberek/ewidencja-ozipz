import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { IOzipzDatabaseService, ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import { FallbackDatabaseService } from "./fallback-service";
import type { OzipzAction } from "../features/ozipz/types/ozipz.types";
import { buildLinkedDistribution } from "../features/ozipz/utils/linkedDistribution";

function createInMemorySqlite(): ISqlDatabase {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  return {
    async select<T>(sql: string, values: unknown[] = []) {
      return raw.prepare(sql.replace(/\$\d+/g, "?")).all(...values as never[]) as T;
    },
    async execute(sql: string, values: unknown[] = []) {
      if (!values.length) { raw.exec(sql); return { rowsAffected: 0 }; }
      const result = raw.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
      return { rowsAffected: Number(result.changes) };
    },
  };
}

const lecture: Omit<OzipzAction, "id" | "createdAt" | "updatedAt"> = {
  title: "Zdrowe odżywianie",
  actionType: "Prelekcja",
  date: "2026-09-10",
  facilityName: "SP 1",
  municipality: "Myślibórz",
  topic: "",
  audienceGroup: "Uczniowie kl. 4 (25)",
  participantsCount: 25,
  materialsDistributedCount: 0,
  numberOfActions: 1,
  leadEducator: "Jan",
  ezdStatus: "do_ezd",
  status: "wykonane",
};

const backends: Array<[string, () => Promise<IOzipzDatabaseService>]> = [
  ["SQLite", async () => {
    const db = createInMemorySqlite();
    await initTables(db);
    return new SqliteDatabaseService(db);
  }],
  ["localStorage", async () => new FallbackDatabaseService()],
];

describe.each(backends)("działanie zapisane razem z dystrybucją (%s)", (_name, create) => {
  let service: IOzipzDatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    service = await create();
  });

  async function distributionsOf(...actionIds: string[]) {
    return (await service.getDistributions()).filter((d) => d.actionId && actionIds.includes(d.actionId));
  }

  async function saveLectureWithDistribution() {
    const material = await service.addMaterial({ title: "Ulotka", materialType: "ulotka", topic: "", publisher: "GIS" });
    const res = await service.saveActionWithRelations({
      action: lecture,
      distributionMaterials: [{ materialId: material.id, title: material.title, type: material.materialType, quantity: 25 }],
      companionDistribution: buildLinkedDistribution(lecture, {
        actionType: "Dystrybucja", materialId: material.id, materialsCount: 25,
      }),
    });
    return { res, material };
  }

  it("tworzy dwa wpisy, a rozdzielnik przypina do dystrybucji", async () => {
    const { res } = await saveLectureWithDistribution();

    expect(res.companionAction).toMatchObject({
      actionType: "Dystrybucja",
      linkedActionId: res.action.id,
      numberOfActions: 1,
      participantsCount: 1,
      audienceGroup: "Uczniowie kl. 4 - 1",
      materialsDistributedCount: 25,
      ezdStatus: "nie_dotyczy",
    });
    const actions = await service.getActions();
    expect(actions.find((a) => a.id === res.action.id)).toMatchObject({ materialsDistributedCount: 0 });
    expect(actions.find((a) => a.id === res.companionAction!.id)?.linkedActionId).toBe(res.action.id);

    const distributions = await distributionsOf(res.action.id, res.companionAction!.id);
    expect(distributions).toHaveLength(1);
    expect(distributions[0]).toMatchObject({ actionId: res.companionAction!.id, quantity: 25 });
  });

  it("po edycji działania przepisuje datę, miejsce i tytuł na powiązaną dystrybucję", async () => {
    const { res } = await saveLectureWithDistribution();

    await service.updateActionWithRelations(res.action.id, {
      ...lecture,
      title: "Zdrowe odżywianie – klasy 4",
      date: "2026-09-11",
      facilityName: "SP 2",
      audienceGroup: "Uczniowie kl. 4 (28)",
    }, []);

    const companion = (await service.getActions()).find((a) => a.id === res.companionAction!.id)!;
    expect(companion).toMatchObject({
      title: "Dystrybucja materiałów – Zdrowe odżywianie – klasy 4",
      date: "2026-09-11",
      facilityName: "SP 2",
      audienceGroup: "Uczniowie kl. 4 - 1",
      participantsCount: 1,
      linkedActionId: res.action.id,
    });
    const [distribution] = await distributionsOf(companion.id);
    expect(distribution).toMatchObject({ actionId: companion.id, distributionDate: "2026-09-11", recipientName: "SP 2" });
  });

  it("nie nadpisuje tytułu dystrybucji zmienionego ręcznie", async () => {
    const { res } = await saveLectureWithDistribution();
    await service.updateAction(res.companionAction!.id, { title: "Ulotki dla rodziców" });

    await service.updateActionWithRelations(res.action.id, { ...lecture, title: "Nowy tytuł" }, []);

    const companion = (await service.getActions()).find((a) => a.id === res.companionAction!.id)!;
    expect(companion.title).toBe("Ulotki dla rodziców");
  });

  it("przy edycji dodaje dystrybucję do zapisanego działania i przenosi do niej materiały", async () => {
    const material = await service.addMaterial({ title: "Broszura", materialType: "broszura", topic: "", publisher: "GIS" });
    const items = [{ materialId: material.id, title: material.title, type: material.materialType, quantity: 40 }];
    // Stary wpis: materiały przypięte bezpośrednio do działania.
    const { action } = await service.saveActionWithRelations({
      action: { ...lecture, materialId: material.id, materialsDistributedCount: 40 },
      distributionMaterials: items,
    });
    expect(await distributionsOf(action.id)).toHaveLength(1);

    const updated = { ...lecture, title: "Stoisko na festynie", actionType: "Stoisko edukacyjno-informacyjne" };
    await service.updateActionWithRelations(
      action.id,
      { ...updated, materialId: undefined, materialsDistributedCount: 0 },
      items,
      buildLinkedDistribution(updated, { actionType: "Dystrybucja", materialId: material.id, materialsCount: 40 })
    );

    const actions = await service.getActions();
    const main = actions.find((a) => a.id === action.id)!;
    const companion = actions.find((a) => a.linkedActionId === action.id)!;
    expect(main).toMatchObject({ title: "Stoisko na festynie", materialsDistributedCount: 0 });
    expect(main.materialId).toBeUndefined();
    expect(companion).toMatchObject({
      title: "Dystrybucja materiałów – Stoisko na festynie",
      actionType: "Dystrybucja",
      participantsCount: 1,
      numberOfActions: 1,
      materialsDistributedCount: 40,
    });
    expect(await distributionsOf(action.id)).toHaveLength(0);
    expect(await distributionsOf(companion.id)).toEqual([expect.objectContaining({ quantity: 40, actionTitle: companion.title })]);

    await expect(service.updateActionWithRelations(
      action.id, updated, items,
      buildLinkedDistribution(updated, { actionType: "Dystrybucja", materialsCount: 40 })
    )).rejects.toThrow(/ma już powiązaną dystrybucję/);
    expect((await service.getActions()).filter((a) => a.linkedActionId === action.id)).toHaveLength(1);
  });

  it("po usunięciu działania dystrybucja zostaje jako samodzielny wpis", async () => {
    const { res } = await saveLectureWithDistribution();

    await service.deleteAction(res.action.id);

    const actions = await service.getActions();
    expect(actions.some((a) => a.id === res.action.id)).toBe(false);
    const companion = actions.find((a) => a.id === res.companionAction!.id);
    expect(companion).toBeDefined();
    expect(companion?.linkedActionId).toBeUndefined();
    expect(await distributionsOf(res.companionAction!.id)).toHaveLength(1);
  });
});

describe("odbiorcy dystrybucji zapisanej razem z działaniem", () => {
  it("ta sama grupa odbiorców, ale łącznie 1 odbiorca – edycja dystrybucji nie przepisze uczestników działania", async () => {
    const { linkedDistributionAudience } = await import("../features/ozipz/utils/linkedDistribution");
    const { calculateTotalParticipants, parseAudienceGroups } = await import("../features/ozipz/components/actions/editor/audienceUtils");
    const audience = linkedDistributionAudience("Dzieci przedszkolne (3-6 lat) - 300");
    expect(audience).toBe("Dzieci przedszkolne (3-6 lat) - 1");
    expect(calculateTotalParticipants(parseAudienceGroups(audience))).toBe(1);

    const companion = buildLinkedDistribution(lecture, { actionType: "Dystrybucja", materialsCount: 40 });
    expect(companion.participantsCount).toBe(1);
    expect(calculateTotalParticipants(parseAudienceGroups(companion.audienceGroup))).toBe(1);
  });

  it("zmiana grupy odbiorców w działaniu przechodzi na dystrybucję z 1 odbiorcą", async () => {
    const { linkedDistributionUpdates } = await import("../features/ozipz/utils/linkedDistribution");
    const previous = { ...lecture, id: "a", createdAt: "", updatedAt: "" } as OzipzAction;
    const distribution = { ...buildLinkedDistribution(lecture, { actionType: "Dystrybucja", materialsCount: 40 }), id: "d", linkedActionId: "a", createdAt: "", updatedAt: "" } as OzipzAction;
    const updates = linkedDistributionUpdates(previous, { ...previous, audienceGroup: "Uczniowie kl. 5 - 30", participantsCount: 30 }, distribution);
    expect(updates).toEqual({ audienceGroup: "Uczniowie kl. 5 - 1" });
  });
});
