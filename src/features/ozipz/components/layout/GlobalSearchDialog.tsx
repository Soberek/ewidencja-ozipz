import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { useGlobalSearchStore } from "../../store/useGlobalSearchStore";
import { useShallow } from "zustand/react/shallow";
import { buildSearchIndex, searchIndex, type SearchEntry, type SearchSources } from "../../utils/globalSearch";
import { SIDEBAR_FOOTER_ITEMS, SIDEBAR_GROUPS, TOOLS, matchesNavQuery, normalizeNavQuery } from "./navigation";

const MODULES = [...SIDEBAR_GROUPS.flatMap((group) => group.items), ...TOOLS, ...SIDEBAR_FOOTER_ITEMS];

/** Wyszukiwarka wszystkich rekordów ewidencji i modułów (Ctrl+K). */
export function GlobalSearchDialog() {
  const isOpen = useGlobalSearchStore((state) => state.isOpen);
  const close = useGlobalSearchStore((state) => state.close);
  const openModal = useModalStore((state) => state.openModal);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const sources = useOzipzDbStore(useShallow((state): SearchSources => ({
    actions: state.actions, letters: state.letters, jrwaCases: state.jrwaCases, scheduleEvents: state.scheduleEvents,
    facilities: state.facilities, contacts: state.contacts, programs: state.programs, participations: state.participations,
    materials: state.materials, distributions: state.distributions, publications: state.publications,
    registers: state.registers, staff: state.staff, scans: state.scans, templates: state.templates,
  })));
  // Indeks budujemy tylko przy otwartym oknie.
  const index = useMemo(() => isOpen ? buildSearchIndex(sources) : [], [isOpen, sources]);

  const modules = useMemo(() => {
    const normalized = normalizeNavQuery(query);
    return normalized ? MODULES.filter((item) => matchesNavQuery(item, normalized)).slice(0, 5) : [];
  }, [query]);
  const records = useMemo(() => searchIndex(index, query), [index, query]);
  const results = useMemo(
    () => [...modules.map((item): SearchEntry => ({ key: `module-${item.id}`, group: "Moduły", title: item.label, subtitle: "Przejdź do modułu", path: item.path, haystack: "" })), ...records],
    [modules, records]
  );

  useEffect(() => { setActiveIndex(0); }, [query]);
  useEffect(() => { if (!isOpen) setQuery(""); }, [isOpen]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const choose = (item: SearchEntry | undefined) => {
    if (!item) return;
    close();
    navigate(item.path);
    if (item.modal) openModal(item.modal.type, item.modal.payload);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-[4px] border border-border bg-background shadow-xl"
        >
          <DialogPrimitive.Title className="sr-only">Szukaj w ewidencji</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj działań, pism, spraw, placówek, kontaktów, materiałów…"
              aria-label="Szukaj w ewidencji"
              aria-controls="global-search-results"
              aria-activedescendant={results[activeIndex] ? `global-search-${results[activeIndex].key}` : undefined}
              className="h-11 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-[2px] border border-border px-1.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
          </div>

          <ul ref={listRef} id="global-search-results" role="listbox" className="flex-1 overflow-y-auto p-1.5">
            {query.trim() === "" ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                Wpisz nazwę, numer pisma, znak sprawy, miejscowość albo nazwisko. Wielkość liter i polskie znaki nie mają znaczenia.
              </li>
            ) : results.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">Nic nie znaleziono dla „{query}”.</li>
            ) : (
              results.map((item, position) => {
                const showGroup = position === 0 || results[position - 1].group !== item.group;
                return (
                  <li key={item.key} role="presentation">
                    {showGroup && <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.group}</p>}
                    <button
                      type="button"
                      role="option"
                      id={`global-search-${item.key}`}
                      aria-selected={position === activeIndex}
                      data-index={position}
                      onMouseMove={() => setActiveIndex(position)}
                      onClick={() => choose(item)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-left text-xs cursor-pointer",
                        position === activeIndex ? "bg-primary/10 text-foreground" : "text-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{item.title}</span>
                        {item.subtitle && <span className="block truncate text-muted-foreground">{item.subtitle}</span>}
                      </span>
                      {position === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">↑ ↓ wybór · Enter otwiera · Ctrl+K w dowolnym miejscu</p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
