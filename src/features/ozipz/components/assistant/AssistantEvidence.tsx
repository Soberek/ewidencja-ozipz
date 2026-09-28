import { Card } from "@/components/ui/card";
import type { AssistantDraft } from "../../types/assistant.types";
export function AssistantEvidence({ draft }: { draft: AssistantDraft }) {
  const problems = [
    ...draft.missing,
    ...draft.conflicts,
    ...(draft.review?.issues ?? []),
  ];
  return (
    <Card className="p-4 space-y-4 min-w-0">
      <h2 className="font-semibold">Źródła i braki</h2>
      <p
        className={`text-sm ${draft.review?.passed ? "text-emerald-700" : "text-amber-700"}`}
      >
        {draft.review
          ? draft.review.passed
            ? "Kontrola zakończona. Przeczytaj pismo przed użyciem."
            : "Projekt wymaga poprawek."
          : "Treść wymaga ponownego sprawdzenia."}
      </p>
      {problems.length > 0 && (
        <div role="status" className="bg-amber-500/10 p-3 rounded">
          <p className="text-sm font-medium">
            Odpowiedz w rozmowie i przygotuj projekt ponownie:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
            {[...new Set(problems)].map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}
      {draft.warnings.map((warning) => (
        <p className="text-xs text-amber-700" key={warning}>
          {warning}
        </p>
      ))}
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Fakty wykorzystane w piśmie ({draft.facts.length})
        </summary>
        <ul className="mt-2 space-y-3 text-sm">
          {draft.facts.map((fact, i) => (
            <li key={i}>
              <p>{fact.text}</p>
              <blockquote className="border-l-2 pl-2 text-xs text-muted-foreground mt-1">
                {fact.quote}
              </blockquote>
              <a
                href={`#source-${fact.sourceId}`}
                className="text-xs underline"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(
                    `source-${fact.sourceId}`,
                  );
                  if (element instanceof HTMLDetailsElement)
                    element.open = true;
                  element?.scrollIntoView({ block: "nearest" });
                }}
              >
                Pokaż źródło
              </a>
            </li>
          ))}
        </ul>
      </details>
      <div className="max-h-[650px] overflow-auto space-y-2">
        {draft.sources.map((source) => (
          <details
            id={`source-${source.id}`}
            key={source.id}
            className="border rounded p-2"
          >
            <summary className="cursor-pointer text-sm break-words">
              {source.path.split(/[\\/]/).pop() || source.path}
              <span className="block text-xs text-muted-foreground">
                {source.location}
              </span>
            </summary>
            <p className="text-xs break-all mt-2 text-muted-foreground">
              {source.path}
            </p>
            {source.fetchedAt && (
              <>
                <a
                  className="text-xs underline"
                  href={source.path}
                  target="_blank"
                  rel="noreferrer"
                >
                  Otwórz stronę
                </a>
                <p className="text-xs text-muted-foreground">
                  Pobrano: {new Date(source.fetchedAt).toLocaleString("pl-PL")}
                </p>
              </>
            )}
            <blockquote className="whitespace-pre-wrap text-sm mt-2">
              {source.text}
            </blockquote>
          </details>
        ))}
      </div>
    </Card>
  );
}
