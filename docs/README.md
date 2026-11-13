# Dokumentacja aplikacji „Małe kroki”

**D-52 — wdrożone:** ukończona lekcja zostaje ukończona po zmianie treści; każde konto widzi aktualną treść, a rozpoczęte sesje zachowują swój zestaw. [Reguły nauki](03-nauka.md), [edycja treści](format-materialow.md#aktualizacja-wydanej-lekcji). **D-51 — wdrożone**, z otwartą listą starszych testów przeglądarkowych do uzgodnienia — [testy](07-testy.md).

**D-50 — wdrożone:** po lekcji mapowej: Kolejna lekcja, Poziom legendarny (+1 ★ za pełną powtórkę), Wróć do mapy. Nowe sesje automatycznie mieszają formy odpowiedzi i poznany materiał; są plansze par oraz bank propozycji do luk. Obie mapy Food, stare sesje i dorobek pozostają. [Reguły nauki](03-nauka.md), [interfejs](01-produkt.md), [zapis](06-zapis.md).

Aktualizacja układu: **10 listopada 2026 r.** Rozdzielamy stan obecny, uzgodnione założenia docelowe i sprawy do ustalenia. Sam zapis założeń nie wdraża ich w aplikacji.

**Status po audycie — 11 listopada 2026:** najważniejsze porządki wykonano w czterech etapach refaktoringu. [Co jest zamknięte, co zostało i co sprawdzono](status-audytu.md). Pozostałe propozycje nie są automatycznie planem kolejnej przebudowy.

**Wdrożono etapy 1–4.** Pozostałe pytania są zaparkowane. [Raport nauki](wdrozenie-nauki.md) opisuje etap 1, [raport kursów](wdrozenie-kursow.md) etap 2, a [wybór kursu i globalne ćwiczenia](wdrozenie-zakresow.md) etap 3. [Audyt i uzupełnienie Food](wdrozenie-food.md) opisuje etap 4. Autorów materiałów obowiązuje [format kursów i znaczeń](format-materialow.md). Historyczny katalog `stan-obecny/` nadal przedstawia punkt odniesienia sprzed tych zmian.

Po przeglądzie dokumentacji poprawiono dwa ograniczenia: [przygotowanie do treningu i odporność map](odpornosc-map.md). Pozostałe mapy działają przy błędzie jednej, a trening bez poznanej puli prowadzi do wcześniejszej lekcji. Zapisane wyniki i zasady nagród pozostają zachowane.

Wprowadzono też swobodny wybór lekcji, stałą długość nowych sesji, nowe menu z Mapami, łagodniejszą informację zwrotną, jawne zasady a/an dla słówek oraz 1 ★ za pełne nowe powtórzenie lekcji — [D-36–D-40](decyzje.md). Historyczne raporty zachowują opis poprzedniego działania i dawne wyniki testów.

12 listopada rozbudowano [koci domek](koci-domek.md) o dodatkowe miejsca, osobne warstwy i kolekcję „Moje rzeczy”. Stare zakupy, ustawienia, gwiazdki i postępy pozostają zachowane; nowe miejsca działają także offline i w kopiach.

**Wdrożono D-44–D-45:** domek ma przesuwanie po siatce 24 × 15, stałe rozmiary wyposażenia i własne kolekcje pokojów. Jest przeciąganie myszą/dotykiem i strzałki pod podglądem. Stare zakupy i ustawienia pozostają czytelne bez przymusowej migracji. [Specyfikacja domku](koci-domek.md).

## Główny podział

**Wdrożono D-48–D-49:** stabilna sekcja 7 + 2 dla nie rozpoczętych „Ilości i opakowania”, krótkie powtórki wcześniejszych błędów ze wspólnym licznikiem, kocie zaproszenia do rozgrzewki, treningu i Misji Kociego Mistrza. Rozpoczęte sekcje, ukończenia i dorobek pozostają. [Zasady i zakres](03-nauka.md), [wygląd zaproszeń](01-produkt.md).

**Wdrożono D-46–D-47:** „Kocia rozgrzewka” zastępuje treningi — na mapie jest wymagana, dodatkowa dobrowolna. Ukończone mapy i etapy pokazują sukces bez liczników zaległych błędów, a krótkie sesje mają wyraźne zakończenie. Stare ukończenia, gwiazdki i rozpoczęte sesje zostają. [Zasady, zakres i ochrona wyników](03-nauka.md).

11 listopada 2026 wykonano [etap 1 refaktoringu: zależności i wspólne stałe](refaktoring-etap-1.md). Usunięto cykl mapy–domek, zachowując działanie, wygląd i format postępów. To osobny etap porządkowania po wcześniejszych etapach rozwoju funkcji 1–4.

[Etap 2 refaktoringu](refaktoring-etap-2.md) oddziela syntetyczne testy mechaniki, regresje Food wybieranego po ID i kontrole całej rozbudowywanej biblioteki. Nie zmienia kodu aplikacji ani produkcyjnych treści.

[Etap 3 refaktoringu](refaktoring-etap-3.md) wydziela obsługę przycisków domku do osobnego kontrolera. Rozliczanie ukończenia nauki, wygląd i zapis pozostają bez zmian.

[Etap 4 refaktoringu](refaktoring-etap-4.md) dzieli walidację kopii na mniejsze części. Zachowuje obsługę starych plików, kryteria walidacji i format postępów; zgodność sprawdza zestaw wyników sprzed podziału.

| Dokument | Na jakie pytanie odpowiada? |
| --- | --- |
| [01 · Produkt](01-produkt.md) | Dla kogo i po co jest aplikacja? Jak korzystamy z nauki prowadzonej i swobodnej? |
| [02 · Mechanika](02-mechanika.md) | Jakie obiekty istnieją i co mogą: kurs, moduł, mapa, lekcja, hasło, pytanie, quiz i sesja? |
| [03 · Nauka](03-nauka.md) | Jak prowadzimy przez materiał, dobieramy treningi, zbieramy błędy i przyznajemy nagrody? |
| [04 · Merytoryka](04-merytoryka.md) | Skąd pochodzą treści i co oznacza ich poprawność językowa? |
| [05 · Architektura](05-architektura.md) | Jak odpowiedzialności są realizowane w kodzie i gdzie wprowadzać zmiany? |
| [06 · Zapis](06-zapis.md) | Co i gdzie zapisujemy oraz jak chronimy wyniki? |
| [07 · Testy](07-testy.md) | Jak kontrolujemy każdą część i kiedy dodajemy lub uruchamiamy testy? |
| [Decyzje](decyzje.md) | Co ustalono i jakie pytania wymagają rozstrzygnięcia? |
| [Karty kursów](kursy/README.md) | Co jest właściwe dla angielskiego Hani, francuskiego Hani i włoskiego Pauliny? |
| [Rozbudowa kociego domku](koci-domek.md) | Wdrożone: osobne domki i portfele kursów, kuchnia za Food i wyposażenie za mapy |

**Mechanika opisuje możliwości, nauka określa ich użycie, a merytoryka dostarcza konkretne treści i kryteria poprawności.** Format materiałów należy do kontraktu mechaniki; reguła francuskiego rodzajnika do merytoryki, a częstotliwość treningu do nauki.

## Statusy i pierwszeństwo

- **Stan obecny** — potwierdzony w kodzie lub testach. [Punkt odniesienia](stan-obecny/README.md) oparto na rewizji 24cdeda.
- **Uzgodnione założenia docelowe** — kierunek potwierdzony w rozmowie, który może jeszcze nie być wdrożony. Rejestr: D-01–D-42 w [decyzjach](decyzje.md).
- **Do ustalenia** — pytanie bez zatwierdzonego rozwiązania. Rejestr U-01–U-10; odwołania w dokumentach nie są konkurencyjnymi decyzjami.
- **Propozycja techniczna** — kandydat do oceny, nie automatycznie zaakceptowany zakres prac.

Kod i testy pokazują, co działa dziś; nie unieważniają uzgodnionego kierunku. Dokument docelowy nie dowodzi, że funkcja już działa. Rozbieżności opisujemy jawnie, zamiast bez decyzji dopasowywać specyfikację do przypadkowego zachowania kodu.

## Ważna różnica

Docelowo moduł ma **1–3 mapy**, każda po kilka lekcji. Food ma **dwie mapy**: zachowaną mapę z siedmioma etapami i 41 lekcjami oraz „Kocią kuchnię” z pięcioma lekcjami. Poprawione wersje lekcji etapów 5–7 są od D-52 aktualną treścią dla wszystkich kont; istniejące ukończenia, rozpoczęte sesje i gwiazdki pozostają zachowane. Wdrożono oddzielenie procentu ukończenia lekcji od liczby zaległych ćwiczeń oraz dodatkowy trening poznanego materiału za 1 ★. Druga mapa Food ma trening wcześniejszej mapy; pierwsza pozostaje bez takich lekcji. Model kursów i znaczeń oraz zgodny odczyt starego Food są wdrożone w etapie 2. Wybór kursu i globalne fiszki/quiz/gramatyka z poznanego materiału są wdrożone w etapie 3. Audyt i uzupełnienie Food wdrożono w etapie 4 — [zakres, źródła i ograniczenia](wdrozenie-food.md). Nowe podręczniki pozostają dalszym zakresem.

## Jak czytać bez przeglądania wszystkiego

Do bieżącej pracy: [dodawanie modułu](dodawanie-modulow.md), [szablon karty materiałów](szablon-modulu.md) i [utrzymanie dokumentacji](utrzymanie-dokumentacji.md). Towarzyszy im [skill projektu](../.agents/skills/male-kroki-dokumentacja/SKILL.md), który pomaga sprawdzić i aktualizować odpowiedni wycinek dokumentacji bez wczytywania całego projektu. Skrypt `node scripts/check-docs.mjs` kontroluje odnośniki plikowe; zgodność merytoryczna wymaga przeglądu właściwych źródeł.

- Typ zadania: mechanika, właściwy fragment nauki i testy.
- Podręcznik lub treści: [format plików](format-materialow.md), merytoryka i karta kursu.
- Trening: nauka, decyzje oraz konsekwencje dla zapisu i testów.
- Ekran: produkt, architektura i odpowiednie scenariusze interfejsu.
- Dane: zapis, model i kontrole zgodności.

Nie powielamy list słówek w Markdown ani wspólnych zasad w każdej karcie kursu. Dokumenty odsyłają do szczegółów i źródeł, żeby nie trzeba było wczytywać całej historii projektu do każdej poprawki.

## Punkt odniesienia i wcześniejsze materiały

Przegląd zgodności **10 listopada 2026 r.** objął bieżące opisy produktu, mechaniki, nauki, zapisu, architektury, instrukcji materiałów i PWA. Porównano je z właściwym kodem, odczytanym katalogiem treści, scenariuszami testów i workflow. Poprawiono rozbieżności pozostawione po etapach 1–4; znane ograniczenia są jawnie opisane w [nauce](03-nauka.md) i [architekturze](05-architektura.md). Był to przegląd dokumentacji, bez zmian aplikacji, ponownego uruchamiania pełnych testów, nowej recenzji podręcznika ani weryfikacji opublikowanej strony. Historyczne wyniki testów zachowują swoje pierwotne znaczenie.

- [Stan obecny](stan-obecny/README.md) — opis z przeglądu kodu i testów 9–10 listopada 2026 r., z zakresem wykonanych kontroli.
- [Gotowość na francuski i włoski](rozwoj-jezykow.md) — diagnoza braków J1–J10 do planowania wybranej zmiany.
- [Firebase](firebase.md), [historia](historia.md), [PWA](pwa.md), [obecna mapa i domek](kocia-przygoda.md), [edycja obecnych materiałów](../public/content/README.md) — instrukcje istniejącej aplikacji, do czytania w odpowiednim kontekście.
- Dawne wymagania, plany, raporty i podglądy dokumentują historię rozwoju. Nie są specyfikacją wszystkich obecnych lub przyszłych funkcji.

Pierwotne uporządkowanie dokumentacji nie zmieniało aplikacji. Późniejsze wdrożenia i wyniki kontroli opisują raporty etapów 1–4. Historycznego katalogu `stan-obecny/` nie aktualizujemy wstecz. Następnie dodano instrukcje pracy i skill utrzymania dokumentacji, bez zmiany zachowania aplikacji. Nie dodano Spec Kit.
