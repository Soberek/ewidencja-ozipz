import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

const CopyYearPlanSchema = z.object({
  fromYear: z.number().int().min(2000).max(2100),
  toYear: z.number().int().min(2000).max(2100),
}).refine((data) => data.fromYear !== data.toYear, {
  message: "Rok źródłowy i docelowy muszą być różne.",
  path: ["toYear"],
});

type CopyYearPlanFormInput = z.input<typeof CopyYearPlanSchema>;
type CopyYearPlanFormOutput = z.output<typeof CopyYearPlanSchema>;

interface CopyYearPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentYear: number;
  onCopyYear: (fromYear: number, toYear: number) => Promise<{ copiedCount: number }> | void;
}

export function CopyYearPlanDialog({
  open,
  onOpenChange,
  currentYear,
  onCopyYear,
}: CopyYearPlanDialogProps) {
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CopyYearPlanFormInput, undefined, CopyYearPlanFormOutput>({
    resolver: zodResolver(CopyYearPlanSchema),
    defaultValues: {
      fromYear: currentYear - 1,
      toYear: currentYear,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fromYear: currentYear - 1,
        toYear: currentYear,
      });
      setSubmitError("");
    }
  }, [open, currentYear, reset]);

  const onSubmit = async (data: CopyYearPlanFormOutput) => {
    setSaving(true);
    setSubmitError("");
    try {
      await onCopyYear(data.fromYear, data.toYear);
      onOpenChange(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Wystąpił błąd podczas kopiowania planu.");
    } finally {
      setSaving(false);
    }
  };

  const errorMessage = submitError || Object.values(errors).map((e) => e?.message).filter(Boolean).join(", ");

  return (
    <ModalDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Kopiuj Plan z Innego Roku"
      description="Przenieś ramowe pozycje harmonogramu (programy, działania, osoby)"
      icon={<Copy className="size-5" />}
      size="sm"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={saving}
      submitText="Kopiuj Plan Pracy"
      submitIcon={<Copy className="size-3.5" />}
    >
      <p className="text-xs text-muted-foreground">
        Kopiuje wszystkie pozycje planu (miesiąc, program, działanie, osobę odpowiedzialną, lokalizację) z roku źródłowego do docelowego. Wykonanie w nowym roku zostanie wyzerowane.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="copy-plan-from-year">Z roku (źródłowy)</Label>
          <Input id="copy-plan-from-year" type="number" {...register("fromYear", { valueAsNumber: true })} min={2000} max={2100} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="copy-plan-to-year">Do roku (docelowy)</Label>
          <Input id="copy-plan-to-year" type="number" {...register("toYear", { valueAsNumber: true })} min={2000} max={2100} required />
        </div>
      </div>
    </ModalDialog>
  );
}
