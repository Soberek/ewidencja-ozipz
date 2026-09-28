import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActions, usePublications } from "../../../store/useOzipzDbStore";
import { planRegistryReconcile } from "../matching/registryReconcile";

/**
 * Publikacje zarejestrowane dawniej wyłącznie jako działania "Publikacja media (…)" nie trafiały do ewidencji publikacji.
 * Baner proponuje jednorazowe uzgodnienie: powiązanie istniejących wpisów i dopisanie brakujących.
 */
export function RegistryReconcileBanner() {
  const { publications, addPublication, updatePublication } = usePublications();
  const { actions } = useActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const plan = useMemo(() => planRegistryReconcile(publications, actions), [publications, actions]);
  const total = plan.attach.length + plan.create.length;
  if (total === 0) return null;

  const run = async () => {
    setIsRunning(true);
    let done = 0;
    try {
      for (const { publication, action } of plan.attach) {
        await updatePublication(publication.id, { actionId: action.id });
        done += 1;
      }
      for (const { publication } of plan.create) {
        await addPublication(publication);
        done += 1;
      }
      toast.success(`Uzgodniono ewidencję: ${plan.attach.length} powiązań, ${plan.create.length} nowych wpisów`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Przerwano po ${done} z ${total} operacji: ${msg}`);
    } finally {
      setIsRunning(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-[3px] border border-info/25 bg-info/5 px-3 py-2 text-xs">
        <DatabaseZap className="size-4 shrink-0 text-info" />
        <p className="min-w-0 flex-1 text-foreground">
          <strong>{plan.create.length}</strong> publikacji jest zapisanych tylko jako działania „Publikacja media”, bez wpisu w tej ewidencji
          {plan.attach.length > 0 && (
            <>
              , a <strong>{plan.attach.length}</strong> wpisów ewidencji nie jest powiązanych ze swoim działaniem
            </>
          )}
          .
        </p>
        <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
          Uzgodnij ewidencję
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => !isRunning && setIsOpen(false)}
        onConfirm={run}
        isLoading={isRunning}
        variant="default"
        title="Uzgodnić ewidencję publikacji z rejestrem działań?"
        confirmText={`Uzgodnij (${total})`}
        description={
          <div className="space-y-2 text-left">
            <ul className="list-disc space-y-1 pl-4">
              {plan.attach.length > 0 && (
                <li>
                  Powiązanie <strong>{plan.attach.length}</strong> istniejących publikacji z odpowiadającymi im działaniami (ten sam link lub tytuł i data).
                </li>
              )}
              {plan.create.length > 0 && (
                <li>
                  Dodanie <strong>{plan.create.length}</strong> wpisów ewidencji dla działań „Publikacja media”, które jej nie mają (data, tytuł, kanał i autor z działania).
                </li>
              )}
            </ul>
            <p className="text-muted-foreground">
              Działania nie są zmieniane ani duplikowane. Linki dla starszych wpisów uzupełnisz przy imporcie z gov.pl / X przyciskiem „To ta sama – powiąż”.
            </p>
          </div>
        }
      />
    </>
  );
}
