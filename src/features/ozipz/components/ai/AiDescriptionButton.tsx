import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateDescription, type DescriptionFact, type DescriptionMode } from "../../utils/aiDescription";

interface AiDescriptionButtonProps {
  mode: DescriptionMode;
  /** Dane wybrane w formularzu – czytane dopiero w chwili kliknięcia, więc zawsze aktualne. */
  getFacts: () => readonly DescriptionFact[];
  value: string;
  onChange: (text: string) => void;
}

/**
 * Jeden przycisk: z wybranych w formularzu danych i tego, co już wpisano w opisie, powstaje jeden opis.
 * Poprzednią treść można przywrócić z komunikatu – wygenerowany tekst zastępuje pole.
 */
export function AiDescriptionButton({ mode, getFacts, value, onChange }: AiDescriptionButtonProps) {
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async () => {
    const previous = value;
    setIsBusy(true);
    try {
      const text = await generateDescription(mode, getFacts(), previous);
      onChange(text);
      toast.success("Opis wygenerowany – sprawdź go przed zapisaniem", previous.trim()
        ? { action: { label: "Cofnij", onClick: () => onChange(previous) } }
        : undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void handleClick()} disabled={isBusy}
      title="Opis powstanie z wybranych w formularzu danych i tego, co już wpisano w polu">
      {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      {isBusy ? "Piszę opis…" : value.trim() ? "Przeredaguj z AI" : "Wygeneruj opis z AI"}
    </Button>
  );
}
