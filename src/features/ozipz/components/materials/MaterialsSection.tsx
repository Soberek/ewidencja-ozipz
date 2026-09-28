import { useState, useMemo } from "react";
import { toast } from "sonner";
import type {
  OzipzMaterial,
  OzipzDistribution,
  OzipzDictionaryItem,
  OzipzAction,
  OzipzProgram,
} from "../../types/ozipz.types";
import { useMaterials } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { RozdzielnikBlankietDialog } from "./RozdzielnikBlankietDialog";
import { MaterialsStatsHeader } from "./components/MaterialsStatsHeader";
import { MaterialsViewSwitcher } from "./components/MaterialsViewSwitcher";
import { MaterialsCatalogTab } from "./components/MaterialsCatalogTab";
import { MaterialsDistributionsTab } from "./components/MaterialsDistributionsTab";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface MaterialsSectionProps {
  materials?: OzipzMaterial[];
  distributions?: OzipzDistribution[];
  materialTypes?: OzipzDictionaryItem[];
  municipalities?: string[];
  programs?: OzipzProgram[];
  actions?: OzipzAction[];
  defaultTab?: "catalog" | "distributions";
  onOpenAddMaterial?: () => void;
  onOpenAddDistribution?: (materialId?: string) => void;
  onOpenEditMaterial?: (material: OzipzMaterial) => void;
  onOpenEditDistribution?: (distribution: OzipzDistribution) => void;
  onDeleteMaterial?: (id: string) => void;
  onDeleteDistribution?: (id: string) => void;
}

export function MaterialsSection(props: MaterialsSectionProps) {
  const materialsStore = useMaterials();
  const openModal = useModalStore((s) => s.openModal);

  const materials = props.materials ?? materialsStore.materials;
  const distributions = props.distributions ?? materialsStore.distributions;
  const materialTypes = props.materialTypes ?? materialsStore.materialTypes;

  const onOpenAddMaterial = props.onOpenAddMaterial ?? (() => openModal("material"));
  const onOpenAddDistribution =
    props.onOpenAddDistribution ??
    ((materialId?: string) => openModal("distribution", { initialMaterialId: materialId }));
  const onOpenEditMaterial =
    props.onOpenEditMaterial ?? ((material: OzipzMaterial) => openModal("material", { item: material }));
  const onOpenEditDistribution =
    props.onOpenEditDistribution ??
    ((distribution: OzipzDistribution) => openModal("distribution", { item: distribution }));

  const onDeleteMaterial =
    props.onDeleteMaterial ??
    (async (id: string) => {
      try {
        await materialsStore.deleteMaterial(id);
        toast.success("Usunięto materiał oświatowy");
      } catch {
        toast.error("Błąd podczas usuwania materiału");
      }
    });

  const onDeleteDistribution =
    props.onDeleteDistribution ??
    (async (id: string) => {
      try {
        await materialsStore.deleteDistribution(id);
        toast.success("Usunięto rozdzielnik materiałów");
      } catch {
        toast.error("Błąd podczas usuwania rozdzielnika");
      }
    });

  const [activeTab, setActiveTab] = useState<"catalog" | "distributions">(
    props.defaultTab ?? "catalog"
  );
  const [selectedBlankiet, setSelectedBlankiet] = useState<OzipzDistribution | null>(null);

  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("materials");

  // Statystyki
  const stats = useMemo(() => {
    const totalTitles = materials.length;
    const totalDistributed = distributions.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);
    const distributionsCount = distributions.length;
    const totalStock = totalDistributed;

    return {
      totalTitles,
      totalStock,
      totalDistributed,
      distributionsCount,
    };
  }, [materials, distributions]);

  return (
    <div className="space-y-4">
      {/* KPI Stats Header - zwijany */}
      {showKpiSummary && (
        <MaterialsStatsHeader
          totalTitles={stats.totalTitles}
          totalStock={stats.totalStock}
          totalDistributed={stats.totalDistributed}
          distributionsCount={stats.distributionsCount}
        />
      )}

      {/* Switcher & Add Actions */}
      <MaterialsViewSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        materialsCount={stats.totalTitles}
        distributionsCount={stats.distributionsCount}
        onOpenAddMaterial={onOpenAddMaterial}
        onOpenAddDistribution={() => onOpenAddDistribution()}
        isKpiVisible={showKpiSummary}
        onToggleKpi={toggleKpiSummary}
      />

      {/* Aktywna zakładka */}
      {activeTab === "catalog" ? (
        <MaterialsCatalogTab
          materials={materials}
          materialTypes={materialTypes}
          onOpenAdd={onOpenAddMaterial}
          onEdit={onOpenEditMaterial}
          onDelete={onDeleteMaterial}
          onOpenAddDistribution={onOpenAddDistribution}
        />
      ) : (
        <MaterialsDistributionsTab
          distributions={distributions}
          materials={materials}
          municipalities={props.municipalities}
          onOpenAdd={() => onOpenAddDistribution()}
          onEdit={onOpenEditDistribution}
          onDelete={onDeleteDistribution}
          onOpenBlankiet={setSelectedBlankiet}
        />
      )}

      {/* Dialog podglądu i druku blankietu rozdzielnika */}
      {selectedBlankiet && (
        <RozdzielnikBlankietDialog
          open={!!selectedBlankiet}
          onOpenChange={(open) => !open && setSelectedBlankiet(null)}
          distribution={selectedBlankiet}
        />
      )}
    </div>
  );
}

export default MaterialsSection;
