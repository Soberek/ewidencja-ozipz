import { Suspense, lazy, useCallback, useEffect, useState, ComponentType } from "react";
import { getDatabaseInfo, getDatabaseLockConflict, retryDatabaseConnection, type DatabaseInfo } from "./db/client";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { OzipzSidebar } from "./features/ozipz/components/layout/OzipzSidebar";
import { AppHeader } from "./features/ozipz/components/layout/AppHeader";
import { OzipzModalRoot } from "./features/ozipz/components/modals/OzipzModalRoot";
import { DatabaseLockedPanel, DatabaseTakeoverOverlay } from "./features/ozipz/components/layout/DatabaseLockNotice";
import { GlobalSearchDialog } from "./features/ozipz/components/layout/GlobalSearchDialog";
import { useOzipzDbStore } from "./features/ozipz/store/useOzipzDbStore";
import { useKeyboardShortcuts } from "./features/ozipz/hooks/useKeyboardShortcuts";
import { useStartupUpdateCheck } from "./hooks/useStartupUpdateCheck";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

// Typed lazy exporter with .preload() capability
export function lazyExport<T, K extends keyof T>(
  importer: () => Promise<T>,
  name: K
) {
  const load = () =>
    importer().then((m) => ({ default: m[name] as unknown as ComponentType<Record<string, unknown>> }));

  const Component = lazy(load);
  Object.assign(Component, { preload: importer });
  return Component as typeof Component & { preload: () => Promise<T> };
}

// Lazy-loaded section components with prefetch capability
const DashboardSection = lazyExport(() => import("./features/ozipz/components/DashboardSection"), "DashboardSection");
const ActionsSection = lazyExport(() => import("./features/ozipz/components/actions/ActionsSection"), "ActionsSection");
const ActionEditorSection = lazyExport(() => import("./features/ozipz/components/actions/ActionEditorSection"), "ActionEditorSection");
const ProgramsSection = lazyExport(() => import("./features/ozipz/components/programs/ProgramsSection"), "ProgramsSection");
const MaterialsSection = lazyExport(() => import("./features/ozipz/components/materials/MaterialsSection"), "MaterialsSection");
const ScheduleSection = lazyExport(() => import("./features/ozipz/components/schedule/ScheduleSection"), "ScheduleSection");
const FacilitiesSection = lazyExport(() => import("./features/ozipz/components/facilities/FacilitiesSection"), "FacilitiesSection");
const ReportsSection = lazyExport(() => import("./features/ozipz/components/reports/ReportsSection"), "ReportsSection");
const JrwaSection = lazyExport(() => import("./features/ozipz/components/jrwa/JrwaSection"), "JrwaSection");
const DictionariesSection = lazyExport(() => import("./features/ozipz/components/dictionaries/DictionariesSection"), "DictionariesSection");
const LettersSection = lazyExport(() => import("./features/ozipz/components/letters/LettersSection"), "LettersSection");
const ScansSection = lazyExport(() => import("./features/ozipz/components/scans/ScansSection"), "ScansSection");
const PublicationsSection = lazyExport(() => import("./features/ozipz/components/publications/PublicationsSection"), "PublicationsSection");
const ContactsSection = lazyExport(() => import("./features/ozipz/components/contacts/ContactsSection"), "ContactsSection");
const TemplatesSection = lazyExport(() => import("./features/ozipz/components/templates/TemplatesSection"), "TemplatesSection");
const StaffSection = lazyExport(() => import("./features/ozipz/components/staff/StaffSection"), "StaffSection");
const RegistersSection = lazyExport(() => import("./features/ozipz/components/registers/RegistersSection"), "RegistersSection");
const ToolsSection = lazyExport(() => import("./features/ozipz/components/tools/ToolsSection"), "ToolsSection");
const HistorySection = lazyExport(() => import("./features/ozipz/components/history/HistorySection"), "HistorySection");
const SettingsSection = lazyExport(() => import("./features/ozipz/components/settings/SettingsSection"), "SettingsSection");

// Map of route paths to component preloader functions
const ROUTE_PRELOADERS: Record<string, () => Promise<unknown>> = {
  "/": DashboardSection.preload,
  "/pulpit": DashboardSection.preload,
  "/dzialania": ActionsSection.preload,
  "/dzialania/nowe": ActionEditorSection.preload,
  "/harmonogram": ScheduleSection.preload,
  "/sprawozdania": ReportsSection.preload,
  "/narzedzia": ToolsSection.preload,
  "/znaki": JrwaSection.preload,
  "/pisma": LettersSection.preload,
  "/rejestry": RegistersSection.preload,
  "/materialy": MaterialsSection.preload,
  "/rozdzielniki": MaterialsSection.preload,
  "/skany": ScansSection.preload,
  "/publikacje": PublicationsSection.preload,
  "/lokalizacje": FacilitiesSection.preload,
  "/szkoly-w-programie": ProgramsSection.preload,
  "/programy": ProgramsSection.preload,
  "/kontakty": ContactsSection.preload,
  "/slowniki": DictionariesSection.preload,
  "/slownik-dzialania": DictionariesSection.preload,
  "/opisy-zadan": TemplatesSection.preload,
  "/osoby": StaffSection.preload,
  "/historia": HistorySection.preload,
  "/ustawienia": SettingsSection.preload,
};

function ViewLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] gap-3 text-muted-foreground select-none">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-xs font-semibold">Ładowanie modułu OZiPZ...</span>
    </div>
  );
}

function ViewErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Nie udało się pobrać zasobów modułu. Sprawdź połączenie z bazą danych lub siecią.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] gap-4 p-6 text-center select-none">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Błąd ładowania widoku</h3>
        <p className="text-xs text-muted-foreground max-w-sm">{errorMessage}</p>
      </div>
      <Button size="sm" variant="outline" onClick={resetErrorBoundary} className="gap-2 cursor-pointer text-xs font-bold">
        <RefreshCw className="size-3.5" />
        Spróbuj ponownie
      </Button>
    </div>
  );
}

function AppContent() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [fallbackAccepted, setFallbackAccepted] = useState(false);
  const { pathname } = useLocation();
  const isActionEditor = pathname === "/dzialania/nowe" || /^\/dzialania\/[^/]+\/edytuj$/.test(pathname);
  const loadError = useOzipzDbStore((state) => state.loadError);
  const isInitialized = useOzipzDbStore((state) => state.isInitialized);
  const loadAll = useOzipzDbStore((state) => state.loadAll);
  const lockConflict = loadError ? getDatabaseLockConflict() : null;
  useKeyboardShortcuts();
  useStartupUpdateCheck(isInitialized);

  const handlePreloadRoute = useCallback((path: string) => {
    ROUTE_PRELOADERS[path]?.();
  }, []);

  useEffect(() => {
    useOzipzDbStore.getState().loadAll();
    void getDatabaseInfo().then(setDatabaseInfo).catch(() => setDatabaseInfo(null));
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <button
        type="button"
        onClick={() => document.getElementById("main-content")?.focus()}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2 focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Przejdź do treści
      </button>
      <div className={isActionEditor ? "hidden sm:contents" : "contents"}>
        <OzipzSidebar onHoverItem={handlePreloadRoute} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <AppHeader />

        {databaseInfo?.degraded && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="flex-1">Tryb awaryjny: SQLite jest niedostępne. Dane zapisujesz tylko w tym profilu przeglądarki.</span>
            <Button size="sm" variant="outline" onClick={retryDatabaseConnection}>Połącz ponownie</Button>
            <a className="underline" href="#/ustawienia">Kopia i odzyskiwanie</a>
            {!fallbackAccepted && <Button size="sm" onClick={() => setFallbackAccepted(true)}>Kontynuuj w trybie awaryjnym</Button>}
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-3 md:p-4 bg-muted/20">
          {pathname === "/ustawienia" ? (
            <Suspense fallback={<ViewLoadingFallback />}><SettingsSection /></Suspense>
          ) : lockConflict ? (
            <DatabaseLockedPanel holder={lockConflict} onRetry={() => void loadAll().then(() => getDatabaseInfo().then(setDatabaseInfo).catch(() => undefined))} />
          ) : loadError ? (
            <div role="alert" className="mx-auto mt-16 flex max-w-2xl items-center justify-between gap-4 rounded-[3px] border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-bold text-destructive">Nie udało się wczytać aktualnych danych</p>
                  <p className="text-xs text-muted-foreground">Dane pozostają zablokowane, aby uniknąć pracy na nieaktualnej kopii. {loadError}</p>
                  <a className="text-xs underline" href="#/ustawienia">Przywróć kopię zapasową</a>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void loadAll()} className="shrink-0 gap-1.5">
                <RefreshCw className="size-3.5" /> Spróbuj ponownie
              </Button>
            </div>
          ) : databaseInfo?.degraded && !fallbackAccepted ? (
            <p className="p-6 text-sm">Połącz ponownie z SQLite albo potwierdź pracę w trybie awaryjnym, aby otworzyć ewidencję.</p>
          ) : !isInitialized || !databaseInfo ? (
            <ViewLoadingFallback />
          ) : (
            <ErrorBoundary FallbackComponent={ViewErrorFallback}>
            <Suspense fallback={<ViewLoadingFallback />}>
              <Routes>
                {/* Pulpit */}
                <Route path="/" element={<DashboardSection />} />
                <Route path="/pulpit" element={<Navigate to="/" replace />} />

                {/* Rejestr Działań i Edytor */}
                <Route path="/dzialania" element={<ActionsSection />} />
                <Route path="/dzialania/nowe" element={<ActionEditorSection />} />
                <Route path="/dzialania/:id/edytuj" element={<ActionEditorSection />} />
                <Route path="/dzialania/edytor" element={<Navigate to="/dzialania/nowe" replace />} />

                {/* Harmonogram, Sprawozdania i JRWA */}
                <Route path="/harmonogram" element={<ScheduleSection />} />
                <Route path="/sprawozdania" element={<ReportsSection />} />
                <Route path="/miernik-budzetowy" element={<ReportsSection initialMode="miernik" />} />
                <Route path="/znaki" element={<JrwaSection />} />

                {/* Narzędzia (druki i pomocnicze generatory) */}
                <Route path="/narzedzia" element={<ToolsSection />} />
                <Route path="/narzedzia/:toolId" element={<ToolsSection />} />
                <Route path="/lista-obecnosci" element={<Navigate to="/narzedzia/lista-obecnosci" replace />} />
                <Route path="/druk-rozdzielnika" element={<Navigate to="/narzedzia/druk-rozdzielnika" replace />} />


                {/* Ewidencja, Pisma, Magazyn i Archiwum */}
                <Route path="/pisma" element={<LettersSection />} />
                <Route path="/rejestry" element={<RegistersSection />} />
                <Route path="/materialy" element={<MaterialsSection defaultTab="catalog" />} />
                <Route path="/rozdzielniki" element={<MaterialsSection defaultTab="distributions" />} />
                <Route path="/skany" element={<ScansSection />} />
                <Route path="/publikacje" element={<PublicationsSection />} />

                {/* Baza Placówek, Szkoły, Kontakty i Programy */}
                <Route path="/lokalizacje" element={<FacilitiesSection />} />
                <Route path="/szkoly-w-programie" element={<ProgramsSection defaultView="schools" />} />
                <Route path="/programy" element={<ProgramsSection defaultView="programs" />} />
                <Route path="/kontakty" element={<ContactsSection />} />

                {/* Słowniki, Kadra, Szablony i Konfiguracja */}
                <Route path="/slowniki" element={<DictionariesSection />} />
                <Route path="/slownik-dzialania" element={<Navigate to="/slowniki?kategoria=activityType" replace />} />
                <Route path="/opisy-zadan" element={<TemplatesSection />} />
                <Route path="/osoby" element={<StaffSection />} />
                <Route path="/historia" element={<HistorySection />} />
                <Route path="/ustawienia" element={<SettingsSection />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Globalne Okna Modalne i Powiadomienia */}
      {isInitialized && databaseInfo && (!databaseInfo.degraded || fallbackAccepted) && <OzipzModalRoot />}
      {isInitialized && <GlobalSearchDialog />}
      <DatabaseTakeoverOverlay enabled={databaseInfo?.mode === "tauri-sqlite"} />
      <Toaster />
    </div>
  );
}

export function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  );
}

export default App;
