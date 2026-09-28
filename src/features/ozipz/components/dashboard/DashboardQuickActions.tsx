import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Package } from "lucide-react";

interface DashboardQuickActionsProps {
  onOpenAddAction: () => void;
  onOpenAddParticipation: () => void;
  onOpenAddDistribution: () => void;
}

export function DashboardQuickActions({
  onOpenAddAction,
  onOpenAddParticipation,
  onOpenAddDistribution,
}: DashboardQuickActionsProps) {
  return (
    <Card className="p-3.5 bg-card border border-border rounded-[3px] shadow-none flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Szybkie Rejestrowanie w Bazie OZiPZ
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Wybierz operację, aby dodać nowy rekord do bazy SQLite
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          onClick={onOpenAddAction}
          className="h-8 rounded-[3px] text-xs font-semibold shadow-none cursor-pointer"
        >
          <Plus className="size-3.5 mr-1" /> Nowe Działanie
          <kbd className="ml-1.5 px-1 py-0.5 text-[9.5px] font-mono bg-primary-foreground/20 rounded font-normal hidden sm:inline-block">
            ⌘N
          </kbd>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenAddParticipation}
          className="h-8 rounded-[3px] text-xs font-semibold text-foreground hover:bg-muted/50 shadow-none cursor-pointer"
        >
          <GraduationCap className="size-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Zgłoszenie
          Szkoły
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenAddDistribution}
          className="h-8 rounded-[3px] text-xs font-semibold text-foreground hover:bg-muted/50 shadow-none cursor-pointer"
        >
          <Package className="size-3.5 mr-1 text-amber-600 dark:text-amber-400" /> Rozdzielnik
          Materiałów
        </Button>
      </div>
    </Card>
  );
}
