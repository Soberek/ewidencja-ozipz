import { useEffect, useState } from "react";
import { ExternalLink, FileSearch, FolderOpen, Loader2 } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  openParticipationFile,
  participationFileName,
  participationFilePreviewType,
  readParticipationFile,
  revealParticipationFile,
} from "@/db/participation-files";

interface ParticipationFilePreviewDialogProps {
  /** Ścieżka pliku zgłoszenia; null zamyka okno. */
  filePath: string | null;
  title?: string;
  onClose: () => void;
}

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; url: string; type: string }
  | { status: "external" }
  | { status: "error"; message: string };

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function ParticipationFilePreviewDialog({ filePath, title, onClose }: ParticipationFilePreviewDialogProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setActionError(null);
    if (!filePath) return;
    const type = participationFilePreviewType(filePath);
    if (!type) {
      setPreview({ status: "external" });
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setPreview({ status: "loading" });
    readParticipationFile(filePath)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview({ status: "ready", url, type });
      })
      .catch((error) => !cancelled && setPreview({ status: "error", message: errorText(error) }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [filePath]);

  const run = (action: (path: string) => Promise<void>) => async () => {
    if (!filePath) return;
    setActionError(null);
    try {
      await action(filePath);
    } catch (error) {
      setActionError(errorText(error));
    }
  };

  const footer = (
    <DialogFooter className="p-3 px-5 border-t border-border bg-muted/30 flex items-center justify-between gap-2 shrink-0">
      <p className="text-[11px] text-muted-foreground truncate mr-auto" title={filePath ?? ""}>{filePath}</p>
      <Button type="button" variant="outline" onClick={run(revealParticipationFile)}>
        <FolderOpen className="size-3.5" />
        Pokaż w folderze
      </Button>
      <Button type="button" variant="outline" onClick={run(openParticipationFile)}>
        <ExternalLink className="size-3.5" />
        Otwórz w programie
      </Button>
      <Button type="button" onClick={onClose}>Zamknij</Button>
    </DialogFooter>
  );

  return (
    <ModalDialog
      isOpen={Boolean(filePath)}
      onClose={onClose}
      size="full"
      headerAccent="primary"
      icon={<FileSearch className="size-5" />}
      title={title || "Plik zgłoszenia"}
      description={filePath ? participationFileName(filePath) : undefined}
      error={actionError}
      footer={footer}
      contentClassName="p-0 flex flex-col"
    >
      <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/20">
        {preview.status === "loading" && (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Wczytywanie pliku…
          </span>
        )}
        {preview.status === "error" && <p className="p-6 text-destructive font-medium text-center">{preview.message}</p>}
        {preview.status === "external" && (
          <div className="p-6 text-center space-y-3">
            <p className="text-muted-foreground">Tego typu pliku nie można wyświetlić w aplikacji.</p>
            <Button type="button" onClick={run(openParticipationFile)}>
              <ExternalLink className="size-3.5" />
              Otwórz w domyślnym programie
            </Button>
          </div>
        )}
        {preview.status === "ready" &&
          (preview.type.startsWith("image/") ? (
            <img src={preview.url} alt={participationFileName(filePath ?? "")} className="max-w-full max-h-full object-contain" />
          ) : (
            <iframe src={preview.url} title="Podgląd pliku zgłoszenia" className="w-full h-full min-h-[60vh] border-0 bg-white" />
          ))}
      </div>
    </ModalDialog>
  );
}
