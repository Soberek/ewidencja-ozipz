import type {
  OzipzAction,
  OzipzMaterial,
  OzipzHealthTopic,
  OzipzActionType,
} from "../../types/ozipz.types";
import { safeParseDate } from "../dateUtils";
import { resolveActivityFormLabel } from "../actionFormUtils";

export interface AudienceGroupStatItem {
  group: string;
  actionsCount: number;
  directRecipients: number;
}

export function parseAudienceEntryTokens(raw: string, fallbackTotal: number): Array<{ group: string; count: number }> {
  if (!raw || !raw.trim()) {
    return [{ group: "Inni odbiorcy", count: fallbackTotal }];
  }

  const chunks = raw.split(";").map((s) => s.trim()).filter(Boolean);
  const results: Array<{ group: string; count: number }> = [];

  for (const chunk of chunks) {
    let content = chunk;
    const groupPrefixMatch = chunk.match(/^(?:Grupa\s*\d+|[^:]+):\s*(.+)$/i);
    if (groupPrefixMatch && groupPrefixMatch[1]) {
      content = groupPrefixMatch[1].trim();
    }

    const itemTokens = content.split(",").map((s) => s.trim()).filter(Boolean);
    for (const itemToken of itemTokens) {
      let count = fallbackTotal;
      let groupName = itemToken;

      const countMatch = itemToken.match(/^(.+?)\s+[-–—:]\s*(\d+)\s*(?:os|os\.|osób|osoby|szt|szt\.|)?$/i);
      if (countMatch && countMatch[1] && countMatch[2]) {
        groupName = countMatch[1].trim();
        count = parseInt(countMatch[2], 10);
      }

      if (groupName) {
        results.push({ group: groupName, count: isNaN(count) ? fallbackTotal : count });
      }
    }
  }

  if (results.length === 0) {
    return [{ group: "Inni odbiorcy", count: fallbackTotal }];
  }

  return results;
}

export function calculateAudienceGroupBreakdown(actions: OzipzAction[]): AudienceGroupStatItem[] {
  const map = new Map<string, { actionsCount: number; directRecipients: number }>();

  for (const a of actions) {
    if (a.status === "odwolane" || a.status === "cancelled" || a.status === "anulowane") continue;
    const totalRecipients = Number(a.participantsCount) || 0;
    const entries = parseAudienceEntryTokens(a.audienceGroup || "", totalRecipients);

    for (const entry of entries) {
      const existing = map.get(entry.group) || { actionsCount: 0, directRecipients: 0 };
      existing.actionsCount += 1;
      existing.directRecipients += entry.count;
      map.set(entry.group, existing);
    }
  }

  return Array.from(map.entries())
    .map(([group, stat]) => ({
      group,
      actionsCount: stat.actionsCount,
      directRecipients: stat.directRecipients,
    }))
    .sort((a, b) => b.directRecipients - a.directRecipients || b.actionsCount - a.actionsCount);
}

export interface FormBreakdownItem {
  form: string;
  actionsCount: number;
  directRecipients: number;
  indirectRecipients: number;
  materialsDistributed: number;
}

export function calculateFormBreakdown(actions: OzipzAction[]): FormBreakdownItem[] {
  const map = new Map<string, FormBreakdownItem>();

  for (const a of actions) {
    if (a.status === "odwolane" || a.status === "cancelled" || a.status === "anulowane") continue;
    const form = resolveActivityFormLabel(a);
    const existing = map.get(form) || {
      form,
      actionsCount: 0,
      directRecipients: 0,
      indirectRecipients: 0,
      materialsDistributed: 0,
    };
    existing.actionsCount += 1;
    existing.directRecipients += Number(a.participantsCount) || 0;
    existing.indirectRecipients += Number(a.indirectRecipientsCount) || 0;
    existing.materialsDistributed += Number(a.materialsDistributedCount) || 0;
    map.set(form, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.actionsCount - a.actionsCount || b.directRecipients - a.directRecipients);
}

export function filterActionsByPeriod(
  actions: OzipzAction[],
  yearFilter: string = "all",
  periodFilter: string = "all"
): OzipzAction[] {
  return actions.filter((a) => {
    if (!a.date) return yearFilter === "all" && periodFilter === "all";
    const parsed = safeParseDate(a.date);
    if (!parsed) return yearFilter === "all" && periodFilter === "all";
    const itemYear = parsed.getFullYear().toString();
    const itemMonth = (parsed.getMonth() + 1).toString().padStart(2, "0");

    if (yearFilter !== "all" && itemYear !== yearFilter) {
      return false;
    }

    if (periodFilter === "all") return true;

    if (periodFilter === "H1") return ["01", "02", "03", "04", "05", "06"].includes(itemMonth);
    if (periodFilter === "H2") return ["07", "08", "09", "10", "11", "12"].includes(itemMonth);

    if (periodFilter === "Q1") return ["01", "02", "03"].includes(itemMonth);
    if (periodFilter === "Q2") return ["04", "05", "06"].includes(itemMonth);
    if (periodFilter === "Q3") return ["07", "08", "09"].includes(itemMonth);
    if (periodFilter === "Q4") return ["10", "11", "12"].includes(itemMonth);

    // Konkretny miesiąc 01-12
    return periodFilter === itemMonth;
  });
}

export interface TopicStatItem {
  topic: OzipzHealthTopic;
  count: number;
  participants: number;
}

export function calculateTopicDistribution(actions: OzipzAction[]): TopicStatItem[] {
  const map = new Map<OzipzHealthTopic, { count: number; participants: number }>();

  for (const a of actions) {
    const existing = map.get(a.topic) || { count: 0, participants: 0 };
    existing.count += 1;
    existing.participants += a.participantsCount || 0;
    map.set(a.topic, existing);
  }

  return Array.from(map.entries()).map(([topic, stat]) => ({
    topic,
    count: stat.count,
    participants: stat.participants,
  }));
}

export interface ActionTypeStatItem {
  type: OzipzActionType;
  count: number;
  participants: number;
}

export function calculateActionTypeStats(actions: OzipzAction[]): ActionTypeStatItem[] {
  const map = new Map<OzipzActionType, { count: number; participants: number }>();

  for (const a of actions) {
    const existing = map.get(a.actionType) || { count: 0, participants: 0 };
    existing.count += 1;
    existing.participants += a.participantsCount || 0;
    map.set(a.actionType, existing);
  }

  return Array.from(map.entries()).map(([type, stat]) => ({
    type,
    count: stat.count,
    participants: stat.participants,
  }));
}

export function calculateMaterialTypeStats(materials: OzipzMaterial[]): { type: string; count: number }[] {
  const map = new Map<string, number>();
  for (const m of materials) {
    const t = m.materialType || "inne";
    map.set(t, (map.get(t) || 0) + 1);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
}
