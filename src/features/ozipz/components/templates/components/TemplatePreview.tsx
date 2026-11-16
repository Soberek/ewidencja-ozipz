import type { ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TemplateDetailRow } from "../../../utils/templateUtils";

/** Szczegóły szablonu: co dokładnie zostanie wpisane do formularza działania. */
export function TemplatePreview({ name, rows }: { name: string; rows: TemplateDetailRow[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold leading-snug">{name}</p>
      {rows.length === 0
        ? <p className="text-muted-foreground">Szablon nie ustawia żadnych pól.</p>
        : <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 break-words">
                {row.label === "Opis czynności"
                  ? <span className="line-clamp-6 whitespace-pre-line">{row.lines[0]}</span>
                  : row.lines.length > 1
                    ? <ul className="space-y-0.5">{row.lines.map((line, i) => <li key={i}>{line}</li>)}</ul>
                    : row.lines[0]}
              </dd>
            </div>
          ))}
        </dl>}
      <p className="border-t border-border pt-1.5 text-[11px] text-muted-foreground">
        Datę, miejsce, liczby osób i sztuk uzupełniasz przy każdym działaniu.
      </p>
    </div>
  );
}

/** Podgląd szablonu po najechaniu lub fokusie na element (kafelek, nazwę w tabeli). */
export function TemplatePreviewTooltip({ name, rows, children, side = "bottom" }: {
  name: string; rows: TemplateDetailRow[]; children: ReactElement; side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align="start" collisionPadding={12}
        className="max-w-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
        <TemplatePreview name={name} rows={rows} />
      </TooltipContent>
    </Tooltip>
  );
}
