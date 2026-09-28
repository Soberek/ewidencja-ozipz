import type { OzipzTemplate } from "../types/ozipz.types";

export const isEmptyImportedTemplate = (template: OzipzTemplate) =>
  template.title === "Szablon zadania" &&
  template.topic === "inne" &&
  template.actionType === "prelekcja" &&
  template.defaultAudience === "uczniowie_sp" &&
  !template.descriptionTemplate?.trim() &&
  !template.suggestedMaterials?.trim() &&
  !template.actionDefaults;
