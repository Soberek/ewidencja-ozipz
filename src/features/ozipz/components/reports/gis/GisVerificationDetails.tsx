import { ChevronRight } from "lucide-react";

interface GisVerificationDetailsProps {
  label: string;
  items: readonly string[];
}

export function GisVerificationDetails({ label, items }: GisVerificationDetailsProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-dashed border-border bg-muted/20 px-4 pb-3 pt-1">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronRight className="size-3.5 transition-transform duration-200 group-open:rotate-90" />
          <span>{label}</span>
          <span className="rounded-full bg-muted px-1.5 font-mono text-[10px] text-foreground">{items.length}</span>
        </summary>
        <ul className="mt-2 list-disc columns-1 gap-4 space-y-1 rounded-[2px] border border-border bg-card py-2 pl-5 pr-2 text-xs text-muted-foreground sm:columns-2">
          {items.map((item) => (
            <li key={item} className="break-inside-avoid py-0.5 leading-snug">
              {item}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
