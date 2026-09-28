import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import type {
  OzipzJrwaCase,
  OzipzDictionaryItem,
  OzipzFacility,
  OzipzProgram,
  OzipzStaff,
} from "../../types/ozipz.types";
import { JrwaCaseSchema } from "../../schemas/ozipz.schemas";
import { JrwaSignGeneratorCard } from "./components/JrwaSignGeneratorCard";
import { JrwaGeneralFieldsCard } from "./components/JrwaGeneralFieldsCard";
import { generateNextJrwaSign } from "../../utils/programJrwaUtils";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { z } from "zod";
import { JRWA_DEFAULT_SECTION } from "../../constants";

const JrwaFormSchema = JrwaCaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

type JrwaFormInput = z.input<typeof JrwaFormSchema>;
type JrwaFormOutput = z.output<typeof JrwaFormSchema>;

export interface JrwaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCase: OzipzJrwaCase | null;
  existingCases?: OzipzJrwaCase[];
  dictionaryItems?: OzipzDictionaryItem[];
  facilities?: OzipzFacility[];
  programs?: OzipzProgram[];
  staff?: OzipzStaff[];
  onSave: (data: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">) => Promise<unknown> | void;
  onUpdate: (id: string, data: Partial<OzipzJrwaCase>) => Promise<unknown> | void;
}

export function JrwaDialog({
  isOpen,
  onClose,
  editingCase,
  existingCases = [],
  dictionaryItems = [],
  facilities = [],
  programs = [],
  staff = [],
  onSave,
  onUpdate,
}: JrwaDialogProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const jrwaDictItems = useMemo(() => {
    return dictionaryItems.filter(
      (d) => d.dictType === "jrwaSymbol" || d.dictType === "jrwa"
    );
  }, [dictionaryItems]);

  const calculateNextNumber = (sym: string, yr: number): number => {
    return generateNextJrwaSign({
      symbol: sym,
      year: yr,
      jrwaCases: existingCases,
    }).caseNumber;
  };

  const {
    register: _register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JrwaFormInput, unknown, JrwaFormOutput>({
    resolver: zodResolver(JrwaFormSchema),
    defaultValues: {
      section: JRWA_DEFAULT_SECTION,
      jrwaSymbol: "",
      caseNumber: 1,
      year: currentYear,
      fullCaseSign: "",
      title: "",
      notes: "",
      status: "",
      assignedEducator: "",
      startDate: getTodayIsoDate(),
    },
  });

  const section = watch("section");
  const jrwaSymbol = watch("jrwaSymbol");
  const caseNumber = watch("caseNumber");
  const year = watch("year");
  const fullCaseSign = watch("fullCaseSign");
  const title = watch("title");
  const notes = watch("notes");
  const assignedEducator = watch("assignedEducator");
  const status = watch("status");
  const programId = watch("programId");
  const facilityId = watch("facilityId");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  useEffect(() => {
    if (editingCase) {
      reset({
        section: editingCase.section || JRWA_DEFAULT_SECTION,
        jrwaSymbol: editingCase.jrwaSymbol,
        caseNumber: editingCase.caseNumber,
        year: editingCase.year,
        fullCaseSign: editingCase.fullCaseSign,
        title: editingCase.title,
        notes: editingCase.notes || "",
        status: editingCase.status || "",
        assignedEducator: editingCase.assignedEducator || "",
        programId: editingCase.programId,
        facilityId: editingCase.facilityId,
        startDate: editingCase.startDate || getTodayIsoDate(),
        endDate: editingCase.endDate || "",
      });
    } else {
      reset({
        section: JRWA_DEFAULT_SECTION,
        jrwaSymbol: "",
        caseNumber: 1,
        year: currentYear,
        fullCaseSign: "",
        title: "",
        notes: "",
        status: "",
        assignedEducator: "",
        startDate: getTodayIsoDate(),
      });
    }
  }, [editingCase, isOpen, reset, currentYear]);

  const handleQuickSymbol = (sym: string) => {
    setValue("jrwaSymbol", sym);
    const nextNum = calculateNextNumber(sym, year);
    setValue("caseNumber", nextNum);
    setValue("fullCaseSign", `${section}.${sym}.${nextNum}.${year}`);
  };

  const onSubmit = async (data: JrwaFormOutput) => {
    if (editingCase) {
      await onUpdate(editingCase.id, data);
    } else {
      await onSave(data);
    }
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingCase ? "Edycja Sprawy JRWA" : "Nowa Sprawa w Wykazie JRWA"}
      description="Zarejestruj teczkę spraw oświatowych zgodnie z Jednolitym Rzeczowym Wykazem Akt."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Generator i parametry znaku sprawy */}
        <JrwaSignGeneratorCard
          section={section || JRWA_DEFAULT_SECTION}
          onSectionChange={(val) => {
            setValue("section", val);
            setValue("fullCaseSign", `${val}.${jrwaSymbol}.${caseNumber}.${year}`);
          }}
          jrwaSymbol={jrwaSymbol || ""}
          onJrwaSymbolChange={(val) => {
            setValue("jrwaSymbol", val);
            setValue("fullCaseSign", `${section}.${val}.${caseNumber}.${year}`);
          }}
          caseNumber={caseNumber || 1}
          onCaseNumberChange={(val) => {
            setValue("caseNumber", val);
            setValue("fullCaseSign", `${section}.${jrwaSymbol}.${val}.${year}`);
          }}
          year={year || currentYear}
          onYearChange={(val) => {
            setValue("year", val);
            setValue("fullCaseSign", `${section}.${jrwaSymbol}.${caseNumber}.${val}`);
          }}
          fullCaseSign={fullCaseSign || ""}
          jrwaDictItems={jrwaDictItems}
          onSelectQuickSymbol={handleQuickSymbol}
        />

        {/* Pola merytoryczne */}
        <JrwaGeneralFieldsCard
          title={title}
          onTitleChange={(val) => setValue("title", val)}
          notes={notes}
          onNotesChange={(val) => setValue("notes", val)}
          assignedEducator={assignedEducator || ""}
          onAssignedEducatorChange={(val) => setValue("assignedEducator", val)}
          status={status || ""}
          onStatusChange={(val) => setValue("status", val)}
          programId={programId}
          onProgramChange={(val) => setValue("programId", val)}
          facilityId={facilityId}
          onFacilityChange={(val) => setValue("facilityId", val)}
          startDate={startDate}
          onStartDateChange={(val) => setValue("startDate", val)}
          endDate={endDate}
          onEndDateChange={(val) => setValue("endDate", val)}
          programs={programs}
          facilities={facilities}
          staff={staff}
        />

        {/* Błędy walidacji */}
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-600">
            Proszę uzupełnić wszystkie wymagane pola formularza.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Anuluj
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs font-semibold">
            {editingCase ? "Zapisz Zmiany" : "Utwórz Sprawę"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

export default JrwaDialog;
