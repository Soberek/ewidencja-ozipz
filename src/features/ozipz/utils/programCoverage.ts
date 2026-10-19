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

export interface ProgramCoverageRow {
  programId: string;
  programName: string;
  targetTypes: string[];
  eligible: number;
  /** Kwalifikujące się placówki ze zgłoszeniem w roku szkolnym. */
  participating: number;
  missing: number;
}

export interface FacilityProgramEntry {
  /** Zgłoszenia placówki do programu w roku szkolnym – własne albo jej zespołu. Pusta lista = brak zgłoszenia. */
  participations: OzipzSchoolParticipation[];
  /** Placówka kwalifikuje się do programu; zgłoszenie spoza grupy docelowej też jest pokazywane. */
  eligible: boolean;
  /** Działania tego programu w rejestrze w tej placówce w roku szkolnym (istotne, gdy nie ma zgłoszenia). */
  actions: number;
}

export interface FacilityCoverageRow {
  facility: OzipzFacility;
  /** Zespół, w skład którego wchodzi placówka. */
  parent?: OzipzFacility;
  /** Programy z zestawienia, do których placówka się kwalifikuje albo ma zgłoszenie – według id programu. */
  programs: Record<string, FacilityProgramEntry>;
  /** Zgłoszenia w roku szkolnym do programów spoza zestawienia (np. bez rodzaju kształcenia w grupie docelowej). */
  otherParticipations: OzipzSchoolParticipation[];
  signed: number;
  missing: number;
}

export interface ProgramCoverage {
  rows: ProgramCoverageRow[];
  /** Placówki z kwalifikacją lub zgłoszeniem w roku szkolnym, według gminy i nazwy. */
  facilities: FacilityCoverageRow[];
  /** Programy PROGRAMOWE ze zgłoszeniami szkół, których grupa docelowa nie wymienia żadnego rodzaju kształcenia – nie ma ich w zestawieniu. */
  withoutEducationTypes: OzipzProgram[];
}

const nameKey = (name: string | null | undefined, municipality: string | null | undefined) =>
  `${String(name ?? "").trim().toLocaleLowerCase("pl")}|${String(municipality ?? "").trim().toLocaleLowerCase("pl")}`;

const isActive = (program: OzipzProgram) => (program.status || "aktywny") === "aktywny";

/**
 * Udział placówek w programach w wybranym roku szkolnym: kto się kwalifikuje (rodzaj kształcenia z grupy docelowej),
 * kto ma zgłoszenie, a kto nie. Zespół z jednostkami reprezentują jego szkoły; zgłoszenie zespołu obejmuje je wszystkie.
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
  const unitIds = new Set(units.map((f) => f.id));

  // Zgłoszenie lub działanie przypisane zespołowi dotyczy jego jednostek, a nie samego zespołu.
  const coveredUnits = (entry: { facilityId?: string; facilityName?: string; municipality?: string }) => {
    const facility = (entry.facilityId && byId.get(entry.facilityId)) || byName.get(nameKey(entry.facilityName, entry.municipality));
    if (!facility) return { ids: [], viaComplex: false };
    const units = children.get(facility.id) ?? [];
    if (units.length === 0) return { ids: [facility.id], viaComplex: false };
    return { ids: units.map((c) => c.id).filter((id) => unitIds.has(id)), viaComplex: true };
  };

  const inYear = participations.filter((p) => p.schoolYear.trim() === schoolYear);
  const range = schoolYearDateRange(schoolYear);
  const yearActions = actions.filter(
    (a) => a.programId && isActionCountedInReports(a) && range && a.date.slice(0, 10) >= range.from && a.date.slice(0, 10) <= range.to,
  );

  const facilityRows = new Map<string, FacilityCoverageRow>();
  const rowOf = (id: string): FacilityCoverageRow => {
    let row = facilityRows.get(id);
    if (!row) {
      const facility = byId.get(id)!;
      row = {
        facility,
        parent: facility.parentFacilityId ? byId.get(facility.parentFacilityId) : undefined,
        programs: {},
        otherParticipations: [],
        signed: 0,
        missing: 0,
      };
      facilityRows.set(id, row);
    }
    return row;
  };

  const rows: ProgramCoverageRow[] = [];
  const withoutEducationTypes: OzipzProgram[] = [];
  const included = new Set<string>();
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
    included.add(program.id);

    const target = new Set(targetTypes.map(normalizeTypKey));
    const eligible = new Set(
      units.filter((f) => (f.educationTypes ?? []).some((t) => target.has(normalizeTypKey(t)))).map((f) => f.id),
    );
    const signedUp = new Map<string, OzipzSchoolParticipation[]>();
    for (const p of entries) {
      // Zgłoszenie zespołu dotyczy tylko jego szkół z grupy docelowej (np. podstawówki, nie liceum).
      const { ids, viaComplex } = coveredUnits(p);
      for (const id of ids) if (!viaComplex || eligible.has(id)) signedUp.set(id, [...(signedUp.get(id) ?? []), p]);
    }
    const actionCounts = new Map<string, number>();
    for (const action of yearActions) {
      if (action.programId !== program.id) continue;
      for (const id of coveredUnits(action).ids) actionCounts.set(id, (actionCounts.get(id) ?? 0) + (action.numberOfActions ?? 1));
    }

    let participating = 0;
    for (const id of new Set([...eligible, ...signedUp.keys()])) {
      const entry: FacilityProgramEntry = {
        participations: signedUp.get(id) ?? [],
        eligible: eligible.has(id),
        actions: actionCounts.get(id) ?? 0,
      };
      const row = rowOf(id);
      row.programs[program.id] = entry;
      if (entry.participations.length > 0) row.signed += 1;
      else row.missing += 1;
      if (entry.eligible && entry.participations.length > 0) participating += 1;
    }

    rows.push({
      programId: program.id,
      programName: program.name,
      targetTypes,
      eligible: eligible.size,
      participating,
      missing: eligible.size - participating,
    });
  }

  for (const p of inYear) {
    if (included.has(p.programId)) continue;
    for (const id of coveredUnits(p).ids) rowOf(id).otherParticipations.push(p);
  }

  rows.sort((a, b) => a.programName.localeCompare(b.programName, "pl"));
  withoutEducationTypes.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  const facilityList = [...facilityRows.values()].sort(
    (a, b) => a.facility.municipality.localeCompare(b.facility.municipality, "pl") || a.facility.name.localeCompare(b.facility.name, "pl"),
  );

  return { rows, facilities: facilityList, withoutEducationTypes };
}
