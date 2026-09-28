import { localActionDate, isNoJrwaActionType } from "./editorUtils";
import { useState, useMemo } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type {
  OzipzProgram,
  OzipzAction,
  OzipzJrwaCase,
  OzipzDictionaryItem,
} from "../../../types/ozipz.types";
import {
  getProgramJrwaSymbol,
  generateNextJrwaSign,
  getAllJrwaSymbols,
  formatFullJrwaSign,
} from "../../../utils/programJrwaUtils";
import { extractCleanJrwaSymbol } from "../../../utils/ozipzCalculations";
import type { ActionFormInput } from "./editor.types";
import { JRWA_DEFAULT_SECTION } from "../../../constants";

export interface GeneratedJrwaMeta {
  section: string;
  jrwaSymbol: string;
  caseNumber: number;
  year: number;
  fullCaseSign: string;
  izrzSign?: string;
}

export interface UseActionEditorJrwaParams {
  programs: OzipzProgram[];
  actions: OzipzAction[];
  jrwaCases: OzipzJrwaCase[];
  dictionaryItems: OzipzDictionaryItem[];
  isNoJrwa: boolean;
  /** Edycja istniejącego działania: jego znak sprawy i numer IZRZ są już nadane i nie mogą zmieniać się automatycznie. */
  isEditMode?: boolean;
  setValue: UseFormSetValue<ActionFormInput>;
  watch: UseFormWatch<ActionFormInput>;
}

export function useActionEditorJrwa({
  programs,
  actions,
  jrwaCases,
  dictionaryItems,
  isNoJrwa,
  isEditMode = false,
  setValue,
  watch,
}: UseActionEditorJrwaParams) {
  const [selectedJrwaSymbol, setSelectedJrwaSymbol] = useState("");
  const [autoCreateJrwaCase, setAutoCreateJrwaCase] = useState(true);
  const [generatedJrwaMeta, setGeneratedJrwaMeta] = useState<GeneratedJrwaMeta | null>(null);

  const jrwaSymbolsList = useMemo(
    () => getAllJrwaSymbols(programs, dictionaryItems),
    [programs, dictionaryItems]
  );

  const formYear = () => Number(String(watch("date") || "").slice(0, 4)) || new Date().getFullYear();

  const applyGeneratedSign = (generated: GeneratedJrwaMeta) => {
    setValue("jrwaSign", generated.fullCaseSign);
    setValue("izrzSign", generated.izrzSign || "");
    // Nowy znak nie należy do wcześniej wskazanej sprawy — przy zapisie nowego działania sprawa zostanie założona.
    setValue("jrwaCaseId", "");
    setGeneratedJrwaMeta(generated);
    setAutoCreateJrwaCase(true);
  };

  const clearSign = () => {
    setValue("jrwaSign", "");
    setValue("izrzSign", "");
    setGeneratedJrwaMeta(null);
  };

  // Automatyczne nadawanie znaku tylko dla nowych działań; w edycji znak zmienia się wyłącznie ręcznie lub przyciskiem.
  const assignSignForSymbol = (symbol: string) => {
    if (isNoJrwa) clearSign();
    else if (!isEditMode) applyGeneratedSign(generateNextJrwaSign({ symbol, year: formYear(), actions, jrwaCases }));
  };

  const handleProgramOrJrwaSelect = (val: string) => {
    if (!val) {
      setValue("programId", "");
      setValue("programName", "");
      setSelectedJrwaSymbol("");
      if (!isEditMode) clearSign();
      return;
    }

    if (val.startsWith("prog:")) {
      const progId = val.slice(5);
      setValue("programId", progId);
      const prog = programs.find((p) => p.id === progId);
      if (prog) {
        setValue("programName", prog.name);
        const currentTitle = watch("title");
        if (!currentTitle || programs.some((p) => p.name === currentTitle)) {
          setValue("title", prog.name);
        }
        const autoSymbol = getProgramJrwaSymbol(prog, prog.name, watch("actionType"));
        setSelectedJrwaSymbol(autoSymbol);
        assignSignForSymbol(autoSymbol);
      }
    } else if (val.startsWith("jrwa:")) {
      const symbol = val.slice(5);
      setValue("programId", "");
      setValue("programName", "");
      setSelectedJrwaSymbol(symbol);
      assignSignForSymbol(symbol);
    } else {
      const prog = programs.find((p) => p.id === val);
      if (prog) {
        handleProgramOrJrwaSelect(`prog:${val}`);
      } else {
        handleProgramOrJrwaSelect(`jrwa:${val}`);
      }
    }
  };

  const handleProgramSelect = (progId: string) => {
    handleProgramOrJrwaSelect(progId ? `prog:${progId}` : "");
  };

  const handleJrwaSymbolChange = (newSymbol: string) => {
    handleProgramOrJrwaSelect(newSymbol ? `jrwa:${newSymbol}` : "");
  };

  const handleDateChange = (newDateStr: string) => {
    setValue("date", newDateStr, { shouldDirty: true, shouldValidate: true });
    if (isEditMode || isNoJrwa || !selectedJrwaSymbol || !newDateStr) return;
    // Nowy numer potrzebny tylko przy zmianie roku i tylko dla znaku nadanego automatycznie (nie wpisanego ręcznie).
    const year = Number(newDateStr.slice(0, 4));
    const currentSign = (watch("jrwaSign") || "").trim();
    const isAutoSign = !currentSign || currentSign === generatedJrwaMeta?.fullCaseSign;
    if (!isAutoSign || generatedJrwaMeta?.year === year) return;
    applyGeneratedSign(generateNextJrwaSign({ symbol: selectedJrwaSymbol, year, actions, jrwaCases }));
  };

  const setQuickDate = (type: "today" | "yesterday" | "week_ago" | "month_start") => {
    const date = new Date();
    if (type === "yesterday") date.setDate(date.getDate() - 1);
    if (type === "week_ago") date.setDate(date.getDate() - 7);
    if (type === "month_start") date.setDate(1);
    handleDateChange(localActionDate(date));
  };

  const handleGenerateJrwaSign = () => {
    if (isNoJrwa) return;
    const symbol = selectedJrwaSymbol || "966.1";
    applyGeneratedSign(generateNextJrwaSign({ symbol, year: formYear(), actions, jrwaCases }));
  };

  /** Po "Zapisz i dodaj podobne": kolejne działanie dostaje następny wolny znak (z uwzględnieniem właśnie zapisanego). */
  const prepareSignForNextSimilar = (saved: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">) => {
    if (isNoJrwa || !selectedJrwaSymbol) {
      clearSign();
      setValue("jrwaCaseId", "");
      return;
    }
    const savedAction: OzipzAction = { ...saved, id: "", createdAt: "", updatedAt: "" };
    applyGeneratedSign(generateNextJrwaSign({
      symbol: selectedJrwaSymbol,
      year: formYear(),
      actions: [...actions, savedAction],
      jrwaCases,
    }));
  };

  const handleJrwaSignChange = (val: string) => {
    setValue("jrwaSign", val, { shouldDirty: true, shouldValidate: true });
    if (!val || !val.trim()) {
      setValue("jrwaCaseId", "");
      setGeneratedJrwaMeta(null);
      setAutoCreateJrwaCase(false);
      return;
    }

    const trimmed = val.trim();
    const existing = jrwaCases.find(
      (c) => c.fullCaseSign && c.fullCaseSign.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      setValue("jrwaCaseId", existing.id);
      setAutoCreateJrwaCase(false);
      setSelectedJrwaSymbol(existing.jrwaSymbol);
      setGeneratedJrwaMeta({
        section: existing.section || JRWA_DEFAULT_SECTION,
        jrwaSymbol: existing.jrwaSymbol,
        caseNumber: existing.caseNumber,
        year: existing.year,
        fullCaseSign: existing.fullCaseSign,
      });
      return;
    }

    const multiSymMatch = trimmed.match(
      /^(?:(?:PSSE\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\.)?([0-9]+\.[0-9]+)\.(\d+)(?:\.\d+)?\.(\d{4})(?:\.[A-Za-z0-9]+)?$/i
    );
    const singleSymMatch = trimmed.match(
      /^(?:(?:PSSE\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\.)?([0-9]{4})\.(\d+)(?:\.\d+)?\.(\d{4})(?:\.[A-Za-z0-9]+)?$/i
    );
    const match = multiSymMatch || singleSymMatch;

    if (match) {
      const sym = match[1];
      const caseNum = parseInt(match[2], 10);
      const yr = parseInt(match[3], 10);
      if (caseNum > 0 && caseNum !== yr && caseNum < 1000) {
        setValue("jrwaCaseId", "");
        setAutoCreateJrwaCase(true);
        setSelectedJrwaSymbol(sym);
        setGeneratedJrwaMeta({
          section: JRWA_DEFAULT_SECTION,
          jrwaSymbol: sym,
          caseNumber: caseNum,
          year: yr,
          fullCaseSign: formatFullJrwaSign({ jrwaSign: trimmed }) || trimmed,
        });
        return;
      }
    }

    setValue("jrwaCaseId", "");
    setGeneratedJrwaMeta(null);
    setAutoCreateJrwaCase(false);
  };

  /** Przywrócenie klasyfikacji ze szkicu: znak nadany automatycznie dostaje aktualny wolny numer, ręczny zostaje. */
  const restoreClassification = (symbol: string, autoSign: boolean) => {
    setSelectedJrwaSymbol(symbol);
    const manualSign = (watch("jrwaSign") || "").trim();
    if (autoSign && symbol && !isNoJrwaActionType(watch("actionType"))) {
      applyGeneratedSign(generateNextJrwaSign({ symbol, year: formYear(), actions, jrwaCases }));
    } else if (manualSign && !autoSign) {
      handleJrwaSignChange(manualSign);
    } else {
      setGeneratedJrwaMeta(null);
    }
  };

  const initJrwaForAction = (action?: Partial<OzipzAction> | null) => {
    if (!action) {
      setSelectedJrwaSymbol("");
      setGeneratedJrwaMeta(null);
      setAutoCreateJrwaCase(true);
      return;
    }
    if (action.programId) {
      const prog = programs.find((p) => p.id === action.programId);
      if (prog) {
        const sym = getProgramJrwaSymbol(prog, prog.name, action.actionType);
        setSelectedJrwaSymbol(sym);
        // Znak nadajemy tylko nowym wpisom (np. z planu pracy lub kopii) — nie istniejącym działaniom otwartym do edycji.
        if (!action.jrwaSign && !action.id && !isNoJrwaActionType(action.actionType)) {
          const year = Number(String(action.date || "").slice(0, 4)) || new Date().getFullYear();
          applyGeneratedSign(generateNextJrwaSign({ symbol: sym, year, actions, jrwaCases }));
        }
      }
    } else if (action.jrwaSign) {
      const sym = extractCleanJrwaSymbol(action, jrwaSymbolsList.map((j) => j.symbol));
      setSelectedJrwaSymbol(sym || "");
    } else {
      setSelectedJrwaSymbol("");
    }
  };

  return {
    selectedJrwaSymbol,
    setSelectedJrwaSymbol,
    autoCreateJrwaCase,
    setAutoCreateJrwaCase,
    generatedJrwaMeta,
    setGeneratedJrwaMeta,
    jrwaSymbolsList,
    handleProgramSelect,
    handleJrwaSymbolChange,
    handleProgramOrJrwaSelect,
    setQuickDate,
    handleDateChange,
    handleGenerateJrwaSign,
    handleJrwaSignChange,
    initJrwaForAction,
    prepareSignForNextSimilar,
    restoreClassification,
  };
}
