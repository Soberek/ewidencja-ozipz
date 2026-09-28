import { beforeEach, expect, it } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../features/ozipz/data/migratedData";
import { FallbackDictionariesRepository } from "./repositories/fallback/fallback-dictionaries.repository";
import { FallbackJrwaRepository } from "./repositories/fallback/fallback-jrwa.repository";
import { saveToStorage } from "./repositories/fallback/storage";

beforeEach(() => {
  localStorage.clear();
  saveToStorage("jrwaCases", []);
  saveToStorage("dictionaries", []);
});

it("keeps JRWA signs and case numbers unique like SQLite", async () => {
  const repo = new FallbackJrwaRepository();
  const { id, createdAt, updatedAt, ...draft } = MIGRATED_FIREBASE_DATA.jrwaCases[0];
  const first = await repo.addJrwaCase(draft);
  await expect(repo.addJrwaCase({ ...draft, fullCaseSign: `${draft.fullCaseSign}-2` })).rejects.toThrow();
  await expect(repo.addJrwaCase({ ...draft, caseNumber: draft.caseNumber + 1 })).rejects.toThrow();

  const second = await repo.addJrwaCase({ ...draft, caseNumber: draft.caseNumber + 1, fullCaseSign: `${draft.fullCaseSign}-2` });
  await expect(repo.updateJrwaCase(second.id, { caseNumber: first.caseNumber })).rejects.toThrow();
  await expect(repo.updateJrwaCase(second.id, { fullCaseSign: first.fullCaseSign })).rejects.toThrow();
  await repo.updateJrwaCase(first.id, { id: "changed", createdAt: "changed", fullCaseSign: undefined });
  expect((await repo.getJrwaCases()).find((item) => item.id === first.id)).toMatchObject({
    createdAt: first.createdAt,
    fullCaseSign: first.fullCaseSign,
  });
});

it("keeps dictionary type and code unique like SQLite", async () => {
  const repo = new FallbackDictionariesRepository();
  const template = MIGRATED_FIREBASE_DATA.dictionaryItems.find((item) => item.dictType !== "jrwaSymbol")!;
  const { id, createdAt, updatedAt, ...draft } = template;
  const first = await repo.addDictionaryItem({ ...draft, code: "AUDIT-ONE" });
  await expect(repo.addDictionaryItem({ ...draft, code: first.code })).rejects.toThrow();
  const second = await repo.addDictionaryItem({ ...draft, code: "AUDIT-TWO" });
  await expect(repo.updateDictionaryItem(second.id, { code: first.code })).rejects.toThrow();
  await repo.updateDictionaryItem(first.id, { id: "changed", createdAt: "changed", code: undefined });
  expect((await repo.getDictionaryItems()).find((item) => item.id === first.id)).toMatchObject({
    createdAt: first.createdAt,
    code: first.code,
  });
});
