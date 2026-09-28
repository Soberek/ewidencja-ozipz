import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileDown, FileText, Info, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { OzipzAction } from "../../types/ozipz.types";
import { resolveIzrzContext } from "../../utils/izrzContext";
import {
  downloadIzrzDocx,
  getIzrzWarnings,
  prepareIzrzData,
  type IzrzGeneratorData,
} from "../../utils/izrzGenerator";
import { useActions, useFacilities, useMaterials } from "../../store/useOzipzDbStore";
import { IzrzSheetEditor } from "./IzrzSheetEditor";

export interface IzrzDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: OzipzAction;
}

function describeRelated(action: OzipzAction): string {
  const materials = Number(action.materialsDistributedCount) || 0;
  return materials > 0 ? `${action.actionType} (${materials} szt.)` : action.actionType;
}

export function IzrzDocumentDialog({ isOpen, onClose, action }: IzrzDocumentDialogProps) {
  const { actions } = useActions();
  const { materials, distributions } = useMaterials();
  const { facilities } = useFacilities();

  const context = useMemo(
    () => resolveIzrzContext(action, { actions, distributions, materials, facilities }),
    [action, actions, distributions, materials, facilities]
  );
  const initialData = useMemo(
    () => prepareIzrzData(context.action, context.facility, { materials: context.materials }),
    [context]
  );

  const [draft, setDraft] = useState<IzrzGeneratorData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  const warnings = useMemo(() => getIzrzWarnings(draft), [draft]);
  const isEdited = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initialData), [draft, initialData]);
  const isParentDocument = context.action.id !== action.id;

  const handleChange = (patch: Partial<IzrzGeneratorData>) => setDraft((prev) => ({ ...prev, ...patch }));

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const fileName = await downloadIzrzDocx(draft);
      toast.success(`Pobrano dokument IZRZ: ${fileName}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nie udało się wygenerować dokumentu DOCX.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-border bg-card [&>button]:z-20">
        <div className="p-4 pr-14 border-b border-border flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-background/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-[3px] bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground">
                Informacja z realizacji zadania (IZRZ)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Dane pobrane z działania — pola na arkuszu możesz poprawić przed wygenerowaniem dokumentu Word.
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEdited && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDraft(initialData)}
                className="h-8.5 px-3 text-xs gap-1.5"
                title="Odrzuć zmiany wprowadzone na arkuszu"
              >
                <RotateCcw className="size-3.5" />
                Przywróć dane z działania
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={isGenerating}
              className="h-8.5 px-3.5 text-xs font-bold gap-2"
              title="Generuj i pobierz dokument Word (.docx)"
            >
              {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              {isGenerating ? "Generowanie..." : "Generuj dokument (.docx)"}
            </Button>
          </div>
        </div>

        {(isParentDocument || context.relatedActions.length > 0 || warnings.length > 0) && (
          <div className="px-4 py-3 space-y-2 border-b border-border bg-muted/30 text-xs">
            {isParentDocument && (
              <p className="flex items-start gap-2 text-foreground">
                <Info className="size-4 shrink-0 text-primary" />
                <span>
                  Wybrany wpis należy do zadania „{context.action.title}” ({context.action.actionType}) — dokument
                  IZRZ opisuje to działanie główne.
                </span>
              </p>
            )}
            {context.relatedActions.length > 0 && (
              <p className="flex items-start gap-2 text-foreground">
                <Info className="size-4 shrink-0 text-primary" />
                <span>
                  Uwzględniono powiązane wpisy: {context.relatedActions.map(describeRelated).join(", ")}.
                </span>
              </p>
            )}
            {warnings.length > 0 && (
              <ul className="space-y-1 text-amber-700 dark:text-amber-400" aria-label="Braki w dokumencie">
                {warnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <IzrzSheetEditor data={draft} onChange={handleChange} />
      </DialogContent>
    </Dialog>
  );
}
