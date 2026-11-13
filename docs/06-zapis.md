# Zapis — co, gdzie i z jaką zgodnością

**D-59:** manifest i klipy audio są artefaktami repozytorium poza `public/`. Nie należą do postępów, kopii użytkownika, Firebase ani obecnej pamięci PWA. Generator nie czyta ani nie modyfikuje wyników i portfeli; nie wprowadzono migracji. Narzędzia i model głosu pozostają na komputerze przygotowującym treść. [Wymagania i pliki](generowanie-audio.md).

**D-57:** nowy widok postępów nie zmienia formatu, reguł Firebase, kompakcji ani danych wyników. Ukończenia, portfele i archiwa są tylko odczytywane. Wybór kursu korzysta z istniejącej lokalnej preferencji konta/gościa, nie przenosi postępów między kursami. Otwarcie szczegółów jest stanem widoku, nie nowym polem kopii. Archiwum nie przechowuje pełnych dat i tekstu odpowiedzi w podsumowaniu; tydzień może więc uzupełnić się po wczytaniu stron, a ostatnie sukcesy nie są prezentowane jako pełna historia opanowania. Zakupy nie zmniejszają liczby wszystkich zdobytych gwiazdek.

**D-56:** kolor błędnej luki jest odtwarzany z `attempts`, więc nie wymaga nowych danych ani migracji. Wyjście „Dalej” z planszy zachowuje istniejące próby i zapisuje brakujące jako puste odpowiedzi; ustawia indeks za całą grupą przez obecny mechanizm przechodzenia. Czyszczenie roboczego rozmieszczenia i naliczenie nagród nadal odbywają się w jednej mutacji. Poprawa linijki dialogu korzysta z dotychczasowego `retry`; pierwsza próba pozostaje osobno od poprawki. Portrety przy każdej kwestii nadal wynikają z tego samego ID sesji i sceny. Stare kopie, ukończenia, zakupy i gwiazdki pozostają zgodne.

**D-55:** natychmiastowe sprawdzanie plansz wykorzystuje istniejące `gapPlacements`, `gapSelection` i próby. Błędny token pozostaje zapisany; odłożenie lub zaznaczenie nie dopisuje próby. Starsza kopia z nieocenionym rozmieszczeniem nadal się wczytuje — nie oceniamy jej automatycznie podczas odczytu. Nowa interakcja sprawdza nowe wstawienie. Rodzajniki w wariantach wyboru są dodawane przy odczycie pytania, bez zmiany `items[].options` w kopii. Ukończenia, gwiazdki i format v1 pozostają bez zmian.

**D-54:** koci rozmówcy nie dodają nowych pól do wyników ani kopii — obsada wynika z istniejącego identyfikatora sesji i sceny. Zmiana czterech lekcji Food na same historyjki dotyczy nowych sesji. Rozpoczęte sesje mają swoje zapisane zadania i są wznawiane bez skracania, zaś ukończenia i nagrody pozostają zgodne z D-52.

Status: obecne rozwiązanie oraz granice przyszłych zmian. Dokument nie wprowadza migracji.

## Stan obecny

### Nowe prezentacje i poziom legendarny — D-50

Nowa sesja może zawierać `legendary: true`, wybór `pairSelection` lub `draftAnswer`; element ma opcjonalny `pairGroup` albo `presentation: bank`. Pola są walidowane w kopii v1 i zapisywane w istniejącym rekordzie lokalnym/konta. Plansza ma 2–3 kolejne elementy, każdy ze swoim dotychczasowym kluczem i oceną. Wybranie innego hasła przestawia tylko nierozwiązane elementy tej planszy, bez zmiany ocen wcześniejszych odpowiedzi. Bank zapisuje propozycję przed oceną; nowy krok usuwa robocze wybory. Kolejki błędów przechowują zwykły element bez oprawy planszy, aby powtórka z wpisywaniem nie wymagała odtworzenia innych par. Brak nowych pól zachowuje stary przebieg; nie przebudowujemy rozpoczętych sesji. Kopia, synchronizacja, kompakcja i nagroda za ponowną pełną lekcję korzystają z dotychczasowego mechanizmu.

### Plany sekcji i wspólne utrwalenie — D-48–D-49

Opcjonalne `adventure.sectionPlans` przechowuje jeden plan na sekcję: siedem identyfikatorów bazowych i dwa miejsca `after`. Losujemy go przy wejściu w naukę mapową, zapisując przez istniejącą transakcję lokalną/konta. Sam start aplikacji, import ani wznowienie starej sesji nie dopisują planu. Rozpoczęte sekcje bez planu zachowują stary zakres. Plan jest częścią kopii v1 i synchronizacji; istniejące rozstrzyganie konfliktów chroni równoległe urządzenia. Nie scalamy losowo dwóch różnych planów.

`adventure.memory` ma jeden wpis na dokładny klucz elementu i wersji, z licznikiem 0–3 oraz odwołaniem do materiału. Rozliczenie ukończonej sesji ma znacznik `retentionCounted: true`; nie powstaje osobna lista wszystkich naliczeń. Współpracuje ze starymi `stageReviews` bez kasowania historii. Sesje nadal podlegają kompakcji, a przyrost pamięci zależy od liczby różnych ćwiczonych elementów, nie liczby odpowiedzi.

Dynamiczna sesja jest zwykłą lekcją z `recall.stageId` i stabilnym kluczem zakończonym `-recall-1` lub `-recall-2`. Korzysta ze zwykłych nagród i ukończeń. Dobrowolny początek/finał zachowuje `training.kind: extra` i dodaje tylko `ritual: opening | finale`. Brak nowych pól oznacza dotychczasowy zapis. Walidacja weryfikuje plan, zakresy liczników, powiązanie kluczy i dozwolone kombinacje sesji. Nie zmieniono wersji kopii ani zapisanych identyfikatorów, ukończeń, gwiazdek, zakupów i sesji aktywnych. [Reguły nauki](03-nauka.md).

| Dane | Miejsce i zakres |
| --- | --- |
| Postępy gościa | IndexedDB w przestrzeni zależnej od ścieżki strony, osobny klucz `current` |
| Postępy konta i stan synchronizacji | Lokalny rekord `account:<uid>` oraz dokument konta w Firestore |
| Imię i dane logowania | Firebase Authentication; lokalne dane do przywrócenia kontekstu konta |
| Starsza historia | Pełne sesje w niezmiennych częściach, lokalnie i na koncie; ich podsumowania w bieżącym zapisie |
| Zewnętrzna kopia | Eksport JSON, format `hania-language`, wersja `1`, z potrzebnymi archiwami |
| Materiały kursów | Wspólne pliki statyczne i cache PWA, oddzielnie od wyników |

Jedna aktywna sesja jest zapisywana dla użytkownika, nie osobno dla każdego języka. Wznowienie obejmuje m.in. pytanie, fazę, pierwszą odpowiedź i poprawki. Każde konto ma osobny bilans gwiazdek i domek dla każdego kursu.

Zachowano rozdzielenie kont i gościa, kontrolę wersji przy synchronizacji, wybór przy konflikcie i blokadę drugiej karty. Import kopii zastępuje wyniki po potwierdzeniu. Konto wysyła oczekujące zmiany po połączeniu podczas działania aplikacji lub kolejnego uruchomienia, nie jako stała usługa po zamknięciu.

Pełny opis kluczy, limitów, archiwizacji, cache i dowodów: [zapis — punkt odniesienia](stan-obecny/zapis.md). Mapa implementacji: [architektura](05-architektura.md).

## Walidacja kopii po refaktoringu etapu 4

Publiczne `validateBackup` i `backup` pozostają w `src/learning/backup.ts`. Wewnętrzne kontrole sesji, domków, przygody, historii i archiwów są rozdzielone w `src/learning/backup-validation/`. Sam podział walidatora zachował nagłówek i wersję pliku, dopuszczalne dane, limity i komunikat błędu. Walidacja nie zmienia źródła, zachowuje dodatkowe pola i zwraca niezależną kopię; nie wykonuje migracji. Odrzucenie importowanego pliku nadal nie zastępuje obecnych postępów.

Sprawdzenie kompletności archiwum, skrótów stron i zgodności podsumowania nadal wykonuje `validateFullBackup` w `src/history-backup.ts`, po walidacji strukturalnej. Tego etapu nie należy pomijać przy imporcie pełnej kopii. [Podział odpowiedzialności i zestaw zgodności](refaktoring-etap-4.md).

## Niedostępna mapa a zapis wyników

Problemy odczytu map są przejściowym stanem interfejsu, poza `Progress` i kopią. Niepełny katalog wstrzymuje migrację dawnych błędów, przesuwanie jej kursora oraz rozliczanie premii etapowych; po odzyskaniu kompletu te działania są wznawiane. Nagrody za zwykłe ukończenie lekcji działają nadal. Aktywna sesja mapy niedostępnej pozostaje zapisana i czeka na jej odzyskanie, co chroni przypisanie nowych błędów do etapu. Przygotowanie do pustego treningu nie zmienia formatu zapisu ani nie zalicza treningu za użytkownika. [Pełny opis](odpornosc-map.md).

## Rozszerzenie treningów — wdrożone po D-34

Sesja treningu ma opcjonalne pole `training` z rolą `map` lub `extra`. Trening na mapie korzysta z istniejącego rejestru ukończeń lekcji; dodatkowy trening zapisuje `rewarded: true` w ukończonej sesji. Znacznik jest zapisywany razem z gwiazdką, nie na osobnej nieograniczonej liście nagród. Sesje nadal podlegają dotychczasowej kompakcji i archiwizacji.

Format kopii pozostaje w wersji 1 i odczytuje stare dane. Kopie zawierające nowy tryb treningu wymagają aktualnej aplikacji. Nie zmieniono kluczy istniejących materiałów, IndexedDB ani reguł Firestore. Sam dobór pytań treningu i wyliczenie podglądu postępu nie zmieniają wyników. Przy uruchomieniu i zapisie aplikacja może osobno skompaktować historię, odtworzyć starsze kolejki błędów oraz rozliczyć należną, jeszcze nieprzyznaną premię dawnego etapu. To istniejące przygotowanie postępu, nie skutek wyboru kursu lub nowej wersji lekcji. Nowe nazwane mapy używają kluczy `moduleId/mapId/lessonId`; pierwsza mapa Food zachowuje `moduleId/lessonId`.

## Kursy bez migracji Food — etap 2

`Course` wskazuje uporządkowane moduły, a każdy moduł należy do jednego kursu. Moduły różnych kursów muszą mieć różne identyfikatory. Klucz `moduleId@rewizja:typ:id` pozostaje bez zmian; nie dopisujemy kursu do historycznych kluczy. To zapewnia osobne wyniki również dla identycznych lokalnych identyfikatorów znaczeń w kilku kursach.

Nie przenosimy istniejącego modułu do innego podręcznika: nowy podręcznik i istotnie zmienione wydanie wymagają nowego kursu oraz nowych identyfikatorów modułów. Kursy i znaczenia są wczytywane do pamięci aplikacji i cache materiałów PWA, a nie dopisywane do `Progress` ani payloadu Firestore. Odczyt Food nie wykonuje migracji. [Szczegóły zgodności](wdrozenie-kursow.md).

## Globalny zakres i preferencja kursu — etap 3

- `Progress.encountered` jest opcjonalną, unikalną listą kluczy elementów po pierwszej próbie. Nie zawiera ocen ani listy zdarzeń; powtarzanie tego samego elementu nie powiększa jej. Stare próby są nadal odczytywane z historii. Przy zastąpieniu starej aktywnej sesji zachowujemy klucze jej prób, bez przepisywania ocen.
- `Session.scope: { kind: "course", courseId }` oznacza globalną sesję; brak pola zachowuje dotychczasowe tryby. `moduleId` jest kotwicą zgodności kursu, a pytania nadal wskazują własne moduły i rewizje.
- `Item.options` jest małą opcjonalną migawką 2–4 poznanych opcji dla słownictwa globalnego. Dzięki niej kopia i wznowienie zachowują ten sam zestaw odpowiedzi.
- `history.courses` agreguje zarchiwizowane sesje globalne osobno od modułowych. Suma sesji kursowych i modułowych musi zgadzać się z liczbą archiwalnych sesji; pełna kopia sprawdza także wartości względem części historii. `history.items` nadal uwzględnia każdą ocenioną próbę raz.
- `course-selection:guest` i `course-selection:account:<uid>` w IndexedDB zawierają wyłącznie lokalną preferencję kursu. Nie są częścią `Progress`, kopii ani synchronizacji.

Kopia pozostaje w wersji 1 i odczytuje wcześniejsze pliki. Obsługa nowych pól wymaga aktualnej aplikacji. Nie zmieniono reguł Firebase ani nie przeliczono starych ocen. [Raport etapu 3](wdrozenie-zakresow.md).

## Wersje lekcji Food — etap 4

Dotychczasowe wpisy ukończenia `{ at }` oraz sesje bez znacznika pozostają oryginalną wersją lekcji. Nowo rozpoczynana nieukończona lekcja korzysta z opcjonalnego `update`, jeśli jej definicja je zawiera. Taka sesja zapisuje `lesson.edition: 2`, a pierwsze ukończenie zachowuje ten znacznik w `adventure.completed[lessonKey]`. Sam wybór wydania nie dopisuje migracji ani nagród. Aktywna sesja nadal przechowuje konkretną listę pytań i miejsce odpowiedzi, a stare pytania pozostają dostępne dla jej wznowienia i powtórek. Nowe lekcje drugiej mapy bez `update` nie potrzebują znacznika wydania 2. Format kopii pozostaje w wersji 1; aktualna walidacja obsługuje oba warianty. Limity historii i synchronizacji bez zmian. [Pełna ochrona wyników](wdrozenie-food.md#ochrona-wyników-i-nagród).

### Słuchanie — D-58

- Element sesji może mieć opcjonalne `listen: true` — tylko zwykłe słówko, bez par, luk i scen. Znacznik mówi „to zadanie można pokazać jako słuchanie”; o tym, czy tak się stanie, decyduje urządzenie w chwili wyświetlenia. Ta sama sesja wznowiona na telefonie bez głosu ma zwykłą formę.
- Wynik zapisuje się jak dla każdego zadania; w kolejce błędów element nie ma znacznika. Sesje i kopie bez pola działają bez zmian, kopia zostaje w wersji 1.
- Przełącznik „Ćwiczenia ze słuchu” jest zapisany w `localStorage` urządzenia (`male-kroki:sluchanie`), poza postępami, kopią i synchronizacją. Gdy pamięć przeglądarki jest zablokowana, przełącznik działa do zamknięcia strony.
- Słuchanie niczego nie zapisuje: odtworzenie nie zmienia sesji, wyników ani historii.

### Sceny dialogowe — D-53

- Element sesji może mieć opcjonalne `sceneGroup` — klucz pierwszej luki sceny. Luki jednej sceny stoją obok siebie; kopia z rozerwaną grupą jest odrzucana. Sesje i kopie bez tego pola działają bez zmian, format kopii zostaje w wersji 1.
- Każda luka ma własny wpis w `attempts` pod kluczem zwykłego zadania (`moduł@rewizja:exercise:<scena>--<luka>`). Nie ma osobnego zapisu postępu sceny: pozycję wyznacza `index` sesji, dlatego odświeżenie i synchronizacja wracają do tej samej luki.
- Podsumowanie sceny używa istniejącego znacznika `boardSummary`. Błędna luka trafia do `difficult` i `adventure.memory` jako zwykły element, bez `sceneGroup`.
- Identyfikatory luk są kluczami postępów: po publikacji nie zmieniamy ich i nie usuwamy luk z pliku. Jeśli scena w materiałach przestanie pasować do zapisanej sesji, jej luki pokazują się jako zwykłe dialogi z jedną luką.
- Urządzenie ze starszą wersją aplikacji, które dostanie z konta sesję ze sceną, pokaże bezpieczny ekran „Potrzebny jest moduł” do czasu aktualizacji; zapis zostaje.

### Aktualna treść dla wszystkich — D-52

Wybór treści lekcji nie czyta już ukończeń ani aktywnej sesji: `lessonForProgress` zawsze zwraca aktualną treść. Nie dodano żadnego pola. `adventure.completed[lessonKey]` pozostaje jedynym źródłem ukończenia, z opcjonalnym historycznym `edition: 2`; walidacja kopii nadal przyjmuje tylko brak pola lub `2`. Aktywna sesja przechowuje własne klucze zadań i jest wznawiana z nich, nie z definicji lekcji. `adventure.memory`, `stageReviews` i `sectionPlans` wskazują klucze elementów i identyfikatory lekcji, więc edycja listy zadań ich nie zmienia. Synchronizacja przesyła cały zapis postępów bez treści lekcji: urządzenie z nowszą treścią odczytuje te same ukończenia. Warunkiem wznowień jest pozostawienie opublikowanych elementów w plikach modułu z niezmienioną rewizją — [reguła edycji](format-materialow.md#aktualizacja-wydanej-lekcji). Kopia pozostaje w wersji 1, bez migracji.

## Założenia docelowe przy rozwoju

- Jeden kurs może być wspólny dla wielu kont, ale każde konto ma własne postępy; sesje i wyniki jednego konta nie zmieniają wyników innego — D-14 w [rejestrze](decyzje.md). W etapie 2 definicja kursu wskazuje globalnie unikalne moduły, a zapis nadal używa ich stabilnych identyfikatorów; nie kopiuje materiałów do danych konta.
- Również na jednym koncie postępy tego samego elementu są oddzielne w każdym kursie. Poprawna odpowiedź w kursie A nie zalicza elementu w kursie B — D-15. Techniczne współdzielenie treści nie może znieść tej granicy.
- Rozwój kursów i map musi zachować dotychczasowe wyniki, pierwsze próby i historię.
- Przy planowanych poprawkach Food zachowujemy wszystkie zaliczone lekcje, także w sekcjach 5–7, i zdobyte gwiazdki. Pierwotnie zmiany obejmowały wyłącznie nieukończone lekcje (D-24); od D-52 aktualną treść widzą także ukończone, bez otwierania ich na nowo.
- Materiał, mapa/lekcja, wykonana sesja i stan utrwalenia pozostają rozróżnialnymi pojęciami. Definicja lekcji nie jest tym samym co konkretne podejście użytkownika.
- Poznanie elementu wynika z pierwszej próby odpowiedzi, także błędnej, w kontekście konta i kursu (D-25). Nie zależy od ukończenia lekcji i nie jest równoznaczne z utrwaleniem. Uwzględniamy wcześniejsze próby ze starszej historii, bez zmiany ocen, ukończeń i gwiazdek (D-26). Wspólny odczyt w `known-material.ts` korzysta z prób ostatnich sesji, aktywnej sesji, podsumowania archiwum oraz `Progress.encountered`. Trening i globalne zestawy korzystają z tych danych; nie trzeba pobierać pełnej dawnej historii do samego ustalenia poznanego zakresu.
- Powiązanie błędu z miejscem jego wystąpienia nie usuwa informacji, z którego materiału pochodzi zadanie. Jest to ważne przy treningu wcześniejszych map.
- Ewentualny nowy harmonogram treningów musi określić potrzebne dane i sposób ich przechowywania bez nieograniczonego powiększania głównego zapisu.
- Nie zmieniamy identyfikatorów istniejących modułów, etapów, lekcji i elementów jedynie dla porządku nazewnictwa. Zmiana wymagająca migracji potrzebuje osobnego planu i testów zgodności.

Nie przesądzamy, że wszystkie obecne pola zostaną zachowane bez rozszerzeń ani że przyszła wersja na pewno nie będzie wymagać migracji. **Sama reorganizacja dokumentacji nie zmienia formatu ani danych.**

## Do ustalenia

- Podstawowe rozdzielenie wyników kursów jest wdrożone przez przypisanie stabilnych modułów. Dalsze rozszerzenia, np. inne rodzaje współdzielonych jednostek materiału, należą do [U-01](decyzje.md#u-01). Osobne postępy kont (D-14) oraz osobne postępy w różnych kursach jednego konta (D-15) są już zatwierdzone.
- Ochronę wyników, aktywnych sesji i kolejek błędów Food wdrożono w etapie 4 — [U-03](decyzje.md#u-03). Od D-52 treść lekcji można poprawiać wielokrotnie, pod warunkiem pozostawienia opublikowanych elementów w plikach modułu.
- Poznanie i odczyt wcześniejszych prób są wdrożone zgodnie z D-25/D-26 — [U-04](decyzje.md#u-04). Dane przyszłego algorytmu treningu pozostają w [U-05](decyzje.md#u-05).
- Czy potrzebne są oddzielne aktywne sesje, preferencje odpowiedzi albo synchronizacja wyboru kursu — [U-08](decyzje.md#u-08). Obecnie jest jedna sesja, wspólny wybór sposobu odpowiadania i lokalna preferencja kursu.
- D-41 i D-42 rozstrzygają docelowo osobne domki i portfele gwiazdek dla każdego konta i kursu. Obecny pokój, zakupy, ustawienia i cały bilans gwiazdek przypisujemy do angielskiego, bez zmiany salda i bez podwójnego przypisania po imporcie lub synchronizacji. Inne kursy zaczynają z zerowym portfelem i bez zakupów. Wdrożone dla Food. [Wymaganie rozbudowy domku i zgodność starszych zapisów](koci-domek.md).

## Stałe sesje i nagroda za ponowne ukończenie

Nowa sesja ma opcjonalny znacznik `fixedLength: true`. Nagrodzona ukończona sesja lekcji zapisuje `lessonRewarded: true`, co zapobiega ponownemu naliczeniu nagrody za tę samą sesję po odświeżeniu, imporcie lub synchronizacji. Pełne powtórzenie to nowa sesja wszystkich zadań lekcji, z próbą przy każdym zadaniu; nie wymaga bezbłędnego wyniku. Pierwsze ukończenie nadal daje 3 gwiazdki, każde nowe pełne powtórzenie 1.

Stare sesje bez znacznika stałej długości nie dostają wstecz premii za powtórzenie. Dotychczasowe ukończenia, pierwsze próby, kolejki błędów i saldo pozostają. Aktywnej starej sesji nie skracamy ani nie zmieniamy jej zapisanej listy. Nowa sesja powtórzenia może już zdobyć 1 gwiazdkę. Kopia pozostaje w wersji 1 i przyjmuje dawne pliki; nowe pola są opcjonalne, walidowane i przechodzą przez obecny zapis lokalny/chmurowy. Nie zmieniono reguł Firebase ani zasad kompakcji historii.

## Osobne domki i portfele kursów — D-41/D-42

Dotychczasowe `adventure.earned` i `adventure.purchases` zachowują dokładne wartości i reprezentują wyłącznie `angielski-hani`. To zgodny odczyt dawnego formatu, bez podwójnego kopiowania, zwrotu wydatków ani ponownego odliczania ceny. `adventure.courseHomes` jest opcjonalnym słownikiem portfeli i zakupów pozostałych kursów; nie może zawierać drugiego wpisu angielskiego. Nowy kurs ma zero gwiazdek i pusty salonik. Saldo na mapie i w domku oraz nagrody za lekcję, trening i etap odnoszą się do właściwego kursu.

Każdy domek może mieć unikalne listy `rooms` i `unlockedItems`. Zakup ma opcjonalne `room`; brak oznacza salonik. Walidacja sprawdza osobno saldo każdego kursu i zajętość miejsc w każdym pokoju, a także istnienie pokoju wskazanego przy zakupie. Dane pozostają w obecnym dokumencie postępów i kopii wersji 1, z zachowaniem limitów historii. Reguły Firebase bez zmian. Przy imporcie starszego pliku brak nowych pól jest poprawny; ukończone mapy odtwarzają odblokowania. Szczegóły są w [dokumencie domku](koci-domek.md).


## Miejsca i schowek domku — 12 listopada 2026

D-43 rozszerza katalog do 14 identyfikatorów miejsc (11 dostępnych w saloniku, 14 w kuchni). Walidacja odczytuje wspólną listę z katalogu. Nie przenosi dawnych ustawień i zachowuje dotychczasowy kształt zakupu `{ cost, slot, room? }`: `slot: null` oznacza schowek, brak `room` — salonik. Warstwa rysowania wynika z katalogu, a „Moje rzeczy” jest widokiem zakupów, bez drugiego rejestru własności. Wybór zakładki sklepu/schowka to tylko stan interfejsu.

Nowe ustawienia przechodzą przez tę samą transakcję `mutate`, walidację, IndexedDB, synchronizację i kopię wersji 1. Starsze kopie pozostają poprawne i nie zmieniają kosztów ani salda; odczyt nowego miejsca w starej wersji aplikacji nie jest obsługiwany — należy ją zaktualizować. Strukturalna walidacja nadal nie wymaga zgodności rodzaju mebla z miejscem; umożliwia to zachowanie starych aranżacji. Ograniczenia nowych miejsc i podpory stolika sprawdzane są podczas ustawiania. [Pełne zasady](koci-domek.md).


## Współrzędne domku — D-44–D-45

Zakup może mieć opcjonalne `position: { x, y }`, z całkowitymi współrzędnymi siatki 24 × 15. Przy współrzędnych `slot` jest `null`; samo `slot: null` bez `position` nadal oznacza schowek. Wielkość i orientacja wynikają z katalogu układu, a nie z zapisu użytkownika. Nie dodano rejestru własności ani nowego portfela. Brak `room` nadal oznacza salonik; nowe zakupy mają jeden pokój, a istniejące zachowują dotychczasowe przypisanie.

Stare nazwane miejsca wyświetlamy przez funkcję odczytu bez migracji danych. Pierwszy ruch zapisuje współrzędne tylko przesuwanego przedmiotu. Walidator kontroluje całkowitość współrzędnych, zmieszczenie rozmiaru w pokoju, brak jednoczesnego starego miejsca oraz duplikaty pozycji tej samej warstwy. Nowe współrzędne podlegają transakcji zapisu, lokalnemu cache, synchronizacji i kopiom wersji 1. Wymagają aktualnej aplikacji; stary klient nie obsługuje edycji siatki. Nie zmieniono identyfikatorów ukończeń, nagród, kosztów zakupów ani archiwizacji historii.


## Kocia rozgrzewka — zgodność D-46–D-47

Nie zmieniono formatu kopii, kluczy map i lekcji ani zapisanych ukończeń. Rozgrzewki mapowe nadal mają `training.kind: map` i `lesson.id` istniejącego treningu; dodatkowe `training.kind: extra` i ten sam znacznik jednorazowego rozliczenia sesji. Stare aktywne sesje zachowują pytania, indeks, odpowiedzi i nagrody, a użytkownik widzi nową nazwę. Oryginalnych tytułów w historycznych sesjach nie przepisujemy.

Kolejki `stageReviews`, statusy słówek i błędy nie są usuwane. Tematy ćwiczone osobno nadal aktualizują trzy zaliczenia i starą premię etapu, bez wyświetlania tego jako zaległości. Rozgrzewki mieszane korzystają ze wspólnej historii poznania i trudności; nie zmieniono ich w nowy algorytm odstępów. Zielone ukończenie mapy opisuje wymagane lekcje i nie oznacza wyczyszczenia danych utrwalania. Nie nadano gwiazdek ponownie za stare ukończenia ani nie dodano wymagań do pierwszej mapy Food.
