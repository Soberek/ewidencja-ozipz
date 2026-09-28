---
description: "Standardy Inżynierii i Zasady Architektoniczne Projektu Ewidencja OZiPZ"
globs:
  - "src/**"
  - "scripts/**"
alwaysApply: true
---

# Reguły Inżynierii Oprogramowania: Ewidencja OZiPZ

Dokument stanowi skondensowane wytyczne projektowe dla agentów AI. Pełna specyfikacja znajduje się w głównym pliku [GEMINI.md](../../GEMINI.md).

---

## 1. Zasady Ogólne
- **DRY (Don't Repeat Yourself)**: Scentralizowana konfiguracja słowników w `src/features/ozipz/constants.ts`, generyczne komponenty UI (`DataTable`, `ModalDialog`, `EmptyState`), dwukierunkowe mapery w `src/db/mappers.ts`.
- **SOLID**:
  - **SRP**: Każdy komponent odpowiada za jeden obszar (brak monolitów). Formularze dialogowe wydzielone do osobnych plików `*Dialog.tsx`.
  - **OCP**: Otwartość na nowe pozycje i kategorie w Centrum Słowników oraz rejestrach.
  - **LSP**: Jednolity kontrakt interfejsu bazy `IOzipzDatabaseService`.
  - **ISP**: Dedykowane, precyzyjne propsy dla każdego komponentu bez nadmiarowych obiektów.
  - **DIP**: Komponenty wyższego rzędu zależą od abstrakcji typów domenowych `ozipz.types.ts`.
- **YAGNI**: Implementacja wyłącznie rzeczywistych potrzeb dziedziny oświaty zdrowotnej i promocji zdrowia PSSE.
- **Type-Safety**: 100% strict TypeScript, zero `any` w całej logice biznesowej, schematach walidacji i widokach.
- **Czystość Danych**: Zero sztucznych mocków w strukturach produkcyjnych.
- **Zarządzanie Stanem**: Stan bazy w `useOzipzDbStore.ts`, zarządzanie modalami w `useModalStore.ts`.

---

## 2. Baza Relacyjna i Zero Hardkodowania (No Hardcoded Domain Values)
- **Bezwzględny zakaz hardkodowania list/tablic wartości domenowych w kodzie TS/TSX**:
  - Gminy, role/stanowiska kadry, stanowiska koordynatorów i kontaktów, typy dokumentów i skanów, formy działań, grupy docelowe, tematyki zdrowotne, symbole JRWA, akcje profilaktyczne i powody adnotacji **muszą pochodzić dynamicznie z bazy danych**.
  - Źródłem wartości jest tabela SQLite `ozipz_dictionaries` (`dictionaryItems`) oraz tabele relacyjne (`facilities`, `staff`, `programs`, `materials`, `contacts`, `scans`, `actions`).
- **Centrum Słowników**:
  - Każda kategoria słownikowa jest zarejestrowana w `DICTIONARY_CATEGORIES_CONFIG` (`constants.ts`) oraz `OzipzDictionaryType` (`ozipz.types.ts`).
  - Użytkownik ma pełną swobodę dodawania, edycji i usuwania pozycji słownikowych.
- **Klucze Obce SQLite (Foreign Keys)**:
  - SQLite uruchamiane zawsze z `PRAGMA foreign_keys = ON;` w trybie WAL.
  - Jawne klucze obce `FOREIGN KEY (...) REFERENCES ...` z regułami `ON DELETE SET NULL` lub `ON DELETE CASCADE`.
  - Wszystkie relacje kluczy obcych posiadają indeksy `CREATE INDEX IF NOT EXISTS idx_*`.

---

## 3. Zasada "Zero Default Values" w Formularzach
- **Brak Domyślnych Wartości**: Pola tworzenia encji (działań, placówek, planów, kontaktów, materiałów itd.) nie mogą posiadać arbitralnie zaznaczonych wartości początkowych (inicjalizacja do `""` lub `null`).
- **Wymuszony Świadomy Wybór**: Każdy `<select>` posiada czytelny placeholder jako pierwszą opcję (np. `<option value="">-- Wybierz gminę --</option>`).
- **Walidacja Zod**: Schematy Zod (`src/features/ozipz/schemas/ozipz.schemas.ts`) walidują kompletność i poprawność wymaganych pól przed zapisem do bazy.

---

## 4. Architektura Modułów Domenowych OZiPZ

### A. Rejestr Działań Edukacyjnych (`src/features/ozipz/components/actions/`)
- Wieloetapowy formularz edytora (`ActionEditorSection.tsx` oraz `ActionDialog.tsx`) zintegrowany z dynamicznymi słownikami.
- Dolny pasek podsumowania na żywo (`ActionEditorFooter.tsx`) wyświetlający aktualnie wprowadzane dane (tytuł, data, forma, placówka, gmina, program, osoba prowadząca, status EZD, znak JRWA i IZRZ) oraz kluczowe mierniki (1 DZ, ODB, POŚR, MAT). Puste pola nie renderują pustych etykiet.
- Generator i walidator metryki IZRZ/EZD (`IzrzDocumentDialog.tsx`).

### B. Harmonogram i Miesięczny Plan Pracy (`src/features/ozipz/components/schedule/`)
- Trzy komplementarne widoki: Tabela (`DataTable`), Kanban (`ScheduleKanbanView`) oraz Kalendarz (`ScheduleCalendarView`).
- Automatyczne rozpoznawanie i przypisywanie programu profilaktycznego (`resolveScheduleProgram`) po `programId`, `programName`, symbolu JRWA (`966.1`, `966.3`, `966.4`, `966.14` itd.) lub słowach kluczowych w tytule.
- Wizualne odznaki programowe z ikoną `ShieldCheck` w tabeli i widokach kart.
- Inteligentne automatyczne rozliczanie wykonania zadań na podstawie zarejestrowanych działań (`enrichScheduleEvents`).
- Rejestrowanie adnotacji (`AdnotacjaDialog.tsx`) oraz kopiowanie planów rocznych (`CopyYearPlanDialog.tsx`).

### C. Kancelaria i Sprawy JRWA (`src/features/ozipz/components/jrwa/`)
- Ścisła, niezależna numeracja spraw kancelaryjnych per teczka/symbol JRWA (np. sprawy w teczce `966.1` mają własną sekwencję 1, 2, 3... niezależną od teczki `966.4`).
- Automatyczne generowanie pełnego znaku kancelaryjnego (np. `OZiPZ.966.1.1.2026`).

### D. Sprawozdawczość i Analityka (`src/features/ozipz/components/reports/`)
- Pięć trybów analitycznych: Podsumowanie ("Wszystkie działania"), Bezpieczne Wakacje, Wykonanie Miernika Budżetowego, Cele Miesięczne i Zgodność, oraz Zestawienie Gminne.
- Moduł Celów Miesięcznych (`monthlyTargetsUtils.ts`) z macierzą 12 miesięcy, podziałem na działania programowe i nieprogramowe (osobno DZ i ODB oraz razem), automatycznym porównaniem z realizacją live, wskaźnikami % i odchyleniami $\pm$.

### E. Publikacje i Monitoring Mediów (`src/features/ozipz/components/publications/`)
- Ewidencja publikacji prasowych, postów FB i komunikatów www.
- Scrapery: portalu gov.pl dla PSSE Myślibórz (`GovImportTab.tsx`) oraz postów z platformy X/Twitter (`XImportTab.tsx`).

---

## 5. Testy i Jakość Kodu
- Każda zmiana w logice domenowej lub bazie danych musi posiadać pokrycie w testach jednostkowych (`vitest`).
- Wszystkie testy jednostkowe muszą przechodzić w 100% (`npx vitest run` / `npm test`).
- Kod musi bezbłędnie kompilować się do wersji produkcyjnej (`npm run build` z `tsc && vite build`).
