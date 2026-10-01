import { useState } from "react";
import { Eye, Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { participationFileName, pickParticipationFile } from "@/db/participation-files";

interface ParticipationApplicationFileFieldProps {
  /** Plik już zapisany przy zgłoszeniu (ścieżka względem folderu bazy). */
  storedPath?: string;
  /** Plik wybrany z dysku – zostanie skopiowany do folderu zgłoszeń przy zapisie. */
  pendingSource: string | null;
  supported: boolean;
  onPendingChange: (source: string | null) => void;
  onRemoveStored: () => void;
  onPreview: (path: string) => void;
}

export function ParticipationApplicationFileField({
  storedPath,
  pendingSource,
  supported,
  onPendingChange,
  onRemoveStored,
  onPreview,
}: ParticipationApplicationFileFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    try {
      const source = await pickParticipationFile();
      if (source) onPendingChange(source);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : String(pickError));
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
        <Paperclip className="size-3.5 text-muted-foreground" />
        <span>Plik zgłoszenia (skan / PDF)</span>
      </p>
      {!supported ? (
        <p className="text-[10px] text-muted-foreground">Dołączanie plików jest dostępne w aplikacji desktopowej.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 p-2 border border-border/70 rounded-[3px] bg-muted/20">
          {pendingSource ? (
            <>
              <span className="text-xs font-medium truncate max-w-[22rem]" title={pendingSource}>
                {participationFileName(pendingSource)}
              </span>
              <span className="text-[10px] text-muted-foreground">– zostanie skopiowany przy zapisie</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onPendingChange(null)} aria-label="Anuluj wybór pliku">
                <X className="size-3.5" />
              </Button>
            </>
          ) : storedPath ? (
            <>
              <button
                type="button"
                onClick={() => onPreview(storedPath)}
                className="text-xs font-medium text-primary hover:underline truncate max-w-[22rem] cursor-pointer"
                title={storedPath}
              >
                {participationFileName(storedPath)}
              </button>
              <Button type="button" variant="outline" size="sm" onClick={() => onPreview(storedPath)}>
                <Eye className="size-3.5" />
                Podgląd
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onRemoveStored} title="Odłącz plik od zgłoszenia (plik zostaje w folderze)">
                <X className="size-3.5" />
                Odłącz
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Brak pliku</span>
          )}
          <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={pick}>
            <Upload className="size-3.5" />
            {storedPath || pendingSource ? "Zmień plik" : "Dodaj plik"}
          </Button>
        </div>
      )}
      {error && <p className="text-[10px] text-destructive font-semibold">{error}</p>}
    </div>
  );
}
