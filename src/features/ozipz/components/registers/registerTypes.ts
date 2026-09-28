import { RegisterSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";

export const REGISTER_TYPE_OPTIONS = [
  { value: "szkolenia", label: "Szkolenia i Warsztaty", shortLabel: "Szkolenia" },
  { value: "narady", label: "Narady i Konferencje", shortLabel: "Narady" },
  { value: "interwencje", label: "Interwencje i Akcje Doraźne", shortLabel: "Interwencje" },
  { value: "konkursy", label: "Konkursy Powiatowe", shortLabel: "Konkursy" },
  { value: "wizytacje", label: "Wizytacje i Kontrole", shortLabel: "Wizytacje" },
  { value: "dystrybucja", label: "Dystrybucja Zbiorcza", shortLabel: "Dystrybucja" },
];

export const RegisterFormSchema = RegisterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RegisterFormInput = z.input<typeof RegisterFormSchema>;
export type RegisterFormOutput = z.output<typeof RegisterFormSchema>;
