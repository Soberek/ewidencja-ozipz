import { useState, useMemo, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzStaff } from "../../types/ozipz.types";
import { useStaff } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { toast } from "sonner";
import { StaffStatsHeader } from "./components/StaffStatsHeader";
import { StaffFilterBar } from "./components/StaffFilterBar";
import { StaffTableView } from "./components/StaffTableView";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface StaffSectionProps {
  staff?: OzipzStaff[];
  onOpenAdd?: () => void;
  onOpenEdit?: (staff: OzipzStaff) => void;
  onDelete?: (id: string) => void;
}

export function StaffSection(props: StaffSectionProps) {
  const staffStore = useStaff();
  const openModal = useModalStore((s) => s.openModal);

  const staff = props.staff ?? staffStore.staff;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("staff"));
  const onOpenEdit = props.onOpenEdit ?? ((staffItem: OzipzStaff) => openModal("staff", { item: staffItem }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await staffStore.deleteStaff(id);
        toast.success("Usunięto pracownika z kadry");
      } catch {
        toast.error("Błąd podczas usuwania pracownika");
      }
    });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("staff");

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (statusFilter === "active" && !s.active) return false;
      if (statusFilter === "inactive" && s.active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = (s.fullName || "").toLowerCase().includes(q);
        const mRole = (s.role || "").toLowerCase().includes(q);
        const mSpec = (s.specialization || "").toLowerCase().includes(q);
        if (!mName && !mRole && !mSpec) return false;
      }
      return true;
    });
  }, [staff, statusFilter, search]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">
        {showKpiSummary && <StaffStatsHeader staff={staff} />}

        <StaffFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          isKpiVisible={showKpiSummary}
          onToggleKpi={toggleKpiSummary}
          onOpenAdd={onOpenAdd}
        />

        <StaffTableView
          staff={filteredStaff}
          totalCount={staff.length}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || statusFilter !== "all"}
        />
      </div>
    </TooltipProvider>
  );
}
