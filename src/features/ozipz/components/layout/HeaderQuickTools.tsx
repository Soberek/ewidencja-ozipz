import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AlarmClock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useGlobalSearchStore } from "../../store/useGlobalSearchStore";
import { collectDeadlines } from "../../utils/deadlineUtils";

/** Przycisk globalnej wyszukiwarki i licznik pilnych terminów w nagłówku aplikacji. */
export function HeaderQuickTools() {
  const openSearch = useGlobalSearchStore((state) => state.open);
  const navigate = useNavigate();
  const sources = useOzipzDbStore(useShallow((state) => ({
    isInitialized: state.isInitialized, letters: state.letters, scheduleEvents: state.scheduleEvents,
    actions: state.actions, programs: state.programs, closedMonths: state.closedMonths,
  })));
  const urgent = useMemo(
    () => sources.isInitialized ? collectDeadlines(sources).filter((item) => item.severity !== "soon").length : 0,
    [sources]
  );

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={openSearch}
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        title="Szukaj we wszystkich modułach (Ctrl+K)"
      >
        <Search className="size-3.5" />
        <span className="hidden md:inline">Szukaj</span>
        <kbd className="hidden rounded-[2px] border border-border px-1 text-[10px] lg:inline">Ctrl K</kbd>
      </Button>
      {urgent > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/")}
          className={cn("h-7 gap-1 px-2 text-xs font-bold text-destructive")}
          title="Terminy dziś lub po terminie — zobacz na pulpicie"
          aria-label={`${urgent} pilnych terminów — przejdź do pulpitu`}
        >
          <AlarmClock className="size-4" /> {urgent}
        </Button>
      )}
    </>
  );
}
