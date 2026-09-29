// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";

const databases: DatabaseSync[] = [];
afterEach(() => databases.splice(0).forEach((db) => db.close()));

async function createService() {
  const raw = new DatabaseSync(":memory:");
  databases.push(raw);
  const db: ISqlDatabase = {
    async select<T>(sql: string, values: unknown[] = []) { return raw.prepare(sql.replace(/\$\d+/g, "?")).all(...values as never[]) as T; },
    async execute(sql: string, values: unknown[] = []) {
      if (values.length) return raw.prepare(sql.replace(/\$\d+/g, "?")).run(...values as never[]);
      raw.exec(sql);
      return {};
    },
  };
  await initTables(db);
  return new SqliteDatabaseService(db);
}

const baseAction = {
  title: "Stoisko", actionType: "Stoisko edukacyjno-informacyjne", date: "2026-08-29", facilityName: "Park", municipality: "Myślibórz",
  topic: "", audienceGroup: "Mieszkańcy", participantsCount: 50, indirectRecipientsCount: 0, materialsDistributedCount: 0,
  leadEducator: "Jan", ezdStatus: "w_ezd", status: "wykonane",
};

describe("powiązanie działania ze sprawą JRWA", () => {
  it("nie zostawia starej sprawy, gdy znak działania zmieniono", async () => {
    const service = await createService();
    const case39 = await service.addJrwaCase({ section: "OZiPZ", jrwaSymbol: "966.14", caseNumber: 39, year: 2026, fullCaseSign: "OZiPZ.966.14.39.2026", title: "Sprawa 39", status: "w_toku", assignedEducator: "" });
    const case41 = await service.addJrwaCase({ section: "OZiPZ", jrwaSymbol: "966.14", caseNumber: 41, year: 2026, fullCaseSign: "OZiPZ.966.14.41.2026", title: "Sprawa 41", status: "w_toku", assignedEducator: "" });
    const action = await service.addAction({ ...baseAction, jrwaSign: case39.fullCaseSign, jrwaCaseId: case39.id });

    await service.updateAction(action.id, { jrwaSign: "OZiPZ.966.14.40.2026" });
    expect((await service.getActions())[0].jrwaCaseId).toBeUndefined();

    await service.updateAction(action.id, { jrwaSign: case41.fullCaseSign, jrwaCaseId: case39.id });
    expect((await service.getActions())[0].jrwaCaseId).toBe(case41.id);

    await service.updateAction(action.id, { title: "Stoisko w parku" });
    expect((await service.getActions())[0].jrwaCaseId).toBe(case41.id);
  });
});
