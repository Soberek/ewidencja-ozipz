import type { OzipzAction, OzipzSchoolParticipation } from "../types/ozipz.types";
import { isActionCountedInReports } from "./calculators/actionMetrics";
import { resolveActivityFormLabel } from "./actionFormUtils";
import { schoolYearDateRange } from "./participationUtils";

/** Formy działań (po normalizacji słownikowej), które są prelekcją dla szkoły. */
const LECTURE_FORMS = new Set(["Prelekcja (warsztat)", "Wykład"]);

/** Prelekcje z rejestru działań pogrupowane po programie i placówce. */
export type LectureIndex = ReadonlyMap<string, OzipzAction[]>;

const normalize = (value: string | null | undefined) => String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pl");
const byFacilityId = (programId: string, facilityId: string) => `${programId}|id:${facilityId}`;
const byFacilityName = (programId: string, name: string, municipality: string) =>
  `${programId}|name:${normalize(name)}|${normalize(municipality)}`;

function isLectureAction(action: OzipzAction): boolean {
  return LECTURE_FORMS.has(resolveActivityFormLabel(action));
}

/**
 * Indeks prelekcji z rejestru: działanie programu w placówce w formie prelekcji/wykładu, bez odwołanych i odroczonych.
 * Działanie bez powiązania z bazą placówek dopasowuje się po nazwie placówki i gminie.
 */
export function buildLectureIndex(actions: OzipzAction[]): LectureIndex {
  const index = new Map<string, OzipzAction[]>();
  for (const action of actions) {
    if (!action.programId || !isActionCountedInReports(action) || !isLectureAction(action)) continue;
    const key = action.facilityId?.trim()
      ? byFacilityId(action.programId, action.facilityId.trim())
      : byFacilityName(action.programId, action.facilityName, action.municipality);
    const list = index.get(key);
    if (list) list.push(action);
    else index.set(key, [action]);
  }
  for (const list of index.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return index;
}

type LectureParticipation = Pick<OzipzSchoolParticipation, "programId" | "facilityId" | "facilityName" | "municipality" | "schoolYear">;

/** Prelekcje z rejestru dla zgłoszenia: ten program, ta placówka, data w roku szkolnym zgłoszenia. */
export function participationLectures(participation: LectureParticipation, index: LectureIndex): OzipzAction[] {
  const range = schoolYearDateRange(participation.schoolYear);
  if (!participation.programId || !range) return [];
  const candidates = [
    ...(participation.facilityId ? index.get(byFacilityId(participation.programId, participation.facilityId)) ?? [] : []),
    ...(index.get(byFacilityName(participation.programId, participation.facilityName, participation.municipality)) ?? []),
  ];
  return candidates.filter((a) => a.date.slice(0, 10) >= range.from && a.date.slice(0, 10) <= range.to);
}

export interface ParticipationLectureStatus {
  /** Prelekcja przeprowadzona: jest w rejestrze albo oznaczona ręcznie. */
  done: boolean;
  fromRegister: OzipzAction[];
  /** Oznaczona ręcznie i nieobecna w rejestrze. */
  manualOnly: boolean;
}

export function participationLectureStatus(
  participation: LectureParticipation & Pick<OzipzSchoolParticipation, "lectureDone">,
  index: LectureIndex,
): ParticipationLectureStatus {
  const fromRegister = participationLectures(participation, index);
  const manualOnly = fromRegister.length === 0 && Boolean(participation.lectureDone);
  return { done: fromRegister.length > 0 || manualOnly, fromRegister, manualOnly };
}
