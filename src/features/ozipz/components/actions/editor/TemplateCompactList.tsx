import { useMemo, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplatePreviewTooltip } from "../../templates/components/TemplatePreview";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import type { TemplateContent, TemplateDescription, TemplateDetailRow } from "../../../utils/templateUtils";

export interface CompactTemplateRow {
  template: OzipzTemplate;
  content: TemplateContent;
  summary: TemplateDescription;
  details: TemplateDetailRow[];
}

type SortKey = "title" | "actionType" | "classification" | "audience";

const COLUMNS: { key: SortKey | "materials"; label: string; className?: string }[] = [
  { key: "title", label: "Nazwa" },
  { key: "actionType", label: "Forma" },
  { key: "classification", label: "Program / JRWA", className: "hidden sm:flex" },
  { key: "audience", label: "Odbiorcy", className: "hidden md:flex" },
  { key: "materials", label: "Materiały", className: "hidden lg:flex" },
];

/** Te same kolumny w nagłówku i w wierszach — jak widok „Szczegóły” w eksploratorze plików. */
const GRID = cn(
  "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-x-3",
  "sm:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1.6fr)]",
  "md:grid-cols-[minmax(0,2.8fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.4fr)]",
  "lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
);
const ROW_ICON = "rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100";

const sortValue = (row: CompactTemplateRow, key: SortKey) =>
  key === "title" ? row.template.title
    : key === "actionType" ? row.content.actionType
    : key === "classification" ? `${row.summary.jrwaSymbol.split(".").map((p) => p.padStart(5, "0")).join(".")} ${row.summary.classification}`
    : row.summary.audience;

/**
 * Zwarta lista szablonów: jeden wiersz na szablon, małe pismo, kolumny ze szczegółami.
 * Kliknięcie wiersza wypełnia formularz; przypięte szablony zawsze na górze.
 */
export function TemplateCompactList({ rows, activeId, onApply, onTogglePin, onEdit }: {
  rows: CompactTemplateRow[];
  activeId?: string;
  onApply: (template: OzipzTemplate) => void;
  onTogglePin: (template: OzipzTemplate) => void;
  onEdit: (template: OzipzTemplate) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "title", dir: 1 });
  const sorted = useMemo(() => [...rows].sort((a, b) =>
    Number(Boolean(b.template.pinned)) - Number(Boolean(a.template.pinned)) ||
    sort.dir * sortValue(a, sort.key).localeCompare(sortValue(b, sort.key), "pl") ||
    a.template.title.localeCompare(b.template.title, "pl")
  ), [rows, sort]);

  /** Strzałki góra/dół przechodzą między wierszami, Enter wypełnia formularz — jak w eksploratorze plików. */
  const moveFocus = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-template-row]")];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    items[Math.min(items.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  return <div className="overflow-hidden rounded-md border border-border bg-background text-xs">
    <div className="flex items-center border-b border-border bg-muted/60 pl-2 pr-1 text-[11px] font-medium text-muted-foreground">
      <div className={cn(GRID, "min-w-0 flex-1")}>
        {COLUMNS.map((col) => {
          if (col.key === "materials") return <span key={col.key} className={cn("py-1", col.className)}>{col.label}</span>;
          const key = col.key;
          const active = sort.key === key;
          return <button key={key} type="button"
            title={`Sortuj według: ${col.label}`}
            aria-label={`Sortuj według: ${col.label}${active ? (sort.dir === 1 ? ", rosnąco" : ", malejąco") : ""}`}
            onClick={() => setSort((prev) => ({ key, dir: prev.key === key ? (prev.dir === 1 ? -1 : 1) : 1 }))}
            className={cn("flex min-w-0 items-center gap-0.5 py-1 text-left hover:text-foreground", col.className, active && "text-foreground")}>
            <span className="truncate">{col.label}</span>
            {active && (sort.dir === 1 ? <ArrowUp aria-hidden className="size-3 shrink-0" /> : <ArrowDown aria-hidden className="size-3 shrink-0" />)}
          </button>;
        })}
      </div>
      <span className="w-11 shrink-0" aria-hidden />
    </div>

    <ul className="max-h-72 overflow-y-auto" onKeyDown={moveFocus}>
      {sorted.map(({ template: t, content, summary, details }) => {
        const active = t.id === activeId;
        const classification = summary.programName || summary.classification.replace(/^JRWA\s+[\d.]+\s*(—\s*)?/, "") || "";
        return <li key={t.id} className={cn(
          "group flex items-center border-b border-border/60 pl-2 pr-1 last:border-b-0",
          active ? "bg-primary/10" : "hover:bg-primary/5"
        )}>
          <TemplatePreviewTooltip name={t.title} rows={details} side="bottom">
            <button type="button" aria-pressed={active} onClick={() => onApply(t)} data-template-row
              className={cn(GRID, "h-7 min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary")}>
              <span className="flex min-w-0 items-center gap-1 font-medium text-foreground">
                {t.pinned && <Pin aria-hidden className="size-3 shrink-0 fill-current text-primary" />}
                <span className="truncate">{t.title}</span>
                {active && <Check aria-hidden className="size-3 shrink-0 text-primary" />}
              </span>
              <span className="truncate text-muted-foreground">
                {content.actionType || "—"}
                {content.numberOfActions > 1 && <span className="ml-1 tabular-nums text-foreground/70">×{content.numberOfActions}</span>}
              </span>
              <span className="hidden min-w-0 items-baseline gap-1.5 sm:flex">
                {summary.jrwaSymbol && <span className="shrink-0 tabular-nums text-muted-foreground">{summary.jrwaSymbol}</span>}
                <span className="truncate">{classification || <span className="text-muted-foreground">—</span>}</span>
              </span>
              <span className="hidden truncate md:block">{summary.audience || <span className="text-muted-foreground">—</span>}</span>
              <span className="hidden truncate text-muted-foreground lg:block">{summary.materials || "—"}</span>
            </button>
          </TemplatePreviewTooltip>
          <div className="flex w-11 shrink-0 items-center justify-end gap-0.5">
            <button type="button" aria-pressed={Boolean(t.pinned)}
              aria-label={`${t.pinned ? "Odepnij" : "Przypnij"} szablon ${t.title}`}
              title={t.pinned ? "Odepnij — szablon wróci na swoje miejsce na liście" : "Przypnij na początek listy"}
              onClick={() => onTogglePin(t)}
              className={cn(ROW_ICON, t.pinned ? "text-primary opacity-100" : "opacity-0")}>
              <Pin className={cn("size-3", t.pinned && "fill-current")} />
            </button>
            <button type="button" aria-label={`Edytuj szablon ${t.title}`} title="Edytuj szablon"
              onClick={() => onEdit(t)} className={cn(ROW_ICON, "opacity-0")}>
              <Pencil className="size-3" />
            </button>
          </div>
        </li>;
      })}
    </ul>
  </div>;
}
