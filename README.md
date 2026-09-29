<div align="center">

# Ewidencja OZiPZ

**Aplikacja do ewidencji działań Oświaty Zdrowotnej i Promocji Zdrowia w Państwowej Inspekcji Sanitarnej**

[![Wydanie](https://img.shields.io/github/v/release/Soberek/ewidencja-ozipz?label=wydanie&color=2563eb)](https://github.com/Soberek/ewidencja-ozipz/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/Soberek/ewidencja-ozipz/release.yml?label=build)](https://github.com/Soberek/ewidencja-ozipz/actions/workflows/release.yml)
![Platforma](https://img.shields.io/badge/platforma-Windows-0078d4)
![Tauri](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-lokalna%20baza-003b57?logo=sqlite&logoColor=white)

[Pobierz](#-instalacja) · [Funkcje](#-funkcje) · [Rozwój](#-uruchomienie-w-trybie-deweloperskim) · [Architektura](#-architektura)

</div>

---

## 📋 O projekcie

**Ewidencja OZiPZ** to desktopowa aplikacja dla sekcji Oświaty Zdrowotnej i Promocji Zdrowia (PSSE), która zastępuje rozproszone arkusze i papierowe rejestry jednym, spójnym narzędziem. Pozwala prowadzić rejestr działań, planować harmonogram, obsługiwać korespondencję i materiały oraz generować sprawozdania — wszystko na lokalnej bazie SQLite, bez serwera i bez wysyłania danych do chmury.

- 🔒 **Dane zostają na komputerze** — baza w folderze `Dokumenty\Ewidencja OZiPZ\ozipz.db`
- ⚡ **Szybka i lekka** — natywna aplikacja Tauri zamiast ciężkiego Electrona
- 🔄 **Automatyczne aktualizacje** — aplikacja sama powiadamia o nowych wersjach
- 💾 **Bezpieczne kopie zapasowe** — spójne migawki bazy, walidacja integralności, bezpieczne przywracanie

## ✨ Funkcje

| Obszar | Moduły |
| --- | --- |
| **Działania** | Pulpit, rejestr działań z edytorem, harmonogram, listy obecności |
| **Sprawozdawczość** | Sprawozdania, miernik budżetowy, eksport do Excel i Word |
| **Kancelaria** | Pisma, znaki spraw (JRWA), rejestry, skany, publikacje |
| **Materiały** | Katalog materiałów edukacyjnych, rozdzielniki i ich wydruk |
| **Placówki i programy** | Baza placówek, szkoły w programach, programy zdrowotne, kontakty |
| **Konfiguracja** | Słowniki, opisy zadań (szablony), kadra, ustawienia i kopie zapasowe, historia zmian i kosz |

Dodatkowo: globalna wyszukiwarka we wszystkich modułach (**Ctrl+K**), przypomnienia o terminach na pulpicie (odpowiedzi na pisma, zaległe zadania harmonogramu, blokada poprzedniego miesiąca), import placówek i kontaktów z Excela/CSV, skróty klawiszowe, leniwe ładowanie modułów z prefetchem po najechaniu w menu, tryb awaryjny przy niedostępnej bazie oraz obsługa dostępności (skip-link, role ARIA).

## 📥 Instalacja

1. Pobierz plik **`*_x64-setup.exe`** z [najnowszego wydania](https://github.com/Soberek/ewidencja-ozipz/releases/latest).
2. Uruchom instalator — aplikacja instaluje się dla bieżącego użytkownika, bez uprawnień administratora.
3. Gotowe. Kolejne wersje aplikacja wykryje i zainstaluje sama.

> [!NOTE]
> Przy pierwszym uruchomieniu baza tworzona jest w `Dokumenty\Ewidencja OZiPZ\ozipz.db`. Jeśli wcześniej używano wersji przechowującej bazę obok pliku `.exe`, zostanie ona automatycznie skopiowana (oryginał pozostaje nietknięty).

### Lokalizacja bazy danych

Folder bazy można zmienić w **Ustawieniach** (np. na dysk sieciowy lub zsynchronizowany folder). Aplikacja kopiuje aktualną bazę do nowego miejsca albo przejmuje istniejący tam plik `ozipz.db` po sprawdzeniu jego poprawności. Zmiana obowiązuje po ponownym uruchomieniu.

Na dysku sieciowym lub w folderze synchronizowanym z chmurą aplikacja przełącza SQLite z WAL na klasyczny dziennik i zakłada plik `ozipz.db.lock`: bazę może mieć otwartą tylko jeden komputer naraz. Drugi zobaczy, kto z niej korzysta, i może ją świadomie przejąć (np. po awarii tamtego komputera) — pierwsze okno zostaje wtedy zablokowane.

### Kopie zapasowe i przywracanie

- **Kopie automatyczne** — codziennie (kilkadziesiąt sekund po starcie i co godzinę sprawdzane) w `Dokumenty\Ewidencja OZiPZ\Kopie automatyczne`, także gdy sama baza leży na dysku sieciowym. Zostaje 14 ostatnich dni i po jednej kopii z 12 ostatnich miesięcy; listę i przywracanie znajdziesz w **Ustawieniach**.
- **Kopia** — wykonywana przez `VACUUM INTO`, więc jest spójna nawet podczas pracy; przed zapisaniem przechodzi `PRAGMA integrity_check`.
- **Przywracanie** — wybrana kopia jest walidowana i przygotowywana, a podmiana następuje przy kolejnym starcie. Poprzednia baza zostaje zachowana jako `ozipz.before-restore`.
- **Historia zmian i kosz** — każde dodanie, zmiana i usunięcie rekordu jest zapisywane (kto, kiedy, co) przez triggery SQLite. Usunięte rekordy można przywrócić razem z rekordami usuniętymi w tej samej operacji, a zmienione — cofnąć do poprzedniej wersji. Wpisy starsze niż 2 lata są usuwane.
- **Migracje** — przed każdą migracją schematu tworzona jest kopia `ozipz.db.before-migration-<wersja>-<znacznik>.db` (przechowywana najnowsza dla każdej wersji).

## 🛠 Uruchomienie w trybie deweloperskim

### Wymagania

- [Node.js](https://nodejs.org/) **22.5+** (zalecane 24 — serwer deweloperski korzysta z wbudowanego `node:sqlite`)
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (stable) + [zależności systemowe Tauri](https://v2.tauri.app/start/prerequisites/) — tylko dla wersji desktopowej

### Start

```bash
pnpm install

# Aplikacja w przeglądarce (http://localhost:1421)
pnpm dev:local

# Aplikacja desktopowa (Tauri)
pnpm tauri dev
```

W trybie przeglądarkowym Vite udostępnia bazę SQLite przez wbudowany plugin (`src/db/vite-sqlite-plugin.ts`), korzystając z **tego samego pliku** co zainstalowana aplikacja.

### Skrypty

| Polecenie | Opis |
| --- | --- |
| `pnpm dev:local` | Serwer deweloperski tylko na `127.0.0.1` |
| `pnpm dev` / `pnpm dev:lan` | Serwer dostępny w sieci lokalnej (wymaga klucza parowania) |
| `pnpm tauri dev` | Aplikacja desktopowa z hot-reloadem |
| `pnpm build` | Kontrola typów i build produkcyjny frontendu |
| `pnpm tauri build` | Instalator aplikacji desktopowej |
| `pnpm test` | Testy (Vitest + Testing Library) |
| `pnpm test:coverage` | Testy z raportem pokrycia (`coverage/`) |
| `pnpm typecheck` | Kontrola typów TypeScript |

### Zmienne środowiskowe

| Zmienna | Opis |
| --- | --- |
| `OZIPZ_DB_PATH` | Ścieżka do pliku bazy używanego przez serwer deweloperski (domyślnie `~/Documents/Ewidencja OZiPZ/ozipz.db`) |
| `OZIPZ_LAN_KEY` | Stały klucz parowania dla urządzeń w sieci LAN (domyślnie losowany i wypisywany w konsoli) |

> [!WARNING]
> Tryb LAN przyjmuje połączenia wyłącznie z podsieci `192.168.1.0/24` i tylko od urządzeń znających klucz parowania. Nie wystawiaj serwera deweloperskiego do Internetu.

## 🏗 Architektura

```
ewidencja-ozipz/
├── src/                         # Frontend (React + TypeScript)
│   ├── features/ozipz/          # Moduły domenowe: komponenty, store'y Zustand, hooki
│   ├── components/ui/           # Komponenty UI (Radix UI + Tailwind)
│   ├── db/                      # Klient bazy, migracje SQLite, plugin Vite
│   └── hooks/                   # Hooki współdzielone (m.in. sprawdzanie aktualizacji)
├── src-tauri/                   # Backend (Rust + Tauri 2)
│   └── src/
│       ├── lib.rs               # Lokalizacja bazy, kopie, przywracanie, komendy Tauri
│       └── publication_fetch.rs # Pobieranie źródeł publikacji
├── scripts/                     # Skrypty pomocnicze
└── .github/workflows/           # CI: build instalatora i publikacja wydania
```

### Stos technologiczny

- **Desktop:** Tauri 2, Rust, sqlx, pluginy `sql` / `dialog` / `updater` / `process`
- **Frontend:** React 19, TypeScript, Vite 6, React Router 7, Zustand, React Hook Form + Zod
- **UI:** Tailwind CSS, Radix UI, lucide-react, sonner
- **Dokumenty:** docxtemplater (Word), ExcelJS (Excel)
- **Baza danych:** SQLite (WAL, klucze obce, wersjonowane migracje)
- **Testy:** Vitest, Testing Library, jsdom, testy jednostkowe w Rust

### Bezpieczeństwo

- Restrykcyjna polityka **CSP** w oknie aplikacji — brak zewnętrznych skryptów i ramek
- Aktualizacje **podpisane kryptograficznie** i weryfikowane przed instalacją
- Serwer deweloperski chroniony tokenem sesji i kluczem parowania LAN

## 🚀 Wydawanie nowej wersji

1. Podnieś wersję w `package.json` (Tauri odczytuje ją automatycznie).
2. Utwórz i wypchnij tag:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. GitHub Actions uruchomi testy, zbuduje podpisany instalator NSIS i opublikuje wydanie wraz z plikiem `latest.json` dla auto-aktualizacji.

> Wymagane sekrety repozytorium: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

## 🧪 Testy

```bash
pnpm test                          # testy frontendu i warstwy bazy
cargo test --manifest-path src-tauri/Cargo.toml   # testy backendu Rust
```

---

<div align="center">
<sub>Sekcja Oświaty Zdrowotnej i Promocji Zdrowia · Państwowa Inspekcja Sanitarna</sub>
</div>
