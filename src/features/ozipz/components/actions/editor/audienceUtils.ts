import type { AudienceGroupBlock, RecipientSubItem } from "./editor.types";

// Pomocnicza funkcja parsująca pojedynczy element odbiorcy z ewentualnym wiekiem i liczbą
export function parseAudienceItem(token: string, totalFallback = 0): RecipientSubItem {
  let count = 0;
  let remaining = token.trim();
  const countMatch = remaining.match(/^(.+?)(?:[\s:(–-]+(\d+)(?:\s*(?:os|os\.|osób|osoby|szt|szt\.|))?\)?)$/i);
  if (countMatch && countMatch[1] && countMatch[2]) {
    remaining = countMatch[1].trim();
    count = parseInt(countMatch[2], 10);
  } else {
    count = totalFallback;
  }

  let ageFrom: number | null = null;
  let ageTo: number | null = null;

  // Wzorzec przedziału wiekowego: (13-14 lat), [13-14], 13-14 lat
  const ageRangeMatch = remaining.match(/(?:\(|\[)?\s*(\d+)\s*[-–]\s*(\d+)\s*(?:lat|l\.|)\s*(?:\)|\])?/i);
  if (ageRangeMatch) {
    ageFrom = parseInt(ageRangeMatch[1], 10);
    ageTo = parseInt(ageRangeMatch[2], 10);
    remaining = remaining.replace(ageRangeMatch[0], "").trim();
  } else {
    // Wzorzec 60+ lat
    const agePlusMatch = remaining.match(/(?:\(|\[)?\s*(\d+)\s*\+\s*(?:lat|l\.|)\s*(?:\)|\])?/i);
    if (agePlusMatch) {
      ageFrom = parseInt(agePlusMatch[1], 10);
      ageTo = null;
      remaining = remaining.replace(agePlusMatch[0], "").trim();
    } else {
      // Wzorzec do 6 lat
      const ageDoMatch = remaining.match(/(?:\(|\[)?\s*do\s*(\d+)\s*(?:lat|l\.|)\s*(?:\)|\])?/i);
      if (ageDoMatch) {
        ageFrom = null;
        ageTo = parseInt(ageDoMatch[1], 10);
        remaining = remaining.replace(ageDoMatch[0], "").trim();
      }
    }
  }

  const cleanName = remaining.replace(/^[-–:\s]+|[-–:\s]+$/g, "").trim() || "Uczestnicy";

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    count: isNaN(count) ? 0 : count,
    ageFrom: ageFrom != null && !isNaN(ageFrom) ? ageFrom : null,
    ageTo: ageTo != null && !isNaN(ageTo) ? ageTo : null,
  };
}

// Parser grup odbiorców (wielo-grupowy z wieloma typami odbiorców i wiekiem w każdej grupie)
export function parseAudienceGroups(raw?: string, totalFallback?: number): AudienceGroupBlock[] {
  if (!raw || raw.trim().length === 0) {
    return [
      {
        id: "grp-1",
        name: "Grupa 1",
        items: [
          {
            id: "item-1-1",
            name: totalFallback && totalFallback > 0 ? "Uczestnicy" : "",
            count: totalFallback && totalFallback > 0 ? totalFallback : 0,
            ageFrom: null,
            ageTo: null,
          },
        ],
      },
    ];
  }

  const groupChunks = raw.includes(";")
    ? raw.split(";").map((s) => s.trim()).filter(Boolean)
    : [raw.trim()];

  const parsedGroups: AudienceGroupBlock[] = [];

  for (let gIdx = 0; gIdx < groupChunks.length; gIdx++) {
    const chunk = groupChunks[gIdx];
    let groupName = `Grupa ${gIdx + 1}`;
    let itemsPart = chunk;

    const colonMatch = chunk.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      groupName = colonMatch[1].trim();
      itemsPart = colonMatch[2].trim();
    }

    const itemTokens = itemsPart.split(",").map((s) => s.trim()).filter(Boolean);
    const items: RecipientSubItem[] = [];

    for (let iIdx = 0; iIdx < itemTokens.length; iIdx++) {
      items.push(parseAudienceItem(itemTokens[iIdx], iIdx === 0 && totalFallback ? totalFallback : 0));
    }

    if (items.length === 0) {
      items.push({
        id: `item-${gIdx + 1}-1`,
        name: "Uczestnicy",
        count: totalFallback || 20,
        ageFrom: null,
        ageTo: null,
      });
    }

    parsedGroups.push({
      id: `grp-${gIdx + 1}`,
      name: groupName,
      items,
    });
  }

  if (parsedGroups.length === 0) {
    return [
      {
        id: "grp-1",
        name: "Grupa 1",
        items: [
          {
            id: "item-1-1",
            name: totalFallback && totalFallback > 0 ? "Uczestnicy" : "",
            count: totalFallback && totalFallback > 0 ? totalFallback : 0,
            ageFrom: null,
            ageTo: null,
          },
        ],
      },
    ];
  }

  return parsedGroups;
}

// Sformatowany opis grup odbiorców z uwzględnieniem wieku do bazy i IZRZ
export function formatAudienceString(audienceGroups: AudienceGroupBlock[]): string {
  const groupStrs: string[] = [];
  for (let i = 0; i < audienceGroups.length; i++) {
    const grp = audienceGroups[i];
    const grpName = grp.name.trim() || `Grupa ${i + 1}`;
    const validItems = grp.items.filter((item) => item.name.trim().length > 0);
    if (validItems.length === 0) continue;

    const itemStrs = validItems.map((item) => {
      let agePart = "";
      if (item.ageFrom != null && item.ageTo != null && item.ageFrom > 0 && item.ageTo > 0) {
        agePart = item.ageFrom === item.ageTo ? ` (${item.ageFrom} lat)` : ` (${item.ageFrom}-${item.ageTo} lat)`;
      } else if (item.ageFrom != null && item.ageFrom > 0) {
        agePart = ` (${item.ageFrom}+ lat)`;
      } else if (item.ageTo != null && item.ageTo > 0) {
        agePart = ` (do ${item.ageTo} lat)`;
      }
      return `${item.name.trim()}${agePart} - ${item.count}`;
    });

    if (audienceGroups.length === 1 && (grpName.toLowerCase() === "grupa 1" || !grpName)) {
      groupStrs.push(itemStrs.join(", "));
    } else {
      groupStrs.push(`${grpName}: ${itemStrs.join(", ")}`);
    }
  }
  if (groupStrs.length === 0) return "Uczestnicy";
  return groupStrs.join("; ");
}

// Sumaryczna liczba odbiorców bezpośrednich ze wszystkich grup
export function calculateTotalParticipants(audienceGroups: AudienceGroupBlock[]): number {
  return audienceGroups.reduce((acc, grp) => {
    const grpSum = grp.items.reduce((subAcc, item) => subAcc + (Number(item.count) || 0), 0);
    return acc + grpSum;
  }, 0);
}
