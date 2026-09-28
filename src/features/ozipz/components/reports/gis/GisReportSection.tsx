import type { ElementType } from "react";
import { AlertCircle, BookOpen, Eye, FileText, GraduationCap, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GisReportData } from "../../../utils/gis";
import { GisReportListItem } from "./GisReportListItem";
import { GisVerificationDetails } from "./GisVerificationDetails";

interface GisReportSectionProps {
  reportData: GisReportData;
  categoryLabel: string;
  typeLabel: string;
}

const VISIT_MANUAL_HINT = "Brak w ewidencji — sprawdź w protokołach wizytacji / rejestrze kontroli";

function GroupHeader({ icon: Icon, title, note }: { icon: ElementType; title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border bg-muted/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground">
      <span className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        {title}
      </span>
      {note && (
        <span className="flex items-center gap-1 rounded-[2px] border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="size-3 shrink-0" />
          {note}
        </span>
      )}
    </div>
  );
}

export function GisReportSection({ reportData, categoryLabel, typeLabel }: GisReportSectionProps) {
  const groups = reportData.grupyOdbiorcow;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-primary" />
        <h3 className="text-sm font-bold leading-tight text-foreground">
          Sprawozdanie – art. 6 – {categoryLabel.toUpperCase()} – {typeLabel}
        </h3>
      </div>

      <Card className="overflow-hidden rounded-[3px] border border-border p-0 shadow-none">
        <CardContent className="p-0">
          <GisReportListItem
            label="1. Wybierz powiat jakiego dotyczy sprawozdanie"
            value={reportData.powiat}
            manualHint={reportData.powiat ? undefined : "Placówki nie mają uzupełnionego powiatu — wskaż powiat ręcznie"}
            manualBadgeText="Do uzupełnienia"
          />
          <GisReportListItem
            label={`2. Wymień interwencje programowe z obszaru '${categoryLabel}'`}
            value={reportData.interwencje.join(", ") || "Brak"}
          />
          <GisReportListItem
            label="3. Proszę zaznaczyć, które grupy odbiorców były odbiorcami"
            value={groups.join(", ") || "Brak"}
            display={
              groups.length > 0 ? (
                <span className="flex flex-wrap justify-end gap-1">
                  {groups.map((group) => (
                    <Badge key={group} variant="outline" className="rounded-[2px] border-primary/20 bg-primary/5 text-[11px] font-semibold text-primary">
                      {group}
                    </Badge>
                  ))}
                </span>
              ) : undefined
            }
          />
          <GisReportListItem label="4. Liczba odbiorców tych interwencji (w sumie)" value={reportData.liczbaOdbiorcow} />
          <GisReportListItem label="5. Liczba podmiotów realizujących te interwencje (w sumie)" value={reportData.liczbaPodmiotow} />
          <GisVerificationDetails label="Pokaż zidentyfikowane podmioty (weryfikacja)" items={reportData.zidentyfikowanePodmioty} />

          <GroupHeader icon={Eye} title="Wizytacje" note="Pkt 7–9: wymagają danych z protokołów wizytacji" />
          <GisReportListItem label="6. Liczba wizytacji przeprowadzonych przez PSSE" value={reportData.liczbaWizytacji} />
          <GisReportListItem label="7. Wnioski z wizytacji. Liczba ocen pozytywnych" manualHint={VISIT_MANUAL_HINT} />
          <GisReportListItem label="8. Wnioski z wizytacji. Liczba ocen pozytywnych z uwagami" manualHint={VISIT_MANUAL_HINT} />
          <GisReportListItem label="9. Wnioski z wizytacji. Liczba ocen negatywnych" manualHint={VISIT_MANUAL_HINT} />

          <GroupHeader icon={GraduationCap} title="Szkolenia, konkursy, prelekcje" />
          <GisReportListItem label="10. Liczba zorganizowanych szkoleń, konferencji, narad" value={reportData.liczbaSzkolen} />
          <GisReportListItem label="11. Liczba odbiorców tych szkoleń, konferencji, narad" value={reportData.liczbaOdbiorcowSzkolen} />
          <GisReportListItem label="12. Liczba zorganizowanych konkursów" value={reportData.liczbaKonkursow} />
          <GisReportListItem label="13. Liczba uczestników tych konkursów" value={reportData.liczbaUczestnikowKonkursow} />
          <GisReportListItem label="14. Liczba prelekcji, wykładów" value={reportData.liczbaPrelekcji} />
          <GisReportListItem label="15. Liczba odbiorców tych prelekcji, wykładów" value={reportData.liczbaOdbiorcowPrelekcji} />
          <GisReportListItem label="16. Liczba zorganizowanych lub współorganizowanych eventów" value={reportData.liczbaEventow} />

          <GroupHeader icon={Share2} title="Social media i strona WWW" />
          <GisReportListItem label="17. Liczba postów w mediach społecznościowych" value={reportData.liczbaPostowSocialMedia} />
          <GisReportListItem label="18. Liczba obserwatorów social media" value={reportData.liczbaObserwatorowSocialMedia} />
          <GisReportListItem label="19. Liczba publikacji na stronie internetowej" value={reportData.liczbaPublikacjiStrona} />

          <GroupHeader icon={BookOpen} title="Materiały edukacyjne" />
          <GisReportListItem
            label="20. Liczba miejsc - instytucji realizujących działania do których rozdystrybuowano materiały"
            value={reportData.liczbaMiejscDystrybucjiMateria}
          />
          <GisVerificationDetails
            label="Pokaż zidentyfikowane miejsca dystrybucji (weryfikacja)"
            items={reportData.zidentyfikowaneMiejscaDystrybucji}
          />
        </CardContent>
      </Card>
    </div>
  );
}
