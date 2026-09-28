# Standardy Inżynierii i Zasady Architektoniczne Projektu (Ewidencja OZiPZ)

Dokument stanowi nadrzędne reguły projektowe (Gemini Workspace Rules) dla całego repozytorium **Ewidencja OZiPZ**. Każdy agent AI oraz programista ma bezwzględny obowiązek stosowania poniższych standardów.

---

## 1. Pryncypia Programistyczne (DRY, SOLID, YAGNI)

### A. DRY (Don't Repeat Yourself)
- Żadnego duplikowania logiki biznesowej, zapytań SQL, kalkulacji statystycznych ani schematów formularzy.
- Wspólne komponenty UI (np. zaawansowana generyczna tabela `DataTable` z sortowaniem, wyszukiwaniem i presetami, `ModalDialog`, `EmptyState`) muszą być wielokrotnie wykorzystywane we wszystkich modułach.
- Stałe słownikowe, konfiguracje kolorów i ikon są scentralizowane w `src/features/ozipz/constants.ts`.
- Mappery pomiędzy wierszami bazy SQLite a modelami TypeScript znajdują się wyłącznie w `src/db/mappers.ts`.

### B. SOLID
1. **Single Responsibility Principle (SRP)**:
   - Każdy plik, komponent i hook odpowiada za dokładnie jedną rzecz.
   - Moduł widoku (np. `ActionsSection`) odpowiada wyłącznie za prezentację i filtrowanie listy.
   - Formularz modala / edytor (np. `ActionDialog`, `ActionEditorSection`) odpowiada wyłącznie za edycję i walidację encji.
   - Zarządzanie stanem i wywołania bazy danych znajdują się w `useOzipzDbStore.ts`, hooku `useOzipzDb.ts` oraz `src/db/`.
2. **Open/Closed Principle (OCP)**:
   - Moduły są otwarte na rozszerzenia (np. dodanie nowej kategorii w Centrum Słowników), a zamknięte na modyfikacje rdzenia.
3. **Liskov Substitution Principle (LSP)**:
   - Usługi bazy danych (`SqliteDatabaseService` dla Tauri SQLite oraz `FallbackDatabaseService` dla Web/LocalStorage) implementują ten sam kontrakt interfejsu `IOzipzDatabaseService`.
4. **Interface Segregation Principle (ISP)**:
   - Komponenty przyjmują wyłącznie propsy, których faktycznie potrzebują. Brak przekazywania całych globalnych obiektów stanu, jeśli potrzebna jest tylko pojedyncza tablica lub callback.
5. **Dependency Inversion Principle (DIP)**:
   - Komponenty wyższego poziomu zależą od abstrakcji typów domenowych (`src/features/ozipz/types/ozipz.types.ts`), a nie od konkretnych implementacji bazodanowych.

### C. YAGNI (You Aren't Gonna Need It)
- Nie tworzymy nadmiarowych abstrakcji "na zapas".
- Nie instalujemy zewnętrznych ciężkich bibliotek, jeśli problem można rozwiązać zwięzłym, czystym kodem TypeScript/Tailwind.
- Wszystkie funkcje muszą bezpośrednio realizować wymagania merytoryczne OZiPZ (Oświata Zdrowotna i Promocja Zdrowia PSSE).

---

## 2. Architektura Komponentów i Stanu (Zero Monolitów & Pełna Modularyzacja)

### A. Zakaz Tworzenia Monolitów
- **Bezwzględny zakaz** tworzenia plików przekraczających 350-400 linii z wymieszanymi widokami, tabelami i wieloma dialogami w jednym pliku.
- Każdy modal/dialog **musi być wydzielony do osobnego pliku** w odpowiednim podkatalogu dziedzinowym:
  - `ActionDialog.tsx` oraz `IzrzDocumentDialog.tsx` dla działań edukacyjnych
  - `ScheduleDialog.tsx`, `AdnotacjaDialog.tsx`, `CopyYearPlanDialog.tsx` dla zadań harmonogramu / planu pracy
  - `FacilityDialog.tsx` dla placówek i instytucji
  - `ContactDialog.tsx` dla spisu kontaktów i koordynatorów
  - `RegisterDialog.tsx` dla rejestrów urzędowych
  - `DictionaryDialog.tsx` dla pozycji słownikowych
  - `PublicationDialog.tsx` dla publikacji i monitoringu mediów
  - `MaterialDialog.tsx` oraz `DistributionDialog.tsx` dla materiałów oświatowych
  - `JrwaDialog.tsx` oraz `JrwaCaseDetailsDialog.tsx` dla kancelarii i spraw JRWA

### B. Globalny Stan i Zarządzanie Modalami (Zustand Store)
- Globalny stan bazy danych i operacje CRUD są scentralizowane w `src/features/ozipz/store/useOzipzDbStore.ts`.
- Globalne otwieranie i zamykanie okien modalnych wraz z payloadami encji odbywa się przez `src/features/ozipz/store/useModalStore.ts`.
- Wyklucza się tworzenie głębokich łańcuchów prop-drillingu dla zarządzania stanem otwarcia modali.

---

## 3. Pełna Type-Safety (TypeScript Strict Mode)

- Wszystkie encje, relacje, propsy i funkcje muszą posiadać jawne, precyzyjne typowanie TypeScript.
- **Zakaz stosowania `any`** w logice domenowej, schematach walidacji i strukturach danych.
- Typy domenowe znajdują się w `src/features/ozipz/types/ozipz.types.ts`.
- Typy bazy danych i SQLite Row znajdują się w `src/db/types.ts`.
- Schematy walidacji Zod znajdują się w `src/features/ozipz/schemas/ozipz.schemas.ts`.
- Wszystkie zmiany w modelach danych muszą zachowywać 100% zgodność kompilacji (`npm run build` z `tsc && vite build`).

---

## 4. Mapa i Struktura Katalogów Projektu

```
src/
├── components/
│   └── ui/                     # Generyczny Design System (DataTable, ModalDialog, Button, Card, Input, Badge, EmptyState)
├── db/
│   ├── client.ts               # Inicjalizacja klienta SQLite Tauri / Fallback
│   ├── types.ts                # Interfejsy SQL Row i IOzipzDatabaseService
│   ├── sqlite-service.ts       # Natywna obsługa SQLite w trybie WAL z transakcjami
│   ├── fallback-service.ts     # Fallback LocalStorage dla środowiska przeglądarkowego
│   ├── mappers.ts              # Dwukierunkowe mapery SQL Row <-> Domain Model
│   └── mappers.test.ts         # Testy mapperów
└── features/
    └── ozipz/
        ├── constants.ts        # Scentralizowana konfiguracja słowników, kolorów i ikon
        ├── data/
        │   ├── firebase_migrated_data.json # Wzorcowy zmigrowany snapshot danych JSON
        │   ├── migratedData.ts # Typowany zbiór startowy bazy
        │   └── dictionaries.test.ts # Testy integralności słowników
        ├── schemas/
        │   ├── ozipz.schemas.ts # Schematy walidacji Zod dla wszystkich encji
        │   └── ozipz.schemas.test.ts # Testy walidacji schematów
        ├── store/
        │   ├── useOzipzDbStore.ts # Główny stan Zustand dla bazy i operacji CRUD
        │   ├── useModalStore.ts   # Centralne zarządzanie oknami modalnymi
        │   └── useUIStore.ts      # Stan UI (rozmiar czcionki, motyw)
        ├── hooks/
        │   ├── useOzipzDb.ts   # Wrapper hooka stanu dla komponentów
        │   └── useFontSize.ts  # Dostępność (skalowanie tekstu)
        ├── utils/
        │   ├── ozipzCalculations.ts     # Obliczenia mierników, sprawozdań i wskaźników
        │   ├── izrzGenerator.ts         # Generator metryk i dokumentów IZRZ/EZD
        │   ├── programJrwaUtils.ts      # Powiązania programów z symbolami JRWA
        │   ├── scheduleExecutionUtils.ts# Automatyczne rozliczanie realizacji harmonogramu
        │   ├── monthlyTargetsUtils.ts   # Macierz celów miesięcznych i zgodności
        │   ├── bezpieczneWakacjeUtils.ts# Kalkulacje dla akcji letniej/zimowej
        │   └── reportAnnex.ts           # Generator załączników sprawozdawczych MZ/GIS
        ├── types/
        │   └── ozipz.types.ts  # Typy domenowe OZiPZ
        └── components/         # Podział domenowy modułów
            ├── actions/        # Rejestr Działań Edukacyjnych
            │   ├── ActionsSection.tsx      # Główny widok listy działań
            │   ├── ActionEditorSection.tsx  # Wieloetapowy formularz dodawania/edycji
            │   ├── ActionDialog.tsx        # Modalny edytor działania
            │   ├── IzrzDocumentDialog.tsx  # Generator i podgląd metryki IZRZ
            │   ├── editor/                 # Komponenty formularza i ActionEditorFooter
            │   ├── list/                   # Filtry i elementy tabeli działań
            │   └── actions.test.ts
            ├── schedule/       # Harmonogram i Miesięczny Plan Pracy
            │   ├── ScheduleSection.tsx      # Główny kontener harmonogramu
            │   ├── ScheduleKanbanView.tsx   # Widok tablicy Kanban
            │   ├── ScheduleCalendarView.tsx # Widok kalendarza miesięcznego
            │   ├── ScheduleDialog.tsx       # Formularz zadania harmonogramu
            │   ├── AdnotacjaDialog.tsx      # Dodawanie adnotacji/zmian do zadania
            │   ├── CopyYearPlanDialog.tsx   # Kopiowanie planu rocznego
            │   └── schedule.test.ts
            ├── facilities/     # Baza Placówek i Instytucji
            │   ├── FacilitiesSection.tsx
            │   └── FacilityDialog.tsx
            ├── contacts/       # Spis Kontaktów i Koordynatorów
            │   ├── ContactsSection.tsx
            │   ├── ContactDialog.tsx
            │   └── contacts.test.ts
            ├── registers/      # Rejestry Urzędowe (Szkolenia, Narady, Konkursy itd.)
            │   ├── RegistersSection.tsx
            │   ├── RegisterDialog.tsx
            │   └── registers.test.ts
            ├── dictionaries/   # Centrum Słowników OZiPZ
            │   ├── DictionariesSection.tsx
            │   └── DictionaryDialog.tsx
            ├── reports/        # Mierniki i Sprawozdania (MZ/GIS, Gminne, Planu, Materiałów)
            │   ├── ReportsSection.tsx             # Główny widok modułu raportów
            │   ├── MiernikExecutionTab.tsx        # Wykonanie miernika budżetowego
            │   ├── BezpieczneWakacjeTab.tsx       # Sprawozdanie Bezpieczne Wakacje
            │   ├── MunicipalityDetailedTab.tsx    # Zestawienie gminne
            │   ├── SprawozdanieExportTab.tsx      # Eksport sprawozdań MZ/GIS
            │   └── reports.test.ts
            ├── materials/      # Katalog Materiałów Oświatowych i Rozdzielniki
            │   ├── MaterialsSection.tsx
            │   ├── MaterialDialog.tsx
            │   ├── DistributionDialog.tsx
            │   └── materials.test.ts
            ├── jrwa/           # Wykaz Spraw i Znaków JRWA (Instrukcja Kancelaryjna)
            │   ├── JrwaSection.tsx
            │   ├── JrwaDialog.tsx
            │   ├── JrwaCaseDetailsDialog.tsx
            │   └── jrwa.test.ts
            ├── programs/       # Programy Profilaktyczne i Zgłoszenia Szkół
            │   ├── ProgramsSection.tsx
            │   └── ParticipationDialog.tsx
            ├── publications/   # Publikacje i Monitoring Mediów
            │   ├── PublicationsSection.tsx  # Ewidencja publikacji (FB, www, prasa) + zakładki importu
            │   ├── PublicationDialog.tsx    # Formularz dodawania publikacji
            │   ├── GovImportTab.tsx / XImportTab.tsx # Import z gov.pl i profilu X (wspólny panel import/)
            │   ├── sources/                 # Parsery gov.pl i X + webFetch (pobieranie przez Tauri / serwer Vite)
            │   ├── matching/                # Rozpoznawanie publikacji już w systemie + uzgadnianie ewidencji z działaniami
            │   ├── import/                  # Stan importu (useSourceImport), zapis publikacja+działanie, komponenty UI
            │   └── publications.test.tsx
            ├── letters/        # Dziennik Korespondencji i Pisma Urzędowe
            │   └── LettersSection.tsx
            ├── scans/          # Cyfrowe Archiwum Skanów i Dokumentów PDF
            │   └── ScansSection.tsx
            ├── staff/          # Kadra Pracownicza OZiPZ
            │   └── StaffSection.tsx
            ├── templates/      # Szablony Zadań i Opisy Merytoryczne
            │   └── TemplatesSection.tsx
            ├── settings/       # Diagnostyka i Konserwacja Bazy Danych
            │   └── SettingsSection.tsx
            ├── DashboardSection.tsx # Pulpit Główny (KPI, Dni Zdrowia, Szybkie Akcje)
            └── layout/         # Układ aplikacji (Header, Sidebar)
                ├── AppHeader.tsx
                └── OzipzSidebar.tsx
```

---

## 5. Standardy Jakości i Testowania

1. Każda nowa funkcjonalność lub modyfikacja logiki **musi posiadać pokrycie w testach jednostkowych** (`vitest`).
2. Wszystkie testy jednostkowe muszą przechodzić w 100% (`npx vitest run` / `npm test`).
3. Przed zakończeniem pracy kod musi przejść pełną kompilację produkcyjną bez żadnych błędów (`npm run build` z `tsc && vite build`).
4. Dane w bazie muszą być autentyczne i czyste – **zero nieautoryzowanych mocków** w produkcyjnych strukturach.

---

## 6. Pryncypia Bazy Danych i Słowników (Zero Hardkodowania & 100% Relacyjność)

1. **Bezwzględny Zakaz Hardkodowania Wartości Domenowych**:
   - Żadne wartości wyboru (gminy, role/stanowiska pracowników, stanowiska kontaktów szkolnych, typy dokumentów/skanów, typy placówek, formy działań, grupy docelowe, tematyki zdrowotne, symbole JRWA, akcje profilaktyczne, powody adnotacji) **nie mogą być zahardkodowane jako statyczne tablice w kodzie TS/TSX**.
   - Wszystkie opcje wyboru w formularzach (`<select>`, combobox, datalist) **muszą pochodzić dynamicznie z bazy danych**:
     - z tabeli słowników `ozipz_dictionaries` (`dictionaryItems` / `dictType`),
     - z tabel encji powiązanych (`ozipz_facilities`, `ozipz_programs`, `ozipz_materials`, `ozipz_staff`, `ozipz_contacts`, `ozipz_scans`, `ozipz_actions`).
2. **Pełna Zarządzalność w Centrum Słowników**:
   - Każda nowa kategoria wartości słownikowych musi być zarejestrowana w `DICTIONARY_CATEGORIES_CONFIG` (`src/features/ozipz/constants.ts`) oraz `OzipzDictionaryType` (`src/features/ozipz/types/ozipz.types.ts`).
   - Użytkownik ma mieć pełną możliwość dodawania, edytowania i usuwania pozycji słownikowych bezpośrednio w module **Centrum Słowników**.
3. **Integralność Relacyjna i Klucze Obce (SQLite Foreign Keys)**:
   - Silnik SQLite działa z aktywnym `PRAGMA foreign_keys = ON;` w trybie `WAL`.
   - Wszystkie relacje między tabelami posiadają jawne deklaracje kluczy obcych (`FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL`, `FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE CASCADE` dla relacji podrzędnych).
   - Wszystkie kolumny kluczy obcych posiadają dedykowane indeksy SQLite (`CREATE INDEX IF NOT EXISTS idx_*`).
4. **Relacyjny Dostęp przez Hook `useOzipzDb`**:
   - Hook `useOzipzDb.ts` udostępnia zoptymalizowane, memoizowane selektory dynamicznych słowników (`municipalities`, `staffRoles`, `contactPositions`, `documentTypes`, `activityTypes`, `topics`, `recipientGroups`, `locationTypes`, `materialTypes`, `campaigns`, `annotationReasons`, `jrwaSymbols`).
5. **Oficjalny Schemat Bazy (Single Source of Truth)**:
   - Kompletna specyfikacja 16 tabel SQLite, typów kolumn, relacji `FOREIGN KEY`, diagramu ERD (Mermaid) oraz oficjalnego katalogu JRWA znajduje się w pliku [`DATABASE_SCHEMA.md`](file:///Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/DATABASE_SCHEMA.md). Każda modyfikacja bazy danych musi bezwzględnie przestrzegać tego schematu.

---

## 7. Zasada "Zero Default Values" w Formularzach i Edytorach

1. **Brak Predefiniowanych Wyborów w Nowych Encjach**:
   - Pola formularzy przy tworzeniu nowych rekordów (np. Działanie, Placówka, Zadanie Planu, Materiał, Publikacja, Kontakt, Skan, Rejestr) **nie mogą posiadać arbitralnie wybranych wartości początkowych**.
   - Wszystkie pola wyboru inicjalizują się pustym stringiem `""` lub wartością `null`.
2. **Jawny Placeholder w Każdym Selektorze**:
   - Pierwszą opcją każdego elementu `<select>` musi być czytelny placeholder (np. `<option value="">-- Wybierz gminę --</option>`, `<option value="">-- Wybierz tematykę ze słownika --</option>`), wymuszający świadomy wybór użytkownika.
3. **Ścisła Walidacja Schematów Zod**:
   - Schematy formularzy Zod w `src/features/ozipz/schemas/ozipz.schemas.ts` egzekwują wymagane pola (np. `.min(1, "Wybór jest wymagany")`), uniemożliwiając zapisanie formularza bez dokonania wyboru.

---

## 8. Standardy Architektoniczne Modułów Domenowych

### A. Rejestr Działań Edukacyjnych (`actions/`)
- Dwa tryby pracy: szybka lista z filtrami (`ActionsSection.tsx`) oraz pełny, zaawansowany edytor (`ActionEditorSection.tsx` i `ActionDialog.tsx`).
- Dolny pasek podsumowania na żywo (`ActionEditorFooter.tsx`) wyświetla metadane bieżącej akcji (tytuł, data, forma, placówka, gmina, program, osoba prowadząca, status EZD, znak JRWA i IZRZ) oraz kluczowe mierniki (1 DZ, ODB, POŚR, MAT). Puste pola nie mogą renderować pustych ramek ani etykiet.
- Generator dokumentów i metryk IZRZ (`IzrzDocumentDialog.tsx`) odpowiada za formalną zgodność z systemem kancelaryjnym EZD.

### B. Harmonogram i Miesięczny Plan Pracy (`schedule/`)
- Trzy komplementarne widoki: Tabela (`DataTable`), Kanban (`ScheduleKanbanView`) oraz Kalendarz (`ScheduleCalendarView`).
- Automatyczne rozpoznawanie i przypisywanie programu profilaktycznego (`resolveScheduleProgram`) po `programId`, `programName`, symbolu JRWA (`966.1`, `966.3`, `966.4`, `966.14` itd.) lub słowach kluczowych w tytule.
- Wizualne odznaki programowe z ikoną `ShieldCheck` w tabeli i widokach kart.
- Inteligentne automatyczne rozliczanie wykonania zadań na podstawie zarejestrowanych działań (`enrichScheduleEvents`).
- Rejestrowanie adnotacji i korekt terminów (`AdnotacjaDialog.tsx`) oraz kopiowanie planów rocznych (`CopyYearPlanDialog.tsx`).

### C. Kancelaria i Sprawy JRWA (`jrwa/`)
- Ścisła, niezależna numeracja spraw kancelaryjnych per teczka/symbol JRWA (np. sprawy w teczce `966.1` mają własną sekwencję 1, 2, 3... niezależną od teczki `966.4`).
- Automatyczne generowanie pełnego znaku kancelaryjnego (np. `OZiPZ.966.1.1.2026`).

### D. Sprawozdawczość i Analityka (`reports/`)
- Pięć dedykowanych trybów: Podsumowanie ("Wszystkie działania"), Bezpieczne Wakacje, Wykonanie Miernika Budżetowego, Cele Miesięczne i Zgodność, oraz Zestawienie Gminne.
- Moduł Celów Miesięcznych (`monthlyTargetsUtils.ts`) z macierzą 12 miesięcy, podziałem na działania programowe i nieprogramowe (osobno DZ i ODB oraz łącznie), automatycznym porównaniem z realizacją live, wskaźnikami % i odchyleniami $\pm$.

### E. Publikacje i Monitoring Mediów (`publications/`)
- Ewidencja materiałów publikowanych w internecie (Facebook, portal PSSE, prasa, radio).
- Integracja ze źródłami: artykuły z portalu gov.pl PSSE Myślibórz (`sources/govSource.ts`, z wykrywaniem przekierowań do GIS/WSSE) oraz wpisy z profilu X (`sources/xSource.ts`: oś czasu syndication + dodawanie po linkach).
- Strony zewnętrzne pobiera wyłącznie warstwa serwerowa (`fetch_publication_source` w Tauri, `/api/web/fetch` w serwerze Vite) z zamkniętą listą hostów – przeglądarka nie odczyta ich sama (CORS).
- Rozpoznawanie duplikatów (`matching/publicationMatcher.ts`) sprawdza ewidencję publikacji **i** działania „Publikacja media (…)”: po linku (dokładnie), a dla starszych wpisów bez linku po tytule/treści i dacie. Wpis „prawdopodobnie w systemie” można powiązać z istniejącym działaniem zamiast tworzyć duplikat.
