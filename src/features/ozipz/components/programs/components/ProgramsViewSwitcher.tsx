import { GraduationCap, BookOpen, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiToggleButton } from "@/components/ui/filter-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type ProgramsView = "schools" | "programs" | "stats";

export interface ProgramsViewSwitcherProps {
  activeTab: ProgramsView;
  onTabChange: (tab: ProgramsView) => void;
  participationsCount: number;
  programsCount: number;
  onOpenAddParticipation: () => void;
  onOpenAddProgram: () => void;
  isKpiVisible?: boolean;
  onToggleKpi?: () => void;
}

export function ProgramsViewSwitcher({
  activeTab,
  onTabChange,
  participationsCount,
  programsCount,
  onOpenAddParticipation,
  onOpenAddProgram,
  isKpiVisible = true,
  onToggleKpi,
}: ProgramsViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 select-none">
      <SegmentedControl
        aria-label="Widok modułu programów"
        value={activeTab}
        onChange={onTabChange}
        options={[
          { value: "schools", label: "Zgłoszenia Szkół", icon: GraduationCap, count: participationsCount },
          { value: "programs", label: "Katalog Programów", icon: BookOpen, count: programsCount },
          { value: "stats", label: "Statystyki", icon: BarChart3 },
        ]}
      />

      <div className="flex items-center gap-1.5">
        {onToggleKpi && activeTab !== "stats" && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
        {activeTab === "programs" ? (
          <Button onClick={onOpenAddProgram}>
            <Plus className="size-3.5" />
            <span>Nowy Program</span>
          </Button>
        ) : (
          <Button onClick={onOpenAddParticipation}>
            <Plus className="size-3.5" />
            <span>Dodaj Zgłoszenie</span>
          </Button>
        )}
      </div>
    </div>
  );
}
