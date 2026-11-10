# Materiały do nauki — tutaj edytujesz treść

Ten folder jest oddzielony od kodu aplikacji. Wszystkie treści lekcji są zwykłymi plikami JSON. Można je zmieniać w edytorze tekstu, bez znajomości TypeScript i bez edytowania folderu `src`.

## Gdzie co jest?

```text
public/content/
  katalog.json                 lista dostępnych modułów
  02-food/
    modul.json                 nazwa, numer, tematy i opis źródła
    slownictwo.json            słówka, tłumaczenia, akceptowane odpowiedzi
    quiz.json                  pytania słownikowe: odwołania do słówek
    gramatyka.json             zasady i przykłady w rozwijanej ściądze
    cwiczenia.json             zadania, odpowiedzi i wyjaśnienia
    rozmowki.json              krótkie dialogi z jedną luką
    sciezka.json               siedem etapów Food i kolejność 41 lekcji
```

`src` zawiera wygląd i działanie strony. `tests` sprawdza poprawność. Zdjęcia źródłowe są w lokalnym, pomijanym przez Git folderze `.local-materials`; nie są publikowane na stronie.

## Kocia mapa Food

`sciezka.json` opisuje etapy i lekcje, niezależnie od kodu. Każda lekcja wskazuje `wordIds`, `exerciseIds` i `ruleIds` z pozostałych plików, więc zmiana słówka lub zadania jest widoczna także w lekcji. `title` i `intro` określają tytuł oraz wprowadzenie. Zachowaj identyfikatory lekcji przy poprawianiu tytułów: według nich przyznawane są jednorazowe nagrody. [Pełna instrukcja mapy i domku](../../docs/kocia-przygoda.md).

Kafelek **Powtórka** na końcu każdego etapu powstaje automatycznie z błędów użytkownika. Nie dopisuj go do tablicy zwykłych lekcji: nie blokuje kolejnego etapu. Zachowaj także identyfikatory etapów — są kluczem ich osobnych kolejek powtórek i nagród. Procent i pasek pokazują ukończenie lekcji. Zaległości podajemy osobno liczbą ćwiczeń, które nie osiągnęły 3/3 w ukończonych turach. W obecnym Food dodatkowe 3 ★ przysługują raz po ukończeniu wszystkich lekcji etapu i utrwaleniu całej kolejki.

### Kolejne mapy i treningi

Metadane modułu mogą wskazywać `journeyPaths`, uporządkowaną listę 1–3 plików, np. `["02-food/sciezka.json", "02-food/druga-mapa.json"]`. Lista zastępuje pojedyncze `journeyPath`. Nowa mapa ma własne `id`, np. `druga-mapa`, unikalne w module. **Nie dopisuj `id` do istniejącej mapy Food** — zmieniłoby to klucze jej ukończeń. Stare klucze pozostają `moduleId/lessonId`, a nowe `moduleId/mapId/lessonId`.

Zwykłe lekcje nowych nazwanych map mają 6–10 zadań. Istniejące krótsze lekcje Food są nadal obsługiwane. Trening na mapie to lekcja z `role: "training"`, pustymi `wordIds`, `exerciseIds`, `ruleIds` i opcjonalnym `targetCount` 6–10 (domyślnie 8). Dobiera poznany materiał wcześniejszych map tego samego kursu; nie wpisujemy pytań treningowych na stałe. Pierwszy trening umieszczamy po 2–3 lekcjach nowego materiału, kolejne co 2–3. Pierwsza mapa kursu nie ma materiału wcześniejszych map, więc nie dodajemy tam pustych treningów. Treningi są wymagane do ukończenia mapy i dają 3 ★ tylko za pierwsze ukończenie.

Osobnego przycisku **Dodatkowy trening** nie dodajemy do JSON mapy. Jest dobrowolny, korzysta z poznanego zakresu kursu, może być krótszy przy małej puli i daje 1 ★ za ukończoną sesję. Nie zwiększa liczby wymaganych lekcji. Nie ma jeszcze harmonogramu SM-2 ani FSRS.

Nowe podręczniki powinny deklarować osobny `courseId`; moduły różnych kursów muszą mieć różne `id`. Opcjonalny `languageCode` (np. `fr`, `it`) określa język treści i poleceń. To przygotowanie zakresów, nie kompletny model kursu ani jego ekran wyboru. Stare materiały bez `courseId` korzystają z tymczasowego zakresu według języka; nie należy używać go do łączenia nowych podręczników.

## Dwa zestawy fiszek

„Fiszki podstawa” obejmują 38 haseł z ramek Vocabulary: Food and drink (1), Food and drink (2) i Containers (podręcznik s. 25, 27 i 29). Tłumaczenia pochodzą z Wordlist. „Fiszki” obejmują wszystkie 97 dotychczasowych haseł.

Lista identyfikatorów podstawowych znajduje się w polu `basicFlashcardIds` w `02-food/modul.json`. Aby zmienić zakres, edytuj tę listę, bez kopiowania słów i bez zmiany kodu. Tłumaczenie nadal poprawia się raz w `slownictwo.json`. Postępy tego samego słowa są wspólne dla obu zestawów. Quizy i gramatyka zachowują pełny materiał modułu.

## Poprawienie słówka lub tłumaczenia

Otwórz `02-food/slownictwo.json` i znajdź słowo. Przykład:

```json
{
  "id": "apple",
  "front": "jabłko",
  "back": "apple",
  "answers": ["apple", "an apple"],
  "group": "Lekcja 2.1",
  "source": "Podręcznik, Wordlist, s. 33"
}
```

Wariant `an apple` pozwala uznać odpowiedź z poprawnym rodzajnikiem. Oba wpisy w `answers` są akceptowane przy wpisywaniu odpowiedzi.

- `front` — polskie hasło na fiszce i w pytaniu.
- `back` — angielska odpowiedź wyświetlana na fiszce.
- `answers` — dozwolone odpowiedzi wpisywane w quizie. Musi zawierać także `back`.
- `group` — lekcja ze słowniczka.
- `source` — źródło, które pozwala sprawdzić materiał.

Quiz wskazuje `wordId`, zamiast kopiować tłumaczenie i odpowiedź. Poprawka w `slownictwo.json` aktualizuje więc jednocześnie fiszkę, pytanie słownikowe i warianty odpowiedzi korzystające z tego słowa.

## Poprawienie pytania słownikowego

W `quiz.json` każdy wpis wskazuje słowo oraz identyfikatory błędnych odpowiedzi:

```json
{
  "id": "v-apple",
  "wordId": "apple",
  "distractorIds": ["biscuit", "bread"]
}
```

Pozycja poprawnej odpowiedzi jest tasowana dla każdej sesji i pytania. Po wznowieniu tej samej sesji układ pozostaje taki sam. Możesz opcjonalnie dodać `prompt` (własne pytanie po polsku) i `explanation` (własne wyjaśnienie). Bez nich aplikacja składa pytanie i objaśnienie z hasła słownikowego. Dodatkowe synonimy z `answers` nie mogą występować wśród błędnych wariantów.

## Poprawienie gramatyki i zadań

- `gramatyka.json`: `title`, `explanation`, `examples` i `source` określają zawartość ściągi.
- `cwiczenia.json`: `prompt` to polecenie; `answers` to dozwolone odpowiedzi; `options` to przyciski w trybie wyboru; `explanation` to objaśnienie po odpowiedzi; `ruleId` wskazuje zasadę ze ściągi; `requires` wskazuje moduły potrzebne do rozwiązania.
- `rozmowki.json`: osobny kafelek „Rozmówki”. Zadanie ma `kind: "dialogue"` i tablicę `dialogue`, np. `[{"speaker":"Kelner","text":"What would you like?"},{"speaker":"Gość","text":"I'd ___ a lemonade, please."}]`. W całym dialogu musi być dokładnie jedna luka `___`. `answers`, `options`, `ruleId` i `explanation` działają jak w gramatyce. Nowe dialogi są adaptacjami w zakresie modułu, nie cytatami. Plik włącza pole `dialoguesFile: "rozmowki.json"` w `modul.json`; w module bez tego pola rozmówki są opcjonalne.
- `illustration.src` wskazuje lokalny rysunek SVG w `public/illustrations`. `scene: true` oznacza szerszą scenkę sytuacyjną, np. zamawianie napoju albo pustą lodówkę; `caption` opisuje ją po odpowiedzi. Obrazek jest widoczny od początku, bez podpisu podpowiadającego tłumaczenie. Nie zamieniaj scenki „nie ma mleka” na ilustrację pełnej szklanki mleka. Styl i źródła rysunków opisuje `public/illustrations/README.md`.
- `caseSensitive` określa, czy wielkość liter ma znaczenie. Zbędne spacje, prosty i typograficzny apostrof oraz kropki, przecinki, wykrzykniki, pytajniki i wielokropki nie wpływają na ocenę. Nie wpisuj wariantów różniących się tylko takimi znakami do `answers` — wystarczy jeden.
- Gdy w zadaniu nie potrzeba rodzajnika, dozwolone odpowiedzi obejmują `brak` oraz znaki `—`, `–` i `-`.
- Poprawienie treści ściągi nie zmienia automatycznie wyjaśnień zadań. Jeśli zmieniasz regułę, sprawdź także zadania wskazujące jej `ruleId`.

Nie zmieniaj identyfikatorów przy zwykłej korekcie literówki. Gdy zmieniasz sens konkretnego słówka lub zadania, dodaj mu `rev: 2` (lub zwiększ dotychczasowe `rev`). Brak pola oznacza rewizję 1. Słówko przekazuje rewizję także swojemu pytaniu w quizie, chyba że wpis w `quiz.json` ma własne `rev`. Historia starego elementu pozostaje archiwalna, a inne elementy zachowują statusy. Pole `version` w `modul.json` opisuje wydanie całego zestawu i samo nie zmienia kluczy postępu. Dawne kopie formatu 1 z kluczami `@1` działają bez migracji.

## Sprawdzenie i odświeżenie

### Obrazki po odpowiedzi i zadania zamknięte

Słówko w `slownictwo.json` oraz zadanie w `cwiczenia.json` mogą mieć pole `illustration`. Obrazek jest widoczny od początku pytania i podczas poprawy. Podpis `caption` jest wyświetlany dopiero po sprawdzeniu odpowiedzi, także błędnej. Quiz automatycznie korzysta z ilustracji wskazanego słówka.

```json
"illustration": {
  "symbol": "🍎",
  "caption": "apple — jabłko"
}
```

Zamiast `symbol` można podać `src`, np. `"src": "illustrations/sugar.svg"`. Plik umieść w `public/illustrations/`. Wspierane są lokalne pliki SVG o nazwach z małych liter, cyfr i myślników. Podaj jeden z tych dwóch wariantów i zawsze dodaj podpis `caption`. Obrazki w gramatyce mogą przedstawiać konkretny wyraz ze zdania; nie muszą ilustrować samej reguły. To dodatkowe pomoce wizualne, a nie reprodukcje podręcznika.

Pole `"responseType": "choice"` w zadaniu wymusza przyciski z `options`, również gdy Hania wybierze wpisywanie. Polecenia z wariantami rozdzielonymi ukośnikiem w nawiasach, np. `(so / because)` lub `[some / any]`, także automatycznie korzystają z przycisków. Dotyczy to nowych i wcześniej zapisanych sesji. Samo dodanie ilustracji lub zmiana sposobu odpowiedzi nie wymaga zmiany identyfikatorów ani `rev`.

Po zapisaniu plików uruchom z głównego folderu:

```powershell
npm.cmd run check:content
```

Sprawdzanie wykrywa m.in. brakujące pola, powtórzone identyfikatory, nieistniejące słówka i pytania z niejednoznacznym kluczem wyboru. Nie zastępuje oceny językowej przez człowieka.

Podczas lokalnej pracy wystarczy zapisać pliki i odświeżyć stronę. Materiały są pobierane z `content/`, a nie zaszyte w kodzie strony. Dla publikacji na GitHub Pages wyślij zmiany na gałąź `main` — publikacja uruchomi się automatycznie po przejściu testów. Przebudowa skopiuje aktualne pliki `public/content` do `dist/content`; nie trzeba zmieniać kodu aplikacji. Zainstalowana PWA pobiera spójne wydanie materiałów w tle; użytkownik wczytuje je przyciskiem „Wczytaj nową wersję”.

## Kolejny moduł

1. Utwórz nowy folder obok `02-food` z tymi samymi pięcioma plikami JSON.
2. Nadaj mu własne `id`, numer `order` i wersję.
3. Dopisz nazwę folderu do tablicy `modules` w `katalog.json`.
4. W każdym zadaniu ustaw `requires` na jego moduł i ewentualnie wcześniejsze moduły.
5. Uruchom sprawdzenie treści. Pusty `quiz.json` jest dozwolony, jeżeli `cwiczenia.json` zawiera zadania; materiały muszą mieć przynajmniej jedno słówko i jedno zadanie.

Wszystkie pliki tego folderu będą dostępne dla odwiedzających opublikowaną stronę. Nie umieszczaj tutaj zdjęć podręcznika, kopii postępów ani prywatnych danych.
