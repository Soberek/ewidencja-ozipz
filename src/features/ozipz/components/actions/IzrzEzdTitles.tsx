import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EzdTitle } from "../../utils/ezdTitles";

interface IzrzEzdTitlesProps {
  titles: EzdTitle[];
  className?: string;
}

export function IzrzEzdTitles({ titles, className = "px-4 py-3 border-b border-border" }: IzrzEzdTitlesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (title: EzdTitle) => {
    try {
      await navigator.clipboard.writeText(title.text);
      setCopiedId(title.id);
      window.setTimeout(() => setCopiedId((current) => (current === title.id ? null : current)), 1800);
    } catch {
      toast.error("Nie udało się skopiować do schowka — zaznacz tekst i skopiuj ręcznie.");
    }
  };

  if (titles.length === 0) return null;

  return (
    <section aria-label="Tytuły do EZD" className={`${className} space-y-1.5`}>
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tytuły do EZD</h3>
      <ul className="space-y-1">
        {titles.map((title) => (
          <li key={title.id} className="flex items-center gap-2">
            <span className="w-44 shrink-0 text-[11px] text-muted-foreground">{title.label}</span>
            <span className="min-w-0 flex-1 rounded-[3px] border border-border bg-muted/30 px-2 py-1 text-xs select-text break-words">
              {title.text}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => copy(title)}
              className="h-7 w-28 shrink-0 gap-1.5 px-2 text-xs"
              aria-label={`Kopiuj: ${title.label}`}
            >
              {copiedId === title.id ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copiedId === title.id ? "Skopiowano" : "Kopiuj"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
