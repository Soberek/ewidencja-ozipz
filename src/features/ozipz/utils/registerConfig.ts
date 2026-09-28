import type { OfficialRegisterKey, OzipzAction, OzipzRegisterMapping } from "../types/ozipz.types";

export const OFFICIAL_REGISTERS_CONFIG: Record<
  OfficialRegisterKey,
  {
    key: OfficialRegisterKey;
    label: string;
    title: string;
    description: string;
  }
> = {
  informacje: {
    key: "informacje",
    label: "Informacje",
    title: "Rejestr Informacji z Realizacji Zadań",
    description: "Rejestr informacji dotyczących realizacji zadań edukacyjnych i profilaktycznych (Zał. nr 3 WSSE)",
  },
  publikacje: {
    key: "publikacje",
    label: "Publikacje",
    title: "Rejestr Publikacji Medialnych i Internetowych",
    description: "Rejestr artykułów, postów, komunikatów medialnych i dystrybucji materiałów",
  },
  wizytacje: {
    key: "wizytacje",
    label: "Wizytacje",
    title: "Rejestr Wizytacji i Kontroli",
    description: "Rejestr wizytacji, narad i kontroli koordynacyjnych w terenie",
  },
};

export const INFORMACJE_OFFICIAL_FOOTER =
  "WSSE Szczecin; Rejestr Informacji dotyczących realizacji zadania- zał. nr 3 wyd. I do pisma ZWPIS w Szczecinie nr PZ.110.1.2024 z dn. 18.01.2024 r.";

/**
 * Domyślna heurystyka kwalifikacji na podstawie nazwy formy działania lub tytułu
 * (zgodna ze standardem better-oz / edu-report).
 */
export function defaultRegistersForActivity(name: string): OfficialRegisterKey[] {
  if (!name) return [];
  const normalized = name
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    normalized.includes("publikacja") ||
    normalized.includes("media") ||
    normalized.includes("artykul") ||
    normalized.includes("prasa") ||
    normalized.includes("prasow") ||
    normalized.includes("post") ||
    normalized.includes("facebook") ||
    normalized.includes("fb") ||
    normalized.includes("www") ||
    normalized.includes("internet")
  ) {
    return ["publikacje"];
  }

  if (
    normalized.includes("wizytacj") ||
    normalized.includes("kontrol") ||
    normalized.includes("teren")
  ) {
    return ["wizytacje"];
  }

  if (
    [
      "rozmowa",
      "szkol",
      "prelekcj",
      "wyklad",
      "warsztat",
      "pogadank",
      "konferenc",
      "stoisko",
      "happening",
      "konkurs",
      "wywiad",
      "narad",
      "instrukta",
      "zajecia",
      "lekcj",
      "edukac",
      "dystrybucj",
    ].some((part) => normalized.includes(part))
  ) {
    return ["informacje"];
  }

  // Domyślny fallback: jeśli to standardowe działanie edukacyjne, kwalifikuj do Informacji
  return ["informacje"];
}

export interface ResolveRegistersInput {
  action: Pick<OzipzAction, "id" | "actionType" | "title" | "topic" | "jrwaSign">;
  mappings?: OzipzRegisterMapping[];
}

/**
 * Rozpoznaje, do których rejestrów należy dane działanie:
 * 1. Bezpośrednie nadpisanie per action.id
 * 2. Konfiguracja per action.actionType
 * 3. Heurystyka domyślna z actionType lub title
 */
export function resolveActionRegisters({
  action,
  mappings = [],
}: ResolveRegistersInput): OfficialRegisterKey[] {
  // 1. Sprawdź czy jest jawne mapowanie dla tego konkretnego działania
  const actionOverride = mappings.find((m) => m.actionId === action.id);
  if (actionOverride && actionOverride.registers.length > 0) {
    return [...actionOverride.registers];
  }

  // 2. Sprawdź czy jest skonfigurowane mapowanie dla danej formy działania
  if (action.actionType) {
    const activityMapping = mappings.find(
      (m) => !m.actionId && (m.activityType === action.actionType || m.id === action.actionType)
    );
    if (activityMapping && activityMapping.registers.length > 0) {
      return [...activityMapping.registers];
    }
  }

  // 3. Heurystyka automatyczna
  if (action.actionType) {
    const heuristic = defaultRegistersForActivity(action.actionType);
    if (heuristic.length > 0) return heuristic;
  }

  if (action.title) {
    const heuristic = defaultRegistersForActivity(action.title);
    if (heuristic.length > 0) return heuristic;
  }

  return ["informacje"];
}
