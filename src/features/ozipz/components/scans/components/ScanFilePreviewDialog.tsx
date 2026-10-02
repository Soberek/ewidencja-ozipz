import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { readScanFile } from "@/db/scan-files";
import { downloadBlob } from "@/db/backup-storage";
import type { OzipzScan } from "../../../types/ozipz.types";

export function ScanFilePreviewDialog({ scan, onClose }: { scan: OzipzScan | null; onClose: () => void }) {
  const [file, setFile] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setFile(null);
    setError(null);
    if (!scan) return;
    let cancelled = false;
    let url: string | undefined;
    void readScanFile(scan.filePath || "").then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setFile({ blob, url });
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err));
    });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [scan]);

  return (
    <ModalDialog
      isOpen={Boolean(scan)}
      onClose={onClose}
      size="full"
      title={scan?.title || "Podgląd skanu"}
      description={scan?.fileName}
      error={error}
      footer={<div className="flex justify-end gap-2 border-t p-3">
        <Button type="button" variant="outline" disabled={!file} onClick={() => file && scan && downloadBlob(file.blob, scan.fileName)}>
          <Download className="size-4" /> Pobierz plik
        </Button>
        <Button type="button" onClick={onClose}>Zamknij</Button>
      </div>}
    >
      {!file && !error && <p className="flex items-center justify-center gap-2 p-6"><Loader2 className="size-4 animate-spin" /> Wczytywanie skanu…</p>}
      {file && (file.blob.type.startsWith("image/")
        ? <img src={file.url} alt={scan?.title} className="mx-auto max-h-[70vh] max-w-full object-contain" />
        : <iframe src={file.url} title="Podgląd skanu" className="h-[70vh] w-full border-0" />)}
    </ModalDialog>
  );
}
