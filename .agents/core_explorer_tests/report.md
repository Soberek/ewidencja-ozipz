# Raport Diagnostyczny R5: Ostrzeżenia React DOM Property w Testach Vitest

**Data badania**: 2026-09-05  
**Autor**: Explorer Subagent (core_explorer_tests)  
**Cel**: Identyfikacja, analiza przyczyn źródłowych i przygotowanie kroków naprawczych dla ostrzeżeń konsoli testowej Vitest (wymóg R5 z `ORIGINAL_REQUEST.md`).

---

## 1. Streszczenie Wykonawcze

W trakcie uruchomienia pełnego zestawu testów jednostkowych (`npx vitest run`, 73 pliki, 524 testy) zidentyfikowano ostrzeżenia konsoli stderr w środowisku testowym:
```
React does not recognize the `searchPlaceholder` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `searchplaceholder` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
```

Ostrzeżenie to pojawia się obecnie w dwóch zestawach testowych:
1. `src/features/ozipz/components/letters/lettersComponents.test.tsx` (podczas renderowania `LetterDialog`)
2. `src/features/ozipz/components/staff/staffComponents.test.tsx` (podczas renderowania `StaffDialog`)

Ponadto wykryto **6 dodatkowych lokalizacji** (m.in. w modułach Kontaktów, Materiałów, Publikacji i Harmonogramu), które zawierają identyczny błąd konstrukcyjny i wyemitują to samo ostrzeżenie natychmiast po uruchomieniu testów komponentowych dla tych dialogów.

Przyczyna źródłowa leży w komponencie projektowym **`src/components/ui/autocomplete.tsx`**, w którym właściwość `searchPlaceholder` została zdefiniowana w interfejsie TypeScript, lecz **nie została zdestrukturyzowana** w deklaracji komponentu, przez co trafia do obiektu `...restInputProps` i jest bezpośrednio wstrzykiwana do natywnego tagu `<input {...restInputProps} />`.

---

## 2. Analiza Przyczyny Źródłowej (Root Cause Analysis)

### A. Komponent Winny: `src/components/ui/autocomplete.tsx`

1. **Definicja interfejsu (linie 27–34)**:
   ```typescript
   export interface AutocompleteProps
     extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
     value?: string;
     onChange?: (value: string) => void;
     onSelectOption?: (option: AutocompleteOption) => void;
     options: AutocompleteOptionInput[];
     placeholder?: string;
     searchPlaceholder?: string; // <-- Zadeklarowana właściwość
     // ...
   }
   ```

2. **Destrukturyzacja propsów w komponencie (linie 64–97)**:
   ```typescript
   export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
     (
       {
         value = "",
         onChange,
         onSelectOption,
         options,
         placeholder = "Wpisz lub wybierz z listy...",
         // searchPlaceholder BRAKUJE NA TEJ LIŚCIE!
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
         ...restInputProps // <-- searchPlaceholder trafia tutaj!
       },
       ref
     ) => {
   ```

3. **Renderowanie elementu natywnego `<input>` (linie 340–376)**:
   ```typescript
   <input
     ref={...}
     id={inputId}
     name={name}
     type="text"
     value={inputValue}
     onChange={handleInputChange}
     onKeyDown={handleInputKeyDown}
     onFocus={...}
     onBlur={onBlur}
     placeholder={placeholder}
     disabled={disabled}
     autoFocus={autoFocus}
     autoComplete="off"
     aria-autocomplete="list"
     aria-expanded={isOpen}
     className={...}
     {...restInputProps} // <-- searchPlaceholder="Szukaj..." wstrzyknięty do DOM!
   />
   ```

### B. Dlaczego `Select` / `SearchableSelect` NIE powoduje tego błędu?
W `src/components/ui/select.tsx`:
- `searchPlaceholder = "Szukaj..."` jest poprawnie zdestrukturyzowane w linii 54.
- Wewnętrzny `<input>` w wyszukiwarce listy opcji otrzymuje go jako poprawny atrybut `placeholder={searchPlaceholder}` (linia 360).
- Komponent `Select` nie dziedziczy po `HTMLInputElement` ani nie rozprasza `...restProps` na elementach DOM.

---

## 3. Wykaz Plików i Linii Kodu Produkujących Ostrzeżenia

### Kategoria 1: Aktywne w Obecnych Testach Vitest

| Plik wywołujący | Linia | Komponent | Test uruchamiający | Ostrzeżenie stderr |
|---|---|---|---|---|
| `src/features/ozipz/components/staff/StaffDialog.tsx` | 152 | `<Autocomplete searchPlaceholder="Szukaj stanowiska..." />` | `staffComponents.test.tsx` (linia 70) | `React does not recognize the searchPlaceholder prop on a DOM element.` |
| `src/features/ozipz/components/letters/components/LetterEntityRelationFields.tsx` (używany w `LetterDialog.tsx`) | 142 | `<Autocomplete searchPlaceholder="Szukaj adresata/szkoły..." />` | `lettersComponents.test.tsx` (linia 158) | `React does not recognize the searchPlaceholder prop on a DOM element.` |

### Kategoria 2: Ukryte / Potencjalne (Odpali się przy uruchomieniu testów komponentowych dialogów)

| Plik wywołujący | Linia | Komponent | Kontekst |
|---|---|---|---|
| `src/features/ozipz/components/contacts/ContactDialog.tsx` | 226 | `<Autocomplete searchPlaceholder="Szukaj stanowiska..." />` | Pole wyboru stanowiska kontaktu |
| `src/features/ozipz/components/contacts/ContactDialog.tsx` | 255 | `<Autocomplete searchPlaceholder="Szukaj szkoły..." />` | Pole powiązania ze szkołą/placówką |
| `src/features/ozipz/components/materials/components/DistributionRecipientCard.tsx` (w `DistributionDialog.tsx`) | 80 | `<Autocomplete searchPlaceholder="Szukaj odbiorcy..." />` | Pole wyboru odbiorcy w rozdzielniku |
| `src/features/ozipz/components/publications/PublicationDialog.tsx` | 212 | `<Autocomplete searchPlaceholder="Szukaj medium..." />` | Pole kanału/medium publikacji |
| `src/features/ozipz/components/publications/PublicationDialog.tsx` | 287 | `<Autocomplete searchPlaceholder="Szukaj autora..." />` | Pole autora publikacji |
| `src/features/ozipz/components/schedule/components/ScheduleLocationDatesFields.tsx` (w `ScheduleDialog.tsx`) | 125 | `<Autocomplete searchPlaceholder="Szukaj szkoły..." />` | Pole wyboru placówki w harmonogramie |

---

## 4. Przegląd Istniejących Testów w Modułach Docelowych

W odniesieniu do punktu 3 zlecenia:
1. **Materiały (`materials`)**:
   - `src/features/ozipz/components/materials/materials.test.ts`: 5 testów domenowych (poprawne, brak ostrzeżeń).
   - `src/features/ozipz/components/materials/components/materialsComponents.test.tsx`: 4 testy komponentowe (`MaterialsStatsHeader`, `MaterialsViewSwitcher`, `MaterialsCatalogTab`, `MaterialsDistributionsTab`). Testy przechodzą czysto, ponieważ nie renderują modala `DistributionDialog`.
2. **Rejestry (`registers`)**:
   - `src/features/ozipz/components/registers/registers.test.ts`: 11 testów logiki i formatowania (brak ostrzeżeń).
   - Brak testów komponentowych renderujących `RegistersSection` lub `RegisterDialog`.
3. **Kontakty (`contacts`)**:
   - `src/features/ozipz/components/contacts/contacts.test.ts`: 3 testy integralności zmigrowanych danych (brak ostrzeżeń).
   - Brak testów komponentowych renderujących `ContactsSection` lub `ContactDialog`.
4. **Pisma / Listy (`letters`)**:
   - `src/features/ozipz/components/letters/lettersComponents.test.tsx`: 5 testów komponentowych. Test `renders modal dialog in edit mode with populated letter data` (linia 158) wywołuje `LetterDialog`, który zawiera `LetterEntityRelationFields` z nieszczęsnym `searchPlaceholder` na `Autocomplete`.
5. **Komponenty UI (`src/components/ui/`)**:
   - `autocomplete.test.tsx`: 10 testów. Żaden test nie przekazywał właściwości `searchPlaceholder`, dlatego testy jednostkowe samego komponentu nie wyłapały wycieku do DOM.
   - `select.test.tsx`, `date-picker.test.tsx`, `modal-dialog.test.tsx`, `empty-state.test.tsx`, `data-table.test.tsx`: Wszystkie przechodzą bez ostrzeżeń DOM.

---

## 5. Dodatkowe Ostrzeżenia Konsolowe w Zestawie Testowym

Poza głównym problemem `searchPlaceholder`, w logach vitest ujawniły się dwa poboczne ostrzeżenia:
1. **`Not implemented: navigation to another Document`**:
   - Plik: `src/features/ozipz/challenger_stress.test.tsx` (linia 210)
   - Przyczyna: `fireEvent.click(emailLink)` na tagu `<a href="mailto:...">` powoduje próbę nawigacji w jsdom.
2. **`An update to Tooltip inside a test was not wrapped in act(...)`**:
   - Plik: `src/features/ozipz/components/programs/programsAdversarialChallenge.test.tsx` (linie 460, 463)
   - Przyczyna: Wywołanie `editBtn.focus()` i `deleteBtn.focus()` bez `act(...)`, co wyzwala asynchroniczne otwarcie Radix Tooltip i stan `PopperContent`/`Presence`.

---

## 6. Plan Naprawczy (Actionable Remediation Plan)

Aby osiągnąć stan **Zero-Warning Gate** (wymóg R5), implementator powinien wykonać następujące kroki:

### Krok 1: Naprawa w komponencie Design System (`src/components/ui/autocomplete.tsx`)
Zdestrukturyzować `searchPlaceholder` w liście parametrów `Autocomplete`, uniemożliwiając jego trafienie do `restInputProps`:
```tsx
export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      value = "",
      onChange,
      onSelectOption,
      options,
      placeholder = "Wpisz lub wybierz z listy...",
      searchPlaceholder, // <-- DODANE: pochłania właściwość
      clearable = true,
      // ...
      ...restInputProps
    },
    ref
  ) => {
    // Bezpieczne użycie: jeśli przekazano searchPlaceholder a nie przekazano placeholder
    const effectivePlaceholder = placeholder || searchPlaceholder || "Wpisz lub wybierz z listy...";
    
    // ...
    <input
      // ...
      placeholder={effectivePlaceholder}
      {...restInputProps}
    />
```

### Krok 2: Test regresyjny w `src/components/ui/autocomplete.test.tsx`
Dodać test weryfikujący, że przekazanie `searchPlaceholder` nie emituje ostrzeżenia do konsoli:
```tsx
it("does not pass searchPlaceholder as an invalid DOM attribute to input", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<Autocomplete options={["Opcja 1"]} searchPlaceholder="Szukaj..." />);
  expect(consoleSpy).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});
```

### Krok 3: Oczyszczenie miejsc wywołań w formularzach (Defense-in-Depth)
W miejscach, gdzie `<Autocomplete>` posiada już zdefiniowany `placeholder`, usunąć zbędny prop `searchPlaceholder`:
- `src/features/ozipz/components/staff/StaffDialog.tsx`: linia 152
- `src/features/ozipz/components/letters/components/LetterEntityRelationFields.tsx`: linia 142
- `src/features/ozipz/components/contacts/ContactDialog.tsx`: linie 226 i 255
- `src/features/ozipz/components/materials/components/DistributionRecipientCard.tsx`: linia 80
- `src/features/ozipz/components/publications/PublicationDialog.tsx`: linie 212 i 287
- `src/features/ozipz/components/schedule/components/ScheduleLocationDatesFields.tsx`: linia 125

### Krok 4: Wyciszenie ostrzeżeń w testach pobocznych
- W `src/features/ozipz/challenger_stress.test.tsx:210`:
  ```tsx
  fireEvent.click(emailLink, { defaultPrevented: true });
  ```
- W `src/features/ozipz/components/programs/programsAdversarialChallenge.test.tsx:460, 463`:
  ```tsx
  act(() => {
    editBtn.focus();
  });
  ```

---

## 7. Weryfikacja Niezależna
Po wdrożeniu powyższych poprawek:
1. `npm run typecheck` musi zakończyć się kodem `0`.
2. `npx vitest run` musi przejść 100% testów z czystym strumieniem `stderr` (zero ostrzeżeń DOM, zero act warnings).
3. `npm run build` musi zakończyć się sukcesem produkcyjnym.
