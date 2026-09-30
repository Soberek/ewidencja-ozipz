import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Printer } from "lucide-react";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";
import { useDictionaries, usePrograms } from "../../store/useOzipzDbStore";
import { scheduleProgramLabel } from "../../utils/scheduleProgramResolver";
import { toast } from "sonner";

interface AdnotacjeListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: OzipzScheduleEvent | null;
  onRemoveAnnotation: (eventId: string) => Promise<void> | void;
}

export function AdnotacjeListDialog({
  open,
  onOpenChange,
  event,
  onRemoveAnnotation,
}: AdnotacjeListDialogProps) {
  const dictStore = useDictionaries();
  const { programs } = usePrograms();
  if (!event) return null;

  const reason = (dictStore.annotationReasons || []).find((r) => r.code === event.annotationReasonCode);
  const reasonLabel = reason?.label || event.annotationReasonLabel || "Uzasadnione okoliczności";
  const reasonDesc = reason?.description || "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[3px] bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Adnotacja do zadania</DialogTitle>
              <p className="text-xs text-muted-foreground">Powód i uzasadnienie niewykonania zadania</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div className="p-4 rounded-[3px] border bg-card space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="font-bold text-sm text-foreground">{event.title}</div>
              <Badge variant="outline" className="text-orange-700 dark:text-orange-300 border-orange-300 bg-orange-50 dark:bg-orange-950/40">
                Adnotacja
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Data zdarzenia:</span> {event.eventDate || "—"}
              </div>
              <div>
                <span className="font-semibold text-foreground">Osoba odpowiedzialna:</span> {event.responsiblePerson || "—"}
              </div>
              <div>
                <span className="font-semibold text-foreground">JRWA / Program:</span> {scheduleProgramLabel(event, programs)}
              </div>
              <div>
                <span className="font-semibold text-foreground">Lokalizacja:</span> {event.location || "—"}
              </div>
            </div>

            <div className="p-2.5 rounded bg-muted/60 border space-y-1">
              <div className="font-semibold text-foreground">
                Powód: {reasonLabel}
              </div>
              {reasonDesc && <div className="text-[11px] text-muted-foreground">{reasonDesc}</div>}
            </div>

            {(event.annotationText || event.notes) && (
              <div className="space-y-1">
                <div className="font-semibold text-foreground">Uzasadnienie / uwagi:</div>
                <div className="p-2.5 rounded bg-background border text-foreground whitespace-pre-wrap leading-relaxed">
                  {event.annotationText || event.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 flex justify-between sm:justify-between items-center">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={async () => {
              try {
                await onRemoveAnnotation(event.id);
                onOpenChange(false);
              } catch {
                toast.error("Nie udało się usunąć adnotacji.");
              }
            }}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Usuń adnotację
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Drukuj / Podgląd
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Zamknij
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
