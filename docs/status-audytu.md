# Status porządków po audycie

Przegląd: 11 listopada 2026. Dotyczy [audytu z 10 listopada](audyt-refaktoringu.md), kodu, właściwych fragmentów specyfikacji i testów. Pierwszy przegląd zmieniał tylko dokumentację. Następnie, na osobne zlecenie, uporządkowano testy widoków i potwierdzenia zastępowania sesji; opis poniżej uwzględnia te porządki.

## Ocena

**Najważniejsze porządki są wykonane.** Usunięto cykl mapy–domek i powielenie wspólnych stałych, zabezpieczono testy przed rozbudową biblioteki, wydzielono kontroler domku i podzielono walidację kopii. Nie ma potwierdzonej potrzeby kolejnej szerokiej przebudowy przed rozwijaniem materiałów.

Numeracja etapów wykonanych w rozmowie różni się od pierwotnej kolejności w audycie. Poniższe zestawienie odnosi się do numerów **ustaleń 3.1–3.9**, nie do numerów dawnych etapów.

| Ustalenie audytu | Obecny status i dowód | Co pozostało |
| --- | --- | --- |
| 3.1 · Zależności mapy–domek i stałe nagród | Zamknięte w [etapie 1](refaktoring-etap-1.md). Typy i klucze są w `learning/journey.ts`, wartości nagród w `learning/rewards.ts`; test granicy sprawdza brak wykonawczej zależności domku od `adventure.ts`. | Bez dalszej zmiany zasad nagród i formatu portfeli. |
| 3.2 · Szczegóły Food/angielskiego | Częściowo zamknięte: identyfikator historycznego kursu ma jedno źródło, walidacja używa katalogowej listy miejsc. Food w katalogu nagród jest treścią konfiguracji; zgodny odczyt dawnych danych jest zamierzony. | Lista miejsc zależnych od języka jest w [aktualizacji gotowości](rozwoj-jezykow.md). Przejrzeć je przy rzeczywistych materiałach FR/IT, bez projektowania abstrakcji na zapas. |
| 3.3 · Monolityczna walidacja kopii | Zamknięte w [etapie 4](refaktoring-etap-4.md): części walidatora i 116 wyników odniesienia sprzed podziału. | Nowe kryteria i migracje wymagają osobnego zakresu; nie zmieniamy ich przy porządkach. |
| 3.4 · Testy czytające tekst widoków | Zamknięte: hasło strony głównej, etykiety, pole odpowiedzi i podsumowanie są sprawdzane na wyrenderowanym interfejsie (`home.spec.ts`, `ui-contracts.spec.ts`). Konfiguracja Playwright jest importowana i sprawdzana przez wynik. | Kontrole struktury zależności i pliku workflow pozostają celowo statyczne; nie sprawdzają tekstu widoku. |
| 3.5 · Food jako pierwszy i jedyny moduł | Zamknięte w [etapie 2](refaktoring-etap-2.md). Mechanika ma dane syntetyczne, Food wybór po ID, a cały katalog osobne kontrole rozbudowy. | Lokalne indeksy w jawnej fixture lub scenariuszu Food są poprawne; nie trzeba usuwać każdego `[0]`. |
| 3.6 · Kontroler nauki obejmuje domek | Obsługa przycisków domku wydzielona w [etapie 3](refaktoring-etap-3.md). Rozliczenie ukończenia lekcji i odblokowania pozostaje celowo przy nauce. | Potwierdzanie i otwieranie nowej sesji są teraz wspólne (`confirmReplacement`, `openSession`). Zachowano komunikaty, kolejność i wyjątki; 20 przypadków kontrolera chroni zgodę, odmowę, brak aktywnej sesji i błąd zapisu. |
| 3.7 · Polska liczba mnoga | Zamknięte w etapie 1: `polish-count.ts`, używany przez liczniki ćwiczeń i powtórek. | Brak bieżącego zadania. |
| 3.8 · Stały zestaw domyślnych błędnych odpowiedzi | Nadal możliwy dla słówka bez własnego zestawu: wybierane są pierwsze inne hasła; kolejność opcji jest tasowana. | To ewentualna zmiana nauki, nie refaktoring. Osobna decyzja, jeśli chcemy inne dobieranie opcji. |
| 3.9 · Oddzielenie pobierania i odczytu map | Zalecany interfejs już istnieje: `readJourneys(modules, read)`. `loadJourneys` jest jego przeglądarkową otoczką; `check:content` korzysta z odczytu bez DOM. | Przeniesienie otoczki `fetch` do innego pliku jest opcjonalne. Nie trzeba wdrażać ponownie wstrzykiwania odczytu. |

## Drobne kwestie dokumentacji i narzędzi

- Liczenie wywołań `test(` nie określa liczby przypadków Playwright — część powstaje w pętlach. Wynik 86 z wcześniejszego wdrożenia nie był sprzeczny z 72 zapisami w kodzie; w pierwszym przeglądzie lista miała 88 przypadków. Kolejne kontrole mogą tę liczbę zmieniać.
- Odrzucenie uszkodzonej kopii nie usuwa obecnych wyników. Import jest sprawdzany przed zastąpieniem zapisu; określenie z dawnego audytu sugerujące automatyczną utratę danych przy odrzuceniu pliku było zbyt mocne.
- W [zasadach testowania](07-testy.md) bieżący punkt odniesienia jest teraz na początku. Dawne wyniki pozostają historią, nie wymaganiem utrzymania konkretnej liczby testów.
- Skrót `check:docs` w `package.json` i kontrola dokumentacji w CI pozostają opcjami. Polecenie `node scripts/check-docs.mjs` jest opisane i działa; brak skrótu nie jest rozbieżnością kontraktu.
- Historyczne nazwy `stage1/2/3.test.ts` można zmienić przy porządkowaniu ich zakresu. Nie wymagają samodzielnej akcji.

## Zgodność dokumentacji z kodem

Sprawdzono opisy zmian z etapów refaktoringu 1–4, odpowiednie miejsca kodu i testy ochronne. Zgodne pozostają: osobne portfele kursów, dawny dorobek angielskiego, rozdzielenie kontrolerów, wersja kopii 1, podział walidacji i osobne sprawdzenie integralności pełnej historii.

Poprawiono opis architektury sugerujący, że tylko katalogi i dobór ćwiczeń są ograniczone kursem — domek i portfel też są osobne dla kursów. Doprecyzowano status historycznej diagnozy językowej i jej dawnego planu, dodając aktualną listę konkretnych miejsc do sprawdzenia przed FR/IT. Nie przepisywano dawnych raportów ani wyników ich uruchomień; oryginalny audyt ma odnośnik do tego statusu.

To przegląd obszarów audytu, nie ponowny audyt wszystkich treści podręcznika ani test na prawdziwym koncie Hani.

## Weryfikacja pierwszego przeglądu dokumentacji

Uruchomiono **14/14 testów ochronnych**: granice zależności, zgodność walidacji 116 kopii, kontroler domku i wzrost biblioteki. Sprawdzono też lokalne odnośniki dokumentacji oraz wykaz Playwright: 88 przypadków w 26 plikach. Nie uruchamiano ponownie całego zestawu aplikacji ani przeglądarki w zadaniu dokumentacyjnym. Ostatni pełny przebieg etapu 4 wyniósł 173/173 testy Node oraz 88/88 Playwright — to wynik wcześniejszego wdrożenia.

## Zalecana dalsza praca

Można wrócić do rozwoju materiałów. Przed pierwszym produkcyjnym francuskim lub włoskim przygotować małą próbkę z podręcznika, ustalić konkretne kryteria odpowiedzi i sprawdzić etykiety oraz dobór formy pytania na tej próbce. Pozostałe drobne porządki wykonywać przy zmianie odpowiedniego obszaru. Synchronizacji, starego portfela i formatu postępów nie przebudowywać bez nowej potrzeby.


## Weryfikacja uzupełniających porządków — 11 listopada 2026

Po zamknięciu testów tekstu widoków i wspólnej obsługi potwierdzeń wykonano **192/192 testy Node** na zwykłej i wirtualnie rozbudowanej bibliotece oraz **90/90 Playwright** gotowej aplikacji w Chrome. Budowanie z walidacją materiałów, TypeScript i PWA przeszło; kontrola dokumentacji i różnic również. Szczegóły zastępstwa testów i zachowania postępów opisują [zasady testowania](07-testy.md) oraz [architektura](05-architektura.md). Wygląd, treści, format postępów i zasady nagród pozostają bez zmian. Próby nie dotyczyły fizycznego telefonu ani prawdziwego konta Hani.
