interface ReconciliationSummaryTotals {
  totalActualProgDz: number;
  totalActualProgOdb: number;
  totalActualNieprogDz: number;
  totalActualNieprogOdb: number;
  totalExpProgDz: number;
  totalExpProgOdb: number;
  totalExpNieprogDz: number;
  totalExpNieprogOdb: number;
  hasAnyInputs: boolean;
}

interface ReconciliationTableFooterProps {
  summary: ReconciliationSummaryTotals;
  renderDiff: (actual: number, expected: number | undefined) => React.ReactNode;
}

export function ReconciliationTableFooter({ summary, renderDiff }: ReconciliationTableFooterProps) {
  return (
    <tfoot className="border-t-2 font-bold bg-muted/40">
      <tr>
        <td className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-foreground border-r border-border/80">
          RAZEM ({summary.totalActualProgDz + summary.totalActualNieprogDz} dz. /{" "}
          {summary.totalActualProgOdb + summary.totalActualNieprogOdb} os.)
        </td>

        {/* Prog Działania */}
        <td colSpan={3} className="py-2.5 px-2 text-center font-mono border-r border-border/60">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-foreground">{summary.totalActualProgDz}</span>
            {summary.hasAnyInputs && renderDiff(summary.totalActualProgDz, summary.totalExpProgDz)}
          </div>
        </td>

        {/* Prog Odbiorcy */}
        <td colSpan={3} className="py-2.5 px-2 text-center font-mono border-r border-border/60">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-foreground">{summary.totalActualProgOdb}</span>
            {summary.hasAnyInputs && renderDiff(summary.totalActualProgOdb, summary.totalExpProgOdb)}
          </div>
        </td>

        {/* Nieprog Działania */}
        <td colSpan={3} className="py-2.5 px-2 text-center font-mono border-r border-border/60">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-foreground">{summary.totalActualNieprogDz}</span>
            {summary.hasAnyInputs && renderDiff(summary.totalActualNieprogDz, summary.totalExpNieprogDz)}
          </div>
        </td>

        {/* Nieprog Odbiorcy */}
        <td colSpan={3} className="py-2.5 px-2 text-center font-mono border-r border-border/60">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-foreground">{summary.totalActualNieprogOdb}</span>
            {summary.hasAnyInputs && renderDiff(summary.totalActualNieprogOdb, summary.totalExpNieprogOdb)}
          </div>
        </td>

        <td className="py-2.5 px-3 text-center">
          <span className="text-[11px] font-mono text-muted-foreground">
            {summary.totalExpProgDz + summary.totalExpNieprogDz} dz.
          </span>
        </td>
      </tr>
    </tfoot>
  );
}
