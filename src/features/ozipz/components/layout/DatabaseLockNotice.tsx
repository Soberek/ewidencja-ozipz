import { useEffect, useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { forceDatabaseTakeover, getDatabaseTakeover, type DatabaseLockHolder } from "../../../../db/client";

const TAKEOVER_POLL_MS = 30_000;

const formatSince = (holder: DatabaseLockHolder) => new Date(holder.since * 1000).toLocaleString("pl-PL");

async function takeOver() {
  try {
    await forceDatabaseTakeover();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : String(error));
  }
}

/** Baza jest otwarta na innym komputerze — nie otwieramy jej, dopóki użytkownik świadomie jej nie przejmie. */
export function DatabaseLockedPanel({ holder, onRetry }: { holder: DatabaseLockHolder; onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-2xl space-y-3 rounded-[3px] border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
      <p className="flex items-center gap-2 font-bold text-foreground">
        <Lock className="size-4 shrink-0 text-amber-600" /> Baza jest otwarta na innym komputerze
      </p>
      <p className="text-xs text-muted-foreground">
        Użytkownik <strong className="text-foreground">{holder.user}</strong> pracuje na tej bazie na komputerze{" "}
        <strong className="text-foreground">{holder.host}</strong> od {formatSince(holder)}. Równoczesna praca na jednym pliku bazy może go uszkodzić,
        dlatego aplikacja czeka, aż tamto okno zostanie zamknięte.
      </p>
      <p className="text-xs text-muted-foreground">
        Jeśli tamten komputer się zawiesił albo aplikacja została zamknięta nieprawidłowo, możesz przejąć bazę. Tamto okno przestanie wtedy przyjmować zmiany.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="size-3.5" /> Sprawdź ponownie
        </Button>
        <Button size="sm" onClick={() => void takeOver()}>Przejmij bazę</Button>
      </div>
    </div>
  );
}

/** Sprawdza co pół minuty, czy ktoś nie przejął bazy, i wtedy blokuje dalszą pracę w tym oknie. */
export function DatabaseTakeoverOverlay({ enabled }: { enabled: boolean }) {
  const [holder, setHolder] = useState<DatabaseLockHolder | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const check = () => void getDatabaseTakeover().then(setHolder).catch(() => undefined);
    const timer = window.setInterval(check, TAKEOVER_POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);

  if (!holder) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="takeover-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-w-md space-y-3 rounded-[3px] border border-border bg-card p-5 shadow-lg">
        <p id="takeover-title" className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Lock className="size-4 text-amber-600" /> Bazę przejął inny komputer
        </p>
        <p className="text-xs text-muted-foreground">
          {holder.user} otworzył(a) tę bazę na komputerze {holder.host}. Aby nie uszkodzić danych, to okno nie przyjmuje już zmian.
          Zamknij aplikację albo przejmij bazę z powrotem, jeśli tamten komputer już z niej nie korzysta.
        </p>
        <Button size="sm" variant="outline" onClick={() => void takeOver()}>Przejmij bazę z powrotem</Button>
      </div>
    </div>
  );
}
