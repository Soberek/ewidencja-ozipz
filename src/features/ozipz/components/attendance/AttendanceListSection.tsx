import { useMemo, useRef, useState } from "react";
import { Building2, CalendarDays, GraduationCap, Printer, School } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePrograms, useFacilities } from "../../store/domainHooks";
import { buildAttendanceListHtml } from "../../utils/attendanceListPrint";
import { formatFacilityAddress } from "../../utils/facilityUtils";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { A4PrintPreview, printPreviewFrame } from "../print/A4PrintPreview";

export function AttendanceListSection() {
  const { programs } = usePrograms();
  const { facilities } = useFacilities();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [programId, setProgramId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [programText, setProgramText] = useState("");
  const [institutionText, setInstitutionText] = useState("");
  const [date, setDate] = useState(getTodayIsoDate());

  const programOptions: SelectOption[] = useMemo(
    () =>
      programs.map((p) => ({
        value: p.id,
        label: p.name,
        description: `Edycja: ${p.editionYear || "ciągły"}`,
        badge: p.jrwaSymbol || undefined,
        badgeVariant: "secondary",
        icon: GraduationCap,
      })),
    [programs]
  );

  const facilityOptions: SelectOption[] = useMemo(
    () =>
      facilities.map((f) => ({
        value: f.id,
        label: f.name,
        group: f.municipality
          ? f.municipality.toLowerCase().startsWith("gmina")
            ? f.municipality
            : `Gmina ${f.municipality}`
          : "Inne",
        description: formatFacilityAddress(f),
        icon: f.isComplex ? Building2 : School,
      })),
    [facilities]
  );

  const handleProgramSelect = (id: string) => {
    setProgramId(id);
    setProgramText(programs.find((p) => p.id === id)?.name ?? "");
  };

  const handleFacilitySelect = (id: string) => {
    setFacilityId(id);
    const facility = facilities.find((f) => f.id === id);
    setInstitutionText(facility ? [facility.name, formatFacilityAddress(facility)].filter(Boolean).join(", ") : "");
  };

  const html = useMemo(
    () => buildAttendanceListHtml({ programName: programText, date, institution: institutionText }),
    [programText, date, institutionText]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <Card className="w-full lg:w-[420px] lg:shrink-0 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold">Lista obecności</h2>
          <p className="text-xs text-muted-foreground">
            Formularz F/PT/PZ/01/01 (zał. nr 8 do Zarządzenia Nr 15 GIS). Pola tekstowe można poprawić przed wydrukiem.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-primary" />
            Program
          </label>
          <SearchableSelect
            value={programId}
            onChange={handleProgramSelect}
            options={programOptions}
            placeholder="-- Wybierz program --"
            searchPlaceholder="Szukaj programu po nazwie lub JRWA..."
            clearable
            size="sm"
          />
          <Textarea
            aria-label="Treść „w ramach”"
            value={programText}
            onChange={(e) => setProgramText(e.target.value)}
            rows={2}
            placeholder="Nazwa programu / tematyka drukowana po „w ramach:”"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="attendance-date" className="font-bold text-xs flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary" />
            Data
          </label>
          <DatePicker id="attendance-date" value={date} onChange={setDate} allowClear size="sm" />
          <p className="text-[11px] text-muted-foreground">Bez daty na wydruku zostanie miejsce do wpisania ręcznie.</p>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-xs flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            Lokalizacja
          </label>
          <SearchableSelect
            value={facilityId}
            onChange={handleFacilitySelect}
            options={facilityOptions}
            placeholder="-- Wybierz placówkę --"
            searchPlaceholder="Szukaj placówki..."
            clearable
            size="sm"
          />
          <Textarea
            aria-label="Instytucja/organizacja"
            value={institutionText}
            onChange={(e) => setInstitutionText(e.target.value)}
            rows={3}
            placeholder="Instytucja/organizacja — wybierz z bazy lub wpisz ręcznie"
            className="text-xs"
          />
        </div>

        <Button type="button" onClick={() => printPreviewFrame(previewRef.current)} className="w-full gap-1.5">
          <Printer className="size-4" />
          Drukuj listę obecności
        </Button>
      </Card>

      <A4PrintPreview ref={previewRef} html={html} title="Podgląd listy obecności" />
    </div>
  );
}
