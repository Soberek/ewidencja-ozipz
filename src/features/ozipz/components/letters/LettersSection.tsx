import { useState, useMemo, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzLetter } from "../../types/ozipz.types";
import { useLetters } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { toast } from "sonner";
import { LettersStatsHeader } from "./components/LettersStatsHeader";
import { LettersFilterBar } from "./components/LettersFilterBar";
import { LettersTableView } from "./components/LettersTableView";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface LettersSectionProps {
  letters?: OzipzLetter[];
  onOpenAdd?: () => void;
  onOpenEdit?: (letter: OzipzLetter) => void;
  onDelete?: (id: string) => void;
}

export function LettersSection(props: LettersSectionProps) {
  const lettersStore = useLetters();
  const openModal = useModalStore((s) => s.openModal);

  const letters = props.letters ?? lettersStore.letters;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("letter"));
  const onOpenEdit = props.onOpenEdit ?? ((letter: OzipzLetter) => openModal("letter", { item: letter }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await lettersStore.deleteLetter(id);
        toast.success("Usunięto pismo");
      } catch {
        toast.error("Błąd podczas usuwania pisma");
      }
    });

  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("letters");

  const stats = useMemo(() => {
    const total = letters.length;
    const outgoing = letters.filter((l) => l.direction === "wychodzace").length;
    const incoming = letters.filter((l) => l.direction === "przychodzace").length;
    const withCaseSign = letters.filter((l) => Boolean(l.caseSign && l.caseSign.trim())).length;
    return { total, outgoing, incoming, withCaseSign };
  }, [letters]);

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      if (directionFilter !== "all" && l.direction !== directionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mNum = (l.letterNumber || "").toLowerCase().includes(q);
        const mSub = (l.subject || "").toLowerCase().includes(q);
        const mRec = (l.senderRecipient || "").toLowerCase().includes(q);
        if (!mNum && !mSub && !mRec) return false;
      }
      return true;
    });
  }, [letters, directionFilter, search]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setDirectionFilter("all");
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">
        {showKpiSummary && (
          <LettersStatsHeader
            total={stats.total}
            outgoing={stats.outgoing}
            incoming={stats.incoming}
            withCaseSign={stats.withCaseSign}
          />
        )}

        <LettersFilterBar
          search={search}
          onSearchChange={setSearch}
          directionFilter={directionFilter}
          onDirectionFilterChange={setDirectionFilter}
          isKpiVisible={showKpiSummary}
          onToggleKpi={toggleKpiSummary}
          onOpenAdd={onOpenAdd}
        />

        <LettersTableView
          letters={filteredLetters}
          totalCount={letters.length}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || directionFilter !== "all"}
        />
      </div>
    </TooltipProvider>
  );
}
