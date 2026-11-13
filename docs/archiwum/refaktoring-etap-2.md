# Refaktoring — etap 2: testy a rozwój biblioteki

Data: 11 listopada 2026. Zmieniono testy i dokumentację. Kod aplikacji, produkcyjne materiały, wygląd, format postępów, workflow i reguły Firebase pozostają bez zmian.

## Co zostało rozdzielone

- Wspólne testy sesji, aktywnych fiszek, historii, synchronizacji, zachowania ostatniej odpowiedzi i doboru kotków korzystają z małego [modułu syntetycznego](../../tests/fixtures/engine.ts), niezależnego od podręcznika. Dane są sprawdzane istniejącym walidatorem, bez kopiowania całego Food.
- Regresje słownictwa, map, gramatyki i nagród Food wybierają właściwy moduł i kurs [po stałym identyfikatorze](../../tests/fixtures/select.ts). Wspólne odczytanie jest w [materials.ts](../../tests/materials.ts). Lokalny scenariusz Food może mieć jeden moduł, ale pełna biblioteka nie ma już takiego ograniczenia.
- Usunięto oczekiwanie, że produkcyjny katalog zawiera dokładnie jeden kurs/moduł. Regresja kursu angielskiego sprawdza obecność Food w jego modułach, a nie zakazuje dodawania innych działów. Liczby właściwe materiałom Food pozostają sprawdzane.
- Nowe testy kontrolują [całą bibliotekę i jej wzrost](../../tests/library-growth.test.ts): dodatkowy moduł w angielskim, dwa kolejne kursy, kolejność z Food poza pierwszą pozycją, zgodność aktywnej sesji i kopii oraz osobny poznany zakres kursów.
- Scenariusze przeglądarkowe Food mają jawną [fixture katalogu](../../tests/browser/fixtures.ts), również dla dodatkowych kontekstów urządzeń/kont. Oddzielne [testy pełnego katalogu](../../tests/browser/library-growth.spec.ts) korzystają bezpośrednio z Playwright i sprawdzają rzeczywistą listę kursów/modułów oraz wybór EN/FR/IT w rozbudowanym przykładzie.

## Dlaczego nie zastępujemy wszystkiego sztucznymi danymi

Mechanika ma działać niezależnie od liczby i kolejności materiałów. Nadal jednak musimy wykrywać brakujące hasło, źródło, lekcję czy nagrodę Food. Dlatego zachowano regresje jego treści oraz kontrolę wszystkich produkcyjnych modułów. Jawny scenariusz Food nie jest testem kompletności katalogu — ten ma osobne kontrole.

Instrukcja wyboru danych i polecenie pełnej próby Node z dodatkowymi modułami są w [tests/README.md](../../tests/README.md). Dane rozszerzenia powstają w pamięci przez [growing-library.ts](../../tests/fixtures/growing-library.ts); nie są dodawane do produkcyjnego `public/`.

## Granice etapu

Nie przebudowano kontrolera nauki ani walidatora kopii. Nie zmieniano wymagań dotyczących liczby pytań, kryteriów odpowiedzi, nagród i postępów. Historyczne nazwy części testów i asercje kodu źródłowego pozostają osobnym zakresem. Syntetyczne przykłady EN/FR/IT nie są gotowymi materiałami podręcznikowymi do publikacji.

## Sprawdzenie rozbudowy

Cały zestaw Node przeszedł zarówno z rzeczywistą biblioteką, jak i z wirtualnym dodatkowym modułem EN oraz kursami FR/IT: **166/166 w obu wariantach**. Wirtualny katalog ustawia nowe kursy i moduły przed Food; jego wybór po ID, stara kopia i aktywna sesja pozostają poprawne.

Przeglądarkę sprawdzono także na testowej kopii wydania z tak rozszerzonym katalogiem. Pierwsza próba wykazała trzy założenia o globalnej bibliotece w kontekstach drugiego urządzenia/konta. Wspólna fixture obejmuje teraz również konteksty utworzone przez `browser.newContext`; oczekiwania dotyczące historii, portfela i powtórek zachowano. Pełny przebieg po tej poprawce: **88/88 testów Playwright**. Kontrole obejmowały pełny katalog, Food, konta, kopie, drugie urządzenie i offline Food. Nie potwierdza to nauki offline nowych FR/IT — dane testowe nie są wydaniem tych podręczników.

Testowe rozszerzenie zapisano wyłącznie w ignorowanym `dist/`, a po próbie odtworzono standardowe wydanie przez `npm run build`. Kod `src/`, treści `public/`, reguły i konfiguracja publikacji nie zostały zmienione. Budowanie przeszło i odtworzyło tę samą wersję PWA `dbed598c0ac23895`, z 206 zasobami offline. Nie wykonywano prób na fizycznym telefonie ani prawdziwych kontach Hani.

Końcowy pełny przebieg na odtworzonym standardowym wydaniu: **88/88 testów Playwright w Chrome**. Kontrola odnośników dokumentacji oraz `git diff --check` przeszły. Testowe ścieżki i identyfikatory rozszerzenia mają prefiks `test-growth-`, aby nie kolidować z nazwami przyszłych materiałów.
