import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface HierarchySection {
  kind: string;
  label: string;
  totalActions: number;
  totalVisits: number;
  totalPeople: number;
  groups: {
    programName: string;
    jrwa?: string;
    totalActions: number;
    totalVisits: number;
    totalPeople: number;
    actions: {
      actionName: string;
      actions: number;
      visits: number;
      people: number;
    }[];
  }[];
}

interface ReportHierarchyCardProps {
  reportHierarchy: HierarchySection[];
}

export function ReportHierarchyCard({ reportHierarchy }: ReportHierarchyCardProps) {
  return (
    <Card className="rounded-[3px] border border-border bg-card shadow-none">
      <CardContent className="space-y-2 p-3.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Hierarchia programów i działań
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Struktura zgodna z załącznikami: sekcja → program/interwencja → działanie.
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {reportHierarchy.map((section) => (
              <Badge
                key={section.kind}
                variant="outline"
                className={cn(
                  "rounded-[2px] text-[10px] font-bold",
                  section.kind === "programowe"
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-input text-foreground"
                )}
              >
                {section.label}: {section.totalActions + section.totalVisits}
              </Badge>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto overscroll-x-contain scrollbar-thin rounded-[3px] border border-border bg-card">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Program / Działanie
                </th>
                <th
                  scope="col"
                  className="w-24 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Działania
                </th>
                <th
                  scope="col"
                  className="w-24 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Wizytacje
                </th>
                <th
                  scope="col"
                  className="w-24 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Odbiorcy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reportHierarchy.flatMap((section) => [
                <tr key={`section-${section.kind}`} className="bg-muted/40 font-bold">
                  <td colSpan={4} className="px-3 py-2 text-xs text-foreground uppercase tracking-wider">
                    {section.label} ({section.totalActions + section.totalVisits} dz.,{" "}
                    {section.totalPeople.toLocaleString("pl-PL")} os.)
                  </td>
                </tr>,
                ...section.groups.flatMap((group) => [
                  <tr
                    key={`group-${section.kind}-${group.programName}`}
                    className="bg-primary/5 font-semibold"
                  >
                    <td className="px-4 py-1.5 text-xs text-foreground">
                      <span>{group.programName}</span>
                      {group.jrwa && /^\d{3,4}(\.\d+)?$/.test(group.jrwa) && (
                        <span className="ml-2 inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                          JRWA {group.jrwa}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-primary">
                      {group.totalActions}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
                      {group.totalVisits}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
                      {group.totalPeople.toLocaleString("pl-PL")}
                    </td>
                  </tr>,
                  ...group.actions.map((act, aIdx) => (
                    <tr key={`act-${section.kind}-${group.programName}-${aIdx}`} className="hover:bg-muted/50">
                      <td className="px-6 py-1.5 text-xs text-foreground">↳ {act.actionName}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
                        {act.actions}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
                        {act.visits}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
                        {act.people.toLocaleString("pl-PL")}
                      </td>
                    </tr>
                  )),
                ]),
              ])}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
