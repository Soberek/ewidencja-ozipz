import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
} from "../../types/ozipz.types";

export interface ProgramReachSummary {
  programId: string;
  programName: string;
  participatingSchools: number;
  totalPupils: number;
  totalParents: number;
  actionsCount: number;
}

export function calculateProgramReach(
  programs: OzipzProgram[],
  participations: OzipzSchoolParticipation[],
  actions: OzipzAction[]
): ProgramReachSummary[] {
  return programs.map((prog) => {
    const progParts = participations.filter((p) => p.programId === prog.id);
    const progActions = actions.filter((a) => a.programId === prog.id);

    const pupils = progParts.reduce((acc, p) => acc + (p.pupilsCount || 0), 0);
    const parents = progParts.reduce((acc, p) => acc + (p.parentsCount || 0), 0);

    return {
      programId: prog.id,
      programName: prog.name,
      participatingSchools: progParts.length,
      totalPupils: pupils,
      totalParents: parents,
      actionsCount: progActions.length,
    };
  });
}

export interface ProgramParticipationSummary {
  totalSchools: number;
  totalPupils: number;
  totalParents: number;
  declarationsCount: number;
  finalReportsCount: number;
  completionRate: number;
}

export function calculateProgramParticipationStats(
  participations: OzipzSchoolParticipation[]
): ProgramParticipationSummary {
  const totalSchools = participations.length;
  if (totalSchools === 0) {
    return {
      totalSchools: 0,
      totalPupils: 0,
      totalParents: 0,
      declarationsCount: 0,
      finalReportsCount: 0,
      completionRate: 0,
    };
  }

  const totalPupils = participations.reduce((sum, p) => sum + (p.pupilsCount || 0), 0);
  const totalParents = participations.reduce((sum, p) => sum + (p.parentsCount || 0), 0);
  const declarationsCount = participations.filter((p) => p.hasDeclaration).length;
  const finalReportsCount = participations.filter((p) => p.hasFinalReport).length;

  return {
    totalSchools,
    totalPupils,
    totalParents,
    declarationsCount,
    finalReportsCount,
    completionRate: Math.round((finalReportsCount / totalSchools) * 100),
  };
}
