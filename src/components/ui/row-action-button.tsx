import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const TONE_CLASSES = {
  default: "text-muted-foreground hover:text-foreground hover:bg-muted",
  primary: "text-primary/80 hover:text-primary hover:bg-primary/10",
  destructive: "text-destructive/80 hover:text-destructive hover:bg-destructive/10",
} as const;

export interface RowActionButtonProps {
  /** Nazwa dostępna przycisku (aria-label). */
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  tone?: keyof typeof TONE_CLASSES;
  /** Treść podpowiedzi, gdy ma się różnić od etykiety. */
  tooltip?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Ikonowy przycisk akcji w wierszu tabeli / karcie (edytuj, usuń, kopiuj…).
 * Zatrzymuje propagację kliknięcia, aby nie wywołać akcji kliknięcia wiersza.
 */
export function RowActionButton({
  label,
  icon: Icon,
  onClick,
  tone = "default",
  tooltip,
  disabled,
  className,
}: RowActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick(event);
          }}
          className={cn("size-7", TONE_CLASSES[tone], className)}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}
