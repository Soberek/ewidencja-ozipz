import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { OzipzMaterial } from "../../../types/ozipz.types";
import type { useActionEditorState } from "./useActionEditorState";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";

export function ActionQuickMaterials({ state: s, materials }: {
  state: ReturnType<typeof useActionEditorState>;
  materials: OzipzMaterial[];
}) {
  const { errors } = s.form.formState;
  const hasItems = s.materialItems.length > 0;
  const hasMaterials = hasItems || Number(s.materialsDistributedCount) > 0;
  return <div className="space-y-3 pt-3">
    {s.linkedDistribution && <p className="rounded-md border border-border bg-muted/40 p-2 text-sm text-muted-foreground">
      Materiały z tego działania są w osobnym wpisie „{s.linkedDistribution.title}” — tam je zmienisz. Zmiany daty, miejsca, prowadzącego i odbiorców zostaną w nim uwzględnione automatycznie.
    </p>}
    {s.linkedParentAction && <p className="rounded-md border border-border bg-muted/40 p-2 text-sm text-muted-foreground">
      Dystrybucja zapisana razem z działaniem „{s.linkedParentAction.title}”.
    </p>}
    {!s.isPublication && !s.linkedDistribution && <>
      {s.materialItems.map((item, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_6rem_2.25rem] items-end gap-2">
        <Select label={`Materiał ${index + 1}`} value={item.materialId}
          options={materials.map((m) => ({ value: m.id, label: m.title }))}
          onChange={(materialId) => s.handleUpdateMaterialItem(index, { materialId })} placeholder="Wybierz materiał z katalogu" />
        <div><label htmlFor={`material-${index}`} className={FIELD_LABEL}>Liczba sztuk</label>
          <Input id={`material-${index}`} className={`${FIELD_INPUT} font-mono`} type="number" min={1} step={1} value={item.quantity || ""}
            onChange={(e) => s.handleUpdateMaterialItem(index, { quantity: Number(e.target.value) })} /></div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Usuń materiał ${index + 1}`}
          className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => s.handleRemoveMaterialItem(index)}><Trash2 className="size-3.5" /></Button>
      </div>)}
      <div className="flex flex-wrap items-end gap-3">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => s.handleAddMaterialItem()}>
          <Plus className="size-3.5" /> Dodaj materiał
        </Button>
        {hasItems
          ? <p className="text-sm">Razem: <strong className="font-mono">{s.materialsDistributedCount ?? 0}</strong> szt.</p>
          : <div><label htmlFor="materials-total" className={FIELD_LABEL}>Łączna liczba materiałów</label>
            <Input id="materials-total" className={`${FIELD_INPUT} max-w-40 font-mono`} type="number" min={0} step={1} value={s.materialsDistributedCount ?? 0}
              onChange={(e) => s.setValue("materialsDistributedCount", Number(e.target.value))} /></div>}
      </div>
      {errors.materialsDistributedCount && <p role="alert" className="text-sm text-destructive">{errors.materialsDistributedCount.message}</p>}
      {s.canSeparateDistribution && hasMaterials && <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 text-sm">
        <input type="checkbox" className="mt-0.5 cursor-pointer rounded text-primary" checked={s.separateDistribution}
          onChange={(e) => s.setSeparateDistribution(e.target.checked)} />
        <span>
          <span className="font-medium">Zapisz wydanie materiałów jako osobne działanie „{s.distributionActionType}”</span>
          <span className="block text-muted-foreground">
            {!s.separateDistribution
              ? "Materiały zostaną przypisane do tego działania, bez osobnej dystrybucji."
              : s.isEditMode
              ? "Powstanie dodatkowy wpis: dystrybucja (1 działanie, 1 odbiorca, ta sama grupa odbiorców), a materiały przejdą do niego."
              : "Powstaną 2 wpisy: to działanie oraz dystrybucja (1 działanie, 1 odbiorca, ta sama grupa odbiorców)."}
          </span>
        </span>
      </label>}
    </>}
    <div><label htmlFor="indirect-count" className={FIELD_LABEL}>Odbiorcy pośredni / zasięg</label>
      <Input id="indirect-count" className={`${FIELD_INPUT} max-w-40 font-mono`} type="number" min={0} step={1} value={s.indirectRecipientsCount || ""} placeholder="0"
        onChange={(e) => s.setValue("indirectRecipientsCount", Number(e.target.value))} />
      {errors.indirectRecipientsCount && <p role="alert" className="text-sm text-destructive">{errors.indirectRecipientsCount.message}</p>}
    </div>
  </div>;
}
