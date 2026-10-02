import type { AudienceGroupBlock, RecipientSubItem } from "./editor.types";

const hasAudienceCount = (token: string) => parseAudienceItem(token).count > 0 || /(?:[:–-]\s*0|\(\s*0\s*\))$/.test(token.trim());

// Pomocnicza funkcja parsująca pojedynczy element odbiorcy z ewentualnym wiekiem i liczbą
export function parseAudienceItem(token: string, totalFallback = 0): RecipientSubItem {
  let count = 0;
  let remaining = token.trim();
  // Liczba tylko po jawnym separatorze („ - 25”, „: 25”, „(25)”) – „kl. 7” to opis, nie liczba osób.
  const unit = "(?:\\s*(?:os\\.?|osób|osoby|szt\\.?))?";
  const countMatch = remaining.match(new RegExp(`^(.+?)\\s*(?:[:–-]\\s*(\\d+)${unit}|\\(\\s*(\\d+)${unit}\\s*\\))$`, "i"));
  if (countMatch && countMatch[1] && (countMatch[2] || countMatch[3])) {
    remaining = countMatch[1].trim();
    count = parseInt(countMatch[2] || countMatch[3], 10);
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

  // Starszy zapis wieloliniowy: „Grupa I:” w osobnej linii, pod nim po jednej pozycji w linii.
  const groupChunks = raw.includes("\n") && !raw.includes(";")
    ? multilineAudienceChunks(raw)
    : raw.includes(";")
      ? raw.split(";").map((s) => s.trim()).filter(Boolean)
      : [raw.trim()];

  const parsedGroups: AudienceGroupBlock[] = [];

  for (let gIdx = 0; gIdx < groupChunks.length; gIdx++) {
    const chunk = groupChunks[gIdx];
    let groupName = `Grupa ${gIdx + 1}`;
    let itemsPart = chunk;

    // Nagłówek grupy: „Grupa I:” w osobnej linii albo „Grupa I: pozycje…” w jednej linii.
    // „Uczniowie 1-3: 43” to pozycja z liczbą, a nie grupa „Uczniowie 1-3”.
    const lines = chunk.split("\n");
    const colonMatch = chunk.includes("\n")
      ? (/^[^:]+:$/.test(lines[0].trim()) ? [chunk, lines[0].trim().slice(0, -1), lines.slice(1).join("\n")] : null)
      : chunk.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch && colonMatch[2].trim() && !/^\d+\s*(?:os\.?|osób|osoby)?$/i.test(colonMatch[2].trim())) {
      groupName = colonMatch[1].trim();
      itemsPart = colonMatch[2].trim();
    }

    // Przecinek (lub nowa linia) oddziela pozycje tylko wtedy, gdy pozycja kończy się liczbą osób;
    // „Dzieci, młodzież, dorośli - 150” to jedna pozycja ze 150 osobami.
    const itemTokens: string[] = [];
    let pending = "";
    for (const token of itemsPart.split(/,|\n/).map((s) => s.trim()).filter(Boolean)) {
      pending = pending ? `${pending}, ${token}` : token;
      if (hasAudienceCount(pending)) {
        itemTokens.push(pending);
        pending = "";
      }
    }
    if (pending) itemTokens.push(pending);
    const items: RecipientSubItem[] = itemTokens.map((token) => parseAudienceItem(token, 0));

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

  const parsedTotal = calculateTotalParticipants(parsedGroups);
  if (totalFallback && totalFallback > 0 && parsedTotal === 0) {
    parsedGroups[0].items[0].count = totalFallback;
  } else if (totalFallback && totalFallback > 0 && parsedTotal !== totalFallback) {
    // Opisu nie da się jednoznacznie rozpisać na liczby – zostaje w całości, z zapisaną liczbą odbiorców.
    return [{
      id: "grp-1",
      name: "Grupa 1",
      items: [{ id: "item-1-1", name: raw.replace(/\s+/g, " ").trim(), count: totalFallback, ageFrom: null, ageTo: null }],
    }];
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

/** Dzieli wieloliniowy opis na grupy: linia „Nazwa:” zaczyna grupę, kolejne linie to jej pozycje. */
function multilineAudienceChunks(raw: string): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (/^[^:]+:$/.test(line) && current.length > 0) {
      chunks.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
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

// Sumaryczna liczba odbiorców ze wszystkich grup
export function calculateTotalParticipants(audienceGroups: AudienceGroupBlock[]): number {
  return audienceGroups.reduce((acc, grp) => {
    const grpSum = grp.items.reduce((subAcc, item) => subAcc + (Number(item.count) || 0), 0);
    return acc + grpSum;
  }, 0);
}
