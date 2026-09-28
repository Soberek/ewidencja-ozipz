import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import type { getActionEzdState } from "../actionEzdStatus";
import { ACTION_TYPE_CODE_TO_LABEL } from "../editor/editorUtils";

export const ACTION_TYPE_COLOR_CONFIG: Record<string, string> = {
  // 1. Prelekcja (warsztat) - niebieski
  prelekcja:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800",
  // 2. Dystrybucja - bursztynowy / złoty
  dystrybucja:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800",
  // 3. Sprawozdanie - indygo
  sprawozdanie:
    "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-800",
  // 4. Szkolenie - szmaragdowy / zielony
  szkolenie:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800",
  // 5. Narada - fioletowy / ametystowy
  narada:
    "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800",
  // 6. Konkurs (quiz) - różowy
  konkurs:
    "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-800",
  // 7. Stoisko - morski / teal
  stoisko:
    "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800",
  // 8. Wykład - purpurowy
  wyklad:
    "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800",
  // 9. Konferencja - cyjan
  konferencja:
    "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-200 dark:border-cyan-800",
  // 10. Happening - pomarańczowy
  happening:
    "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-800",
  // 11. Rozmowa indywidualna - koralowy / rose
  rozmowa_indywidualna:
    "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800",
  // 12. Wywiad media - limonkowy
  wywiad_media:
    "bg-lime-100 text-lime-950 border-lime-300 dark:bg-lime-950/70 dark:text-lime-200 dark:border-lime-800",
  // 13. Pismo - błękitny / sky
  pismo:
    "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-800",
  // 14. Wizytacja - fuksja
  wizytacja:
    "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/70 dark:text-fuchsia-200 dark:border-fuchsia-800",
  // 15. Kontrola - czerwony
  kontrola:
    "bg-red-100 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800",
  // 16. Publikacja Portal X - łupkowy / grafitowy
  publikacja_x:
    "bg-muted text-foreground border-border",
  // 17. Publikacja Facebook - intensywny błękit
  publikacja_fb:
    "bg-blue-200 text-blue-950 border-blue-400 dark:bg-blue-900/80 dark:text-blue-100 dark:border-blue-600",
  // 18. Publikacja Strona - szmaragd
  publikacja_strona:
    "bg-emerald-200 text-emerald-950 border-emerald-400 dark:bg-emerald-900/80 dark:text-emerald-100 dark:border-emerald-600",
};

const FALLBACK_PALETTE = [
  "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800",
  "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800",
  "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800",
  "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800",
  "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800",
  "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800",
  "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-800",
  "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-800",
  "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-200 dark:border-cyan-800",
  "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-800",
  "bg-lime-100 text-lime-950 border-lime-300 dark:bg-lime-950/70 dark:text-lime-200 dark:border-lime-800",
  "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800",
];

export function getActionTypeBadgeClass(actionType?: string | null): string {
  if (!actionType) {
    return "bg-muted text-muted-foreground border-border/60";
  }
  const clean = actionType.trim().toLowerCase();
  if (ACTION_TYPE_COLOR_CONFIG[clean]) {
    return ACTION_TYPE_COLOR_CONFIG[clean];
  }
  for (const [code, label] of Object.entries(ACTION_TYPE_CODE_TO_LABEL)) {
    if (clean === label.toLowerCase() || clean.includes(code) || label.toLowerCase().includes(clean)) {
      if (ACTION_TYPE_COLOR_CONFIG[code]) {
        return ACTION_TYPE_COLOR_CONFIG[code];
      }
    }
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

export function formatEducatorName(name: string, isCompact: boolean): string {
  if (!isCompact || !name) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
  }
  return name;
}

export function EzdBadge({ state }: { state: ReturnType<typeof getActionEzdState> }) {
  if (state === "publication") {
    return (
      <Badge
        variant="outline"
        className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-semibold flex items-center gap-1 w-fit py-0 px-1.5 h-4.5 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
      >
        Publikacja media
      </Badge>
    );
  }
  if (state === "not_applicable") {
    return (
      <Badge
        variant="outline"
        className="bg-muted/40 text-muted-foreground border-border text-[10px] font-semibold w-fit py-0 px-1.5 h-4.5"
      >
        nie dotyczy
      </Badge>
    );
  }
  if (state === "registered") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 w-fit py-0 px-1.5 h-4.5 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
      >
        <CheckCircle2 className="size-2.5 text-emerald-600" />
        w EZD
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold flex items-center gap-1 w-fit py-0 px-1.5 h-4.5 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
    >
      <Clock className="size-2.5 text-amber-600" />
      do EZD
    </Badge>
  );
}

export const ACTION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  w_toku: {
    label: "W toku",
    className: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  },
  planowane: {
    label: "Planowane",
    className: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  odroczone: {
    label: "Odroczone",
    className: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  odwolane: {
    label: "Odwołane",
    className: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
  cancelled: {
    label: "Odwołane",
    className: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
};

// Nasycone kolory z białym tekstem do zwartego rejestru działań.
export function getActionTypeSolidColor(actionType?: string | null): string {
  const colors = ["#1d4ed8", "#92400e", "#4338ca", "#047857", "#6d28d9", "#be185d", "#0f766e", "#7e22ce", "#0e7490", "#c2410c", "#be123c", "#3f6212", "#0369a1", "#a21caf", "#b91c1c", "#334155", "#1e40af", "#065f46"];
  const entries = Object.entries(ACTION_TYPE_CODE_TO_LABEL);
  const clean = (actionType || "").trim().toLowerCase();
  const code = entries.find(([code, label]) => code === clean || label.toLowerCase() === clean)?.[0];
  const index = Object.keys(ACTION_TYPE_COLOR_CONFIG).indexOf(code || clean);
  if (index >= 0) return colors[index % colors.length];
  let hash = 0;
  for (const char of clean) hash = ((hash * 31) + char.charCodeAt(0)) | 0;
  return colors[Math.abs(hash) % colors.length];
}
