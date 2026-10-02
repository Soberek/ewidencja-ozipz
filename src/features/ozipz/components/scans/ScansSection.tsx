import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzScan } from "../../types/ozipz.types";
import { useScans } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { toast } from "sonner";
import { ScansStatsHeader } from "./components/ScansStatsHeader";
import { ScansFilterBar } from "./components/ScansFilterBar";
import { ScansTableView } from "./components/ScansTableView";
import { ScanFilePreviewDialog } from "./components/ScanFilePreviewDialog";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface ScansSectionProps {
  scans?: OzipzScan[];
  onOpenAdd?: () => void;
  onDelete?: (id: string) => void;
  initialScanId?: string;
}

export function ScansSection(props: ScansSectionProps) {
  const scansStore = useScans();
  const openModal = useModalStore((s) => s.openModal);

  const scans = props.scans ?? scansStore.scans;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("scan"));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await scansStore.deleteScan(id);
        toast.success("Usunięto skan");
      } catch {
        toast.error("Błąd podczas usuwania skanu");
      }
    });

  const [search, setSearch] = useState("");
  const [previewScan, setPreviewScan] = useState<OzipzScan | null>(null);
  const openedScanId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!props.initialScanId || openedScanId.current === props.initialScanId) return;
    const scan = scans.find((item) => item.id === props.initialScanId);
    if (scan) { openedScanId.current = scan.id; setPreviewScan(scan); }
  }, [props.initialScanId, scans]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("scans");

  // Unikalne typy dokumentów
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    scans.forEach((s) => {
      if (s.documentType) set.add(s.documentType);
    });
    return Array.from(set)
      .sort()
      .map((t) => ({
        value: t,
        label: t.replace(/_/g, " "),
      }));
  }, [scans]);

  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      if (typeFilter !== "all" && s.documentType !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (s.title || "").toLowerCase().includes(q);
        const mFac = (s.facilityName || "").toLowerCase().includes(q);
        const mProg = (s.programName || "").toLowerCase().includes(q);
        const mDoc = (s.documentType || "").toLowerCase().includes(q);
        if (!mTitle && !mFac && !mProg && !mDoc) return false;
      }
      return true;
    });
  }, [scans, typeFilter, search]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">
        {showKpiSummary && <ScansStatsHeader scans={scans} />}

        <ScansFilterBar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          availableTypes={availableTypes}
          isKpiVisible={showKpiSummary}
          onToggleKpi={toggleKpiSummary}
          onOpenAdd={onOpenAdd}
        />

        <ScansTableView
          scans={filteredScans}
          totalCount={scans.length}
          onDelete={onDelete}
          onOpen={setPreviewScan}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || typeFilter !== "all"}
        />
        <ScanFilePreviewDialog scan={previewScan} onClose={() => setPreviewScan(null)} />
      </div>
    </TooltipProvider>
  );
}
