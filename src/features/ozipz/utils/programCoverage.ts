import type { OzipzAction, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../types/ozipz.types";
import { isActionCountedInReports } from "./calculators/actionMetrics";
import { mapTypyKsztalcenia, normalizeTypKey } from "./educationTypesUtils";
import { buildChildrenMap } from "./facilityUtils";
import { getProgramJrwaSymbol } from "./programJrwaUtils";
import { schoolYearDateRange } from "./participationUtils";

type JrwaKind = "PROGRAMOWE" | "NIEPROGRAMOWE";

/**
 * Rodzaje kształcenia wymienione w „Grupie docelowej” programu (po przecinku, średniku lub w nowej linii).
 * Dopisek w nawiasie, np. „Szkoła podstawowa (klasy I–III)”, nie zmienia rodzaju placówki.
 */
export function programTargetEducationTypes(targetAudience: string | null | undefined): string[] {
  const parts = String(targetAudience ?? "").split(/[,;\n]/).map((part) => part.replace(/\([^)]*\)/g, ""));
  return mapTypyKsztalcenia(parts).matched;
}

export interface MissingFacility {
  facility: OzipzFacility;
  /** Zespół, w skład którego wchodzi placówka. */
  parent?: OzipzFacility;
  /** Rodzaje kształcenia placówki, które kwalifikują ją do programu. */
  matchedTypes: string[];
  /** Działania tego programu w rejestrze w tej placówce w roku szkolnym – mimo braku zgłoszenia. */
  actionsWithoutParticipation: number;
}

export interface ProgramCoverageRow {
  programId: string;
  programName: string;
  targetTypes: string[];
  eligible: number;
  /** Kwalifikujące się placówki ze zgłoszeniem w roku szkolnym. */
  participating: number;
  missing: MissingFacility[];
}

export interface ProgramCoverage {
  rows: ProgramCoverageRow[];
  /** Programy PROGRAMOWE ze zgłoszeniami szkół, których grupa docelowa nie wymienia żadnego rodzaju kształcenia – nie ma ich w zestawieniu. */
  withoutEducationTypes: OzipzProgram[];
}

const nameKey = (name: string | null | undefined, municipality: string | null | undefined) =>
  `${String(name ?? "").trim().toLocaleLowerCase("pl")}|${String(municipality ?? "").trim().toLocaleLowerCase("pl")}`;

const isActive = (program: OzipzProgram) => (program.status || "aktywny") === "aktywny";

/**
 * Placówki, które kwalifikują się do programu (rodzaj kształcenia z grupy docelowej), a nie mają zgłoszenia
 * w wybranym roku szkolnym. Zespół z jednostkami reprezentują jego szkoły; zgłoszenie zespołu obejmuje je wszystkie.
 * Pomija programy NIEPROGRAMOWE i bez zgłoszeń szkół; program nieaktywny trafia do zestawienia tylko wtedy,
 * gdy w tym roku ma zgłoszenia.
 */
export function computeProgramCoverage(
  programs: OzipzProgram[],
  facilities: OzipzFacility[],
  participations: OzipzSchoolParticipation[],
  actions: OzipzAction[],
  schoolYear: string,
  kindMap: ReadonlyMap<string, JrwaKind>,
): ProgramCoverage {
  const children = buildChildrenMap(facilities);
  const byId = new Map(facilities.map((f) => [f.id, f]));
  const byName = new Map(facilities.map((f) => [nameKey(f.name, f.municipality), f]));
  const units = facilities.filter((f) => !children.get(f.id)?.length);

  // Zgłoszenie lub działanie przypisane zespołowi dotyczy też każdej jego jednostki.
  const coveredIds = (entry: { facilityId?: string; facilityName?: string; municipality?: string }): string[] => {
    const facility = (entry.facilityId && byId.get(entry.facilityId)) || byName.get(nameKey(entry.facilityName, entry.municipality));
    if (!facility) return [];
    return [facility.id, ...(children.get(facility.id) ?? []).map((c) => c.id)];
  };

  const inYear = participations.filter((p) => p.schoolYear.trim() === schoolYear);
  const range = schoolYearDateRange(schoolYear);
  const yearActions = actions.filter(
    (a) => a.programId && isActionCountedInReports(a) && range && a.date.slice(0, 10) >= range.from && a.date.slice(0, 10) <= range.to,
  );

  const rows: ProgramCoverageRow[] = [];
  const withoutEducationTypes: OzipzProgram[] = [];
  for (const program of programs) {
    const kind = kindMap.get(getProgramJrwaSymbol(program));
    if (kind === "NIEPROGRAMOWE" || program.acceptsParticipations === false) continue;
    const entries = inYear.filter((p) => p.programId === program.id);
    if (!isActive(program) && entries.length === 0) continue;

    const targetTypes = programTargetEducationTypes(program.targetAudience);
    if (targetTypes.length === 0) {
      if (kind === "PROGRAMOWE" && isActive(program)) withoutEducationTypes.push(program);
      continue;
    }

    const target = new Set(targetTypes.map(normalizeTypKey));
    const eligible = units
      .map((facility) => ({ facility, matchedTypes: (facility.educationTypes ?? []).filter((t) => target.has(normalizeTypKey(t))) }))
      .filter((entry) => entry.matchedTypes.length > 0);

    const covered = new Set(entries.flatMap(coveredIds));
    const actionCounts = new Map<string, number>();
    for (const action of yearActions) {
      if (action.programId !== program.id) continue;
      for (const id of coveredIds(action)) actionCounts.set(id, (actionCounts.get(id) ?? 0) + (action.numberOfActions ?? 1));
    }

    const missing = eligible
      .filter(({ facility }) => !covered.has(facility.id))
      .map(({ facility, matchedTypes }) => ({
        facility,
        parent: facility.parentFacilityId ? byId.get(facility.parentFacilityId) : undefined,
        matchedTypes,
        actionsWithoutParticipation: actionCounts.get(facility.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          a.facility.municipality.localeCompare(b.facility.municipality, "pl") || a.facility.name.localeCompare(b.facility.name, "pl"),
      );

    rows.push({
      programId: program.id,
      programName: program.name,
      targetTypes,
      eligible: eligible.length,
      participating: eligible.length - missing.length,
      missing,
    });
  }
  rows.sort((a, b) => a.programName.localeCompare(b.programName, "pl"));
  withoutEducationTypes.sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return { rows, withoutEducationTypes };
}
