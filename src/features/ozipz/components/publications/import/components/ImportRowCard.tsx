import { memo } from "react";
import { ArrowRight, ExternalLink, EyeOff, GraduationCap, Link2, RotateCcw, SquareArrowOutUpRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { OzipzProgram } from "../../../../types/ozipz.types";
import { formatDatePl } from "../../../../utils/dateUtils";
import type { EvaluatedRow, ImportRow } from "../importRows";
import { IMPORT_STATUS_META } from "../importStatusMeta";

interface ImportRowCardProps {
  row: EvaluatedRow;
  programs: OzipzProgram[];
  canLink: boolean;
  onToggle: (key: string, selected: boolean) => void;
  onUpdate: (key: string, patch: Partial<ImportRow>) => void;
  onProgram: (key: string, programId: string) => void;
  onSkip: (keys: string[], skipped: boolean) => void;
  onLink: (key: string) => void;
  onOpenMatch: (row: EvaluatedRow) => void;
}

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

function ImportRowCardInner({ row, programs, canLink, onToggle, onUpdate, onProgram, onSkip, onLink, onOpenMatch }: ImportRowCardProps) {
  const meta = IMPORT_STATUS_META[row.status];
  const StatusIcon = meta.icon;
  const editable = row.selectable;
  const redirected = row.finalUrl && row.finalUrl !== row.url;
  const showMatch = Boolean(row.match) && row.status !== "external";

  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-border/60 px-3 py-3 transition-colors last:border-b-0 lg:grid-cols-[auto_150px_minmax(0,1fr)_260px]",
        row.selected && "bg-primary/[0.04]",
        !editable && "bg-muted/20"
      )}
    >
      <div className="pt-1">
        <input
          type="checkbox"
          checked={row.selected}
          disabled={!editable}
          onChange={() => onToggle(row.key, !row.selected)}
          aria-label={`Zaznacz do importu: ${row.title || row.url}`}
          className="size-4 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      <div className="lg:pt-0.5">
        {editable ? (
          <DatePicker value={row.date} onChange={(d) => onUpdate(row.key, { date: d })} size="sm" className="h-7 w-full text-[11px]" />
        ) : (
          <span className="font-mono text-xs font-semibold text-muted-foreground">{formatDatePl(row.date)}</span>
        )}
      </div>

      <div className="col-span-2 min-w-0 space-y-1.5 lg:col-span-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={meta.badge} className="cursor-help text-[10px]">
                <StatusIcon /> {meta.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{meta.hint}</TooltipContent>
          </Tooltip>
          {row.unverified && row.source === "gov" && (
            <Badge variant="muted" className="text-[10px]" title="Nie udało się sprawdzić przekierowania – upewnij się, że to własny artykuł PSSE">
              <TriangleAlert /> Niezweryfikowany adres
            </Badge>
          )}
          {!editable && row.programName && row.programId && (
            <Badge variant="primary-soft" className="max-w-[220px] truncate text-[10px]">
              <GraduationCap /> <span className="truncate">{row.programName}</span>
            </Badge>
          )}
        </div>

        {editable ? (
          <textarea
            value={row.title}
            onChange={(e) => onUpdate(row.key, { title: e.target.value })}
            placeholder="Wpisz tytuł publikacji…"
            aria-label="Tytuł publikacji"
            rows={Math.min(3, Math.max(1, Math.ceil(row.title.length / 95)))}
            className={cn(
              "-mx-1 block w-[calc(100%+0.5rem)] resize-none rounded-[3px] border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-semibold leading-snug text-foreground transition-colors hover:border-input focus:border-ring focus:bg-background focus:outline-none",
              !row.title.trim() && "border-warning/60 bg-warning/5"
            )}
          />
        ) : (
          <p className={cn("text-[13px] font-semibold leading-snug", row.status === "external" || row.status === "skipped" ? "text-muted-foreground" : "text-foreground")}>
            {row.title || "(bez treści)"}
          </p>
        )}

        {row.text && row.text !== row.title && (
          <p className="line-clamp-2 whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground" title={row.text}>
            {row.text}
          </p>
        )}

        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px]">
          <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline">
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{shortUrl(row.url)}</span>
          </a>
          {redirected && (
            <>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-label="przekierowuje do" />
              <a href={row.finalUrl} target="_blank" rel="noreferrer" className="min-w-0 truncate text-muted-foreground hover:underline">
                {shortUrl(row.finalUrl)}
              </a>
            </>
          )}
        </div>

        {showMatch && row.match && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[3px] border px-2 py-1.5 text-[11px]",
              row.status === "linked" ? "border-success/25 bg-success/5" : "border-warning/30 bg-warning/5"
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-foreground">
                {row.match.entry.kind === "publication" ? "Publikacja" : "Działanie"} z {formatDatePl(row.match.entry.date)}:
              </span>{" "}
              <span className="text-foreground/90">«{row.match.entry.title}»</span>
              <span className="text-muted-foreground"> · {row.match.reason}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => onOpenMatch(row)}>
                <SquareArrowOutUpRight className="size-3" /> Podgląd
              </Button>
              {row.status !== "linked" && row.status !== "skipped" && canLink && (
                <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onLink(row.key)}>
                  <Link2 className="size-3" /> To ta sama – powiąż
                </Button>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
        {editable && (
          <>
            <NativeSelect
              value={row.programId || ""}
              onChange={(e) => onProgram(row.key, e.target.value)}
              aria-label="Program profilaktyczny"
              className="h-7 text-[11px]"
            >
              <option value="">-- Bez programu (tematyka ogólna) --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.jrwaSymbol ? ` [JRWA ${p.jrwaSymbol}]` : ""}
                </option>
              ))}
            </NativeSelect>
            {!row.programId && (
              <Input
                value={row.customTopic}
                onChange={(e) => onUpdate(row.key, { customTopic: e.target.value })}
                placeholder="Tematyka…"
                aria-label="Tematyka"
                className="h-7 text-[11px]"
              />
            )}
          </>
        )}
        <div className="flex justify-end">
          {editable && (
            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={() => onSkip([row.key], true)}>
              <EyeOff className="size-3" /> Pomiń
            </Button>
          )}
          {row.status === "skipped" && (
            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => onSkip([row.key], false)}>
              <RotateCcw className="size-3" /> Przywróć
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export const ImportRowCard = memo(ImportRowCardInner);
