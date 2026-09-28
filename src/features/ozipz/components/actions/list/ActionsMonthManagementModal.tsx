import { useState } from "react";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MONTH_NAMES = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

export interface ActionsMonthManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  closedMonths: Set<string>;
  onToggleMonthLock: (monthKey: string) => void;
  locksStatus?: "loading" | "ready" | "error";
  pendingMonth?: string | null;
  onRetry?: () => void;
}

export function ActionsMonthManagementModal({
  isOpen,
  onClose,
  currentYear,
  closedMonths,
  onToggleMonthLock,
  locksStatus = "ready",
  pendingMonth = null,
  onRetry,
}: ActionsMonthManagementModalProps) {
  const [year, setYear] = useState(String(currentYear));
  const isValidYear = /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100;
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Blokada Miesięcy Sprawozdawczych (${year})`}
      description="Blokada miesiąca jest zapisana w bazie danych i obowiązuje na wszystkich urządzeniach korzystających z tej bazy."
      size="md"
    >
      <div className="space-y-4 select-none">
        <label className="flex items-center gap-2 text-xs font-medium">
          Rok
          <input type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(event.target.value)} className="w-24 rounded border border-border bg-background px-2 py-1" />
        </label>
        <div className="rounded-[3px] border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Integralność Raportów MZ/GIS</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
            Zaleca się zamykanie miesięcy po złożeniu sprawozdania okresowego do Wojewódzkiej Stacji lub GIS.
          </p>
        </div>

        {locksStatus === "loading" && <p role="status" className="text-sm">Wczytywanie blokad miesięcy...</p>}
        {locksStatus === "error" && <div role="alert" className="text-sm text-destructive">Nie można odczytać blokad miesięcy. <Button size="sm" variant="outline" onClick={onRetry}>Spróbuj ponownie</Button></div>}
        {locksStatus === "ready" && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, index) => {
            const monthNum = String(index + 1).padStart(2, "0");
            const monthKey = `${year}-${monthNum}`;
            const isClosed = closedMonths.has(monthKey);

            return (
              <div
                key={monthKey}
                className={`flex items-center justify-between p-2.5 rounded-[3px] border transition-colors ${
                  isClosed
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-card"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {monthNum}. {name}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] py-0 font-medium ${
                      isClosed
                        ? "border-destructive/30 text-destructive bg-destructive/10"
                        : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                    }`}
                  >
                    {isClosed ? "Zamknięty" : "Otwarty"}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant={isClosed ? "destructive" : "outline"}
                  disabled={!isValidYear || Boolean(pendingMonth)}
                  onClick={() => onToggleMonthLock(monthKey)}
                  className="size-7 p-0 cursor-pointer"
                  title={isClosed ? "Odblokuj miesiąc do edycji" : "Zablokuj miesiąc"}
                >
                  {isClosed ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <Unlock className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>}

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onClose} className="text-xs font-semibold cursor-pointer">
            Zamknij
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
