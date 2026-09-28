import { useMemo, useRef, useState } from "react";
import { Building2, CalendarDays, ClipboardList, GraduationCap, Package, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { buildRozdzielnikHtml, collectActionMaterials, type RozdzielnikItem } from "../../utils/rozdzielnikPrint";
import { formatFacilityAddress } from "../../utils/facilityUtils";
import { compareDatesDesc, formatDatePl } from "../../utils/dateUtils";
import { A4PrintPreview, printPreviewFrame } from "../print/A4PrintPreview";
import { RozdzielnikItemsEditor } from "./components/RozdzielnikItemsEditor";

export function RozdzielnikPrintSection() {
  const actions = useOzipzDbStore((s) => s.actions);
  const distributions = useOzipzDbStore((s) => s.distributions);
  const materials = useOzipzDbStore((s) => s.materials);
  const facilities = useOzipzDbStore((s) => s.facilities);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [actionId, setActionId] = useState("");
  const [date, setDate] = useState("");
  const [programText, setProgramText] = useState("");
  const [institutionText, setInstitutionText] = useState("");
  const [items, setItems] = useState<RozdzielnikItem[]>([]);

  // Zadania, przy których wydano materiały (wraz z wyliczonymi pozycjami), od najnowszych.
  // Dystrybucja zapisana razem z innym działaniem jest liczona przy nim, więc nie dublujemy jej na liście.
  const tasksWithMaterials = useMemo(() => {
    const sources = { actions, distributions, materials };
    const actionIds = new Set(actions.map((a) => a.id));
    return actions
      .filter((action) => !action.linkedActionId || !actionIds.has(action.linkedActionId))
      .map((action) => ({ action, items: collectActionMaterials(action, sources) }))
      .filter((task) => task.items.length > 0)
      .sort((a, b) => compareDatesDesc(a.action.date, b.action.date));
  }, [actions, distributions, materials]);

  const taskOptions: SelectOption[] = useMemo(
    () =>
      tasksWithMaterials.map(({ action, items: taskItems }) => ({
        value: action.id,
        label: `${formatDatePl(action.date)} — ${action.facilityName}`,
        description: action.programName || action.title,
        badge: `${taskItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0)} szt.`,
        badgeVariant: "secondary",
        icon: Package,
      })),
    [tasksWithMaterials]
  );

  const materialTitles = useMemo(() => materials.map((m) => m.title), [materials]);

  const handleTaskSelect = (id: string) => {
    setActionId(id);
    const task = tasksWithMaterials.find((t) => t.action.id === id);
    if (!task) return;
    const { action } = task;
    const facility = facilities.find((f) => f.id === action.facilityId);
    setDate(action.date);
    setProgramText(action.programName || action.campaignName || action.topic || "");
    setInstitutionText(
      facility ? [facility.name, formatFacilityAddress(facility)].filter(Boolean).join(", ") : action.facilityName
    );
    setItems(task.items);
  };

  const html = useMemo(
    () => buildRozdzielnikHtml({ date, programName: programText, institution: institutionText, items }),
    [date, programText, institutionText, items]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <Card className="w-full lg:w-[440px] lg:shrink-0 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold">Rozdzielnik materiałów</h2>
          <p className="text-xs text-muted-foreground">
            Formularz F/PT/PZ/01/01. Wybierz zadanie z rejestru — materiały, data i placówka uzupełnią się same;
            wszystko można poprawić przed wydrukiem.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <ClipboardList className="size-3.5 text-primary" />
            Zadanie
          </label>
          <SearchableSelect
            value={actionId}
            onChange={handleTaskSelect}
            options={taskOptions}
            placeholder="-- Wybierz zadanie z wydanymi materiałami --"
            searchPlaceholder="Szukaj po dacie, placówce lub programie..."
            emptyText="Brak zadań z wydanymi materiałami"
            size="sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rozdzielnik-date" className="font-bold text-xs flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary" />
            Data
          </label>
          <DatePicker id="rozdzielnik-date" value={date} onChange={setDate} allowClear size="sm" />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-primary" />
            Program
          </label>
          <Textarea
            aria-label="Program"
            value={programText}
            onChange={(e) => setProgramText(e.target.value)}
            rows={2}
            placeholder="Nazwa programu / tematyka"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            Instytucja/organizacja
          </label>
          <Textarea
            aria-label="Instytucja/organizacja"
            value={institutionText}
            onChange={(e) => setInstitutionText(e.target.value)}
            rows={2}
            placeholder="Puste = do wpisania ręcznie"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <Package className="size-3.5 text-primary" />
            Wydane materiały
          </label>
          <RozdzielnikItemsEditor items={items} onChange={setItems} materialTitles={materialTitles} />
        </div>

        <Button type="button" onClick={() => printPreviewFrame(previewRef.current)} className="w-full gap-1.5">
          <Printer className="size-4" />
          Drukuj rozdzielnik
        </Button>
      </Card>

      <A4PrintPreview ref={previewRef} html={html} title="Podgląd rozdzielnika" />
    </div>
  );
}
