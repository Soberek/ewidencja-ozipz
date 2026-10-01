import type { OzipzAction, OzipzFacility, OzipzProgram, OzipzSchoolParticipation } from "../types/ozipz.types";
import { isActionCountedInReports } from "./calculators/actionMetrics";

/** „all” – wszystkie lata szkolne. */
export type StatisticsYear = string | "all";

export interface ProgramSchoolEntry {
  key: string;
  facilityName: string;
  municipality: string;
  facilityType?: string;
  pupils: number;
  hasDeclaration: boolean;
  hasFinalReport: boolean;
  hasFile: boolean;
}

export interface ProgramStatisticsRow {
  programId: string;
  programName: string;
  schools: number;
  participations: number;
  pupils: number;
  municipalities: number;
  declarations: number;
  finalReports: number;
  files: number;
  withoutCoordinator: number;
  /** Działania z ewidencji przypisane do programu w tym okresie (suma „liczby działań”), bez odwołanych i odroczonych. */
  actions: number;
  actionRecipients: number;
  schoolList: ProgramSchoolEntry[];
}

export interface MunicipalityStatisticsRow {
  municipality: string;
  schools: number;
  participations: number;
  programs: number;
  pupils: number;
}

export interface ProgramStatisticsSummary {
  programs: number;
  schools: number;
  participations: number;
  pupils: number;
  municipalities: number;
  finalReports: number;
  files: number;
  withoutCoordinator: number;
  actions: number;
  actionRecipients: number;
}

export interface ProgramStatistics {
  rows: ProgramStatisticsRow[];
  municipalities: MunicipalityStatisticsRow[];
  summary: ProgramStatisticsSummary;
}

const facilityKey = (p: Pick<OzipzSchoolParticipation, "facilityId" | "facilityName" | "municipality">) =>
  p.facilityId?.trim() || `${p.facilityName.trim().toLocaleLowerCase("pl")}|${p.municipality.trim().toLocaleLowerCase("pl")}`;

function pushTo<T>(map: Map<string, T[]>, key: string, item: T) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

/** Rok szkolny „2026/2027” → zakres dat 2026-09-01 … 2027-08-31. */
export function schoolYearDateRange(schoolYear: string): { from: string; to: string } | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(schoolYear.trim());
  if (!match) return null;
  return { from: `${match[1]}-09-01`, to: `${match[2]}-08-31` };
}

export function computeProgramStatistics(
  participations: OzipzSchoolParticipation[],
  programs: OzipzProgram[],
  actions: OzipzAction[],
  facilities: OzipzFacility[],
  year: StatisticsYear,
): ProgramStatistics {
  const inYear = year === "all" ? participations : participations.filter((p) => p.schoolYear.trim() === year);
  const range = year === "all" ? null : schoolYearDateRange(year);
  const programActions = actions.filter(
    (a) => a.programId && isActionCountedInReports(a) && (!range || (a.date.slice(0, 10) >= range.from && a.date.slice(0, 10) <= range.to)),
  );
  const facilityById = new Map(facilities.map((f) => [f.id, f]));
  const programName = new Map(programs.map((p) => [p.id, p.name]));

  const byProgram = new Map<string, OzipzSchoolParticipation[]>();
  for (const p of inYear) pushTo(byProgram, p.programId, p);
  const actionsByProgram = new Map<string, OzipzAction[]>();
  for (const a of programActions) pushTo(actionsByProgram, a.programId!, a);

  const programIds = new Set([...byProgram.keys(), ...actionsByProgram.keys()]);
  const rows: ProgramStatisticsRow[] = [...programIds].map((programId) => {
    const entries = byProgram.get(programId) ?? [];
    const related = actionsByProgram.get(programId) ?? [];
    // Placówka z kilkoma zgłoszeniami (np. dwa budynki) liczy się raz; uczniowie sumują się.
    const schools = new Map<string, ProgramSchoolEntry>();
    for (const p of entries) {
      const key = facilityKey(p);
      const current = schools.get(key);
      schools.set(key, {
        key,
        facilityName: p.facilityName,
        municipality: p.municipality,
        facilityType: p.facilityId ? facilityById.get(p.facilityId)?.type : undefined,
        pupils: (current?.pupils ?? 0) + (Number(p.pupilsCount) || 0),
        hasDeclaration: (current?.hasDeclaration ?? true) && Boolean(p.hasDeclaration),
        hasFinalReport: (current?.hasFinalReport ?? true) && Boolean(p.hasFinalReport),
        hasFile: Boolean(current?.hasFile) || Boolean(p.applicationFile),
      });
    }
    return {
      programId,
      programName: programName.get(programId) || entries[0]?.programName || related[0]?.programName || "Program",
      schools: schools.size,
      participations: entries.length,
      pupils: entries.reduce((sum, p) => sum + (Number(p.pupilsCount) || 0), 0),
      municipalities: new Set(entries.map((p) => p.municipality.trim()).filter(Boolean)).size,
      declarations: entries.filter((p) => p.hasDeclaration).length,
      finalReports: entries.filter((p) => p.hasFinalReport).length,
      files: entries.filter((p) => p.applicationFile).length,
      withoutCoordinator: entries.filter((p) => !p.schoolCoordinatorName?.trim()).length,
      actions: related.reduce((sum, a) => sum + (a.numberOfActions ?? 1), 0),
      actionRecipients: related.reduce((sum, a) => sum + (Number(a.participantsCount) || 0), 0),
      schoolList: [...schools.values()].sort((a, b) => a.facilityName.localeCompare(b.facilityName, "pl")),
    };
  });
  rows.sort((a, b) => b.schools - a.schools || a.programName.localeCompare(b.programName, "pl"));

  const byMunicipality = new Map<string, OzipzSchoolParticipation[]>();
  for (const p of inYear) {
    const name = p.municipality.trim() || "Bez gminy";
    pushTo(byMunicipality, name, p);
  }
  const municipalities: MunicipalityStatisticsRow[] = [...byMunicipality].map(([municipality, entries]) => ({
    municipality,
    schools: new Set(entries.map(facilityKey)).size,
    participations: entries.length,
    programs: new Set(entries.map((p) => p.programId)).size,
    pupils: entries.reduce((sum, p) => sum + (Number(p.pupilsCount) || 0), 0),
  }));
  municipalities.sort((a, b) => b.schools - a.schools || a.municipality.localeCompare(b.municipality, "pl"));

  return {
    rows,
    municipalities,
    summary: {
      programs: rows.filter((r) => r.participations > 0).length,
      schools: new Set(inYear.map(facilityKey)).size,
      participations: inYear.length,
      pupils: inYear.reduce((sum, p) => sum + (Number(p.pupilsCount) || 0), 0),
      municipalities: municipalities.filter((m) => m.municipality !== "Bez gminy").length,
      finalReports: inYear.filter((p) => p.hasFinalReport).length,
      files: inYear.filter((p) => p.applicationFile).length,
      withoutCoordinator: inYear.filter((p) => !p.schoolCoordinatorName?.trim()).length,
      actions: rows.reduce((sum, r) => sum + r.actions, 0),
      actionRecipients: rows.reduce((sum, r) => sum + r.actionRecipients, 0),
    },
  };
}
