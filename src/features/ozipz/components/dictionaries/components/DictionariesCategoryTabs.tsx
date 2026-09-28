import type { ComponentType } from "react";
import { BookOpen, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DICTIONARY_CATEGORIES_CONFIG, type DictionaryCategoryDef } from "../../../constants";
import { DICTIONARY_CATEGORY_GROUPS, getCategoryIcon } from "../dictionaryCategoryMeta";

export interface DictionariesCategoryTabsProps {
  categories?: readonly DictionaryCategoryDef[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  /** Kategorie spoza konfiguracji (słowniki własne). */
  customCategories?: string[];
}

interface NavButtonProps {
  catKey: string;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: (key: string) => void;
  icon?: ComponentType<{ className?: string }>;
}

function NavButton({ catKey, label, count, isActive, onSelect, icon }: NavButtonProps) {
  const Icon = icon ?? getCategoryIcon(catKey);
  return (
    <button
      type="button"
      onClick={() => onSelect(catKey)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-[3px] px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary/10 font-semibold text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1 font-medium leading-tight">{label}</span>
      <span
        className={cn(
          "min-w-[1.75rem] rounded-[2px] px-1 py-px text-center font-mono text-[10px] tabular-nums",
          isActive
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function DictionariesCategoryTabs({
  categories = Object.values(DICTIONARY_CATEGORIES_CONFIG),
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  customCategories = [],
}: DictionariesCategoryTabsProps) {
  const available = new Map(categories.map((c) => [c.key, c]));
  const grouped = new Set(DICTIONARY_CATEGORY_GROUPS.flatMap((g) => g.keys));
  const ungrouped = categories.filter((c) => !grouped.has(c.key));

  const groups = [
    ...DICTIONARY_CATEGORY_GROUPS.map((g) => ({
      ...g,
      items: g.keys.flatMap((k) => {
        const def = available.get(k);
        return def ? [{ key: def.key, label: def.label }] : [];
      }),
    })),
    {
      id: "other",
      label: "Słowniki własne",
      keys: [],
      items: [
        ...ungrouped.map((c) => ({ key: c.key, label: c.label })),
        ...customCategories.map((k) => ({ key: k, label: k })),
      ],
    },
  ].filter((g) => g.items.length > 0);

  return (
    <nav aria-label="Kategorie słowników" className="space-y-3 select-none">
      <NavButton
        catKey="all"
        label="Wszystkie kategorie"
        count={categoryCounts.all || 0}
        isActive={selectedCategory === "all"}
        onSelect={onSelectCategory}
        icon={BookOpen}
      />

      {groups.map((group) => (
        <div key={group.id} className="space-y-0.5">
          <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavButton
              key={item.key}
              catKey={item.key}
              label={item.label}
              count={categoryCounts[item.key] || 0}
              isActive={selectedCategory === item.key}
              onSelect={onSelectCategory}
              icon={group.id === "other" && !available.has(item.key) ? FolderPlus : undefined}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
