import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, Users } from "lucide-react";
import type { AudienceGroupBlock, RecipientSubItem } from "./editor.types";
import type { useActionEditorState } from "./useActionEditorState";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";

type EditorState = ReturnType<typeof useActionEditorState>;

interface Props {
  state: EditorState;
  suggestions: string[];
}

const groupLabel = (group: AudienceGroupBlock, index: number) => group.name.trim() || `Grupa ${index + 1}`;

/**
 * Odbiorcy działania. W typowym przypadku (jedna grupa) widać tylko wiersze "Kto? / Ile osób?";
 * nagłówki grup z nazwami pojawiają się dopiero przy podziale na kilka grup (np. klas).
 */
export function ActionQuickAudience({ state: s, suggestions }: Props) {
  const hasAges = s.audienceGroups.some((g) => g.items.some((i) => i.ageFrom != null || i.ageTo != null));
  const [showAges, setShowAges] = useState(hasAges);
  useEffect(() => { if (hasAges) setShowAges(true); }, [hasAges]);
  const isGrouped = s.audienceGroups.length > 1 ||
    s.audienceGroups.some((g) => g.name.trim() && !/^grupa\s*1$/i.test(g.name.trim()));

  if (s.isPublication) {
    return <p className="text-sm text-muted-foreground">Publikacja internetowa: bez odbiorców.</p>;
  }

  const { errors } = s.form.formState;
  return <section className="space-y-3" aria-label="Odbiorcy">
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-semibold">Odbiorcy</h2>
      <Badge variant="outline" className="font-mono text-xs">Łącznie: <strong className="ml-1 text-primary">{s.totalDirectParticipants} os.</strong></Badge>
    </div>

    {s.audienceGroups.map((group, gi) => {
      const name = groupLabel(group, gi);
      const groupTotal = group.items.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      return <div key={group.id} className={isGrouped ? "space-y-2 rounded-md border border-border p-3" : "space-y-2"}>
        {isGrouped && <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
          <Users className="size-4 shrink-0 text-primary" aria-hidden />
          <Input aria-label="Nazwa grupy" value={group.name} placeholder={`Grupa ${gi + 1}`}
            onChange={(e) => s.handleUpdateGroupName(group.id, e.target.value)} className="h-8 max-w-56 text-sm font-semibold" />
          <Badge variant="secondary" className="font-mono text-xs font-normal">{groupTotal} os.</Badge>
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
              aria-label={`Kopiuj grupę ${name}`} title="Dodaj kolejną grupę o takim samym składzie" onClick={() => s.handleDuplicateGroup(group.id)}>
              <Copy className="size-3.5" /> Kopiuj
            </Button>
            {s.audienceGroups.length > 1 && <Button type="button" variant="ghost" size="sm" aria-label={`Usuń grupę ${name}`}
              className="h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => s.handleDeleteGroup(group.id)}>
              <Trash2 className="size-3.5" />
            </Button>}
          </div>
        </div>}

        {group.items.map((item, ii) => <AudienceItemRow key={item.id} state={s} group={group} item={item} index={ii}
          suggestions={suggestions} showAges={showAges} />)}

        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          aria-label={`Dodaj kategorię odbiorców do grupy ${name}`} onClick={() => s.handleAddItemToGroup(group.id)}>
          <Plus className="size-3" /> Dodaj kategorię odbiorców
        </Button>
      </div>;
    })}

    {errors.audienceGroup && <p role="alert" className="text-sm text-destructive">{errors.audienceGroup.message}</p>}
    {errors.participantsCount && <p role="alert" className="text-sm text-destructive">{errors.participantsCount.message}</p>}

    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => s.handleAddGroup()}>
        <Plus className="size-3.5" /> Dodaj grupę
      </Button>
      {!isGrouped && <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
        title="Np. kolejna klasa o takim samym składzie" onClick={() => s.handleDuplicateGroup(s.audienceGroups[0].id)}>
        <Copy className="size-3.5" /> Kopiuj jako kolejną grupę
      </Button>}
      <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" aria-expanded={showAges}
        onClick={() => setShowAges(!showAges)}>
        {showAges ? "Ukryj wiek odbiorców" : "Dodaj wiek odbiorców"}
      </Button>
    </div>
  </section>;
}

function AudienceItemRow({ state: s, group, item, index, suggestions, showAges }: {
  state: EditorState; group: AudienceGroupBlock; item: RecipientSubItem; index: number; suggestions: string[]; showAges: boolean;
}) {
  return <div className="space-y-1.5">
    <div className="grid grid-cols-[minmax(0,1fr)_7rem_2.25rem] items-end gap-2">
      <Autocomplete id={`audience-${item.id}`} label={index === 0 ? "Kto? *" : "Kolejna kategoria *"} value={item.name}
        options={suggestions} placeholder="Wybierz lub wpisz (np. Uczniowie, Opiekunowie)"
        onChange={(v) => s.handleUpdateGroupItem(group.id, item.id, "name", v)} />
      <div>
        <label className={FIELD_LABEL} htmlFor={`count-${item.id}`}>Ile osób? *</label>
        <Input id={`count-${item.id}`} type="number" min={0} step={1} value={item.count || ""} placeholder="0" className={`${FIELD_INPUT} font-mono`}
          onChange={(e) => s.handleUpdateGroupItem(group.id, item.id, "count", Number(e.target.value))} />
      </div>
      {group.items.length > 1
        ? <Button type="button" variant="ghost" size="icon" aria-label={`Usuń odbiorcę ${index + 1}`}
          className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => s.handleDeleteItemFromGroup(group.id, item.id)}><Trash2 className="size-3.5" /></Button>
        : <span aria-hidden />}
    </div>
    {showAges && <div className="flex flex-wrap items-end gap-2">
      {(["ageFrom", "ageTo"] as const).map((field) => <div key={field} className="w-28">
        <label className={FIELD_LABEL} htmlFor={`${item.id}-${field}`}>{field === "ageFrom" ? "Wiek od" : "Wiek do"}</label>
        <Input id={`${item.id}-${field}`} type="number" min={0} max={120} value={item[field] ?? ""} className="h-8 font-mono text-xs"
          onChange={(e) => s.handleUpdateGroupItem(group.id, item.id, field, e.target.value === "" ? null : Number(e.target.value))} />
      </div>)}
    </div>}
  </div>;
}
