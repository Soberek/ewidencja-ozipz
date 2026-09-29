import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FileText, AlertCircle, CheckSquare, Square } from "lucide-react";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { useDictionaries } from "../../store/useOzipzDbStore";

interface AdnotacjaBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uncompletedEvents: OzipzScheduleEvent[];
  onSaveBulk: (items: Array<{ eventId: string; powodKod: string; powodTytul: string; sporzadzil: string; data: string; miasto: string }>) => Promise<void> | void;
}

export function AdnotacjaBulkDialog({
  open,
  onOpenChange,
  uncompletedEvents,
  onSaveBulk,
}: AdnotacjaBulkDialogProps) {
  const dictStore = useDictionaries();
  const dynamicReasons = (dictStore.annotationReasons ?? []).map((d) => ({ kod: d.code, tytul: d.label, opis: d.description || d.label }));

  const reasonOptions: SelectOption[] = useMemo(() => {
    return dynamicReasons.map((p) => ({
      value: p.kod,
      label: p.tytul,
      description: p.opis,
    }));
  }, [dynamicReasons]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(uncompletedEvents.map((e) => e.id))
  );
  const [wspolnyPowod, setWspolnyPowod] = useState<string>("");
  const [eventReasons, setEventReasons] = useState<Record<string, string>>({});
  const [sporzadzil, setSporzadzil] = useState("");
  const [miasto, setMiasto] = useState("");
  const [data, setData] = useState(getTodayIsoDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleApplyCommonReasonToAll = () => {
    if (!wspolnyPowod) return;
    const updated: Record<string, string> = { ...eventReasons };
    selectedIds.forEach((id) => {
      updated[id] = wspolnyPowod;
    });
    setEventReasons(updated);
  };

  const handleReasonChange = (eventId: string, reasonKod: string) => {
    setEventReasons((prev) => ({
      ...prev,
      [eventId]: reasonKod,
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === uncompletedEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uncompletedEvents.map((e) => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedIds.size === 0) {
      setError("Zaznacz co najmniej jedno zadanie.");
      return;
    }
    if (!sporzadzil.trim()) {
      setError("Podaj imię i nazwisko osoby sporządzającej.");
      return;
    }

    const itemsToSave: Array<{ eventId: string; powodKod: string; powodTytul: string; sporzadzil: string; data: string; miasto: string }> = [];

    for (const eventId of selectedIds) {
      const reasonKod = eventReasons[eventId] || wspolnyPowod;
      if (!reasonKod) {
        const ev = uncompletedEvents.find((e) => e.id === eventId);
        setError(`Wybierz powód niewykonania dla zadania: „${ev?.title || eventId}”.`);
        return;
      }
      const p = dynamicReasons.find((r) => r.kod === reasonKod);
      itemsToSave.push({
        eventId,
        powodKod: reasonKod,
        powodTytul: p?.tytul || reasonKod,
        sporzadzil: sporzadzil.trim(),
        data,
        miasto: miasto.trim(),
      });
    }

    setSaving(true);
    try {
      await onSaveBulk(itemsToSave);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas masowego zapisu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[3px] bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Masowe Dodawanie Adnotacji</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Zarejestruj adnotacje dla wielu niezrealizowanych zadań jednocześnie
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-[3px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sporządził(a) *</Label>
              <Input
                value={sporzadzil}
                onChange={(e) => setSporzadzil(e.target.value)}
                placeholder="Imię i nazwisko"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data sporządzenia</Label>
              <DatePicker
                value={data}
                onChange={setData}
                placeholder="Wybierz datę..."
                size="md"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Miejscowość</Label>
              <Input
                value={miasto}
                onChange={(e) => setMiasto(e.target.value)}
                placeholder="Myślibórz"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-[2px] bg-muted/40 border space-y-2">
            <Label className="text-xs font-semibold">Ustaw wspólny powód dla wszystkich pozycji:</Label>
            {dynamicReasons.length === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Słownik „Powody Adnotacji i Odroczeń” jest pusty. Dodaj powody w module Słowniki.
              </p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={wspolnyPowod}
                  onChange={(val) => setWspolnyPowod(val)}
                  options={reasonOptions}
                  placeholder="-- Wybierz powód dla wszystkich --"
                  searchPlaceholder="Szukaj powodu..."
                  size="sm"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleApplyCommonReasonToAll}
                className="h-9 shrink-0"
              >
                Ustaw wszystkim
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                Lista zadań ({selectedIds.size} z {uncompletedEvents.length} zaznaczonych):
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="h-7 text-xs gap-1"
              >
                {selectedIds.size === uncompletedEvents.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Odznacz wszystkie
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> Zaznacz wszystkie
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-[2px] divide-y max-h-60 overflow-y-auto">
              {uncompletedEvents.map((e) => {
                const isSelected = selectedIds.has(e.id);
                const reason = eventReasons[e.id] || wspolnyPowod;
                return (
                  <div
                    key={e.id}
                    className={`p-2.5 text-xs flex items-center gap-3 transition-colors ${
                      isSelected ? "bg-accent/40" : "opacity-60 bg-background"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(e.id)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{e.title}</div>
                      <div className="text-muted-foreground text-[11px] truncate">
                        {e.eventDate || "—"} · {e.location || "—"} · {e.jrwa || e.programName || "—"}
                      </div>
                    </div>
                    <div className="w-64">
                      <Select
                        value={reason || ""}
                        onChange={(val) => handleReasonChange(e.id, val)}
                        options={reasonOptions}
                        disabled={!isSelected}
                        placeholder="-- Wybierz powód --"
                        searchPlaceholder="Szukaj powodu..."
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={saving || selectedIds.size === 0}
              className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileText className="w-4 h-4" />
              {saving ? "Generowanie..." : `Zapisz ${selectedIds.size} adnotacji`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
