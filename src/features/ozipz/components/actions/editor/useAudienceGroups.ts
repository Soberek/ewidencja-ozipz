import { useState, useMemo } from "react";
import type { AudienceGroupBlock } from "./editor.types";
import {
  calculateTotalParticipants,
  formatAudienceString,
} from "./audienceUtils";

export function useAudienceGroups(initialGroups?: AudienceGroupBlock[]) {
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroupBlock[]>(
    initialGroups || [
      {
        id: "grp-1",
        name: "Grupa 1",
        items: [
          { id: "item-1-1", name: "", count: 0, ageFrom: null, ageTo: null },
        ],
      },
    ]
  );

  const totalDirectParticipants = useMemo(
    () => calculateTotalParticipants(audienceGroups),
    [audienceGroups]
  );

  const formattedAudienceString = useMemo(
    () => formatAudienceString(audienceGroups),
    [audienceGroups]
  );

  const handleAddGroup = (defaultName = "") => {
    const nextIndex = audienceGroups.length + 1;
    const newGroup: AudienceGroupBlock = {
      id: `grp-${Date.now()}`,
      name: defaultName || `Grupa ${nextIndex}`,
      items: [
        {
          id: `item-${Date.now()}-1`,
          name: "",
          count: 0,
          ageFrom: null,
          ageTo: null,
        },
      ],
    };
    setAudienceGroups((prev) => [...prev, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
    setAudienceGroups((prev) => (prev.length <= 1 ? prev : prev.filter((g) => g.id !== groupId)));
  };

  const handleDuplicateGroup = (sourceGroupId: string) => {
    setAudienceGroups((prev) => {
      const sourceIndex = prev.findIndex((g) => g.id === sourceGroupId);
      if (sourceIndex === -1) return prev;
      const sourceGroup = prev[sourceIndex];

      let nextGroupName = `Grupa ${prev.length + 1}`;
      const match = sourceGroup.name.match(/^Grupa\s*(\d+)$/i);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        let targetNum = currentNum + 1;
        while (prev.some((g) => g.name.trim().toLowerCase() === `grupa ${targetNum}`.toLowerCase())) {
          targetNum++;
        }
        nextGroupName = `Grupa ${targetNum}`;
      } else if (sourceGroup.name.trim()) {
        const copyMatch = sourceGroup.name.trim().match(/^(.*?)\s*\(kopia(?:\s*(\d+))?\)$/i);
        if (copyMatch) {
          const baseName = copyMatch[1].trim();
          let copyNum = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
          while (prev.some((g) => g.name.trim().toLowerCase() === `${baseName} (kopia ${copyNum})`.toLowerCase())) {
            copyNum++;
          }
          nextGroupName = `${baseName} (kopia ${copyNum})`;
        } else {
          let copyNum = 1;
          let candidate = `${sourceGroup.name.trim()} (kopia)`;
          while (prev.some((g) => g.name.trim().toLowerCase() === candidate.toLowerCase())) {
            copyNum++;
            candidate = `${sourceGroup.name.trim()} (kopia ${copyNum})`;
          }
          nextGroupName = candidate;
        }
      }

      const clonedGroup: AudienceGroupBlock = {
        id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: nextGroupName,
        items: sourceGroup.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.name,
          count: item.count,
          ageFrom: item.ageFrom ?? null,
          ageTo: item.ageTo ?? null,
        })),
      };

      const next = [...prev];
      next.splice(sourceIndex + 1, 0, clonedGroup);
      return next;
    });
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    setAudienceGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
  };

  const handleAddItemToGroup = (
    groupId: string,
    name = "",
    count = 0,
    ageFrom: number | null = null,
    ageTo: number | null = null
  ) => {
    const newItemId = `item-${Date.now()}`;
    setAudienceGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, items: [...g.items, { id: newItemId, name, count, ageFrom, ageTo }] }
      )
    );
  };

  const handleDeleteItemFromGroup = (groupId: string, itemId: string) => {
    setAudienceGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId || g.items.length <= 1
          ? g
          : { ...g, items: g.items.filter((item) => item.id !== itemId) }
      )
    );
  };

  const handleUpdateGroupItem = (
    groupId: string,
    itemId: string,
    field: "name" | "count" | "ageFrom" | "ageTo",
    value: string | number | null
  ) => {
    setAudienceGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              items: g.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
            }
      )
    );
  };

  const handleSetAgeRange = (
    groupId: string,
    itemId: string,
    ageFrom: number | null,
    ageTo: number | null
  ) => {
    setAudienceGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              items: g.items.map((item) => (item.id === itemId ? { ...item, ageFrom, ageTo } : item)),
            }
      )
    );
  };

  return {
    audienceGroups,
    setAudienceGroups,
    totalDirectParticipants,
    formattedAudienceString,
    handleAddGroup,
    handleDuplicateGroup,
    handleDeleteGroup,
    handleUpdateGroupName,
    handleAddItemToGroup,
    handleDeleteItemFromGroup,
    handleUpdateGroupItem,
    handleSetAgeRange,
  };
}
