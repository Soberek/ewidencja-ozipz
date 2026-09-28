import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { assistantClient } from "@/db/assistant/client";
import { useAssistantStore } from "../../store/useAssistantStore";
import type { AssistantDraft } from "../../types/assistant.types";
export function AssistantConversation({ draft }: { draft: AssistantDraft }) {
  const [question, setQuestion] = useState("");
  const { run, busy } = useAssistantStore();
  return (
    <Card className="p-4 space-y-3">
      <h2 className="font-semibold">Pytania o materiały programu</h2>
      <p className="text-sm text-muted-foreground">
        Odpowiedź pokaże znalezione informacje wraz z cytatami. Nie zmienia
        treści pisma.
      </p>
      {draft.discussion?.map((entry, i) => (
        <div key={i} className="border rounded p-3 space-y-2 text-sm">
          <p className="font-medium">Ty: {entry.question}</p>
          {entry.facts.map((fact, j) => (
            <div key={j}>
              <p>{fact.text}</p>
              <blockquote className="border-l-2 pl-2 text-muted-foreground text-xs">
                {fact.quote}
              </blockquote>
              <p className="text-xs break-all">
                {entry.sources.find((s) => s.id === fact.sourceId)?.path}
              </p>
            </div>
          ))}
          {[...entry.missing, ...entry.conflicts].map((text, j) => (
            <p key={j} className="text-amber-700">
              {text}
            </p>
          ))}
        </div>
      ))}
      <Textarea
        aria-label="Pytanie o materiały"
        rows={2}
        value={question}
        disabled={!!busy}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Np. jakie cele programu wskazują materiały?"
      />
      <Button
        variant="outline"
        disabled={!!busy || !question.trim()}
        onClick={() =>
          void run("Szukanie odpowiedzi w materiałach programu", async () => {
            const updated = await assistantClient.ask(draft, question);
            useAssistantStore.setState({
              draft: updated,
              snapshot: await assistantClient.load(),
            });
            setQuestion("");
          })
        }
      >
        Zapytaj o materiały
      </Button>
    </Card>
  );
}
