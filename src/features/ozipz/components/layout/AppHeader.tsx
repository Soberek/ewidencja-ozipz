import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sun, Moon, RotateCcw, Rows, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readStoredTheme, persistTheme } from "@/lib/theme";
import { useFontSize, MIN_FONT_SIZE, MAX_FONT_SIZE } from "../../hooks/useFontSize";
import { useUIStore } from "../../store/useUIStore";
import { cn } from "@/lib/utils";
import { resolveCurrentPage } from "./navigation";
import { HeaderQuickTools } from "./HeaderQuickTools";

const APP_TITLE = "Ewidencja OZiPZ";

interface AppHeaderProps {
  isLoading?: boolean;
}

export function AppHeader({ isLoading }: AppHeaderProps) {
  const { pathname } = useLocation();
  const currentPage = resolveCurrentPage(pathname);
  const { fontSizePercent, setFontSizePercent, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSize();
  const tableDensity = useUIStore((s) => s.tableDensity);
  const toggleTableDensity = useUIStore((s) => s.toggleTableDensity);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return document.documentElement.classList.contains("dark") || readStoredTheme() === "dark";
    } catch {
      return false;
    }
  });
  const [isFontPopoverOpen, setIsFontPopoverOpen] = useState(false);

  const pageLabel = currentPage?.subtitle ?? currentPage?.item.label;

  useEffect(() => {
    document.title = pageLabel ? `${pageLabel} · ${APP_TITLE}` : `${APP_TITLE} – Oświata Zdrowotna i Promocja Zdrowia`;
  }, [pageLabel]);

  useEffect(() => {
    if (!isFontPopoverOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFontPopoverOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isFontPopoverOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    persistTheme(next ? "dark" : "light");
  };

  const PageIcon = currentPage?.item.icon;

  return (
    <header className="z-10 flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/80 px-3 backdrop-blur-md select-none md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        {currentPage && PageIcon ? (
          <>
            <div className="flex size-6 shrink-0 items-center justify-center rounded-[3px] bg-primary/10 text-primary">
              <PageIcon className="size-3.5" />
            </div>
            <nav aria-label="Ścieżka nawigacji" className="flex min-w-0 items-center gap-1.5 text-xs">
              <span className="hidden shrink-0 text-muted-foreground md:inline">{currentPage.group}</span>
              <ChevronRight className="hidden size-3 shrink-0 text-muted-foreground/60 md:inline" aria-hidden="true" />
              {currentPage.subtitle ? (
                <>
                  <span className="hidden shrink-0 text-muted-foreground sm:inline">{currentPage.item.label}</span>
                  <ChevronRight className="hidden size-3 shrink-0 text-muted-foreground/60 sm:inline" aria-hidden="true" />
                  <h1 className="truncate text-sm font-bold text-foreground">{currentPage.subtitle}</h1>
                </>
              ) : (
                <h1 className="truncate text-sm font-bold text-foreground">{currentPage.item.label}</h1>
              )}
            </nav>
          </>
        ) : (
          <h1 className="truncate text-sm font-bold text-foreground">{APP_TITLE}</h1>
        )}
        {isLoading && (
          <Badge variant="primary-soft" className="animate-pulse px-1.5 py-0 text-[10px]">
            Synchronizacja...
          </Badge>
        )}
      </div>

      <div className="relative flex items-center gap-1">
        <HeaderQuickTools />

        {/* Skalowanie interfejsu */}
        <div className="flex items-center gap-0.5 rounded-[3px] border border-border bg-muted/60 p-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={decreaseFontSize}
            disabled={fontSizePercent <= MIN_FONT_SIZE}
            className="size-6 text-[10px] font-bold"
            title="Zmniejsz czcionkę"
            aria-label="Zmniejsz czcionkę"
          >
            A-
          </Button>
          <button
            type="button"
            aria-label="Skalowanie interfejsu"
            aria-expanded={isFontPopoverOpen}
            aria-controls="font-size-controls"
            onClick={() => setIsFontPopoverOpen(!isFontPopoverOpen)}
            className="min-w-[38px] rounded-[2px] px-1 font-mono text-[11px] font-bold tabular-nums text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {fontSizePercent}%
          </button>
          <Button
            size="icon"
            variant="ghost"
            onClick={increaseFontSize}
            disabled={fontSizePercent >= MAX_FONT_SIZE}
            className="size-6 text-[10px] font-bold"
            title="Zwiększ czcionkę"
            aria-label="Zwiększ czcionkę"
          >
            A+
          </Button>
        </div>

        {/* Gęstość tabel */}
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTableDensity}
          aria-pressed={tableDensity === "compact"}
          aria-label={tableDensity === "compact" ? "Włącz standardowy widok tabel" : "Włącz zwarty widok tabel"}
          title={tableDensity === "compact" ? "Gęstość tabel: Zwarty (kliknij dla standardowego)" : "Gęstość tabel: Standardowy (kliknij dla zwartego)"}
          className={cn("size-7", tableDensity === "compact" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
        >
          <Rows className="size-4" />
        </Button>

        {/* Motyw */}
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTheme}
          aria-label={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
          title={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
          className="size-7 text-muted-foreground"
        >
          {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
        </Button>

        {isFontPopoverOpen && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsFontPopoverOpen(false)} />
            <div
              id="font-size-controls"
              className="absolute right-0 top-9 z-50 w-64 space-y-2 rounded-[3px] border border-border bg-popover p-3 text-xs shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="font-bold">Skalowanie interfejsu ({fontSizePercent}%)</span>
                <Button size="icon" variant="ghost" onClick={resetFontSize} className="size-6" title="Resetuj 100%" aria-label="Resetuj 100%">
                  <RotateCcw className="size-3" />
                </Button>
              </div>
              <input
                type="range"
                aria-label="Rozmiar interfejsu"
                aria-valuetext={`${fontSizePercent}%`}
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={5}
                value={fontSizePercent}
                onChange={(e) => setFontSizePercent(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-[3px] bg-muted accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{MIN_FONT_SIZE}% (Kompaktowy)</span>
                <span>100%</span>
                <span>{MAX_FONT_SIZE}% (Duży)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
