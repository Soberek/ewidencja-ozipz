import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
}

/**
 * Natywny `<select>` w stylu pól formularza (h-8) — do prostych filtrów,
 * gdzie nie potrzeba wyszukiwania ani opisów opcji z `Select`.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, containerClassName, children, ...props }, ref) => (
    <div className={cn("relative inline-flex", containerClassName)}>
      <select
        ref={ref}
        className={cn(
          "h-8 w-full appearance-none rounded-[3px] border border-input bg-background pl-2.5 pr-7 text-xs text-foreground transition-colors cursor-pointer hover:border-muted-foreground/40 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
);
NativeSelect.displayName = "NativeSelect";
