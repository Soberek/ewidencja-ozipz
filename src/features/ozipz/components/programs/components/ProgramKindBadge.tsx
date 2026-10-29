import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ProgramKind = "PROGRAMOWE" | "NIEPROGRAMOWE";

const KIND_BADGE: Record<ProgramKind, string> = {
  PROGRAMOWE:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  NIEPROGRAMOWE:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
};

interface ProgramKindBadgeProps {
  kind: ProgramKind;
  className?: string;
}

/** Rodzaj interwencji (PROGRAMOWE / NIEPROGRAMOWE) – te same kolory w słownikach, programach i rejestrze działań. */
export function ProgramKindBadge({ kind, className }: ProgramKindBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] px-1.5 py-0.5 font-semibold", KIND_BADGE[kind], className)}>
      {kind}
    </Badge>
  );
}
