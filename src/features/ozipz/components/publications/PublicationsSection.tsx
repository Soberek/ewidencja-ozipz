import { useState } from "react";
import { Globe, FileText, Landmark, Twitter } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { OzipzPublication } from "../../types/ozipz.types";
import { useActions, usePublications } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { toast } from "sonner";
import { PublicationsListTab } from "./PublicationsListTab";
import { GovImportTab } from "./GovImportTab";
import { XImportTab } from "./XImportTab";

export type PublicationTabMode = "list" | "import-gov" | "import-x";

interface PublicationsSectionProps {
  publications?: OzipzPublication[];
  onOpenAdd?: () => void;
  onOpenEdit?: (pub: OzipzPublication) => void;
  onDelete?: (id: string) => void | Promise<void>;
}

export function PublicationsSection(props: PublicationsSectionProps) {
  const publicationsStore = usePublications();
  const { actions } = useActions();
  const openModal = useModalStore((s) => s.openModal);

  const [activeTab, setActiveTab] = useState<PublicationTabMode>("list");
  // Zakładki importu pozostają zamontowane po pierwszym otwarciu, by nie tracić pobranej listy i zaznaczeń.
  const [visited, setVisited] = useState<Set<PublicationTabMode>>(() => new Set(["list"]));

  const publications = props.publications ?? publicationsStore.publications;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("publication"));
  const onOpenEdit = props.onOpenEdit ?? ((pub: OzipzPublication) => openModal("publication", { item: pub }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      await publicationsStore.deletePublication(id);
      toast.success("Usunięto publikację z ewidencji");
    });
  const onOpenAction = (pub: OzipzPublication) => {
    const action = actions.find((a) => a.id === pub.actionId);
    if (action) openModal("action", { item: action });
    else toast.error("Nie znaleziono powiązanego działania");
  };

  const switchTab = (tab: PublicationTabMode) => {
    setActiveTab(tab);
    setVisited((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Globe className="size-5 text-primary" />
            <span>Publikacje i media</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Ewidencja artykułów i postów edukacyjnych oraz import z portalu gov.pl i profilu X – z automatycznym sprawdzaniem, czy publikacja jest już w systemie.
          </p>
        </div>

        <SegmentedControl
          aria-label="Widok modułu publikacji"
          value={activeTab}
          onChange={switchTab}
          options={[
            { value: "list", label: "Ewidencja", icon: FileText, count: publications.length },
            { value: "import-gov", label: "Import z gov.pl", icon: Landmark, title: "Pobierz artykuły ze strony PSSE Myślibórz (gov.pl)" },
            { value: "import-x", label: "Import z X", icon: Twitter, title: "Pobierz wpisy z profilu X (@PSSEMysliborz)" },
          ]}
          className="h-auto flex-wrap"
        />
      </div>

      {activeTab === "list" && (
        <PublicationsListTab
          publications={publications}
          onOpenAdd={onOpenAdd}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
          onOpenAction={onOpenAction}
        />
      )}
      {visited.has("import-gov") && (
        <div hidden={activeTab !== "import-gov"}>
          <GovImportTab />
        </div>
      )}
      {visited.has("import-x") && (
        <div hidden={activeTab !== "import-x"}>
          <XImportTab />
        </div>
      )}
    </div>
  );
}

export default PublicationsSection;
