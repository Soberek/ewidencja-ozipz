import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { MonthlyReconciliationRowInput } from "./MiernikMonthlyReconciliation";

interface MiernikReconciliationRowProps {
  month: number;
  monthName: string;
  actual: {
    progDz: number;
    progOdb: number;
    nieprogDz: number;
    nieprogOdb: number;
  };
  expected: MonthlyReconciliationRowInput;
  onChange: (field: keyof MonthlyReconciliationRowInput, value: string) => void;
}

export function MiernikReconciliationRow({
  month,
  monthName,
  actual,
  expected,
  onChange,
}: MiernikReconciliationRowProps) {
  const isMatch =
    (expected.progDz === undefined || expected.progDz === actual.progDz) &&
    (expected.progOdb === undefined || expected.progOdb === actual.progOdb) &&
    (expected.nieprogDz === undefined || expected.nieprogDz === actual.nieprogDz) &&
    (expected.nieprogOdb === undefined || expected.nieprogOdb === actual.nieprogOdb);

  const hasInputs =
    expected.progDz !== undefined ||
    expected.progOdb !== undefined ||
    expected.nieprogDz !== undefined ||
    expected.nieprogOdb !== undefined;

  const renderDiff = (act: number, exp: number | undefined) => {
    if (exp === undefined) return null;
    const diff = act - exp;
    if (diff === 0) {
      return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">0</span>;
    }
    return (
      <span
        className={`text-[10px] font-black font-mono ${
          diff > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {diff > 0 ? `+${diff}` : diff}
      </span>
    );
  };

  return (
    <tr
      className={`hover:bg-muted/30 transition-colors ${
        !isMatch ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
      }`}
    >
      {/* Nazwa miesiąca */}
      <td className="py-1.5 px-2.5 font-sans font-medium text-foreground">
        <span className="font-mono text-muted-foreground mr-1.5">
          {String(month).padStart(2, "0")}
        </span>
        {monthName}
      </td>

      {/* PROGRAMOWE DZIAŁANIA */}
      <td className="py-1 px-1 text-right font-bold text-sky-700 dark:text-sky-300 border-l">
        {actual.progDz}
      </td>
      <td className="py-1 px-1 text-center">
        <Input
          type="number"
          min={0}
          placeholder={String(actual.progDz)}
          value={expected.progDz !== undefined ? expected.progDz : ""}
          onChange={(e) => onChange("progDz", e.target.value)}
          className="h-6 w-14 text-center mx-auto text-xs font-mono font-bold px-1"
        />
      </td>
      <td className="py-1 px-1 text-right">{renderDiff(actual.progDz, expected.progDz)}</td>

      {/* PROGRAMOWE UCZESTNICY */}
      <td className="py-1 px-1 text-right font-bold text-sky-700 dark:text-sky-300 border-l">
        {actual.progOdb}
      </td>
      <td className="py-1 px-1 text-center">
        <Input
          type="number"
          min={0}
          placeholder={String(actual.progOdb)}
          value={expected.progOdb !== undefined ? expected.progOdb : ""}
          onChange={(e) => onChange("progOdb", e.target.value)}
          className="h-6 w-16 text-center mx-auto text-xs font-mono font-bold px-1"
        />
      </td>
      <td className="py-1 px-1 text-right">{renderDiff(actual.progOdb, expected.progOdb)}</td>

      {/* NIEPROGRAMOWE DZIAŁANIA */}
      <td className="py-1 px-1 text-right font-bold text-foreground border-l">
        {actual.nieprogDz}
      </td>
      <td className="py-1 px-1 text-center">
        <Input
          type="number"
          min={0}
          placeholder={String(actual.nieprogDz)}
          value={expected.nieprogDz !== undefined ? expected.nieprogDz : ""}
          onChange={(e) => onChange("nieprogDz", e.target.value)}
          className="h-6 w-14 text-center mx-auto text-xs font-mono font-bold px-1"
        />
      </td>
      <td className="py-1 px-1 text-right">{renderDiff(actual.nieprogDz, expected.nieprogDz)}</td>

      {/* NIEPROGRAMOWE UCZESTNICY */}
      <td className="py-1 px-1 text-right font-bold text-foreground border-l">
        {actual.nieprogOdb}
      </td>
      <td className="py-1 px-1 text-center">
        <Input
          type="number"
          min={0}
          placeholder={String(actual.nieprogOdb)}
          value={expected.nieprogOdb !== undefined ? expected.nieprogOdb : ""}
          onChange={(e) => onChange("nieprogOdb", e.target.value)}
          className="h-6 w-16 text-center mx-auto text-xs font-mono font-bold px-1"
        />
      </td>
      <td className="py-1 px-1 text-right">{renderDiff(actual.nieprogOdb, expected.nieprogOdb)}</td>

      {/* STATUS ZGODNOŚCI */}
      <td className="py-1 px-1 text-center border-l font-sans">
        {hasInputs ? (
          isMatch ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <CheckCircle2 className="size-3.5" /> Zgodne
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
              <AlertCircle className="size-3.5" /> Różnica
            </span>
          )
        ) : (
          <span className="text-muted-foreground text-[10px]">—</span>
        )}
      </td>
    </tr>
  );
}
