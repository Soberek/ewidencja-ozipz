import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_AI_MODEL, loadAiSettings, saveAiSettings } from "../../utils/aiDescription";

/** Klucz OpenRouter do generowania opisów działań. Zapisywany tylko na tym komputerze, poza bazą i kopiami zapasowymi. */
export function AiSettingsCard() {
  const [saved, setSaved] = useState(loadAiSettings);
  const [apiKey, setApiKey] = useState(saved.apiKey);
  const [model, setModel] = useState(saved.model);
  const dirty = apiKey.trim() !== saved.apiKey || (model.trim() || DEFAULT_AI_MODEL) !== saved.model;

  const handleSave = () => {
    try {
      saveAiSettings({ apiKey, model });
      setSaved(loadAiSettings());
      toast.success("Ustawienia asystenta AI zapisane");
    } catch {
      toast.error("Nie udało się zapisać ustawień asystenta AI");
    }
  };

  return (
    <Card className="p-4 bg-card border-border shadow-none space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
        <Sparkles className="size-3.5" /> Asystent AI (opisy działań)
      </h4>
      <p className="text-xs text-muted-foreground">
        Przycisk „Wygeneruj opis z AI” w formularzu działania i szablonu wysyła do OpenRouter wybrane dane działania
        (forma, program, tematyka, odbiorcy, miejsce, data, materiały) oraz wpisany już tekst. Imiona i nazwiska osób nie są wysyłane.
        Klucz jest zapisany tylko na tym komputerze – nie trafia do bazy ani do kopii zapasowych.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ai-api-key" className="block text-xs font-semibold text-foreground">Klucz API OpenRouter</label>
          <Input id="ai-api-key" type="password" autoComplete="off" value={apiKey} placeholder="sk-or-v1-…"
            onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ai-model" className="block text-xs font-semibold text-foreground">Model</label>
          <Input id="ai-model" value={model} placeholder={DEFAULT_AI_MODEL} onChange={(e) => setModel(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} disabled={!dirty}>Zapisz</Button>
      </div>
    </Card>
  );
}
