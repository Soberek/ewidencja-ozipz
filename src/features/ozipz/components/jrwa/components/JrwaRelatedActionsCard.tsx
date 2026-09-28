import { Badge } from "@/components/ui/badge";
import type { OzipzAction } from "../../../types/ozipz.types";

interface JrwaRelatedActionsCardProps {
  relatedActions: OzipzAction[];
}

export function JrwaRelatedActionsCard({ relatedActions }: JrwaRelatedActionsCardProps) {
  if (relatedActions.length === 0) return null;

  const requiresEzd = relatedActions.some(
    (a) => a.ezdStatus === "do_ezd" || (!a.ezdStatus && a.actionType !== "Publikacja media")
  );

  return (
    <div className="p-3.5 bg-muted/20 border border-border/80 rounded-[3px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider block">
          Powiązane Działania Edukacyjne ({relatedActions.length})
        </span>
        {requiresEzd ? (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold"
          >
            Wymaga wpisu do EZD
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold"
          >
            Wszystkie w EZD
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 mt-2">
        {relatedActions.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between p-2 rounded-[2px] bg-background border border-border text-xs"
          >
            <div className="min-w-0 flex-1 mr-2">
              <p className="font-semibold text-foreground truncate">{act.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {act.date} • {act.facilityName}
              </p>
            </div>
            <div>
              {act.ezdStatus === "do_ezd" ? (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold"
                >
                  ! Do EZD
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold"
                >
                  w EZD
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
