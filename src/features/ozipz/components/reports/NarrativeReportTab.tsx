import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText } from "lucide-react";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
} from "../../types/ozipz.types";
import {
  calculateSyntheticActionMetrics,
  calculateProgramParticipationStats,
  calculateAudienceGroupBreakdown,
  calculateMunicipalityDetailedBreakdown,
  generateSubstantiveReportNarrative,
} from "../../utils/ozipzCalculations";

interface NarrativeReportTabProps {
  actions: OzipzAction[];
  programs: OzipzProgram[];
  participations: OzipzSchoolParticipation[];
  year: string;
}

export function NarrativeReportTab({
  actions,
  programs,
  participations,
  year,
}: NarrativeReportTabProps) {
  const [copied, setCopied] = useState(false);

  const yearActions = actions.filter((a) => !a.date || year === "all" || a.date.startsWith(year));
  const metrics = calculateSyntheticActionMetrics(yearActions);
  const progStats = calculateProgramParticipationStats(participations);
  const audience = calculateAudienceGroupBreakdown(yearActions);
  const muni = calculateMunicipalityDetailedBreakdown(participations, yearActions);

  const narrativeText = generateSubstantiveReportNarrative({
    year,
    periodName: year === "all" ? "Cały okres" : `Rok ${year}`,
    actionsMetrics: metrics,
    programsSummary: progStats,
    activeProgramsCount: programs.length,
    topAudienceGroups: audience,
    municipalitiesSummary: muni,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Opisowe Sprawozdanie Merytoryczne (Gotowe do Kopiowania)
            </h3>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            {copied ? "Skopiowano treść!" : "Kopiuj sprawozdanie"}
          </Button>
        </div>

        <div className="p-4 rounded-[2px] bg-muted/40 border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
          {narrativeText}
        </div>
      </Card>
    </div>
  );
}
