import { Package, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiToggleButton } from "@/components/ui/filter-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";

export interface MaterialsViewSwitcherProps {
  activeTab: "catalog" | "distributions";
  onTabChange: (tab: "catalog" | "distributions") => void;
  materialsCount: number;
  distributionsCount: number;
  onOpenAddMaterial: () => void;
  onOpenAddDistribution: () => void;
  isKpiVisible?: boolean;
  onToggleKpi?: () => void;
}

export function MaterialsViewSwitcher({
  activeTab,
  onTabChange,
  materialsCount,
  distributionsCount,
  onOpenAddMaterial,
  onOpenAddDistribution,
  isKpiVisible = true,
  onToggleKpi,
}: MaterialsViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 select-none">
      <SegmentedControl
        aria-label="Widok modułu materiałów"
        value={activeTab}
        onChange={onTabChange}
        options={[
          { value: "catalog", label: "Katalog Materiałów", icon: Package, count: materialsCount },
          { value: "distributions", label: "Ewidencja Rozdzielników", icon: Send, count: distributionsCount },
        ]}
      />

      <div className="flex items-center gap-1.5">
        {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} />}
        {activeTab === "catalog" ? (
          <Button onClick={onOpenAddMaterial}>
            <Plus className="size-3.5" />
            <span>Nowy Materiał</span>
          </Button>
        ) : (
          <Button onClick={onOpenAddDistribution}>
            <Plus className="size-3.5" />
            <span>Nowy Rozdzielnik</span>
          </Button>
        )}
      </div>
    </div>
  );
}
