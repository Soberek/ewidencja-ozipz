import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Users } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ParticipationFormInput } from "../ParticipationDialog";

interface ParticipationMetricsStatusFieldsProps {
  register: UseFormRegister<ParticipationFormInput>;
  errors: FieldErrors<ParticipationFormInput>;
}

export function ParticipationMetricsStatusFields({
  register,
  errors,
}: ParticipationMetricsStatusFieldsProps) {
  return (
    <>
      {/* Odbiorcy programu */}
      <div className="space-y-1 sm:max-w-[16rem]">
        <label htmlFor="participation-pupils" className="flex items-center gap-1.5 font-bold text-foreground text-xs">
          <Users className="size-3.5 text-primary" />
          <span>
            Uczniowie ogółem <span className="text-destructive">*</span>
          </span>
        </label>
        <Input
          id="participation-pupils"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="np. 120"
          {...register("pupilsCount", { valueAsNumber: true })}
          aria-invalid={Boolean(errors.pupilsCount)}
          className="h-8 text-sm font-mono font-bold"
        />
        {errors.pupilsCount ? (
          <p className="text-[10px] text-destructive font-semibold">{errors.pupilsCount.message as string}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">Łączna liczba uczniów / dzieci biorących udział w programie</p>
        )}
      </div>

      {/* Statusy Deklaracji i Sprawozdania */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 border border-border/70 rounded-[3px]">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasDeclaration"
            {...register("hasDeclaration")}
            className="size-4 rounded border-input text-primary focus:ring-0 cursor-pointer"
          />
          <label htmlFor="hasDeclaration" className="text-xs font-semibold text-foreground cursor-pointer">
            Złożono Deklarację
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasFinalReport"
            {...register("hasFinalReport")}
            className="size-4 rounded border-input text-primary focus:ring-0 cursor-pointer"
          />
          <label htmlFor="hasFinalReport" className="text-xs font-semibold text-foreground cursor-pointer">
            Sprawozdanie Końcowe
          </label>
        </div>

      </div>

      {/* Uwagi */}
      <div className="space-y-1.5">
        <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
          <FileText className="size-3.5 text-muted-foreground" />
          <span>Uwagi / Notatki</span>
        </label>
        <Textarea
          rows={2}
          placeholder="np. załączono ankiety ewaluacyjne, kontakt telefoniczny..."
          {...register("notes")}
          className="text-xs"
        />
      </div>
    </>
  );
}
