# Raport Badawczy: Analiza Wzorców Referencyjnych UX/UI i Design Systemu (Actions, Facilities, Programs)

Data opracowania: 2026-09-05  
Status: Zweryfikowany empirycznie w kodzie i testach jednostkowych (Vitest 524 testy zaliczone)  
Lokalizacja: `.agents/core_explorer_refs/report.md`  
Cel: Standaryzacja modułów Materiały Oświatowe, Rejestry Urzędowe, Spis Kontaktów oraz Dziennik Pism Urzędowych w projekcie Ewidencja OZiPZ.

---

## 1. Wstęp i Podsumowanie Ustaleń

Zgodnie z wymaganiami zadania i wytycznymi z `ORIGINAL_REQUEST.md` oraz `GEMINI.md`, przeprowadzono szczegółową, tylko-do-odczytu analizę implementacji wzorcowych komponentów w modułach:
- **Działania** (`src/features/ozipz/components/actions/`)
- **Placówki** (`src/features/ozipz/components/facilities/`)
- **Programy profilaktyczne i Zgłoszenia szkół** (`src/features/ozipz/components/programs/`)

Analiza objęła 5 kluczowych obszarów wzorców projektowych:
1. Zastosowanie Design System `<Select size="sm">` z `@/components/ui/select` w paskach filtrów.
2. Konstrukcja, tokeny kolorystyczne i obsługa kliknięć chipów szybkich filtrów (*quick-filter chips*).
3. Implementacja zwijanych nagłówków statystyk/KPI ze stanem zapisanym w `localStorage` (wzorzec klucza `oz.*`).
4. Konfiguracja komponentu `<DataTable>` z `onRowClick` oraz pełną izolacją akcji wiersza przez `e.stopPropagation()`.
5. Dwuliniowe zawijanie tekstu (`min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`) z atrybutem `title` i pozycjonowaniem ikon `items-start`.
6. *(Ustalenie dodatkowe)* Identyfikacja i eliminacja ostrzeżenia React DOM `searchPlaceholder` na natywnych elementach DOM.

---

## 2. Wzorzec 1: Komponent `<Select size="sm">` z `@/components/ui/select` w Paskach Filtrów

### A. Anatomia i Właściwości Komponentu `Select`
Plik źródłowy: `src/components/ui/select.tsx` (oraz alias `SearchableSelect`).
Komponent udostępnia zaawansowaną listę wyboru zgodną z WCAG i Design Systemem aplikacji:
- **Typy opcji**: `SelectOptionInput = string | SelectOption`, gdzie `SelectOption` posiada strukturę:
  ```typescript
  export interface SelectOption {
    value: string;
    label: string;
    description?: string;
    group?: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
    disabled?: boolean;
  }
  ```
- **Rozmiar `size="sm"`**:
  - Klasy przycisku wyzwalacza (trigger): `h-7 text-xs px-2 py-1 gap-1.5`.
  - Doskonale integruje się z paskami narzędziowymi o wysokości `h-9` lub `h-8`.
- **Wyszukiwarka wewnętrzna**:
  - `searchable`: domyślnie `true`. Wzorzec referencyjny wyłącza ją dla krótkich list (`searchable={false}` lub `searchable={items.length > 5}`).
  - `searchPlaceholder`: opcjonalny string (np. `"Szukaj programu...", "Wszystkie gminy"`).
- **Czyszczenie wartości**:
  - `clearable={true}` dodaje ikonę krzyżyka `X` umożliwiającą szybki reset do pustego ciągu `""`.

### B. Wzorzec Integracji w Toolbarze Filtrów
W modułach referencyjnych (`SchoolParticipationsFilterBar.tsx`, `FacilitiesFilterBar.tsx`, `ActionsFilterBar.tsx`) selektory są zamykane w kontenerach o stałej szerokości (`w-40`, `w-44`, `w-48`, `w-52`, `w-56`), co zapobiega skakaniu układu podczas renderowania:

```tsx
// Przykład z SchoolParticipationsFilterBar.tsx:
import { Select } from "@/components/ui/select";

<div className="w-56">
  <Select
    value={selectedProgramId}
    onChange={(val) => onProgramChange(val || "all")}
    options={[
      { value: "all", label: "Wszystkie programy" },
      ...programs.map((p) => ({ value: p.id, label: p.name })),
    ]}
    searchable={programs.length > 5}
    size="sm"
    placeholder="Wszystkie programy"
  />
</div>
```

### C. Stan w Docelowych Modułach vs Wzorzec Referencyjny
| Moduł | Aktualny stan selektorów | Wymagana zmiana |
|---|---|---|
| **Spis kontaktów** (`ContactsFilterBar.tsx`) | Używa natywnych `<select>` dla stanowisk i gmin (linie 46-73). | Zastąpić przez `<Select size="sm">` z opcjami `{ value: "all", label: "Wszystkie stanowiska" }`. |
| **Materiały oświatowe** (`MaterialsCatalogTab.tsx`) | Używa natywnego `<select>` dla typów materiałów (linie 186-198). | Zastąpić przez `<Select size="sm">` z `materialTypes`. |
| **Dziennik pism** (`LettersSection.tsx`) | Używa natywnego `<select>` dla kierunku pism (linie 176-184). | Zastąpić przez `<Select size="sm">` z opcjami "Wszystkie", "Wychodzące", "Przychodzące". |
| **Rejestry** (`RegistersFilterBar.tsx`) | Używa `<Select>` i `<SearchableSelect>`, lecz w sztywnym gridzie 5-kolumnowym. | Dopasować do spójnego układu flexbox `h-9` z paskiem akcji. |

---

## 3. Wzorzec 2: Chipy Szybkich Filtrów (*Quick-Filter Chips*)

### A. Struktura Kontenera i Tokeny Klas
Wzorzec referencyjny wypracowany w `SchoolParticipationsFilterBar.tsx` (linie 147-194) oraz `FacilitiesFilterBar.tsx` (linie 146-170) stosuje jednolity pasek chipów:

```tsx
<div className="flex flex-wrap items-center gap-1.5 text-xs select-none">
  <span className="text-[11px] font-semibold text-muted-foreground mr-1">
    Szybkie filtry:
  </span>

  {QUICK_FILTER_OPTIONS.map((opt) => {
    const isActive = currentFilter === opt.id;
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => onFilterChange(opt.id)}
        className={
          isActive
            ? "bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none"
            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer"
        }
      >
        {opt.label}
        {opt.count !== undefined && (
          <span className="opacity-90 ml-1">({opt.count})</span>
        )}
      </button>
    );
  })}
</div>
```

### B. Standard Tokenów
1. **Stan Aktywny (Selected)**:
   - Tło i tekst: `bg-primary text-primary-foreground`
   - Obramowanie: `border border-primary`
   - Typografia: `font-semibold text-[11px]`
   - Zaokrąglenie: `rounded-[3px]`
   - Cień: `shadow-none`
2. **Stan Nieaktywny (Default / Hover)**:
   - Tło i tekst: `bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground`
   - Obramowanie: `border border-border`
   - Typografia: `font-medium text-[11px]`
   - Kursor: `cursor-pointer`
3. **Logika Przełączania (Click Handlers)**:
   - **Jednokrotny wybór wariantu (Enum / Status)**: `onClick={() => setFilter(opt.id)}`
   - **Przełącznik toggle (np. Gmina, Kategoria)**:
     `onClick={() => onMunicipalityChange(isActive ? "all" : muni)}` (kliknięcie aktywnego chipa cofa filtr do `"all"`).
   - **Filtry logiczne (Boolean)**: `onClick={() => setQuickFilter((prev) => !prev)}`.

---

## 4. Wzorzec 3: Zwijane Nagłówki Statystyk i KPI z Trwałością w `localStorage`

### A. Standard Nazewnictwa Kluczy `localStorage`
Aplikacja Ewidencja OZiPZ stosuje ujednolicony prefiks `oz.*`:
- Działania: `oz.showKpiSummary`
- Placówki: `oz.facilitiesShowKpiSummary`
- Programy: `oz.programsShowKpiSummary`
- **Docelowo dla pozostałych modułów**:
  - Materiały: `oz.materialsShowKpiSummary`
  - Rejestry: `oz.registersShowKpiSummary`
  - Kontakty: `oz.contactsShowKpiSummary`
  - Pisma: `oz.lettersShowKpiSummary`

### B. Odporność na Błędy Przeglądarki (*Storage Resilience*)
Testy adversariowe (`programsAdversarialChallenge.test.tsx`, wyzwanie 6) weryfikują odporność na błędy `SecurityError` (tryb incognito/iFrame) oraz `QuotaExceededError`:

```typescript
// Hook stanu z bezpieczną inicjalizacją:
const [showKpiSummary, setShowKpiSummary] = useState<boolean>(() => {
  try {
    const saved = localStorage.getItem("oz.programsShowKpiSummary");
    if (saved !== null) return saved === "true";
  } catch {
    // Graceful fallback w przypadku restrykcyjnych uprawnień przeglądarki
  }
  return true; // Domyślnie rozwinięte
});

// Callback przełączania z bezpiecznym zapisem:
const toggleKpiSummary = useCallback(() => {
  setShowKpiSummary((prev) => {
    const next = !prev;
    try {
      localStorage.setItem("oz.programsShowKpiSummary", String(next));
    } catch {
      // Ignorowanie błędów zapisu (np. QuotaExceededError)
    }
    return next;
  });
}, []);
```

### C. Przycisk Przełącznika KPI (ARIA i Etykieta)
Przycisk umieszczany jest w pasku filtrów (`FilterBar`) lub przełączniku widoków (`ViewSwitcher`):
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={onToggleKpi}
  className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
  title={isKpiVisible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"}
  aria-expanded={isKpiVisible}
  aria-label={isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}
>
  {isKpiVisible ? (
    <ChevronUp className="size-3.5 text-muted-foreground" />
  ) : (
    <ChevronDown className="size-3.5 text-muted-foreground" />
  )}
  <span>{isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}</span>
</Button>
```

---

## 5. Wzorzec 4: Konfiguracja `<DataTable>`, `onRowClick` i Izolacja Zdarzeń (`e.stopPropagation()`)

### A. Mechanizm Działania `onRowClick` w `<DataTable>`
W pliku `src/components/ui/data-table/data-table-row.tsx`:
```tsx
<tr
  onClick={() => onRowClick?.(item)}
  className={cn(
    "border-b border-border/60 transition-colors text-xs group",
    index % 2 === 1 ? "bg-muted/10" : "bg-card",
    isSelected && "bg-primary/5 dark:bg-primary/10",
    onRowClick && "cursor-pointer hover:bg-muted/40",
    !onRowClick && "hover:bg-muted/20",
    customClass
  )}
>
```
Przekazanie propu `onRowClick={(row) => onEdit(row)}` automatycznie aktywuje kursor wskaźnika (`cursor-pointer`) oraz podświetlenie hover wiersza (`hover:bg-muted/40`).

Dodatkowo w widokach referencyjnych jawnie przekazuje się `rowClassName`:
```tsx
<DataTable
  data={filteredData}
  columns={columns}
  keyExtractor={(item) => item.id}
  onRowClick={(row) => onEdit(row)}
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
  enablePagination
  defaultPageSize={25}
  pageSizeOptions={[15, 25, 50, 100]}
/>
```

### B. Podwójna Izolacja Zdarzeń (*Event Bubbling Shield*)
Aby kliknięcie w przycisk akcji (Edycja, Usunięcie, Druk, Kopiuj, Link mailowy) nie wywoływało zdarzenia `onRowClick` wiersza, stosuje się dwupoziomowe zabezpieczenie:
1. **Poziom kontenera komórki akcji**:
   `<div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>`
2. **Poziom każdego przycisku i linku**:
   ```tsx
   <Button
     variant="ghost"
     size="sm"
     aria-label="Edytuj zgłoszenie"
     onClick={(e) => {
       e.stopPropagation();
       onEdit(row);
     }}
     className="h-7 w-7 p-0 text-neutral-500 hover:text-neutral-900 cursor-pointer"
   >
     <Edit className="size-3.5" />
   </Button>
   ```
3. **Dla linków `mailto:` i numerów telefonów**:
   ```tsx
   <a
     href={`mailto:${row.email}`}
     onClick={(e) => e.stopPropagation()}
     className="hover:underline truncate max-w-[180px]"
   >
     {row.email}
   </a>
   ```

---

## 6. Wzorzec 5: Dwuliniowe Zawijanie Kolumn Tekstowych i Ergonomia Układu

### A. Defekt Pojedynczego `truncate`
Tradycyjna klasa `truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`) ucina wielowyrazowe polskie nazwy szkół, przedszkoli, tematów prelekcji i tytułów broszur po kilku słowach. Użytkownik widzi jedynie `Szkoła Podstawowa z Oddziałami...` bez informacji o numerze czy miejscowości.

### B. Złoty Standard Wieloliniowego Zawijania
Zaimplementowany w `SchoolParticipationsTab.tsx` (linie 121-140) oraz `FacilitiesTableView.tsx` (linie 51-67):

```tsx
{
  id: "facilityName",
  header: "Placówka Edukacyjna",
  accessorKey: "facilityName",
  sortable: true,
  cell: ({ row }) => {
    const titleText = row.facilityName || "Brak nazwy";
    return (
      <div className="min-w-[200px] max-w-[340px] space-y-0.5">
        <div className="flex items-start gap-1.5 font-medium text-xs text-neutral-900 dark:text-neutral-100">
          <Building2 className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <span
            className="line-clamp-2 break-words leading-tight"
            title={titleText}
          >
            {titleText}
          </span>
        </div>
        {row.municipality && (
          <p
            className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-5 truncate"
            title={`Gmina: ${row.municipality}`}
          >
            Gmina: {row.municipality}
          </p>
        )}
      </div>
    );
  },
}
```

### C. Kluczowe Zasady Techniczne:
1. **Ograniczniki szerokości kolumny**: `min-w-[200px] max-w-[340px]` zapobiegają zarówno ściśnięciu kolumny do nieczytelnego paska, jak i zdominowaniu całej tabeli kosztem innych kolumn.
2. **Kombinacja klas Tailwind**:
   - `line-clamp-2`: ogranicza tekst do dokładnie maksymalnie 2 linii z trzykropkiem.
   - `break-words`: gwarantuje poprawne łamanie długich słów i myślników.
   - `leading-tight`: optymalizuje wysokość linii, zachowując kompaktowość wiersza tabeli.
3. **Bezwzględny zakaz `truncate` na elemencie zawijanym**: Klasa `truncate` zawiera `white-space: nowrap`, co unieważnia `line-clamp-2`! `truncate` może być stosowane jedynie na drugorzędnych jedno-wierszowych dopiskach (np. gmina, telefon).
4. **Wyrównanie ikony**: `flex items-start gap-1.5` z ikoną posiadającą `shrink-0 mt-0.5`. Dzięki temu przy zawinięciu tekstu do dwóch linii ikona pozostaje przyklejona do górnej linii tekstu, a nie przeskakuje na środek.
5. **Dostępność i Pełny Podgląd**: Atrybut `title={titleText}` pozwala odczytać pełną nazwę po najechaniu kursorem myszy.

---

## 7. Dodatkowe Ustalenie Techniczne: Ostrzeżenie React DOM `searchPlaceholder`

### A. Identyfikacja Źródła Ostrzeżenia
W trakcie weryfikacji logów konsoli testów (`npm test`) wykryto powtarzające się ostrzeżenie React:
> `React does not recognize the searchPlaceholder prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase searchplaceholder instead. If you accidentally passed it from a parent component, remove it from the DOM element.`
> Występuje m.in. w `LetterDialog` (przez `LetterEntityRelationFields`), `StaffDialog`, `FacilityAddressFields`.

### B. Przyczyna w Komponencie `Autocomplete`
W pliku `src/components/ui/autocomplete.tsx`:
- Interfejs `AutocompleteProps` rozszerza `React.InputHTMLAttributes<HTMLInputElement>` i deklaruje opcjonalne pole `searchPlaceholder?: string;`.
- Jednakże w sygnaturze komponentu `Autocomplete` (linie 66-97) właściwość `searchPlaceholder` **nie jest destrukturyzowana**.
- W rezultacie trafia ona do obiektu `...restInputProps` i w linii 375 jest przekazywana bezpośrednio do natywnego znacznika `<input {...restInputProps} />`.

### C. Rekomendowane Rozwiązanie dla Zespołu Implementacyjnego
1. W pliku `src/components/ui/autocomplete.tsx` dodać `searchPlaceholder` do listy destrukturyzowanych parametrów (wykluczając go z `...restInputProps`).
2. W formularzach dialogowych nie przekazywać `searchPlaceholder` do natywnych `<input>` ani `<select>`. W Design System `<Select size="sm">` parametr `searchPlaceholder` jest obsługiwany poprawnie i bezpiecznie.

---

## 8. Macierz Porównawcza i Plan Implementacyjny dla 4 Modułów Docelowych

| Wymóg | Moduł Referencyjny (Actions / Facilities / Programs) | Materiały Oświatowe (`materials/`) | Rejestry Urzędowe (`registers/`) | Spis Kontaktów (`contacts/`) | Dziennik Pism (`letters/`) |
|---|---|---|---|---|---|
| **R1. Design System Select** | `<Select size="sm">` w flex wrapperach (`w-40` do `w-56`) | Zamienić `<select>` typu na `<Select size="sm">` | Zreorganizować grid do spójnego paska flex | Zamienić natywne `<select>` stanowisk i gmin na `<Select size="sm">` | Zamienić natywny `<select>` kierunku na `<Select size="sm">` |
| **R2. Quick-Filter Chips** | `bg-primary text-primary-foreground` vs `bg-muted/40` | Dodać chipy typów i stanu (Wszystkie, Broszury, Plakaty, Pomoce) | Dodać chipy lat/miesięcy i rodzajów (Bieżący rok, Wszystkie, Programowe) | Dodać chipy stanowisk (Wszystkie, Koordynatorzy, Dyrektorzy) oraz gmin | Dodać chipy kierunku (Wszystkie, Wychodzące, Przychodzące) |
| **R3. Collapsible KPI** | Przycisk `Zwiń KPI` / `Pokaż KPI` z `ChevronUp/Down`, klucz `oz.*` | Dodać toggle w `MaterialsViewSwitcher`, klucz `oz.materialsShowKpiSummary` | Dodać toggle w `RegistersFilterBar`, klucz `oz.registersShowKpiSummary` | Dodać toggle w `ContactsFilterBar`, klucz `oz.contactsShowKpiSummary` | Stworzyć `LettersStatsHeader` + toggle, klucz `oz.lettersShowKpiSummary` |
| **R4. DataTable onRowClick & stopPropagation** | `onRowClick={(row) => onEdit(row)}`, `onClick={(e) => e.stopPropagation()}` | Dodać `onRowClick` w Catalog i Distributions, zabezpieczyć akcje | Dodać `onRowClick` we wszystkich 3 tabelach rejestrów | Dodać `onRowClick` i `stopPropagation` na przyciskach i mailach | Dodać `onRowClick` i `stopPropagation` na Edit i Delete |
| **R5. Multi-line Wrapping** | `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight title={...}` | Zastąpić `truncate` w tytule materiału i odbiorcy rozdzielnika | Zastosować w kolumnie Przedmiot sprawy i Tematyka | Zastosować w imieniu/nazwisku, placówce i roli | Zastosować w temacie pisma i nadawcy/odbiorcy |

---

## 9. Podsumowanie Wniosków

Wzorce wypracowane w Actions, Facilities i Programs stanowią kompletny, spójny i przetestowany system UX/UI. Ich bezpośrednia transpozycja do modułów Materiałów, Rejestrów, Kontaktów i Pism zapewni 100% harmonizację aplikacji, doskonałą ergonomię pracy na laptopach (oszczędność przestrzeni pionowej dzięki zwijanym KPI) oraz pełną odporność na błędy zdarzeń interfejsu (brak duplikatów modali dzięki izolacji propagacji zdarzeń).
