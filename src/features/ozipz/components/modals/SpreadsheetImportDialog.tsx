import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import {
  downloadImportTemplate,
  readSpreadsheet,
  type ImportColumn,
  type ImportIssue,
  type ImportPlan,
  type SheetRow,
} from "../../utils/spreadsheetImport";

interface SpreadsheetImportDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Nazwa rekordów w liczbie mnogiej, np. „placówek”. */
  entityLabel: string;
  columns: ImportColumn[];
  templateFileName: string;
  templateExample: string[];
  plan: (rows: SheetRow[]) => ImportPlan<T>;
  onImport: (plan: ImportPlan<T>) => Promise<void>;
}

function IssueList({ issues, tone }: { issues: ImportIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  return (
    <ul className={`max-h-40 overflow-y-auto rounded-[3px] border p-2 text-xs space-y-0.5 ${tone === "error" ? "border-destructive/30 bg-destructive/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      {issues.map((issue) => (
        <li key={`${issue.row}-${issue.message}`}>Wiersz {issue.row}: {issue.message}</li>
      ))}
    </ul>
  );
}

/** Import rekordów z arkusza .xlsx lub .csv z podglądem przed zapisem. */
export function SpreadsheetImportDialog<T>({
  isOpen, onClose, title, entityLabel, columns, templateFileName, templateExample, plan, onImport,
}: SpreadsheetImportDialogProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPlan<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const reset = () => { setFileName(""); setPreview(null); setError(null); };
  const close = () => { reset(); onClose(); };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const { rows, missingColumns } = await readSpreadsheet(file, columns);
      if (missingColumns.length) {
        setError(`W pierwszym wierszu arkusza brakuje kolumn: ${missingColumns.join(", ")}. Pobierz wzór, aby zobaczyć oczekiwane nagłówki.`);
        return;
      }
      setPreview(plan(rows));
    } catch (readError) {
      setError(`Nie udało się odczytać pliku: ${readError instanceof Error ? readError.message : String(readError)}`);
    }
  };

  const total = preview ? preview.toCreate.length + preview.toUpdate.length : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!preview || total === 0) return;
    setIsBusy(true);
    try {
      await onImport(preview);
      toast.success(`Zaimportowano ${total} ${entityLabel}`);
      close();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import nie powiódł się");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={close}
      size="md"
      headerAccent="emerald"
      icon={<FileSpreadsheet className="size-5" />}
      title={title}
      description="Plik Excel (.xlsx) albo CSV. Pierwszy wiersz musi zawierać nagłówki kolumn."
      error={error}
      onSubmit={submit}
      isSubmitting={isBusy}
      submitText={total > 0 ? `Importuj ${total}` : "Importuj"}
      submitIcon={<Upload className="size-3.5" />}
    >
      <div className="space-y-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-1.5">
            <Upload className="size-3.5" /> {fileName ? "Wybierz inny plik" : "Wybierz plik"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void downloadImportTemplate(columns, templateFileName, templateExample)}
            className="gap-1.5"
          >
            <Download className="size-3.5" /> Pobierz wzór arkusza
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <p className="text-muted-foreground">
          Rozpoznawane kolumny: {columns.map((column) => column.required ? `${column.label}*` : column.label).join(", ")}. Gwiazdka oznacza kolumnę wymaganą.
        </p>

        {fileName && <p className="font-semibold text-foreground">Plik: {fileName}</p>}

        {preview && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Nowych: {preview.toCreate.length}
              {preview.toUpdate.length > 0 && <> · do uzupełnienia istniejących: {preview.toUpdate.length}</>}
            </p>
            {preview.errors.length > 0 && (
              <p className="flex items-center gap-1.5 font-semibold text-destructive">
                <AlertTriangle className="size-4" /> {preview.errors.length} wierszy z błędami nie zostanie zaimportowanych:
              </p>
            )}
            <IssueList issues={preview.errors} tone="error" />
            {preview.warnings.length > 0 && <p className="font-semibold text-amber-700 dark:text-amber-400">Uwagi:</p>}
            <IssueList issues={preview.warnings} tone="warning" />
            {total === 0 && <p className="text-muted-foreground">Brak wierszy do zaimportowania.</p>}
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
