import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";
import { useClosedMonths } from "./useClosedMonths";

export function useActionToolsState() {
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const { closedMonths, status: locksStatus, refresh: refreshClosedMonths } = useClosedMonths();
  const setMonthClosed = useOzipzDbStore((state) => state.setMonthClosed);
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);

  const toggleMonthLock = useCallback(async (monthKey: string) => {
    if (pendingMonth) return;
    setPendingMonth(monthKey);
    try {
      if (!(await refreshClosedMonths())) throw new Error("Nie można odczytać blokad miesięcy.");
      const isClosed = useOzipzDbStore.getState().closedMonths.includes(monthKey);
      await setMonthClosed(monthKey, !isClosed);
    } catch {
      toast.error("Nie udało się zmienić blokady miesiąca.");
    } finally {
      setPendingMonth(null);
    }
  }, [pendingMonth, refreshClosedMonths, setMonthClosed]);

  const [copiedSignId, setCopiedSignId] = useState<string | null>(null);
  const handleCopySign = useCallback((id: string, sign: string) => {
    navigator.clipboard.writeText(sign);
    setCopiedSignId(id);
    toast.success(`Skopiowano znak: ${sign}`);
    setTimeout(() => setCopiedSignId(null), 2000);
  }, []);

  return {
    isMonthModalOpen,
    setIsMonthModalOpen,
    closedMonths,
    locksStatus,
    refreshClosedMonths,
    pendingMonth,
    toggleMonthLock,
    copiedSignId,
    handleCopySign,
  };
}
