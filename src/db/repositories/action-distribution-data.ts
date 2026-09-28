import type { OzipzAction, OzipzDistribution } from "../../features/ozipz/types/ozipz.types";

export type ActionDistributionItem = { materialId: string; title: string; type?: string; quantity: number };

/**
 * Pozycja rozdzielnika dla materiału wydanego podczas działania `source`.
 * `owner` to wpis, do którego pozycja należy: samo działanie albo zapisana razem z nim dystrybucja.
 */
export function actionDistributionData(
  item: ActionDistributionItem,
  source: Pick<OzipzAction, "title" | "date" | "facilityId" | "facilityName" | "municipality" | "leadEducator">,
  owner: Pick<OzipzAction, "id" | "title">
): Omit<OzipzDistribution, "id" | "createdAt"> {
  return {
    materialId: item.materialId || undefined,
    materialTitle: item.title || "Materiał oświatowy",
    materialType: item.type || undefined,
    facilityId: source.facilityId,
    recipientName: source.facilityName,
    municipality: source.municipality,
    actionId: owner.id,
    actionTitle: owner.title,
    quantity: item.quantity,
    distributionDate: source.date,
    assignedEducator: source.leadEducator,
    purpose: `Przekazanie podczas działania: ${source.title}`,
  };
}
