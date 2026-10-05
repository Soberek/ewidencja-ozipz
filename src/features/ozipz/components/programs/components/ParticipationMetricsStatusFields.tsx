import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FileText, Users } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ParticipationFormInput } from "../ParticipationDialog";
import type { OzipzAction } from "../../../types/ozipz.types";
import { formatDatePl } from "../../../utils/dateUtils";

interface ParticipationMetricsStatusFieldsProps {
  register: UseFormRegister<ParticipationFormInput>;
  errors: FieldErrors<ParticipationFormInput>;
  /** Prelekcje z rejestru działań dla wybranego programu, placówki i roku szkolnego. */
  registerLectures?: OzipzAction[];
}

export function ParticipationMetricsStatusFields({
  register,
  errors,
  registerLectures = [],
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

        <div className="sm:col-span-2 border-t border-border/60 pt-2">
          {registerLectures.length > 0 ? (
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-foreground">Prelekcja przeprowadzona – w rejestrze działań</p>
                {registerLectures.map((action) => (
                  <p key={action.id} className="text-[11px] text-muted-foreground">
                    {formatDatePl(action.date)} · {action.actionType} · {action.title}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lectureDone"
                  {...register("lectureDone")}
                  className="size-4 rounded border-input text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="lectureDone" className="text-xs font-semibold text-foreground cursor-pointer">
                  Prelekcja przeprowadzona
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Rejestr działań nie ma prelekcji tego programu w tej placówce w wybranym roku szkolnym. Zaznacz, jeśli odbyła się poza rejestrem.
              </p>
            </div>
          )}
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
