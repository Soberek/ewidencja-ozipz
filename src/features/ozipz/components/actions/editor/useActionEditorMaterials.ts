import { useState, useEffect, useMemo } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { OzipzMaterial } from "../../../types/ozipz.types";
import type { ActionDistributedMaterialItem, ActionFormInput } from "./editor.types";

export interface UseActionEditorMaterialsParams {
  materials: OzipzMaterial[];
  materialId?: string;
  setValue: UseFormSetValue<ActionFormInput>;
  watch: UseFormWatch<ActionFormInput>;
}

export function useActionEditorMaterials({
  materials,
  materialId,
  setValue,
  watch,
}: UseActionEditorMaterialsParams) {
  const [materialItems, setMaterialItems] = useState<ActionDistributedMaterialItem[]>([]);

  const handleAddMaterialItem = (matId?: string, qty?: number) => {
    const defaultQty =
      qty !== undefined
        ? qty
        : materialItems.length === 0 && (watch("materialsDistributedCount") || 0) > 0
        ? watch("materialsDistributedCount")!
        : 1;

    setMaterialItems((prev) => [
      ...prev,
      { materialId: matId || "", quantity: defaultQty },
    ]);
  };

  const handleRemoveMaterialItem = (index: number) => {
    if (materialItems.length === 1) {
      setValue("materialId", "");
      setValue("materialsDistributedCount", 0);
    }
    setMaterialItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMaterialItem = (
    index: number,
    updates: Partial<ActionDistributedMaterialItem>
  ) => {
    setMaterialItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  useEffect(() => {
    if (materialItems.length > 0) {
      const sum = materialItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      if (watch("materialsDistributedCount") !== sum) {
        setValue("materialsDistributedCount", sum);
      }
      const firstWithId = materialItems.find((m) => m.materialId);
      const targetMatId = firstWithId ? firstWithId.materialId : "";
      if (watch("materialId") !== targetMatId) {
        setValue("materialId", targetMatId);
      }
    }
  }, [materialItems, setValue, watch]);

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === materialId);
  }, [materials, materialId]);

  return {
    materialItems,
    setMaterialItems,
    handleAddMaterialItem,
    handleRemoveMaterialItem,
    handleUpdateMaterialItem,
    selectedMaterial,
  };
}
