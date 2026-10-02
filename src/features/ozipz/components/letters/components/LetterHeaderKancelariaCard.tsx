import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Send, Inbox, Calendar, FileText } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { LetterFormInput } from "../LetterDialog";

interface LetterHeaderKancelariaCardProps {
  register: UseFormRegister<LetterFormInput>;
  errors: FieldErrors<LetterFormInput>;
  direction: string;
  onDirectionChange?: (val: "wychodzace" | "przychodzace") => void;
  letterDate?: string;
  onLetterDateChange?: (date: string) => void;
}

const directionOptions: SelectOption[] = [
  { value: "wychodzace", label: "Pismo Wychodzące", icon: Send, badge: "WYCH.", badgeVariant: "secondary" },
  { value: "przychodzace", label: "Pismo Przychodzące", icon: Inbox, badge: "PRZYCH.", badgeVariant: "outline" },
];

export function LetterHeaderKancelariaCard({
  register,
  errors,
  direction,
  onDirectionChange,
  letterDate = "",
  onLetterDateChange,
}: LetterHeaderKancelariaCardProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-muted/20 border border-border/70 rounded-[3px]">
        <div className="space-y-1">
          <label htmlFor="letter-direction" className="font-bold text-foreground flex items-center gap-1 text-xs">
            {direction === "wychodzace" ? (
              <Send className="size-3 text-blue-600" />
            ) : (
              <Inbox className="size-3 text-emerald-600" />
            )}
            <span>Kierunek Pisma</span>
          </label>
          <Select
            id="letter-direction"
            value={direction || "wychodzace"}
            onChange={(val) => onDirectionChange?.(val as "wychodzace" | "przychodzace")}
            options={directionOptions}
            searchable={false}
            size="sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="letter-number" className="font-bold text-foreground text-xs">
            Numer Pisma <span className="text-destructive">*</span>
          </label>
          <Input
            id="letter-number"
            type="text"
            placeholder="np. OZ.966.1.12.2026 lub SP2/34/2026"
            {...register("letterNumber")}
            className="h-8 text-xs font-mono font-bold"
            autoFocus
          />
          {errors.letterNumber && (
            <p className="text-[10px] text-destructive font-semibold">
              {errors.letterNumber.message as string}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="letter-date" className="font-bold text-foreground flex items-center gap-1 text-xs">
            <Calendar className="size-3 text-primary" /> Data Pisma <span className="text-destructive">*</span>
          </label>
          <DatePicker
            id="letter-date"
            value={letterDate}
            onChange={(d) => onLetterDateChange?.(d)}
            placeholder="Wybierz datę pisma..."
            size="sm"
            required
          />
          {errors.letterDate && (
            <p className="text-[10px] text-destructive font-semibold">
              {errors.letterDate.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="letter-subject" className="font-bold text-foreground flex items-center gap-1.5 text-xs">
          <FileText className="size-3.5 text-primary" />
          <span>
            Przedmiot Pisma / Dotyczy <span className="text-destructive">*</span>
          </span>
        </label>
        <Input
          id="letter-subject"
          type="text"
          placeholder="np. Zaproszenie na naradę koordynatorów, przekazanie materiałów..."
          {...register("subject")}
          className="h-8 text-xs font-medium"
        />
        {errors.subject && (
          <p className="text-[10px] text-destructive font-semibold">
            {errors.subject.message as string}
          </p>
        )}
      </div>
    </>
  );
}
