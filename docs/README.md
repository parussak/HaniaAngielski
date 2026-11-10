# Dokumentacja aplikacji „Małe kroki”

Aktualizacja układu: **10 listopada 2026 r.** Rozdzielamy stan obecny, uzgodnione założenia docelowe i sprawy do ustalenia. Sam zapis założeń nie wdraża ich w aplikacji.

**Wdrożono etapy 1–3.** Pozostałe pytania są zaparkowane. [Raport nauki](wdrozenie-nauki.md) opisuje etap 1, [raport kursów](wdrozenie-kursow.md) etap 2, a [wybór kursu i globalne ćwiczenia](wdrozenie-zakresow.md) etap 3. Autorów materiałów obowiązuje [format kursów i znaczeń](format-materialow.md). Historyczny katalog `stan-obecny/` nadal przedstawia punkt odniesienia sprzed tych zmian.

## Główny podział

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

**Mechanika opisuje możliwości, nauka określa ich użycie, a merytoryka dostarcza konkretne treści i kryteria poprawności.** Format materiałów należy do kontraktu mechaniki; reguła francuskiego rodzajnika do merytoryki, a częstotliwość treningu do nauki.

## Statusy i pierwszeństwo

- **Stan obecny** — potwierdzony w kodzie lub testach. [Punkt odniesienia](stan-obecny/README.md) oparto na rewizji 24cdeda.
- **Uzgodnione założenia docelowe** — kierunek potwierdzony w rozmowie, który może jeszcze nie być wdrożony. Rejestr: D-01–D-34 w [decyzjach](decyzje.md).
- **Do ustalenia** — pytanie bez zatwierdzonego rozwiązania. Rejestr U-01–U-10; odwołania w dokumentach nie są konkurencyjnymi decyzjami.
- **Propozycja techniczna** — kandydat do oceny, nie automatycznie zaakceptowany zakres prac.

Kod i testy pokazują, co działa dziś; nie unieważniają uzgodnionego kierunku. Dokument docelowy nie dowodzi, że funkcja już działa. Rozbieżności opisujemy jawnie, zamiast bez decyzji dopasowywać specyfikację do przypadkowego zachowania kodu.

## Ważna różnica

Docelowo moduł ma **1–3 mapy**, każda po kilka lekcji. Obecny Food nadal ma **jedną mapę z siedmioma etapami**; jej treści, identyfikatory i ukończenia pozostają zachowane. Wdrożono oddzielenie procentu ukończenia lekcji od liczby zaległych ćwiczeń oraz dodatkowy trening poznanego materiału za 1 ★. Kod obsługuje też listę do trzech map i rolę treningu na mapie, sprawdzoną na materiałach testowych; nie dodano takiego treningu do pierwszej mapy Food. Model kursów i znaczeń oraz zgodny odczyt starego Food są wdrożone w etapie 2. Wybór kursu i globalne fiszki/quiz/gramatyka z poznanego materiału są wdrożone w etapie 3. Audyt i korekta treści Food oraz nowe podręczniki pozostają dalszym zakresem — [szczegóły](wdrozenie-zakresow.md).

## Jak czytać bez przeglądania wszystkiego

- Typ zadania: mechanika, właściwy fragment nauki i testy.
- Podręcznik lub treści: [format plików](format-materialow.md), merytoryka i karta kursu.
- Trening: nauka, decyzje oraz konsekwencje dla zapisu i testów.
- Ekran: produkt, architektura i odpowiednie scenariusze interfejsu.
- Dane: zapis, model i kontrole zgodności.

Nie powielamy list słówek w Markdown ani wspólnych zasad w każdej karcie kursu. Dokumenty odsyłają do szczegółów i źródeł, żeby nie trzeba było wczytywać całej historii projektu do każdej poprawki.

## Punkt odniesienia i wcześniejsze materiały

- [Stan obecny](stan-obecny/README.md) — opis z przeglądu kodu i testów 9–10 listopada 2026 r., z zakresem wykonanych kontroli.
- [Gotowość na francuski i włoski](rozwoj-jezykow.md) — diagnoza braków J1–J10 do planowania wybranej zmiany.
- [Firebase](firebase.md), [historia](historia.md), [PWA](pwa.md), [obecna mapa i domek](kocia-przygoda.md), [edycja obecnych materiałów](../public/content/README.md) — instrukcje istniejącej aplikacji, do czytania w odpowiednim kontekście.
- Dawne wymagania, plany, raporty i podglądy dokumentują historię rozwoju. Nie są specyfikacją wszystkich obecnych lub przyszłych funkcji.

To porządkowanie nie zmienia kodu, treści ćwiczeń, testów, workflow, działania aplikacji ani postępów. Nie dodano Spec Kit, skilla ani instrukcji automatycznie sterujących agentem. Weryfikacja dotyczy dokumentacji i odnośników; wcześniejsze wyniki testów nie są przedstawiane jako nowe uruchomienia.
