import { HelpCircle, Inbox, Send } from "lucide-react";

export function JrwaInstructionCard() {
  return (
    <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-[3px] space-y-2.5">
      <span className="font-bold text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
        <HelpCircle className="size-3.5" /> Prawidłowe Naniesienie Znaku na Dokumentację
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded-[3px] bg-background/80 border border-border/60 flex items-start gap-2">
          <Inbox className="size-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block">Pisma wpływające:</strong>
            <span className="text-muted-foreground leading-tight">
              W obrębie pieczęci wpływu lub w prawym górnym rogu 1. strony pisma.
            </span>
          </div>
        </div>

        <div className="p-2 rounded-[3px] bg-background/80 border border-border/60 flex items-start gap-2">
          <Send className="size-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block">Pisma wychodzące / decyzje:</strong>
            <span className="text-muted-foreground leading-tight">
              W lewym górnym rogu pod pieczęcią nagłówkową jednostki PSSE.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
