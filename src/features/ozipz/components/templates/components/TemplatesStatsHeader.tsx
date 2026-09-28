import { FileText, Layers, Bookmark, Users } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import type { OzipzTemplate } from "../../../types/ozipz.types";

export interface TemplatesStatsHeaderProps {
  templates: OzipzTemplate[];
}

export function TemplatesStatsHeader({ templates }: TemplatesStatsHeaderProps) {
  const total = templates.length;
  const uniqueForms = new Set(templates.map((t) => t.actionType).filter(Boolean)).size;
  const uniqueTopics = new Set(templates.map((t) => t.topic).filter(Boolean)).size;
  const uniqueAudiences = new Set(templates.flatMap((t) => (t.defaultAudience || "").split(";").map((group) => group.trim()).filter(Boolean))).size;

  return (
    <StatsGrid>
      <MetricCard
        title="Wszystkie Szablony"
        value={total}
        subtext="Zapisane wzorce zadań"
        icon={<FileText className="size-4" />}
        variant="default"
      />

      <MetricCard
        title="Formy Działań"
        value={uniqueForms}
        subtext="Zdefiniowane rodzaje zadań"
        icon={<Layers className="size-4" />}
        variant="blue"
      />

      <MetricCard
        title="Obszary Tematyczne"
        value={uniqueTopics}
        subtext="Zagadnienia profilaktyczne"
        icon={<Bookmark className="size-4" />}
        variant="purple"
      />

      <MetricCard
        title="Grupy Docelowe"
        value={uniqueAudiences}
        subtext="Domyślni odbiorcy"
        icon={<Users className="size-4" />}
        variant="emerald"
      />
    </StatsGrid>
  );
}
