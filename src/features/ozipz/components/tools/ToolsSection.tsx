import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TOOLS, findTool, type ToolId } from "../layout/navigation";

/** Widok każdego narzędzia z listy TOOLS — Record wymusza podpięcie widoku dla nowego wpisu. */
const TOOL_VIEWS: Record<ToolId, LazyExoticComponent<ComponentType>> = {
  "lista-obecnosci": lazy(() =>
    import("../attendance/AttendanceListSection").then((m) => ({ default: m.AttendanceListSection }))
  ),
  "druk-rozdzielnika": lazy(() =>
    import("../materials/RozdzielnikPrintSection").then((m) => ({ default: m.RozdzielnikPrintSection }))
  ),
  "praca-w-dniu-wolnym": lazy(() => import("./WorkDayRequestTool").then((m) => ({ default: m.WorkDayRequestTool }))),
};

function ToolsOverview() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold">Narzędzia</h2>
        <p className="text-xs text-muted-foreground">Druki i generatory pomocnicze. Wybierz narzędzie, aby je otworzyć.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map(({ id, path, label, description, icon: Icon }) => (
          <Link
            key={id}
            to={path}
            className="group rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[3px] bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-xs font-bold text-foreground">{label}</h3>
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ToolsSection() {
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();

  if (!toolId) return <ToolsOverview />;

  const tool = findTool(toolId);
  if (!tool) return <Navigate to="/narzedzia" replace />;
  const ToolView = TOOL_VIEWS[tool.id as ToolId];

  return (
    <div className="space-y-3">
      <SegmentedControl
        aria-label="Wybór narzędzia"
        value={tool.id}
        onChange={(id) => navigate(findTool(id)?.path ?? "/narzedzia")}
        options={TOOLS.map(({ id, label, icon }) => ({ value: id, label, icon }))}
      />
      <Suspense
        fallback={
          <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        }
      >
        <ToolView />
      </Suspense>
    </div>
  );
}
