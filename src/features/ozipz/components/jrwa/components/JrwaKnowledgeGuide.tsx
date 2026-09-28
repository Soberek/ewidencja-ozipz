import { JRWA_CLASSES_DEFINITIONS } from "../../../constants";

export function JrwaKnowledgeGuide() {
  return (
    <div className="p-3.5 rounded-[3px] border border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-blue-900 dark:text-blue-300">
          Oficjalna Klasyfikacja Rzeczowa OZiPZ (Instrukcja Kancelaryjna)
        </h4>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Każda teczka sprawy lub dokument wychodzący w sekcji OZiPZ musi posiadać symbol klasyfikacyjny zgodny z poniższym wykazem akt:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        {JRWA_CLASSES_DEFINITIONS.map((def) => (
          <div
            key={def.code}
            className="p-2.5 bg-background rounded-[2px] border border-blue-100 shadow-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-800 dark:text-blue-400">
                {def.code}
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded-[2px] font-mono dark:bg-blue-900/60 dark:text-blue-300">
                Kat. {def.category}
              </span>
            </div>
            <p className="font-semibold text-foreground text-xs">
              {def.title}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-3">
              {def.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
