/**
 * Logika dopasowywania i automatycznego rozliczania zadań harmonogramu / planu pracy
 * na podstawie zrealizowanych działań z Rejestru Działań Edukacyjnych.
 * Zgodne ze standardem better-oz (WYKONANO_SQL / harmonogram.mjs).
 */
import type { OzipzAction, OzipzScheduleEvent, OzipzProgram } from "../types/ozipz.types";
import { getYearNumber, safeParseDate } from "./dateUtils";

export interface EnrichedScheduleEvent extends OzipzScheduleEvent {
  matchedActions: OzipzAction[];
  computedCompletedCount: number;
  isAutoDone: boolean;
  effectiveStatus: "wykonane" | "w_trakcie" | "odroczone" | "odwolane" | "zaplanowane";
  resolvedProgramName: string;
  resolvedJrwaSymbol?: string;
  isProgrammatic: boolean;
}

import { resolveScheduleProgram } from "./scheduleProgramResolver";
export { resolveScheduleProgram };

/**
 * Zwraca miesiąc z zadania harmonogramu (1..12)
 */
export function getEventMonth(event: OzipzScheduleEvent): number | null {
  if (typeof event.month === "number" && event.month >= 1 && event.month <= 12) {
    return event.month;
  }
  if (event.eventDate) {
    const parsed = safeParseDate(event.eventDate);
    if (parsed) return parsed.getMonth() + 1;
    const parts = event.eventDate.split("-");
    if (parts.length >= 2) {
      const p = parseInt(parts[1], 10);
      if (!isNaN(p) && p >= 1 && p <= 12) return p;
    }
  }
  return null;
}


/**
 * Zwraca rok z zadania harmonogramu
 */
export function getEventYear(event: OzipzScheduleEvent): number {
  if (typeof event.year === "number" && event.year > 2000) {
    return event.year;
  }
  if (event.eventDate) {
    return getYearNumber(event.eventDate);
  }
  return new Date().getFullYear();
}

/**
 * Sprawdza czy działanie z rejestru odpowiada publikacji medialnej
 */
function isMediaAction(action: OzipzAction): boolean {
  const type = (action.actionType || "").toLowerCase();
  const title = (action.title || "").toLowerCase();
  return (
    type.includes("artykuł") ||
    type.includes("social") ||
    type.includes("media") ||
    type.includes("post") ||
    title.includes("publikacja") ||
    title.includes("social medi")
  );
}

/**
 * Sprawdza czy zadanie harmonogramu to publikacja w mediach
 */
function isMediaScheduleEvent(event: OzipzScheduleEvent): boolean {
  const title = (event.title || "").toLowerCase();
  const cat = (event.category || "").toLowerCase();
  return (
    title.includes("publikacja") ||
    title.includes("media") ||
    title.includes("artykuł") ||
    title.includes("social") ||
    cat.includes("media")
  );
}

/**
 * Normalizacja tekstu do porównań (usunięcie znaków specjalnych i małe litery)
 */
function normalizeText(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

/**
 * Znajduje wszystkie działania z ewidencji, które realizują dane zadanie harmonogramu
 */
export function getMatchingActionsForScheduleEvent(
  event: OzipzScheduleEvent,
  actions: OzipzAction[]
): OzipzAction[] {
  const evMonth = getEventMonth(event);
  const evYear = getEventYear(event);
  const evJrwa = event.jrwa ? event.jrwa.replace(/[^0-9.]/g, "") : "";
  const evNormTitle = normalizeText(event.title);
  const evNormLoc = normalizeText(event.location);
  const evNormProg = normalizeText(event.programName);

  return actions.filter((a) => {
    // Działania odroczone, anulowane, odwołane oraz planowane nie zaliczają wykonania
    if (
      a.status === "odroczone" ||
      a.status === "anulowane" ||
      a.status === "odwolane" ||
      a.status === "cancelled" ||
      a.status === "planowane" ||
      a.status === "planned"
    ) {
      return false;
    }
    if (!a.date) return false;

    // 1. Bezpośrednie powiązanie przez identyfikator relacji
    if (a.scheduleEventId) return a.scheduleEventId === event.id;
    if (event.actionId && event.actionId === a.id) return true;

    // 2. Weryfikacja daty (rok i miesiąc)
    const aParsedDate = safeParseDate(a.date);
    if (!aParsedDate) return false;
    const aYear = aParsedDate.getFullYear();
    const aMonth = aParsedDate.getMonth() + 1;

    if (aYear !== evYear) return false;
    if (evMonth !== null && aMonth !== evMonth) return false;

    // Jeśli zadanie harmonogramu ma wskazaną konkretną placówkę, akcja z innej placówki nie może go zaliczyć
    if (event.facilityId && a.facilityId && event.facilityId !== a.facilityId) {
      return false;
    }
    const aNormFac = normalizeText(a.facilityName);
    if (evNormLoc && aNormFac && !aNormFac.includes(evNormLoc) && !evNormLoc.includes(aNormFac)) {
      return false;
    }

    // 3. Reguła publikacji medialnych (zgodnie z better-oz: dowolny kanał medialny zalicza zadanie medialne)
    if (isMediaScheduleEvent(event) && isMediaAction(a)) {
      return true;
    }

    // 4. Dopasowanie po programie
    if (event.programId && a.programId && event.programId === a.programId) {
      return true;
    }
    if (evNormProg && a.programName) {
      const aNormProg = normalizeText(a.programName);
      if (aNormProg && (aNormProg.includes(evNormProg) || evNormProg.includes(aNormProg))) {
        return true;
      }
    }

    // 5. Dopasowanie po symbolu JRWA (ścisłe dopasowanie segmentów, np. 966.1 nie pasuje do 966.10 czy 966.14)
    if (evJrwa && a.jrwaSign) {
      const cleanSign = a.jrwaSign.replace(/[^0-9.]/g, "");
      const aParts = cleanSign.split(".").filter(Boolean);
      const evParts = evJrwa.split(".").filter(Boolean);
      const matchesSymbol = aParts.some((_, i) =>
        evParts.every((part, j) => aParts[i + j] === part)
      );
      if (matchesSymbol) {
        return true;
      }
    }

    // 6. Dopasowanie po placówce w połączeniu z tematem lub tytułem (sama placówka nie wystarcza do zaliczenia)
    const hasFacilityMatch =
      (event.facilityId && a.facilityId && event.facilityId === a.facilityId) ||
      (evNormLoc && aNormFac && (aNormFac.includes(evNormLoc) || evNormLoc.includes(aNormFac)));

    if (hasFacilityMatch) {
      const evNormTopic = normalizeText(event.topic);
      const aNormTopic = normalizeText(a.topic);
      const topicMatches = Boolean(
        evNormTopic && aNormTopic && (evNormTopic.includes(aNormTopic) || aNormTopic.includes(evNormTopic))
      );
      const titleMatches = Boolean(
        evNormTitle && a.title && (normalizeText(a.title).includes(evNormTitle) || evNormTitle.includes(normalizeText(a.title)))
      );
      if (topicMatches || titleMatches) {
        return true;
      }
    }

    // 7. Dopasowanie po tytule merytorycznym / słowach kluczowych
    if (evNormTitle && a.title) {
      const aNormTitle = normalizeText(a.title);
      if (aNormTitle === evNormTitle || aNormTitle.includes(evNormTitle) || evNormTitle.includes(aNormTitle)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Wzbogaca pozycję harmonogramu o wyliczone wykonanie na podstawie bazy działań oraz powiązany program
 */
export function enrichScheduleEvent(
  event: OzipzScheduleEvent,
  actions: OzipzAction[],
  programs?: OzipzProgram[]
): EnrichedScheduleEvent {
  const isCancelled = event.status === "odwolane" || event.status === "cancelled";
  const isPostponed = event.status === "odroczone" || event.status === "postponed" || Boolean(event.annotationReasonCode);
  const matchedActions = isCancelled ? [] : getMatchingActionsForScheduleEvent(event, actions);
  const autoDoneCount = matchedActions.length;
  const isExplicitDone = !isCancelled && ["wykonane", "done", "zrealizowane"].includes(event.status);
  const isManual = !isCancelled && Boolean(event.manuallyCompleted);
  const plan = Math.max(1, Number(event.plannedCount || 1));

  const computedCompletedCount = isCancelled
    ? 0
    : isExplicitDone || isManual
    ? Math.max(autoDoneCount, plan)
    : autoDoneCount;

  const isAutoDone = !isCancelled && !isPostponed && !isExplicitDone && !isManual && autoDoneCount >= plan;

  let effectiveStatus: "wykonane" | "w_trakcie" | "odroczone" | "odwolane" | "zaplanowane" = "zaplanowane";
  if (isCancelled) {
    effectiveStatus = "odwolane";
  } else if (isPostponed) {
    effectiveStatus = "odroczone";
  } else if (isExplicitDone || isManual || isAutoDone) {
    effectiveStatus = "wykonane";
  } else if (event.status === "w_toku" || event.status === "w_trakcie" || computedCompletedCount > 0) {
    effectiveStatus = "w_trakcie";
  }

  const programInfo = resolveScheduleProgram(event, programs);

  return {
    ...event,
    completedCount: computedCompletedCount,
    matchedActions,
    computedCompletedCount,
    isAutoDone,
    effectiveStatus,
    resolvedProgramName: programInfo.name,
    resolvedJrwaSymbol: programInfo.symbol,
    isProgrammatic: programInfo.isProgrammatic,
  };
}

/**
 * Wzbogaca całą tablicę pozycji harmonogramu
 */
export function enrichScheduleEvents(
  events: OzipzScheduleEvent[],
  actions: OzipzAction[],
  programs?: OzipzProgram[]
): EnrichedScheduleEvent[] {
  return events.map((ev) => enrichScheduleEvent(ev, actions, programs));
}
