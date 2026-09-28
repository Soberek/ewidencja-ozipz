import { EyeOff, Loader2, PlusCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { OzipzStaff } from "../../../../types/ozipz.types";
import { DEFAULT_PUBLICATION_AUTHOR } from "../importExecution";

interface ImportActionBarProps {
  selectedCount: number;
  author: string;
  onAuthorChange: (value: string) => void;
  staff: OzipzStaff[];
  isSaving: boolean;
  onSkipSelected: () => void;
  onImport: () => void;
}

const plural = (n: number) => (n === 1 ? "publikację" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "publikacje" : "publikacji");

/** Dolny pasek akcji – widoczny zawsze, gdy lista jest przewijana. */
export function ImportActionBar({ selectedCount, author, onAuthorChange, staff, isSaving, onSkipSelected, onImport }: ImportActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-[3px] border border-border bg-card/95 px-3 py-2 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.15)] backdrop-blur">
      <span className="text-xs text-muted-foreground">
        Zaznaczono: <strong className="font-mono text-sm text-foreground tabular-nums">{selectedCount}</strong>
      </span>
      <span className="hidden text-[11px] text-muted-foreground md:inline">
        · każda publikacja = 1 działanie edukacyjne (0 odbiorców), bez znaku EZD
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3.5" />
          <span className="sr-only">Autor / osoba prowadząca</span>
          <NativeSelect value={author} onChange={(e) => onAuthorChange(e.target.value)} aria-label="Autor publikacji" className="h-8 min-w-[200px]">
            <option value="">{DEFAULT_PUBLICATION_AUTHOR}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.fullName}>
                {s.fullName}
                {s.role ? ` (${s.role})` : ""}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button variant="outline" onClick={onSkipSelected} disabled={selectedCount === 0 || isSaving} title="Oznacz zaznaczone jako niepodlegające importowi">
          <EyeOff className="size-3.5" /> Pomiń zaznaczone
        </Button>
        <Button onClick={onImport} disabled={selectedCount === 0 || isSaving} className="bg-success text-success-foreground hover:bg-success/90">
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <PlusCircle className="size-3.5" />}
          Importuj {selectedCount} {plural(selectedCount)}
        </Button>
      </div>
    </div>
  );
}
