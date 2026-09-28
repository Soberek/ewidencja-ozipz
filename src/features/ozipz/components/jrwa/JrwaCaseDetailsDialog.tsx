import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Sparkles,
  User,
  Edit,
  FolderOpen,
  Clock,
} from "lucide-react";
import type { OzipzJrwaCase, OzipzAction } from "../../types/ozipz.types";
import { JrwaInstructionCard } from "./components/JrwaInstructionCard";
import { JrwaRelatedActionsCard } from "./components/JrwaRelatedActionsCard";

interface JrwaCaseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jrwaCase: OzipzJrwaCase | null;
  onEdit: (item: OzipzJrwaCase) => void;
  onToggleStatus: (id: string, newStatus: string) => Promise<void>;
  actions?: OzipzAction[];
}

export function JrwaCaseDetailsDialog({
  isOpen,
  onClose,
  jrwaCase,
  onEdit,
  onToggleStatus,
  actions,
}: JrwaCaseDetailsDialogProps) {
  const [copied, setCopied] = useState(false);

  const relatedActions = useMemo(() => {
    if (!jrwaCase || !actions) return [];
    return actions.filter(
      (a) => a.jrwaCaseId === jrwaCase.id || (Boolean(jrwaCase.fullCaseSign) && a.jrwaSign === jrwaCase.fullCaseSign)
    );
  }, [jrwaCase, actions]);

  if (!jrwaCase) return null;

  const handleCopySign = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(jrwaCase.fullCaseSign);
    }
    setCopied(true);
    toast.success(`Skopiowano znak: ${jrwaCase.fullCaseSign}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async () => {
    const nextStatus = jrwaCase.status === "zakonczona" ? "w_toku" : "zakonczona";
    await onToggleStatus(jrwaCase.id, nextStatus);
  };

  const isClosed = jrwaCase.status === "zakonczona" || jrwaCase.status === "zarchiwizowana";

  const customFooter = (
    <div className="p-3 bg-muted/10 border-t border-border flex items-center justify-between gap-2 shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStatusChange}
        className={`text-xs h-8 gap-1.5 font-semibold cursor-pointer ${
          isClosed
            ? "text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
            : "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
        }`}
      >
        <CheckCircle2 className="size-3.5" />
        {isClosed ? "Otwórz ponownie sprawę" : "Zakończ sprawę"}
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onClose();
            onEdit(jrwaCase);
          }}
          className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
        >
          <Edit className="size-3.5" /> Edytuj
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onClose}
          className="text-xs h-8 px-4 cursor-pointer"
        >
          Zamknij
        </Button>
      </div>
    </div>
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerAccent="primary"
      icon={<Bookmark className="size-5" />}
      title="Metryka Sprawy i Teczka Aktowa"
      description="Urzędowy rejestr spraw OZiPZ według Instrukcji Kancelaryjnej"
      badge={
        <Badge
          variant={isClosed ? "outline" : "default"}
          className={`text-[11px] font-bold px-2.5 py-0.5 ${
            isClosed
              ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
              : "bg-blue-600 text-white"
          }`}
        >
          {isClosed ? "Sprawa Zakończona" : "Sprawa W Toku"}
        </Badge>
      }
      footer={customFooter}
    >
      {/* Ramka ze Znakiem Sprawy i Kopiowaniem */}
      <div className="p-3 rounded-[3px] bg-background border border-primary/40 flex items-center justify-between gap-3 shadow-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-[2px] bg-primary/10 text-primary shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
                  Oficjalny Znak Sprawy
                </span>
                <span className="font-mono font-black text-base text-primary tracking-wide select-all block truncate">
                  {jrwaCase.fullCaseSign}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant={copied ? "default" : "outline"}
              onClick={handleCopySign}
              className="gap-1.5 text-xs h-8 px-3 font-semibold shrink-0 cursor-pointer shadow-none"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-white" /> Skopiowano!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Kopiuj Znak
                </>
              )}
            </Button>
      </div>

      {/* Szczegóły sprawy */}
      <div className="space-y-4 text-xs">
        {/* Tytuł i Przedmiot */}
        <div className="p-3.5 bg-muted/20 border border-border/80 rounded-[3px] space-y-2">
            <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider block">
              Przedmiot Sprawy / Tytuł
            </span>
            <p className="text-xs font-semibold text-foreground leading-relaxed">
              {jrwaCase.title}
            </p>
          </div>

          {/* Siatka parametrów */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block">Hasło JRWA</span>
              <span className="font-mono font-bold text-xs text-foreground mt-0.5 block">
                {jrwaCase.jrwaSymbol}
              </span>
            </div>

            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block">Kolejny Nr w Teczce</span>
              <span className="font-mono font-bold text-xs text-primary mt-0.5 block">
                #{jrwaCase.caseNumber} / {jrwaCase.year}
              </span>
            </div>

            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block">Kategoria Archiwalna</span>
              <span className="font-bold text-xs text-foreground mt-0.5 block">
                {jrwaCase.archivalCategory || "B5"}
              </span>
            </div>

            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block flex items-center gap-1">
                <Calendar className="size-3 text-primary" /> Data Wszczęcia
              </span>
              <span className="font-mono font-semibold text-xs text-foreground mt-0.5 block">
                {jrwaCase.startDate || (jrwaCase.createdAt ? jrwaCase.createdAt.slice(0, 10) : "Brak")}
              </span>
            </div>

            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Data Zakończenia
              </span>
              <span className="font-mono font-semibold text-xs text-foreground mt-0.5 block">
                {jrwaCase.endDate || "W toku"}
              </span>
            </div>

            <div className="p-2.5 bg-muted/10 border border-border/60 rounded-[3px]">
              <span className="text-[10px] text-muted-foreground font-semibold block flex items-center gap-1">
                <User className="size-3 text-primary" /> Referent Prowadzący
              </span>
              <span className="font-semibold text-xs text-foreground mt-0.5 block truncate">
                {jrwaCase.assignedEducator}
              </span>
            </div>
          </div>

          {/* Podmiot / Placówka i Program */}
          {(jrwaCase.facilityName || jrwaCase.programName) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/15 border border-border/70 rounded-[3px]">
              {jrwaCase.facilityName && (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Building2 className="size-3 text-primary" /> Placówka / Adresat
                  </span>
                  <span className="font-bold text-xs text-foreground block">
                    {jrwaCase.facilityName}
                  </span>
                </div>
              )}

              {jrwaCase.programName && (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <FolderOpen className="size-3 text-primary" /> Program Profilaktyczny
                  </span>
                  <span className="font-semibold text-xs text-primary block">
                    {jrwaCase.programName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dokument Wszczynający */}
          {jrwaCase.initiatingDocument && (
            <div className="p-3 bg-muted/20 border border-border/60 rounded-[3px] space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText className="size-3 text-primary" /> Dokument wszczynający postępowanie
              </span>
              <p className="text-xs font-medium text-foreground">{jrwaCase.initiatingDocument}</p>
            </div>
          )}

          {/* Instrukcja Kancelaryjna: Prawidłowe Naniesienie Znaku */}
          <JrwaInstructionCard />

          {/* Powiązane Działania Edukacyjne i Status EZD */}
          <JrwaRelatedActionsCard relatedActions={relatedActions} />

          {/* Uwagi */}
          {jrwaCase.notes && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Uwagi do akt:</span>
              <p className="p-2.5 rounded-[3px] bg-muted/20 border border-border/50 text-xs text-foreground italic">
                {jrwaCase.notes}
              </p>
            </div>
          )}
        </div>

    </ModalDialog>
  );
}
