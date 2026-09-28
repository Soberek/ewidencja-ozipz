import { useEffect } from "react";
import { toast } from "sonner";
import { checkForAppUpdate, installAppUpdate, type Update } from "@/lib/appUpdater";

/** Pobiera i instaluje aktualizację, pokazując postęp w jednym powiadomieniu. */
export async function runUpdateInstall(update: Update): Promise<void> {
  const id = toast.loading(`Pobieranie wersji ${update.version}…`);
  try {
    await installAppUpdate(update, (percent) => {
      toast.loading(percent === null ? `Pobieranie wersji ${update.version}…` : `Pobieranie wersji ${update.version}… ${percent}%`, { id });
    });
  } catch (error) {
    toast.error(`Nie udało się zainstalować aktualizacji: ${error instanceof Error ? error.message : String(error)}`, { id });
  }
}

/**
 * Po starcie aplikacji desktopowej sprawdza raz, czy jest nowsza wersja.
 * Brak internetu lub niedostępne wydania nie są zgłaszane — ręczne sprawdzenie jest w Ustawieniach.
 */
export function useStartupUpdateCheck(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    checkForAppUpdate()
      .then((update) => {
        if (!update || cancelled) return;
        toast(`Dostępna jest nowa wersja ${update.version}`, {
          description: "Aktualizacja zajmie chwilę, a aplikacja uruchomi się ponownie. Dane pozostaną bez zmian.",
          duration: Infinity,
          action: { label: "Zainstaluj", onClick: () => void runUpdateInstall(update) },
          cancel: { label: "Później", onClick: () => undefined },
        });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [enabled]);
}
