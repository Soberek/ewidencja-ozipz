import { save } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { assistantClient } from "@/db/assistant/client";
import { useAssistantStore } from "../../store/useAssistantStore";
import { useModalStore } from "../../store/useModalStore";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { canExportAssistantDraft } from "../../utils/assistantUtils";
import { createAssistantDocx } from "../../utils/assistantDocx";
import { getTodayIsoDate } from "../../utils/dateUtils";
import type { AssistantDraft } from "../../types/assistant.types";
export function AssistantDraftEditor({ draft }: { draft: AssistantDraft }) {
  const {
    edit,
    run,
    review,
    save: saveDraft,
    busy,
    snapshot,
  } = useAssistantStore();
  const exportDocx = () =>
    void run("Sprawdzanie źródeł i zapis Worda", async () => {
      const template = await assistantClient.template(draft.id);
      const bytes = createAssistantDocx(new Uint8Array(template), draft);
      const path = await save({
        defaultPath: `Pismo-${getTodayIsoDate()}.docx`,
        filters: [{ name: "Dokument Word", extensions: ["docx"] }],
      });
      if (path) {
        await assistantClient.writeDocx(draft.id, path, bytes);
        useAssistantStore.setState({ notice: `Zapisano pismo: ${path}` });
      }
    });
  const register = () => {
    const folder = snapshot?.config.programs.find(
      (p) => p.id === draft.programId,
    );
    const program = useOzipzDbStore
      .getState()
      .programs.find((p) => p.name === folder?.name);
    useModalStore.getState().openModal("letter", {
      initialValues: {
        direction: "wychodzace",
        subject: draft.subject,
        senderRecipient: draft.recipient,
        letterDate: draft.date,
        caseSign: draft.caseSign,
        programId: program?.id,
        notes: draft.body,
      },
    });
  };
  return (
    <Card className="p-4 min-w-0 space-y-3">
      <h2 className="font-semibold">Projekt pisma</h2>
      <fieldset disabled={!!busy} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <label className="text-sm">
            Data
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => edit({ date: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Znak sprawy
            <Input
              value={draft.caseSign}
              onChange={(e) => edit({ caseSign: e.target.value })}
            />
          </label>
        </div>
        <label className="block text-sm">
          Adresat
          <Textarea
            rows={2}
            value={draft.recipient}
            onChange={(e) => edit({ recipient: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Temat
          <Input
            value={draft.subject}
            onChange={(e) => edit({ subject: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Treść
          <Textarea
            rows={19}
            className="leading-relaxed"
            value={draft.body}
            onChange={(e) => edit({ body: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Podpis
          <Textarea
            rows={2}
            value={draft.signature}
            onChange={(e) => edit({ signature: e.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void saveDraft()}>
            Zapisz projekt
          </Button>
          <Button variant="outline" onClick={() => void review()}>
            Sprawdź treść
          </Button>
          <Button
            disabled={!canExportAssistantDraft(draft)}
            onClick={exportDocx}
          >
            Zapisz DOCX
          </Button>
          <Button variant="outline" onClick={register}>
            Zarejestruj pismo
          </Button>
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        Każda zmiana wymaga ponownej kontroli. Źródła pozostają w aplikacji.
        Rejestracja otwiera formularz dziennika korespondencji.
      </p>
    </Card>
  );
}
