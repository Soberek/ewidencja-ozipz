import { Edit, Trash2, ExternalLink, Calendar, Globe, Twitter, Facebook, Newspaper, ClipboardCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@/components/ui/data-table";
import type { OzipzPublication } from "../../../types/ozipz.types";
import { cn } from "@/lib/utils";
import { RowActionButton } from "@/components/ui/row-action-button";
import { formatDatePl } from "../../../utils/dateUtils";
import { channelFamilyOf, type ChannelFamily } from "../matching/publicationMatcher";

const CHANNEL_STYLE: Record<ChannelFamily, { icon: LucideIcon; className: string }> = {
  gov: { icon: Globe, className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  x: { icon: Twitter, className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20" },
  fb: { icon: Facebook, className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20" },
  other: { icon: Newspaper, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
};

interface CreatePublicationColumnsOptions {
  onEdit: (pub: OzipzPublication) => void;
  onRequestDelete: (pub: OzipzPublication) => void;
  onOpenAction?: (pub: OzipzPublication) => void;
}

export function createPublicationColumns({
  onEdit,
  onRequestDelete,
  onOpenAction,
}: CreatePublicationColumnsOptions): ColumnDef<OzipzPublication>[] {
  return [
    {
      id: "date",
      header: "Data Publikacji",
      sortable: true,
      accessorKey: "publicationDate",
      width: "120px",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-foreground">
          <Calendar className="size-3 text-muted-foreground shrink-0" />
          <span>{formatDatePl(row.publicationDate)}</span>
        </div>
      ),
    },
    {
      id: "title",
      header: "Tytuł Posta / Artykułu",
      sortable: true,
      accessorKey: "title",
      minWidth: "260px",
      cell: ({ row }) => (
        <div className="flex flex-col py-0.5">
          <span
            className="font-bold text-foreground text-xs leading-snug line-clamp-2 break-words"
            title={row.title}
          >
            {row.title}
          </span>
          {row.link && (
            <a
              href={row.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-md"
              title={row.link}
            >
              <ExternalLink className="size-2.5 shrink-0" />
              <span className="truncate">{row.link}</span>
            </a>
          )}
        </div>
      ),
    },
    {
      id: "channel",
      header: "Kanał / Medium",
      sortable: true,
      accessorKey: "channel",
      width: "170px",
      cell: ({ row }) => {
        const { icon: ChannelIcon, className } = CHANNEL_STYLE[channelFamilyOf(row.channel)];
        return (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-bold py-0.5 px-2 truncate max-w-[160px] gap-1", className)}
            title={row.channel}
          >
            <ChannelIcon className="size-2.5 shrink-0" />
            <span className="truncate">{row.channel}</span>
          </Badge>
        );
      },
    },
    {
      id: "topic",
      header: "Tematyka / Program",
      sortable: true,
      accessorKey: "topic",
      width: "180px",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className="text-[10px] font-bold py-0.5 px-2 truncate max-w-[170px] bg-primary/10 text-primary border border-primary/20"
          title={row.topic || "Ogólne OZiPZ"}
        >
          {row.topic || "Ogólne OZiPZ"}
        </Badge>
      ),
    },
    {
      id: "action",
      header: "Działanie",
      align: "center",
      width: "110px",
      cell: ({ row }) =>
        row.actionId ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAction?.(row);
            }}
            disabled={!onOpenAction}
            className="inline-flex items-center gap-1 rounded-[2px] border border-success/25 bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success hover:bg-success/20 disabled:cursor-default"
            title="Publikacja ma powiązane działanie edukacyjne – kliknij, aby je otworzyć"
          >
            <ClipboardCheck className="size-3" /> Powiązane
          </button>
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground" title="Brak powiązanego działania edukacyjnego">
            brak
          </span>
        ),
    },
    {
      id: "reach",
      header: "Zasięg",
      align: "center",
      sortable: true,
      accessorKey: "reachCount",
      width: "90px",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
          {row.reachCount ? `${row.reachCount.toLocaleString("pl-PL")} os.` : "—"}
        </span>
      ),
    },
    {
      id: "author",
      header: "Autor",
      sortable: true,
      accessorKey: "author",
      width: "130px",
      cell: ({ row }) => (
        <span
          className="text-xs font-semibold text-muted-foreground truncate block max-w-[120px]"
          title={row.author || "—"}
        >
          {row.author || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Akcje",
      align: "right",
      width: "80px",
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <RowActionButton
            label="Edytuj publikację"
            icon={Edit}
            onClick={() => onEdit(row)}
          />

          <RowActionButton
            label="Usuń publikację"
            icon={Trash2}
            onClick={() => onRequestDelete(row)}
            tone="destructive"
          />
        </div>
      ),
    },
  ];
}
