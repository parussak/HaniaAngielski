# Kursy i materiały — format plików

Status: **wdrożony format etapu 2**. To instrukcja edycji dla człowieka. Typy i kontrole są w `src/materials/`; zasady językowe i odpowiedzi nadal pochodzą z podręcznika, nie z walidatora.

## Co gdzie zapisujemy

| Plik | Zawartość |
| --- | --- |
| `public/content/katalog.json` | Foldery modułów do pobrania i nazwa rejestru kursów w `coursesFile` |
| `public/content/kursy.json` | Kursy/podręczniki: języki, opis książki, uporządkowane identyfikatory modułów i polecenia |
| `<folder>/modul.json` | Nazwa i numer działu, opis źródła, poziom działu, tematy, mapy |
| `<folder>/slownictwo.json` | Znaczenia, ilustracje, formy językowe i domyślne akceptowane odpowiedzi |
| `<folder>/quiz.json` | Odwołania pytań słownikowych do znaczeń i dystraktorów |
| `<folder>/gramatyka.json` | Reguły, objaśnienia, przykłady, źródła |
| `<folder>/cwiczenia.json` | Konkretne zadania i ich własne odpowiedzi oraz wyjaśnienia |
| `<folder>/rozmowki.json` | Opcjonalne dialogi z jedną luką |

Folder modułu, np. `02-food`, jest adresem plików. `unit-2-food` to identyfikator materiału i zapisu postępów. **To dwie różne rzeczy.** W `katalog.modules` wpisujemy foldery, a w `course.moduleIds` identyfikatory z `modul.json`.

## Kurs to jeden podręcznik

`katalog.json` wskazuje `"coursesFile": "kursy.json"`. Wskazany plik ma `version: 1` i tablicę `courses`.

Przykładowy wpis kursu do tej tablicy, bez potwierdzonych jeszcze danych książki:

```json
{
  "id": "francuski-hani",
  "name": "Francuski — podręcznik Hani",
  "targetLanguage": "fr",
  "explanationLanguage": "pl",
  "textbook": { "title": null, "authors": null, "edition": null },
  "levels": null,
  "moduleIds": ["francuski-modul-1"],
  "instructions": {
    "translationPrompt": "Podaj po francusku",
    "wordExplanationTemplate": "„{answer}” oznacza „{cue}”."
  }
}
```

Nie dodano tego przykładowego kursu do aplikacji. Produkcyjny rejestr zawiera wyłącznie `angielski-hani` i istniejący Food. Tytułu, autorów, wydania i poziomu całego podręcznika nie ustalono, dlatego mają jawne `null`. Po potwierdzeniu autorów zapisujemy jako tablicę nazwisk, a poziomy np. jako `["A1", "A2"]`. Poziom A2 w metadanych Food nie jest automatycznie poziomem całej książki.

Kody języków są niezależne od polskiego napisu wyświetlanego na kafelku: `en`, `fr`, `it`, `pl`, również poprawne kody regionalne, np. `fr-CA`. Polecenie i wzór objaśnienia są danymi kursu; nowy język nie wymaga dopisywania rozgałęzienia w silniku sesji. Wzór objaśnienia zawiera `{answer}` i `{cue}`. Nie wykonuje kodu ani HTML. Własne wyjaśnienie konkretnego pytania ma pierwszeństwo.

Każdy moduł należy dokładnie do jednego kursu, a wszystkie wpisy rejestru muszą odpowiadać modułom katalogu. Kolejność `moduleIds` wyznacza kolejność nauki. Numer `order` w `modul.json` nadal oznacza numer działu widoczny w aplikacji — Food pozostaje modułem 2, choć jest pierwszym dostępnym modułem kursu.

Języki i polecenia nie muszą być powtarzane w `modul.json`; są przypisywane przy wczytywaniu. Jeżeli wpisano też `courseId` lub `languageCode`, muszą zgadzać się z rejestrem. Sprzeczność jest błędem, nie powodem automatycznego przepinania wyników.

## Hasło opisuje jedno znaczenie

Nowy format `slownictwo.json` ma `version: 2` i tablicę `entries`. Przykład techniczny, **nie zatwierdzony materiał z podręcznika**:

```json
{
  "version": 2,
  "entries": [
    {
      "id": "coffee-drink",
      "source": "Przykład techniczny — wymaga zastąpienia źródłem podręcznikowym",
      "illustration": { "symbol": "☕", "caption": "Napój kawowy" },
      "variants": {
        "pl": { "text": "kawa" },
        "en": { "text": "coffee" },
        "fr": { "text": "café", "forms": ["un café"] },
        "it": { "text": "caffè" }
      },
      "answers": { "fr": ["café", "un café"] }
    }
  ]
}
```

Każdy wpis ma własne `id`, źródło, ilustrację i warianty językowe. Wariant zawiera `text` oraz opcjonalne `forms` i `examples`, obie jako tablice tekstów. Potrzebne są warianty języka nauki i języka objaśnień kursu. Ilustracja może mieć istniejące `src` SVG zamiast `symbol`; jej zgodność ze znaczeniem oceniamy merytorycznie.

`forms` opisują realizacje językowe, **nie rozszerzają automatycznie listy poprawnych odpowiedzi**. `answers` wskazuje jawnie akceptowane odpowiedzi w danym języku. Bez takiej listy domyślną odpowiedzią jest `variants[język nauki].text`. Jeśli lista istnieje, musi obejmować tę podstawową formę. Odpowiedzi konkretnego zadania mogą być węższe — zapisujemy je w definicji tego zadania.

Nie łączymy znaczeń według samej pisowni. To samo słowo oznaczające napój i kolor potrzebuje dwóch identyfikatorów, z osobnymi ilustracjami. Z kolei jedno znaczenie występujące w kilku językach może współdzielić ilustrację, ale jego wykonania w różnych kursach nadal mają osobne wyniki.

## Zgodność ze starym Food

Dotychczasowa tablica słów `front` / `back` / `answers` nadal działa. Food pozostaje w tym formacie i nie został przepisany. Podczas wczytywania otrzymuje model znaczeń na podstawie języków kursu, a silnik nadal dostaje zgodną projekcję `Word` i `Exercise`. Nowe znaczenia również są projektowane do tych samych typów ćwiczeń.

To jednorazowy kierunek odczytu, nie dwa miejsca do ręcznej edycji. Edytujemy `slownictwo.json`, nie wygenerowane obiekty w pamięci. Zmiana tekstu w pliku aktualizuje fiszkę i quiz przez wspólne odwołanie `wordId`. Źródła i rewizje zachowują dotychczasowe znaczenie.

Stary katalog bez `coursesFile` jest nadal obsługiwany przez adapter zgodności. Moduły można połączyć jawnym `courseId`; sam jednakowy język nie dowodzi, że pochodzą z jednej książki. Nowe podręczniki dodajemy przez jawny rejestr kursów.

## Identyfikatory i postępy

- `course.id` jest stały; zmiana czytelnej nazwy nie tworzy nowego kursu.
- `module.id` musi być unikalny w całej bibliotece, również między kursami. Ten sam lokalny identyfikator hasła może wystąpić w kilku modułach.
- Postęp elementu nadal ma klucz `moduleId@rewizja:typ:id`. Kurs nie jest dopisywany do istniejących kluczy. Rozdzielenie wyników wynika z jednoznacznego przypisania globalnie unikalnych modułów do kursów.
- Nie przenosimy istniejącego identyfikatora modułu do innego podręcznika. Inny podręcznik lub istotnie zmienione wydanie dostaje nowe identyfikatory kursu i modułów.
- Nie zmieniamy `unit-2-food`, identyfikatorów jego haseł, pytań i lekcji. Nie dodajemy identyfikatora do starej mapy tylko dla porządku.
- Przypisanie Food do kursu nie zapisuje migracji, nie zmienia ocen i nie nalicza nowych gwiazdek.

## Sprawdzenie przed publikacją

Uruchamiamy `npm run check:content`, `npm test` i `npm run build`. Te kroki wykrywają problemy formatu, odwołań i zakresów; nie potwierdzają poprawności językowej. Materiał sprawdzamy też względem źródeł według [zasad merytoryki](04-merytoryka.md). Nowe zachowanie interfejsu sprawdzamy w testach przeglądarkowych według [zasad testowania](07-testy.md).

Wybór kursu i globalne fiszki/quiz/gramatyka są wdrożone w etapie 3 — [opis działania](wdrozenie-zakresow.md). Nowe podręcznikowe treści francuskie i włoskie nadal wymagają materiałów i recenzji. Dodanie treści przez ten format nie wymaga osobnego silnika oceniania dla języka.

## Aktualizacja wydanej lekcji

Oryginalna lekcja w `sciezka.json` pozostaje bez zmian. Opcjonalne `update` zawiera `edition: 2`, `title`, `intro`, `wordIds`, `exerciseIds` i `ruleIds`. Nie może zmieniać `id`, roli ani zawierać kolejnego `update`. Aktualizacja ma 6–10 zadań i musi wskazywać istniejące materiały. Domyślnie trafia do nieukończonej lekcji; stare ukończenia bez `edition` i stare aktywne sesje zachowują oryginał. Nowa sesja i jej ukończenie zapisują `edition: 2`.

To obecnie obsługa oryginału i jednego poprawionego wydania, nie nieograniczona lista rewizji. Wydania 2 nie wolno później nadpisywać istotną zmianą: trzeba rozbudować jawny rejestr wydań lub dodać nową lekcję, z testami zgodności. Nowe zadania dostają nowe identyfikatory; stare pozostają do wznowień i powtórek. Instrukcja nie zezwala na masową przebudowę ukończonych lekcji. [Przykład Food i ochrona danych](wdrozenie-food.md).
