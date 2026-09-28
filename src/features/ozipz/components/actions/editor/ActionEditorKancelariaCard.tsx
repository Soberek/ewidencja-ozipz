import { Bookmark, Hash, FileText, Check, Lock, Info, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface ActionEditorKancelariaCardProps {
  showDate?: boolean;
  date?: string;
  selectedJrwaSymbol?: string;
  jrwaSign?: string;
  izrzSign?: string;
  ezdStatus?: string;
  isPublication?: boolean;
  isDistribution?: boolean;
  onDateChange: (val: string) => void;
  onJrwaSignChange?: (val: string) => void;
  onGenerateJrwaSign?: () => void;
  onIzrzSignChange: (val: string) => void;
  onEzdStatusChange: (val: string) => void;
}

export function ActionEditorKancelariaCard({
  showDate = true,
  date = "",
  selectedJrwaSymbol = "",
  jrwaSign = "",
  izrzSign = "",
  ezdStatus = "",
  isPublication = false,
  isDistribution = false,
  onDateChange,
  onJrwaSignChange,
  onGenerateJrwaSign,
  onIzrzSignChange,
  onEzdStatusChange,
}: ActionEditorKancelariaCardProps) {
  const isLocked = Boolean(isPublication || isDistribution);

  return (
    <Card className="p-4 border-border/80 bg-muted/20 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Bookmark className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Dane kancelaryjne
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPublication && (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1 font-semibold">
              <Lock className="size-3" /> Publikacja media (EZD zablokowane)
            </Badge>
          )}
          {isDistribution && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 font-semibold">
              <Lock className="size-3" /> Samoistna dystrybucja (EZD zablokowane)
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono">
            Sekcja OZiPZ
          </Badge>
        </div>
      </div>

      {isPublication && (
        <div className="py-1.5 px-3 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
          <Info className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Dla publikacji w mediach (Portal X, Facebook, www) pola <strong>Numer IZRZ</strong>, <strong>Znak sprawy</strong> oraz <strong>Status EZD</strong> są automatycznie zablokowane i nie podlegają rejestracji w kancelarii.</span>
        </div>
      )}

      {isDistribution && (
        <div className="py-1.5 px-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
          <Info className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Dla samoistnej dystrybucji materiałów pola <strong>Numer IZRZ</strong>, <strong>Znak sprawy</strong> oraz <strong>Status EZD</strong> są automatycznie zablokowane i nie podlegają rejestracji w kancelarii.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Data realizacji */}
        {showDate && <div className="space-y-1">
          <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
            <CalendarIcon className="size-3 text-primary" /> Data realizacji <span className="text-destructive">*</span>
          </label>
          <DatePicker
            value={date}
            onChange={onDateChange}
            placeholder="Wybierz datę..."
            size="sm"
            required
          />
        </div>}

        {/* 2. Znak Sprawy JRWA */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-foreground flex items-center gap-1 truncate">
              <Hash className="size-3 text-primary" /> Znak Sprawy JRWA
            </label>
            {!isLocked && onGenerateJrwaSign && (
              <button
                type="button"
                onClick={onGenerateJrwaSign}
                className="text-[9px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                title="Wygeneruj kolejny wolny znak sprawy w teczce JRWA"
              >
                <RefreshCw className="size-2.5" /> Auto-Generuj
              </button>
            )}
          </div>
          {isLocked ? (
            <div className="flex items-center h-8 px-2.5 rounded-[3px] border border-input text-xs font-mono font-bold bg-muted text-muted-foreground italic cursor-not-allowed">
              <span className="flex items-center gap-1 text-[11px]">
                <Lock className="size-3 shrink-0" /> Nie dotyczy
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                placeholder="np. OZiPZ.966.1.1.2026"
                value={jrwaSign}
                onChange={(e) => onJrwaSignChange?.(e.target.value)}
                className="h-8 text-xs font-mono font-bold flex-1"
              />
              {selectedJrwaSymbol && (
                <Badge
                  variant="outline"
                  className="h-8 px-1.5 text-[9px] font-mono font-bold bg-primary/10 text-primary border-primary/30 shrink-0"
                >
                  JRWA {selectedJrwaSymbol}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 3. Numer w IZRZ */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
            <FileText className="size-3 text-primary" /> Numer w IZRZ
          </label>
          <Input
            type="text"
            placeholder={isLocked ? "- Nie dotyczy -" : "np. 91/2026"}
            value={isLocked ? "" : izrzSign}
            onChange={(e) => onIzrzSignChange(e.target.value)}
            disabled={isLocked}
            className={`h-8 text-xs font-mono font-bold ${
              isLocked ? "bg-muted text-muted-foreground cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* 4. Status w EZD */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
            <Check className="size-3 text-cyan-600" /> Status w EZD
          </label>
          <Select
            value={isLocked ? "nie_dotyczy" : ezdStatus}
            onChange={onEzdStatusChange}
            disabled={isLocked}
            options={[
              { value: "", label: "-- Wybierz status EZD --" },
              { value: "w_ezd", label: "✔ w EZD (zarejestrowane)", badge: "EZD", badgeVariant: "success" },
              { value: "do_ezd", label: "! do EZD (wymaga wpisu)", badge: "DO WPISU", badgeVariant: "warning" },
              { value: "nie_dotyczy", label: "- Nie dotyczy", badge: "BRAK", badgeVariant: "outline" },
            ]}
            searchable={false}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}
