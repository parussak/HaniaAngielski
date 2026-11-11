# Jak dobierać dane do testów

## Mechanika bez zależności od podręcznika

Sesje, ocenianie, historia i trwałość zapisu korzystają z `fixtures/engine.ts`: 12 sztucznych słówek, quiz i gramatyka, bez treści Food. `engineModule()` pozwala określić identyfikator, kurs i kolejność. `fixtures/course-materials.ts` służy do przykładów EN/FR/IT i kontroli znaków językowych. Nie publikujemy tych danych w aplikacji.

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
