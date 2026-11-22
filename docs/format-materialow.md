# Kursy i materiały — format plików

## Sekcja 7 + 2 — opcjonalny plan

Sekcja mapy może mieć `adaptiveReviews: true`, jeżeli zawiera **dokładnie siedem bazowych lekcji**. Wtedy silnik dodaje dwa dynamiczne przystanki dla kont, które jeszcze nie rozpoczęły tej sekcji. Nie dopisuj ich ręcznie do JSON ani nie używaj w treści roli `recall`: jest generowana z zapisanego planu. Identyfikatory `${stage.id}-recall-1` i `${stage.id}-recall-2` są zarezerwowane. Istniejący trening z rolą `training`, jeżeli jest planowany w takiej sekcji, wchodzi do siedmiu bazowych; nie dodajemy dziesiątej lekcji.

W Food pole ma tylko „Ilości i opakowania”. Nie zmienia ono siedmiu istniejących lekcji ani wyników. Nie zmieniaj kolejności i identyfikatorów bazowych opublikowanego planu, aby zachować układ kont. Materialna zmiana wymaga osobnego wydania i oceny zgodności. [Warunki losowania, doboru i ochrona rozpoczętych sekcji](03-nauka.md).

Status: **wdrożony format etapu 2**. To instrukcja edycji dla człowieka. Typy i kontrole są w `src/materials/`; zasady językowe i odpowiedzi nadal pochodzą z podręcznika, nie z walidatora.

## Co gdzie zapisujemy

| Plik | Zawartość |
| --- | --- |
| `public/content/katalog.json` | Foldery modułów do pobrania i nazwa rejestru kursów w `coursesFile` |
| `public/content/kursy.json` | Kursy/podręczniki: języki, opis książki, uporządkowane identyfikatory modułów i polecenia |
| `<folder>/modul.json` | Nazwa i numer działu, opis źródła, poziom działu, tematy, mapy, [pokój za moduł](#nagrody-domku) |
| `<folder>/sciezka*.json` | Mapa: sekcje i lekcje, [nagrody domku za mapę](#nagrody-domku) |
| `<folder>/slownictwo.json` | Znaczenia, ilustracje, formy językowe i domyślne akceptowane odpowiedzi |
| `<folder>/quiz.json` | Odwołania pytań słownikowych do znaczeń i dystraktorów |
| `<folder>/gramatyka.json` | Reguły, objaśnienia, przykłady, źródła |
| `<folder>/cwiczenia.json` | Konkretne zadania i ich własne odpowiedzi oraz wyjaśnienia |
| `<folder>/rozmowki.json` | Opcjonalne dialogi z jedną luką i [sceny z kilkoma lukami](#scena-dialogowa-z-kilkoma-lukami) |
| `<folder>/czytanki.json` | Opcjonalne [czytanki](#czytanka) z pytaniami (D-68); włącza je `readingsFile: "czytanki.json"` w `modul.json` |

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

### Tematy gramatyki (D-74)

Kurs może wskazać plik tematów: `"grammarTopicsFile": "tematy-gramatyki/<id-kursu>.json"` w jego wpisie w `kursy.json`. Plik to tablica `{"id", "title", "summary"?}` (`id` małymi literami z myślnikami, `summary` opcjonalne). Reguła w `gramatyka.json` wskazuje temat polem `grammarTopicId`; reguły z różnych modułów kursu mogą dzielić temat, a kolejność wynika z kolejności `moduleIds`. Treść reguły zostaje tylko w `gramatyka.json`.

`check:content` i wczytanie biblioteki odrzucają: regułę bez zadania `kind: "grammar"` z jej `ruleId` (w każdym kursie), a w kursie z plikiem tematów także regułę bez tematu lub z nieznanym tematem i powtórzone `id` tematu. Temat bez reguł jest dozwolony (moduły kursu mogą być wczytane częściowo) i po prostu się nie pokazuje. Kurs bez pliku tematów nie może mieć reguł z `grammarTopicId`.

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

Każdy wpis ma własne `id`, źródło, ilustrację i warianty językowe. Wariant zawiera `text` oraz opcjonalne `forms` i `examples`, obie jako tablice tekstów. Potrzebne są warianty języka nauki i języka objaśnień kursu. Ilustracja może mieć istniejące `src` SVG lub PNG zamiast `symbol`; jej zgodność ze znaczeniem oceniamy merytorycznie.

`forms` opisują realizacje językowe, **nie rozszerzają automatycznie listy poprawnych odpowiedzi**. `answers` wskazuje jawnie akceptowane odpowiedzi w danym języku. Bez takiej listy domyślną odpowiedzią jest `variants[język nauki].text`. Jeśli lista istnieje, musi obejmować tę podstawową formę. Odpowiedzi konkretnego zadania mogą być węższe — zapisujemy je w definicji tego zadania.

Nie łączymy znaczeń według samej pisowni. To samo słowo oznaczające napój i kolor potrzebuje dwóch identyfikatorów, z osobnymi ilustracjami. Z kolei jedno znaczenie występujące w kilku językach może współdzielić ilustrację, ale jego wykonania w różnych kursach nadal mają osobne wyniki.

## Zgodność ze starym Food

Dotychczasowa tablica słów `front` / `back` / `answers` nadal działa. Food pozostaje w tym formacie i nie został przepisany. Podczas wczytywania otrzymuje model znaczeń na podstawie języków kursu, a silnik nadal dostaje zgodną projekcję `Word` i `Exercise`. Nowe znaczenia również są projektowane do tych samych typów ćwiczeń.

To jednorazowy kierunek odczytu, nie dwa miejsca do ręcznej edycji. Edytujemy `slownictwo.json`, nie wygenerowane obiekty w pamięci. Zmiana tekstu w pliku aktualizuje fiszkę i quiz przez wspólne odwołanie `wordId`. Źródła i rewizje zachowują dotychczasowe znaczenie.

Stary katalog bez `coursesFile` jest nadal obsługiwany przez adapter zgodności. Moduły można połączyć jawnym `courseId`; sam jednakowy język nie dowodzi, że pochodzą z jednej książki. Nowe podręczniki dodajemy przez jawny rejestr kursów.

## Nagrody domku

Nagrody przypisuje treść kursu (D-67). Kod zna tylko wspólny katalog przedmiotów i pokoi (`src/house/catalog.ts`): nazwy, ceny, grafiki, miejsca. Przedmiot oznaczony tam jako nagroda (`reward: true`) można kupić dopiero po mapie, która go wymienia.

Mapa (`sciezka*.json`) ma opcjonalne pola nagród:

```json
"rewards": {
  "room": "picnic",
  "decorations": ["bowls", "lemonade", "picnic-basket", "picnic-blanket"],
  "badge": "Odznaka kociego kucharza"
}
```

- `decorations` — identyfikatory przedmiotów-nagród z katalogu, bez powtórzeń. Odblokowują się do kupienia za gwiazdki po ukończeniu wszystkich lekcji mapy.
- `badge` — nazwa odznaki pokazywana na końcu mapy („Mapa ukończona! Zdobywasz: …”) i w domku.

- `room` — opcjonalny identyfikator wnętrza z katalogu domku, np. `rover-station`. Każda mapa bez tego pola ma własny pokój z nazwą mapy i domyślnym wystrojem. Identyfikator przypisanego pokoju pozostaje stały. Dawne pliki modułów mogą zawierać `houseRoom`.

W jednym kursie przedmiot może być nagrodą tylko jednej mapy, a pokój — tylko jednej mapy; `npm run check:content` to sprawdza. Zdobytych przedmiotów i pokoi nie odbieramy, gdy treść później zmieni przypisanie. Nowy pokój lub przedmiot (grafika, miejsca w pokoju) to zmiana mechaniki, nie treści.

## Identyfikatory i postępy

- `course.id` jest stały; zmiana czytelnej nazwy nie tworzy nowego kursu.
- `module.id` musi być unikalny w całej bibliotece, również między kursami. Ten sam lokalny identyfikator hasła może wystąpić w kilku modułach.
- Postęp elementu nadal ma klucz `moduleId@rewizja:typ:id`. Kurs nie jest dopisywany do istniejących kluczy. Rozdzielenie wyników wynika z jednoznacznego przypisania globalnie unikalnych modułów do kursów.
- Nie przenosimy istniejącego identyfikatora modułu do innego podręcznika. Inny podręcznik lub istotnie zmienione wydanie dostaje nowe identyfikatory kursu i modułów.
- Nie zmieniamy `unit-2-food`, identyfikatorów jego haseł, pytań i lekcji. Nie dodajemy identyfikatora do starej mapy tylko dla porządku.
- Przypisanie Food do kursu nie zapisuje migracji, nie zmienia ocen i nie nalicza nowych gwiazdek.

## Sprawdzenie przed publikacją

Uruchamiamy `npm run check:content`, `npm test` i `npm run build`. Te kroki wykrywają problemy formatu, odwołań i zakresów; nie potwierdzają poprawności językowej. Materiał sprawdzamy też względem źródeł według [zasad merytoryki](04-merytoryka.md). Nowe zachowanie interfejsu sprawdzamy w testach przeglądarkowych według [zasad testowania](07-testy.md).

Wybór kursu i globalne fiszki/quiz/gramatyka są wdrożone w etapie 3 — [opis działania](archiwum/wdrozenie-zakresow.md). Nowe podręcznikowe treści francuskie i włoskie nadal wymagają materiałów i recenzji. Dodanie treści przez ten format nie wymaga osobnego silnika oceniania dla języka.

## Aktualizacja wydanej lekcji

**Zasada D-52:** aktualna treść lekcji to jej `update`, jeżeli istnieje, a w przeciwnym razie sama lekcja. Tę treść widzi każde konto, także z ukończoną lekcją. Można ją poprawiać w miejscu dowolną liczbę razy: `title`, `intro`, `wordIds`, `exerciseIds`, `ruleIds`. Ukończenie zależy tylko od `id` lekcji, więc edycja nie otwiera lekcji ani mapy ponownie.

Co wolno, a czego nie:

- **Wolno:** dodawać, usuwać i przestawiać zadania na liście lekcji; zmieniać tytuł i wstęp; dopisywać nowe słówka i zadania do plików modułu.
- **Nie wolno:** zmieniać `id` lekcji, usuwać lekcji ani dodawać nowej wymaganej lekcji do ukończonej mapy bez osobnej decyzji; zmieniać listy i kolejności lekcji w sekcji z `adaptiveReviews`.
- **Nie wolno:** usuwać z plików modułu opublikowanego słówka lub zadania ani zmieniać jego `rev`. Rozpoczęte sesje, kolejki błędów i liczniki utrwalenia wskazują klucz `moduleId@rewizja:typ:id`; bez tego elementu nie da się ich wznowić. Zadanie zdjęte z lekcji zostaje w pliku.
- **Istotna zmiana zadania** (inne pytanie, inna odpowiedź) = nowe zadanie z nowym `id`; stare zostaje w pliku. Poprawka literówki lub wyjaśnienia nie wymaga nowego `id`.

Pole `update` jest zachowanym formatem etapu 4, nie rejestrem wydań: zawiera `edition: 2`, `title`, `intro`, `wordIds`, `exerciseIds` i `ruleIds`, nie może zmieniać `id`, roli ani zawierać kolejnego `update`, ma 6–10 zadań i wskazuje istniejące materiały. W lekcjach, które je mają (etapy 5–7 pierwszej mapy Food), edytujemy treść wewnątrz `update`; oryginalna lista pod nim nie jest już pokazywana, ale zostaje jako źródło poznanego materiału. Nowe lekcje nie potrzebują `update` — edytujemy je bezpośrednio. Zapisywany przy sesji i ukończeniu znacznik `edition: 2` jest historyczny i nie wpływa na działanie; nie wprowadzamy wydań 3, 4… [Przykład Food i ochrona danych](archiwum/wdrozenie-food.md) opisuje stan sprzed D-52.

## Scena dialogowa z kilkoma lukami

Status: wdrożone (D-53). Scena jest wpisem w `rozmowki.json` z `kind: "dialogue"` i polem `gaps`. Wpis z jedną luką (z `answers` i `options` na poziomie wpisu) pozostaje bez zmian.

```json
{
  "id": "scene-order",
  "kind": "dialogue",
  "title": "Zamówienie w restauracji",
  "prompt": "Uzupełnij rozmowę.",
  "dialogue": [
    {"speaker": "Kelner", "text": "What ___ you like?"},
    {"speaker": "Gość", "text": "I'd like a ___ pizza, please."}
  ],
  "gaps": [
    {"id": "would", "input": "bank", "answers": ["would"], "options": ["would", "many", "some"], "explanation": "…", "ruleId": "ordering"},
    {"id": "vegetarian", "input": "text", "answers": ["vegetarian"], "options": ["vegetarian", "hungry"], "explanation": "…"}
  ],
  "requires": ["unit-2-food"],
  "caseSensitive": false,
  "source": "Adaptacja na podstawie modułu 2: podręcznik, s. 30 i 33. Nie jest cytatem."
}
```

| Pole | Zasada |
| --- | --- |
| `title` | Krótki polski tytuł sceny, do 80 znaków |
| `dialogue` | 2–8 kwestii; każde `___` to jedna luka |
| `gaps` | 2–6 luk, w kolejności występowania `___`; liczba luk musi równać się liczbie `___` |
| `gaps[].id` | Małe litery, cyfry i myślniki; niepowtarzalny w scenie |
| `gaps[].input` | `bank` — wybór z propozycji; `text` — wpisanie |
| `gaps[].answers`, `options` | Jak w zwykłym zadaniu: co najmniej dwie opcje i dokładnie jedna poprawna. Opcje są wymagane także przy `text`, bo w powtórkach i w trybie wyboru luka jest zwykłym zadaniem |
| `gaps[].explanation` | Wyjaśnienie po polsku, pokazywane po błędzie i w podsumowaniu |
| `gaps[].ruleId`, `rev` | Opcjonalne, jak w zwykłym zadaniu |
| `requires`, `caseSensitive`, `source`, `illustration` | Wspólne dla całej sceny; `source` jest wymagane i oznacza adaptację oraz strony podręcznika. Ilustracja jest opcjonalna i pokazuje się raz, przy pierwszej kwestii |

Każda luka staje się zwykłym zadaniem o identyfikatorze `<id sceny>--<id luki>`, np. `scene-order--would`. Poza sceną — w powtórce błędów albo gdy do sesji trafiła tylko część luk — pokazuje się jako krótki dialog z jedną luką: kwestia z luką i kwestia sąsiednia, z pozostałymi lukami już uzupełnionymi.

Lekcja bierze scenę, wymieniając **wszystkie jej luki** w `exerciseIds` (także wewnątrz `update`) — mapa nie ma osobnego pola scen. Według D-54 historyjkę przygotowujemy jako całą lekcję: `wordIds` jest puste, a `exerciseIds` zawiera wyłącznie luki jednej sceny. Kolejność na liście nie ma znaczenia: sesja układa luki według rozmowy. Pełna scena z 2–6 lukami jest wyjątkiem od minimum sześciu zadań zwykłej lekcji; aplikacja nie dokłada do niej ćwiczeń uzupełniających. Starsze mieszane sesje zachowują zapisany zestaw i scenę na końcu, bez zmiany aktywnego postępu.

```json
{"id": "restaurant-dialogue-1", "wordIds": [], "exerciseIds": ["scene-order--would", "scene-order--vegetarian"], "ruleIds": ["ordering"]}
```

Po publikacji sceny obowiązuje [reguła edycji treści](#aktualizacja-wydanej-lekcji): nie usuwamy sceny ani luki z pliku i nie zmieniamy identyfikatorów luk, bo są kluczami postępów. Wolno poprawić kwestie, odpowiedzi i wyjaśnienia oraz zdjąć scenę z listy lekcji. `npm run check:content` odrzuca scenę z niezgodną liczbą luk, brakiem opcji, wyjaśnienia lub `source`, powtórzonym identyfikatorem oraz lekcję, która wymienia tylko część luk sceny albo nieistniejącą lukę.

Scena nie zależy od kursu: każdy moduł dowolnego kursu może mieć własne sceny w swoim `rozmowki.json`, bez zmian w kodzie. Role z `dialogue[].speaker` otrzymują istniejące portrety kotków, różne dla różnych rozmówców i stałe w danej sesji. Nie trzeba dodawać obrazków ani identyfikatorów kotów do materiałów.

## Czytanka

Status: wdrożone (D-68). Plik `czytanki.json` to tablica czytanek; włącza go pole `readingsFile: "czytanki.json"` w `modul.json` (tak jak `dialoguesFile` dla rozmówek). Inna nazwa pliku jest odrzucana. Zasady nauki: [czytanki](03-nauka.md#czytanki-d-68).

```json
{
  "id": "reading-picnic",
  "title": "Piknik kotków",
  "illustration": "illustrations/piknik-kotkow.png",
  "questionLanguage": "en",
  "sentences": [
    {"id": "s1", "text": "Olus and Maja have a picnic in the garden.", "translation": "Oluś i Maja mają piknik w ogrodzie."},
    {"id": "s2", "text": "Maja has got some apples and a bottle of water.", "translation": "Maja ma trochę jabłek i butelkę wody."}
  ],
  "glossary": {"garden": "ogród", "bottle": "butelka"},
  "questions": [
    {"id": "where", "after": "s1", "type": "choice", "prompt": "Where is the picnic?", "glossary": {"where": "gdzie"}, "answers": ["In the garden"], "options": ["In the garden", "In the kitchen", "At school"], "refs": ["s1"], "explanation": "…"},
    {"id": "fruit", "after": "s2", "type": "tap", "prompt": "Tap the name of the fruit.", "glossary": {"fruit": "owoc"}, "sentence": "s2", "answers": ["apples"], "options": ["apples", "bottle", "water"], "explanation": "…"}
  ],
  "requires": ["unit-2-food"],
  "source": "Adaptacja inspirowana modułem 2: podręcznik, s. 32. Nie jest cytatem."
}
```

| Pole | Zasada |
| --- | --- |
| `id`, `title` | Identyfikator z małych liter, cyfr i myślników; polski tytuł do 80 znaków |
| `illustration` | Opcjonalny plik SVG lub PNG z `illustrations/` pokazywany we wstępie do lekcji |
| `sentences` | 2–40 zdań w kolejności czytania, każde z `id` (niepowtarzalnym w czytance), tekstem do 300 znaków bez `___` i polskim `translation`; długość tekstu dobrana do poziomu modułu |
| `questionLanguage` | Kod języka tekstu czytanki, zgodny z językiem nauki kursu. Walidator odrzuca inny kod. Pytania, polecenia i opcje mają być w tym języku i na poziomie tekstu (D-69). |
| `glossary` | Opcjonalne tłumaczenia słów spoza słownictwa modułu; kluczem jest słowo w formie z tekstu (np. `apples`, wielkość liter bez znaczenia). Słowo ze `slownictwo.json` tłumaczy się samo, gdy równa się `back` lub jednej z `answers` hasła |
| `questions` | 1–6 pytań w kolejności czytania (`after` nie może się cofać); `id` niepowtarzalne w czytance |
| `questions[].after` | Zdanie, po którym pojawia się pytanie; po jednym zdaniu może być kilka pytań |
| `questions[].type` | `choice` — wybór z `options` (co najmniej dwie, dokładnie jedna poprawna). Przy `tap` pod pytaniem wyświetla się całe zdanie `sentence` (bieżące lub wcześniejsze). `options` wybiera maksymalnie pięć różnych słów z tego zdania, w tym poprawną odpowiedź z `answers`. Aplikacja pokazuje je w kolejności zdania i wyróżnia tylko pierwsze wystąpienie każdego z nich. Dla starszych danych bez `options` dobiera poprawne słowo i pierwsze pozostałe słowa zdania do limitu pięciu (D-71). |
| `questions[].refs` | Zdania pokazywane z pytaniem w powtórce, tylko do `after` włącznie; domyślnie `after` (przy `tap`: `sentence`) |
| `questions[].glossary` | Wymagana mapa tłumaczeń (co najmniej jedna pozycja) pojedynczych słów lub zwrotów występujących w poleceniu; nie może obejmować całego polecenia. Wielkość liter nie ma znaczenia. Kliknięcie pokazuje tłumaczenie fragmentu (D-70). |
| `prompt`, `answers`, `explanation`, `ruleId`, `rev` | Jak w zwykłym zadaniu; `explanation` jest wymagane |
| `requires` | Wspólne dla całej czytanki, jak w scenie |
| `source` | Wymagane: adaptacja i strony podręcznika albo informacja, że tekst powstał ze słownictwa modułu |

Każde pytanie jest zwykłym zadaniem wyboru `<id czytanki>--<id pytania>` z `kind: "reading"`; nie trafia do quizu, gramatyki ani „Rozmówek”, wraca w powtórkach błędów razem ze zdaniami z `refs`. Lekcja bierze czytankę, wymieniając **wszystkie jej pytania** w `exerciseIds`, tak jak historyjka (D-54); cała czytanka jest wyjątkiem od minimum sześciu zadań, a `check:content` odrzuca lekcję z częścią pytań. Nagrania zdań przygotowuje generator ([audio](generowanie-audio.md)). Po publikacji obowiązuje [reguła edycji treści](#aktualizacja-wydanej-lekcji): nie usuwamy czytanki, zdania ani pytania i nie zmieniamy ich identyfikatorów.

## Jawna wskazówka a/an dla słówka

W dotychczasowej tablicy `Word` można dodać `article: { "expected": "an", "explanation": "Jedno jabłko to rzeczownik policzalny. Przed dźwiękiem samogłoski używamy an." }`. `expected` przyjmuje `"a"`, `"an"` albo `null` (rodzajnik niepasujący do tego znaczenia). Wyjaśnienie musi być niepustym tekstem. W formacie znaczeń wersji 2 to `articles: { "en": { "expected": "an", "explanation": "…" } }`, osobno dla wariantu językowego. Adapter przenosi metadaną do fiszki i pytania słownikowego; nie stosuje jej do zadań gramatycznych.

Przy `a`/`an` poprawna jest pełna forma lub ta sama jawnie akceptowana odpowiedź bez początkowego rodzajnika. Brak daje pomarańczową uwagę; zły lub zbędny a/an jest błędem. `null` akceptuje tylko formę bez a/an. Nie zgadujemy policzalności ani wymowy z pisowni; wpis wymaga recenzji i konkretnej wskazówki znaczenia/porcji/liczby. Brak pola zachowuje dotychczasowe dokładne porównywanie odpowiedzi. Ten zakres nie określa jeszcze polityki francuskich i włoskich rodzajników.
