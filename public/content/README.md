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
```

`src` zawiera wygląd i działanie strony. `tests` sprawdza poprawność. Zdjęcia źródłowe są w lokalnym, pomijanym przez Git folderze `.local-materials`; nie są publikowane na stronie.

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
  "distractorIds": ["biscuit", "bread"],
  "correctPosition": 0
}
```

`correctPosition` liczymy od zera: 0 oznacza pierwszy przycisk. Możesz opcjonalnie dodać `prompt` (własne pytanie po polsku) i `explanation` (własne wyjaśnienie). Bez nich aplikacja składa pytanie i objaśnienie z hasła słownikowego. Dodatkowe synonimy z `answers` nie mogą występować wśród błędnych wariantów.

## Poprawienie gramatyki i zadań

- `gramatyka.json`: `title`, `explanation`, `examples` i `source` określają zawartość ściągi.
- `cwiczenia.json`: `prompt` to polecenie; `answers` to dozwolone odpowiedzi; `options` to przyciski w trybie wyboru; `explanation` to objaśnienie po odpowiedzi; `ruleId` wskazuje zasadę ze ściągi; `requires` wskazuje moduły potrzebne do rozwiązania.
- `caseSensitive` określa, czy wielkość liter ma znaczenie. Zbędne spacje oraz prosty i typograficzny apostrof są traktowane jednakowo.
- Gdy w zadaniu nie potrzeba rodzajnika, dozwolone odpowiedzi obejmują `brak` oraz znaki `—`, `–` i `-`.
- Poprawienie treści ściągi nie zmienia automatycznie wyjaśnień zadań. Jeśli zmieniasz regułę, sprawdź także zadania wskazujące jej `ruleId`.

Nie zmieniaj identyfikatorów przy zwykłej korekcie literówki. Gdy zmieniasz sens materiału lub prawidłową odpowiedź, zwiększ `version` w `modul.json`, aby dawne wyniki nie zostały przypisane do nowego zadania. Historia poprzedniej wersji pozostaje, ale jej sesja nie będzie wznawiana na zmienionym materiale.

## Sprawdzenie i odświeżenie

Po zapisaniu plików uruchom z głównego folderu:

```powershell
npm.cmd run check:content
```

Sprawdzanie wykrywa m.in. brakujące pola, powtórzone identyfikatory, nieistniejące słówka i pytania z niejednoznacznym kluczem wyboru. Nie zastępuje oceny językowej przez człowieka.

Podczas lokalnej pracy wystarczy zapisać pliki i odświeżyć stronę. Materiały są pobierane z `content/`, a nie zaszyte w kodzie strony. Dla publikacji na GitHub Pages zapisz zmiany w repozytorium i ponownie uruchom workflow publikacji. Przebudowa skopiuje aktualne pliki `public/content` do `dist/content`; nie trzeba zmieniać kodu aplikacji.

## Kolejny moduł

1. Utwórz nowy folder obok `02-food` z tymi samymi pięcioma plikami JSON.
2. Nadaj mu własne `id`, numer `order` i wersję.
3. Dopisz nazwę folderu do tablicy `modules` w `katalog.json`.
4. W każdym zadaniu ustaw `requires` na jego moduł i ewentualnie wcześniejsze moduły.
5. Uruchom sprawdzenie treści. Pusty `quiz.json` jest dozwolony, jeżeli `cwiczenia.json` zawiera zadania; materiały muszą mieć przynajmniej jedno słówko i jedno zadanie.

Wszystkie pliki tego folderu będą dostępne dla odwiedzających opublikowaną stronę. Nie umieszczaj tutaj zdjęć podręcznika, kopii postępów ani prywatnych danych.
