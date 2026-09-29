import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FolderOpen, History, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createAutoBackupNow,
  getAutoBackups,
  openAutoBackupFolder,
  restoreAutoBackup,
  type AutoBackupInfo,
  type AutoBackupStatus,
} from "../../../../db/client";

const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;
const formatDate = (isoDay: string) => new Date(`${isoDay}T12:00:00`).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

/** Codzienne kopie tworzone przez aplikację desktopową w folderze „Kopie automatyczne”. */
export function AutoBackupCard() {
  const [status, setStatus] = useState<AutoBackupStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<AutoBackupInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getAutoBackups());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się odczytać listy kopii automatycznych");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (operation: () => Promise<void>, success?: string) => {
    setIsBusy(true);
    try {
      await operation();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
      void refresh();
    }
  };

  const today = new Date().toLocaleDateString("sv-SE");
  const hasToday = status?.backups.some((backup) => backup.date === today) ?? false;

  return (
    <Card className="p-4 bg-card border-border shadow-none space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
        <History className="size-3.5" /> Kopie automatyczne
      </h4>
      <p className="text-xs text-muted-foreground">
        Aplikacja codziennie zapisuje kopię bazy na tym komputerze. Przechowuje kopie z ostatnich 14 dni i po jednej z każdego z ostatnich 12 miesięcy.
        {status?.folder && <span className="block break-all pt-1">Folder: {status.folder}</span>}
      </p>

      {status?.lastError && (
        <div role="alert" className="flex items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0" />
          Ostatnia kopia automatyczna nie powiodła się: {status.lastError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={isBusy || hasToday} onClick={() => void run(createAutoBackupNow, "Dzisiejsza kopia została utworzona")} className="gap-1.5 text-xs">
          <RefreshCw className="size-3.5" /> {hasToday ? "Dzisiejsza kopia jest gotowa" : "Utwórz dzisiejszą kopię teraz"}
        </Button>
        <Button size="sm" variant="outline" disabled={isBusy} onClick={() => void run(openAutoBackupFolder)} className="gap-1.5 text-xs">
          <FolderOpen className="size-3.5" /> Otwórz folder kopii
        </Button>
      </div>

      {status && status.backups.length === 0 ? (
        <p className="text-xs text-muted-foreground">Pierwsza kopia powstanie kilkadziesiąt sekund po uruchomieniu aplikacji.</p>
      ) : (
        <ul className="divide-y divide-border rounded-[3px] border border-border text-xs">
          {status?.backups.map((backup) => (
            <li key={backup.path} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="font-semibold text-foreground">{formatDate(backup.date)}</span>
              <span className="ml-auto text-muted-foreground">{formatSize(backup.sizeBytes)}</span>
              <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => setPendingRestore(backup)} className="h-7 gap-1 text-xs">
                <RotateCcw className="size-3" /> Przywróć
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        onConfirm={() => {
          const backup = pendingRestore;
          setPendingRestore(null);
          if (backup) {
            void run(() => restoreAutoBackup(backup.path), "Kopia jest gotowa. Zamknij i uruchom ponownie aplikację, aby zakończyć przywracanie.");
          }
        }}
        title="Przywrócenie kopii automatycznej"
        description={pendingRestore ? `Dane zostaną zastąpione stanem z dnia ${formatDate(pendingRestore.date)}. Obecna baza zostanie zachowana jako plik „ozipz.before-restore”.` : ""}
        variant="warning"
        confirmText="Przywróć kopię"
        cancelText="Anuluj"
      />
    </Card>
  );
}
