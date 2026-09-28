import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDictionaries } from "../../../store/useOzipzDbStore";
import type { OzipzProgram } from "../../../types/ozipz.types";
import type { ScrapedPublication } from "../sources/importTypes";
import { fetchGovAktualnosciPage } from "../sources/govSource";
import { extractTweetIds, fetchXPostById, fetchXTimeline } from "../sources/xSource";

type AddItems = (items: ScrapedPublication[], replace?: boolean) => void;

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/** Jednorazowe automatyczne wczytanie po wejściu na zakładkę (odporne na podwójny efekt StrictMode). */
function useInitialLoad(load: () => void) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load();
  }, []);
}

export function useGovLoader(addItems: AddItems, programs: OzipzProgram[]) {
  const jrwaSymbols = useDictionaries().jrwaSymbols || [];
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const loadPages = useCallback(
    async (fromPage: number, count: number, replace: boolean) => {
      if (busy.current) return;
      busy.current = true;
      setIsLoading(true);
      setError(null);
      let lastPage = fromPage - 1;
      try {
        for (let page = fromPage; page < fromPage + count; page += 1) {
          const res = await fetchGovAktualnosciPage(page, programs, jrwaSymbols);
          addItems(res.items, replace && page === fromPage);
          lastPage = page;
          setLoadedPages(page);
          setTotalPages(res.totalPages);
          if (!res.hasMore) break;
        }
      } catch (err: unknown) {
        const msg = errorMessage(err, "Błąd pobierania aktualności z gov.pl");
        setError(msg);
        if (lastPage >= fromPage) toast.error(msg);
      } finally {
        busy.current = false;
        setIsLoading(false);
      }
    },
    [addItems, programs, jrwaSymbols]
  );

  const refresh = useCallback(() => loadPages(1, 2, true), [loadPages]);
  const loadMore = useCallback((count = 1) => loadPages(loadedPages + 1, count, false), [loadPages, loadedPages]);
  useInitialLoad(refresh);

  return {
    isLoading,
    error,
    loadedPages,
    totalPages,
    hasMore: totalPages == null ? loadedPages > 0 : loadedPages < totalPages,
    refresh,
    loadMore,
  };
}

export function useXLoader(addItems: AddItems, programs: OzipzProgram[]) {
  const jrwaSymbols = useDictionaries().jrwaSymbols || [];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      addItems(await fetchXTimeline(programs, jrwaSymbols));
    } catch (err: unknown) {
      setError(errorMessage(err, "Błąd pobierania wpisów z profilu X"));
    } finally {
      setIsLoading(false);
    }
  }, [addItems, programs, jrwaSymbols]);

  /** Dodaje wpisy z wklejonych linków; zwraca liczbę rozpoznanych identyfikatorów. */
  const addByLinks = useCallback(
    async (input: string): Promise<number> => {
      const ids = extractTweetIds(input);
      if (!ids.length) {
        toast.error("Nie rozpoznano linków do wpisów X (np. https://x.com/PSSEMysliborz/status/…)");
        return 0;
      }
      setIsLoading(true);
      try {
        const posts = await Promise.all(ids.map((id) => fetchXPostById(id, programs, jrwaSymbols)));
        addItems(posts);
        setError(null);
        const withoutText = posts.filter((p) => !p.title).length;
        if (withoutText) toast.warning(`Dla ${withoutText} wpisów X nie zwrócił treści – uzupełnij tytuł ręcznie`);
        else toast.success(`Dodano ${posts.length} ${posts.length === 1 ? "wpis" : "wpisów"} do listy`);
      } finally {
        setIsLoading(false);
      }
      return ids.length;
    },
    [addItems, programs, jrwaSymbols]
  );

  useInitialLoad(loadTimeline);

  return { isLoading, error, loadTimeline, addByLinks };
}
