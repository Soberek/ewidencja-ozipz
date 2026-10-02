import type {
  OzipzAction,
  OzipzFacility,
  OzipzSchoolParticipation,
  OzipzDistribution,
} from "../../types/ozipz.types";
import type { SyntheticActionMetrics } from "./actionMetrics";
import type { ProgramParticipationSummary } from "./programReach";
import type { AudienceGroupStatItem } from "./actionDistributions";

export interface MunicipalityDetailedRow {
  municipality: string;
  facilitiesCount: number;
  participationsCount: number;
  programsCount: number;
  actionsCount: number;
  actionsRecipients?: number;
  pupilsCount: number;
  materialsDistributed: number;
  finalReportsCount: number;
  reportingRate: number;
}

interface MunicipalityAccumulator {
  facilitiesSet: Set<string>;
  participationsCount: number;
  programsSet: Set<string>;
  actionsCount: number;
  actionsRecipients: number;
  pupilsCount: number;
  materialsDistributed: number;
  finalReportsCount: number;
}

const createAccumulator = (): MunicipalityAccumulator => ({
  facilitiesSet: new Set(),
  participationsCount: 0,
  programsSet: new Set(),
  actionsCount: 0,
  actionsRecipients: 0,
  pupilsCount: 0,
  materialsDistributed: 0,
  finalReportsCount: 0,
});

export function calculateMunicipalityDetailedBreakdown(
  participations: OzipzSchoolParticipation[],
  actions: OzipzAction[],
  facilities: OzipzFacility[] = [],
  distributions: OzipzDistribution[] = [],
  knownMunicipalities: string[] = []
): MunicipalityDetailedRow[] {
  const allMuniKeys = new Set<string>([
    "Myślibórz", "Barlinek", "Dębno", "Nowogródek Pomorski", "Boleszkowice",
    ...knownMunicipalities.filter(Boolean),
    ...facilities.map((f) => f.municipality).filter(Boolean),
    ...participations.map((p) => p.municipality).filter(Boolean),
    ...actions.map((a) => a.municipality).filter(Boolean),
    ...distributions.map((d) => d.municipality || "").filter(Boolean),
  ]);

  const map = new Map<string, MunicipalityAccumulator>();
  for (const m of allMuniKeys) map.set(m, createAccumulator());

  const getEntry = (muni: string): MunicipalityAccumulator => {
    let entry = map.get(muni);
    if (!entry) {
      entry = createAccumulator();
      map.set(muni, entry);
    }
    return entry;
  };

  for (const f of facilities) {
    if (f.municipality) getEntry(f.municipality).facilitiesSet.add(f.id);
  }

  for (const p of participations) {
    const entry = getEntry(p.municipality || "Inna");
    entry.participationsCount += 1;
    if (p.facilityId) entry.facilitiesSet.add(p.facilityId);
    if (p.programId) entry.programsSet.add(p.programId);
    entry.pupilsCount += Number(p.pupilsCount) || 0;
    if (p.hasFinalReport) entry.finalReportsCount += 1;
  }

  for (const a of actions) {
    const entry = getEntry(a.municipality || "Inna");
    entry.actionsCount += Number(a.numberOfActions) || 1;
    const fac = (a.facilityId || a.facilityName || "").trim();
    if (fac) entry.facilitiesSet.add(fac);
    entry.actionsRecipients += (Number(a.participantsCount) || 0);
    entry.materialsDistributed += Number(a.materialsDistributedCount) || 0;
  }

  for (const d of distributions) {
    if (d.municipality && map.has(d.municipality)) {
      map.get(d.municipality)!.materialsDistributed += Number(d.quantity) || 0;
    }
  }

  return Array.from(map.entries())
    .map(([muni, data]) => ({
      municipality: muni,
      facilitiesCount: data.facilitiesSet.size,
      participationsCount: data.participationsCount,
      programsCount: data.programsSet.size,
      actionsCount: data.actionsCount,
      actionsRecipients: data.actionsRecipients,
      pupilsCount: data.pupilsCount,
      materialsDistributed: data.materialsDistributed,
      finalReportsCount: data.finalReportsCount,
      reportingRate: data.participationsCount > 0 ? Math.round((data.finalReportsCount / data.participationsCount) * 100) : 0,
    }))
    .sort((a, b) => b.pupilsCount - a.pupilsCount || b.actionsCount - a.actionsCount);
}

export function generateSubstantiveReportNarrative(params: {
  year: string;
  periodName: string;
  actionsMetrics: SyntheticActionMetrics;
  programsSummary: ProgramParticipationSummary;
  activeProgramsCount: number;
  topAudienceGroups: AudienceGroupStatItem[];
  municipalitiesSummary: MunicipalityDetailedRow[];
  stationName?: string;
}): string {
  const {
    year, periodName, actionsMetrics, programsSummary,
    activeProgramsCount, topAudienceGroups, municipalitiesSummary,
    stationName = "Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu - Sekcja OZiPZ",
  } = params;

  const totalReached = actionsMetrics.totalRecipients + programsSummary.totalPupils;
  const topGroupsText = topAudienceGroups.slice(0, 4).map((g) => `${g.group} (${g.recipients.toLocaleString("pl-PL")} os.)`).join(", ");

  return `SPRAWOZDANIE OPISOWE I MIERNIKI Z DZIAŁALNOŚCI OŚWIATOWO-ZDROWOTNEJ
Jednostka: ${stationName}
Okres sprawozdawczy: ${periodName} (Rok ${year})

1. PODSUMOWANIE MIERNIKÓW SYNTEZOWYCH (DZ / ODB / MAT):
W analizowanym okresie sprawozdawczym Sekcja Oświaty Zdrowotnej i Promocji Zdrowia zrealizowała łącznie ${actionsMetrics.dzCount} działań i interwencji edukacyjnych.
- Liczba odbiorców działań (ODB): ${actionsMetrics.totalRecipients.toLocaleString("pl-PL")} osób.
- Łączna liczba rozdystrybuowanych materiałów oświatowych (MAT): ${actionsMetrics.materialsDistributed.toLocaleString("pl-PL")} szt. (broszury, poradniki, ulotki, plakaty informacyjne).

2. REALIZACJA PROGRAMÓW PROFILAKTYCZNO-EDUKACYJNYCH (MZ / GIS):
Na terenie powiatu prowadzono ${activeProgramsCount} programów edukacyjnych rekomendowanych przez Główny Inspektorat Sanitarny oraz Ministerstwo Zdrowia.
- Łączna liczba placówek oświatowo-wychowawczych biorących udział: ${programsSummary.totalSchools} zgłoszonych placówek.
- Łączna liczba objętych dzieci i młodzieży szkolnej: ${programsSummary.totalPupils.toLocaleString("pl-PL")} uczniów.
- Wskaźnik kompletności nadesłanych sprawozdań końcowych z placówek: ${programsSummary.completionRate}% (${programsSummary.finalReportsCount} z ${programsSummary.totalSchools} placówek).

3. STRUKTURA ODBIORCÓW I AKTYWNOŚĆ TERYTORIALNA:
Główne grupy docelowe prowadzonych działań to: ${topGroupsText || "Uczniowie szkół podstawowych, przedszkolaki oraz młodzież szkół ponadpodstawowych"}.
Działania profilaktyczne realizowano we wszystkich gminach powiatu, obejmując:
${municipalitiesSummary.map((m) => `  • Gmina ${m.municipality}: ${m.facilitiesCount} placówek, ${m.actionsCount} działań terenowych, ${m.pupilsCount.toLocaleString("pl-PL")} objętych uczniów`).join("\n")}

Łączny zasięg oddziaływania oświatowo-zdrowotnego Sekcji OZiPZ wyniósł szacunkowo ${totalReached.toLocaleString("pl-PL")} kontaktów edukacyjnych.`;
}
