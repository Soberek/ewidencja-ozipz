import type { OzipzDistribution } from "../../features/ozipz/types/ozipz.types";

type MaterialInput = { materialId: string; title: string; quantity: number };

export function matchActionDistributions(existing: OzipzDistribution[], desired: MaterialInput[]) {
  const remaining = [...existing];
  const matches: Array<OzipzDistribution | undefined> = Array(desired.length).fill(undefined);
  const sameMaterial = (old: OzipzDistribution, next: MaterialInput) => old.materialId
    ? old.materialId === next.materialId
    : !next.materialId && old.materialTitle === (next.title || "Materiał oświatowy");

  // ponytail: two small scans preserve duplicate rows; use keyed queues if forms reach hundreds of materials.
  // Exact quantities first keep the right record when the same material appears twice.
  for (const exactQuantity of [true, false]) {
    desired.forEach((item, index) => {
      if (matches[index]) return;
      const matchIndex = remaining.findIndex((old) => sameMaterial(old, item) && (!exactQuantity || old.quantity === item.quantity));
      if (matchIndex !== -1) matches[index] = remaining.splice(matchIndex, 1)[0];
    });
  }
  return { matches, removed: remaining };
}
