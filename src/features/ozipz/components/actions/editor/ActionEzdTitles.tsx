import { useMemo } from "react";
import type { OzipzProgram } from "../../../types/ozipz.types";
import { composeEzdTitles } from "../../../utils/ezdTitles";
import { formatIzrzTaskType } from "../../../utils/izrzGenerator";
import { formatDatePl } from "../../../utils/dateUtils";
import { IzrzEzdTitles } from "../IzrzEzdTitles";
import type { useActionEditorState } from "./useActionEditorState";

interface ActionEzdTitlesProps {
  state: ReturnType<typeof useActionEditorState>;
  programs: OzipzProgram[];
}

/** Gotowe tytuły do EZD na górze formularza działania — liczone z aktualnie wpisanych danych. */
export function ActionEzdTitles({ state: s, programs }: ActionEzdTitlesProps) {
  const program = s.programId ? s.programName || programs.find((p) => p.id === s.programId)?.name || "" : "";
  const izrzNumber = (s.izrzSign || "").replace(/^IZRZ:\s*/i, "").trim();
  const hasMaterials = Number(s.materialsDistributedCount) > 0;

  const titles = useMemo(() => {
    if (!s.actionType || !s.date) return [];
    return composeEzdTitles({
      taskType: formatIzrzTaskType(s.actionType, hasMaterials),
      subject: s.title,
      institution: s.facilityName,
      city: s.municipality,
      program,
      dateFormatted: formatDatePl(s.date, ""),
      izrzNumber: izrzNumber ? izrzNumber : undefined,
      hasDistributionList: false,
    });
  }, [s.actionType, s.title, s.date, s.facilityName, s.municipality, program, izrzNumber, hasMaterials]);

  return <IzrzEzdTitles titles={titles} className="rounded-md border border-border bg-muted/30 px-3 py-2.5" />;
}
