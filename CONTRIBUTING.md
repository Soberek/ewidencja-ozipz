# Zasady pracy nad kodem

Krótki zbiór zasad, których trzymamy się w projekcie **Ewidencja OZiPZ**. Opis instalacji, uruchomienia i wydawania jest w [README](README.md), a opis bazy danych w [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Przed wysłaniem zmian

```bash
pnpm lint         # ESLint
pnpm typecheck    # TypeScript (strict)
pnpm test         # Vitest
cargo test --manifest-path src-tauri/Cargo.toml   # gdy zmieniasz backend Rust
pnpm build        # tsc + vite build
```

Wszystkie polecenia muszą przejść bez błędów — tak samo sprawdza je CI. Nowa funkcja lub zmiana reguły liczenia ma test, który bez tej zmiany nie przechodzi.

## Dane domenowe

- **Słowniki są jedynym źródłem wartości wyboru.** Gminy, formy działań, grupy odbiorców, symbole JRWA, stanowiska, typy dokumentów itp. pochodzą z tabeli `ozipz_dictionaries` albo z tabel encji — nie z tablic w kodzie. Nowa kategoria słownika trafia do `DICTIONARY_CATEGORIES_CONFIG` (`src/features/ozipz/constants.ts`) i typu `OzipzDictionaryType`.
- **Klasyfikacja programowe / nieprogramowe** wynika ze słownika JRWA (`src/features/ozipz/utils/calculators/jrwaClassification.ts`), nie z nazw programów.
- **Działanie w rejestrze jest wykonane.** Jedyne inne statusy to odwołane i odroczone — oba pomijane w sprawozdaniach (`isActionCountedInReports`). Planowanie należy do harmonogramu.
- **Odbiorcy to jedna liczba** (`participantsCount`). Dystrybucja zapisana razem z innym działaniem liczy 1 odbiorcę (placówkę).
- **Jedna reguła liczenia.** Miernik na ekranie, pliki załączników i hierarchia programów korzystają z tych samych funkcji agregujących (`src/features/ozipz/utils/annex/`). Nie liczymy tego samego drugi raz inną drogą.
- **Formularze nie podsuwają wartości.** Nowy rekord startuje z pustymi polami wyboru, każdy `<select>` ma pustą opcję z podpowiedzią, a schemat Zod wymaga świadomego wyboru.

## Kod

- TypeScript w trybie `strict`, bez `any` i bez wyciszania błędów (`@ts-ignore`).
- Typy domenowe: `src/features/ozipz/types/ozipz.types.ts`; wiersze SQL i kontrakt usług bazy: `src/db/types/`; schematy Zod: `src/features/ozipz/schemas/`.
- Mapowanie wiersz SQL ↔ model domenowy tylko w `src/db/mappers.ts`.
- Obie usługi bazy — `SqliteDatabaseService` (aplikacja) i `FallbackDatabaseService` (przeglądarka bez serwera) — spełniają ten sam interfejs i zachowują się tak samo, także przy zamkniętych miesiącach i wycofywaniu zmian.
- Stan bazy i operacje zapisu są w `useOzipzDbStore`, otwieranie okien w `useModalStore` — bez przekazywania tego przez wiele poziomów propsów.
- Okno dialogowe to osobny plik w katalogu swojego modułu. Plik, który rośnie powyżej ~400 linii, dzielimy według odpowiedzialności.
- Wspólne elementy interfejsu (`DataTable`, `ModalDialog`, `EmptyState`, `MetricCard`…) są w `src/components/ui/` i używamy ich zamiast tworzyć kolejne warianty.
- Nie dodajemy zależności, jeśli problem rozwiązuje kilka linii własnego kodu.
- Komentarze wyjaśniają *dlaczego*, nie *co* — po polsku, tak jak teksty interfejsu.

## Baza danych

- Schemat i migracje są w `src/db/sqlite-migrations.ts`. Zmiana schematu lub danych podnosi `SCHEMA_VERSION`; migracja działa w jednej transakcji, a przed nią powstaje kopia `ozipz.db.before-migration-<wersja>-<znacznik>.db`.
- Usuwana kolumna trafia do `RETIRED_COLUMNS`, przekształcenie danych do bloku warunkowego `user_version < N`.
- Każda zmiana schematu ma test migracji ze starszej wersji i aktualizację [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Commity i wydania

- Opis commita po polsku: w pierwszej linii co się zmieniło z punktu widzenia użytkownika, w treści — dlaczego.
- Wydanie: `pnpm release patch | minor | major` na czystej gałęzi `main` (szczegóły w README).
