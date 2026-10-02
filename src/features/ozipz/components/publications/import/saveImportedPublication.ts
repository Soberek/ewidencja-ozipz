import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";

type NewAction = Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;
type NewPublication = Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">;

interface SaveImportedPublicationParams {
  action: NewAction;
  publication: NewPublication;
  addAction: (action: NewAction) => Promise<OzipzAction>;
  deleteAction: (id: string) => Promise<void>;
  addPublication: (publication: NewPublication) => Promise<OzipzPublication>;
}

export async function saveImportedPublication({
  action,
  publication,
  addAction,
  deleteAction,
  addPublication,
}: SaveImportedPublicationParams): Promise<void> {
  const createdAction = await addAction(action);
  try {
    await addPublication({ ...publication, actionId: createdAction.id });
  } catch (error) {
    // Dwa zapisy w magazynie nie są atomowe – przy błędzie cofamy utworzone działanie ręcznie.
    try {
      await deleteAction(createdAction.id);
    } catch (rollbackError) {
      const detail = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      throw new Error(`Nie zapisano publikacji. Nie udało się też cofnąć działania ${createdAction.id}: ${detail}`, { cause: rollbackError });
    }
    throw error;
  }
}
