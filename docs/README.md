# Dokumentacja aplikacji „Małe kroki”

Spis bieżącej dokumentacji. Czytaj tylko dokument potrzebny do zadania — nie całość. Historia zmian i dawne raporty są w [archiwum](archiwum/README.md) i nie są czytane domyślnie.

## Od czego zacząć

| Zadanie | Przeczytaj |
| --- | --- |
| Nowy moduł lub rozdział z podręcznika | [Dodawanie modułu](dodawanie-modulow.md), [szablon karty](szablon-modulu.md), karta kursu w [kursach](kursy/README.md) |
| Poprawka treści (słówka, zadania, sceny) | [Format materiałów](format-materialow.md), [merytoryka](04-merytoryka.md), [edycja treści](../public/content/README.md) |
| Zmiana zasad nauki, treningów, nagród | [Nauka](03-nauka.md), [decyzje](decyzje.md) |
| Zmiana ekranu | [Produkt](01-produkt.md), [architektura](05-architektura.md) |
| Zmiana kodu lub podziału odpowiedzialności | [Architektura](05-architektura.md), [mechanika](02-mechanika.md) |
| Konta, offline, kopie, synchronizacja | [Zapis](06-zapis.md) |
| Testy i kontrole | [Testy](07-testy.md) |
| Aktualizacja samej dokumentacji | [Utrzymanie dokumentacji](utrzymanie-dokumentacji.md) |

## Dokumenty główne

| Dokument | Na jakie pytanie odpowiada? |
| --- | --- |
| [01 · Produkt](01-produkt.md) | Dla kogo i po co jest aplikacja? Jak wygląda nauka prowadzona i swobodna? |
| [02 · Mechanika](02-mechanika.md) | Jakie obiekty istnieją i co mogą: kurs, moduł, mapa, lekcja, hasło, pytanie, quiz, sesja? |
| [03 · Nauka](03-nauka.md) | Jak prowadzimy przez materiał, dobieramy treningi, zbieramy błędy i przyznajemy nagrody? |
| [04 · Merytoryka](04-merytoryka.md) | Skąd pochodzą treści i co oznacza ich poprawność językowa? |
| [05 · Architektura](05-architektura.md) | Gdzie w kodzie jest dana odpowiedzialność i gdzie wprowadzać zmiany? |
| [06 · Zapis](06-zapis.md) | Co i gdzie zapisujemy oraz jak chronimy wyniki? |
| [07 · Testy](07-testy.md) | Jak kontrolujemy każdą część i kiedy dodajemy lub uruchamiamy testy? |
| [Decyzje](decyzje.md) | Co ustalono (D-xx) i co czeka na rozstrzygnięcie (U-xx)? |
| [Karty kursów](kursy/README.md) | Co jest właściwe dla angielskiego Hani, francuskiego Hani i włoskiego Pauliny? |

Tematyczne: [koci domek](koci-domek.md), [mapa i domek](kocia-przygoda.md), [odporność map](odpornosc-map.md), [generowanie audio](generowanie-audio.md), [PWA](pwa.md), [Firebase](firebase.md), [historia sesji](historia.md), [moduł Food](materialy-food.md), [sceny Food do recenzji](recenzja-scen-food.md), [gotowość na francuski i włoski](rozwoj-jezykow.md).

## Zasada podziału

**Mechanika opisuje możliwości, nauka określa ich użycie, a merytoryka dostarcza treść i kryteria poprawności.** Format materiałów należy do mechaniki i jest wspólny dla wszystkich kursów; reguła francuskiego rodzajnika należy do merytoryki, a częstotliwość treningu do nauki. Treść kursów leży w `public/content/` i nie zawiera logiki.

## Statusy

- **Stan obecny** — potwierdzony w kodzie lub testach.
- **Uzgodnione** — decyzja D-xx w [rejestrze](decyzje.md); może jeszcze nie być wdrożona.
- **Do ustalenia** — pytanie U-xx bez zatwierdzonego rozwiązania.
- **Propozycja** — kandydat do oceny, nie zaakceptowany zakres prac.

Kod pokazuje, co działa dziś, ale nie unieważnia uzgodnionego kierunku. Rozbieżności opisujemy jawnie zamiast dopasowywać specyfikację do przypadkowego zachowania kodu.

## Stan treści

Kurs angielski Hani ma moduł **Food**: dwie mapy (siedem etapów z 41 lekcjami oraz „Kocia kuchnia” z pięcioma lekcjami), w tym cztery historyjki-sceny i nagrania głosem Cori. Francuski i włoski nie mają jeszcze materiałów; kolejne rozdziały podręcznika to dalszy zakres.

## Kontrola

`node scripts/check-docs.mjs` sprawdza lokalne odnośniki w dokumentacji. Nie sprawdza kotwic nagłówków ani zgodności opisów z kodem — do tego służy przegląd właściwych źródeł, np. ze [skillem projektu](../.agents/skills/male-kroki-dokumentacja/SKILL.md).
