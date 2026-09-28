# Raport Eksploratora 3 — Badanie Interakcji Wierszy, Izolacji Zdarzeń, Renderowania i Strategii Testów (R1–R4)

**Data i czas badania**: 2026-09-03T17:26:00+02:00  
**Rola**: Explorer 3 (Codebase Researcher)  
**Środowisko i narzędzia**: TypeScript Strict Mode, React 18, Vite, Vitest 3.2.7, @testing-library/react, Tailwind CSS  
**Kluczowe pliki w zakresie**:
- `src/components/ui/data-table.tsx` oraz `src/components/ui/data-table/data-table-row.tsx`
- `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx`
- `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`
- `src/features/ozipz/components/programs/ProgramsSection.tsx`
- `src/features/ozipz/components/programs/components/ProgramsStatsHeader.tsx`
- `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`
- `src/features/ozipz/components/programs/components/programsComponents.test.tsx`
- `src/features/ozipz/components/programs/programs.test.ts`
- Moduły referencyjne: `src/features/ozipz/components/facilities/` (`FacilitiesTableView.tsx`, `FacilitiesFilterBar.tsx`, `facilitiesComponents.test.tsx`)

---

## 1. Analiza Komponentu DataTable i Obsługi `onRowClick`

### 1.1. Istniejąca obsługa w architekturze `DataTable`
Komponent generyczny `DataTable` (`src/components/ui/data-table.tsx`) oraz wewnętrzny wiersz `DataTableRow` (`src/components/ui/data-table/data-table-row.tsx`) **już posiadają natywne wsparcie dla `onRowClick`**:

```tsx
// src/components/ui/data-table/data-table-row.tsx (linie 42-51)
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

### 1.2. Zachowanie stylów i kursora
- **Gdy przekazano `onRowClick`**:
  - `onRowClick && "cursor-pointer hover:bg-muted/40"` — wiersz automatycznie zyskuje kursor `pointer` oraz aktywny podświetlacz tła `hover:bg-muted/40`.
  - Kliknięcie w dowolne miejsce wiersza `<tr>` (niebędące elementem blokującym propagację) wywołuje przekazany callback `onRowClick(item)`.
- **Gdy `onRowClick` nie został przekazany (`undefined`)**:
  - `!onRowClick && "hover:bg-muted/20"` — standardowy hover, brak kursora `cursor-pointer`.
- **Opcjonalny `rowClassName`**:
  - Wzorzec z `FacilitiesTableView.tsx` dodatkowo przekazuje: `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}`.

### 1.3. Istniejące zatrzymywanie propagacji w `DataTableRow`
W samym `DataTableRow`:
- Komórka checkboxa selekcji (`selectable`) posiada już:
  ```tsx
  onClick={(e) => {
    e.stopPropagation();
    onToggleSelectRow(rowKey);
  }}
  ```
- Komórka ikony rozwijania podwiersza (`hasExpandable`) posiada:
  ```tsx
  onClick={(e) => {
    e.stopPropagation();
    onToggleRow(rowKey);
  }}
  ```
- **Kluczowa obserwacja**: Standardowe komórki kolumn renderowane przez `col.cell({ row, ... })` **nie posiadają żadnej automatycznej bariery propagacji zdarzeń**. Jeśli cokolwiek klikalnego (przycisk, link, menu) znajduje się w definicji komórki `col.cell`, zdarzenie `click` naturalnie propaguje (bąbelkuje) w górę drzewa DOM do `<tr>`, chyba że dany element wywoła `e.stopPropagation()`.

---

## 2. Badanie `SchoolParticipationsTab.tsx` oraz `ProgramsCatalogTab.tsx`

### 2.1. `SchoolParticipationsTab.tsx` — Stan Bieżący
- **Wywołanie `DataTable` (linie 285–292)**:
  ```tsx
  <DataTable
    data={filteredParticipations}
    columns={columns}
    keyExtractor={(item) => item.id}
    enablePagination
    defaultPageSize={25}
    pageSizeOptions={[15, 25, 50, 100]}
  />
  ```
  **Wada**: Brak `onRowClick={(row) => onEdit(row)}`! Użytkownik nie może kliknąć w wiersz, aby edytować zgłoszenie.
- **Kolumna `facilityName` (linie 87–99)**:
  ```tsx
  cell: ({ row }) => (
    <div className="max-w-[280px]">
      <div className="flex items-center gap-1 font-medium text-xs text-neutral-900 dark:text-neutral-100">
        <Building2 className="size-3 text-neutral-400 shrink-0" />
        <span className="truncate">{row.facilityName || "Brak nazwy"}</span>
      </div>
      {row.municipality && (
        <p className="text-[11px] text-neutral-500 truncate dark:text-neutral-400 mt-0.5">
          Gmina: {row.municipality}
        </p>
      )}
    </div>
  )
  ```
  **Wada**: Używa `truncate` (jednoliniowe obcinanie), a ikona jest wyśrodkowana wertykalnie (`items-center`). Długie nazwy szkół i zespołów (np. *„Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku”*) są brutalnie obcinane, a brak atrybutu `title` uniemożliwia ich odczytanie.
- **Kolumna `actions` (linie 173–206)**:
  ```tsx
  <Button variant="ghost" size="sm" onClick={() => onEdit(row)} ...>
    <Edit className="size-3.5" />
  </Button>
  <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)} ...>
    <Trash2 className="size-3.5" />
  </Button>
  ```
  **Wada**: Ani przycisk `Edit`, ani `Delete` **nie wywołują `e.stopPropagation()`**. Po dodaniu `onRowClick` kliknięcie w `Delete` jednocześnie wywoła usunięcie i otworzy edytor modala! Kliknięcie w `Edit` wywoła podwójne otwarcie modala.
- **Pasek filtrów (linie 225–251)**:
  Używa surowych, natywnych znaczników HTML `<select>` zamiast komponentu Design System `<Select>`:
  - Brak filtru gminy (`municipality`).
  - Brak quick-filter chips dla statusu sprawozdania (*Wszystkie*, *Złożone*, *Oczekuje*).

### 2.2. `ProgramsCatalogTab.tsx` — Stan Bieżący
- **Wywołanie `DataTable` (linie 220–227)**:
  ```tsx
  <DataTable
    data={filteredPrograms}
    columns={columns}
    keyExtractor={(item) => item.id}
    enablePagination
    defaultPageSize={25}
    pageSizeOptions={[15, 25, 50, 100]}
  />
  ```
  **Wada**: Brak `onRowClick={(row) => onEdit(row)}`.
- **Kolumna `name` (linie 62–78)**:
  ```tsx
  cell: ({ row }) => (
    <div className="max-w-[320px]">
      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
        {row.name}
      </span>
      {row.code && (
        <span className="text-[11px] text-neutral-500 font-mono ml-1">
          ({row.code})
        </span>
      )}
      {row.description && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
          {row.description}
        </p>
      )}
    </div>
  )
  ```
  **Wada**: Brak `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` oraz brak atrybutu `title={row.name}`.
- **Kolumna `actions` (linie 136–168)**:
  ```tsx
  <Button variant="ghost" size="sm" onClick={() => onEdit(row)} ...>
    <Edit className="size-3.5" />
  </Button>
  <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)} ...>
    <Trash2 className="size-3.5" />
  </Button>
  ```
  **Wada**: Brak `e.stopPropagation()` na obu przyciskach akcji oraz brak `aria-label`.

---

## 3. Szczegółowy Audyt Wszystkich Elementów Interaktywnych i Izolacji Zdarzeń (`e.stopPropagation()`)

Poniższa tabela przedstawia pełny inwentarz elementów interaktywnych w obu tabelach wraz z oceną ryzyka i wymaganymi zmianami:

| Tabela | Kolumna / Element | Obecny kod | Skutek bez `stopPropagation()` po włączeniu `onRowClick` | Wymagane rozwiązanie |
|---|---|---|---|---|
| **SchoolParticipationsTab** | Akcje: Przycisk Edycji (`Edit`) | `onClick={() => onEdit(row)}` | **Bąbelkowanie zdarzenia**: wywołanie `onEdit(row)` w przycisku + ponowne wywołanie `onRowClick(row)` w wierszu. Skutek: podwójne wywołanie `openModal("participation")`, potencjalne migotanie lub błędy stanu. | `onClick={(e) => { e.stopPropagation(); onEdit(row); }}` + `aria-label="Edytuj zgłoszenie"` |
| **SchoolParticipationsTab** | Akcje: Przycisk Usuwania (`Trash2`) | `onClick={() => onDelete(row.id)}` | **Wyścig zdarzeń / Krytyczny błąd UX**: wywołanie usunięcia lub otwarcia dialogu potwierdzenia, a natychmiast potem wywołanie `onEdit(row)` otwierające formularz edycji usuwanego rekordu! | `onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}` + `aria-label="Usuń zgłoszenie"` |
| **SchoolParticipationsTab** | Kontener akcji (`div.flex`) | `className="flex items-center gap-1 justify-end"` | Kliknięcie w odstęp między przyciskami w kolumnie akcji lub w obręb tooltipa wyzwala `onRowClick`. | Dodanie `onClick={(e) => e.stopPropagation()}` na kontenerze komórki akcji jako dodatkowa warstwa ochronna (defense in depth). |
| **SchoolParticipationsTab** | Odznaki programu i statusu | `<Badge ...>` | Brak interakcji (tylko prezentacja). Kliknięcie bąbelkuje do wiersza `<tr>`, otwierając edycję — **pożądane UX**. | Brak zmian (pozostawić naturalne bąbelkowanie). |
| **SchoolParticipationsTab** | Koordynator / Kontakt | `<p ...>{contact}</p>` | Czysty tekst (brak linku `<a>` czy `mailto:`). Kliknięcie bąbelkuje do wiersza — **pożądane UX**. | Brak zmian. |
| **ProgramsCatalogTab** | Akcje: Przycisk Edycji (`Edit`) | `onClick={() => onEdit(row)}` | Podwójne wywołanie `onEdit(row)` — podwójne otwarcie modala programu. | `onClick={(e) => { e.stopPropagation(); onEdit(row); }}` + `aria-label="Edytuj program"` |
| **ProgramsCatalogTab** | Akcje: Przycisk Usuwania (`Trash2`) | `onClick={() => onDelete(row.id)}` | Usunięcie programu przy jednoczesnym otwarciu edytora modala programu! | `onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}` + `aria-label="Usuń program"` |
| **ProgramsCatalogTab** | Kontener akcji (`div.flex`) | `className="flex items-center gap-1 justify-end"` | Kliknięcie w pobliżu ikon akcji wyzwala wiersz. | Dodanie `onClick={(e) => e.stopPropagation()}` na kontenerze. |
| **ProgramsCatalogTab** | Odznaki JRWA i Statusu | `<Badge ...>` | Czysta prezentacja. Kliknięcie otwiera edycję wiersza — **pożądane UX**. | Brak zmian. |

---

## 4. Analiza Krajobrazu Testowego (Vitest, Testing Library, Architektura)

### 4.1. Stan istniejący
1. **Środowisko uruchomieniowe**:
   - `vitest` v3.2.7 ze środowiskiem `jsdom`.
   - `@testing-library/react` z funkcjami `render`, `screen`, `fireEvent`, `waitFor`.
2. **Istniejące testy w module programów**:
   - `src/features/ozipz/components/programs/programs.test.ts` (4 testy): testy czystych obliczeń metryk, JRWA i filtrów logicznych.
   - `src/features/ozipz/components/programs/components/programsComponents.test.tsx` (4 testy): renderowanie nagłówka KPI, switchera widoków, tabeli szkół i tabeli programów.
3. **Czas wykonania**:
   - Uruchomienie `npx vitest run src/features/ozipz/components/programs/` trwa ~6.1 s i przechodzi w 100% (8 testów).
4. **Zarządzanie stanem i mockowanie**:
   - Komponenty `SchoolParticipationsTab`, `ProgramsCatalogTab` i `ProgramsStatsHeader` to **czyste komponenty prezentacyjne** (pure presentation components), które przyjmują dane oraz listenery przez `props`.
   - Dzięki temu testy komponentowe nie wymagają mockowania bazy SQLite / Tauri / IPC — wystarczy przekazać tablice mocków i szpiedzy `vi.fn()`.
   - `ProgramsSection` posiada domyślne wiązania do `usePrograms()` i `useModalStore()`, ale przyjmuje opcjonalne propsy (`programs`, `participations`, `onOpenEditParticipation`, itd.), co umożliwia renderowanie go w testach z kontrolowanymi danymi bez konieczności mockowania globalnego store'a.
   - Obsługa `localStorage`: W środowisku jsdom `localStorage` jest w pełni dostępny. Należy stosować wzorzec `beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });`.

---

## 5. Rekomendowana Strategia Testów dla R1, R2, R3, R4

Poniższa matryca definiuje konkretne przypadki testowe, które należy wdrożyć w `programsComponents.test.tsx` (oraz nowym pliku `programsUxInteractions.test.tsx` lub rozszerzonym zestawie), aby zagwarantować 100% zgodności z kryteriami akceptacji:

### 5.1. Wymaganie R1: Pasek Filtrów i Harmonizacja Design Systemu
- [ ] **Test R1.1 (Brak natywnych `<select>`)**:
  Zweryfikować, że `SchoolParticipationsTab` nie renderuje żadnego natywnego elementu `select` w DOM (`expect(container.querySelectorAll("select").length).toBe(0)`), a zamiast tego renderuje przyciski triggerów Design System `<Select>`.
- [ ] **Test R1.2 (Obecność i działanie quick-filter chips)**:
  Wyrenderować listę z 3 zgłoszeniami (1 z `hasFinalReport: true`, 2 z `hasFinalReport: false`). Sprawdzić obecność chipów:
  - *Wszystkie zgłoszenia*
  - *Sprawozdanie złożone*
  - *Oczekuje na sprawozdanie*
  Zweryfikować, że po kliknięciu *Sprawozdanie złożone* lista wyświetla tylko 1 pozycję, a po kliknięciu *Oczekuje na sprawozdanie* — pozostałe 2.
- [ ] **Test R1.3 (Filtrowanie po gminie)**:
  Wykryć listę unikalnych gmin i przetestować wybór gminy z selektora `<Select>` — tabela powinna pokazać wyłącznie placówki z wybranej gminy.
- [ ] **Test R1.4 (Przycisk czyszczenia filtrów)**:
  Uruchomić filtr (np. status sprawozdania lub wyszukiwanie), zweryfikować pojawienie się przycisku *Wyczyść*, kliknąć go i sprawdzić przywrócenie pełnej listy.

### 5.2. Wymaganie R2: Zwijalny Nagłówek KPI z Persystencją w `localStorage`
- [ ] **Test R2.1 (Domyślna widoczność KPI)**:
  Przy pustym `localStorage` wyrenderować `ProgramsSection`. Sprawdzić, czy `ProgramsStatsHeader` jest w DOM oraz czy przycisk zwijania wyświetla etykietę *Zwiń KPI*.
- [ ] **Test R2.2 (Zwijanie i persystencja w `localStorage`)**:
  Kliknąć przycisk *Zwiń KPI*.
  - Sprawdzić, że `ProgramsStatsHeader` zniknął z DOM (`expect(screen.queryByText("Programy Profilaktyczne")).toBeNull()`).
  - Sprawdzić, że etykieta przycisku zmieniła się na *Pokaż KPI*.
  - Sprawdzić, że `localStorage.getItem("oz.programsShowKpiSummary") === "false"`.
- [ ] **Test R2.3 (Rozwijanie i aktualizacja `localStorage`)**:
  Kliknąć *Pokaż KPI*. Sprawdzić, że nagłówek KPI powrócił do DOM, a w `localStorage` zapisano `"true"`.
- [ ] **Test R2.4 (Inicjalizacja na podstawie zapisanego stanu)**:
  Ustawić `localStorage.setItem("oz.programsShowKpiSummary", "false")` przed renderem. Sprawdzić, czy nagłówek jest od razu zwinięty przy montowaniu komponentu.
- [ ] **Test R2.5 (Odporność na błędy `localStorage`)**:
  Zasymulować rzucenie wyjątku przez `localStorage.getItem` i `setItem` — zweryfikować, że komponent nie ulega awarii (graceful fallback).

### 5.3. Wymaganie R3: Bezpośrednia Interakcja Wiersza i Izolacja Zdarzeń Akcji
- [ ] **Test R3.1 (`SchoolParticipationsTab` — kliknięcie wiersza)**:
  Wyrenderować tabelę zgłoszeń ze szpiegiem `handleEdit = vi.fn()`.
  Kliknąć komórkę nazwy szkoły lub wiersz `tr`.
  Zweryfikować:
  `expect(handleEdit).toHaveBeenCalledTimes(1);`
  `expect(handleEdit).toHaveBeenCalledWith(mockParticipations[0]);`
- [ ] **Test R3.2 (`SchoolParticipationsTab` — izolacja przycisku Edytuj)**:
  Kliknąć przycisk edycji w kolumnie akcji (`screen.getAllByRole("button", { name: "Edytuj zgłoszenie" })[0]`).
  Zweryfikować: `handleEdit` wywołano **dokładnie 1 raz** (brak podwójnego wywołania przez bubbling z wiersza `tr`).
- [ ] **Test R3.3 (`SchoolParticipationsTab` — izolacja przycisku Usuń)**:
  Kliknąć przycisk usunięcia (`screen.getAllByRole("button", { name: "Usuń zgłoszenie" })[0]`).
  Zweryfikować:
  `expect(handleDelete).toHaveBeenCalledWith(mockParticipations[0].id);`
  `expect(handleEdit).not.toHaveBeenCalled();`
- [ ] **Test R3.4 (`ProgramsCatalogTab` — kliknięcie wiersza)**:
  Wyrenderować tabelę programów ze szpiegiem `handleEdit = vi.fn()`.
  Kliknąć wiersz `tr` lub nazwę programu.
  Zweryfikować:
  `expect(handleEdit).toHaveBeenCalledTimes(1);`
  `expect(handleEdit).toHaveBeenCalledWith(mockPrograms[0]);`
- [ ] **Test R3.5 (`ProgramsCatalogTab` — izolacja przycisku Edytuj)**:
  Kliknąć przycisk edycji programu.
  Zweryfikować: `handleEdit` wywołano **dokładnie 1 raz**.
- [ ] **Test R3.6 (`ProgramsCatalogTab` — izolacja przycisku Usuń)**:
  Kliknąć przycisk usunięcia programu.
  Zweryfikować: `handleDelete` wywołano z ID programu, a `handleEdit` **nie został wywołany wcale**.

### 5.4. Wymaganie R4: Wieloliniowe Zawijanie Nazw Szkół i Programów
- [ ] **Test R4.1 (`SchoolParticipationsTab` — klasy CSS i brak `truncate`)**:
  Pobrać element nazwy placówki w komórce tabeli:
  - Sprawdzić, czy posiada klasy: `line-clamp-2`, `break-words`, `leading-tight`.
  - Sprawdzić, że nazwa placówki **nie posiada** klasy `truncate`.
  - Sprawdzić, czy element posiada atrybut `title` z pełną nazwą szkoły (`expect(el.getAttribute("title")).toBe(mockParticipations[0].facilityName)`).
  - Sprawdzić, czy kontener ikony używa `items-start` zamiast `items-center`.
- [ ] **Test R4.2 (`ProgramsCatalogTab` — klasy CSS i brak `truncate`)**:
  Pobrać element nazwy programu w komórce tabeli:
  - Sprawdzić klasy `line-clamp-2`, `break-words`, `leading-tight`.
  - Sprawdzić atrybut `title` z pełną nazwą programu.

---

## 6. Propozycja Konkretnych Wzorców Implementacyjnych dla Zespołu Wykonawczego (Workers)

### Wzorzec 1: Implementacja R3 w `SchoolParticipationsTab.tsx`
```tsx
// W kolumnie Akcje:
{
  id: "actions",
  header: "Akcje",
  cell: ({ row }) => (
    <div
      className="flex items-center gap-1 justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>Edytuj zgłoszenie</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Usuń zgłoszenie"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.id);
            }}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Usuń zgłoszenie</TooltipContent>
      </Tooltip>
    </div>
  ),
}

// W wywołaniu DataTable:
<DataTable
  data={filteredParticipations}
  columns={columns}
  keyExtractor={(item) => item.id}
  enablePagination
  defaultPageSize={25}
  pageSizeOptions={[15, 25, 50, 100]}
  onRowClick={(row) => onEdit(row)}
  rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
/>
```

### Wzorzec 2: Implementacja R4 w `SchoolParticipationsTab.tsx`
```tsx
{
  id: "facilityName",
  header: "Placówka Edukacyjna",
  accessorKey: "facilityName",
  sortable: true,
  cell: ({ row }) => (
    <div className="min-w-[200px] max-w-[340px]">
      <div className="flex items-start gap-1.5">
        <Building2 className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span
            className="font-medium text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 break-words leading-tight"
            title={row.facilityName || "Brak nazwy"}
          >
            {row.facilityName || "Brak nazwy"}
          </span>
          {row.municipality && (
            <p
              className="text-[11px] text-neutral-500 truncate dark:text-neutral-400 mt-0.5"
              title={`Gmina: ${row.municipality}`}
            >
              Gmina: {row.municipality}
            </p>
          )}
        </div>
      </div>
    </div>
  ),
}
```

### Wzorzec 3: Implementacja R2 w `ProgramsSection.tsx` i `ProgramsViewSwitcher.tsx`
```tsx
// W ProgramsSection.tsx:
const [showKpiSummary, setShowKpiSummary] = useState<boolean>(() => {
  try {
    const saved = localStorage.getItem("oz.programsShowKpiSummary");
    if (saved !== null) return saved === "true";
  } catch {
    // ignore
  }
  return true;
});

const toggleKpiSummary = useCallback(() => {
  setShowKpiSummary((prev) => {
    const next = !prev;
    try {
      localStorage.setItem("oz.programsShowKpiSummary", String(next));
    } catch {
      // ignore
    }
    return next;
  });
}, []);

// Warunkowe renderowanie nagłówka:
{showKpiSummary && (
  <ProgramsStatsHeader
    programsCount={stats.programsCount}
    participationsCount={stats.participationsCount}
    uniqueSchoolsCount={stats.uniqueSchoolsCount}
    reportedCoordinatorsCount={stats.reportedCoordinatorsCount}
  />
)}

// Przekazanie do ProgramsViewSwitcher:
<ProgramsViewSwitcher
  activeTab={activeTab}
  onTabChange={setActiveTab}
  participationsCount={stats.participationsCount}
  programsCount={stats.programsCount}
  onOpenAddParticipation={() => onOpenAddParticipation()}
  onOpenAddProgram={onOpenAddProgram}
  onToggleKpi={toggleKpiSummary}
  isKpiVisible={showKpiSummary}
/>
```

W `ProgramsViewSwitcher.tsx`:
```tsx
{onToggleKpi && (
  <Button
    variant="outline"
    size="sm"
    onClick={onToggleKpi}
    className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
    title={isKpiVisible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"}
  >
    {isKpiVisible ? (
      <ChevronUp className="size-3.5 text-muted-foreground" />
    ) : (
      <ChevronDown className="size-3.5 text-muted-foreground" />
    )}
    <span>{isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}</span>
  </Button>
)}
```

### Wzorzec 4: Implementacja R1 — Quick Filters i Select
```tsx
// Definicja opcji szybkich filtrów:
const REPORT_FILTER_OPTIONS: {
  id: "all" | "submitted" | "pending";
  label: string;
}[] = [
  { id: "all", label: "Wszystkie zgłoszenia" },
  { id: "submitted", label: "Sprawozdanie złożone" },
  { id: "pending", label: "Oczekuje na sprawozdanie" },
];

// Styl chipów:
const chipClass = (isActive: boolean) =>
  isActive
    ? "bg-primary text-primary-foreground border-primary shadow-none font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border"
    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer";
```

### Wzorzec 5: Rekomendacja architektoniczna (GEMINI.md <350 linii)
Obecnie `SchoolParticipationsTab.tsx` ma 298 linii. Rozbudowanie go o pełny pasek filtrów, `Select`, chipy i stan może doprowadzić plik do granicy 380–420 linii.
**Rekomendacja architektoniczna**:
Wydzielić `SchoolParticipationsFilterBar.tsx` do dedykowanego pliku `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx` (analogicznie do `FacilitiesFilterBar.tsx`):
- `SchoolParticipationsFilterBar.tsx` (~110–130 linii)
- `SchoolParticipationsTab.tsx` spadnie do ~180–200 linii.
- Całkowita zgodność z zasadą GEMINI.md SRP oraz limitem linii!

---

## 7. Podsumowanie Wniosków Badawczych

1. **Wsparcie `onRowClick` w DataTable**: Komponent `DataTable` jest w 100% gotowy do przyjęcia `onRowClick` i automatycznie zarządza stylami `hover:bg-muted/40` i `cursor-pointer`.
2. **Konieczność `e.stopPropagation()`**: Przyciski `Edit` i `Delete` w obu tabelach bezwzględnie wymagają `e.stopPropagation()`, aby wyeliminować podwójne wywołania edycji oraz kolizję usuwania z jednoczesnym otwieraniem edytora.
3. **Pasek filtrów i Design System (R1)**: Zastąpienie surowych `<select>` przez `<Select size="sm">`, dodanie filtru gmin i 3 chipów sprawozdań zunifikuje moduł Programów z modułami Działań i Placówek.
4. **Zwijany nagłówek KPI (R2)**: Sprawdzony wzorzec z `FacilitiesSection.tsx` z kluczem `oz.programsShowKpiSummary` w `localStorage` i przyciskiem w `ProgramsViewSwitcher.tsx` jest bezpośrednim, czystym rozwiązaniem.
5. **Wieloliniowe nazwy (R4)**: Zamiana `truncate` na `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` wraz z `items-start` i `title` natychmiast rozwiązuje czytelność długich nazw.
6. **Gotowość testowa**: Istniejąca infrastruktura `vitest` + `@testing-library/react` pozwala na natychmiastowe wdrożenie 16+ precyzyjnych asercji weryfikujących R1–R4 w zaledwie kilka sekund wykonania.
