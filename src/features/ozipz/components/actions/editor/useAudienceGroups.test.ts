import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudienceGroups } from "./useAudienceGroups";

describe("useAudienceGroups Hook", () => {
  it("initializes with single empty default group", () => {
    const { result } = renderHook(() => useAudienceGroups());
    expect(result.current.audienceGroups).toHaveLength(1);
    expect(result.current.audienceGroups[0].name).toBe("Grupa 1");
    expect(result.current.audienceGroups[0].items).toHaveLength(1);
    expect(result.current.audienceGroups[0].items[0].name).toBe("");
    expect(result.current.audienceGroups[0].items[0].count).toBe(0);
    expect(result.current.totalDirectParticipants).toBe(0);
    expect(result.current.formattedAudienceString).toBe("Uczestnicy");
  });

  it("supports multiple categories in Grupa 1 (e.g. Uczniowie 18 + Opiekunowie 2)", () => {
    const { result } = renderHook(() => useAudienceGroups());
    const groupId = result.current.audienceGroups[0].id;
    const firstItemId = result.current.audienceGroups[0].items[0].id;

    // 1. Ustaw kategorię 1: Uczniowie szkoły podstawowej - 18
    act(() => {
      result.current.handleUpdateGroupItem(groupId, firstItemId, "name", "Uczniowie szkoły podstawowej");
      result.current.handleUpdateGroupItem(groupId, firstItemId, "count", 18);
    });

    expect(result.current.totalDirectParticipants).toBe(18);

    // 2. Dodaj kategorię 2: Opiekunowie - 2
    act(() => {
      result.current.handleAddItemToGroup(groupId, "Opiekunowie", 2);
    });

    expect(result.current.audienceGroups[0].items).toHaveLength(2);
    expect(result.current.audienceGroups[0].items[1].name).toBe("Opiekunowie");
    expect(result.current.audienceGroups[0].items[1].count).toBe(2);
    expect(result.current.totalDirectParticipants).toBe(20);
    expect(result.current.formattedAudienceString).toBe(
      "Uczniowie szkoły podstawowej - 18, Opiekunowie - 2"
    );
  });

  it("duplicates Grupa 1 as Grupa 2 and sequentially Grupa 2 as Grupa 3", () => {
    const { result } = renderHook(() => useAudienceGroups());
    const group1Id = result.current.audienceGroups[0].id;
    const item1Id = result.current.audienceGroups[0].items[0].id;

    // Konfiguracja Grupy 1: Uczniowie szkoły podstawowej (18) + Opiekunowie (2)
    act(() => {
      result.current.handleUpdateGroupItem(group1Id, item1Id, "name", "Uczniowie szkoły podstawowej");
      result.current.handleUpdateGroupItem(group1Id, item1Id, "count", 18);
      result.current.handleAddItemToGroup(group1Id, "Opiekunowie", 2);
    });

    expect(result.current.totalDirectParticipants).toBe(20);

    // Kopiuj Grupa 1 -> powstaje Grupa 2
    act(() => {
      result.current.handleDuplicateGroup(group1Id);
    });

    expect(result.current.audienceGroups).toHaveLength(2);
    const group2 = result.current.audienceGroups[1];
    expect(group2.name).toBe("Grupa 2");
    expect(group2.id).not.toBe(group1Id);
    expect(group2.items).toHaveLength(2);
    expect(group2.items[0].name).toBe("Uczniowie szkoły podstawowej");
    expect(group2.items[0].count).toBe(18);
    expect(group2.items[0].id).not.toBe(item1Id);
    expect(group2.items[1].name).toBe("Opiekunowie");
    expect(group2.items[1].count).toBe(2);
    expect(result.current.totalDirectParticipants).toBe(40);

    // Kopiuj Grupa 2 -> powstaje Grupa 3
    act(() => {
      result.current.handleDuplicateGroup(group2.id);
    });

    expect(result.current.audienceGroups).toHaveLength(3);
    const group3 = result.current.audienceGroups[2];
    expect(group3.name).toBe("Grupa 3");
    expect(group3.id).not.toBe(group2.id);
    expect(group3.items).toHaveLength(2);
    expect(group3.items[0].name).toBe("Uczniowie szkoły podstawowej");
    expect(group3.items[0].count).toBe(18);
    expect(group3.items[1].name).toBe("Opiekunowie");
    expect(group3.items[1].count).toBe(2);
    expect(result.current.totalDirectParticipants).toBe(60);

    expect(result.current.formattedAudienceString).toBe(
      "Grupa 1: Uczniowie szkoły podstawowej - 18, Opiekunowie - 2; " +
      "Grupa 2: Uczniowie szkoły podstawowej - 18, Opiekunowie - 2; " +
      "Grupa 3: Uczniowie szkoły podstawowej - 18, Opiekunowie - 2"
    );
  });

  it("modifies cloned group independently and avoids collision on additional duplicates", () => {
    const { result } = renderHook(() => useAudienceGroups());
    const group1Id = result.current.audienceGroups[0].id;
    const item1Id = result.current.audienceGroups[0].items[0].id;

    act(() => {
      result.current.handleUpdateGroupItem(group1Id, item1Id, "name", "Uczniowie");
      result.current.handleUpdateGroupItem(group1Id, item1Id, "count", 15);
      result.current.handleAddItemToGroup(group1Id, "Opiekunowie", 1);
    });

    // Grupa 1 -> Grupa 2
    act(() => {
      result.current.handleDuplicateGroup(group1Id);
    });
    // Grupa 2 -> Grupa 3
    const group2Id = result.current.audienceGroups[1].id;
    act(() => {
      result.current.handleDuplicateGroup(group2Id);
    });

    // Zmodyfikuj Grupę 2: zmień liczbę uczniów na 25
    const group2ItemId = result.current.audienceGroups[1].items[0].id;
    act(() => {
      result.current.handleUpdateGroupItem(group2Id, group2ItemId, "count", 25);
    });

    // Suma: Grupa 1 (16) + Grupa 2 (26) + Grupa 3 (16) = 58
    expect(result.current.totalDirectParticipants).toBe(58);

    // Kopiowanie Grupy 2 po modyfikacji tworzy Grupę 4 z 26 uczestnikami
    act(() => {
      result.current.handleDuplicateGroup(group2Id);
    });

    expect(result.current.audienceGroups).toHaveLength(4);
    const group4 = result.current.audienceGroups.find((g) => g.name === "Grupa 4");
    expect(group4).toBeDefined();
    expect(group4?.items[0].count).toBe(25);
    expect(group4?.items[1].count).toBe(1);
    expect(result.current.totalDirectParticipants).toBe(58 + 26);
  });

  it("handles custom group names and sequential copy numbering", () => {
    const { result } = renderHook(() => useAudienceGroups());
    const group1Id = result.current.audienceGroups[0].id;

    act(() => {
      result.current.handleUpdateGroupName(group1Id, "Klasa 7A");
    });

    act(() => {
      result.current.handleDuplicateGroup(group1Id);
    });

    expect(result.current.audienceGroups[1].name).toBe("Klasa 7A (kopia)");

    // Ponowne kopiowanie grupy źródłowej wstawia nowy klon bezpośrednio za grupą 1 (na indeks 1)
    act(() => {
      result.current.handleDuplicateGroup(group1Id);
    });

    expect(result.current.audienceGroups[1].name).toBe("Klasa 7A (kopia 2)");
    expect(result.current.audienceGroups[2].name).toBe("Klasa 7A (kopia)");

    // Kopiowanie już istniejącej kopii (indeks 2) tworzy kolejną kopię i wstawia za nią
    act(() => {
      result.current.handleDuplicateGroup(result.current.audienceGroups[2].id);
    });
    expect(result.current.audienceGroups[3].name).toBe("Klasa 7A (kopia 3)");
  });

  it("handles group deletion safely and preserves minimum one group constraint", () => {
    const { result } = renderHook(() => useAudienceGroups());
    const group1Id = result.current.audienceGroups[0].id;

    // Próba usunięcia jedynej grupy nie usuwa jej
    act(() => {
      result.current.handleDeleteGroup(group1Id);
    });
    expect(result.current.audienceGroups).toHaveLength(1);

    // Dodaj drugą grupę i usuń pierwszą
    act(() => {
      result.current.handleAddGroup("Grupa B");
    });
    expect(result.current.audienceGroups).toHaveLength(2);

    act(() => {
      result.current.handleDeleteGroup(group1Id);
    });
    expect(result.current.audienceGroups).toHaveLength(1);
    expect(result.current.audienceGroups[0].name).toBe("Grupa B");
  });
});
