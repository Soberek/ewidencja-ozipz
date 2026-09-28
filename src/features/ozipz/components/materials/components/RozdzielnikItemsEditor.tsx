import { Plus, Trash2 } from "lucide-react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RozdzielnikItem } from "../../../utils/rozdzielnikPrint";

interface RozdzielnikItemsEditorProps {
  items: RozdzielnikItem[];
  onChange: (items: RozdzielnikItem[]) => void;
  /** Tytuły z katalogu materiałów jako podpowiedzi. */
  materialTitles: string[];
}

export function RozdzielnikItemsEditor({ items, onChange, materialTitles }: RozdzielnikItemsEditorProps) {
  const update = (index: number, patch: Partial<RozdzielnikItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-1.5">
      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Brak materiałów — na wydruku zostanie jeden pusty wiersz do wpisania ręcznie.
        </p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex gap-1.5 items-center">
          <Autocomplete
            aria-label={`Materiał ${index + 1}`}
            value={item.title}
            onChange={(title) => update(index, { title })}
            options={materialTitles}
            placeholder="Rodzaj materiału / tytuł"
            size="sm"
            className="flex-1 min-w-0"
          />
          <Input
            aria-label={`Liczba sztuk ${index + 1}`}
            type="number"
            min={0}
            value={item.quantity ?? ""}
            onChange={(e) => update(index, { quantity: e.target.value === "" ? undefined : Number(e.target.value) })}
            className="w-16 text-right"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Usuń materiał ${index + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { title: "" }])}
        className="gap-1.5 text-xs"
      >
        <Plus className="size-3.5" />
        Dodaj pozycję
      </Button>
    </div>
  );
}
