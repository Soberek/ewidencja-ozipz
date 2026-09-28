import { GraduationCap, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiToggleButton } from "@/components/ui/filter-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";

export interface ProgramsViewSwitcherProps {
  activeTab: "schools" | "programs";
  onTabChange: (tab: "schools" | "programs") => void;
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
        ]}
      />

      <div className="flex items-center gap-1.5">
        {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
        {activeTab === "schools" ? (
          <Button onClick={onOpenAddParticipation}>
            <Plus className="size-3.5" />
            <span>Dodaj Zgłoszenie</span>
          </Button>
        ) : (
          <Button onClick={onOpenAddProgram}>
            <Plus className="size-3.5" />
            <span>Nowy Program</span>
          </Button>
        )}
      </div>
    </div>
  );
}
