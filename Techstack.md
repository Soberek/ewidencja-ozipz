# Opis Techniczny i Architektura Aplikacji: Ewidencja OZiPZ

Aplikacja **Ewidencja OZiPZ** (Oświata Zdrowotna i Promocja Zdrowia) to nowoczesny system desktopowy zbudowany na bazie **Tauri 2 + React 19 + TypeScript + Tailwind CSS + SQLite (WAL mode)**, w 100% zintegrowany z relacyjną bazą danych oraz architekturą 20 modułów odpowiadających modułowi promocji zdrowia z systemu referencyjnego `edu-report-v3-nextjs`.

---

## 1. Moduły i Struktura Aplikacji (20 modułów w 4 grupach)

### Grupa 1: Moduły główne
1. **Pulpit ewidencji (`pulpit`)**: Główny dashboard operacyjny z alertami stanów magazynowych, nadchodzącymi Dniami Zdrowia, statystykami dotarcia i skrótami szybkiego dodawania rekordów.
2. **Rejestr działań (`dzialania`)**: Ewidencja prowadzonych prelekcji, warsztatów, stoisk, konkursów i audycji z licznikami odbiorców bezpośrednich/pośrednich.
3. **Harmonogram (`harmonogram`)**: Kalendarz Dni Zdrowia, akcji terenowych i narad z filtrowaniem terminów i statusów.
4. **Pisma urzędowe (`pisma`)**: Rejestr korespondencji wychodzącej i przychodzącej z numeracją, powiązaniami z JRWA i placówkami.
5. **Rozdzielniki (`rozdzielniki`)**: Wydawanie materiałów edukacyjnych z automatycznym uaktualnianiem stanów magazynowych.
6. **Rejestry urzędowe (`rejestry`)**: Rejestr interwencji, narad, szkoleń i dystrybucji z liczbą uczestników i organizatorami.
7. **Mierniki i sprawozdania (`sprawozdania`)**: Agregacja statystyk, wskaźniki dotarcia, raporty gminne i zestawienia roczne.
8. **Skrzynka skanów PDF (`skany`)**: Ewidencja dokumentów, sprawozdań szkolnych i deklaracji z metadanymi i rozmiarem.
9. **Publikacje internetowe (`publikacje`)**: Ewidencja postów FB, komunikatów na stronie PSSE, audycji radiowych i prasowych.

### Grupa 2: Baza i kartoteki
10. **Baza lokalizacji (`lokalizacje`)**: Kartoteka placówek (szkoły, przedszkola, urzędy, szpitale) z importem JSON i wskaźnikami aktywności.
11. **Lokalizacje w programie (`szkoly-w-programie`)**: Ewidencja uczestnictwa placówek w poszczególnych programach, status deklaracji i sprawozdań.
12. **Baza kontaktów (`kontakty`)**: Baza szkolnych koordynatorów, dyrektorów, dane telefoniczne i e-mailowe.
13. **Programy i JRWA (`programy`)**: Katalog programów wojewódzkich i krajowych wraz z symboliką JRWA.

### Grupa 3: Słowniki i szablony
14. **Centrum słowników (`slowniki`)**: Słowniki tematyk, form działań, grup odbiorców i symboli.
15. **Osoby i role (`osoby`)**: Kartoteka edukatorów i pracowników sekcji OZiPZ z rolami i specjalizacjami.
16. **Formy działań (`slownik-dzialania`)**: Słownik i konfiguracja form prowadzonych działań.
17. **Szablony opisów (`opisy-zadan`)**: Baza szablonów opisów merytorycznych do kopiowania 1-kliknięciem.
18. **Rejestr znaków spraw (`znaki`)**: Ewidencja znaków spraw JRWA według roczników i numeracji.
19. **Katalog materiałów (`materialy`)**: Magazyn ulotek, plakatów, broszur z progami ostrzegawczymi.

### Grupa 4: System
20. **Ustawienia systemowe (`ustawienia`)**: Informacje o statusie bazy `ozipz.db`, trybie WAL, integralności referencyjnej oraz narzędzia konserwacji i resetowania danych.

---

## 2. Baza Danych: SQLite 3.x z Trybem WAL

Baza danych tworzy się bezpośrednio w katalogu aplikacji wykonywalnej (`.exe`) jako plik `ozipz.db`:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

### Schemat Tabel (16 tabel w 3NF)
1. `ozipz_facilities` – Baza placówek i lokalizacji.
2. `ozipz_programs` – Katalog programów profilaktycznych.
3. `ozipz_participations` – Udział placówek w programach (`UNIQUE(program_id, facility_id, school_year)`).
4. `ozipz_materials` – Magazyn materiałów edukacyjnych.
5. `ozipz_actions` – Rejestr działań edukacyjnych.
6. `ozipz_distributions` – Dystrybucja i rozdzielniki materiałów.
7. `ozipz_schedule` – Harmonogram i kalendarz Dni Zdrowia.
8. `ozipz_jrwa_cases` – Ewidencja spraw JRWA (`UNIQUE(full_case_sign)`).
9. `ozipz_publications` – Publikacje internetowe i prasowe.
10. `ozipz_dictionaries` – Dynamiczne słowniki systemowe.
11. `ozipz_letters` – Pisma urzędowe wychodzące/przychodzące.
12. `ozipz_scans` – Skany dokumentów i sprawozdań PDF.
13. `ozipz_templates` – Szablony opisów merytorycznych zadań.
14. `ozipz_staff` – Pracownicy i edukatorzy sekcji OZiPZ.
15. `ozipz_contacts` – Baza kontaktów koordynatorów.
16. `ozipz_registers` – Rejestry urzędowe (interwencje, narady, szkolenia).
