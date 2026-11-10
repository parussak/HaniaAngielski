# Gotowość na francuski i włoski — diagnoza implementacji

Status: przegląd braków obecnego kodu. Założenia docelowe są opisane w [mechanice](02-mechanika.md) i [nauce](03-nauka.md), a otwarte decyzje w [rejestrze](decyzje.md). Punkty J1–J10 pozostają diagnozą i propozycjami technicznymi, nie równoległą specyfikacją produktu.

Przegląd kodu i testów z 9–10 listopada 2026 r., rewizja `24cdeda`. **To lista ustaleń i propozycji, nie specyfikacja wdrożonej wielojęzyczności.** Nie zmieniono działania aplikacji ani zapisanych wyników.

## Aktualizacja po etapach 1 i 2

Poniższa diagnoza J1–J10 jest historycznym punktem odniesienia rewizji `24cdeda`. Obecny kod ma już kurs, osobne języki, format znaczeń z wariantami, zgodny adapter Food i ograniczenie zakresów do kursu. Polecenia nowego kursu są danymi, a materiały kontroluje wspólny odczyt. Testy obejmują syntetyczne FR/IT i dwa podręczniki tego samego języka. [Raport etapu 2](wdrozenie-kursow.md) i [format materiałów](format-materialow.md) określają aktualny stan.

Etap 3 wdraża wybór kursu oraz globalne fiszki/quiz/gramatykę z poznanego materiału — [raport zakresów](wdrozenie-zakresow.md). Nadal potrzebne są rzeczywiste podręczniki i recenzja ich treści (J4/J7/J8), usunięcie pozostałych szczegółów prezentacji Food przed innymi produkcyjnymi mapami (J5), ewentualna izolacja awarii map (J6), pobieranie materiałów kursami (J9) i decyzje dla osoby dorosłej (J10). Nie uznajemy tych problemów za rozwiązane przez samo przejście testów.

## Kierunek wynikający z ustaleń użytkowniczki

- Hania: angielski i bardzo podstawowy francuski, na podstawie jej podręczników, objaśnienia po polsku.
- Paulina: włoski na poziomie około A1/A2, również z podręcznika, z możliwością późniejszego dopasowania nauki do własnych potrzeb.
- Wspólna aplikacja, rozwijana z AI, z ograniczonym kosztem kontekstu. Mechanika i materiały powinny być rozdzielone.

To cele rozwoju. Dzisiejszy katalog zawiera tylko angielski Food. Nie znamy jeszcze tytułów/wydań nowych podręczników, zakresów pierwszych modułów ani zasad akceptowania wariantów francuskich i włoskich.

## Co można już wykorzystać

Są osobne pliki materiałów, wspólne typy ćwiczeń, wiele kont, identyfikatory modułów w wynikach, mapy wskazywane przez `journeyPath`, pola poziomu oraz jawne odpowiedzi `answers`. Zapis i synchronizacja nie wymagają, aby tekst odpowiedzi był angielski. Normalizacja Unicode zachowuje znaki językowe.

Nie potrzeba zaczynać całej aplikacji od nowa. **Wiele modułów nie jest jednak równoznaczne z wieloma odseparowanymi kursami.**

## Braki i priorytety

P0 — rozstrzygnąć przed udostępnieniem jednocześnie różnych języków. P1 — potrzebne przed wygodnym publikowaniem kolejnych kursów. P2 — ocenić, gdy pojawią się realne potrzeby lub większe materiały. Priorytety są propozycją tego przeglądu.

### J1 · P0 · Brak kursu i jednoznacznego języka docelowego

**Stan:** [Module](../src/learning/model.ts) ma napis `language`, ale nie ma kursu, kodu języka docelowego ani języka objaśnień. Katalog jest jedną płaską listą; kolejność `order` jest globalna. Pole `front`/`back` nie określa kierunku nauki.

**Skutek:** same napisy „Francuski” i „Włoski” nie wystarczą do konsekwentnego filtrowania, kolejności podręcznika i poleceń.

**Proponowany warunek rozwiązania:** uzgodnić minimalny opis kursu i jego języków oraz sposób przypisywania modułów. Zachować istniejący `unit-2-food` i klucze wyników; nie zmieniać identyfikatorów wyłącznie dla estetyki. Konkretnego nowego schematu jeszcze nie zatwierdzono.

### J2 · P0 · Zakres nauki może mieszać języki

**Stan:** [eligibleModules](../src/learning/questions.ts) dołącza wszystkie moduły o niższym `order`, [validateModules](../src/content-validation.ts) kontroluje zależności według tej kolejności, a [getNextStep](../src/next-step.ts) przegląda mapy globalnie. Statystyki w [statistics.ts](../src/learning/statistics.ts) obejmują przekazany katalog. Nie ma przypisania kursów ani oddzielnej aktywnej sesji per kurs.

**Skutek:** francuski o niższym numerze mógłby wejść do powtórki „wcześniejszych modułów” angielskiego. Ramka kolejnej lekcji może przejść do innego języka bez świadomego wyboru.

**Proponowany warunek rozwiązania:** wybrać zasady wyboru kursu i granic powtórek, zależności oraz następnego kroku. Test musi wykazać, że wcześniejszy numer modułu obcego kursu nie rozszerza przypadkowo zakresu. Statystyki łączne mogą pozostać, ale ich zakres powinien być czytelny.

### J3 · P0 · Angielskie polecenia w mechanice

**Stan:** [assembleModule](../src/content-validation.ts) domyślnie generuje „Podaj po angielsku”, a [widok ćwiczenia](../src/views/study.ts) ma nagłówek „FISZKA · PODAJ PO ANGIELSKU”. W [adventure-view.ts](../src/adventure-view.ts) przykłady i słowa mają `lang="en"`.

**Skutek:** poprawne francuskie dane mogą otrzymać błędne polecenie i oznaczenie języka dla czytnika ekranu. Własne polecenie w `quiz.json` omija tylko część problemu, nie rozwiązuje całej aplikacji.

**Proponowany warunek rozwiązania:** język zadania wynika z kursu/materiału; interfejs i objaśnienia mogą nadal być polskie. Sprawdzić fiszki, quiz, lekcję, dialog i atrybuty `lang` na rzeczywistym krótkim materiale francuskim.

### J4 · P0 · Brak uzgodnionych zasad odpowiedzi FR/IT

**Stan:** [normalizeAnswer](../src/answers.ts) zachowuje akcenty i apostrofy po ujednoliceniu ich wybranych postaci; [isCorrect](../src/learning/questions.ts) porównuje jawne warianty. Nie ma oceny swobodnej wypowiedzi ani reguł językowych rozszerzających `answers`.

**Skutek:** trzeba ustalić, czy brak akcentu jest błędem i kiedy wymagany jest rodzajnik. Nie należy rozwiązywać tego globalnym usuwaniem znaków, bo może zatrzeć różnicę znaczenia.

**Do ustalenia:** obowiązkowe akcenty, rodzajniki, elizje, warianty rodzaju/liczby, akceptowane tłumaczenia i kierunek odpowiedzi. Przykładowe pary do przyszłych testów: `é/e`, `a/à`, `caffè/caffe`, `l’ami/l'ami` oraz zapis NFC i rozłożony Unicode. Są to przypadki do oceny, nie lista odpowiedzi uznanych teraz za poprawne.

### J5 · P1 · Food i ilustracje poza materiałem modułu

**Stan:** [adventure-view.ts](../src/adventure-view.ts) zawiera etykiety „Mapa Food”, komunikaty Food i odznakę kucharza. [Katalog map](../src/views/catalog.ts) używa obrazka pikniku, a [setup](../src/views/setup.ts) opisuje rozmówki o jedzeniu. Rozpoznawanie wyboru w [questions.ts](../src/learning/questions.ts) zawiera też konkretną konstrukcję o policzalności.

Ilustracja słowa jest opcjonalna w typie i walidatorze, ale wprowadzenie do lekcji odczytuje `w.illustration!.src!`. [Generator ilustracji](../scripts/generate-food-art.mjs) jest narzędziem dla Food, nie uniwersalnym generatorem kursów.

**Proponowany warunek rozwiązania:** oddzielić oprawę modułu od wspólnych widoków, uzgodnić wymagania ilustracji i zachowanie przy jej braku. Nie przebudowywać samych kotków, jeżeli mają pozostać wspólną oprawą.

### J6 · P1 · Walidacja i awaria nowej mapy

**Stan:** [check-content.mjs](../scripts/check-content.mjs) nie sprawdza wszystkich map ani plików ilustracji. [loadJourneys](../src/adventure.ts) używa `Promise.all`, a [startup](../src/app/startup.ts) przy błędzie zestawu map wraca do pustej listy map.

**Skutek:** pojedyncza uszkodzona mapa francuska może wyłączyć również widoczność mapy Food; ćwiczenia swobodne pozostają dostępne, zapis nie jest przez to usuwany.

**Proponowany warunek rozwiązania:** przed publikacją walidować każdą zadeklarowaną mapę i zasoby. Ustalić, czy awaria jednego kursu ma izolować tylko ten kurs. To decyzja o odporności, nie potrzeba przepisywania całego loadera już teraz.

### J7 · P1 · Brak powtarzalnej recenzji materiałów podręcznikowych

**Stan:** [walidator](../src/content-validation.ts) wymaga źródeł tekstowych, ale nie potwierdza ich treści ani zakresu użytego słownictwa. Nie ma etapu OCR/recenzji w aplikacji ani metadanych „sprawdzone przez / niepewny odczyt”.

**Proponowany warunek rozwiązania:** ustalić lekką instrukcję przygotowania modułu ze zdjęć/PDF, oznaczanie niepewności oraz przegląd odpowiedzi i objaśnień. Trzymać ją oddzielnie od instrukcji zmieniania mechaniki. Nie dodawać AI do każdego ćwiczenia tylko po to, by przygotować materiały.

### J8 · P1 · Testy nie dowodzą gotowości językowej

**Stan:** [content.test.ts](../tests/content.test.ts) zakłada jeden moduł i konkretne liczby Food. Część pozostałych testów odwołuje się do `modules[0]`. [Test drugiego modułu](../tests/browser/next-step.spec.ts) kopiuje Food, nie tworzy prawdziwego kursu francuskiego. Playwright nie jest uruchamiany w obecnych workflow GitHub.

**Proponowany warunek rozwiązania:** oddzielić wspólne kontrole każdego modułu/kursu od regresji Food; dodać małe reprezentatywne próbki FR/IT i testy granic kursów. Uzgodnić kontrolę przeglądarkową przed publikacją, nie tylko podmienić oczekiwane liczby. Szczegóły: [testy](stan-obecny/testy.md).

### J9 · P2 · Wszystkie materiały pobierane razem

**Stan:** [loadModules](../src/content.ts) pobiera cały katalog, a [service worker](../scripts/build-sw.mjs) przygotowuje całe publiczne wydanie offline.

**Skutek:** kolejne podręczniki i obrazy zwiększą czas pobierania i cache także dla osoby uczącej się tylko jednego języka.

**Propozycja:** najpierw mierzyć rozmiar rzeczywistych nowych materiałów. Pobieranie wybranych kursów wdrażać, gdy będzie potrzebne; nie budować od razu dużego systemu pobierania.

### J10 · P2 · Potrzeby osoby dorosłej nie są jeszcze osobnym trybem

**Stan:** wspólne mapy, kotki, nagrody i polskie teksty; konto przechowuje imię i wyniki, nie cele nauki. Typy zadań wymagają przygotowanych odpowiedzi i wariantów.

**Do ustalenia:** czy Paulina chce te same mapy i nagrody, wybór tematów, szybsze pomijanie znanego materiału lub dodatkowe sytuacje codzienne. Nie ma podstaw, by automatycznie usuwać kotki lub projektować osobną aplikację. Zadania otwarte, wymowa i AI podczas nauki byłyby odrębnymi funkcjami, nie koniecznym warunkiem pierwszego modułu włoskiego.

## Proponowany następny etap — bez wdrożenia w tym zadaniu

1. Uzgodnić minimalne granice kursów i zasady FR/IT z punktów J1–J4, chroniąc obecne identyfikatory i kopie.
2. Przygotować niewielką próbkę z rzeczywistego podręcznika francuskiego: słowa, jedną zasadę i krótki dialog. Oznaczyć źródła i niepewności.
3. Usunąć tylko powiązania kodu, które blokują tę próbkę, i uzupełnić właściwe testy; sprawdzić równolegle, czy Food zachował działanie i wyniki.
4. Dopiero po pilotażu zastosować format do pierwszego modułu włoskiego i ocenić potrzebę dalszej personalizacji.

Nie zaleca się ponownego refaktoringu całej aplikacji przed tym rozstrzygnięciem. Krótka specyfikacja kolejnej zmiany powinna odwoływać się do wybranych punktów tej listy; nie musi powtarzać wszystkich dokumentów ani całej historii rozmowy.
