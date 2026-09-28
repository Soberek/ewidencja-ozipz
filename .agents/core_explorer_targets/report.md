# Raport z Badania Architektonicznego i UX/UI: 4 Moduły Bazowe Ewidencja OZiPZ

**Data badania:** 2026-09-05  
**Autor:** Explorer Subagent (`core_explorer_targets`)  
**Zakres analizy:**
1. Materiały oświatowe (`src/features/ozipz/components/materials/`)
2. Rejestry urzędowe (`src/features/ozipz/components/registers/`)
3. Spis kontaktów (`src/features/ozipz/components/contacts/`)
4. Dziennik korespondencji/pism (`src/features/ozipz/components/letters/`)

---

## 1. Podsumowanie Wykonawcze

Przeprowadzono szczegółowy audyt kodu i architektury komponentów 4 modułów pod kątem 5 wymagań harmonizacyjnych (R1: Filter Bar & Design System, R2: Row Click & Safe Action Isolation, R3: Multi-line Text Wrapping, R4: Collapsible KPI Headers, R5: Test Cleanliness & Zero-Warning Gate) oraz standardów GEMINI.md.

### Kluczowe wnioski:
1. **Zgodność z limitami linii (GEMINI.md < 350-400 linii):**  
   Wszystkie pliki we wszystkich 4 badanych modułach mieszczą się w wyznaczonym limicie. Największe pliki to `RegisterDialog.tsx` (362 linie) oraz `RegistersSection.tsx` (346 linii). Nie jest wymagany radykalny podział plików, lecz należy zachować dyscyplinę przy rozszerzeniach.
2. **Niespójności w paskach filtrów (R1):**  
   - W module Materiałów (`MaterialsCatalogTab.tsx`) występuje surowy `<select>` HTML dla typów materiałów. Brak filtrów w `MaterialsDistributionsTab.tsx`.
   - W module Kontaktów (`ContactsFilterBar.tsx`) występują dwa surowe `<select>` HTML (stanowisko oraz gmina).
   - W module Pism (`LettersSection.tsx`) występuje surowy `<select>` HTML dla kierunku pism (`directionFilter`).
   - Żaden z 4 modułów nie posiada zunifikowanego rzędu "szybkich filtrów" (quick-filter chips) z aktywnym stylem `bg-primary text-primary-foreground` i nieaktywnym `bg-muted/40`.
3. **Brak bezpośredniej interakcji z wierszem i wycieki zdarzeń (R2):**  
   - W `MaterialsCatalogTab`, `MaterialsDistributionsTab`, `ContactsTableView` oraz `LettersSection`, komponent `<DataTable>` nie posiada przekazanego callbacku `onRowClick` ani stylów kursora/hover (`rowClassName`).
   - Przyciski akcji w komórkach tabeli (Edytuj, Usuń, Wystaw rozdzielnik, Drukuj) w większości nie wywołują `e.stopPropagation()`, co po podłączeniu `onRowClick` doprowadziłoby do niekontrolowanego wyzwalania podwójnych zdarzeń.
4. **Obcinanie tekstu przez `truncate` zamiast zawijania (R3):**  
   Występują liczne pojedyncze obcięcia tekstu wielokropkiem (`truncate`), szczególnie przy nazwach placówek oświatowych, tytułach materiałów, sprawach pism oraz osobach odpowiedzialnych. Wymagane jest zastąpienie ich standardem: `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` wraz z atrybutem `title` (tooltip).
5. **Karty KPI i zwijanie nagłówków (R4):**  
   - Materiały, Rejestry i Kontakty renderują karty KPI na stałe bez możliwości zwinięcia (`isKpiVisible` / `showKpiSummary`).
   - Moduł Pism (`LettersSection.tsx`) w ogóle nie posiada paska kart KPI.
   - W żadnym z modułów nie zaimplementowano zapisu preferencji widoku w `localStorage` (`oz.materialsShowKpiSummary`, `oz.registersShowKpiSummary`, `oz.contactsShowKpiSummary`, `oz.lettersShowKpiSummary`).
6. **Wykrycie źródła ostrzeżenia React DOM `searchPlaceholder` (R5):**  
   W pliku `src/components/ui/autocomplete.tsx` właściwość `searchPlaceholder` zadeklarowana w interfejsie `AutocompleteProps` nie została odseparowana podczas destrukturyzacji parametrów komponentu, przez co trafiała do `...restInputProps` i lądowała na natywnym tagu `<input>`, generując ostrzeżenie konsolowe w testach.

---

## 2. Szczegółowy Audyt Modułów

### Moduł 1: Materiały Oświatowe (`materials/`)

#### A. Pliki i liczba linii
| Plik | Liczba linii | Status GEMINI.md | Uwagi |
|---|---|---|---|
| `MaterialsSection.tsx` | 147 | Zgodny (<400) | Główny kontener i orkiestrator zakładek |
| `MaterialDialog.tsx` | 278 | Zgodny (<400) | Modal edycji/dodawania materiału |
| `DistributionDialog.tsx` | 280 | Zgodny (<400) | Modal rozdzielnika materiałów |
| `RozdzielnikBlankietDialog.tsx` | 188 | Zgodny (<400) | Podgląd do druku blankietu |
| `components/MaterialsStatsHeader.tsx` | 90 | Zgodny (<400) | Karty KPI (tytuły, stan, wydane, rozdzielniki) |
| `components/MaterialsViewSwitcher.tsx` | 94 | Zgodny (<400) | Przełącznik: Katalog / Rozdzielniki |
| `components/MaterialsCatalogTab.tsx` | 245 | Zgodny (<400) | Tabela materiałów |
| `components/MaterialsDistributionsTab.tsx` | 243 | Zgodny (<400) | Tabela rozdzielników |

#### B. Pasek filtrów (Filter Bar)
- **`MaterialsCatalogTab.tsx` (linie 186–198):**  
  Obecnie używa surowego tagu HTML:
  ```tsx
  <select
    value={selectedType}
    onChange={(e) => setSelectedType(e.target.value)}
    className="h-9 rounded-[3px] border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
  >
    <option value="all">Wszystkie typy</option>
    {materialTypes.map((t) => (
      <option key={t.id} value={t.label}>{t.label}</option>
    ))}
  </select>
  ```
  **Wymagana zmiana:** Zastąpić komponentem `<Select size="sm">` z `@/components/ui/select`.  
  **Brakujące quick-chips:** Dodać rząd chipów szybkiego filtrowania dla najczęstszych typów materiałów (np. *Wszystkie*, *Broszury*, *Ulotki*, *Plakaty*) na podstawie przekazanej tablicy `materialTypes`.  
  **Wyszukiwarka:** Dodać wewnętrzny przycisk czyszczenia `X` w polu wyszukiwania.
- **`MaterialsDistributionsTab.tsx` (linie 186–210):**  
  Obecnie posiada wyłącznie pojedynczy `Input` do wyszukiwania tekstu.  
  **Wymagana zmiana:** Dodać selektor gminy (`<Select size="sm">`), przycisk czyszczenia `X` oraz chipy szybkiego filtrowania (np. najaktywniejsze gminy lub zakresy czasowe).

#### C. Interakcja z wierszem tabeli i izolacja akcji (Row Click & Action Isolation)
- **`MaterialsCatalogTab.tsx` (linia 232):**  
  Tabela `<DataTable>` wywoływana jest bez parametrów `onRowClick` i `rowClassName`.  
  **Wymagane:**
  ```tsx
  onRowClick={(row) => onEdit(row)}
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
  ```
  **Komórka akcji (linie 121–165):**
  Kontener nie blokuje propagacji zdarzeń (`onClick={(e) => e.stopPropagation()}`). Przyciski `Plus` (wystaw rozdzielnik), `Edit` (edytuj) oraz `Trash2` (usuń) nie wywołują `e.stopPropagation()`. Należy zabezpieczyć zarówno nadrzędny kontener, jak i poszczególne przyciski.
- **`MaterialsDistributionsTab.tsx` (linia 230):**  
  Brak `onRowClick` i `rowClassName`.  
  **Wymagane:** `onRowClick={(row) => onEdit(row)}` oraz `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}`.  
  **Komórka akcji (linie 134–178):** Przyciski `Printer` (blankiet), `Edit` oraz `Trash2` nie wywołują `e.stopPropagation()`.

#### D. Zawijanie tekstu (Text Wrapping)
- **`MaterialsCatalogTab.tsx`:**  
  Kolumna `title` (linie 70–79) posiada prosty `<span>{row.title}</span>` wewnątrz `max-w-[320px]`. Przy długich nazwach brak `line-clamp-2 break-words leading-tight` oraz atrybutu `title={row.title}`.
- **`MaterialsDistributionsTab.tsx`:**  
  Kolumna `recipientName` (linie 96–106) stosuje:
  ```tsx
  <span className="truncate">{row.recipientName || "Odbiorca nieokreślony"}</span>
  ```
  oraz w podtytule gminy: `<p className="... truncate ...">`.  
  Powoduje to obcinanie długich nazw szkół i placówek (np. "Szkoła Podstawowa im. ..."). Wymaga `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight items-start` wraz z `title`.

#### E. Zwijany nagłówek KPI (Collapsible KPI Header)
- **`MaterialsSection.tsx` (linie 96–101):** `<MaterialsStatsHeader>` renderuje się bezwarunkowo.
- **Wymagana implementacja:**
  - Stan `showKpiSummary` inicjalizowany z `localStorage.getItem("oz.materialsShowKpiSummary")` (domyślnie `true`).
  - Klucz `localStorage`: `"oz.materialsShowKpiSummary"`.
  - Rozszerzenie `MaterialsViewSwitcher.tsx` o propsy `isKpiVisible?: boolean; onToggleKpi?: () => void;` i renderowanie przycisku toggle:
    ```tsx
    <Button
      variant="outline"
      size="sm"
      onClick={onToggleKpi}
      className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
      title={isKpiVisible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"}
      aria-expanded={isKpiVisible}
      aria-label={isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}
    >
      {isKpiVisible ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
      <span>{isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}</span>
    </Button>
    ```

#### F. Integracja z modal store
- Otwieranie modali jest scentralizowane w `useModalStore`:
  - Dodawanie materiału: `openModal("material")`
  - Edycja materiału: `openModal("material", { item: material })`
  - Nowy rozdzielnik: `openModal("distribution", { initialMaterialId: materialId })`
  - Edycja rozdzielnika: `openModal("distribution", { item: distribution })`
- Modale są poprawnie podłączone w `RegistryAdminModals.tsx`.

---

### Moduł 2: Rejestry Urzędowe (`registers/`)

#### A. Pliki i liczba linii
| Plik | Liczba linii | Status GEMINI.md | Uwagi |
|---|---|---|---|
| `RegistersSection.tsx` | 346 | Zgodny (<400) | Blisko 350 linii; wymaga dyscypliny kodu |
| `RegisterDialog.tsx` | 362 | Zgodny (<400) | Modal edytora wpisów rejestru |
| `components/RegistersStatsHeader.tsx` | 101 | Zgodny (<400) | Karty KPI (wszystkie, informacje, publikacje, wizytacje) |
| `components/RegistersTypeTabs.tsx` | 98 | Zgodny (<400) | 4 zakładki (Informacje, Publikacje, Wizytacje, Konfiguracja) |
| `components/RegistersFilterBar.tsx` | 211 | Zgodny (<400) | Pasek filtrów i toolbar eksportu |
| `components/InformationRegisterTable.tsx` | 148 | Zgodny (<400) | Tabela Rejestru Informacji (Zał. nr 3 WSSE) |
| `components/PublicationsRegisterTable.tsx` | 94 | Zgodny (<400) | Tabela Rejestru Publikacji |
| `components/VisitationsRegisterTable.tsx` | 118 | Zgodny (<400) | Tabela Rejestru Wizytacji |
| `components/RegistersConfigurationTab.tsx` | 217 | Zgodny (<400) | Tab konfiguracji mapowań form do rejestrów |

#### B. Pasek filtrów (Filter Bar)
- **`RegistersFilterBar.tsx`:**  
  Już teraz poprawnie korzysta z `<Select size="sm">` i `<SearchableSelect size="sm">` z `@/components/ui/select`. Posiada również przycisk czyszczenia `X`.
- **Brakujące quick-chips:**  
  Brak rzędu szybkich filtrów. Rekomendacja: dodać chipy szybkiego wyboru:
  - Okres: *Bieżący rok*, *Ostatni miesiąc*, *Wszystkie wpisy*
  - Symbole JRWA: *Wszystkie*, *966.1*, *966.3*, *966.4* itp. z dynamicznej bazy `jrwaSymbols`.
  - Styl: `bg-primary text-primary-foreground` (aktywny), `bg-muted/40` (nieaktywny).

#### C. Interakcja z wierszem tabeli i izolacja akcji (Row Click & Action Isolation)
- W tabelach `InformationRegisterTable.tsx`, `PublicationsRegisterTable.tsx` i `VisitationsRegisterTable.tsx` przekazano `onRowClick={onActionClick}`, co otwiera modal działania edukacyjnego (`openModal("action", { item: action })`).
- **Brakujący element:** Żadna z tabel nie przekazuje `rowClassName`, przez co wiersze nie mają widocznego efektu aktywnego hovera i kursora wskaźnika (`cursor-pointer`). Należy dodać:
  ```tsx
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
  ```
- W tych trzech tabelach nie ma przycisków akcji w komórkach (brak ryzyka bąbelkowania akcji z wiersza).

#### D. Zawijanie tekstu (Text Wrapping)
- **`InformationRegisterTable.tsx`:**
  - Kolumna `subject` (linie 63–71): Posiada `line-clamp-2`, ale brakuje `break-words leading-tight`, brakuje stałego przedziału `min-w-[200px] max-w-[340px]` oraz brakuje atrybutu `title`.
  - Kolumna `leadEducator` (linia 111): Stosuje `truncate block max-w-[150px]` bez `title`.
  - Kolumna `notes` (linia 121): Stosuje `truncate block max-w-[110px]`.
- **`PublicationsRegisterTable.tsx`:**
  - Kolumna `topic` (linie 44–52): Podobnie, brakuje `break-words leading-tight` i `title`.
  - Kolumna `leadEducator` (linia 61): Stosuje `truncate block max-w-[170px]` bez `title`.
- **`VisitationsRegisterTable.tsx`:**
  - Kolumna `subject` (linie 52–60): Wymaga `break-words leading-tight` i `title`.
  - Kolumna `leadEducator` (linia 88): `truncate block max-w-[150px]`.

#### E. Zwijany nagłówek KPI (Collapsible KPI Header)
- **`RegistersSection.tsx` (linie 241–247):** `<RegistersStatsHeader>` jest wyświetlany statycznie.
- **Wymagana implementacja:**
  - Stan `showKpiSummary` inicjalizowany z `localStorage.getItem("oz.registersShowKpiSummary")`.
  - Klucz `localStorage`: `"oz.registersShowKpiSummary"`.
  - Przycisk toggle z ikoną `ChevronUp`/`ChevronDown` umieszczony w prawym górnym rogu sekcji (obok tytułu w `RegistersSection.tsx` lub po prawej stronie zakładek w `RegistersTypeTabs.tsx`).

#### F. Integracja z modal store
- Wiersze tabel rejestrów reprezentują wpisy `ozipz_actions` zakwalifikowane do urzędowych zestawień, więc kliknięcie wiersza otwiera `openModal("action", { item: action })`.
- Dodatkowo edytor encji `RegisterDialog.tsx` jest zintegrowany z `openModal("register")` w `RegistryAdminModals.tsx`.

---

### Moduł 3: Spis Kontaktów (`contacts/`)

#### A. Pliki i liczba linii
| Plik | Liczba linii | Status GEMINI.md | Uwagi |
|---|---|---|---|
| `ContactsSection.tsx` | 152 | Zgodny (<400) | Główny widok modułu kontaktów |
| `ContactDialog.tsx` | 322 | Zgodny (<400) | Modal dodawania/edycji kontaktu |
| `components/ContactsStatsHeader.tsx` | 90 | Zgodny (<400) | Karty KPI (wszystkie, koordynatorzy, telefon, email) |
| `components/ContactsFilterBar.tsx` | 100 | Zgodny (<400) | Pasek wyszukiwania i filtrów |
| `components/ContactsTableView.tsx` | 211 | Zgodny (<400) | Główna tabela książki kontaktów |

#### B. Pasek filtrów (Filter Bar)
- **`ContactsFilterBar.tsx` (linie 46–73):**  
  Oba filtry rozwijane są zaimplementowane jako surowe tagi HTML:
  ```tsx
  {/* Stanowisko */}
  <select
    value={positionFilter}
    onChange={(e) => onPositionFilterChange(e.target.value)}
    className="h-9 rounded-[3px] border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
  >
    <option value="all">Wszystkie stanowiska</option>
    {positions.map((p) => <option key={p} value={p}>{p}</option>)}
  </select>

  {/* Gmina */}
  <select
    value={muniFilter}
    onChange={(e) => onMuniFilterChange(e.target.value)}
    className="h-9 rounded-[3px] border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
  >
    <option value="all">Wszystkie gminy</option>
    {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
  </select>
  ```
  **Wymagana zmiana:** Zastąpienie obu tagów komponentem `<Select size="sm">` z `@/components/ui/select`.  
  **Quick-filter chips:** Dodać rząd chipów szybkiego filtrowania ról: *Wszystkie*, *Koordynatorzy*, *Dyrektorzy*, *Pedagodzy* oraz chipy gmin.  
  **Wyszukiwarka:** Dodać przycisk czyszczenia `X`.

#### C. Interakcja z wierszem tabeli i izolacja akcji (Row Click & Action Isolation)
- **`ContactsTableView.tsx` (linia 200):**  
  Komponent `<DataTable>` nie posiada `onRowClick` ani `rowClassName`.  
  **Wymagane:**
  ```tsx
  onRowClick={(row) => onEdit(row)}
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
  ```
- **Komórka akcji (linie 144–175):**  
  Kontener akcji nie blokuje propagacji (`onClick={(e) => e.stopPropagation()}`). Przyciski `Edit` i `Trash2` nie wywołują `e.stopPropagation()`. (Uwaga: przycisk kopiowania emaila na linii 108 poprawnie wywołuje `e.stopPropagation()`). Konieczne jest dodanie blokady propagacji w komórce akcji i obu przyciskach operacyjnych.

#### D. Zawijanie tekstu (Text Wrapping)
- **`name` (linie 38–49):** W `max-w-[240px]` pole `notes` używa `truncate`. Należy ujednolicić do `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` wraz z `title={row.name}`.
- **`facilityName` (linie 78–90):**  
  Jawne użycie `truncate`:
  ```tsx
  <div className="flex items-center gap-1 font-medium text-neutral-800 dark:text-neutral-200">
    <Building2 className="size-3 text-neutral-400 shrink-0" />
    <span className="truncate">{row.facilityName || "Placówka nieokreślona"}</span>
  </div>
  {row.municipality && (
    <p className="text-[11px] text-neutral-500 truncate dark:text-neutral-400 mt-0.5">
      Gmina: {row.municipality}
    </p>
  )}
  ```
  Obcina nazwy szkół. Należy zastosować układ `items-start mt-0.5` dla ikony i `line-clamp-2 break-words leading-tight` dla nazwy placówki z atrybutem `title`.

#### E. Zwijany nagłówek KPI (Collapsible KPI Header)
- **`ContactsSection.tsx` (linie 114–119):** `<ContactsStatsHeader>` jest wyświetlany na stałe.
- **Wymagana implementacja:**
  - Stan `showKpiSummary` inicjalizowany z `localStorage.getItem("oz.contactsShowKpiSummary")`.
  - Klucz `localStorage`: `"oz.contactsShowKpiSummary"`.
  - Przycisk toggle ("Zwiń KPI" / "Pokaż KPI" z `ChevronUp`/`ChevronDown`) w `ContactsFilterBar.tsx` obok przycisku "Nowy Kontakt".

#### F. Integracja z modal store
- Otwieranie edytora/dodawania: `openModal("contact", { item: contact })` oraz `openModal("contact")`.
- Dialog `ContactDialog.tsx` jest zmapowany w `CoreEntityModals.tsx`.

---

### Moduł 4: Dziennik Korespondencji i Pism (`letters/`)

#### A. Pliki i liczba linii
| Plik | Liczba linii | Status GEMINI.md | Uwagi |
|---|---|---|---|
| `LettersSection.tsx` | 206 | Zgodny (<400) | Główny widok ewidencji pism |
| `LetterDialog.tsx` | 209 | Zgodny (<400) | Modal rejestracji/edycji pisma |
| `components/LetterHeaderKancelariaCard.tsx` | 105 | Zgodny (<400) | Karta znaku pisma i kierunku |
| `components/LetterEntityRelationFields.tsx` | 233 | Zgodny (<400) | Relacje placówki, programu, sprawy JRWA |

#### B. Pasek filtrów (Filter Bar)
- **`LettersSection.tsx` (linie 176–184):**  
  Filtr kierunku pism używa surowego HTML:
  ```tsx
  <select
    value={directionFilter}
    onChange={(e) => setDirectionFilter(e.target.value)}
    className="h-8 px-2 rounded-[2px] border border-input bg-background text-xs text-foreground font-medium"
  >
    <option value="all">Wszystkie pisma</option>
    <option value="wychodzace">Tylko Wychodzące</option>
    <option value="przychodzace">Tylko Przychodzące</option>
  </select>
  ```
  **Wymagana zmiana:** Zastąpić komponentem `<Select size="sm">` z `@/components/ui/select`.  
  **Quick-filter chips:** Dodać chipy szybkiego wyboru: *Wszystkie pisma*, *Wychodzące*, *Przychodzące* ze stylizacją aktywną `bg-primary text-primary-foreground` i nieaktywną `bg-muted/40`.  
  **Wyszukiwarka:** Dodać przycisk czyszczenia `X`.

#### C. Interakcja z wierszem tabeli i izolacja akcji (Row Click & Action Isolation)
- **`LettersSection.tsx` (linia 193):**  
  Komponent `<DataTable>` nie posiada `onRowClick` ani `rowClassName`.  
  **Wymagane:**
  ```tsx
  onRowClick={(row) => onOpenEdit(row)}
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
  ```
- **Komórka akcji (linie 128–155):**  
  Kontener komórki posiada `onClick={(e) => e.stopPropagation()}`, co jest dobrą praktyką, jednak same przyciski `Edit` i `Trash2` (linie 132 i 144) powinny w swoich handlerach również wywoływać `e.stopPropagation()`.

#### D. Zawijanie tekstu (Text Wrapping)
- **`subject` (linie 88–93):**
  ```tsx
  <div className="flex flex-col">
    <span className="font-bold text-foreground leading-snug">{row.subject}</span>
    <span className="text-[11px] text-muted-foreground">{row.senderRecipient}</span>
  </div>
  ```
  Brakuje `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`, brakuje atrybutu `title={row.subject}` oraz zawijania i atrybutu `title` dla `senderRecipient`.
- **`assigned` (linia 109):** Stosuje `truncate` bez `title`.

#### E. Zwijany nagłówek KPI (Collapsible KPI Header)
- **`LettersSection.tsx` obecnie NIE posiada żadnego nagłówka statystyk KPI.**
- **Wymagana implementacja:**
  - Utworzenie zwięzłego komponentu kart statystyk (np. `components/LettersStatsHeader.tsx` wzorem pozostałych modułów), prezentującego:
    1. Wszystkie Pisma (`letters.length`)
    2. Pisma Wychodzące (`wychodzace`)
    3. Pisma Przychodzące (`przychodzace`)
    4. Pisma z Przypisaną Sprawą JRWA (`withCaseSign`)
  - Stan `showKpiSummary` w `LettersSection.tsx` z zapisem w `localStorage` pod kluczem `"oz.lettersShowKpiSummary"`.
  - Przycisk toggle ("Zwiń KPI" / "Pokaż KPI" z `ChevronUp`/`ChevronDown`) umieszczony w górnym pasku obok przycisku "Zarejestruj Pismo Urzędowe".

#### F. Integracja z modal store
- Otwieranie edytora/nowego pisma: `openModal("letter")` oraz `openModal("letter", { item: letter })`.
- Modal `LetterDialog.tsx` jest zintegrowany w `RegistryAdminModals.tsx`.

---

## 3. Analiza Wymagania R5: Test Cleanliness i Ostrzeżenie React DOM

### Problem:
W trakcie wykonywania testów komponentów (np. `staffComponents.test.tsx` oraz innych testów renderujących formularze z autouzupełnianiem) w konsoli pojawia się ostrzeżenie:
```
stderr | src/features/ozipz/components/staff/staffComponents.test.tsx > Staff Module Components > StaffDialog > renders modal in create mode
React does not recognize the `searchPlaceholder` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `searchplaceholder` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

### Przyczyna źródłowa (Root Cause):
W pliku `src/components/ui/autocomplete.tsx`:
1. Na linii 34 w interfejsie `AutocompleteProps` zdefiniowano właściwość `searchPlaceholder?: string;`.
2. Na liniach 66–96, podczas destrukturyzacji parametrów komponentu `Autocomplete`, właściwość `searchPlaceholder` **nie została wyciągnięta**:
   ```tsx
   export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
     (
       {
         value = "",
         onChange,
         onSelectOption,
         options,
         placeholder = "Wpisz lub wybierz z listy...",
         clearable = true,
         allowCustomValue = true,
         highlightMatches = true,
         maxSuggestions = 500,
         loading = false,
         error,
         className,
         inputClassName,
         dropdownClassName,
         size = "md",
         label,
         helperText,
         id,
         name,
         required,
         disabled,
         autoFocus,
         emptyText = "Brak podpowiedzi",
         createLabelPrefix = "Użyj wartości:",
         onCreateOption,
         startIcon: StartIcon,
         onBlur,
         onFocus,
         onKeyDown,
         ...restInputProps // <-- searchPlaceholder wpada tutaj!
       },
       ref
     )
   ```
3. Na linii 375 obiekt `restInputProps` jest przekazywany bez filtracji do natywnego elementu `<input>`:
   ```tsx
   <input
     ref={combinedRef}
     id={inputId}
     name={name}
     type="text"
     value={inputValue}
     ...
     {...restInputProps} // <-- searchPlaceholder trafia do DOM!
   />
   ```

### Rozwiązanie:
Wyciągnięcie `searchPlaceholder: _searchPlaceholder` w parametrach `Autocomplete` (lub jego celowe użycie wewnątrz komponentu, jeśli jest potrzebne), tak aby nie trafiał do `...restInputProps`.

### Uwaga do testów jednostkowych pism:
W pliku `src/features/ozipz/components/letters/lettersComponents.test.tsx` na linii 86 test wyszukuje element `screen.getByRole("combobox")` dla natywnego `<select>`. Po zastąpieniu go komponentem Design System `<Select size="sm">`, testy wymagają dostosowania do nowego komponentu (który ma `role="button"` z `aria-haspopup="listbox"` lub do wyboru przez chipy szybkiego filtrowania).

---

## 4. Macierz Rekomendacji dla Implementacji (Plan Zadań)

| Moduł | R1: Filter Bar & Select | R2: DataTable onRowClick & stopPropagation | R3: Multi-line Wrapping & Tooltips | R4: Collapsible KPI & LocalStorage |
|---|---|---|---|---|
| **Materiały** (`materials/`) | 1. `MaterialsCatalogTab`: Zastąpić `<select>` przez `<Select size="sm">`. Dodać quick-chips typów materiałów.<br>2. `MaterialsDistributionsTab`: Dodać filtr gminy `<Select size="sm">` i quick-chips gmin.<br>3. Wyszukiwarki: dodać przyciski `X`. | 1. Obie tabele: dodać `onRowClick={(row) => onEdit(row)}` oraz `rowClassName`.<br>2. Zabezpieczyć przyciski (`Plus`, `Edit`, `Trash2`, `Printer`) przez `e.stopPropagation()`. | 1. `title` w Katalogu: `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` + `title`.<br>2. `recipientName` w Rozdzielnikach: zastąpić `truncate` zawijaniem `line-clamp-2` + `title`. | 1. Dodać stan `showKpiSummary` w `MaterialsSection`.<br>2. Klucz: `oz.materialsShowKpiSummary`.<br>3. Dodać przycisk toggle do `MaterialsViewSwitcher`. |
| **Rejestry** (`registers/`) | Dodać rząd quick-filter chips w `RegistersFilterBar` (czas: *Bieżący rok*, *Ostatni miesiąc*; JRWA: top symbole ze słownika). | Dodać `rowClassName` do tabel: `InformationRegisterTable`, `PublicationsRegisterTable`, `VisitationsRegisterTable`. (`onRowClick` już istnieje). | We wszystkich 3 tabelach: kolumny `subject` / `topic` oraz `leadEducator` wyposażyć w `line-clamp-2 break-words leading-tight` oraz atrybuty `title`. | 1. Dodać stan `showKpiSummary` w `RegistersSection`.<br>2. Klucz: `oz.registersShowKpiSummary`.<br>3. Dodać toggle w `RegistersTypeTabs` lub nagłówku sekcji. |
| **Kontakty** (`contacts/`) | 1. `ContactsFilterBar`: Zastąpić 2 tagi `<select>` (stanowisko, gmina) przez `<Select size="sm">`.<br>2. Dodać quick-chips stanowisk i gmin.<br>3. Dodać przycisk `X`. | 1. `ContactsTableView`: dodać `onRowClick={(row) => onEdit(row)}` oraz `rowClassName`.<br>2. Dodać `e.stopPropagation()` w komórce akcji i przyciskach `Edit`/`Trash2`. | 1. `name`: `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` + `title`.<br>2. `facilityName`: usunąć `truncate`, zastąpić zawijaniem 2-wierszowym z `title`. | 1. Dodać stan `showKpiSummary` w `ContactsSection`.<br>2. Klucz: `oz.contactsShowKpiSummary`.<br>3. Dodać toggle w `ContactsFilterBar` obok "Nowy Kontakt". |
| **Pisma** (`letters/`) | 1. `LettersSection`: Zastąpić `<select>` kierunku przez `<Select size="sm">`.<br>2. Dodać quick-chips kierunku (*Wszystkie*, *Wychodzące*, *Przychodzące*).<br>3. Dodać przycisk `X`. | 1. `LettersSection`: dodać `onRowClick={(row) => onOpenEdit(row)}` oraz `rowClassName`.<br>2. Dodać `e.stopPropagation()` w handlerach przycisków `Edit` i `Trash2`. | 1. `subject`: `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` + `title`.<br>2. `senderRecipient`: `title` + zawijanie.<br>3. `assigned`: `title`. | 1. Utworzyć `LettersStatsHeader.tsx` z 4 kartami KPI.<br>2. Dodać stan `showKpiSummary` z kluczem `oz.lettersShowKpiSummary`.<br>3. Dodać toggle w toolbarze pism. |
| **Globalne** (`src/components/ui/`) | Wyeliminować przekazywanie `searchPlaceholder` do natywnego `<input>` w `src/components/ui/autocomplete.tsx`. | Zapewnić 100% zgodności testów jednostkowych i kompilacji TypeScript. | - | - |
