# Materiały i poprawność merytoryczna — stan obecny

[Zakres przeglądu](../../README.md). Ten dokument nie potwierdza ponownego porównania całej treści ze zdjęciami podręcznika.

## Co jest dostępne

Katalog zawiera `02-food`, moduł `unit-2-food`, opisany jako angielski Food, poziom A2. Metadane wskazują podręcznik s. 24–35, ćwiczenia s. 14–21 i notatki o ilościach. Są to opisy źródeł wpisane w materiałach.

Obecny zestaw ma 97 haseł, 38 fiszek podstawowych, 97 pytań słownikowych, 59 zadań gramatycznych, 12 dialogów i 9 zasad gramatycznych. Mapa wskazuje 41 lekcji w 7 etapach. Liczby wynikają z aktualnych plików i testów; nie są wymogiem dla każdego przyszłego modułu.

Źródła: [modul.json](../../../public/content/02-food/modul.json), [tests/content.test.ts](../../../tests/content.test.ts), [tests/adventure.test.ts](../../../tests/adventure.test.ts), [kontrola materiałów](../../../scripts/check-content.mjs).

## Podział plików

| Plik w katalogu modułu | Odpowiedzialność |
| --- | --- |
| `modul.json` | Identyfikator, numer/kolejność, nazwa, opis języka, poziom, źródło, tematy, podstawowe fiszki i ścieżka mapy |
| `slownictwo.json` | `front`, `back`, jawne warianty `answers`, źródło i ilustracja słowa |
| `quiz.json` | Odwołanie `wordId`, identyfikatory błędnych wariantów oraz ewentualne własne polecenie/wyjaśnienie |
| `gramatyka.json` | Zasady, objaśnienia, przykłady i źródła |
| `cwiczenia.json` | Zadania gramatyczne, odpowiedzi, warianty, wyjaśnienia i zależności |
| `rozmowki.json` | Opcjonalne dialogi; plik jest wczytywany, gdy metadane wskazują `dialoguesFile` |
| `sciezka.json` | Tytuł mapy, etapy, wprowadzenia i odwołania do istniejących słów, zadań i zasad |

Quiz korzysta ze słownika, więc poprawka słowa może aktualizować również pytanie i warianty odpowiedzi. `front`/`back` nie kodują formalnie języka; w Food oznaczają polskie hasło i angielską odpowiedź. `language` jest zwykłym napisem „Angielski”, nie kodem języka ani identyfikatorem kursu.

Źródła: [model](../../../src/learning/model.ts), [loadModules](../../../src/content.ts), [assembleModule](../../../src/content-validation.ts), [instrukcja edycji](../../../public/content/README.md).

## Co sprawdza program

`validateModules` kontroluje m.in. wymagane pola, unikalność identyfikatorów w odpowiednich zakresach, odwołania quizów, listę podstawowych fiszek, poziom A1–C2, rewizje, zależności od istniejących modułów oraz odwołania do reguł gramatycznych. Zależność nie może wskazywać modułu o wyższym `order`.

Każde zadanie — również przeznaczone do wpisywania — ma listę `answers`, minimum 2 warianty `options`, wyjaśnienie i źródło. Po normalizacji dokładnie jeden wariant wyboru musi odpowiadać któremuś z `answers`. Dialog ma 2–6 wypowiedzi i dokładnie jedną lukę `___`. Warianty wpisywania mogą być liczniejsze niż jedna poprawna opcja wyboru.

Ilustracje mają określony format i lokalną ścieżkę SVG lub symbol. Walidacja struktury nie sprawdza istnienia każdego pliku na dysku. Niektóre testy sprawdzają pliki obecnych ilustracji Food.

`validateJourney` sprawdza strukturę mapy, identyfikatory etapów/lekcji i ich odwołania. **Obecne `check:content` nie wywołuje tej funkcji dla wszystkich map**: składa i waliduje moduły przez pomocnik testowy. Mapy są walidowane podczas uruchomienia aplikacji oraz w wybranych testach Food.

Źródła: [walidacja modułów](../../../src/content-validation.ts), [walidacja map](../../../src/adventure.ts), [pomocnik materiałów](../../../tests/materials.ts), [testy ilustracji](../../../tests/illustrations.test.ts).

## Czego te kontrole nie potwierdzają

- Czy tłumaczenie, rodzajnik, odmiana i przykład są poprawne w danym języku.
- Czy pole `source` wskazuje prawdziwą stronę i czy adaptacja zachowuje sens źródła.
- Czy zadanie używa wyłącznie słownictwa i gramatyki dozwolonych w danym module lub wcześniejszych.
- Czy wpisany poziom CEFR odpowiada trudności treści.
- Czy ilustracja przedstawia właściwe znaczenie, bez zdradzania odpowiedzi.
- Czy odczyt ze zdjęcia/PDF nie zawiera pomyłek.

Źródła są obecnie niepustymi tekstami; nie ma katalogu wydań podręczników, automatycznie sprawdzanych odnośników do skanów ani zapisanego statusu recenzji językowej. Aplikacja nie ma własnego procesu OCR ani generowania modułu przez AI.

**Ograniczenie:** poprawny technicznie JSON nie oznacza poprawnej lekcji. Dotychczasowe testy Food chronią wybrane ustalenia językowe, ale nie stanowią kompletnej recenzji podręcznika.

## Edycja a wyniki

Klucze wyników zawierają identyfikator modułu, rewizję elementu, typ i identyfikator słowa/zadania. Zmiana samej wersji całego modułu nie resetuje wszystkich wyników. Zmiana `rev` konkretnego elementu powoduje, że dawna sesja może wymagać starej rewizji materiału; zapis i historia pozostają zachowane.

Ukończenia lekcji i powtórki etapów korzystają ze stabilnych identyfikatorów modułu, lekcji i etapu. Samego przemianowania identyfikatorów nie należy traktować jak kosmetycznej korekty tytułu.

Źródła: [keyFor](../../../src/learning/model.ts), [resolveItem](../../../src/learning/questions.ts), [walidacja kopii](../../../src/learning/backup.ts), [testy zgodności](../../../tests/stage2.test.ts).

## Co wymaga ustalenia przed nowym językiem

**Do ustalenia, jeszcze niewdrożone:** zapis źródła podręcznikowego i recenzji, zasady dopuszczania wariantów odpowiedzi, obowiązkowe rodzajniki/akcenty, kierunek tłumaczenia oraz sposób potwierdzenia zakresu nowego modułu. Konkretne luki opisuje [przegląd wielojęzyczności](../../rozwoj-jezykow.md).
