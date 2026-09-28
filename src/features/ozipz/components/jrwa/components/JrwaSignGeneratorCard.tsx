import { useState } from "react";
import { Bookmark, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";
import { JRWA_CLASSES_DEFINITIONS } from "../../../constants";

export interface JrwaSignGeneratorCardProps {
  section: string;
  onSectionChange: (val: string) => void;
  jrwaSymbol: string;
  onJrwaSymbolChange: (val: string) => void;
  caseNumber: number;
  onCaseNumberChange: (val: number) => void;
  year: number;
  onYearChange: (val: number) => void;
  fullCaseSign: string;
  onFullCaseSignChange?: (val: string) => void;
  jrwaDictItems: OzipzDictionaryItem[];
  onSelectQuickSymbol: (sym: string) => void;
  isReadOnly?: boolean;
}

export function JrwaSignGeneratorCard({
  section,
  onSectionChange,
  jrwaSymbol,
  onJrwaSymbolChange,
  caseNumber,
  onCaseNumberChange,
  year,
  onYearChange,
  fullCaseSign,
  onSelectQuickSymbol,
  isReadOnly,
}: JrwaSignGeneratorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySign = () => {
    if (!fullCaseSign) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullCaseSign);
    }
    setCopied(true);
    toast.success(`Skopiowano znak: ${fullCaseSign}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3 bg-muted/40 rounded-[3px] border border-border space-y-3">
      {/* Szybkie wybory symbolu JRWA */}
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
          Wybierz hasło klasyfikacyjne z wykazu:
        </label>
        <div className="flex flex-wrap gap-1">
          {JRWA_CLASSES_DEFINITIONS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => onSelectQuickSymbol(c.code)}
              disabled={isReadOnly}
              className={`rounded-[3px] px-2 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1 ${
        jrwaSymbol === c.code
         ? "bg-blue-600 text-white font-bold shadow-xs"
         : "bg-background text-foreground hover:bg-muted border border-border"
       }`}
            >
              <span className="font-mono font-bold">{c.code}</span>
              <span className="text-[10px] opacity-80 truncate max-w-[140px]">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Składowe znaku sprawy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Komórka (Sekcja):
          </label>
          <Input
            value={section}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={isReadOnly}
            className="text-xs h-8 font-mono"
            placeholder="OZiPZ"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Hasło (Symbol):
          </label>
          <Input
            value={jrwaSymbol}
            onChange={(e) => onJrwaSymbolChange(e.target.value)}
            disabled={isReadOnly}
            className="text-xs h-8 font-mono"
            placeholder="np. 966.1"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Nr sprawy w roku:
          </label>
          <Input
            type="number"
            min={1}
            value={caseNumber}
            onChange={(e) => onCaseNumberChange(parseInt(e.target.value, 10) || 1)}
            disabled={isReadOnly}
            className="text-xs h-8 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Rok kalendarzowy:
          </label>
          <Input
            type="number"
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10) || new Date().getFullYear())}
            disabled={isReadOnly}
            className="text-xs h-8 font-mono"
          />
        </div>
      </div>

      {/* Podgląd wygenerowanego pełnego znaku sprawy */}
      <div className="flex items-center justify-between p-2 rounded-[2px] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Bookmark className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs text-foreground shrink-0">Pełny znak sprawy:</span>
          <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 ml-1 truncate">
            {fullCaseSign}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopySign}
          disabled={!fullCaseSign}
          className="px-2 py-0.5 text-[11px] font-semibold rounded-[2px] bg-background border border-border hover:bg-muted flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          title="Kopiuj pełny znak sprawy do schowka"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Skopiowano</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-muted-foreground" />
              <span>Kopiuj</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
