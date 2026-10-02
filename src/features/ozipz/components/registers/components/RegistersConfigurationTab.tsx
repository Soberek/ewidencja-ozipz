import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Info, Settings2 } from "lucide-react";
import type { OfficialRegisterKey, OzipzDictionaryItem, OzipzRegisterMapping } from "../../../types/ozipz.types";
import { defaultRegistersForActivity, OFFICIAL_REGISTERS_CONFIG } from "../../../utils/registerConfig";

export interface RegistersConfigurationTabProps {
  activityTypes: OzipzDictionaryItem[];
  existingMappings: OzipzRegisterMapping[];
  onSaveMappings: (
    mappings: Array<{ activityType: string; registers: OfficialRegisterKey[] }>
  ) => Promise<void>;
}

export function RegistersConfigurationTab({
  activityTypes,
  existingMappings,
  onSaveMappings,
}: RegistersConfigurationTabProps) {
  const [matrix, setMatrix] = useState<Map<string, Set<OfficialRegisterKey>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Inicjalizacja macierzy ze stanu bazodanowego lub domyślnej heurystyki
  useEffect(() => {
    const nextMap = new Map<string, Set<OfficialRegisterKey>>();

    activityTypes.forEach((type) => {
      const code = type.code;
      const label = type.label || type.code;

      const found = existingMappings.find((m) => m.activityType === code || m.activityType === label);
      if (found) {
        nextMap.set(code, new Set(found.registers));
      } else {
        const defaults = defaultRegistersForActivity(label);
        nextMap.set(code, new Set(defaults));
      }
    });

    setMatrix(nextMap);
  }, [activityTypes, existingMappings]);

  const handleToggle = (activityCode: string, registerKey: OfficialRegisterKey) => {
    setMatrix((prev) => {
      const next = new Map(prev);
      const currentSet = new Set(next.get(activityCode) || []);
      if (currentSet.has(registerKey)) {
        currentSet.delete(registerKey);
      } else {
        currentSet.add(registerKey);
      }
      next.set(activityCode, currentSet);
      return next;
    });
  };

  const handleResetDefaults = () => {
    const nextMap = new Map<string, Set<OfficialRegisterKey>>();
    activityTypes.forEach((type) => {
      const defaults = defaultRegistersForActivity(type.label || type.code);
      nextMap.set(type.code, new Set(defaults));
    });
    setMatrix(nextMap);
    toast.info("Przywrócono domyślne reguły heurystyki. Kliknij „Zapisz konfigurację”, aby zatwierdzić.");
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload: Array<{ activityType: string; registers: OfficialRegisterKey[] }> = [];

      matrix.forEach((set, code) => {
        payload.push({
          activityType: code,
          registers: Array.from(set),
        });
      });

      await onSaveMappings(payload);
      toast.success("Zapisano mapowanie form zadań do rejestrów");
    } catch {
      toast.error("Wystąpił błąd podczas zapisywania konfiguracji");
    } finally {
      setIsSaving(false);
    }
  };

  const registerKeys: OfficialRegisterKey[] = ["informacje", "publikacje", "wizytacje"];

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-none border-border/80 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <Settings2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Mapowanie Form Działań Edukacyjnych → Rejestry Urzędowe
              </h3>
              <p className="text-xs text-muted-foreground">
                Zaznacz, do których oficjalnych rejestrów mają automatycznie trafiać działania o danej formie.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="gap-1 text-xs h-8 shadow-none cursor-pointer"
            >
              <RotateCcw className="size-3.5" /> Przywróć Domyślne
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1 text-xs h-8 shadow-none font-bold cursor-pointer"
            >
              <Save className="size-3.5" />
              {isSaving ? "Zapisywanie..." : "Zapisz Mapowanie"}
            </Button>
          </div>
        </div>

        {/* Informacja pomocnicza */}
        <div className="mt-3 flex items-start gap-2 rounded bg-muted/40 p-2.5 text-xs text-muted-foreground border border-border/40">
          <Info className="size-4 shrink-0 text-primary mt-0.5" />
          <span>
            Jedno działanie może jednocześnie należeć do kilku rejestrów. Puste zaznaczenie oznacza, że dana forma
            zadania nie będzie kwalifikowana do żadnego ze specjalnych rejestrów urzędowych.
          </span>
        </div>

        {/* Tabela macierzy mapowania */}
        <div className="mt-4 overflow-x-auto rounded border border-border/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border text-foreground font-bold">
                <th className="py-2.5 px-3">Forma Działania (Słownik OZiPZ)</th>
                <th className="py-2.5 px-3 text-center w-[160px]">
                  {OFFICIAL_REGISTERS_CONFIG.informacje.label}
                </th>
                <th className="py-2.5 px-3 text-center w-[160px]">
                  {OFFICIAL_REGISTERS_CONFIG.publikacje.label}
                </th>
                <th className="py-2.5 px-3 text-center w-[160px]">
                  {OFFICIAL_REGISTERS_CONFIG.wizytacje.label}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {activityTypes.map((act) => {
                const currentSet = matrix.get(act.code) || new Set();

                return (
                  <tr key={act.code} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-foreground">{act.label || act.code}</div>
                      {act.description ? (
                        <div className="text-[11px] text-muted-foreground">{act.description}</div>
                      ) : null}
                    </td>

                    {registerKeys.map((key) => {
                      const isChecked = currentSet.has(key);

                      return (
                        <td key={key} className="py-2 px-3 text-center">
                          <label className="inline-flex items-center justify-center p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggle(act.code, key)}
                              className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {activityTypes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Brak zdefiniowanych form działań w Centrum Słowników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
