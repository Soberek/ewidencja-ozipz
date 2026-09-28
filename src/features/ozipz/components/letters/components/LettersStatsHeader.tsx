import { Mail, Send, Inbox, FolderGit2 } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import type { OzipzLetter } from "../../../types/ozipz.types";

export interface LettersStatsHeaderProps {
  total?: number;
  outgoing?: number;
  incoming?: number;
  withCaseSign?: number;
  letters?: OzipzLetter[];
}

export function LettersStatsHeader({
  total,
  outgoing,
  incoming,
  withCaseSign,
  letters,
}: LettersStatsHeaderProps) {
  const totalCount = total ?? letters?.length ?? 0;
  const outgoingCount = outgoing ?? letters?.filter((l) => l.direction === "wychodzace").length ?? 0;
  const incomingCount = incoming ?? letters?.filter((l) => l.direction === "przychodzace").length ?? 0;
  const caseSignCount = withCaseSign ?? letters?.filter((l) => Boolean(l.caseSign && l.caseSign.trim())).length ?? 0;

  return (
    <StatsGrid>
      <MetricCard
        title="Wszystkie Pisma"
        value={totalCount}
        subtext="Dziennik korespondencji"
        icon={<Mail className="size-4" />}
        variant="default"
      />

      <MetricCard
        title="Pisma Wychodzące"
        value={outgoingCount}
        subtext="Wysłane do placówek i instytucji"
        icon={<Send className="size-4" />}
        variant="blue"
      />

      <MetricCard
        title="Pisma Przychodzące"
        value={incomingCount}
        subtext="Wpływające zgłoszenia i zapytania"
        icon={<Inbox className="size-4" />}
        variant="emerald"
      />

      <MetricCard
        title="Ze Znakiem Sprawy JRWA"
        value={caseSignCount}
        subtext="Przypisane do teczek rzeczowych"
        icon={<FolderGit2 className="size-4" />}
        variant="purple"
      />
    </StatsGrid>
  );
}
