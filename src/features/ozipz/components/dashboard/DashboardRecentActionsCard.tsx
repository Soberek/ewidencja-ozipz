import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HealthPromotionTab, OzipzAction } from "../../types/ozipz.types";

interface DashboardRecentActionsCardProps {
  actionsCount: number;
  recentActions: OzipzAction[];
  onNavigateTab: (tab: HealthPromotionTab) => void;
  onOpenAddAction: () => void;
}

export function DashboardRecentActionsCard({
  actionsCount,
  recentActions,
  onNavigateTab,
  onOpenAddAction,
}: DashboardRecentActionsCardProps) {
  return (
    <Card className="p-3.5 bg-card border border-border rounded-[3px] shadow-none space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <FileCheck className="size-3.5 text-primary" />
          Ostatnio Zarejestrowane Działania Edukacyjne
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigateTab("dzialania")}
          className="h-6 text-[11px] text-primary hover:text-primary/80 hover:bg-primary/10 font-bold gap-0.5 px-1.5 rounded-[2px]"
        >
          Wszystkie działania ({actionsCount}) <ChevronRight className="size-3" />
        </Button>
      </div>

      {recentActions.length === 0 ? (
        <EmptyState
          title="Brak zarejestrowanych działań"
          description="Kliknij 'Nowe Działanie', aby dodać pierwsze przedsięwzięcie."
          actionLabel="Nowe Działanie"
          onAction={onOpenAddAction}
        />
      ) : (
        <div className="space-y-1.5">
          {recentActions.map((act) => {
            const topicLabel = act.programName || act.topic || "OZiPZ";
            return (
              <div
                key={act.id}
                className="relative p-2.5 rounded-[3px] border border-border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground truncate">{act.title}</span>
                    <Badge
                      variant="outline"
                      className="text-[9.5px] py-0 px-1.5 rounded-[2px] font-mono border-border text-foreground bg-muted/30"
                    >
                      {topicLabel}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {act.facilityName} • {act.municipality} • Edukator: {act.leadEducator}
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className="font-mono font-bold text-xs text-foreground">
                    {act.participantsCount} os.
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{act.date}</span>
                </div>
                <button type="button" aria-label={`Otwórz rejestr działań: ${act.title}`} onClick={() => onNavigateTab("dzialania")} className="absolute inset-0 cursor-pointer rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
