import { useMemo } from "react";
import { toast } from "sonner";
import { ClipboardCopy, ClipboardList, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ActionBreakdown } from "../../../utils/actionBreakdown";
import { buildCampaignFormReport, formatCampaignFormText } from "../../../utils/campaignFormReport";

interface CampaignFormCardProps {
  breakdown: ActionBreakdown;
  heading: string;
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Nie udało się skopiować do schowka");
  }
}

/** Rozpiska w układzie formularza sprawozdania z kampanii — tylko pozycje, dla których są działania. */
export function CampaignFormCard({ breakdown, heading }: CampaignFormCardProps) {
  const sections = useMemo(() => buildCampaignFormReport(breakdown), [breakdown]);
  if (!sections.length) return null;

  return (
    <Card className="rounded-[3px] border border-border bg-card shadow-none">
      <CardContent className="space-y-3 p-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Formularz sprawozdania kampanii</h3>
              <p className="text-[11px] text-muted-foreground">
                Tylko wypełnione pozycje — numeracja jak w formularzu. Pozostałe wpisz jako 0.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => copy(formatCampaignFormText(sections, heading), "Skopiowano formularz")}>
            <ClipboardCopy className="size-3.5" />
            Kopiuj formularz
          </Button>
        </div>

        <div className="divide-y divide-border/60 rounded-[3px] border border-border">
          {sections.map((section) => (
            <div key={section.category}>
              <div className="flex flex-wrap items-baseline gap-x-2 bg-muted/40 px-3 py-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{section.title}</span>
                <span className="text-[11px] text-muted-foreground">z ewidencji: {section.sources.join(", ")}</span>
              </div>
              {section.items.map((item) => (
                <div key={item.no} className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-2 px-3 py-2 hover:bg-muted/30">
                  <span className="font-mono text-sm font-bold text-primary">{item.no}.</span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">{item.label}</div>
                    <div className="select-text break-words text-sm font-semibold text-foreground">{item.value}</div>
                    {item.hint && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{item.hint}</div>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-60 group-hover:opacity-100"
                    onClick={() => copy(item.value, `Skopiowano pozycję ${item.no}`)}
                    aria-label={`Kopiuj pozycję ${item.no}`}
                    title="Kopiuj wartość"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
