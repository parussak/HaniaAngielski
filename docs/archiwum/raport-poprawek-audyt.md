# Raport poprawek „Małe kroki”

8 listopada 2026 r. Odniesienie: `7608639` i zastane lokalne zmiany testów publicznej strony. Nie zmieniano danych Hani. Nie wykonano commita, pushu ani publikacji.

## Status usterek

| Pozycja | Status | Rezultat |
| --- | --- | --- |
| K1 | zrobione | Poprawka w tej samej sesji nie usuwa trudności. Usuwa ją poprawna pierwsza próba w późniejszej sesji. Powtórka obejmuje fiszki review. |
| K2 | zrobione | Sześć opakowań ma polską podpowiedź i jeden prawidłowy wybór. |
| I1 | zrobione | Tasowanie opcji z ziarnem session.id:index, bez stałych pozycji w danych i instrukcji. Układ pozostaje po wznowieniu. |
| I2 | zrobione | Najpierw trudne, potem niewidziane, potem wcześniej ćwiczone; znane fiszki pomijane. |
| I3 | zrobione z odstępstwem | Wspólna normalizacja oceny i walidacji, 32 przypadki regresji; pan dopuszcza frying pan. Many: patrz odstępstwa. |
| I4 | nie dotyczy | Brak pozycji I4 w przekazanym prompcie. |
| I5 | zrobione | Kompaktowy ekran; pytanie, pierwsza opcja i Dalej dostępne nad menu na małych ekranach. |
| I6 | zrobione | Statystyki uwzględniają aktualne klucze i nie dublują trudnych fiszek. |
| I7 | zrobione | Opcjonalne rev elementu, domyślnie 1; dawne @1 i kopie formatu 1 bez migracji. Wersja całego modułu nie resetuje postępów. |
| D1 | zrobione | „Poprawione za drugim razem”. |
| D2 | zrobione | „Trochę wybieram, trochę wpisuję”. |
| D3 | zrobione | Nazwy zdjęć usunięte z widocznych źródeł; zachowane w dokumentacji. |
| D6 | zrobione | Ukryte litery opcji, nazwany postęp, fokus po ponownej próbie i wskazówki klawiatury. |
| D14 | zrobione | Dodana spacja przed br na ekranie startowym. |
| Czytelność | zrobione w sprawdzonym zakresie | Funkcjonalny tekst co najmniej 12 px; kontrast sprawdzonych tekstów co najmniej 4,5:1. Nie jest to pełny audyt WCAG. |
| Czcionki | zrobione | Systemowe, bez Google Fonts. Nie oznacza to pełnego działania offline. |
| Ikona | zrobione / manifest pominięty | Favicon SVG dodany; manifest wymaga próby danych na iOS. |
| Przenośne testy | konfiguracja gotowa | Chromium domyślnie, Edge przez zmienną; polecenie serwera zależy od systemu. Uruchamiano na Windows/Edge. |
| CI | konfiguracja gotowa | Osobny workflow sprawdza push i pull request bez publikacji. Nie uruchamiano go zdalnie. |
| Dodatkowe testy | zrobione | Powtórki, difficult, tryb mieszany, unikalność answers, priorytety i stara kopia. |
| D-treści | zrobione | Skrócone g-count-* i g-short-eggs, bez zmiany kluczy. |
| Język fiszki | zrobione | Pochodzi z modułu aktualnego elementu. |
| Dokumentacja | zrobione | Aktualny stan realizacji, instrukcje rewizji i testów, usunięty luźny nagłówek repozytorium z README. |

## Zmienione pliki

- `src/answers.ts`: wspólna normalizacja interpunkcji, apostrofów, spacji i NFC; zachowuje istotne znaki języka.
- `src/core.ts`: powtórki, dobór sesji, opcje, rewizje i statystyki; bez zmiany formatu kopii.
- `src/content-validation.ts`: wspólna ocena opcji, rewizje i unikalne answers.
- `src/main.ts`: etykiety, dostępność, fokus, język elementu i układ nauki.
- `src/style.css`, `src/theme.css`: czytelność, kontrast, małe ekrany i systemowe czcionki.
- `public/content/02-food/*.json`: podpowiedzi opakowań, lunch/dinner, pan, krótkie objaśnienia i źródła. Porównano z HEAD: zachowano 97 id słów, 97 id quizów, 59 id zadań i 9 id zasad.
- `index.html`, `public/cat.svg`: favicon.
- `playwright.config.ts`, `scripts/serve-built.mjs`: przenośne testy i podgląd plików dist w podkatalogu.
- `.github/workflows/checks.yml`: testy przy pushu. Istniejącego wdrożenia Pages nie zmieniono.
- `tests/stage1.test.ts`, `stage2.test.ts`, `stage3.test.ts`, `tests/fixtures/backup-v1.json`, `tests/browser/audit.spec.ts`: regresje i stara kopia. Pozostałe testy dostosowano do etykiet, tasowania i powtórek.
- README i dokumenty w `docs`: instrukcje, raport oraz źródła.

## Wyniki testów

Najpierw dodano regresje: przed poprawkami nie przechodziło 7 testów etapu 1, 5 etapu 2 i 3 etapu 3. Naprawiono je i po każdym etapie wykonano wymagane polecenia.

| Etap | npm test | check:content | build |
| --- | --- | --- | --- |
| 1 | 18/18, 0 błędów | poprawne | sukces |
| 2 | 23/23, 0 błędów | poprawne | sukces |
| 3 / końcowe | 27/27, 0 błędów | 97 fiszek, 156 zadań, 9 zasad; bez błędów | sukces |

Playwright: **16/16** na zbudowanej stronie lokalnie pod `/HaniaAngielski/`, w Edge. W tym 320×640, 360×740, szerokości 390 i 430 px oraz 844×390. Potwierdzono brak przewijania poziomego, widoczne pytanie i pierwszą opcję oraz przycisk Dalej nad menu. Zmierzono minimum 12 px i kontrast 4,5:1 sprawdzanych tekstów funkcjonalnych.

Stara kopia formatu 1 została wczytana i wyeksportowana ponownie bez zmiany postępów, także po podniesieniu wersji modułu. Sprawdzono też błąd zapisu, drugi kontekst przeglądarki, wznowienie, fiszki, quiz mieszany, gramatykę i powtórki. Przy długim wyjaśnieniu przewija się jego treść wewnątrz karty; przyciski pozostają dostępne.

## Odstępstwa i decyzje rodzica

- **Many w g-lot-apples: niepotwierdzone w wskazanych źródłach.** S. 27 nie zawiera tej konstrukcji, s. 29 ćwiczy a lot of i how many. Nie rozszerzono klucza z domysłu o zakresie książki. Polecenie pyta teraz o trzywyrazowe wyrażenie. Many może być poprawne językowo w innym zadaniu, ale nie spełnia tego polecenia.
- Nie dodano cookie ani french fries. Rozszerzenie synonimów wymaga decyzji rodzica; zachowano wcześniej dostępne warianty.
- Manifest pominięto zgodnie z instrukcją. Nie potwierdzono przechowywania danych w trybie aplikacji na fizycznym iPhonie. Favicon nie zmienia bazy ani trybu uruchamiania.
- Audytowych `micro.mjs` i `layout.mjs` nie było w projekcie. Scenariusze odtworzono własnymi testami Playwright.
- I6 było częściowo naprawione w zastanym kodzie: znane fiszki już filtrowano. Dodano wspólny testowalny mechanizm, rewizje i filtrowanie listy powtórek.
- Usunięto warianty answers różniące się wyłącznie ignorowaną interpunkcją. Nie ogranicza to akceptowanych odpowiedzi.

## Zdjęcia i źródła

Otworzono i porównano podręcznik s. 24–35, zeszyt ćwiczeń s. 14–21 i dwie odręczne notatki o ilościach. Tytuł i wydanie książki nadal nie są potwierdzone. Nie zgadywano odpowiedzi zależnych od nagrań.

Główne zdjęcia: s. 27 — `PXL_20261108_164026261.jpg`; s. 29 — `PXL_20261108_164035303.jpg`; s. 30 — `PXL_20261108_164039992.TS-000.jpg`; s. 32 — `PXL_20261108_164047522.jpg`; s. 33 — `PXL_20261108_164053912.jpg`; notatki — `PXL_20261108_164127281.jpg` i `PXL_20261108_164122029.MP.jpg`.

93 hasła ze słowniczka i 4 dodatki z Word blog pozostają. Diary to dzienniczek, nie dairy. Zachowano wcześniejsze adaptacje: horrible → okropny, „mógłbym” → „mogę”, chicken jako mięso i quick → szybki. Pan dopuszcza frying pan na podstawie podpisu w zeszycie s. 21 — adaptacja do kontekstu patelni. Pytania v-* są adaptacjami haseł do quizu, a nie przepisanymi zadaniami.

Sześć zadań o opakowaniach to adaptacje ramki s. 29 z polskimi wskazówkami zamiast obrazków. Zmienione objaśnienia są adaptacjami po polsku. Poprawiono źródła zasad: ilości/opakowania są w zeszycie na s. 16, a zamawianie na s. 17; wcześniej odsyłano odpowiednio do s. 17 i 18.

W tabeli „wierny przepis” dotyczy angielskiego zdania zadania z pozostawioną luką; polecenie i wyjaśnienie są adaptowane.

| Id ćwiczenia | Strona / podstawa | Status |
| --- | --- | --- |
| g-count-egg | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-strawberry | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-apple | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-milk | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-sugar | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-flour | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-butter | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-count-water | Podręcznik 27, ramka; zeszyt 15 | adaptacja |
| g-article-egg | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-apple | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-sandwich | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-lemon | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-milk | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-butter | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-article-juice | Podręcznik 27, ćw. 8; zeszyt 15 i 20 | adaptacja |
| g-some-milk-positive | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-eggs-positive | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-milk-negative | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-eggs-negative | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-strawberries-question | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-flour-question | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-sugar-positive | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-butter-negative | Podręcznik 26–27, dialog i ramka | adaptacja |
| g-some-request | Podręcznik 30, dialog | adaptacja |
| g-there-milk | Podręcznik 27, ramka | adaptacja |
| g-there-water | Podręcznik 29, ramka; notatki | adaptacja |
| g-there-apples | Podręcznik 27, ramka | adaptacja |
| g-there-egg | Podręcznik 27, ramka | adaptacja |
| g-there-bottles | Podręcznik 29, ramka; notatki | adaptacja |
| g-short-milk | Podręcznik 27, ramka | adaptacja |
| g-short-eggs | Podręcznik 27, ramka | adaptacja |
| g-how-water | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-apples | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-milk | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-eggs | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-chocolate | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-biscuits | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-bottles | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-cartons | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-cheese | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-how-jam | Podręcznik 29, ramka / ćw. 3 i 7; zeszyt 16 i 20 | adaptacja |
| g-lot-water | Podręcznik 29, ramka; notatki | adaptacja |
| g-lot-apples | Podręcznik 29, ramka; notatki | adaptacja |
| g-container-water | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-chocolate | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-cola | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-juice | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-jam | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-biscuits | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-container-plural | Podręcznik 29, ramka; zeszyt 16 i 20; notatki | adaptacja |
| g-order-would | Podręcznik 30, ramka i dialog; zeszyt 17 | adaptacja |
| g-order-can | Podręcznik 30, ramka i dialog; zeszyt 17 | adaptacja |
| g-order-like | Podręcznik 30, ramka i dialog; zeszyt 17 | adaptacja |
| g-order-else | Podręcznik 30, ramka i dialog; zeszyt 17 | adaptacja |
| g-order-drink | Podręcznik 30, ramka i dialog; zeszyt 17 | adaptacja |
| g-so-sport | Podręcznik 32, ramka Writing | wierny przepis zdania z luką |
| g-because-sport | Podręcznik 32, ramka Writing | wierny przepis zdania z luką |
| g-because-eggs | Podręcznik 32, ćw. 5, zdania 4 i 5 | wierny przepis zdania z luką |
| g-so-pizza | Podręcznik 32, ćw. 5, zdania 4 i 5 | wierny przepis zdania z luką |

Niepotwierdzone pozostają wskazana alternatywa many i odpowiedzi wymagające nagrań. Nie zastąpiono ich zgadywaną treścią. Nie dodawano nowych trybów.

## Czego nie sprawdzono

Fizyczny telefon Hani, klawiatura Android/iOS, czytniki ekranu, uruchomienie na Linux/macOS i nowy workflow CI na GitHub. Nie testowano zmienionej wersji na publicznym GitHub Pages — nie została opublikowana. Dawny raport publicznej strony dotyczy wcześniejszej wersji.

## Stan repozytorium

Nowe pliki oznaczone `??` nie są uwzględnione w `git diff --stat`, dopóki nie zostaną dodane do indeksu. Nie dodawano ich ani nie commitowano. Poniżej zapisano końcowe wyniki poleceń.

### git status --short

~~~text
 M README.md
 M docs/podglad-aplikacji.png
 M docs/podglad-cwiczenia-telefon.png
 M docs/podglad-telefon.png
 M docs/stan-realizacji.md
 M index.html
 M playwright.config.ts
 M public/content/02-food/cwiczenia.json
 M public/content/02-food/gramatyka.json
 M public/content/02-food/quiz.json
 M public/content/02-food/slownictwo.json
 M public/content/README.md
 M src/content-validation.ts
 M src/core.ts
 M src/main.ts
 M src/style.css
 M src/theme.css
 M tests/browser/app.spec.ts
 M tests/browser/content.spec.ts
 M tests/browser/mobile.spec.ts
 M tests/content.test.ts
 M tests/core.test.ts
?? .github/workflows/checks.yml
?? docs/raport-poprawek-audyt.md
?? docs/sprawdzenie-github-pages.md
?? public/cat.svg
?? scripts/serve-built.mjs
?? src/answers.ts
?? tests/browser/audit.spec.ts
?? tests/browser/journey.spec.ts
?? tests/fixtures/
?? tests/stage1.test.ts
?? tests/stage2.test.ts
?? tests/stage3.test.ts
~~~

### git diff --stat

~~~text
 README.md                              |   22 +-
 docs/podglad-aplikacji.png             |  Bin 299621 -> 277228 bytes
 docs/podglad-cwiczenia-telefon.png     |  Bin 162681 -> 29903 bytes
 docs/podglad-telefon.png               |  Bin 536714 -> 502088 bytes
 docs/stan-realizacji.md                |   48 +-
 index.html                             |    1 +
 playwright.config.ts                   |    7 +-
 public/content/02-food/cwiczenia.json  | 2312 ++++++++++++++++----------------
 public/content/02-food/gramatyka.json  |  110 +-
 public/content/02-food/quiz.json       |  294 ++--
 public/content/02-food/slownictwo.json |   45 +-
 public/content/README.md               |    9 +-
 src/content-validation.ts              |   11 +-
 src/core.ts                            |   64 +-
 src/main.ts                            |   28 +-
 src/style.css                          |    3 +-
 src/theme.css                          |   49 +
 tests/browser/app.spec.ts              |   10 +-
 tests/browser/content.spec.ts          |    6 +-
 tests/browser/mobile.spec.ts           |    4 +-
 tests/content.test.ts                  |    6 +-
 tests/core.test.ts                     |    4 +-
 22 files changed, 1536 insertions(+), 1497 deletions(-)
~~~
