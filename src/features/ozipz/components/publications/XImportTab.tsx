import { useState } from "react";
import { Loader2, PlusCircle, RefreshCw, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceHeader } from "./import/components/SourceHeader";
import { SourceImportPanel } from "./import/components/SourceImportPanel";
import { useXLoader } from "./import/useSourceLoaders";
import { useSourceImport } from "./import/useSourceImport";
import { X_PROFILE_URL } from "./sources/xSource";

export function XImportTab() {
  const state = useSourceImport("x");
  const loader = useXLoader(state.addItems, state.programs);
  const [links, setLinks] = useState("");

  const submitLinks = async () => {
    if (await loader.addByLinks(links)) setLinks("");
  };

  return (
    <SourceImportPanel
      state={state}
      isLoading={loader.isLoading}
      error={loader.error}
      loadingLabel="Pobieranie najnowszych wpisów z profilu @PSSEMysliborz…"
      header={
        <SourceHeader
          icon={Twitter}
          title="Profil X – @PSSEMysliborz"
          href={X_PROFILE_URL}
          description="Najnowsze wpisy pobierane są z publicznej osi czasu profilu (bez podań dalej). X bywa niedostępny lub ogranicza zapytania – wtedy wklej linki do wpisów poniżej. Wpisy porównywane są z ewidencją po numerze wpisu, a starsze działania bez linku – po treści i dacie."
          actions={
            <Button variant="outline" onClick={loader.loadTimeline} disabled={loader.isLoading}>
              {loader.isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Pobierz najnowsze
            </Button>
          }
        >
          <form
            className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitLinks();
            }}
          >
            <Input
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Wklej link(i) do wpisów, np. https://x.com/PSSEMysliborz/status/2088667997883732462"
              aria-label="Linki do wpisów X"
              className="h-8 min-w-[260px] flex-1 text-xs"
            />
            <Button type="submit" variant="outline" disabled={!links.trim() || loader.isLoading}>
              <PlusCircle className="size-3.5" /> Dodaj wpisy
            </Button>
          </form>
        </SourceHeader>
      }
    />
  );
}
