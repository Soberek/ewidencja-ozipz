import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { HealthPromotionTab } from "../../types/ozipz.types";
import { useUIStore } from "../../store/useUIStore";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { isEmptyImportedTemplate } from "../../utils/templateUtils";
import {
  SIDEBAR_FOOTER_ITEMS,
  SIDEBAR_GROUPS,
  matchesNavQuery,
  normalizeNavQuery,
  resolveCurrentPage,
  type SidebarItemConfig,
} from "./navigation";

export { SIDEBAR_GROUPS, SIDEBAR_FOOTER_ITEMS };
export type { SidebarGroupConfig, SidebarItemConfig } from "./navigation";

type SidebarCounts = Partial<Record<HealthPromotionTab, number>>;

interface OzipzSidebarProps {
  counts?: SidebarCounts;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onHoverItem?: (path: string) => void;
}

const NEW_ACTION_PATH = "/dzialania/nowe";

/** Liczniki rekordów przy pozycjach menu — jedna subskrypcja zamiast kilkunastu. */
function useSidebarCounts(): SidebarCounts {
  return useOzipzDbStore(
    useShallow((s) => ({
      dzialania: s.actions.length,
      harmonogram: s.scheduleEvents.length,
      znaki: s.jrwaCases.length,
      pisma: s.letters.length,
      rejestry: s.registers.length,
      rozdzielniki: s.distributions.length,
      materialy: s.materials.length,
      skany: s.scans.length,
      publikacje: s.publications.length,
      lokalizacje: s.facilities.length,
      "szkoly-w-programie": s.participations.length,
      kontakty: s.contacts.length,
      programy: s.programs.length,
      slowniki: s.dictionaryItems.length,
      "opisy-zadan": s.templates.filter((template) => !isEmptyImportedTemplate(template)).length,
      osoby: s.staff.length,
    }))
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function CountBadge({ count, isActive }: { count?: number; isActive: boolean }) {
  if (typeof count !== "number" || count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-1.5 font-mono text-[10px] font-semibold leading-4 tabular-nums",
        isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
      )}
    >
      {count > 999 ? "999+" : count}
    </span>
  );
}

function CollapsedTooltip({ isCollapsed, label, children }: { isCollapsed: boolean; label: string; children: ReactNode }) {
  if (!isCollapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function OzipzSidebar(props: OzipzSidebarProps) {
  const storeCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const storeToggle = useUIStore((s) => s.toggleSidebar);
  const collapsedGroups = useUIStore((s) => s.collapsedSidebarGroups);
  const toggleGroup = useUIStore((s) => s.toggleSidebarGroup);
  const isCollapsed = props.isCollapsed ?? storeCollapsed;
  const onToggleCollapse = props.onToggleCollapse ?? storeToggle;
  const { onHoverItem } = props;

  const autoCounts = useSidebarCounts();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeId = resolveCurrentPage(pathname)?.item.id;

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [focusSearchOnExpand, setFocusSearchOnExpand] = useState(false);
  const query = isCollapsed ? "" : normalizeNavQuery(search);

  const visibleGroups = useMemo(
    () =>
      SIDEBAR_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => matchesNavQuery(item, query)) })).filter(
        (group) => group.items.length > 0
      ),
    [query]
  );
  const visibleFooter = useMemo(() => SIDEBAR_FOOTER_ITEMS.filter((item) => matchesNavQuery(item, query)), [query]);
  const firstMatch = visibleGroups[0]?.items[0] ?? visibleFooter[0];

  // Ctrl/Cmd+B — zwijanie paska bocznego
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== "b" || isTypingTarget(e.target)) return;
      e.preventDefault();
      onToggleCollapse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggleCollapse]);

  useEffect(() => {
    if (!isCollapsed && focusSearchOnExpand) {
      searchRef.current?.focus();
      setFocusSearchOnExpand(false);
    }
  }, [isCollapsed, focusSearchOnExpand]);

  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && firstMatch) {
      e.preventDefault();
      navigate(firstMatch.path);
      setSearch("");
      searchRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearch("");
      searchRef.current?.blur();
    }
  };

  const openSearchFromCollapsed = () => {
    setFocusSearchOnExpand(true);
    onToggleCollapse();
  };

  const renderItem = (item: SidebarItemConfig) => {
    const Icon = item.icon;
    const isActive = item.id === activeId;
    const count = props.counts?.[item.id] ?? autoCounts[item.id];
    const tooltip = typeof count === "number" && count > 0 ? `${item.label} (${count})` : item.label;

    return (
      <CollapsedTooltip key={item.id} isCollapsed={isCollapsed} label={tooltip}>
        <Link
          to={item.path}
          aria-current={isActive ? "page" : undefined}
          aria-label={isCollapsed ? item.label : undefined}
          onMouseEnter={() => onHoverItem?.(item.path)}
          onFocus={() => onHoverItem?.(item.path)}
          onClick={() => setSearch("")}
          className={cn(
            "group relative flex h-8 w-full items-center gap-2.5 rounded-[3px] px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCollapsed && "justify-center px-0",
            isActive
              ? "bg-primary/10 font-semibold text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary"
              : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              <CountBadge count={count} isActive={isActive} />
            </>
          )}
        </Link>
      </CollapsedTooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label="Menu główne"
        className={cn(
          "flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 select-none",
          isCollapsed ? "w-14" : "w-60"
        )}
      >
        {/* Nagłówek */}
        <div className={cn("flex h-11 shrink-0 items-center border-b border-border px-3", isCollapsed ? "justify-center" : "justify-between gap-2")}>
          {!isCollapsed && (
            <Link to="/" className="flex min-w-0 items-center gap-2 rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-[3px] bg-primary text-[11px] font-black text-primary-foreground">
                OZ
              </div>
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-xs font-extrabold tracking-tight text-foreground">Ewidencja OZiPZ</span>
                <span className="block truncate text-[10px] text-muted-foreground">PSSE Myślibórz</span>
              </div>
            </Link>
          )}
          <CollapsedTooltip isCollapsed={isCollapsed} label="Rozwiń menu (Ctrl+B)">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Rozwiń menu" : "Zwiń menu"}
              title={isCollapsed ? undefined : "Zwiń menu (Ctrl+B)"}
              className="flex size-7 shrink-0 items-center justify-center rounded-[3px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </CollapsedTooltip>
        </div>

        {/* Szybkie akcje */}
        <div className={cn("shrink-0 space-y-2 border-b border-border p-2", isCollapsed && "flex flex-col items-center")}>
          <CollapsedTooltip isCollapsed={isCollapsed} label="Nowe działanie">
            <Link
              to={NEW_ACTION_PATH}
              aria-label={isCollapsed ? "Nowe działanie" : undefined}
              onMouseEnter={() => onHoverItem?.(NEW_ACTION_PATH)}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-[3px] bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isCollapsed ? "size-8" : "w-full"
              )}
            >
              <Plus className="size-4" />
              {!isCollapsed && <span>Nowe działanie</span>}
            </Link>
          </CollapsedTooltip>

          {isCollapsed ? (
            <CollapsedTooltip isCollapsed label="Szukaj modułu">
              <button
                type="button"
                onClick={openSearchFromCollapsed}
                aria-label="Szukaj modułu"
                className="flex size-8 items-center justify-center rounded-[3px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <Search className="size-4" />
              </button>
            </CollapsedTooltip>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Przejdź do modułu…"
                aria-label="Szukaj modułu"
                className="h-7 w-full rounded-[3px] border border-border bg-muted/40 pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Wyczyść wyszukiwanie"
                  className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[2px] text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Moduły */}
        <div className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
          {visibleGroups.map((group, groupIndex) => {
            const containsActive = group.items.some((item) => item.id === activeId);
            const isGroupOpen = isCollapsed || !!query || !collapsedGroups.includes(group.id);
            const listId = `sidebar-group-${group.id}`;

            return (
              <div key={group.id}>
                {isCollapsed ? (
                  groupIndex > 0 && <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden="true" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    disabled={!!query}
                    aria-expanded={isGroupOpen}
                    aria-controls={listId}
                    className="group/heading mb-1 flex w-full items-center gap-1 rounded-[3px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  >
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    {!isGroupOpen && containsActive && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                    {!query && (
                      <ChevronDown
                        className={cn("size-3 opacity-0 transition-[transform,opacity] group-hover/heading:opacity-100", !isGroupOpen && "-rotate-90 opacity-100")}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}
                {isGroupOpen && (
                  <nav id={listId} aria-label={group.label} className="space-y-0.5">
                    {group.items.map(renderItem)}
                  </nav>
                )}
              </div>
            );
          })}

          {query && visibleGroups.length === 0 && visibleFooter.length === 0 && (
            <p className="px-2.5 py-4 text-center text-[11px] text-muted-foreground">Brak modułu pasującego do „{search.trim()}”.</p>
          )}
        </div>

        {/* Stopka */}
        {visibleFooter.length > 0 && (
          <nav aria-label="System" className="shrink-0 space-y-0.5 border-t border-border p-2">
            {visibleFooter.map(renderItem)}
          </nav>
        )}
      </aside>
    </TooltipProvider>
  );
}
