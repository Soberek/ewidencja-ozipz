import { Plus, Trash2 } from "lucide-react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OzipzMaterial } from "../../../types/ozipz.types";
import type { TemplateAudienceGroup } from "../../../utils/templateUtils";

const EMPTY_ITEM = { name: "", ageFrom: null, ageTo: null };

/**
 * Odbiorcy szablonu: grupy i kategorie bez liczby osób (liczby wpisuje się przy działaniu).
 * Przy jednej grupie nie pokazujemy nagłówka grupy — tak jak w formularzu działania.
 */
export function TemplateAudienceEditor({ groups, onChange, suggestions }: {
  groups: TemplateAudienceGroup[]; onChange: (groups: TemplateAudienceGroup[]) => void; suggestions: string[];
}) {
  const update = (gi: number, group: TemplateAudienceGroup) => onChange(groups.map((g, i) => (i === gi ? group : g)));
  const grouped = groups.length > 1;
  return <div className="space-y-2">
    {groups.map((group, gi) => {
      const label = group.name.trim() || `Grupa ${gi + 1}`;
      return <div key={gi} className={grouped ? "space-y-2 rounded-md border border-border p-2" : "space-y-2"}>
        {grouped && <div className="flex items-center gap-2">
          <Input aria-label={`Nazwa grupy ${gi + 1}`} value={group.name} placeholder={`Grupa ${gi + 1}`} className="h-8 max-w-56 font-semibold"
            onChange={(e) => update(gi, { ...group, name: e.target.value })} />
          <Button type="button" variant="ghost" size="sm" aria-label={`Usuń grupę ${label}`}
            className="ml-auto h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange(groups.filter((_, i) => i !== gi))}><Trash2 className="size-3.5" /></Button>
        </div>}
        {group.items.map((item, ii) => <div key={ii} className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Autocomplete aria-label={`Kategoria odbiorców ${ii + 1} (${label})`} value={item.name} options={suggestions}
              placeholder="Wybierz lub wpisz (np. Uczniowie, Rodzice)"
              onChange={(name) => update(gi, { ...group, items: group.items.map((it, i) => (i === ii ? { ...it, name } : it)) })} />
          </div>
          {group.items.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Usuń kategorię ${ii + 1} (${label})`}
            className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => update(gi, { ...group, items: group.items.filter((_, i) => i !== ii) })}><Trash2 className="size-3.5" /></Button>}
        </div>)}
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => update(gi, { ...group, items: [...group.items, EMPTY_ITEM] })}>
          <Plus className="size-3" /> Dodaj kategorię{grouped ? ` do grupy ${label}` : ""}
        </Button>
      </div>;
    })}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
        onClick={() => onChange([...groups, { name: "", items: [EMPTY_ITEM] }])}>
        <Plus className="size-3.5" /> Dodaj grupę
      </Button>
      {/* Typowy przypadek: kilka klas o tym samym składzie (np. uczniowie i rodzice). */}
      {groups.length > 0 && groups[groups.length - 1].items.some((i) => i.name.trim()) && <Button type="button" variant="outline" size="sm"
        className="gap-1.5 text-xs" onClick={() => onChange([...groups, { ...groups[groups.length - 1], name: "" }])}>
        <Plus className="size-3.5" /> Kopiuj ostatnią grupę
      </Button>}
    </div>
  </div>;
}

/** Materiały szablonu: pozycje z katalogu, bez liczby sztuk. */
export function TemplateMaterialsEditor({ materialIds, onChange, materials }: {
  materialIds: string[]; onChange: (ids: string[]) => void; materials: OzipzMaterial[];
}) {
  const options = materials.map((m) => ({ value: m.id, label: m.title }));
  return <div className="space-y-2">
    {materialIds.map((id, index) => <div key={index} className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Select label={`Materiał ${index + 1}`} value={id} options={options} placeholder="Wybierz materiał z katalogu"
          onChange={(value) => onChange(materialIds.map((m, i) => (i === index ? value : m)))} />
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={`Usuń materiał ${index + 1}`}
        className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onChange(materialIds.filter((_, i) => i !== index))}><Trash2 className="size-3.5" /></Button>
    </div>)}
    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" disabled={materials.length === 0}
      onClick={() => onChange([...materialIds, ""])}>
      <Plus className="size-3.5" /> Dodaj materiał
    </Button>
  </div>;
}
