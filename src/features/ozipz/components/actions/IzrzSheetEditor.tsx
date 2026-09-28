import type { ReactNode } from "react";
import type { IzrzGeneratorData } from "../../utils/izrzGenerator";
import { IZRZ_ATTACHMENT_LABELS, isIzrzDraftNumber, listIzrzAttachments } from "../../utils/izrzGenerator";

export interface IzrzSheetEditorProps {
  data: IzrzGeneratorData;
  onChange: (patch: Partial<IzrzGeneratorData>) => void;
}

const FIELD_CLASS =
  "w-full resize-y rounded-[3px] border border-dashed border-gray-300 bg-transparent px-2 py-1.5 text-xs leading-relaxed text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-solid focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function rowsFor(value: string, min: number): number {
  const estimated = value.split("\n").reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 95)), 0);
  return Math.max(min, estimated);
}

interface SheetFieldProps {
  number: number;
  label: ReactNode;
  children: ReactNode;
}

function SheetField({ number, label, children }: SheetFieldProps) {
  return (
    <div className="space-y-1">
      <p className="font-bold text-gray-900">
        {number}. {label}
      </p>
      <div className="pl-4">{children}</div>
    </div>
  );
}

interface SheetTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minRows?: number;
  ariaLabel: string;
}

function SheetText({ value, onChange, placeholder, minRows = 1, ariaLabel }: SheetTextProps) {
  return (
    <textarea
      aria-label={ariaLabel}
      className={FIELD_CLASS}
      rows={rowsFor(value, minRows)}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function IzrzSheetEditor({ data, onChange }: IzrzSheetEditorProps) {
  const attachments = listIzrzAttachments(data);
  const draftNumber = isIzrzDraftNumber(data.reportNumber);

  return (
    <div className="p-6 md:p-10 bg-white text-black text-[13px] leading-relaxed min-h-[750px] space-y-6 select-text">
      <div className="flex justify-between items-start gap-6 pt-2 font-sans">
        <div className="space-y-1">
          <div className="border-b border-dotted border-gray-400 w-64 h-10" />
          <p className="text-[11px] text-gray-600 italic">(pieczątka stacji sanitarno-epidemiologicznej)</p>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-1 text-xs font-medium">
            <input
              aria-label="Miejscowość"
              className="w-36 rounded-[3px] border border-dashed border-gray-300 bg-transparent px-1.5 py-0.5 text-right text-xs text-gray-900 hover:border-gray-400 focus:border-solid focus:border-primary focus:outline-none"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
            />
            <span>, {data.dateFormatted} r.</span>
          </div>
          <div className="border-b border-dotted border-gray-400 w-48 ml-auto" />
          <p className="text-[11px] text-gray-600 italic">(miejscowość, data)</p>
        </div>
      </div>

      <p className="font-sans text-xs">
        <strong>Znak sprawy:</strong>{" "}
        {data.caseNumber ? (
          <span className="font-mono font-bold">{data.caseNumber}</span>
        ) : (
          <span className="italic text-gray-500">(brak zarejestrowanej sprawy)</span>
        )}
      </p>

      <h2 className="text-center text-base font-bold tracking-tight uppercase font-sans py-3">
        Informacja dotycząca realizacji zadania{" "}
        <span className={draftNumber ? "text-amber-700" : undefined}>{data.reportNumber}</span>
      </h2>

      <div className="space-y-4 font-sans text-xs">
        <SheetField number={1} label={<>Zadanie realizowane w ramach <em>(nazwa interwencji)</em>:</>}>
          <SheetText
            ariaLabel="Nazwa interwencji"
            value={data.programName}
            placeholder="Nazwa programu, akcji lub interwencji"
            onChange={(programName) => onChange({ programName })}
          />
        </SheetField>

        <SheetField number={2} label="Forma zadania:">
          <SheetText
            ariaLabel="Forma zadania"
            value={data.taskType}
            placeholder="np. Prelekcja (warsztat)"
            onChange={(taskType) => onChange({ taskType })}
          />
        </SheetField>

        <SheetField number={3} label={<>Miejsce wykonania zadania <em>(nazwa i adres instytucji)</em>:</>}>
          <SheetText
            ariaLabel="Miejsce wykonania zadania"
            value={data.address}
            placeholder="Nazwa i adres instytucji"
            onChange={(address) => onChange({ address })}
          />
        </SheetField>

        <SheetField number={4} label="Termin wykonania zadania:">
          <p className="px-2 py-1 font-mono font-bold text-gray-900">{data.dateFormatted}</p>
        </SheetField>

        <SheetField
          number={5}
          label={
            <span className="inline-flex flex-wrap items-center gap-1.5">
              Grupa docelowa i liczba osób objętych zadaniem:
              <input
                type="number"
                min={0}
                aria-label="Liczba osób objętych zadaniem"
                className="w-20 rounded-[3px] border border-dashed border-gray-300 bg-transparent px-1.5 py-0.5 font-black text-emerald-800 hover:border-gray-400 focus:border-solid focus:border-primary focus:outline-none"
                value={data.viewerCount}
                onChange={(e) => onChange({ viewerCount: Math.max(0, Number(e.target.value) || 0) })}
              />
            </span>
          }
        >
          <SheetText
            ariaLabel="Grupa docelowa"
            value={data.viewerCountDescription}
            placeholder="Odbiorcy i ich liczebność, np. Uczniowie szkół podstawowych - 24"
            minRows={2}
            onChange={(viewerCountDescription) => onChange({ viewerCountDescription })}
          />
        </SheetField>

        <SheetField
          number={6}
          label={<>Zakres uczestnictwa <em>(czynności wykonane w trakcie realizacji zadania)</em>:</>}
        >
          <SheetText
            ariaLabel="Zakres czynności"
            value={data.taskDescription}
            placeholder="Opisz przebieg zadania i wykonane czynności"
            minRows={4}
            onChange={(taskDescription) => onChange({ taskDescription })}
          />
        </SheetField>

        <SheetField number={7} label="Uwagi, dodatkowe informacje:">
          <div className="space-y-2">
            <SheetText
              ariaLabel="Uwagi"
              value={data.additionalInfo}
              placeholder="Brak uwag"
              minRows={2}
              onChange={(additionalInfo) => onChange({ additionalInfo })}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-700">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={data.hasAttendanceList}
                  onChange={(e) => onChange({ hasAttendanceList: e.target.checked })}
                />
                {IZRZ_ATTACHMENT_LABELS.attendance}
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={data.hasDistributionList}
                  onChange={(e) => onChange({ hasDistributionList: e.target.checked })}
                />
                {IZRZ_ATTACHMENT_LABELS.distribution}
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="px-2 text-gray-900 whitespace-pre-line">
                {`Załączniki:\n${attachments.join("\n")}`}
              </div>
            )}
          </div>
        </SheetField>
      </div>

      <div className="pt-10 flex justify-end font-sans">
        <div className="text-center space-y-1 w-64">
          <div className="border-b border-dotted border-gray-400 h-8" />
          <p className="text-[11px] text-gray-600 italic">(podpis osoby odpowiedzialnej)</p>
        </div>
      </div>
    </div>
  );
}
