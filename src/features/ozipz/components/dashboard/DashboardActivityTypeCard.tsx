import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface ActionTypeStatItem {
  type: string;
  count: number;
  participants: number;
}

interface DashboardActivityTypeCardProps {
  typeStats: ActionTypeStatItem[];
}

export function DashboardActivityTypeCard({ typeStats }: DashboardActivityTypeCardProps) {
  return (
    <Card className="p-3.5 bg-card border border-border rounded-[3px] shadow-none space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
        <TrendingUp className="size-3.5 text-indigo-600 dark:text-indigo-400" />
        Struktura Form Działań
      </h3>
      <div className="space-y-1.5 text-xs">
        {typeStats.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2 text-center">
            Brak zarejestrowanych działań
          </p>
        ) : (
          typeStats.slice(0, 5).map((stat) => (
            <div
              key={stat.type}
              className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/60 last:border-0"
            >
              <span className="capitalize text-muted-foreground">{stat.type.replace("_", " ")}</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-foreground">{stat.count} dz.</span>
                <span className="text-muted-foreground text-[10px]">({stat.participants} os.)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
