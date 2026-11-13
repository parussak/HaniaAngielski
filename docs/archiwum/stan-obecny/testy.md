# Testy i zakres weryfikacji — stan obecny

Przegląd z 9–10 listopada 2026 r., rewizja `24cdeda`. Dokument rozdziela istniejące testy, wyniki uruchomień i propozycje dalszego uporządkowania.

## Wyniki tego przeglądu

| Kontrola | Wynik | Co oznacza |
| --- | --- | --- |
| `npm.cmd test` | 84/84 zakończone powodzeniem | Wykonano istniejące testy `tests/*.test.ts` |
| `npm.cmd run check:content` | Powodzenie | Złożono i zwalidowano obecny katalog: 97 fiszek, 168 zadań, 9 zasad |
| `npx.cmd playwright test --list` | 51 testów w 17 plikach | Potwierdzono kolekcję i przejrzano zakres; nie jest to wynik wykonania testów przeglądarkowych |

Nie uruchamiano ponownie przeglądarki ani budowania aplikacji dla samej zmiany dokumentacyjnej. Nie badano produkcyjnego Firebase, prawdziwego telefonu ani poprawności całej treści wobec skanów podręcznika.

## Jakie warstwy są testowane

| Obszar | Przykłady pokrycia | Główne pliki |
| --- | --- | --- |
| Nauka | Pierwsza próba, poprawki, powrót błędu, zakres sesji, statusy słów | [core](../../../tests/core.test.ts), [active-flashcards](../../../tests/active-flashcards.test.ts), [review-input](../../../tests/review-input.test.ts) |
| Mapy i nagrody | Odblokowywanie, brak ponownej nagrody, zakupy i pełna ścieżka Food | [adventure](../../../tests/adventure.test.ts) |
| Powtórki etapowe | 3 zaliczenia, odstępy w turach, reset serii, premia, zgodność kopii | [stage-review](../../../tests/stage-review.test.ts) |
| Następny krok | Aktywna sesja, kolejna lekcja/mapa, zaległe powtórki | [next-step](../../../tests/next-step.test.ts) |
| Zapis i archiwa | Błąd transakcji, stare kopie, 1500 sesji, niezmienne części i statystyki | [core](../../../tests/core.test.ts), [history](../../../tests/history.test.ts) |
| Synchronizacja | Wersje, konflikty, zmiana konta, praca bez sieci, utrata potwierdzenia | [sync](../../../tests/sync.test.ts) |
| Materiały | Walidacja, odwołania, zmiana słowa, wybrane ustalenia Food i ilustracje | [content](../../../tests/content.test.ts), [illustrations](../../../tests/illustrations.test.ts), [dialogues](../../../tests/dialogues.test.ts) |
| Pełne scenariusze | Nauka, błąd, wznowienie, eksport/import, konto, mapa, domek | [tests/browser](../../../tests/browser) |
| Telefon i PWA | Małe szerokości, obrót, dotyk, zimny start offline, oczekująca aktualizacja | [mobile](../../../tests/browser/mobile.spec.ts), [pwa](../../../tests/browser/pwa.spec.ts) |

Testy Node używają `node:test` i odczytu TypeScript przez `--experimental-strip-types`; IndexedDB jest również sprawdzane z `fake-indexeddb`. Playwright korzysta z Chromium, z opcjonalnym kanałem Edge. Widoki mobilne są emulowane, nie są pełną macierzą prawdziwych urządzeń.

Testy kont i synchronizacji w przeglądarce korzystają z atrap/usług testowych, m.in. `mockSDK` i `backend` w [firebase.spec.ts](../../../tests/browser/firebase.spec.ts) oraz [pwa-server.ts](../../../tests/browser/pwa-server.ts). Testy PWA używają rzeczywistego service workera lokalnego wydania; nie oznacza to testu prawdziwej usługi Firebase.

Źródła konfiguracji: [package.json](../../../package.json), [Playwright](../../../playwright.config.ts), [materiały testowe](../../../tests/materials.ts).

## Co jest uruchamiane automatycznie w GitHub

[checks.yml](../../../.github/workflows/checks.yml) wykonuje instalację zależności, testy Node, kontrolę treści i budowanie. [pages.yml](../../../.github/workflows/pages.yml) przed publikacją wykonuje testy Node i budowanie, które również zawiera kontrolę treści i typów. Publikacja startuje po pushu na `main` lub ręcznie.

**Playwright nie jest obecnie częścią tych workflow.** Nie ma w nich również recenzji językowej ani testu reguł Firestore na emulatorze. Komunikat o powodzeniu publikacji nie potwierdza wszystkich tych obszarów.

## Ograniczenia obecnych testów

1. Wiele testów materiałów i nawigacji zakłada `modules[0]`, pojedynczy Food, konkretne liczby oraz angielskie odpowiedzi. Dodanie katalogu francuskiego wymaga rozdzielenia testów wspólnego formatu od regresji konkretnego Food. Nie należy po prostu usuwać kontroli treści Food.
2. Test następnego modułu w [next-step.spec.ts](../../../tests/browser/next-step.spec.ts) tworzy drugi zestaw przez skopiowanie Food. Sprawdza mechanizm wielu map, ale nie francuskie/włoskie teksty, akcenty ani granice kursów.
3. `check:content` nie kontroluje wszystkich map i istnienia wszystkich zasobów. Nie sprawdza językowej zgodności z podręcznikiem.
4. Nie ma osobnej macierzy testów francuskich i włoskich: akcentów, apostrofów, rodzajników, odmian oraz odpowiedzi w dwóch kierunkach.
5. Część starszych testów, np. [stage2.test.ts](../../../tests/stage2.test.ts), sprawdza fragmenty kodu źródłowego. To kontrola krucha przy przenoszeniu plików; nie zawsze zastępuje test zachowania.
6. Nazwy `stage1`, `stage2`, `stage3` opisują historyczne etapy wdrożenia. Podział testów na mechanikę, zapis, materiały i UI jest dziś głównie logiczny, nie konsekwentnie odzwierciedlony w katalogach.

## Propozycja zasad na kolejne zmiany — jeszcze nie wymuszona narzędziami

- Nowa zasada działania: test oczekiwanego zachowania i istotnego przypadku brzegowego.
- Naprawa błędu, który może wrócić: test regresji.
- Zmiana zapisu: zgodność starszych kopii, zachowanie aktywnej sesji i sprawdzenie odseparowania kont; test migracji tylko jeśli rzeczywiście zmienia się format.
- Nowy materiał: wspólna walidacja wszystkich modułów i map oraz osobna recenzja językowa. Dodatkowe testy tylko dla rzeczywiście nowych przypadków.
- Drobna kosmetyka: weryfikacja adekwatna do ryzyka, bez automatycznego tworzenia testu dla każdego napisu.
- Zmiana oczekiwania testu: najpierw ustalenie, czy zmieniło się uzgodnione zachowanie, czy powstał błąd; nie dopasowywać testów bez wyjaśnienia.

W trakcie pracy można wykonywać kontrole obszaru i zależności. Przed publikacją zmian aplikacji zalecany jest uzgodniony pełny zestaw oraz testy najważniejszych przebiegów w przeglądarce. Obecna automatyzacja GitHub jest węższa, jak opisano wyżej.

To propozycja do zatwierdzenia przy projektowaniu instrukcji dla agenta lub skilla; niniejsza dokumentacja nie instaluje takiego procesu.
