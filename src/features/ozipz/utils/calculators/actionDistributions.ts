import type {
  OzipzAction,
  OzipzMaterial,
  OzipzHealthTopic,
  OzipzActionType,
} from "../../types/ozipz.types";
import { safeParseDate } from "../dateUtils";
import { isActionCountedInReports } from "./actionMetrics";
import { resolveActivityFormLabel } from "../actionFormUtils";

export interface AudienceGroupStatItem {
  group: string;
  actionsCount: number;
  recipients: number;
}

const ENTRY_COUNT = /^(.+?)\s+[-–—:]\s*(\d+)\s*(?:os|os\.|osób|osoby|szt|szt\.|)?$/i;

/**
 * Odbiorcy z opisu grupy: „Uczniowie - 25 os., Opiekunowie - 2”. Przecinek lub nowa linia rozdziela pozycje
 * tylko wtedy, gdy pozycja ma własną liczbę – „Dzieci, młodzież, dorośli - 150” to jedna pozycja.
 * Liczba zapisana przy działaniu trafia tylko do pozycji bez liczby i tylko raz (to, czego opis nie rozpisał).
 */
export function parseAudienceEntryTokens(raw: string, fallbackTotal: number): Array<{ group: string; count: number }> {
  if (!raw || !raw.trim()) {
    return [{ group: "Inni odbiorcy", count: fallbackTotal }];
  }

  const results: Array<{ group: string; count: number }> = [];
  const uncounted: string[] = [];

  for (const chunk of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter((l) => l && !/^[^:]+:$/.test(l));
    let content = lines.join("\n");
    const groupPrefixMatch = content.match(/^(?:Grupa\s*\d+|[^:\n]+):\s*([\s\S]+)$/i);
    if (groupPrefixMatch && !/^\d+\s*(?:os\.?|osób|osoby)?$/i.test(groupPrefixMatch[1].trim())) {
      content = groupPrefixMatch[1].trim();
    }

    let pending = "";
    for (const token of content.split(/,|\n/).map((s) => s.trim()).filter(Boolean)) {
      pending = pending ? `${pending}, ${token}` : token;
      const countMatch = pending.match(ENTRY_COUNT);
      if (countMatch) {
        results.push({ group: countMatch[1].trim(), count: parseInt(countMatch[2], 10) });
        pending = "";
      }
    }
    if (pending) uncounted.push(pending);
  }

  if (uncounted.length > 0) {
    const counted = results.reduce((sum, entry) => sum + entry.count, 0);
    const rest = Math.max(0, fallbackTotal - counted);
    uncounted.forEach((group, index) => results.push({ group, count: index === 0 ? rest : 0 }));
  }

  if (results.length === 0) {
    return [{ group: "Inni odbiorcy", count: fallbackTotal }];
  }

  // Opis niezgodny z zapisaną liczbą: liczy się zapisana liczba, przy całym opisie (suma grup = suma odbiorców).
  if (fallbackTotal > 0 && results.reduce((sum, entry) => sum + entry.count, 0) !== fallbackTotal) {
    return [{ group: raw.replace(/\s+/g, " ").trim(), count: fallbackTotal }];
  }

  return results;
}

export function calculateAudienceGroupBreakdown(actions: OzipzAction[]): AudienceGroupStatItem[] {
  const map = new Map<string, { actionsCount: number; recipients: number }>();

  for (const a of actions) {
    if (!isActionCountedInReports(a)) continue;
    const totalRecipients = Number(a.participantsCount) || 0;
    const entries = parseAudienceEntryTokens(a.audienceGroup || "", totalRecipients);

    for (const entry of entries) {
      const existing = map.get(entry.group) || { actionsCount: 0, recipients: 0 };
      existing.actionsCount += 1;
      existing.recipients += entry.count;
      map.set(entry.group, existing);
    }
  }

  return Array.from(map.entries())
    .map(([group, stat]) => ({
      group,
      actionsCount: stat.actionsCount,
      recipients: stat.recipients,
    }))
    .sort((a, b) => b.recipients - a.recipients || b.actionsCount - a.actionsCount);
}

export interface FormBreakdownItem {
  form: string;
  actionsCount: number;
  recipients: number;
  materialsDistributed: number;
}

export function calculateFormBreakdown(actions: OzipzAction[]): FormBreakdownItem[] {
  const map = new Map<string, FormBreakdownItem>();

  for (const a of actions) {
    if (!isActionCountedInReports(a)) continue;
    const form = resolveActivityFormLabel(a);
    const existing = map.get(form) || {
      form,
      actionsCount: 0,
      recipients: 0,
      materialsDistributed: 0,
    };
    existing.actionsCount += 1;
    existing.recipients += Number(a.participantsCount) || 0;
    existing.materialsDistributed += Number(a.materialsDistributedCount) || 0;
    map.set(form, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.actionsCount - a.actionsCount || b.recipients - a.recipients);
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
