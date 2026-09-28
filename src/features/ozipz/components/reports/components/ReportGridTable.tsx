import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ReportGridTableProps {
  readonly headers: readonly string[];
  readonly rows: readonly ReactNode[][];
  readonly minWidth?: number;
}

export function ReportGridTable({
  headers,
  rows,
  minWidth = 600,
}: ReportGridTableProps) {
  return (
    <div className="overflow-x-auto overscroll-x-contain scrollbar-thin rounded-[3px] border border-border bg-card">
      <table className="w-full border-collapse text-left text-xs" style={{ minWidth }}>
        <thead className="border-b border-border bg-muted/40">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={cn(
                  "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap",
                  index > 0 && index === headers.length - 1 ? "text-right" : ""
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition-colors hover:bg-muted/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-3 py-2 align-middle",
                    cellIndex > 0 && cellIndex === row.length - 1 ? "text-right" : ""
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
