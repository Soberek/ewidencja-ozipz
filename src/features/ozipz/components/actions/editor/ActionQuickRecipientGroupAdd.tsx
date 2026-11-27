import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Lock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";
import {
  RECIPIENT_GROUP_TYPE,
  findRecipientGroup,
  findSimilarRecipientGroups,
  uniqueRecipientGroupCode,
} from "../../../utils/recipientGroups";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";

type RecipientGroupPayload = Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">;

interface Props {
  /** Okno jest otwarte, gdy podano nazwę początkową (może być pusta). */
  initialName: string | null;
  groups: OzipzDictionaryItem[];
  onClose: () => void;
  onAddRecipientGroup: (data: RecipientGroupPayload) => Promise<OzipzDictionaryItem>;
  /** Utworzono nową grupę w słowniku. */
  onCreated: (item: OzipzDictionaryItem) => void;
  /** Użytkownik woli istniejącą grupę (duplikat lub podobna nazwa). */
  onUseExisting: (item: OzipzDictionaryItem) => void;
}

/**
 * Dodanie nowej grupy odbiorców do słownika bez wychodzenia z formularza działania.
 * Słownik jest zamknięty: pilnujemy dubli i podobnych nazw, a przy zapisie przypominamy, że po użyciu
 * w działaniu nazwy nie da się już zmienić.
 */
export function ActionQuickRecipientGroupAdd({ initialName, groups, onClose, onAddRecipientGroup, onCreated, onUseExisting }: Props) {
  const isOpen = initialName !== null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName ?? "");
    setDescription("");
    setError(null);
  }, [isOpen, initialName]);

  const trimmed = name.trim().replace(/\s+/g, " ");
  const exact = useMemo(() => findRecipientGroup(groups, trimmed), [groups, trimmed]);
  const similar = useMemo(() => (exact ? [] : findSimilarRecipientGroups(groups, trimmed)), [groups, trimmed, exact]);
  const code = useMemo(() => (trimmed ? uniqueRecipientGroupCode(trimmed, groups.map((g) => g.code)) : ""), [groups, trimmed]);

  const submit = async (event: FormEvent) => {
    // Okno renderuje się w portalu, ale zdarzenia Reacta bubblują do formularza działania – nie zapisujemy go przy okazji.
    event.preventDefault();
    event.stopPropagation();
    if (!trimmed) { setError("Podaj nazwę grupy odbiorców."); return; }
    if (exact) { setError(`Grupa „${exact.label}” już istnieje w słowniku – wybierz ją z listy.`); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await onAddRecipientGroup({
        dictType: RECIPIENT_GROUP_TYPE,
        code,
        label: trimmed,
        description: description.trim() || undefined,
        isSystem: false,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać grupy odbiorców.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chooseExisting = (item: OzipzDictionaryItem) => { onUseExisting(item); onClose(); };

  return <div className="contents" onKeyDown={(e) => e.stopPropagation()} onSubmit={(e) => e.stopPropagation()}>
    <ModalDialog isOpen={isOpen} onClose={onClose} size="sm" headerAccent="purple" icon={<Users className="size-5" />}
      title="Nowa grupa odbiorców" description="Pozycja trafi do słownika i będzie dostępna w kolejnych działaniach."
      error={error} onSubmit={submit} isSubmitting={isSubmitting} submitText="Dodaj i wybierz">
      <div className="space-y-4">
        <div>
          <label htmlFor="new-recipient-group-name" className={FIELD_LABEL}>Nazwa grupy odbiorców *</label>
          <Input id="new-recipient-group-name" className={FIELD_INPUT} value={name} autoFocus maxLength={120}
            placeholder="np. Uczniowie szkół ponadpodstawowych" onChange={(e) => { setName(e.target.value); setError(null); }} />
          {trimmed && !exact && <p className="mt-1 text-[11px] text-muted-foreground">
            Kod w słowniku: <span className="font-mono">{code}</span>
          </p>}
        </div>

        {exact && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <span>Taka grupa już jest w słowniku: <strong>{exact.label}</strong>.</span>
          <Button type="button" size="sm" onClick={() => chooseExisting(exact)}>Użyj istniejącej</Button>
        </div>}

        {similar.length > 0 && <div role="status" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="size-4 shrink-0" aria-hidden />Podobne grupy w słowniku – czy któraś pasuje?</p>
          <ul className="flex flex-wrap gap-1.5">
            {similar.map((item) => <li key={item.id}>
              <Button type="button" size="sm" variant="outline" onClick={() => chooseExisting(item)}>{item.label}</Button>
            </li>)}
          </ul>
        </div>}

        <div>
          <label htmlFor="new-recipient-group-description" className={FIELD_LABEL}>
            Opis <span className="font-normal text-muted-foreground">(opcjonalnie)</span>
          </label>
          <Input id="new-recipient-group-description" className={FIELD_INPUT} value={description} maxLength={200}
            placeholder="Kogo obejmuje – ułatwia późniejszy wybór" onChange={(e) => setDescription(e.target.value)} />
        </div>

        <p className="flex gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>Po zapisaniu działania z tą grupą jej nazwy i kodu nie da się zmienić ani usunąć grupy – zmiana nazwy przepisałaby
            wstecz dotychczasowe sprawozdania. Sprawdź pisownię.</span>
        </p>
      </div>
    </ModalDialog>
  </div>;
}
