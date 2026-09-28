import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FileText, Sparkles } from "lucide-react";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";
import { ADNOTACJA_POWODY } from "../../utils/adnotacjaUtils";
import { useDictionaries } from "../../store/useOzipzDbStore";

const AdnotacjaFormSchema = z.object({
  powodKod: z.string().min(1, "Wybierz powód niewykonania ze słownika"),
  tresc: z.string().trim().min(1, "Wprowadź treść uzasadnienia adnotacji"),
});

type AdnotacjaFormInput = z.input<typeof AdnotacjaFormSchema>;
type AdnotacjaFormOutput = z.output<typeof AdnotacjaFormSchema>;

interface AdnotacjaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: OzipzScheduleEvent | null;
  onSave: (eventId: string, adnotacja: {
    powodKod: string;
    powodTytul: string;
    tresc: string;
  }) => Promise<void> | void;
}

export function AdnotacjaDialog({ open, onOpenChange, event, onSave }: AdnotacjaDialogProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const dictStore = useDictionaries();

  const dynamicReasons = (dictStore.annotationReasons && dictStore.annotationReasons.length > 0)
    ? dictStore.annotationReasons.map((d) => ({ kod: d.code, tytul: d.label, opis: d.description || d.label }))
    : ADNOTACJA_POWODY;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdnotacjaFormInput, undefined, AdnotacjaFormOutput>({
    resolver: zodResolver(AdnotacjaFormSchema),
    defaultValues: {
      powodKod: "",
      tresc: "",
    },
  });

  const powodKod = watch("powodKod");
  const selectedPowod = dynamicReasons.find((p) => p.kod === powodKod);

  useEffect(() => {
    if (event && open) {
      reset({
        powodKod: event.annotationReasonCode || "",
        tresc: event.annotationText || (event.annotationReasonCode ? event.notes : "") || "",
      });
      setServerError("");
    }
  }, [event, open, reset]);

  const handleGenerateAiProposal = () => {
    if (!selectedPowod || !event) return;
    const generated = `W nawiązaniu do miesięcznego planu pracy Sekcji OZiPZ informuję, że zaplanowane działanie „${event.title}” nie mogło zostać zrealizowane w planowanym terminie z następującego powodu: ${selectedPowod.opis} W związku z powyższym podjęto uzgodnienia w celu przeniesienia realizacji na kolejny okres sprawozdawczy z zachowaniem celów edukacyjnych.`;
    setValue("tresc", generated);
  };

  const onSubmit = async (data: AdnotacjaFormOutput) => {
    if (!event) return;
    const powod = dynamicReasons.find((p) => p.kod === data.powodKod);

    setSaving(true);
    setServerError("");
    try {
      await onSave(event.id, {
        powodKod: data.powodKod,
        powodTytul: powod ? powod.tytul : data.powodKod,
        tresc: data.tresc,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisu adnotacji.");
    } finally {
      setSaving(false);
    }
  };

  if (!event) return null;

  return (
    <ModalDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Adnotacja do zadania"
      description="Powód i uzasadnienie niewykonania zadania"
      icon={<FileText className="size-5" />}
      headerAccent="amber"
      size="lg"
      error={serverError || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={saving}
      submitText="Zapisz adnotację"
      submitIcon={<FileText className="size-3.5" />}
    >
      <div className="p-3 rounded-[2px] bg-muted/40 border border-border text-xs space-y-1">
        <div className="font-semibold text-foreground">{event.title}</div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>Termin: {event.eventDate || "—"}</span>
          <span>Program / JRWA: {event.jrwa || event.programName || "—"}</span>
          <span>Lokalizacja: {event.location || "—"}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Urzędowy powód niewykonania *</Label>
        <Select
          value={powodKod || ""}
          onChange={(val) => setValue("powodKod", val, { shouldValidate: true })}
          options={dynamicReasons.map((p) => ({
            value: p.kod,
            label: p.tytul,
            description: p.opis,
          }))}
          placeholder="-- Wybierz powód niewykonania ze słownika --"
          searchPlaceholder="Szukaj powodu..."
          error={errors.powodKod?.message as string}
                  />
        {selectedPowod && (
          <p className="text-xs text-muted-foreground italic pl-1 pt-0.5">
            {selectedPowod.opis}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Treść adnotacji urzędowej *</Label>
          <Button
            type="button"
            variant="outline"
                        onClick={handleGenerateAiProposal}
            className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-formuła merytoryczna
          </Button>
        </div>
        <Textarea
          {...register("tresc")}
          placeholder="Wprowadź szczegółowe uzasadnienie okoliczności niewykonania zadania..."
          rows={4}
          className="resize-y"
        />
        {errors.tresc && <p className="text-[10px] text-destructive font-semibold">{errors.tresc.message}</p>}
      </div>
    </ModalDialog>
  );
}
