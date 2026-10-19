import { CheckCircle2, CircleDashed, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RowActionButton } from "@/components/ui/row-action-button";
import type { OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { participationCoordinators } from "../../../utils/participationUtils";
import { participationLectureStatus, type LectureIndex } from "../../../utils/participationLectures";
import type { FacilityCoverageRow, ProgramCoverageRow } from "../../../utils/programCoverage";

export interface FacilityCoverageDetailsProps {
  row: FacilityCoverageRow;
  /** Programy zestawienia w kolejności kolumn tabeli. */
  programs: ProgramCoverageRow[];
  schoolYear: string;
  lectureIndex: LectureIndex;
  onAddParticipation: (programId: string, facilityId: string) => void;
  onEditParticipation: (participation: OzipzSchoolParticipation) => void;
}

const yesNo = (value: boolean, yes: string, no: string) =>
  value ? <span className="text-emerald-700 dark:text-emerald-400">{yes}</span> : <span className="text-amber-700 dark:text-amber-400">{no}</span>;

function ParticipationLine({
  participation,
  programName,
  facilityId,
  lectureIndex,
  onEdit,
}: {
  participation: OzipzSchoolParticipation;
  programName: string;
  facilityId: string;
  lectureIndex: LectureIndex;
  onEdit: (participation: OzipzSchoolParticipation) => void;
}) {
  const coordinators = participationCoordinators(participation).map((c) => c.name).join(", ");
  const lecture = participationLectureStatus(participation, lectureIndex).done;
  return (
    <li className="flex items-start gap-2 py-1.5 border-t border-border/50 first:border-t-0">
      <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{programName}</p>
        <p className="text-[11px] text-muted-foreground">
          {coordinators ? `koordynator: ${coordinators}` : <span className="text-amber-700 dark:text-amber-400">bez koordynatora</span>} · uczniowie: {Number(participation.pupilsCount) || 0} ·
          deklaracja: {yesNo(Boolean(participation.hasDeclaration), "złożona", "brak")} · sprawozdanie:{" "}
          {yesNo(Boolean(participation.hasFinalReport), "złożone", "oczekuje")} · prelekcja: {yesNo(lecture, "była", "brak")}
          {participation.facilityId !== facilityId && ` · zgłoszenie: ${participation.facilityName}`}
        </p>
      </div>
      <RowActionButton label={`Edytuj zgłoszenie: ${programName}`} icon={Pencil} onClick={() => onEdit(participation)} />
    </li>
  );
}

/** Karta placówki: wszystkie zgłoszenia w roku szkolnym i programy, do których się kwalifikuje, a nie ma zgłoszenia. */
export function FacilityCoverageDetails({
  row,
  programs,
  schoolYear,
  lectureIndex,
  onAddParticipation,
  onEditParticipation,
}: FacilityCoverageDetailsProps) {
  const signed = [
    ...programs.flatMap((program) =>
      (row.programs[program.programId]?.participations ?? []).map((participation) => ({ participation, programName: program.programName }))
    ),
    ...row.otherParticipations.map((participation) => ({ participation, programName: participation.programName })),
  ];
  const missing = programs.filter((program) => row.programs[program.programId]?.participations.length === 0);
  const contact = [row.facility.email || row.parent?.email, row.facility.phone || row.parent?.phone].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 py-1">
      <section aria-label="Zgłoszenia placówki">
        <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Zgłoszona do · {schoolYear} ({signed.length})
        </h4>
        {signed.length === 0 ? (
          <p className="text-xs text-muted-foreground">Brak zgłoszeń w tym roku szkolnym.</p>
        ) : (
          <ul>
            {signed.map(({ participation, programName }) => (
              <ParticipationLine
                key={participation.id}
                participation={participation}
                programName={programName}
                facilityId={row.facility.id}
                lectureIndex={lectureIndex}
                onEdit={onEditParticipation}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Programy bez zgłoszenia">
        <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Brak zgłoszenia ({missing.length})
        </h4>
        {missing.length === 0 ? (
          <p className="text-xs text-muted-foreground">Zgłoszona do wszystkich programów, do których się kwalifikuje.</p>
        ) : (
          <ul>
            {missing.map((program) => {
              const actions = row.programs[program.programId]?.actions ?? 0;
              return (
                <li key={program.programId} className="flex items-center gap-2 py-1.5 border-t border-border/50 first:border-t-0">
                  <CircleDashed className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">{program.programName}</p>
                    {actions > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">Działania w rejestrze bez zgłoszenia: {actions}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Dodaj zgłoszenie: ${row.facility.name} – ${program.programName}`}
                    onClick={() => onAddParticipation(program.programId, row.facility.id)}
                  >
                    <Plus className="size-3" />
                    Dodaj zgłoszenie
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(contact || row.parent) && (
        <p className="md:col-span-2 text-[11px] text-muted-foreground">
          {[contact && `Kontakt: ${contact}`, row.parent && `Zespół: ${row.parent.name}`].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
