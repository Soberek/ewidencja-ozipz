import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OzipzAction } from "../../../../types/ozipz.types";
import { ReportGridTable } from "../ReportGridTable";
import { HealthPromotionPagination } from "../../HealthPromotionPagination";
import {
  statusLabels,
  statusBadgeClasses,
  recipientCount,
  materialCount,
} from "../reportConstants";

interface SourceEntriesCardProps {
  actions: OzipzAction[];
}

export function SourceEntriesCard({ actions }: SourceEntriesCardProps) {
  const [sourceEntriesOpen, setSourceEntriesOpen] = useState(false);
  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePageSize, setSourcePageSize] = useState(25);
  const [sourceSearch, setSourceSearch] = useState("");

  const filteredSourceActions = useMemo(() => {
    if (!sourceSearch.trim()) return actions;
    const query = sourceSearch.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.topic && a.topic.toLowerCase().includes(query)) ||
        (a.jrwaSign && a.jrwaSign.toLowerCase().includes(query)) ||
        (a.jrwaCaseId && a.jrwaCaseId.toLowerCase().includes(query)) ||
        (a.facilityName && a.facilityName.toLowerCase().includes(query))
    );
  }, [actions, sourceSearch]);

  const sourceTotalPages = Math.max(1, Math.ceil(filteredSourceActions.length / sourcePageSize));
  const currentSourcePage = Math.min(sourcePage, sourceTotalPages);

  const pagedSourceActions = useMemo(() => {
    const start = (currentSourcePage - 1) * sourcePageSize;
    return filteredSourceActions.slice(start, start + sourcePageSize);
  }, [filteredSourceActions, currentSourcePage, sourcePageSize]);

  return (
    <Card className="rounded-[3px] border border-border bg-card shadow-none">
      <CardContent className="space-y-3 p-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Wpisy źródłowe sprawozdania
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Wszystkie kwalifikowane działania ({actions.length}) wchodzące w skład wyliczeń.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-[3px] border-input text-xs font-medium cursor-pointer"
            onClick={() => setSourceEntriesOpen((open) => !open)}
          >
            {sourceEntriesOpen ? <ChevronUp className="size-3.5 mr-1" /> : <ChevronDown className="size-3.5 mr-1" />}
            {sourceEntriesOpen ? "Ukryj wpisy" : `Pokaż wpisy (${actions.length} pozycji)`}
          </Button>
        </div>

        {sourceEntriesOpen && (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                type="text"
                placeholder="Filtruj wpisy..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="h-7 w-full sm:w-64 rounded-[3px] border-input text-xs"
              />
            </div>

            <ReportGridTable
              minWidth={780}
              headers={["Data", "Zadanie / JRWA", "Forma", "Status", "Działania", "Odbiorcy", "Materiały"]}
              rows={pagedSourceActions.map((action) => [
                <span key="d" className="font-mono text-xs text-foreground whitespace-nowrap">
                  {action.date}
                </span>,
                <div key="t" className="space-y-0.5 max-w-xs">
                  <p className="font-semibold text-foreground text-xs line-clamp-2 break-words leading-tight">{action.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {action.jrwaSign ? (
                      action.jrwaSign
                    ) : action.jrwaCaseId && /^\d{3,4}(\.\d+)?$/.test(action.jrwaCaseId) ? (
                      `JRWA ${action.jrwaCaseId}`
                    ) : (
                      <span className="text-muted-foreground italic font-sans">Brak znaku EZD</span>
                    )}
                  </p>
                </div>,
                <span key="f" className="text-xs text-foreground">
                  {action.actionType || "-"}
                </span>,
                <Badge
                  key="s"
                  variant="outline"
                  className={cn(
                    "h-5 rounded-[2px] text-[9.5px] font-bold",
                    statusBadgeClasses[action.status || "wykonane"] ||
                      "border-border text-muted-foreground"
                  )}
                >
                  {statusLabels[action.status || "wykonane"] || action.status}
                </Badge>,
                <span key="na" className="font-mono text-xs font-semibold text-foreground">
                  {Number(action.numberOfActions) || 1}
                </span>,
                <span key="rc" className="font-mono text-xs text-foreground">
                  {recipientCount(action).toLocaleString("pl-PL")}
                </span>,
                <span key="mc" className="font-mono text-xs text-foreground">
                  {materialCount(action).toLocaleString("pl-PL")}
                </span>,
              ])}
            />

            <HealthPromotionPagination
              itemCount={filteredSourceActions.length}
              page={currentSourcePage}
              pageSize={sourcePageSize}
              onPageChange={setSourcePage}
              onPageSizeChange={(newPageSize) => {
                setSourcePageSize(newPageSize);
                setSourcePage(1);
              }}
              label="Wpisy źródłowe"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
