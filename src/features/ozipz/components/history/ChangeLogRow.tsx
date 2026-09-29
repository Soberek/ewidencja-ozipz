import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChangeLogEntry } from "../../../../db/change-log";
import {
  OPERATION_LABELS,
  changedFields,
  columnLabel,
  formatChangeMoment,
  formatChangeValue,
  recordLabel,
  tableLabel,
} from "../../utils/changeLogPresentation";

const OPERATION_VARIANTS = {
  INSERT: "success-soft",
  UPDATE: "info-soft",
  DELETE: "destructive-soft",
} as const;

interface ChangeLogRowProps {
  entry: ChangeLogEntry;
  onRestore: (entry: ChangeLogEntry) => void;
  isBusy: boolean;
}

export function ChangeLogRow({ entry, onRestore, isBusy }: ChangeLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fields = changedFields(entry);
  const canRestore = !entry.restoredAt && entry.operation !== "INSERT";

  return (
    <li className="px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
        >
          {isExpanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
          <Badge variant={OPERATION_VARIANTS[entry.operation]}>{OPERATION_LABELS[entry.operation]}</Badge>
          <span className="shrink-0 text-muted-foreground">{tableLabel(entry.tableName)}</span>
          <span className="truncate font-semibold text-foreground">{recordLabel(entry)}</span>
        </button>
        <span className="text-muted-foreground">{formatChangeMoment(entry.changedAt)}</span>
        {entry.actor && <span className="text-muted-foreground">· {entry.actor}</span>}
        {entry.restoredAt ? (
          <Badge variant="muted">Przywrócono {formatChangeMoment(entry.restoredAt)}</Badge>
        ) : canRestore && (
          <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onRestore(entry)} className="h-7 gap-1 text-xs">
            <RotateCcw className="size-3" />
            {entry.operation === "DELETE" ? "Przywróć" : "Przywróć poprzednią wersję"}
          </Button>
        )}
      </div>

      {isExpanded && (
        fields.length === 0 ? (
          <p className="mt-2 pl-6 text-muted-foreground">Brak zmian w polach merytorycznych.</p>
        ) : (
          <table className="mt-2 ml-6 w-[calc(100%-1.5rem)] table-fixed border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="w-1/4 py-1 pr-2 font-semibold">Pole</th>
                {entry.operation !== "INSERT" && <th className="py-1 pr-2 font-semibold">{entry.operation === "UPDATE" ? "Przed" : "Wartość"}</th>}
                {entry.operation !== "DELETE" && <th className="py-1 font-semibold">{entry.operation === "UPDATE" ? "Po" : "Wartość"}</th>}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.column} className="border-t border-border/60 align-top">
                  <td className="py-1 pr-2 text-muted-foreground">{columnLabel(field.column)}</td>
                  {entry.operation !== "INSERT" && <td className="break-words py-1 pr-2">{formatChangeValue(field.before)}</td>}
                  {entry.operation !== "DELETE" && <td className="break-words py-1">{formatChangeValue(field.after)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </li>
  );
}
