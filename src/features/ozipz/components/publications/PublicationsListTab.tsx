import { useState, useMemo, useCallback } from "react";
import type { OzipzPublication } from "../../types/ozipz.types";
import { PublicationsStatsHeader } from "./components/PublicationsStatsHeader";
import { PublicationsFilterBar, type PublicationChipId } from "./components/PublicationsFilterBar";
import { RegistryReconcileBanner } from "./components/RegistryReconcileBanner";
import { channelFamilyOf } from "./matching/publicationMatcher";
import { PublicationsTableView } from "./components/PublicationsTableView";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

interface PublicationsListTabProps {
  publications: OzipzPublication[];
  onOpenAdd: () => void;
  onOpenEdit: (pub: OzipzPublication) => void;
  onDelete: (id: string) => void | Promise<void>;
  onOpenAction?: (pub: OzipzPublication) => void;
}

export function PublicationsListTab({
  publications,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onOpenAction,
}: PublicationsListTabProps) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [activeChip, setActiveChip] = useState<PublicationChipId>("all");

  const { isKpiVisible, toggleKpi: handleToggleKpi } = useKpiVisibility("publications");
  const isKpiCollapsed = !isKpiVisible;

  // Unikalna lista kanałów z bazy
  const availableChannels = useMemo(() => {
    const set = new Set<string>();
    publications.forEach((p) => {
      if (p.channel) set.add(p.channel);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [publications]);

  const chipCounts = useMemo(() => {
    const counts = { all: publications.length, gov: 0, x: 0, fb: 0, other: 0 };
    publications.forEach((p) => (counts[channelFamilyOf(p.channel)] += 1));
    return counts;
  }, [publications]);

  const handleActiveChipChange = useCallback((chipId: PublicationChipId) => {
    setActiveChip(chipId);
    if (chipId !== "custom") {
      setChannelFilter("all");
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setChannelFilter("all");
    setActiveChip("all");
  }, []);

  const filteredPubs = useMemo(() => {
    return publications.filter((p) => {
      const chan = (p.channel || "").toLowerCase();

      // Filtr szybkiego chipu (rodzina kanału jak w module importu)
      if (activeChip !== "all" && activeChip !== "custom" && channelFamilyOf(p.channel) !== activeChip) return false;

      // Filtr dropdownu kanału
      if (channelFilter !== "all" && p.channel !== channelFilter) return false;

      // Szukajka
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const mTitle = (p.title || "").toLowerCase().includes(q);
        const mAuth = (p.author || "").toLowerCase().includes(q);
        const mTopic = (p.topic || "").toLowerCase().includes(q);
        const mChan = chan.includes(q);
        if (!mTitle && !mAuth && !mTopic && !mChan) return false;
      }

      return true;
    });
  }, [publications, search, channelFilter, activeChip]);

  const isFiltered = Boolean(search.trim() || channelFilter !== "all" || activeChip !== "all");

  return (
    <div className="space-y-3 select-none">
      {!isKpiCollapsed && <PublicationsStatsHeader publications={publications} />}

      <RegistryReconcileBanner />

      <PublicationsFilterBar
        search={search}
        onSearchChange={setSearch}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
        availableChannels={availableChannels}
        activeChip={activeChip}
        onActiveChipChange={handleActiveChipChange}
        chipCounts={chipCounts}
        isKpiCollapsed={isKpiCollapsed}
        onToggleKpi={handleToggleKpi}
        onOpenAdd={onOpenAdd}
        totalCount={publications.length}
        filteredCount={filteredPubs.length}
      />

      <PublicationsTableView
        publications={filteredPubs}
        totalCount={publications.length}
        onOpenEdit={onOpenEdit}
        onDelete={onDelete}
        onOpenAction={onOpenAction}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
    </div>
  );
}
