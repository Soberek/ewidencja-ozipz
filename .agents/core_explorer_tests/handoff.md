# Handoff Report: Diagnostyka R5 — React DOM Property Warnings

**Agent**: Explorer Subagent (`core_explorer_tests`)  
**Parent Agent ID**: `da236400-b6d5-45cf-ab25-634666be2bbd`  
**Data**: 2026-09-05  
**Typ handoffu**: Hard Handoff (Investigation Complete)  
**Pełny raport**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_tests/report.md`

---

## 1. Observation

1. **Polecenie i wynik testów**:
   Uruchomiono `npx vitest run`:
   ```
   Test Files  73 passed (73)
   Tests       524 passed (524)
   ```
   W strumieniu `stderr` odnotowano verbatim błędy:
   ```
   stderr | src/features/ozipz/components/letters/lettersComponents.test.tsx > Letters Module Components > LetterDialog > renders modal dialog in edit mode with populated letter data
   React does not recognize the `searchPlaceholder` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `searchplaceholder` instead. If you accidentally passed it from a parent component, remove it from the DOM element.

   stderr | src/features/ozipz/components/staff/staffComponents.test.tsx > Staff Module Components > StaffDialog > renders modal in create mode
   React does not recognize the `searchPlaceholder` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `searchplaceholder` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
   ```

2. **Inspekcja `src/components/ui/autocomplete.tsx`**:
   - Linia 34:
     ```typescript
     export interface AutocompleteProps
       extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
       // ...
       placeholder?: string;
       searchPlaceholder?: string;
     ```
   - Linie 64–97:
     ```typescript
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
           ...restInputProps
         },
         ref
       ) => {
     ```
     Właściwość `searchPlaceholder` **nie jest zdestrukturyzowana**.
   - Linia 375:
     ```typescript
     <input
       // ...
       placeholder={placeholder}
       {...restInputProps}
     />
     ```
     `...restInputProps` wstrzykuje nierozpoznany atrybut `searchPlaceholder` bezpośrednio do tagu `<input>`.

3. **Miejsca występowania w kodzie**:
   - `src/features/ozipz/components/staff/StaffDialog.tsx:152`: `<Autocomplete ... searchPlaceholder="Szukaj stanowiska..." />`
   - `src/features/ozipz/components/letters/components/LetterEntityRelationFields.tsx:142`: `<Autocomplete ... searchPlaceholder="Szukaj adresata/szkoły..." />`
   - `src/features/ozipz/components/contacts/ContactDialog.tsx:226, 255`: `<Autocomplete ... searchPlaceholder="..." />`
   - `src/features/ozipz/components/materials/components/DistributionRecipientCard.tsx:80`: `<Autocomplete ... searchPlaceholder="Szukaj odbiorcy..." />`
   - `src/features/ozipz/components/publications/PublicationDialog.tsx:212, 287`: `<Autocomplete ... searchPlaceholder="..." />`
   - `src/features/ozipz/components/schedule/components/ScheduleLocationDatesFields.tsx:125`: `<Autocomplete ... searchPlaceholder="Szukaj szkoły..." />`

4. **Porównanie z `Select` w `src/components/ui/select.tsx`**:
   - Linia 54: `searchPlaceholder = "Szukaj...",` – poprawnie zdestrukturyzowane.
   - Linia 360: `placeholder={searchPlaceholder}` – przekazywane do natywnego `placeholder`.
   - Żadne niepożądane atrybuty nie wyciekają do DOM.

---

## 2. Logic Chain

1. Testy `staffComponents.test.tsx` oraz `lettersComponents.test.tsx` renderują odpowiednio `StaffDialog` i `LetterDialog` (Observation 1).
2. Obydwa dialogi renderują komponent `<Autocomplete>` przekazując parametr `searchPlaceholder="..."` (Observation 3).
3. `Autocomplete` w `src/components/ui/autocomplete.tsx` rozszerza `React.InputHTMLAttributes<HTMLInputElement>` i deklaruje w interfejsie opcjonalny `searchPlaceholder?: string` (Observation 2).
4. Deklaracja komponentu `Autocomplete` destrukturyzuje wszystkie znane mu właściwości, **z wyjątkiem** `searchPlaceholder` (Observation 2).
5. Wszystkie niezdestrukturyzowane właściwości wpadają do zmiennej `...restInputProps`, która następnie jest wprost rozpakowywana na natywnym elemencie DOM `<input {...restInputProps} />` (Observation 2).
6. React w trybie deweloperskim i testowym sprawdza atrybuty natywnych elementów DOM pod kątem zgodności ze standardem HTML. Ponieważ `searchPlaceholder` nie jest dopuszczalnym atrybutem HTML elementu `<input>`, React wypisuje ostrzeżenie do konsoli `stderr` (Observation 1).
7. W komponentach `<Select>` i `<SearchableSelect>` problem nie występuje, gdyż `searchPlaceholder` jest tam zdestrukturyzowany i mapowany na natywny `placeholder` (Observation 4).
8. W rezultacie, naprawa `src/components/ui/autocomplete.tsx` poprzez zdestrukturyzowanie `searchPlaceholder` eliminuje przyczynę źródłową dla całego repozytorium, a usunięcie redundancji w wywołaniach formularzy zapewnia czystość kodu.

---

## 3. Caveats

- **Zakres badania**: Zbadano całą bazę kodu TypeScript/TSX pod kątem występowania `searchPlaceholder` oraz rozpraszania `...restProps` na elementach natywnych. Nie znaleziono żadnych innych komponentów UI powodujących ten sam problem.
- **Poboczne ostrzeżenia**: Zidentyfikowano dwa niezwiązane z DOM właściwościami ostrzeżenia: (a) nawigacja `mailto:` w jsdom (`challenger_stress.test.tsx:210`) oraz (b) ostrzeżenia `act(...)` z Radix UI Tooltip przy `.focus()` (`programsAdversarialChallenge.test.tsx:460, 463`). Zostały one opisane w sekcji 5 raportu z propozycją wyciszenia.
- **Brak modyfikacji**: Zgodnie z rolą Explorer (read-only), nie dokonano bezpośrednich zmian w kodzie źródłowym ani testach.

---

## 4. Conclusion

Główna przyczyna problemu R5 została jednoznacznie zdiagnozowana:
Wyciek właściwości `searchPlaceholder` do natywnego tagu `<input>` w komponencie `Autocomplete` (`src/components/ui/autocomplete.tsx:96, 375`).

**Rekomendowane kroki implementacyjne**:
1. W `src/components/ui/autocomplete.tsx`:
   - Zdestrukturyzować `searchPlaceholder` w liście parametrów (obok `placeholder`).
   - Przypisać `const effectivePlaceholder = placeholder || searchPlaceholder || "Wpisz lub wybierz z listy...";` i przekazać `placeholder={effectivePlaceholder}` do `<input>`.
2. Dodać test jednostkowy w `src/components/ui/autocomplete.test.tsx` weryfikujący brak ostrzeżeń konsoli przy przekazaniu `searchPlaceholder`.
3. Usunąć nadmiarowy prop `searchPlaceholder` w wywołaniach formularzy (`StaffDialog.tsx:152`, `LetterEntityRelationFields.tsx:142`, `ContactDialog.tsx:226, 255`, `DistributionRecipientCard.tsx:80`, `PublicationDialog.tsx:212, 287`, `ScheduleLocationDatesFields.tsx:125`).

---

## 5. Verification Method

Implementator może zweryfikować stan przed i po naprawie:

1. **Weryfikacja problemu (obecny stan)**:
   ```bash
   npx vitest run src/features/ozipz/components/staff/staffComponents.test.tsx
   ```
   Oczekiwany wynik: testy przechodzą, ale w `stderr` pojawia się ostrzeżenie `React does not recognize the searchPlaceholder prop on a DOM element`.

2. **Weryfikacja po naprawie**:
   ```bash
   npm run typecheck
   npx vitest run
   ```
   Warunek akceptacji (Zero-Warning Gate):
   - 0 błędów w kompilacji TypeScript (`tsc --noEmit`),
   - 100% testów przechodzi pomyślnie (73+ plików testowych),
   - Całkowity brak ostrzeżeń `React does not recognize the searchPlaceholder prop` w strumieniu `stderr`.
