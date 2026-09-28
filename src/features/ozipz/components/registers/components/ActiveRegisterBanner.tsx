import { ShieldCheck } from "lucide-react";
import type { OfficialRegisterKey } from "../../../types/ozipz.types";
import { OFFICIAL_REGISTERS_CONFIG } from "../../../utils/registerConfig";

interface ActiveRegisterBannerProps {
  activeTab: OfficialRegisterKey;
  filteredCount: number;
}

export function ActiveRegisterBanner({
  activeTab,
  filteredCount,
}: ActiveRegisterBannerProps) {
  const config = OFFICIAL_REGISTERS_CONFIG[activeTab];

  const countSuffix =
    activeTab === "informacje"
      ? "pozycji"
      : activeTab === "publikacje"
      ? "publikacji"
      : "wizytacji";

  const description =
    activeTab === "informacje"
      ? "Rejestr Informacji dotyczących realizacji zadania oświaty zdrowotnej i promocji zdrowia."
      : activeTab === "publikacje"
      ? "Monitoring publikacji, komunikatów prasowych, artykułów na portalu gov.pl i w mediach społecznościowych."
      : "Ewidencja wizytacji placówek, narad koordynacyjnych i kontroli terenowych.";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1 border-b border-border/40 pb-2">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground tracking-tight">
            {config.title}
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[2px] bg-primary/10 text-primary border border-primary/20 font-mono">
            {filteredCount} {countSuffix}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {activeTab === "informacje" && (
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-mono bg-muted/60 px-2 py-1 rounded-[2px] border border-border/60 self-start sm:self-center">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Zał. nr 3 do pisma PZ.110.1.2024</span>
        </div>
      )}
    </div>
  );
}
