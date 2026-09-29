import type { UseFormRegisterReturn } from "react-hook-form";
import { Key, Lock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";

/** Domyślny kod pocztowy gminy (słownik gmin). */
export function DictionaryPostalCodeField({ field }: { field: UseFormRegisterReturn }) {
  return (
      <div className="space-y-1.5 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 rounded-[3px]">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-blue-950 dark:text-blue-200">
            <MapPin className="size-3.5 text-blue-600" />
            <span>Domyślny Kod Pocztowy Gminy</span>
          </span>
          <span className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
            Format: 74-XXX
          </span>
        </label>
        <Input
          type="text"
          placeholder="np. 74-300 (Myślibórz), 74-320 (Barlinek), 74-400 (Dębno)..."
          {...field}
          className="h-8 text-xs font-mono font-semibold bg-background"
        />
        <p className="text-[10.5px] text-blue-800/90 dark:text-blue-300/80 leading-tight">
          Kod pocztowy przypisany do tej gminy będzie automatycznie podpowiadany i uzupełniany przy wprowadzaniu
          placówek oświatowych.
        </p>
      </div>
  );
}

interface DictionaryCodeFieldProps {
  codeField: UseFormRegisterReturn;
  isCodeLocked: boolean;
  codeError?: string;
  duplicateCode?: OzipzDictionaryItem;
  onGenerateCode: () => void;
}

/** Kod pozycji z generowaniem z nazwy i blokadą dla pozycji systemowych. */
export function DictionaryCodeField({ codeField, isCodeLocked, codeError, duplicateCode, onGenerateCode }: DictionaryCodeFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Key className="size-3.5 text-primary" />
          <span>
            Kod / Identyfikator w Systemie <span className="text-destructive">*</span>
          </span>
        </span>
        {!isCodeLocked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGenerateCode}
            className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 gap-1 font-medium cursor-pointer"
          >
            <Sparkles className="size-3" /> Generuj z nazwy
          </Button>
        )}
      </label>
      <div className="relative">
        <Input
          type="text"
          placeholder="np. prelekcja_multimedialna lub kod edu-report (np. 5xwky)"
          {...codeField}
          readOnly={isCodeLocked}
          className={`h-9 text-xs font-mono ${isCodeLocked ? "pr-8 bg-muted/50 text-muted-foreground" : ""}`}
        />
        {isCodeLocked && <Lock className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />}
      </div>
      {codeError && <p className="text-[10px] text-destructive font-semibold">{codeError}</p>}
      {!codeError && duplicateCode && (
        <p className="text-[10px] text-destructive font-semibold">
          Kod jest już zajęty przez pozycję „{duplicateCode.label}”.
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        {isCodeLocked
          ? "Kod pozycji systemowej jest zablokowany — korzystają z niego raporty i automatyczne klasyfikacje."
          : "Unikalny kod identyfikujący pozycję w relacyjnej bazie danych i filtrach. Uzupełnia się automatycznie z nazwy."}
      </p>
    </div>
  );
}

/** Przełącznik pozycji systemowej (chronionej przed usunięciem i zmianą kodu). */
export function DictionarySystemToggle({ field, checked }: { field: UseFormRegisterReturn; checked: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-[3px] border border-border/80 bg-muted/30">
      <div>
        <div className="text-xs font-semibold text-foreground">Pozycja systemowa</div>
        <div className="text-[11px] text-muted-foreground">
          Pozycje systemowe są chronione przed usunięciem, a ich kod nie może być zmieniany
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} {...field} className="sr-only peer" />
        <div className="w-9 h-5 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
