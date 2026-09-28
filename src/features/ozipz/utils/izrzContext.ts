/**
 * Zbiera z bazy wszystko, co dotyczy jednej informacji IZRZ: działanie główne, wpisy zapisane
 * razem z nim (np. dystrybucja materiałów wydanych na prelekcji), placówkę i wydane materiały.
 */
import type {
  OzipzAction,
  OzipzDistribution,
  OzipzFacility,
  OzipzMaterial,
} from "../types/ozipz.types";
import { parseNumerIzrz } from "./izrzUtils";
import { isDistributionActionType } from "../components/actions/editor/editorUtils";

export interface IzrzMaterialLine {
  title: string;
  quantity: number;
}

export interface IzrzSources {
  actions: OzipzAction[];
  distributions: OzipzDistribution[];
  materials: OzipzMaterial[];
  facilities: OzipzFacility[];
}

export interface IzrzContext {
  /** Działanie, którego dotyczy dokument (dla dopiętej dystrybucji — działanie główne). */
  action: OzipzAction;
  /** Pozostałe wpisy objęte tym samym IZRZ. */
  relatedActions: OzipzAction[];
  facility: OzipzFacility | null;
  materials: IzrzMaterialLine[];
}

function izrzKey(sign: string | null | undefined): string | null {
  const parsed = parseNumerIzrz(sign);
  return parsed ? `${parsed.seria}:${parsed.nr}/${parsed.rok}` : null;
}

/** Wpis dopięty do innego działania (np. dystrybucja zapisana z prelekcją) wskazuje na rodzica. */
function resolveLinkedParent(action: OzipzAction, actions: OzipzAction[]): OzipzAction {
  if (!action.linkedActionId) return action;
  const parent = actions.find((a) => a.id === action.linkedActionId);
  if (!parent) return action;
  const own = izrzKey(action.izrzSign);
  // Wpis z własnym, innym numerem IZRZ jest osobnym zadaniem — nie podmieniamy go.
  return own === null || own === izrzKey(parent.izrzSign) ? parent : action;
}

function belongsTo(candidate: OzipzAction, anchor: OzipzAction, key: string | null): boolean {
  if (candidate.id === anchor.id) return false;
  const own = izrzKey(candidate.izrzSign);
  if (candidate.linkedActionId === anchor.id) return own === null || own === key;
  return key !== null && own === key;
}

export function findIzrzFacility(
  action: Pick<OzipzAction, "facilityId" | "facilityName">,
  facilities: OzipzFacility[]
): OzipzFacility | null {
  if (action.facilityId) {
    const byId = facilities.find((f) => f.id === action.facilityId);
    if (byId) return byId;
  }
  const name = (action.facilityName || "").trim().toLowerCase();
  if (!name) return null;
  return facilities.find((f) => f.name.trim().toLowerCase() === name) ?? null;
}

function collectMaterials(
  group: OzipzAction[],
  distributions: OzipzDistribution[],
  materials: OzipzMaterial[]
): IzrzMaterialLine[] {
  const totals = new Map<string, IzrzMaterialLine>();
  const add = (title: string, quantity: number) => {
    if (quantity <= 0) return;
    const clean = title.trim();
    const key = clean.toLocaleLowerCase("pl");
    const existing = totals.get(key);
    if (existing) existing.quantity += quantity;
    else totals.set(key, { title: clean, quantity });
  };

  for (const action of group) {
    const rows = distributions.filter((d) => d.actionId === action.id);
    if (rows.length > 0) {
      rows.forEach((d) => add(d.materialTitle, Number(d.quantity) || 0));
      continue;
    }
    // Starsze wpisy bez rozdzielnika: materiał i liczba zapisane wprost w działaniu.
    const count = Number(action.materialsDistributedCount) || 0;
    const title = materials.find((m) => m.id === action.materialId)?.title ?? "";
    add(title, count);
  }

  return [...totals.values()];
}

export function resolveIzrzContext(clicked: OzipzAction, sources: IzrzSources): IzrzContext {
  const anchor = resolveLinkedParent(clicked, sources.actions);
  const key = izrzKey(anchor.izrzSign);
  const group = [anchor, ...sources.actions.filter((a) => belongsTo(a, anchor, key))];

  // Wspólny numer IZRZ dla zajęć i dystrybucji: dokument opisuje zajęcia, dystrybucja daje materiały.
  const substantive = group
    .filter((a) => !isDistributionActionType(a.actionType))
    .sort((a, b) => (Number(b.participantsCount) || 0) - (Number(a.participantsCount) || 0));
  const action = isDistributionActionType(anchor.actionType) && substantive.length > 0 ? substantive[0] : anchor;
  const relatedActions = group.filter((a) => a.id !== action.id);

  return {
    action,
    relatedActions,
    facility: findIzrzFacility(action, sources.facilities),
    materials: collectMaterials(group, sources.distributions, sources.materials),
  };
}
