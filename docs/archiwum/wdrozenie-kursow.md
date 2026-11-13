# Etap 2 — kursy i materiały wielojęzyczne

Status: wdrożone lokalnie 10 listopada 2026 r., na prośbę użytkowniczki. Zasady produktowe D-11–D-17 pozostają podstawą; zaparkowane pytania nie zostały rozstrzygnięte za użytkowniczkę.

Ten raport opisuje etap 2. Wymienione niżej jako dalszy zakres podstawowy wybór kursu i globalne ćwiczenia zostały następnie wdrożone w [etapie 3](wdrozenie-zakresow.md).

## Wynik

1. Dodano model `Course`: jeden podręcznik, osobne języki nauki i objaśnień, opis książki, poziomy, uporządkowane moduły i polecenia.
2. Rejestr `public/content/kursy.json` wiąże istniejący Food z `angielski-hani`. Nie ustalono tytułu, autorów, wydania ani poziomu całego podręcznika — zapisano `null`, bez zgadywania.
3. Dodano model jednego znaczenia `Meaning` z przypisaną ilustracją i wariantami językowymi. Nowe materiały mogą używać formatu `slownictwo.json` w wersji 2; akceptowane odpowiedzi są odrębne od listy form językowych.
4. Wspólny odczyt biblioteki i adapter starego formatu tworzą `Word` i `Exercise` dla istniejącego silnika. Nie ma osobnych silników dla angielskiego, francuskiego i włoskiego. Polecenia i domyślne objaśnienia słownikowe pochodzą z danych kursu; dawne domyślne napisy są ograniczone do warstwy zgodności.
5. Zakres wcześniejszych modułów, trening, zależności zadań i zgodność sesji respektują kurs. Kolejność w kursie jest niezależna od numeru działu. Kontynuacja nie przechodzi automatycznie do obcego podręcznika po wyczerpaniu bieżącego kursu; rozpoczęta sesja nadal ma pierwszeństwo.
6. Kontrola treści korzysta z tego samego odczytu co aplikacja, bez importowania produkcyjnych danych z pliku pomocniczego testów.

## Ochrona Food i wyników

- Nie zmieniono żadnego pliku w `public/content/02-food/`: słów, pytań, gramatyki, dialogów, ilustracji ani mapy.
- Porównanie w testach potwierdza identyczne słowa, skompilowane zadania, reguły, podstawowy zestaw fiszek i klucze wyników przed i po przypisaniu kursu.
- `order: 2` pozostaje numerem działu Food. Wewnętrzna `courseOrder: 1` oznacza pierwszy dostępny moduł kursu, bez zmiany napisów na ekranie.
- Nie zmieniono `Progress`, formatu kopii, IndexedDB, reguł Firestore, salda gwiazdek, domku ani algorytmu powtórek. Definicje kursów i znaczeń są materiałami, nie nową kopią danych wysyłaną z postępami do Firebase.
- Nie zmieniono CSS, grafik ani układu ekranów. Identyczny wynik budowania stylów: `index-D1PafyNd.css`.
- Nie wykonano publikacji ani zmian na prawdziwym koncie Hani.

## Nowe miejsca pracy

| Obszar | Plik |
| --- | --- |
| Typy kursu, znaczenia i wariantu | `src/materials/model.ts` |
| Odczyt biblioteki i przypisania kursów | `src/materials/library.ts` |
| Kontrakt katalogu i kursów | `src/materials/validation.ts` |
| Nowe znaczenia i projekcja do fiszek | `src/materials/vocabulary.ts` |
| Adapter dawnego katalogu i oznaczeń języków | `src/materials/legacy.ts` |
| Domyślne objaśnienie słówka według kursu | `src/materials/presentation.ts` |
| Zakres kursu i porównywanie kolejności modułów | `src/learning/scope.ts` |
| Pobieranie plików w przeglądarce | `src/content.ts` |

Format dla autorów materiałów: [kursy i materiały](../format-materialow.md).

## Sprawdzenie

- **114/114 testów Node**, w tym 14 nowych scenariuszy modelu kursów, znaczeń, odwołań i zachowania postępów.
- **61/61 testów Playwright** gotowej aplikacji na `/HaniaAngielski/`, w Chrome: dotychczasowy Food, małe ekrany, stare kopie, konta i konflikty, service worker, offline oraz cztery nowe scenariusze kursów.
- Francuski i włoski sprawdzono na **syntetycznych materiałach testowych**, w tym znaki językowe, jawne warianty odpowiedzi, wznowienie oraz dwa podręczniki francuskiego z oddzielnymi wynikami. To kontrola techniczna, nie zatwierdzone kursy ani recenzja podręczników.
- Budowanie i kontrola materiałów przechodzą. Bez nowych zależności i obrazków. Główny kod po kompresji: około 42,4 kB zamiast 40,5 kB; dodatkowo mały plik rejestru kursów. Firebase jest nadal ładowany osobno. Cache PWA obejmuje 196 plików, w tym nowy rejestr.

## Co zostaje na dalsze etapy

- Wybór kursu i zakresu w interfejsie, globalne fiszki/quiz/gramatyka oraz pełne powiązanie tych wejść z mapami.
- Docelowe zasady osobnych aktywnych sesji i preferencji kursu; obecnie nadal jedna aktywna sesja użytkownika.
- Audyt i poprawki nieukończonych części Food oraz kolejne produkcyjne mapy na podstawie źródeł.
- Rzeczywiste podręczniki, materiały i recenzja kursów francuskiego i włoskiego.
- Nowy algorytm powtórek, szczególne kryteria językowe i inne zaparkowane decyzje.
