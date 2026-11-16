import type { DescriptionFact } from "./aiDescription";
import { formatDatePl } from "./dateUtils";

/** Wybrane w formularzu działania dane, które wchodzą do opisu. Imiona i nazwiska osób celowo pomijamy. */
export interface ActionDescriptionInput {
  actionType: string;
  title: string;
  program: string;
  campaign: string;
  date: string;
  facilityName: string;
  municipality: string;
  audience: string;
  participantsCount: number;
  materials: string[];
  numberOfActions: number;
}

export function buildActionFacts(input: ActionDescriptionInput): DescriptionFact[] {
  return [
    ["Forma działania", input.actionType],
    ["Tytuł", input.title],
    ["Program profilaktyczny lub klasyfikacja", input.program],
    ["Kampania lub akcja", input.campaign],
    ["Data realizacji", input.date ? formatDatePl(input.date) : ""],
    ["Miejsce", [input.facilityName, input.municipality].filter(Boolean).join(", ")],
    ["Odbiorcy", input.audience],
    ["Liczba uczestników", input.participantsCount > 0 ? String(input.participantsCount) : ""],
    ["Liczba zrealizowanych działań", input.numberOfActions > 1 ? String(input.numberOfActions) : ""],
    ["Materiały edukacyjne", input.materials.join("; ")],
  ];
}

/** Szablon to wzorzec: bez daty, miejsca, liczby osób i liczby sztuk materiałów. */
export interface TemplateDescriptionInput {
  actionType: string;
  title: string;
  name: string;
  program: string;
  campaign: string;
  audienceGroups: { name: string; items: { name: string }[] }[];
  materials: string[];
}

export function buildTemplateFacts(input: TemplateDescriptionInput): DescriptionFact[] {
  const audience = input.audienceGroups
    .flatMap((group) => group.items.map((item) => item.name.trim()))
    .filter(Boolean)
    .join(", ");
  return [
    ["Forma działania", input.actionType],
    ["Tytuł", input.title || input.name],
    ["Program profilaktyczny lub klasyfikacja", input.program],
    ["Kampania lub akcja", input.campaign],
    ["Odbiorcy", audience],
    ["Materiały edukacyjne", input.materials.join("; ")],
  ];
}
