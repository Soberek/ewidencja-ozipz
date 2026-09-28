export type ReportAnnexKind = "programowe" | "nieprogramowe";

export interface ReportAnnexRow {
  kind: ReportAnnexKind;
  programName: string;
  jrwa: string;
  actionName: string;
  actions: number;
  visits: number;
  people: number;
}

export interface AnnexReportItem {
  lp: number | string;
  name: string;
  jrwa?: string;
  actionsCount: number;
  participantsCount: number;
}

export interface AnnexReportData {
  programs: AnnexReportItem[];
  totalActions: number;
  totalParticipants: number;
}

export interface ReportHierarchyAction {
  actionName: string;
  actions: number;
  visits: number;
  people: number;
}

export interface ReportHierarchyGroup {
  kind: ReportAnnexKind;
  programName: string;
  jrwa: string;
  actions: ReportHierarchyAction[];
  totalActions: number;
  totalVisits: number;
  totalPeople: number;
}

export interface ReportHierarchySection {
  kind: ReportAnnexKind;
  label: string;
  groups: ReportHierarchyGroup[];
  totalActions: number;
  totalVisits: number;
  totalPeople: number;
}

export type ProgramsData = {
  [programType: string]: {
    [programName: string]: {
      [actionName: string]: {
        people: number;
        actionNumber: number;
      };
    };
  };
};

export interface AggregatedMiernikData {
  aggregated: ProgramsData;
  allPeople: number;
  allActions: number;
  warnings: string[];
}
