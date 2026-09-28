# Handoff Report: Badanie 4 Modułów Bazowych (Materiały, Rejestry, Kontakty, Pisma)

**Data:** 2026-09-05  
**Autor:** Explorer Subagent (`core_explorer_targets`)  
**Adresat:** Parent Agent (`parent`, ID: `da236400-b6d5-45cf-ab25-634666be2bbd`)  
**Typ przekazania:** Hard Handoff (Zadanie badawcze w 100% zrealizowane)

---

## 1. Observation

Bezpośrednie obserwacje kodu źródłowego, struktury plików, właściwości komponentów i logów testowych:

### 1.1. Limity linii (GEMINI.md < 350-400 linii)
- `src/features/ozipz/components/materials/MaterialsSection.tsx`: 147 linii
- `src/features/ozipz/components/materials/MaterialDialog.tsx`: 278 linii
- `src/features/ozipz/components/materials/DistributionDialog.tsx`: 280 linii
- `src/features/ozipz/components/materials/components/MaterialsCatalogTab.tsx`: 245 linii
- `src/features/ozipz/components/materials/components/MaterialsDistributionsTab.tsx`: 243 linii
- `src/features/ozipz/components/registers/RegistersSection.tsx`: 346 linii
- `src/features/ozipz/components/registers/RegisterDialog.tsx`: 362 linii
- `src/features/ozipz/components/contacts/ContactsSection.tsx`: 152 linii
- `src/features/ozipz/components/contacts/ContactDialog.tsx`: 322 linii
- `src/features/ozipz/components/contacts/components/ContactsTableView.tsx`: 211 linii
- `src/features/ozipz/components/letters/LettersSection.tsx`: 206 linii
- `src/features/ozipz/components/letters/LetterDialog.tsx`: 209 linii
Wszystkie pliki mieszczą się w wyznaczonym limicie GEMINI.md.

### 1.2. Paski filtrów i elementy wyboru (R1)
- `MaterialsCatalogTab.tsx` (linie 186–198): używa surowego `<select>` HTML dla `selectedType`. Brak przycisku `X` w polu wyszukiwania. Brak chipów szybkiego filtrowania typów.
- `MaterialsDistributionsTab.tsx` (linie 186–210): brak jakiegokolwiek selektora dropdown ani chipów (posiada jedynie pole wyszukiwania tekstu).
- `ContactsFilterBar.tsx` (linie 46–73): używa dwóch surowych `<select>` HTML dla stanowisk (`positionFilter`) oraz gmin (`muniFilter`). Brak chipów szybkiego filtrowania.
- `LettersSection.tsx` (linie 176–184): używa surowego `<select>` HTML dla `directionFilter` (*Wszystkie pisma*, *Wychodzące*, *Przychodzące*). Brak chipów szybkiego filtrowania.

### 1.3. Interakcja z wierszem i izolacja akcji (R2)
- `MaterialsCatalogTab.tsx` (linia 232), `MaterialsDistributionsTab.tsx` (linia 230), `ContactsTableView.tsx` (linia 200), `LettersSection.tsx` (linia 193):
  Komponent `<DataTable>` nie posiada przekazanego `onRowClick` ani `rowClassName`.
- W komórkach akcji (`actions` column):
  - `MaterialsCatalogTab.tsx` (linie 121–165): kontener oraz przyciski `Plus`, `Edit`, `Trash2` nie wywołują `e.stopPropagation()`.
  - `MaterialsDistributionsTab.tsx` (linie 134–178): przyciski `Printer`, `Edit`, `Trash2` nie wywołują `e.stopPropagation()`.
  - `ContactsTableView.tsx` (linie 144–175): kontener oraz przyciski `Edit`, `Trash2` nie wywołują `e.stopPropagation()`.
  - `LettersSection.tsx` (linie 128–155): kontener posiada `e.stopPropagation()`, ale handlery przycisków `Edit` i `Trash2` go nie wywołują.
- W `registers/` tabele (`InformationRegisterTable`, `PublicationsRegisterTable`, `VisitationsRegisterTable`) mają `onRowClick`, ale brak im `rowClassName` dla aktywnego hovera/kursora.

### 1.4. Obcinanie tekstu zamiast zawijania wieloliniowego (R3)
- `MaterialsDistributionsTab.tsx` (linie 96–105): kolumna `recipientName` stosuje `<span className="truncate">{row.recipientName ...}</span>` oraz w podtytule gminy `<p className="... truncate ...">`.
- `ContactsTableView.tsx` (linie 78–89): kolumna `facilityName` stosuje `<span className="truncate">{row.facilityName ...}</span>` oraz `<p className="... truncate ...">` dla gminy.
- `LettersSection.tsx` (linie 88–93): kolumna `subject` nie posiada `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`, a `senderRecipient` nie posiada atrybutu `title`.
- `InformationRegisterTable.tsx` / `PublicationsRegisterTable.tsx` / `VisitationsRegisterTable.tsx`: kolumny `leadEducator` i `notes` używają `truncate block`.

### 1.5. Zwijany nagłówek kart KPI (R4)
- `MaterialsSection.tsx` (linia 96): `<MaterialsStatsHeader>` renderowany jest na stałe. Brak `isKpiVisible` / `onToggleKpi` w `MaterialsViewSwitcher.tsx`. Brak klucza `localStorage` `oz.materialsShowKpiSummary`.
- `RegistersSection.tsx` (linia 241): `<RegistersStatsHeader>` renderowany jest na stałe. Brak klucza `oz.registersShowKpiSummary`.
- `ContactsSection.tsx` (linia 114): `<ContactsStatsHeader>` renderowany jest na stałe. Brak klucza `oz.contactsShowKpiSummary`.
- `LettersSection.tsx`: całkowity brak nagłówka KPI. Wymagane utworzenie `LettersStatsHeader.tsx` z kluczem `oz.lettersShowKpiSummary` i przełącznikiem toggle.

### 1.6. Wykrycie błędu React DOM Warning (R5)
- Uruchomienie `npm test` w logu zadania 124 wykazało powtarzający się błąd konsoli:
  ```
  stderr | src/features/ozipz/components/letters/lettersComponents.test.tsx > Letters Module Components > LetterDialog > renders modal dialog in edit mode with populated letter data
  React does not recognize the `searchPlaceholder` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `searchplaceholder` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
  ```
- W pliku `src/components/ui/autocomplete.tsx`: właściwość `searchPlaceholder` zdefiniowana na linii 34 w `AutocompleteProps` nie jest destrukturyzowana na liniach 66–96, przez co wpada do `...restInputProps` i trafia bezpośrednio do natywnego `<input {...restInputProps} />` na linii 375.

---

## 2. Logic Chain

1. **Z obserwacji 1.1** wynika, że żaden plik nie przekracza dopuszczalnej wielkości 350–400 linii, co oznacza, że refaktoryzacja może odbyć się w ramach istniejących struktur bez konieczności rozbijania na nowe podkatalogi, pod warunkiem zachowania zwięzłości kodu (nowy komponent nagłówka `LettersStatsHeader.tsx` w module letters ma uzasadnienie modułowe).
2. **Z obserwacji 1.2** wynika, że 3 z 4 modułów (Materiały, Kontakty, Pisma) nadal stosują surowe tagi `<select>` HTML, co łamie wymóg R1 (Design System Harmonization) oraz projektowy standard `@/components/ui/select`. Dodatkowo brak quick-filter chips utrudnia szybką filtrację na urządzeniach mobilnych i laptopach.
3. **Z obserwacji 1.3** wynika, że brak `onRowClick` w `<DataTable>` we wszystkich głównych tabelach uniemożliwia bezpośrednie otwieranie podglądu/edycji po kliknięciu wiersza, co jest standardem w modułach Actions, Facilities i Programs. Jednocześnie dodanie `onRowClick` bez uprzedniego dodania `e.stopPropagation()` na przyciskach akcji w komórkach spowoduje bąbelkowanie zdarzenia i błędne jednoczesne wywoływanie akcji przycisku i kliknięcia wiersza.
4. **Z obserwacji 1.4** wynika, że stosowanie `truncate` w kolumnach zawierających nazwy placówek i tytuły materiałów powoduje utratę czytelności (ucięcie słów). Zastosowanie wzorca `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` wraz z tooltipem `title` rozwiąże ten problem bez rozszerzania tabeli poza ekran.
5. **Z obserwacji 1.5** wynika, że brak zwijania kart KPI zabiera cenną przestrzeń pionową na laptopach. Zastosowanie schematu znanego z `ProgramsSection` (zapis boolean w `localStorage` pod kluczami `oz.*ShowKpiSummary` w bloku `try/catch`) jest w 100% spójne z resztą aplikacji.
6. **Z obserwacji 1.6** wynika, że ostrzeżenie konsoli React DOM wynika wprost z braku wyciągnięcia `searchPlaceholder` w `Autocomplete`. Usunięcie tego atrybutu z `restInputProps` gwarantuje czystość konsoli w testach.

---

## 3. Caveats

- **Test jednostkowy w pismach:** W `src/features/ozipz/components/letters/lettersComponents.test.tsx` na linii 86 test wykonuje zapytanie `screen.getByRole("combobox")` i `fireEvent.change(select, ...)` celując w natywny tag `<select>`. Po zastąpieniu go komponentem Design System `<Select size="sm">`, test ten musi zostać zaktualizowany, aby klikał w przycisk selektora lub w nowo dodany chip szybkiego filtrowania.
- **Brak uwag i zastrzeżeń co do architektury bazy:** Wszystkie encje posiadają gotowe powiązania w store Zustand (`useOzipzDbStore`) i modal store (`useModalStore`).

---

## 4. Conclusion

1. Audyt został pomyślnie i wyczerpująco zakończony. Szczegółowy raport wdrożeniowy został zapisany w `.agents/core_explorer_targets/report.md`.
2. Zdefiniowano pełną listę niezbędnych zmian dla każdego z 4 modułów (R1: Select & Quick-chips, R2: onRowClick & stopPropagation, R3: Multi-line text wrapping & tooltips, R4: Collapsible KPI headers z kluczami `oz.*ShowKpiSummary`, R5: Autocomplete fix dla `searchPlaceholder`).
3. Kod jest gotowy do implementacji przez workerów bez ryzyka naruszenia architektury.

---

## 5. Verification Method

Do niezależnej weryfikacji rekomendowanych zmian należy zastosować:
1. **Weryfikacja statyczna TypeScript:**
   ```bash
   npm run typecheck
   ```
   (Musi zakończyć się kodem 0 bez błędów typowania).
2. **Weryfikacja testów jednostkowych i ostrzeżeń React DOM:**
   ```bash
   npm test
   ```
   (Wszystkie 73 zestawy testów, 524 testy muszą przejść w 100%, a w logach konsoli nie może pojawić się ostrzeżenie `React does not recognize the 'searchPlaceholder' prop on a DOM element`).
3. **Weryfikacja kompilacji produkcyjnej:**
   ```bash
   npm run build
   ```
   (Kompilacja Tauri/Vite musi zakończyć się sukcesem).
4. **Pliki do inspekcji po wdrożeniu:**
   - `src/features/ozipz/components/materials/MaterialsSection.tsx` & subkomponenty
   - `src/features/ozipz/components/registers/RegistersSection.tsx` & subkomponenty
   - `src/features/ozipz/components/contacts/ContactsSection.tsx` & subkomponenty
   - `src/features/ozipz/components/letters/LettersSection.tsx` & subkomponenty
   - `src/components/ui/autocomplete.tsx`
