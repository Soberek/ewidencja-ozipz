import { useState } from "react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { OzipzTemplate } from "../../../types/ozipz.types";

interface TemplatePreviewDialogProps {
  template: OzipzTemplate | null;
  onClose: () => void;
}

export function TemplatePreviewDialog({
  template,
  onClose,
}: TemplatePreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!template) return null;

  const handleCopy = async () => {
    if (template.descriptionTemplate?.trim()) {
      try {
        await navigator.clipboard.writeText(template.descriptionTemplate);
        setCopied(true);
        toast.success("Skopiowano treść szablonu do schowka");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Nie udało się skopiować opisu.");
      }
    }
  };

  return (
    <ModalDialog
      isOpen={Boolean(template)}
      onClose={onClose}
      size="md"
      headerAccent="purple"
      icon={<FileText className="size-5" />}
      title="Podgląd szablonu zadania"
      description="Opis i ustawienia zapisane w szablonie."
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-semibold"
          >
            Zamknij
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            disabled={!template.descriptionTemplate?.trim()}
            className="h-8 text-xs font-bold gap-1.5 shadow-none cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Skopiowano!" : "Kopiuj opis"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs select-none">
        <div>
          <h3 className="text-sm font-bold text-foreground leading-snug">{template.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className="text-[10px] font-bold uppercase">
              {template.actionType}
            </Badge>
            {template.topic && (
              <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                {template.topic}
              </Badge>
            )}
            {template.defaultAudience && (
              <span className="text-[11px] text-muted-foreground">
                Odbiorcy: <strong className="text-foreground">{template.defaultAudience}</strong>
              </span>
            )}
          </div>
        </div>

        {template.actionDefaults && (
          <div className="rounded border border-border bg-muted/20 p-3 text-xs">
            <p className="font-semibold">Ustawienia działania</p>
            <p>Tytuł: {template.actionDefaults.title}</p>
            {template.actionDefaults.leadEducator && <p>Prowadzący: {template.actionDefaults.leadEducator}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1">
              <Sparkles className="size-3.5 text-amber-500" />
              Opis zadania
            </span>
          </div>
          <div className="p-3 bg-muted/30 border border-border/80 rounded-[3px] font-sans text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
            {template.descriptionTemplate || "Ten szablon nie ma jeszcze opisu."}
          </div>
        </div>

        {template.suggestedMaterials && (
          <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-[3px] text-xs">
            <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
              Sugerowane materiały oświatowe:
            </span>
            <span className="text-blue-600/90 dark:text-blue-400/90">{template.suggestedMaterials}</span>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
