# Jak dobierać dane do testów

## Mechanika bez zależności od podręcznika

Sesje, ocenianie, historia i trwałość zapisu korzystają z `fixtures/engine.ts`: 12 sztucznych słówek, quiz i gramatyka, bez treści Food. `engineModule()` pozwala określić identyfikator, kurs i kolejność. `fixtures/course-materials.ts` służy do przykładów EN/FR/IT i kontroli znaków językowych. Nie publikujemy tych danych w aplikacji.

`house-controller.test.ts` sprawdza interakcje domku ze stanem i transakcyjnym portem zapisu na danych syntetycznych. Mechanizm kupowania i odblokowań ma osobne testy `house.test.ts`, a rzeczywiste przyciski oraz połączenie kontrolerów — `browser/house.spec.ts`. Nie trzeba kopiować pełnych materiałów Food do testów kontrolera.

`learning-controller.test.ts` sprawdza pięć wejść do nowej sesji: wybór trybu modułu i kursu, lekcję, dodatkowy trening oraz powtórkę etapu. Kontroluje zgodę, odmowę, brak aktywnej sesji i błąd zapisu, w tym zachowanie historii, błędów, poznanego materiału oraz portfela. Test nie czyta implementacji kontrolera.

Napisy i atrybuty interfejsu sprawdzaj na wyrenderowanej stronie, nie przez wyszukiwanie ciągów w plikach TypeScript. `browser/home.spec.ts` chroni m.in. spację w haśle; `browser/ui-contracts.spec.ts` sprawdza pole odpowiedzi, etykiety, źródło, podsumowanie poprawki i lokalne zasoby. `runner-config.test.ts` importuje konfigurację Playwright i sprawdza jej wynik dla różnych ustawień. Kontrola zależności w `refactor-boundaries.test.ts` oraz tekstu workflow CI pozostaje celowo statyczna: ich przedmiotem jest struktura importów i plik konfiguracyjny, a nie zachowanie widoku.

`backup-validation.test.ts` korzysta z `fixtures/backup-validation-cases.ts` i wyników starego walidatora w `fixtures/backup-validation-results.json`. Zestaw chroni odczyt i odrzucenia 116 wariantów oraz dokładną zawartość kopii. Nie regeneruj wyników odniesienia tylko po to, żeby nowa implementacja przeszła test. Świadoma zmiana kryteriów wymaga osobnej decyzji i przeglądu zgodności; pełne archiwum nadal ma dodatkowe testy integralności historii.

## Regresje Food

Importuj `food`, `foodCourse` albo `foodModules` z `materials.ts`. Food jest wybierany po `unit-2-food`, a jego kurs po `angielski-hani`; nie po pozycji w katalogu. `foodModules` celowo zawiera tylko ten moduł. Indeksowanie tego lokalnego scenariusza lub małej, jawnie zbudowanej fixture jest dozwolone. Nie zakładaj, że pełny katalog ma jeden moduł/kurs ani że Food jest pierwszy.

Liczby 97 słówek, dwie mapy czy wymagany zakres Food pozostają wartościowymi regresjami jego materiałów. Nie zmieniaj tych oczekiwań tylko dlatego, że dodano inny moduł.

## Pełny katalog i jego rozbudowa

`library`, `modules` i `courses` z `materials.ts` oznaczają cały katalog. Wybieraj elementy przez `fixtures/select.ts`. Test pełnej biblioteki w `content.test.ts` sprawdza każdy moduł i jego przypisanie do kursu. `library-growth.test.ts` sprawdza dodatkowy moduł angielskiego, kursy francuskiego i włoskiego, inną kolejność i zgodność dawnego zapisu.

Poza zwykłym `npm test` można powtórzyć cały zestaw Node na wirtualnie rozbudowanym katalogu, bez edycji `public/`:

```powershell
$env:HANIA_TEST_GROWTH='1'
npm test
Remove-Item Env:HANIA_TEST_GROWTH
```

## Przeglądarka

Testy regresji interfejsu Food importują `test` i `expect` z `browser/fixtures.ts`. Ta fixture ogranicza odpowiedzi katalogu do Food, ale korzysta z prawdziwych plików jego treści. Obejmuje także konteksty tworzone przez testy drugiego urządzenia i kont; własne trasy materiałów ustawione w teście mają pierwszeństwo. Nie zastępuje silnika, interfejsu ani zapisu.

Testy pełnego katalogu importują Playwright bezpośrednio z `@playwright/test`. `browser/library-growth.spec.ts` ma dwa scenariusze: każdy rzeczywisty kurs pokazuje właściwą liczbę modułów wynikającą z katalogu; wirtualnie rozbudowana biblioteka pozwala wybrać Food, francuski i włoski. Nie wyłączaj tych kontroli na rzecz izolowanego Food.

Standardowe budowanie i polecenia Playwright pozostają opisane w [zasadach testów](../docs/07-testy.md). Po zmianie testowych danych uruchamiaj również właściwe scenariusze przeglądarkowe, szczególnie import kopii, drugie urządzenie i PWA.


## Miejsca domku i zgodność starego wystroju

`house-layers.test.ts` chroni dodatkowe miejsca i warstwy na rzeczywistym katalogu wyposażenia Food, bez obejmowania nagród przyszłych modułów. `house-controller.test.ts` sprawdza zakładki i nieudane ustawienie na danych syntetycznych. Przy rozbudowie katalogu zachowuj sześć dawnych identyfikatorów miejsc i nie normalizuj zapisanych zakupów. Nowe miejsca muszą przechodzić przez wspólny katalog walidatora, a zmiany podpór wymagają testu schowania drobiazgów. Nie aktualizuj złotego zestawu walidacji tylko po to, aby usunąć błąd — stare pliki mają zachować wynik; nowe miejsca mają osobne przypadki.


## Siatka domku

`house-grid.test.ts` używa małych zakupów i syntetycznej aktywnej lekcji. Nie wiążemy rozmiaru dekoracji z miejscem w CSS. Dane rozmiarów i obszarów są w `house/layout.ts`; kolejne dekoracje powinny mieć własny zdefiniowany rozmiar i test granic. Stare miejsca pozostają kontrolą odczytu, nie wymogiem przenoszenia zakupów między pokojami. `browser/house-grid.spec.ts` sprawdza ruchy myszy i dotyku, strzałki, odtworzenie i offline. Przy pomiarach po błędnym upuszczeniu poczekaj na obsłużenie odmowy i wyczyszczenie podglądu gestu, a nie tylko na niezmienioną wartość współrzędnej.
