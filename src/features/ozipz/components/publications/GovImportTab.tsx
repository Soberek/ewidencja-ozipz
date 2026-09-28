import { ChevronsDown, Landmark, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceHeader } from "./import/components/SourceHeader";
import { SourceImportPanel } from "./import/components/SourceImportPanel";
import { useGovLoader } from "./import/useSourceLoaders";
import { useSourceImport } from "./import/useSourceImport";
import { GOV_AKTUALNOSCI_BASE } from "./sources/govSource";

export function GovImportTab() {
  const state = useSourceImport("gov");
  const loader = useGovLoader(state.addItems, state.programs);

  const pagesLabel = loader.loadedPages
    ? `Wczytano ${loader.loadedPages}${loader.totalPages ? ` z ${loader.totalPages}` : ""} str. (${state.rows.length} wpisów)`
    : "Nie wczytano jeszcze aktualności";

  return (
    <SourceImportPanel
      state={state}
      isLoading={loader.isLoading}
      error={loader.error}
      loadingLabel="Pobieranie aktualności i sprawdzanie przekierowań na gov.pl…"
      header={
        <SourceHeader
          icon={Landmark}
          title="Aktualności PSSE Myślibórz – gov.pl"
          href={GOV_AKTUALNOSCI_BASE}
          description={
            <>
              Każdy wpis jest sprawdzany: czy to własny artykuł PSSE (a nie przekierowanie do GIS/WSSE) oraz czy jest już w
              systemie – po linku, a dla starszych wpisów bez linku po tytule i dacie działania. {pagesLabel}.
            </>
          }
          actions={
            <Button variant="outline" onClick={loader.refresh} disabled={loader.isLoading}>
              {loader.isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Odśwież
            </Button>
          }
        />
      }
      footer={
        loader.hasMore && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-2">
            <Button variant="ghost" onClick={() => loader.loadMore(1)} disabled={loader.isLoading}>
              {loader.isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronsDown className="size-3.5" />}
              Wczytaj starsze (str. {loader.loadedPages + 1})
            </Button>
            <Button variant="ghost" onClick={() => loader.loadMore(5)} disabled={loader.isLoading} className="text-muted-foreground">
              + 5 stron
            </Button>
          </div>
        )
      }
    />
  );
}
