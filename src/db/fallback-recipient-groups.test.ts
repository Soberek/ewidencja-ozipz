import { beforeEach, expect, it } from "vitest";
import { FallbackDictionariesRepository } from "./repositories/fallback/fallback-dictionaries.repository";

beforeEach(() => localStorage.clear());

const group = { dictType: "recipientGroup", code: "uczniowie", label: "Uczniowie", isSystem: false };

it("w magazynie przeglądarki grupa odbiorców użyta w działaniu ma zablokowaną nazwę, kod i usunięcie", async () => {
  const repo = new FallbackDictionariesRepository();
  const created = await repo.addDictionaryItem(group);
  const free = await repo.addDictionaryItem({ ...group, code: "seniorzy", label: "Seniorzy" });
  localStorage.setItem("ozipz_actions", JSON.stringify([{ id: "a", date: "2026-09-10", recipientGroupIds: [created.id] }]));

  await expect(repo.updateDictionaryItem(created.id, { label: "Uczniowie szkół" })).rejects.toThrow(/nie można zmienić/);
  await expect(repo.updateDictionaryItem(created.id, { code: "inny" })).rejects.toThrow(/nie można zmienić/);
  await expect(repo.deleteDictionaryItem(created.id)).rejects.toThrow(/nie można jej usunąć/);
  await repo.updateDictionaryItem(created.id, { description: "Nowy opis" });
  expect((await repo.getDictionaryItems()).find((d) => d.id === created.id)?.description).toBe("Nowy opis");

  await repo.updateDictionaryItem(free.id, { label: "Seniorzy 60+" });
  await repo.deleteDictionaryItem(free.id);
  expect((await repo.getDictionaryItems()).map((d) => d.id)).toEqual([created.id]);
});

it("w magazynie przeglądarki odrzuca duplikat nazwy grupy odbiorców", async () => {
  const repo = new FallbackDictionariesRepository();
  await repo.addDictionaryItem(group);
  await expect(repo.addDictionaryItem({ ...group, code: "uczniowie_2", label: " UCZNIOWIE " })).rejects.toThrow(/już istnieje/);
  // Ta sama nazwa w innym słowniku nie jest kolizją.
  await repo.addDictionaryItem({ dictType: "campaign", code: "uczniowie", label: "Uczniowie", isSystem: false });
});
