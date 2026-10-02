import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Wspólna pusta lista – stała referencja, więc nie unieważnia memoizacji przy każdym renderze. */
export const EMPTY_LIST: never[] = [];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
