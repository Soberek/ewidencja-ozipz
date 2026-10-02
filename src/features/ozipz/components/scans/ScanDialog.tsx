import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Select, SearchableSelect } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FileText,
  FileCheck,
  Building2,
  Calendar,
  Award,
  Upload,
} from "lucide-react";
import type {
  OzipzScan,
  OzipzFacility,
  OzipzProgram,
  OzipzDictionaryItem,
} from "../../types/ozipz.types";
import { ScanSchema } from "../../schemas/ozipz.schemas";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { z } from "zod";
import { discardScanFile, importScanFile } from "@/db/scan-files";

const ScanFormSchema = ScanSchema.omit({
  id: true,
  createdAt: true,
});

type ScanFormInput = z.input<typeof ScanFormSchema>;
type ScanFormOutput = z.output<typeof ScanFormSchema>;

interface ScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: OzipzFacility[];
  programs: OzipzProgram[];
  documentTypes?: (string | OzipzDictionaryItem)[];
  onSave: (data: Omit<OzipzScan, "id" | "createdAt">) => unknown | Promise<unknown>;
}

export function ScanDialog({
  isOpen,
  onClose,
  facilities,
  programs,
  documentTypes = [],
  onSave,
}: ScanDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dynamicDocTypes: string[] = useMemo(() => {
    const raw = documentTypes.map((d: string | OzipzDictionaryItem) => (typeof d === "string" ? d : d.label));
    return Array.from(new Set(raw.filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b, "pl"));
  }, [documentTypes]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ScanFormInput, undefined, ScanFormOutput>({
    resolver: zodResolver(ScanFormSchema),
    defaultValues: {
      title: "",
      documentType: "",
      facilityId: "",
      facilityName: "",
      programId: "",
      programName: "",
      scanDate: getTodayIsoDate(),
      fileSizeKb: 0,
      fileName: "",
      filePath: "",
      notes: "",
    },
  });

  const facilityId = watch("facilityId");
  const programId = watch("programId");
  const fileName = watch("fileName");
  const fileSizeKb = watch("fileSizeKb");

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      reset({
        title: "",
        documentType: "",
        facilityId: "",
        facilityName: "",
        programId: "",
        programName: "",
        scanDate: getTodayIsoDate(),
        fileSizeKb: 0,
        fileName: "",
        filePath: "",
        notes: "",
      });
    }
  }, [isOpen, reset]);

  const handleFacilityChange = (facId: string) => {
    setValue("facilityId", facId);
    if (!facId) {
      setValue("facilityName", "");
      return;
    }
    const fac = facilities.find((f) => f.id === facId);
    if (fac) {
      setValue("facilityName", fac.name);
      if (!watch("title")) {
        setValue("title", `${watch("documentType")} - ${fac.name}`);
      }
    }
  };

  const handleProgramChange = (progId: string) => {
    setValue("programId", progId);
    if (!progId) {
      setValue("programName", "");
      return;
    }
    const prog = programs.find((p) => p.id === progId);
    if (prog) {
      setValue("programName", prog.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("fileName", file.name);
      setValue("fileSizeKb", Math.round(file.size / 1024) || 1);
      setValue("filePath", "");
      if (!watch("title")) {
        setValue("title", file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const onSubmit = async (data: ScanFormOutput) => {
    if (!selectedFile) {
      setError("root", { message: "Wybierz plik ze skanem." });
      return;
    }
    let importedPath: string | undefined;
    try {
      importedPath = await importScanFile(selectedFile);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się dołączyć pliku skanu." });
      return;
    }
    const payload: Omit<OzipzScan, "id" | "createdAt"> = {
      title: data.title.trim(),
      documentType: data.documentType,
      facilityId: data.facilityId || undefined,
      facilityName: data.facilityName?.trim() || "",
      programId: data.programId || undefined,
      programName: data.programName || undefined,
      scanDate: data.scanDate,
      fileSizeKb: Number(data.fileSizeKb) || 0,
      fileName: data.fileName?.trim() || `${data.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`,
      filePath: importedPath,
      notes: data.notes?.trim() || undefined,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      await discardScanFile(importedPath).catch(() => undefined);
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać skanu." });
    }
  };

  const errorMessage = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerAccent="rose"
      icon={<FileText className="size-5" />}
      title="Zarejestruj Skan Dokumentu PDF"
      description="Cyfrowe archiwum deklaracji, sprawozdań i pism oświatowo-zdrowotnych"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText="Dodaj Skan do Archiwum"
    >
      {/* Plik dokumentu */}
      <div className="p-3 bg-muted/20 border border-border/70 rounded-[3px] space-y-2">
        <label htmlFor="scan-file" className="font-bold text-foreground flex items-center gap-1.5">
          <Upload className="size-3.5 text-rose-600" />
          <span>Wybierz plik ze skanem (PDF / PNG / JPG)</span>
        </label>
        <Input
          id="scan-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="h-8 text-xs cursor-pointer file:mr-2 file:h-6 file:px-2 file:rounded file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold"
        />
        {fileName && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="font-mono font-bold text-foreground truncate max-w-[280px]">{fileName}</span>
            <span className="font-mono">{fileSizeKb} KB</span>
          </div>
        )}
      </div>

      {/* Tytuł dokumentu */}
      <div className="space-y-1">
        <label htmlFor="scan-title" className="font-bold text-foreground flex items-center gap-1">
          <FileCheck className="size-3.5 text-primary" />
          <span>Tytuł Dokumentu / Opis <span className="text-destructive">*</span></span>
        </label>
        <Input
          id="scan-title"
          type="text"
          placeholder="np. Deklaracja przystąpienia SP2 Myślibórz - Bieg po zdrowie"
          {...register("title")}
          className="h-8 text-xs font-medium"
          autoFocus
        />
        {errors.title && <p className="text-[10px] text-destructive font-semibold">{errors.title.message}</p>}
      </div>

      {/* Rodzaj Dokumentu i Data Skanu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label htmlFor="scan-document-type" className="font-semibold text-foreground text-xs">
            Typ Dokumentu <span className="text-destructive">*</span>
          </label>
          <Select
            id="scan-document-type"
            value={watch("documentType") || ""}
            onChange={(val) => setValue("documentType", val, { shouldValidate: true })}
            options={dynamicDocTypes.map((t) => ({ value: t, label: t }))}
            placeholder="-- Wybierz typ dokumentu --"
            searchPlaceholder="Szukaj typu dokumentu..."
            size="sm"
            clearable
          />
          {errors.documentType && <p className="text-[10px] text-destructive font-semibold">{errors.documentType.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="scan-date" className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Calendar className="size-3 text-primary" /> Data Skanu <span className="text-destructive">*</span>
          </label>
          <DatePicker
            id="scan-date"
            value={watch("scanDate")}
            onChange={(d) => setValue("scanDate", d, { shouldValidate: true })}
            placeholder="Wybierz datę..."
            size="sm"
            required
          />
          {errors.scanDate && <p className="text-[10px] text-destructive font-semibold">{errors.scanDate.message}</p>}
        </div>
      </div>

      {/* Placówka i Program */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label htmlFor="scan-facility" className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Building2 className="size-3.5 text-primary" /> Powiązana Placówka
          </label>
          <SearchableSelect
            id="scan-facility"
            value={facilityId || ""}
            onChange={handleFacilityChange}
            options={facilities.map((f) => ({
              value: f.id,
              label: f.name,
              description: `${f.address}, ${f.city}`,
              group: f.municipality
                ? f.municipality.toLowerCase().startsWith("gmina")
                  ? f.municipality
                  : `Gmina ${f.municipality}`
                : "Inne",
              icon: Building2,
            }))}
            placeholder="-- Wybierz placówkę --"
            searchPlaceholder="Szukaj placówki w bazie..."
            size="sm"
            clearable
          />
          {errors.facilityName && <p className="text-[10px] text-destructive font-semibold">{errors.facilityName.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="scan-program" className="font-semibold text-muted-foreground flex items-center gap-1 text-xs">
            <Award className="size-3 text-amber-600" /> Program Profilaktyczny
          </label>
          <SearchableSelect
            id="scan-program"
            value={programId || ""}
            onChange={handleProgramChange}
            options={programs.map((p) => ({
              value: p.id,
              label: p.name,
              description: `Edycja: ${p.editionYear || "ciągła"}`,
              badge: p.jrwaSymbol || undefined,
            }))}
            placeholder="-- Brak / Dokument ogólny --"
            searchPlaceholder="Szukaj programu..."
            size="sm"
            clearable
          />
        </div>
      </div>

      {/* Notatki */}
      <div className="space-y-1">
        <label htmlFor="scan-notes" className="font-semibold text-muted-foreground">Uwagi / Lokalizacja Archiwum</label>
        <Input
          id="scan-notes"
          type="text"
          placeholder="np. Segregator Programy 2025/2026, teczka Czyste Powietrze..."
          {...register("notes")}
          className="h-8 text-xs"
        />
      </div>
    </ModalDialog>
  );
}
