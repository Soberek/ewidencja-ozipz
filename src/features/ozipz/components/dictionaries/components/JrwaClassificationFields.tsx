import type { UseFormRegisterReturn } from "react-hook-form";
import { Bookmark, ClipboardList } from "lucide-react";
import { GisCategorySchema } from "../../../schemas/ozipzCoreSchemas";
import { GIS_CATEGORY_LABELS } from "../../../utils/gis/gisCategories";

interface JrwaClassificationFieldsProps {
  kindField: UseFormRegisterReturn;
  gisCategoryField: UseFormRegisterReturn;
  kindError?: string;
}

const selectClass =
  "w-full h-8 rounded-[2px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium";

export function JrwaClassificationFields({ kindField, gisCategoryField, kindError }: JrwaClassificationFieldsProps) {
  return (
    <div className="space-y-3 p-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/40 rounded-[3px]">
      {/* Rodzaj interwencji JRWA: PROGRAMOWE / NIEPROGRAMOWE (SSOT dla aplikacji) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-teal-950 dark:text-teal-200">
            <Bookmark className="size-3.5 text-teal-600" />
            <span>Klasyfikacja Interwencji JRWA <span className="text-destructive">*</span></span>
          </span>
          <span className="text-[10.5px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
            Miernik Budżetowy
          </span>
        </label>
        <select {...kindField} className={selectClass}>
          <option value="">-- Wybierz rodzaj interwencji (Programowe / Nieprogramowe) --</option>
          <option value="PROGRAMOWE">PROGRAMOWE (Program profilaktyczny / edukacyjny)</option>
          <option value="NIEPROGRAMOWE">NIEPROGRAMOWE (Akcja własna / interwencja doraźna / dzień zdrowia)</option>
        </select>
        {kindError && <p className="text-[10px] text-destructive font-semibold">{kindError}</p>}
        <p className="text-[10.5px] text-teal-800/90 dark:text-teal-300/80 leading-tight">
          Główne źródło prawdy (SSOT) dla całej aplikacji: decyduje czy działania z tym symbolem JRWA są zaliczane jako programowe czy nieprogramowe w mierniku budżetowym i raportach.
        </p>
      </div>

      {/* Obszar kwartalnego sprawozdania GIS */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-teal-950 dark:text-teal-200">
            <ClipboardList className="size-3.5 text-teal-600" />
            <span>Obszar Sprawozdania GIS</span>
          </span>
          <span className="text-[10.5px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
            Sprawozdanie kwartalne
          </span>
        </label>
        <select {...gisCategoryField} className={selectClass}>
          <option value="">-- Wybierz obszar sprawozdania GIS --</option>
          {GisCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {GIS_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        <p className="text-[10.5px] text-teal-800/90 dark:text-teal-300/80 leading-tight">
          Decyduje, w którym obszarze (Profilaktyka uzależnień, Szczepienia, Zapobieganie otyłości, STI, Inne) liczone są działania z tym symbolem w sprawozdaniu GIS (art. 6). Symbole spoza sprawozdania (np. 0442) oznacz jako „Nie wchodzi do sprawozdania GIS”.
        </p>
      </div>
    </div>
  );
}
