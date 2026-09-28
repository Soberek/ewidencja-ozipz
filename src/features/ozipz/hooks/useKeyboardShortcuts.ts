import { useEffect } from "react";
import { useModalStore } from "../store/useModalStore";

interface KeyboardShortcutsOptions {
  onSearchFocus?: () => void;
  onOpenNewAction?: () => void;
  onScheduleViewChange?: (viewIndex: number) => void;
}

export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const openModal = useModalStore((s) => s.openModal);
  const activeModal = useModalStore((s) => s.activeModal);
  const closeModal = useModalStore((s) => s.closeModal);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing in form inputs (unless it is Escape or Cmd/Ctrl combination)
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. ESCAPE: Close modal if open
      if (e.key === "Escape") {
        if (activeModal) {
          e.preventDefault();
          closeModal();
          return;
        }
      }

      // 2. CMD+N / CTRL+N: Open New Action Dialog
      if (isCmdOrCtrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (options?.onOpenNewAction) {
          options.onOpenNewAction();
        } else {
          openModal("action");
        }
        return;
      }

      // 3. CMD+K / CTRL+K: Focus Search or Command Palette
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (options?.onSearchFocus) {
          options.onSearchFocus();
        } else {
          // Focus first visible search input on the page
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="szukaj" i], input[type="text"][placeholder*="Szukaj" i], input[type="search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }

      // 4. Numbers 1, 2, 3 (When not typing in inputs): switch views
      if (!isInputFocused && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "1" || e.key === "2" || e.key === "3") {
          const viewIndex = parseInt(e.key, 10);
          if (options?.onScheduleViewChange) {
            options.onScheduleViewChange(viewIndex);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal, activeModal, closeModal, options]);
}
