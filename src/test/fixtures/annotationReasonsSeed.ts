export interface PowodAdnotacji {
  id: string;
  kod: string;
  tytul: string;
  opis: string;
}

export const ADNOTACJA_POWODY: PowodAdnotacji[] = [
  {
    id: "brak_terminu",
    kod: "brak_terminu",
    tytul: "Brak wolnego terminu u odbiorcy",
    opis: "Placówka / odbiorca nie dysponował wolnym terminem w zaplanowanym miesiącu mimo podjętych ustaleń.",
  },
  {
    id: "odwolanie_odbiorcy",
    kod: "odwolanie_odbiorcy",
    tytul: "Odwołanie ze strony odbiorcy",
    opis: "Odbiorca odwołał uzgodnione spotkanie lub cykle działań z przyczyn leżących po jego stronie.",
  },
  {
    id: "choroba_pracownika",
    kod: "choroba_pracownika",
    tytul: "Nieobecność chorobowa pracownika",
    opis: "Zaplanowane działanie nie mogło zostać zrealizowane z powodu nieobecności chorobowej osoby odpowiedzialnej.",
  },
  {
    id: "urlop",
    kod: "urlop",
    tytul: "Urlop wypoczynkowy / okolicznościowy",
    opis: "Realizacja planu kolidowała z urlopem osoby odpowiedzialnej; nie udało się zapewnić zastępstwa w terminie.",
  },
  {
    id: "brak_zastepstwa",
    kod: "brak_zastepstwa",
    tytul: "Brak możliwości zapewnienia zastępstwa",
    opis: "W okresie realizacji nie było możliwe zapewnienie innego pracownika do przeprowadzenia działania.",
  },
  {
    id: "kolizja_pilnych",
    kod: "kolizja_pilnych",
    tytul: "Kolizja z zadaniami pilnymi / doraźnymi",
    opis: "Priorytetowe zadania służbowe uniemożliwiły przeprowadzenie zaplanowanego działania w danym miesiącu.",
  },
  {
    id: "epidemie_absencje",
    kod: "epidemie_absencje",
    tytul: "Absencje odbiorców (choroby / kwarantanna)",
    opis: "Znaczne absencje w grupie docelowej (choroby, izolacja) spowodowały odroczenie lub rezygnację z realizacji.",
  },
  {
    id: "zmiana_organizacji",
    kod: "zmiana_organizacji",
    tytul: "Zmiana organizacji pracy w placówce",
    opis: "Reorganizacja zajęć / harmonogramu w placówce uniemożliwiła przeprowadzenie działania w planowanym terminie.",
  },
  {
    id: "brak_sali",
    kod: "brak_sali",
    tytul: "Brak dostępnej sali / pomieszczenia",
    opis: "Nie zapewniono odpowiedniego pomieszczenia do przeprowadzenia działania w uzgodnionym terminie.",
  },
  {
    id: "awaria_sprzetu",
    kod: "awaria_sprzetu",
    tytul: "Awaria sprzętu / brak pomocy dydaktycznych",
    opis: "Awaria sprzętu audiowizualnego lub brak niezbędnych materiałów uniemożliwiły przeprowadzenie działania.",
  },
  {
    id: "brak_materialow",
    kod: "brak_materialow",
    tytul: "Opóźnienie dostawy materiałów edukacyjnych",
    opis: "Materiały edukacyjne / ulotki nie wpłynęły na czas, co uniemożliwiło realizację zgodnie z planem.",
  },
  {
    id: "zmiana_jrwa",
    kod: "zmiana_jrwa",
    tytul: "Zmiana zakresu / programu działania",
    opis: "W trakcie miesiąca zmieniono zakres merytoryczny lub program, przez co pierwotne działanie nie zostało zrealizowane.",
  },
  {
    id: "brak_akceptacji",
    kod: "brak_akceptacji",
    tytul: "Brak akceptacji dyrekcji / organu prowadzącego",
    opis: "Nie uzyskano wymaganej zgody dyrekcji lub organu prowadzącego na przeprowadzenie działania.",
  },
  {
    id: "odmowa_rodzicow",
    kod: "odmowa_rodzicow",
    tytul: "Brak zgód rodziców / opiekunów",
    opis: "Niewystarczająca liczba zgód rodziców lub opiekunów uniemożliwiła objęcie grupy działaniem.",
  },
  {
    id: "wyjazd_grupy",
    kod: "wyjazd_grupy",
    tytul: "Wyjazd / wycieczka grupy docelowej",
    opis: "Grupa docelowa przebywała poza placówką (wycieczka, zielona szkoła) w terminie zaplanowanego działania.",
  },
  {
    id: "egzaminy",
    kod: "egzaminy",
    tytul: "Okres egzaminów / sprawdzianów",
    opis: "Realizacja kolidowała z okresem egzaminów lub intensywnych sprawdzianów – placówka wniosła o przełożenie.",
  },
  {
    id: "wakacje_ferie",
    kod: "wakacje_ferie",
    tytul: "Przerwa świąteczna / ferie / wakacje",
    opis: "W okresie planowanej realizacji placówka nie prowadziła zajęć (ferie, wakacje, przerwa świąteczna).",
  },
  {
    id: "strajk_protest",
    kod: "strajk_protest",
    tytul: "Zakłócenia organizacji (protest / strajk)",
    opis: "Zakłócenia organizacji pracy w placówce uniemożliwiły przeprowadzenie zaplanowanego działania.",
  },
  {
    id: "warunki_atmosferyczne",
    kod: "warunki_atmosferyczne",
    tytul: "Niekorzystne warunki atmosferyczne",
    opis: "Ekstremalne warunki pogodowe uniemożliwiły dojazd lub bezpieczne przeprowadzenie działania.",
  },
  {
    id: "brak_dojazdu",
    kod: "brak_dojazdu",
    tytul: "Problemy z dojazdem do lokalizacji",
    opis: "Utrudnienia komunikacyjne / brak możliwości dojazdu uniemożliwiły realizację w terminie.",
  },
  {
    id: "zmiana_kadry",
    kod: "zmiana_kadry",
    tytul: "Zmiana osoby odpowiedzialnej",
    opis: "W trakcie miesiąca zmieniono osobę odpowiedzialną; nowa osoba nie zdążyła zrealizować planu w okresie sprawozdawczym.",
  },
  {
    id: "szkolenie_obowiazkowe",
    kod: "szkolenie_obowiazkowe",
    tytul: "Obowiązkowe szkolenie / narada służbowa",
    opis: "Obowiązkowe szkolenie lub narada służbowa wypadała w terminie uniemożliwiającym realizację działania.",
  },
  {
    id: "kontrola_audyt",
    kod: "kontrola_audyt",
    tytul: "Kontrola / audyt / czynności służbowe",
    opis: "Trwająca kontrola, audyt lub inne czynności służbowe wyłączyły możliwość realizacji planu w danym miesiącu.",
  },
  {
    id: "brak_danych",
    kod: "brak_danych",
    tytul: "Brak kompletnych danych do przygotowania",
    opis: "Nie otrzymano na czas danych niezbędnych do przygotowania merytorycznego działania (listy, grupy, temat).",
  },
  {
    id: "nieadekwatnosc",
    kod: "nieadekwatnosc",
    tytul: "Działanie nieadekwatne do aktualnej sytuacji",
    opis: "Po analizie uznano, że forma / temat działania nie odpowiada aktualnej sytuacji odbiorców; zaplanowano zmianę formy w kolejnym okresie.",
  },
  {
    id: "polaczenie_dzialan",
    kod: "polaczenie_dzialan",
    tytul: "Połączenie z innym działaniem (inna data)",
    opis: "Działanie zostało połączone z innym terminem / cyklem i rozliczone poza pierwotnym miesiącem planu.",
  },
  {
    id: "odroczenie_ustalenie",
    kod: "odroczenie_ustalenie",
    tytul: "Odroczenie za porozumieniem stron",
    opis: "Strony ustaliły odroczenie realizacji na kolejny miesiąc z zachowaniem celu programu.",
  },
  {
    id: "brak_frekwencji",
    kod: "brak_frekwencji",
    tytul: "Zbyt niska deklarowana frekwencja",
    opis: "Deklarowana liczba uczestników była zbyt niska, by celowe było przeprowadzenie działania w planowanej formie.",
  },
  {
    id: "ograniczenia_sanitarne",
    kod: "ograniczenia_sanitarne",
    tytul: "Ograniczenia sanitarno-epidemiologiczne",
    opis: "Obowiązujące ograniczenia sanitarne lub rekomendacje uniemożliwiły realizację działania w założonej formie.",
  },
  {
    id: "inne_uzasadnione",
    kod: "inne_uzasadnione",
    tytul: "Inne uzasadnione okoliczności",
    opis: "Wystąpiły inne, udokumentowane okoliczności uniemożliwiające realizację zaplanowanego działania w danym miesiącu.",
  },
];
