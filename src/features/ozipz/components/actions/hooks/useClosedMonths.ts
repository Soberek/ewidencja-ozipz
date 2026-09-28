import { useCallback, useEffect, useMemo, useState } from "react";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";

export function useClosedMonths() {
  const monthKeys = useOzipzDbStore((state) => state.closedMonths);
  const refreshClosedMonths = useOzipzDbStore((state) => state.refreshClosedMonths);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const refresh = useCallback(async () => {
    // Odświeżenie w tle (np. po powrocie do okna) nie blokuje formularza; blokady i tak egzekwuje baza danych.
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      await refreshClosedMonths();
      setStatus("ready");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, [refreshClosedMonths]);

  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { closedMonths: useMemo(() => new Set(monthKeys), [monthKeys]), status, refresh };
}
