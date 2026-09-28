import { useEffect, useState } from "react";
import { ArrowUpCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkForAppUpdate, getAppVersion, isDesktopApp, type Update } from "@/lib/appUpdater";
import { runUpdateInstall } from "@/hooks/useStartupUpdateCheck";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "current" }
  | { status: "available"; update: Update }
  | { status: "error"; message: string };

export function AppUpdateCard() {
  const [version, setVersion] = useState<string | null>(null);
  const [state, setState] = useState<CheckState>({ status: "idle" });
  const [installing, setInstalling] = useState(false);
  const desktop = isDesktopApp();

  useEffect(() => {
    void getAppVersion().then(setVersion).catch(() => setVersion(null));
  }, []);

  const handleCheck = async () => {
    setState({ status: "checking" });
    try {
      const update = await checkForAppUpdate();
      setState(update ? { status: "available", update } : { status: "current" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleInstall = async (update: Update) => {
    setInstalling(true);
    await runUpdateInstall(update);
    setInstalling(false);
  };

  return (
    <Card className="p-4 bg-card border-border shadow-none space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
        <ArrowUpCircle className="size-3.5" /> Wersja i aktualizacje
      </h4>
      {desktop ? (
        <>
          <p className="text-xs text-muted-foreground">
            Zainstalowana wersja: <strong className="text-foreground font-mono">{version ?? "…"}</strong>. Aplikacja sprawdza aktualizacje przy każdym uruchomieniu.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={state.status === "checking" || installing} onClick={() => void handleCheck()} className="gap-1.5 text-xs">
              <RefreshCw className={state.status === "checking" ? "size-3.5 animate-spin" : "size-3.5"} /> Sprawdź aktualizacje
            </Button>
            {state.status === "available" && (
              <Button size="sm" disabled={installing} onClick={() => void handleInstall(state.update)} className="gap-1.5 text-xs">
                <ArrowUpCircle className="size-3.5" /> Zainstaluj wersję {state.update.version}
              </Button>
            )}
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {state.status === "current" && "Masz najnowszą wersję."}
            {state.status === "available" && "Aplikacja zamknie się na czas instalacji i uruchomi ponownie. Dane pozostaną bez zmian."}
            {state.status === "error" && `Nie udało się sprawdzić aktualizacji: ${state.message}`}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Aktualizacje są dostępne w wersji desktopowej (instalator .exe).</p>
      )}
    </Card>
  );
}
