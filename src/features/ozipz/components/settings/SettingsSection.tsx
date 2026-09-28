import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Database, Download, FolderInput, FolderOpen, HardDrive, RefreshCw, Sparkles, CheckCircle2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MIGRATED_FIREBASE_DATA } from "../../data/migratedData";

import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import {
  changeDatabaseLocation,
  createDatabaseBackup,
  getDatabaseInfo,
  isRiskyDatabaseLocation,
  restoreDatabaseBackup,
  revealDatabaseFile,
  type DatabaseInfo,
} from "../../../../db/client";
import { AppUpdateCard } from "./AppUpdateCard";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";

interface SettingsSectionProps {
  onClearAndReseed?: () => void;
}

export function SettingsSection(props: SettingsSectionProps) {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | undefined>(undefined);
  const [showReseedConfirm, setShowReseedConfirm] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const clearAndReseedDefaults = useOzipzDbStore((s) => s.clearAndReseedDefaults);
  useEffect(() => {
    void getDatabaseInfo().then(setDatabaseInfo).catch(() => setDatabaseInfo(null));
  }, []);

  const handleBackup = async () => {
    setIsBackupBusy(true);
    try {
      if (await createDatabaseBackup()) toast.success("Kopia zapasowa została utworzona");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się utworzyć kopii zapasowej");
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleReveal = async () => {
    try {
      await revealDatabaseFile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleChangeLocation = async () => {
    try {
      await changeDatabaseLocation();
    } catch (error) {
      toast.error(`Nie udało się zmienić lokalizacji bazy: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const performRestore = async (file?: File) => {
    setIsBackupBusy(true);
    try {
      const restored = await restoreDatabaseBackup(file);
      if (restored === "reload") window.location.reload();
      if (restored === "restart") {
        toast.success("Kopia jest gotowa. Zamknij i uruchom ponownie aplikację, aby zakończyć przywracanie.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się przywrócić kopii zapasowej");
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleRestore = (file?: File) => {
    executeConfirmedAction(
      "Przywrócenie kopii zastąpi aktualne dane. Czy kontynuować?",
      () => void performRestore(file),
      () => {
        setRestoreFile(file);
        setShowRestoreConfirm(true);
      }
    );
  };
  const onClearAndReseed = props.onClearAndReseed ?? (async () => {
    try {
      await clearAndReseedDefaults();
      toast.success("Baza danych została zresetowana i przywrócona ze wzorcowego snapshotu Firebase");
    } catch {
      toast.error("Błąd podczas resetowania bazy danych");
    }
  });
  const totalRecords = Object.values(MIGRATED_FIREBASE_DATA).reduce((sum, rows) => sum + rows.length, 0);

  return (
    <div className="space-y-4 select-none max-w-4xl">
      {/* Firebase Migration Banner */}
      <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-card to-card border-emerald-500/30 shadow-none space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            Historyczny snapshot Firebase
          </h3>
          <Badge variant="default" className="bg-emerald-600 font-bold text-xs">
            {totalRecords} rekordów w snapshocie
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Archiwalny zestaw danych używany przy resetowaniu bazy. Poniższe liczby opisują snapshot, a nie aktualną zawartość ewidencji.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2 bg-muted/40 rounded-[3px] border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Placówki</span>
            <strong className="text-foreground text-sm font-black font-mono">{MIGRATED_FIREBASE_DATA.facilities.length}</strong>
          </div>
          <div className="p-2 bg-muted/40 rounded-[3px] border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Działania</span>
            <strong className="text-foreground text-sm font-black font-mono">{MIGRATED_FIREBASE_DATA.actions.length}</strong>
          </div>
          <div className="p-2 bg-muted/40 rounded-[3px] border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Zgłoszenia Szkół</span>
            <strong className="text-foreground text-sm font-black font-mono">{MIGRATED_FIREBASE_DATA.participations.length}</strong>
          </div>
          <div className="p-2 bg-muted/40 rounded-[3px] border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Sprawy JRWA</span>
            <strong className="text-foreground text-sm font-black font-mono">{MIGRATED_FIREBASE_DATA.jrwaCases.length}</strong>
          </div>
        </div>
      </Card>

      <Card className={databaseInfo?.degraded ? "p-4 border-amber-500/40 bg-amber-500/10 shadow-none space-y-2" : "p-4 bg-card border-border shadow-none space-y-2"}>
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <Database className="size-4 text-primary" />
          Baza Danych i Środowisko Aplikacji
        </h3>
        <p className="text-xs text-muted-foreground">
          {databaseInfo?.detail ?? "Sprawdzanie aktywnego magazynu danych…"}
        </p>

        {databaseInfo?.degraded && (
          <div role="alert" className="flex items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            Tryb awaryjny: dane są zapisane tylko w tym profilu przeglądarki. Utwórz kopię przed dalszą pracą.
          </div>
        )}

        {databaseInfo?.mode === "tauri-sqlite" && isRiskyDatabaseLocation(databaseInfo.location) && (
          <div role="alert" className="flex items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            Baza leży w folderze synchronizowanym z chmurą lub na dysku sieciowym. SQLite może wtedy zostać zablokowane lub uszkodzone — przenieś bazę na dysk lokalny, np. C:\Ewidencja OZiPZ.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-muted/40 rounded-[3px] border border-border/80 space-y-1 text-xs">
            <span className="font-bold block text-foreground flex items-center gap-1.5">
              <HardDrive className="size-3.5 text-primary" /> Lokalizacja Pliku Bazy
            </span>
            <p className="text-muted-foreground text-[11px] break-all">
              {databaseInfo?.location ?? "Ustalanie lokalizacji…"}
            </p>
            {databaseInfo?.mode === "tauri-sqlite" && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button size="sm" variant="outline" onClick={() => void handleReveal()} className="h-7 gap-1.5 text-[11px]">
                  <FolderOpen className="size-3" /> Pokaż w folderze
                </Button>
                <Button size="sm" variant="outline" onClick={() => void handleChangeLocation()} className="h-7 gap-1.5 text-[11px]">
                  <FolderInput className="size-3" /> Zmień lokalizację…
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/40 rounded-[3px] border border-border/80 space-y-1 text-xs">
            <span className="font-bold block text-foreground flex items-center gap-1.5">
              <Database className="size-3.5 text-primary" /> Integralność Referencyjna
            </span>
            <p className="text-muted-foreground text-[11px]">
              {databaseInfo?.degraded ? "Brak gwarancji transakcji relacyjnych SQLite." : "Klucze obce, dziennik WAL i transakcje atomowe są aktywne."}
            </p>
          </div>
        </div>
      </Card>

      <AppUpdateCard />

      <Card className="p-4 bg-card border-border shadow-none space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Download className="size-3.5" /> Kopia zapasowa i odzyskiwanie
        </h4>
        <p className="text-xs text-muted-foreground">
          Zapisz pełną kopię aktualnych danych albo przywróć wcześniej utworzoną kopię. Ostatnia kopia: {localStorage.getItem("ozipz_lastBackupAt") ? new Date(localStorage.getItem("ozipz_lastBackupAt") as string).toLocaleString("pl-PL") : "brak informacji"}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={isBackupBusy} onClick={() => void handleBackup()} className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Utwórz kopię zapasową
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBackupBusy}
            onClick={() => databaseInfo?.mode === "tauri-sqlite" ? void handleRestore() : restoreInputRef.current?.click()}
            className="gap-1.5 text-xs"
          >
            <Upload className="size-3.5" /> Przywróć z kopii
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            className="hidden"
            accept={databaseInfo?.mode === "browser-storage" ? ".json,application/json" : ".db,application/octet-stream"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleRestore(file);
              event.target.value = "";
            }}
          />
        </div>
      </Card>

      {/* Database Maintenance Tools */}
      <Card className="p-4 bg-card border-border shadow-none space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
          <RefreshCw className="size-3.5" />
          Narzędzia Konserwacyjne Bazy Danych
        </h4>
        <p className="text-xs text-muted-foreground">
          Reset bezpowrotnie usuwa bieżące zmiany i zastępuje je historycznym snapshotem Firebase ({totalRecords} rekordów). Najpierw utwórz kopię zapasową.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            executeConfirmedAction(
              "Czy na pewno zresetować i przywrócić zmigrowane dane Firebase (" + totalRecords + " rekordów)?",
              () => void onClearAndReseed(),
              () => setShowReseedConfirm(true)
            );
          }}
          className="text-xs text-destructive border-destructive/40 hover:bg-destructive/10 font-bold gap-1.5 cursor-pointer"
        >
          <Sparkles className="size-3.5" /> Usuń bieżące dane i przywróć snapshot ({totalRecords} rekordów)
        </Button>
      </Card>

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={() => {
          void performRestore(restoreFile);
          setShowRestoreConfirm(false);
        }}
        title="Przywrócenie kopii zapasowej"
        description="Przywrócenie kopii zastąpi aktualne dane w bazie. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Przywróć kopię"
        cancelText="Anuluj"
      />

      <ConfirmDialog
        isOpen={showReseedConfirm}
        onClose={() => setShowReseedConfirm(false)}
        onConfirm={() => {
          void onClearAndReseed();
          setShowReseedConfirm(false);
        }}
        title="Reset bazy danych"
        description={`Czy na pewno zresetować i przywrócić zmigrowane dane Firebase (${totalRecords} rekordów)? Ta operacja bezpowrotnie usunie bieżące zmiany.`}
        variant="destructive"
        confirmText="Resetuj bazę danych"
        cancelText="Anuluj"
      />
    </div>
  );
}
