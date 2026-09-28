import type { OzipzFacility, OzipzProgram } from "../features/ozipz/types/ozipz.types";

/** Names are current while linked; detached records retain their last known name. */
export function resolveReferenceNames<T extends { facilityId?: string; programId?: string }>(
  rows: T[], facilities: OzipzFacility[], programs: OzipzProgram[]
): T[] {
  const facilityMap = new Map(facilities.map((row) => [row.id, row]));
  const programMap = new Map(programs.map((row) => [row.id, row]));
  return rows.map((row) => {
    const facility = row.facilityId ? facilityMap.get(row.facilityId) : undefined;
    const program = row.programId ? programMap.get(row.programId) : undefined;
    return {
      ...row,
      ...(facility && "facilityName" in row ? { facilityName: facility.name } : {}),
      ...(facility && "municipality" in row ? { municipality: facility.municipality } : {}),
      ...(program && "programName" in row ? { programName: program.name } : {}),
    };
  });
}
