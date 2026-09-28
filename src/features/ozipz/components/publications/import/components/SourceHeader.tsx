import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SourceHeaderProps {
  icon: LucideIcon;
  title: string;
  href: string;
  description: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
}

export function SourceHeader({ icon: Icon, title, href, description, actions, children }: SourceHeaderProps) {
  return (
    <Card className="space-y-3 border-border/80 p-3 shadow-none">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[3px] bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <a href={href} target="_blank" rel="noreferrer" className="text-sm font-bold text-foreground hover:underline">
            {title}
          </a>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
      </div>
      {children}
    </Card>
  );
}
