import { Lock, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";

interface ActionEditorKancelariaCardProps {
  selectedJrwaSymbol?: string;
  jrwaSign?: string;
  izrzSign?: string;
  ezdStatus?: string;
  isPublication?: boolean;
  isDistribution?: boolean;
  onJrwaSignChange?: (val: string) => void;
  onGenerateJrwaSign?: () => void;
  onIzrzSignChange: (val: string) => void;
  onEzdStatusChange: (val: string) => void;
}

const EZD_STATUS_OPTIONS = [
  { value: "w_ezd", label: "w EZD (zarejestrowane)", badge: "EZD", badgeVariant: "success" as const },
  { value: "do_ezd", label: "do EZD (wymaga wpisu)", badge: "do wpisu", badgeVariant: "warning" as const },
  { value: "nie_dotyczy", label: "Nie dotyczy" },
];

/** Dane kancelaryjne działania: znak sprawy JRWA, numer w IZRZ i status w EZD (treść sekcji „Kancelaria”). */
export function ActionEditorKancelariaCard({
  selectedJrwaSymbol = "",
  jrwaSign = "",
  izrzSign = "",
  ezdStatus = "",
  isPublication = false,
  isDistribution = false,
  onJrwaSignChange,
  onGenerateJrwaSign,
  onIzrzSignChange,
  onEzdStatusChange,
}: ActionEditorKancelariaCardProps) {
  const isLocked = Boolean(isPublication || isDistribution);

  return (
    <div className="space-y-3">
      {isLocked && (
        <p className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          {isPublication
            ? "Publikacja w mediach nie jest rejestrowana w kancelarii: bez znaku sprawy, numeru IZRZ i statusu EZD."
            : "Samodzielna dystrybucja materiałów nie jest rejestrowana w kancelarii: bez znaku sprawy, numeru IZRZ i statusu EZD."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="action-jrwa-sign" className={FIELD_LABEL}>Znak sprawy JRWA</label>
            {!isLocked && onGenerateJrwaSign && (
              <Button type="button" variant="link" size="sm" className="h-auto gap-1 p-0 text-xs"
                onClick={onGenerateJrwaSign} title="Nadaj kolejny wolny znak sprawy w teczce JRWA">
                <RefreshCw className="size-3" aria-hidden /> Nadaj kolejny znak
              </Button>
            )}
          </div>
          {isLocked ? (
            <Input id="action-jrwa-sign" className={FIELD_INPUT} value="" placeholder="Nie dotyczy" disabled />
          ) : (
            <div className="flex items-center gap-1">
              <Input
                id="action-jrwa-sign"
                type="text"
                placeholder="np. OZiPZ.966.1.1.2026"
                value={jrwaSign}
                onChange={(e) => onJrwaSignChange?.(e.target.value)}
                className={`${FIELD_INPUT} flex-1 font-mono`}
              />
              {selectedJrwaSymbol && (
                <Badge variant="outline" className="h-9 shrink-0 font-mono text-[10px]" title="Teczka JRWA wynikająca z programu lub klasyfikacji">
                  JRWA {selectedJrwaSymbol}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="action-izrz-sign" className={FIELD_LABEL}>Numer w IZRZ</label>
          <Input
            id="action-izrz-sign"
            type="text"
            placeholder={isLocked ? "Nie dotyczy" : "np. 91/2026"}
            value={isLocked ? "" : izrzSign}
            onChange={(e) => onIzrzSignChange(e.target.value)}
            disabled={isLocked}
            className={`${FIELD_INPUT} font-mono`}
          />
        </div>

        <Select
          label="Status w EZD"
          value={isLocked ? "nie_dotyczy" : ezdStatus}
          onChange={onEzdStatusChange}
          disabled={isLocked}
          options={EZD_STATUS_OPTIONS}
          searchable={false}
          triggerClassName={FIELD_INPUT}
        />
      </div>
    </div>
  );
}
