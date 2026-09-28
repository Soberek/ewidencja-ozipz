import { Ban, CheckCircle2, CircleDashed, CircleHelp, EyeOff, Sparkles, type LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";
import type { ImportRowStatus } from "./importRows";

export interface ImportStatusMeta {
  label: string;
  /** Krótkie objaśnienie dla użytkownika (tooltip / legenda). */
  hint: string;
  icon: LucideIcon;
  badge: NonNullable<BadgeProps["variant"]>;
  chipTone: "primary" | "success" | "warning" | "info" | "destructive";
}

export const IMPORT_STATUS_META: Record<ImportRowStatus, ImportStatusMeta> = {
  new: {
    label: "Nowa",
    hint: "Nie znaleziono jej w ewidencji publikacji ani w działaniach – gotowa do importu.",
    icon: Sparkles,
    badge: "info-soft",
    chipTone: "info",
  },
  probable: {
    label: "Prawdopodobnie w systemie",
    hint: "W działaniach jest wpis o tym samym (lub prawie tym samym) tytule z tą samą datą, ale bez linku. Powiąż go, aby zapisać link i nie tworzyć duplikatu.",
    icon: CircleHelp,
    badge: "warning-soft",
    chipTone: "warning",
  },
  possible: {
    label: "Podobny wpis",
    hint: "Istnieje wpis o zbliżonym tytule lub z tego samego dnia. Sprawdź, czy to ta sama publikacja.",
    icon: CircleDashed,
    badge: "warning-soft",
    chipTone: "warning",
  },
  linked: {
    label: "W ewidencji",
    hint: "Ten sam link jest już zapisany w ewidencji publikacji – import zablokowany.",
    icon: CheckCircle2,
    badge: "success-soft",
    chipTone: "success",
  },
  external: {
    label: "Inna jednostka",
    hint: "Wpis na liście PSSE przekierowuje na stronę innej jednostki (np. GIS, WSSE) – to nie jest własna publikacja.",
    icon: Ban,
    badge: "muted",
    chipTone: "primary",
  },
  skipped: {
    label: "Pominięta",
    hint: "Ręcznie oznaczona jako niepodlegająca importowi (zapamiętane na tym komputerze).",
    icon: EyeOff,
    badge: "muted",
    chipTone: "primary",
  },
};
