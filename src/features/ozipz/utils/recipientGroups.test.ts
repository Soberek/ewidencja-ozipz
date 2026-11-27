import { describe, expect, it } from "vitest";
import type { OzipzDictionaryItem } from "../types/ozipz.types";
import type { AudienceGroupBlock } from "../components/actions/editor/editor.types";
import {
  audienceRecipientGroupIds,
  changesRecipientGroupIdentity,
  duplicatedAudienceNames,
  findRecipientGroup,
  findSimilarRecipientGroups,
  linkAudienceGroups,
  recipientGroupConflict,
  recipientGroupIdsFromAudienceText,
  uniqueRecipientGroupCode,
  unlinkedAudienceNames,
} from "./recipientGroups";
import { getMissingActionFields } from "../components/actions/editor/actionEditorSubmitUtils";
import { recipientGroupLockCount } from "./dictionaryUsage";

const item = (id: string, label: string, code = id): OzipzDictionaryItem => ({
  id, dictType: "recipientGroup", code, label, isSystem: false, createdAt: "2026-01-01", updatedAt: "2026-01-01",
});
const dictionary = [item("u", "Uczniowie"), item("o", "Opiekunowie", "opiekunowie_kod"), item("n", "Nauczyciele")];
const block = (...names: string[]): AudienceGroupBlock[] => [{
  id: "g", name: "Grupa 1", items: names.map((name, i) => ({ id: `i${i}`, name, count: 1 })),
}];

describe("grupy odbiorców – dopasowanie do słownika", () => {
  it("znajduje pozycję po nazwie lub kodzie, bez wielkości liter i zbędnych spacji", () => {
    expect(findRecipientGroup(dictionary, "  uczniowie ")?.id).toBe("u");
    expect(findRecipientGroup(dictionary, "OPIEKUNOWIE_KOD")?.id).toBe("o");
    expect(findRecipientGroup(dictionary, "Dyrektorzy")).toBeUndefined();
    expect(findRecipientGroup(dictionary, "")).toBeUndefined();
  });

  it("łączy odbiorców ze słownikiem i zostawia wartości spoza słownika bez powiązania", () => {
    const linked = linkAudienceGroups(block("uczniowie", "Dyrektor", "Opiekunowie"), dictionary);
    expect(linked[0].items.map((i) => [i.name, i.recipientGroupId])).toEqual([
      ["Uczniowie", "u"], ["Dyrektor", undefined], ["Opiekunowie", "o"],
    ]);
    expect(audienceRecipientGroupIds(linked)).toEqual(["u", "o"]);
    expect(unlinkedAudienceNames(linked)).toEqual(["Dyrektor"]);
  });

  it("wykrywa tę samą kategorię dwa razy w jednej grupie, ale nie w różnych grupach", () => {
    expect(duplicatedAudienceNames(linkAudienceGroups(block("Uczniowie", "uczniowie"), dictionary))).toEqual(["Uczniowie"]);
    const twoGroups: AudienceGroupBlock[] = [
      ...linkAudienceGroups(block("Uczniowie"), dictionary),
      { ...linkAudienceGroups(block("Uczniowie"), dictionary)[0], id: "g2" },
    ];
    expect(duplicatedAudienceNames(twoGroups)).toEqual([]);
  });

  it("wyznacza powiązania ze starego opisu tylko po dokładnej zgodności", () => {
    expect(recipientGroupIdsFromAudienceText("Uczniowie - 25, Opiekunowie - 3", dictionary)).toEqual(["u", "o"]);
    expect(recipientGroupIdsFromAudienceText("Grupa A: uczniowie (13-14 lat) - 20; Grupa B: Nauczyciele - 2", dictionary)).toEqual(["u", "n"]);
    expect(recipientGroupIdsFromAudienceText("Uczniowie szkół - 25", dictionary)).toEqual([]);
    expect(recipientGroupIdsFromAudienceText("", dictionary)).toEqual([]);
  });

  it("ostrzega o podobnych nazwach, ale nie o identycznej ani o zupełnie innych", () => {
    expect(findSimilarRecipientGroups(dictionary, "Uczniowie szkół podstawowych").map((g) => g.id)).toEqual(["u"]);
    expect(findSimilarRecipientGroups(dictionary, "Nauczyciel").map((g) => g.id)).toEqual(["n"]);
    expect(findSimilarRecipientGroups(dictionary, "Uczniowie")).toEqual([]);
    expect(findSimilarRecipientGroups(dictionary, "Seniorzy")).toEqual([]);
  });

  it("tworzy unikalny kod z nazwy", () => {
    expect(uniqueRecipientGroupCode("Seniorzy (UTW, Kluby)", [])).toBe("seniorzy_utw_kluby");
    expect(uniqueRecipientGroupCode("Łódzcy uczniowie", [])).toBe("lodzcy_uczniowie");
    expect(uniqueRecipientGroupCode("Uczniowie", ["uczniowie", "uczniowie_2"])).toBe("uczniowie_3");
    expect(uniqueRecipientGroupCode("???", [])).toBe("grupa");
    expect(uniqueRecipientGroupCode("a".repeat(60), ["a".repeat(30)])).toHaveLength(30);
  });

  it("zgłasza kolizję nazwy lub kodu z inną pozycją, ale nie z samą sobą", () => {
    expect(recipientGroupConflict(dictionary, { label: " uczniowie", code: "nowy" })).toMatch(/już istnieje/);
    expect(recipientGroupConflict(dictionary, { label: "Inni", code: "OPIEKUNOWIE_KOD" })).toMatch(/Kod/);
    expect(recipientGroupConflict(dictionary, { id: "u", label: "Uczniowie", code: "u" })).toBeUndefined();
    expect(recipientGroupConflict([{ ...item("x", "Uczniowie"), dictType: "campaign" }], { label: "Uczniowie", code: "u" })).toBeUndefined();
  });

  it("rozpoznaje zmianę nazwy lub kodu, a opis uznaje za bezpieczny", () => {
    const current = item("u", "Uczniowie");
    expect(changesRecipientGroupIdentity(current, { label: "Uczniowie szkół" })).toBe(true);
    expect(changesRecipientGroupIdentity(current, { code: "inny" })).toBe(true);
    expect(changesRecipientGroupIdentity(current, { label: "Uczniowie", code: "u" })).toBe(false);
  });

  it("podpowiedź w stopce wymaga grupy ze słownika tylko dla odbiorców spoza słownika", () => {
    const values = { actionType: "Prelekcja", title: "Tytuł", date: "2026-09-10", facilityName: "SP", municipality: "M", leadEducator: "J" };
    const opts = { isPublication: false, hasNamedAudience: true };
    expect(getMissingActionFields(values, opts)).toEqual([]);
    expect(getMissingActionFields(values, { ...opts, hasUnlinkedAudience: true })).toEqual(["grupa odbiorców ze słownika"]);
    expect(getMissingActionFields(values, { isPublication: true, hasNamedAudience: false, hasUnlinkedAudience: true })).toEqual([]);
  });

  it("blokada użycia dotyczy tylko grup odbiorców użytych w działaniach", () => {
    const usage = { total: 3, byModule: [{ module: "Harmonogram", route: "/h", count: 2 }, { module: "Działania", route: "/d", count: 1 }] };
    expect(recipientGroupLockCount(item("u", "Uczniowie"), usage)).toBe(1);
    expect(recipientGroupLockCount(item("u", "Uczniowie"), { total: 2, byModule: [usage.byModule[0]] })).toBe(0);
    expect(recipientGroupLockCount(item("u", "Uczniowie"), undefined)).toBe(0);
    expect(recipientGroupLockCount({ dictType: "campaign" }, usage)).toBe(0);
  });
});
