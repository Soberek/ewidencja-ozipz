import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { assistantClient } from "@/db/assistant/client";
import { useAssistantStore } from "../../store/useAssistantStore";
import type { AssistantConfig } from "../../types/assistant.types";

export function AssistantSettings({ initial }: { initial: AssistantConfig }) {
  const [config, setConfig] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [settledCost, setSettledCost] = useState("");
  const { run, busy, saveConfig, snapshot } = useAssistantStore();
  const update = (changes: Partial<AssistantConfig>) =>
    setConfig((old) => ({ ...old, ...changes }));
  const choose = (action: () => Promise<void>) =>
    void run("Wybieranie plików", action);
  return (
    <fieldset disabled={!!busy} className="space-y-4">
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Wspólny folder materiałów</h2>
        <p className="text-sm text-muted-foreground">
          Wskaż tylko jeden folder główny. Jego podfoldery, np. „Higiena naszą
          tarczą” i „Porozmawiajmy o zdrowiu i nowych zagrożeniach”, zostaną
          rozpoznane jako programy. W ich środku możesz trzymać kolejne
          podfoldery z materiałami i edycjami.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              choose(async () => {
                const path = await open({ directory: true, multiple: false });
                if (typeof path === "string") update({ rootFolder: path });
              })
            }
          >
            Wybierz wspólny folder
          </Button>
          <span className="text-sm break-all">
            {config.rootFolder || "Nie wybrano folderu głównego"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Zapisz ustawienia. Nowe podfoldery będą wykrywane automatycznie; nie
          trzeba przypisywać każdego programu ani edycji ręcznie. Pliki
          umieszczaj w podfolderze programu.
        </p>
        {snapshot?.config.rootFolder === config.rootFolder &&
          config.rootFolder && (
            <div>
              <h3 className="text-sm font-medium">
                Wykryte programy ({snapshot.config.programs.length})
              </h3>
              <ul className="mt-2 text-sm space-y-1">
                {snapshot.config.programs.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}
        {!config.rootFolder && config.programs.length > 0 && (
          <p className="text-sm text-amber-700">
            Dotychczasowe przypisania zachowano. Wybierz wspólny folder, aby
            przełączyć się na automatyczne rozpoznawanie podfolderów.
          </p>
        )}
      </Card>
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Szablon Worda i styl pism</h2>
        <p className="text-sm text-muted-foreground">
          W kopii Twojego DOCX oznacz pola:{" "}
          {"{data}, {znak_sprawy}, {adresat}, {temat}, {tresc}, {podpis}"}. Pole{" "}
          {"{tresc}"} jest wymagane. Nagłówek i stopka pozostają w szablonie.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            onClick={() =>
              choose(async () => {
                const path = await open({
                  multiple: false,
                  filters: [{ name: "Word", extensions: ["docx"] }],
                });
                if (typeof path === "string") update({ templatePath: path });
              })
            }
          >
            Wybierz szablon DOCX
          </Button>
          <span className="text-xs break-all">
            {config.templatePath || "Nie wybrano"}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            choose(async () => {
              const paths = await open({
                multiple: true,
                filters: [
                  {
                    name: "Pisma wzorcowe",
                    extensions: ["docx", "pdf", "txt", "md"],
                  },
                ],
              });
              if (paths)
                update({
                  styleFiles: Array.isArray(paths) ? paths : [paths],
                  styleApproved: false,
                });
            })
          }
        >
          Wybierz przykładowe pisma
        </Button>
        <ul className="text-xs space-y-1">
          {config.styleFiles.map((path) => (
            <li key={path} className="break-all">
              {path}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          onClick={() =>
            void run("Analiza stylu pism", async () => {
              await assistantClient.saveConfig(config);
              const result = await assistantClient.style();
              update({ style: result.style, styleApproved: false });
            })
          }
        >
          Zaproponuj zasady z przykładów
        </Button>
        <label className="block text-sm">
          Zasady stylu
          <Textarea
            rows={7}
            value={config.style}
            onChange={(e) =>
              update({ style: e.target.value, styleApproved: false })
            }
            placeholder="Możesz też wpisać własne zasady."
          />
        </label>
        <label className="flex gap-2 text-sm items-center">
          <input
            type="checkbox"
            checked={config.styleApproved}
            onChange={(e) => update({ styleApproved: e.target.checked })}
          />
          Zatwierdzam powyższe zasady stylu
        </label>
      </Card>
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">OpenRouter i oficjalne strony</h2>
        <p className="text-sm text-muted-foreground">
          Wybrane fragmenty dokumentów trafiają do OpenRoutera i dostawcy
          wybranego modelu. Klucz pozostaje w magazynie poświadczeń komputera.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Identyfikator modelu
            <Input
              value={config.model}
              onChange={(e) => update({ model: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Miesięczny limit (USD)
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={config.monthlyLimitUsd}
              onChange={(e) =>
                update({ monthlyLimitUsd: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <label className="block text-sm">
          Nowy klucz API{" "}
          {snapshot?.hasKey ? "— klucz jest już zapisany" : "— brak klucza"}
          <Input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!apiKey.trim()}
            onClick={() =>
              void run("Zapisywanie klucza", async () => {
                await assistantClient.saveKey(apiKey);
                setApiKey("");
                useAssistantStore.setState({
                  snapshot: await assistantClient.load(),
                  notice: "Klucz zapisany w magazynie poświadczeń",
                });
              })
            }
          >
            Zapisz klucz
          </Button>
          {snapshot?.hasKey && (
            <Button
              variant="ghost"
              onClick={() =>
                void run("Usuwanie klucza", async () => {
                  await assistantClient.deleteKey();
                  useAssistantStore.setState({
                    snapshot: await assistantClient.load(),
                  });
                })
              }
            >
              Usuń klucz
            </Button>
          )}
        </div>
        <label className="block text-sm">
          Dozwolone domeny — jedna w wierszu
          <Textarea
            rows={3}
            value={config.domains.join("\n")}
            onChange={(e) => update({ domains: e.target.value.split("\n") })}
            placeholder="np. www.gov.pl"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Pusta lista wyłącza internet. Wyszukiwanie uzupełnia braki po analizie
          folderu. Koszt jest rozliczany w USD bez automatycznej zmiany modelu.
        </p>
        {!!snapshot?.usage.pending && (
          <div className="border border-amber-500 rounded p-3 space-y-2">
            <p className="text-sm">
              Wywołanie ma nieustalony koszt. Sprawdź historię OpenRoutera i
              podaj łączny rzeczywisty koszt nierozliczonych wywołań z bieżącego
              miesiąca.
            </p>
            <Input
              aria-label="Rzeczywisty koszt"
              type="number"
              step="0.000001"
              min="0"
              value={settledCost}
              onChange={(e) => setSettledCost(e.target.value)}
            />
            <Button
              variant="outline"
              disabled={settledCost === ""}
              onClick={() =>
                void run("Rozliczanie kosztu", async () => {
                  await assistantClient.settleUsage(Number(settledCost));
                  useAssistantStore.setState({
                    snapshot: await assistantClient.load(),
                  });
                })
              }
            >
              Zapisz koszt z historii OpenRoutera
            </Button>
          </div>
        )}
      </Card>
      <Button
        onClick={() =>
          void saveConfig({
            ...config,
            domains: config.domains
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean),
            programs: config.programs.map((p) => ({
              ...p,
              aliases: p.aliases.map((s) => s.trim()).filter(Boolean),
            })),
          })
        }
      >
        Zapisz ustawienia asystenta
      </Button>
    </fieldset>
  );
}
