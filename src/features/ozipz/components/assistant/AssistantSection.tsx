import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Sparkles, Settings, RefreshCw, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { assistantClient } from "@/db/assistant/client";
import { useAssistantStore } from "../../store/useAssistantStore";
import { AssistantSettings } from "./AssistantSettings";
import { AssistantDraftEditor } from "./AssistantDraftEditor";
import { AssistantConversation } from "./AssistantConversation";
import { AssistantEvidence } from "./AssistantEvidence";
export function AssistantSection() {
  const state = useAssistantStore();
  const [settings, setSettings] = useState(false);
  const [reply, setReply] = useState("");
  useEffect(() => {
    if (isTauri()) void useAssistantStore.getState().load();
  }, []);
  if (!isTauri())
    return (
      <Card className="max-w-2xl mx-auto mt-12 p-6 space-y-3">
        <Sparkles className="size-8 text-primary" />
        <h1 className="text-xl font-semibold">Asystent AI</h1>
        <p>
          Otwórz Ewidencję OZiPZ jako aplikację na komputerze. Asystent
          potrzebuje dostępu do wybranych folderów oraz systemowego magazynu
          klucza OpenRoutera.
        </p>
        <p className="text-sm text-muted-foreground">
          W przeglądarce materiały i klucz nie są przesyłane. Konfiguracja jest
          dostępna w wersji desktopowej.
        </p>
      </Card>
    );
  return (
    <div className="space-y-4 max-w-[1700px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold flex gap-2 items-center">
            <Sparkles className="size-5 text-primary" />
            Asystent AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Pisma oparte na Twoich materiałach i szablonie Worda
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!!state.busy}
            onClick={() => {
              state.selectDraft(null);
              setReply("");
              setSettings(false);
            }}
          >
            <Plus className="size-4 mr-1" />
            Nowy projekt
          </Button>
          <Button
            variant="outline"
            disabled={!!state.busy}
            onClick={() =>
              void state.run("Odświeżanie indeksu dokumentów", async () => {
                await assistantClient.refresh();
                useAssistantStore.setState({
                  snapshot: await assistantClient.load(),
                  notice: "Indeks odświeżony",
                });
              })
            }
          >
            <RefreshCw className="size-4 mr-1" />
            Odśwież
          </Button>
          <Button
            variant={settings ? "default" : "outline"}
            disabled={!!state.busy}
            onClick={() => setSettings(!settings)}
          >
            <Settings className="size-4 mr-1" />
            {settings ? "Wróć do pisma" : "Ustawienia asystenta"}
          </Button>
        </div>
      </div>
      {state.busy && (
        <p
          role="status"
          className="flex gap-2 text-sm items-center p-3 bg-primary/5 border rounded"
        >
          <Loader2 className="size-4 animate-spin" />
          {state.busy}
        </p>
      )}
      {state.error && (
        <div
          role="alert"
          className="text-sm bg-destructive/10 border border-destructive/30 rounded p-3"
        >
          {state.error}
          <Button
            className="ml-2"
            variant="ghost"
            disabled={!!state.busy}
            onClick={() => void state.load()}
          >
            Odśwież stan
          </Button>
        </div>
      )}
      {state.notice && (
        <p
          role="status"
          className="text-sm text-emerald-700 p-3 border rounded"
        >
          {state.notice}
        </p>
      )}
      {state.snapshot && (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{state.snapshot.documents.length} dokumentów w indeksie</span>
            <span>
              Koszt {state.snapshot.usage.month}:{" "}
              {state.snapshot.usage.cost.toFixed(4)} /{" "}
              {state.snapshot.config.monthlyLimitUsd.toFixed(2)} USD
              {state.snapshot.usage.pending > 0
                ? " (w tym rezerwacja do rozliczenia)"
                : ""}
            </span>
          </div>
          {state.snapshot.indexError && (
            <p role="alert" className="text-sm text-amber-700">
              Ostatnie indeksowanie: {state.snapshot.indexError}
            </p>
          )}
          {settings ? (
            <AssistantSettings initial={state.snapshot.config} />
          ) : (
            <>
              {!state.snapshot.config.programs.length && (
                <Card className="p-5 space-y-2">
                  <h2 className="font-semibold">
                    Przygotuj asystenta do pierwszego pisma
                  </h2>
                  <p className="text-sm">
                    W ustawieniach wskaż wspólny folder materiałów, wybierz
                    szablon, ustal styl i dodaj klucz OpenRoutera. Podfoldery
                    programów rozpoznamy automatycznie.
                  </p>
                  <Button onClick={() => setSettings(true)}>
                    Otwórz konfigurację
                  </Button>
                </Card>
              )}
              <Card className="p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm space-y-2">
                    <p className="font-medium">
                      Program rozpoznaję automatycznie z polecenia
                    </p>
                    {state.draft && (
                      <p className="text-muted-foreground">
                        Materiały:{" "}
                        {state.snapshot.config.programs.find(
                          (p) => p.id === state.draft?.programId,
                        )?.name ?? "program zapisany w projekcie"}
                      </p>
                    )}
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">
                        Doprecyzuj program, jeśli potrzeba
                      </summary>
                      <Select
                        label="Program (opcjonalnie)"
                        disabled={!!state.busy}
                        value={state.programId}
                        onChange={state.setProgram}
                        clearable
                        options={state.snapshot.config.programs.map((p) => ({
                          value: p.id,
                          label: p.edition
                            ? `${p.name} — ${p.edition}`
                            : p.name,
                        }))}
                        placeholder="Automatycznie z polecenia"
                      />
                    </details>
                  </div>
                  <Select
                    label="Zapisane projekty"
                    disabled={!!state.busy}
                    value={state.draft?.id ?? ""}
                    onChange={(id) => {
                      state.selectDraft(
                        state.snapshot?.drafts.find((d) => d.id === id) ?? null,
                      );
                      setReply("");
                    }}
                    options={state.snapshot.drafts.map((d) => ({
                      value: d.id,
                      label: d.subject || d.request.slice(0, 90),
                    }))}
                    placeholder="Otwórz projekt"
                  />
                </div>
                <label className="block text-sm font-medium">
                  Co przygotować?
                  <Textarea
                    disabled={!!state.busy}
                    rows={3}
                    value={state.request}
                    onChange={(e) => state.setRequest(e.target.value)}
                    placeholder="Napisz pismo do dyrektorów szkół podstawowych zapraszające do programu HNT…"
                  />
                </label>
                {state.draft && (
                  <label className="block text-sm">
                    Twoje odpowiedzi i dalsze wskazówki
                    <Textarea
                      disabled={!!state.busy}
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Podaj brakujący termin lub poproś o zmianę projektu."
                    />
                  </label>
                )}
                <Button
                  disabled={!!state.busy || !state.request.trim()}
                  onClick={() => {
                    if (reply.trim()) {
                      state.setRequest(
                        `${state.request}\n\nUzupełnienie użytkownika:\n${reply.trim()}`,
                      );
                      setReply("");
                    }
                    void useAssistantStore.getState().generate();
                  }}
                >
                  {state.draft
                    ? "Przygotuj ponownie z uzupełnieniami"
                    : "Przygotuj pismo"}
                </Button>
              </Card>
              {state.draft && (
                <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
                  <AssistantDraftEditor draft={state.draft} />
                  <AssistantEvidence draft={state.draft} />
                </div>
              )}
            </>
          )}
          {state.draft && !settings && (
            <AssistantConversation key={state.draft.id} draft={state.draft} />
          )}
          <details className="text-sm">
            <summary className="cursor-pointer">
              Stan odczytu dokumentów
            </summary>
            <ul className="mt-2 max-h-60 overflow-auto space-y-1">
              {state.snapshot.documents.map((doc, i) => (
                <li
                  key={`${doc.path}-${i}`}
                  className="flex gap-3 justify-between border-b py-1"
                >
                  <span className="break-all">{doc.path}</span>
                  <span
                    className={
                      doc.status === "gotowy"
                        ? "text-emerald-700 shrink-0"
                        : "text-amber-700"
                    }
                  >
                    {doc.status}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
