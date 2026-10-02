import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, CheckCircle2, FileText, Building2 } from "lucide-react";
import type { OzipzDistribution, OzipzMaterial, OzipzFacility } from "../../types/ozipz.types";
import { formatDateLongPl } from "../../utils/adnotacjaUtils";
import { getTodayIsoDate } from "../../utils/dateUtils";

interface RozdzielnikBlankietDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribution: OzipzDistribution | null;
  material?: OzipzMaterial | null;
  facility?: OzipzFacility | null;
  onMarkDelivered?: (id: string) => Promise<void> | void;
}

export function RozdzielnikBlankietDialog({
  open,
  onOpenChange,
  distribution,
  material,
  facility,
  onMarkDelivered,
}: RozdzielnikBlankietDialogProps) {
  if (!distribution) return null;

  const dateFormatted = formatDateLongPl(distribution.distributionDate || getTodayIsoDate());

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-[3px] bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Karta Rozdzielnika Materiałów</DialogTitle>
                <p className="text-xs font-mono text-muted-foreground">Formularz: F/PT/PZ/01/01</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono">
              F/PT/PZ/01/01
            </Badge>
          </div>
        </DialogHeader>

        {/* Czysty urzędowy blankiet gotowy do druku */}
        <div className="p-6 rounded-[3px] border bg-card text-foreground space-y-6 shadow-none font-sans text-xs">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <div className="font-bold text-xs uppercase text-muted-foreground">
                Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu
              </div>
              <div className="text-[11px] text-muted-foreground">
                Sekcja Oświaty Zdrowotnej i Promocji Zdrowia (OZiPZ)
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-primary">F/PT/PZ/01/01</span>
              <div className="text-[11px] text-muted-foreground">Myślibórz, dn. {dateFormatted}</div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-wide uppercase">
              POTWIERDZENIE ODBIORU MATERIAŁÓW OŚWIATOWYCH
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Rozdzielnik materiałów edukacyjno-profilaktycznych
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 rounded-[2px] bg-muted/30 border">
            <div>
              <span className="font-semibold text-muted-foreground block text-[11px]">Nazwa materiału:</span>
              <span className="font-bold text-sm text-foreground">
                {distribution.materialTitle || material?.title || "—"}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Typ: {distribution.materialType || material?.materialType || "—"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block text-[11px]">Liczba egzemplarzy:</span>
              <span className="font-black text-lg text-primary">
                {distribution.quantity} szt.
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <Building2 className="size-4 text-primary" />
              Odbiorca / Placówka:
            </div>
            <div className="p-3 rounded-[2px] bg-muted/20 border text-xs space-y-1">
              <div className="font-bold text-foreground">
                {distribution.recipientName || facility?.name || "—"}
              </div>
              <div className="text-muted-foreground">
                {facility?.address ? `${facility.address}, ${facility.city}` : distribution.municipality || "—"}
              </div>
              {distribution.assignedEducator && (
                <div className="text-foreground pt-1">
                  <span className="text-muted-foreground">Wydający pracownik OZiPZ:</span> {distribution.assignedEducator}
                </div>
              )}
            </div>
          </div>

          {distribution.notes && (
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground text-[11px]">Uwagi do wydania:</span>
              <p className="text-xs italic bg-muted/20 p-2 rounded border">{distribution.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-8 border-t text-center text-[11px] text-muted-foreground">
            <div className="space-y-6">
              <div>........................................................</div>
              <div>Podpis osoby wydającej (OZiPZ)</div>
            </div>
            <div className="space-y-6">
              <div>........................................................</div>
              <div>Data i czytelny podpis odbierającego</div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 flex justify-between sm:justify-between items-center">
          <div>
            {onMarkDelivered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await onMarkDelivered(distribution.id);
                  onOpenChange(false);
                }}
                className="gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
              >
                <CheckCircle2 className="size-4" />
                Potwierdź wydanie
              </Button>
            )}
          </div>


          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-4" />
              Drukuj Blankiet
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Zamknij
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
