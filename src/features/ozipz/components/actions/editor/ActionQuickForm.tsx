import { useEffect, useRef, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { ActionEditorKancelariaCard } from "./ActionEditorKancelariaCard";
import { ActionQuickStart } from "./ActionQuickStart";
import { ActionQuickAudience } from "./ActionQuickAudience";
import { ActionQuickMaterials } from "./ActionQuickMaterials";
import { ActionQuickFacilityAdd } from "./ActionQuickFacilityAdd";
import { getProgramJrwaSymbol } from "../../../utils/programJrwaUtils";
import type { ActionEditorSectionProps, ActionFormInput } from "./editor.types";
import type { useActionEditorState } from "./useActionEditorState";
import { DEFAULT_EZD_STATUS, findCampaign } from "./actionEditorSubmitUtils";
import { EZD_STATUS_LABELS } from "../actionEzdStatus";
import type { ActionDraft } from "./actionDraft";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";
import { municipalityName } from "../../../utils/facilityUtils";
import type { OzipzFacility } from "../../../types/ozipz.types";

function DraftBanner({ draft, onRestore, onDismiss }: { draft: ActionDraft; onRestore: () => void; onDismiss: () => void }) {
  const savedAt = new Date(draft.savedAt);
  const when = Number.isNaN(savedAt.getTime()) ? "" : savedAt.toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const title = draft.values.title?.trim();
  return <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
    <p>Masz niezapisane działanie{title ? <> „<strong>{title}</strong>”</> : null}{when ? ` z ${when}` : ""}. Przywrócić wpisane dane?</p>
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={onRestore}>Przywróć szkic</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>Odrzuć szkic</Button>
    </div>
  </div>;
}

function Disclosure({ title, summary, reveal = false, children }: {
  title: string; summary?: string; reveal?: boolean; children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (reveal && ref.current) ref.current.open = true; }, [reveal]);
  return <details ref={ref} className="rounded-md border border-border p-3">
    <summary className="cursor-pointer text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      {title}{summary && <> <span className="ml-2 font-normal text-muted-foreground break-words">{summary}</span></>}
    </summary>
    <div className="pt-3">{children}</div>
  </details>;
}

export function ActionQuickForm({ state: s, data }: {
  state: ReturnType<typeof useActionEditorState>; data: ActionEditorSectionProps;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { errors, submitCount } = s.form.formState;
  const programs = data.programs ?? [];
  const facilities = data.facilities ?? [];
  const dictionaries = data.dictionaryItems ?? [];
  // Działania i placówki przechowują samą nazwę gminy („Myślibórz”), słownik ma etykiety z prefiksem („Gmina Myślibórz”).
  const municipalityOptions = [...new Set((data.municipalities ?? []).map(municipalityName).filter(Boolean))];
  useEffect(() => {
    if (!submitCount || !Object.keys(errors).length) return;
    const frame = requestAnimationFrame(() => {
      const target = root.current?.querySelector<HTMLElement>("[data-field-error='true']");
      if (!target) return;
      let parent = target.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      target.querySelector<HTMLElement>("input:not([type=hidden]), button, textarea")?.focus();
      target.scrollIntoView?.({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [errors, submitCount]);
  const field = (key: keyof ActionFormInput, children: ReactNode) => <div data-field-error={Boolean(errors[key])}>
    {children}{errors[key]?.message && <p role="alert" className="mt-1 text-sm text-destructive">{String(errors[key]?.message)}</p>}
  </div>;
  const programOptions = [
    ...programs.map((p) => ({ value: `prog:${p.id}`, label: p.name, group: "Programy" })),
    ...s.jrwaSymbolsList.filter((j) => !programs.some((p) => getProgramJrwaSymbol(p) === j.symbol))
      .map((j) => ({ value: `jrwa:${j.symbol}`, label: `${j.symbol} — ${j.label}`, group: "Klasyfikacja" })),
  ];
  const officeSummary = s.isNoJrwa ? "Nie dotyczy" : [s.jrwaSign, s.izrzSign && `IZRZ: ${s.izrzSign}`,
    EZD_STATUS_LABELS[s.ezdStatus || DEFAULT_EZD_STATUS] || s.ezdStatus].filter(Boolean).join(" · ");
  const materialsSummary = [Number(s.materialsDistributedCount) > 0 && `MAT: ${s.materialsDistributedCount} szt.`,
    Number(s.materialsDistributedCount) > 0 && s.canSeparateDistribution && s.separateDistribution && "+ osobna dystrybucja",
    s.linkedDistribution && "materiały w powiązanej dystrybucji"].filter(Boolean).join(" · ");
  const campaign = findCampaign(s.campaignDict, s.campaignId);
  const descriptionSummary = [s.activitiesDescription.trim() && "opis", s.additionalNotes.trim() && "uwagi"].filter(Boolean).join(" · ");
  const selectFacility = (f: OzipzFacility) => {
    s.setValue("facilityName", f.name); s.setValue("facilityId", f.id);
    s.setValue("municipality", f.municipality || "");
    s.setFacilityAddress([f.address, f.city].filter(Boolean).join(", "));
  };
  const facilityHint = !s.facilityName.trim() || s.isPublication ? ""
    : s.facilityId ? s.facilityAddress || "Placówka z bazy placówek"
    : "Miejsce spoza bazy placówek — działanie nie zostanie powiązane z placówką.";
  return <div ref={root} className="space-y-4">
    {s.pendingDraft && <DraftBanner draft={s.pendingDraft} onRestore={s.restoreDraft} onDismiss={s.dismissDraft} />}
    <ActionQuickStart state={s} data={data} />
    <p className="text-sm text-muted-foreground">Uzupełnij podstawowe dane. Pola oznaczone * są wymagane.</p>
    <section className="space-y-3" aria-label="Działanie">
      <h2 className="font-semibold">Działanie</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
          {field("actionType", <Select label="Forma działania *" value={s.actionType}
            options={s.activityTypeDict.map((d) => ({ value: d.label, label: d.label }))}
            onChange={(v) => s.setValue("actionType", v)} placeholder="Wybierz formę działania" autoFocus />)}
          <Select label="Program lub klasyfikacja" value={s.programId ? `prog:${s.programId}` : s.selectedJrwaSymbol ? `jrwa:${s.selectedJrwaSymbol}` : ""}
            options={programOptions} onChange={s.handleProgramOrJrwaSelect} clearable placeholder="Wybierz, jeśli dotyczy" />
          <div className="sm:col-span-2 lg:col-span-1">
            <Select label="Kampania / akcja" value={campaign?.code || s.campaignId}
              options={s.campaignDict.map((c) => ({ value: c.code, label: c.label }))}
              onChange={(v) => s.setValue("campaignId", v)} clearable placeholder="Wybierz, jeśli dotyczy" />
          </div>
        </div>
        <div className="sm:col-span-2">
          {field("title", <><label htmlFor="action-title" className={FIELD_LABEL}>Tytuł działania *</label>
            <Input id="action-title" className={FIELD_INPUT} value={s.title} placeholder="Czego dotyczyło działanie?" onChange={(e) => {
              s.setValue("title", e.target.value); if (!s.programId) s.setValue("programName", e.target.value);
            }} /></>)}
        </div>
        {field("date", <><label htmlFor="action-date" className={FIELD_LABEL}>Data realizacji *</label>
          <div className="flex flex-wrap items-center gap-2"><DatePicker id="action-date" value={s.date} onChange={s.handleDateChange} size="md" className="min-w-40 w-auto flex-1" showShortcuts={false} />
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => s.setQuickDate("today")}>Dziś</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => s.setQuickDate("yesterday")}>Wczoraj</Button>
            </div>
          </div></>)}
        {field("numberOfActions", <><label htmlFor="action-count" className={FIELD_LABEL}>Liczba działań [DZ] *</label>
          <Input id="action-count" className={FIELD_INPUT} type="number" min={1} max={999} value={s.numberOfActions || 1}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              s.setValue("numberOfActions", isNaN(val) ? 1 : Math.max(1, val));
            }} placeholder="1" title="Krotność zrealizowanych działań (np. 1 prelekcja, 3 warsztaty)" /></>)}
      </div>
    </section>
    <section className="space-y-3 border-t border-border pt-4" aria-label="Miejsce i prowadzący">
      <h2 className="font-semibold">Miejsce i prowadzący</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("facilityName", <><Autocomplete label="Placówka lub miejsce *" value={s.facilityName}
          options={facilities.map((f) => ({ value: f.id, label: f.name, description: [f.address, f.city, f.municipality].filter(Boolean).join(", ") }))}
          onChange={s.handleFacilityNameInput} onSelectOption={(option) => {
            const f = facilities.find((item) => item.id === option.value);
            if (f) selectFacility(f);
          }} placeholder="Wyszukaj lub wpisz miejsce" />
          {facilityHint && <p className={`mt-1 text-xs ${s.facilityId ? "text-muted-foreground" : "text-amber-700 dark:text-amber-300"}`}>{facilityHint}</p>}
          {data.onAddFacility && <ActionQuickFacilityAdd name={s.facilityId ? "" : s.facilityName} municipality={s.municipality}
            facilities={facilities} municipalities={data.municipalities ?? []} dictionaryItems={dictionaries} onAddFacility={data.onAddFacility}
            onCreated={selectFacility} />}</>)}
        {field("municipality", <Select label="Gmina *" value={municipalityName(s.municipality)} options={municipalityOptions}
          onChange={(v) => s.setValue("municipality", v)} placeholder="Wybierz gminę" />)}
        {field("leadEducator", <Autocomplete label="Osoba prowadząca *" value={s.leadEducator}
          options={(data.staff ?? []).map((p) => p.fullName)} onChange={(v) => s.setValue("leadEducator", v)} placeholder="Wybierz lub wpisz osobę" />)}
      </div>
    </section>
    <div className="border-t border-border pt-4" data-field-error={Boolean(errors.audienceGroup || errors.participantsCount)}>
      <ActionQuickAudience state={s} suggestions={dictionaries.filter((d) => d.dictType === "recipientGroup").map((d) => d.label)} />
    </div>
    <div className="space-y-2">
      <Disclosure title="Kancelaria" summary={officeSummary}>
        <ActionEditorKancelariaCard showDate={false} selectedJrwaSymbol={s.selectedJrwaSymbol}
          jrwaSign={s.jrwaSign} izrzSign={s.izrzSign} ezdStatus={s.ezdStatus || DEFAULT_EZD_STATUS}
          isPublication={s.isPublication} isDistribution={s.isDistribution} onDateChange={s.handleDateChange}
          onJrwaSignChange={s.handleJrwaSignChange} onIzrzSignChange={(v) => s.setValue("izrzSign", v)}
          onEzdStatusChange={(v) => s.setValue("ezdStatus", v)} onGenerateJrwaSign={s.handleGenerateJrwaSign} />
      </Disclosure>
      {!s.isPublication && <Disclosure title="Materiały" summary={materialsSummary} reveal={s.isDistribution || Boolean(s.linkedDistribution) || s.materialItems.length > 0 || Boolean(s.materialsDistributedCount)}>
        <div data-field-error={Boolean(errors.materialsDistributedCount || errors.materialId)}>
          <ActionQuickMaterials state={s} materials={data.materials ?? []} />
          {errors.materialId && <p role="alert" className="text-sm text-destructive">{errors.materialId.message}</p>}
        </div>
      </Disclosure>}
      <Disclosure title="Opis i dodatkowe informacje" summary={descriptionSummary} reveal={Boolean(s.activitiesDescription || s.additionalNotes)}>
        <div className="space-y-3">
          <div><label htmlFor="action-description" className={FIELD_LABEL}>Opis czynności</label>
            <Textarea id="action-description" rows={3} value={s.activitiesDescription} onChange={(e) => s.setActivitiesDescription(e.target.value)} /></div>
          <div><label htmlFor="action-notes" className={FIELD_LABEL}>Uwagi i wnioski</label>
            <Textarea id="action-notes" rows={2} value={s.additionalNotes} onChange={(e) => s.setAdditionalNotes(e.target.value)} /></div>
        </div>
      </Disclosure>
    </div>
  </div>;
}
