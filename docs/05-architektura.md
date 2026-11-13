# Architektura — realizacja techniczna

## D-61 — wspólne przyciski odsłuchu

`src/views/speech-controls.ts` renderuje parę zwykły odsłuch / „Wolniej” dla słówek, dialogów i ustawień. Oba przyciski przekazują ten sam tekst i język do istniejącej akcji, a wolniejszy dodatkowo `data-slow`. Nie wprowadzają drugiego pliku audio ani stanu w wynikach. Przepływność nagrań należy do `audio/config.json`; odtwarzacz jej nie ustawia.

## D-60 — publikowanie i odtwarzanie nagrań

- `scripts/audio/publish.mjs` sprawdza manifest względem aktualnych materiałów, profilu i sum klipów. Wtyczka w `vite.config.ts` publikuje tylko klipy i mały `audio/catalog.json`, także na serwerze deweloperskim. Budowanie nie uruchamia syntezy; nie kopiuje narzędzi, modelu ani pełnego manifestu generatora.
- `src/speech/text.ts` jest wspólną czystą normalizacją tekstu. `recordings.ts` sprawdza bezpieczne ścieżki indeksu. `recorded-speaker.ts` odpowiada za nagranie → syntezę → brak dźwięku, wolniejsze tempo z zachowaniem wysokości, anulowanie i izolowanie błędu jednego pliku. Nie czyta wyników konta.
- `src/speech.ts` składa odtwarzacz i dotychczasową syntezę za interfejsem `Speaker`. Start ładuje indeks z limitem 3 sekund; błąd indeksu nie blokuje aplikacji. Dostępność sprawdzana jest dla konkretnego tekstu i języka. Renderer przerywa wypowiedź przy zmianie kontekstu zadania, konta lub kursu; zwykły widok po awarii zachowuje wpisany tekst.
- `scripts/build-sw.mjs` obejmuje klipy i indeks wersjonowanym cache całego wydania. `service-worker-range.mjs` obsługuje zakresy bajtów dla zapisanych plików audio (206/416), potrzebne odtwarzaczowi offline. Dane konta nie trafiają do tej pamięci.

## D-59 — generator poza aplikacją

`scripts/audio/plan.mjs` odczytuje znaczenie materiałów przez istniejące czyste funkcje i tworzy plan pełnych haseł oraz kwestii scen. `generate.mjs` jest lokalnym punktem wejścia: sprawdza narzędzia/model i uruchamia Piper oraz ffmpeg bez powłoki. `files.mjs` zarządza pamięcią gotowych klipów, manifestem i wymianą kompletnego katalogu po udanym przetworzeniu. `ogg.mjs` kontroluje strukturę Ogg Opus i sumy stron bez zewnętrznych narzędzi. Profile i cele należą do `audio/config.json`, a wynik do `audio/generated/`. Zależność jest jednostronna: narzędzie korzysta z mechaniki materiałów, aplikacja nie importuje generatora. Sam D-59 nie zmieniał odtwarzacza; D-60 publikuje wynik generatora i odtwarza go za istniejącym interfejsem. [Obsługa i kontrakt](generowanie-audio.md).

## D-57 — odczyt postępów i ich prezentacja

`learning/progress-overview.ts` jest czystą projekcją istniejących map, sesji, archiwum i kursu; przyjmuje datę, aby testy tygodnia nie zależały od zegara. Oddziela sumy z archiwum od dostępnej listy sesji, deduplikuje dołączone strony po ID sesji i nie modyfikuje `Progress`. `views/progress.ts` renderuje kurs, mapy, tydzień, sukcesy, domek i zwinięte szczegóły. `progress.css` ogranicza styl do tego widoku. Akcje kontynuacji i map korzystają z obecnych kontrolerów, a `progress-course` wybiera kurs istniejącą usługą preferencji i pozostaje na ekranie postępów. Renderer zachowuje otwarcie szczegółów przy dołączaniu archiwum lub odświeżeniu tego samego kursu, bez zapisywania go w wynikach.

## D-56 — zakończenie planszy i oprawa dialogu

`learning/boards.ts:closeBoard` przygotowuje przejście poza całą grupę bez wymogu bezbłędności; zapisuje tylko brakujące próby i używa dotychczasowych mechanizmów błędów. Kontroler wywołuje je w tej samej mutacji co istniejące `next` i rozliczenie nagrody. `boardError` odtwarza trwały kolor z próby, bez nowego pola sesji. `views/lesson-activities.ts` zachowuje planszę, a `bankExplanationView` dodaje wyjaśnienia dopiero po wypełnieniu wszystkich luk. `sceneScriptView` umieszcza kociego rozmówcę przy każdej kwestii i wywołuje istniejącą akcję `retry` z przycisku w bieżącej linijce. Format materiałów i mechanika oceniania scen pozostają wspólne.

## D-55 — opcje słownikowe i interakcje luk

`learning/questions.ts` wzbogaca opcje słownikowe o rodzajniki z metadanych poszczególnych haseł tego kursu, bez modyfikowania materiału i zapisanej sesji. `learning/boards.ts:placeGap` przenosi lub odkłada token i wywołuje istniejące `answerOnBoard` przy nowym wstawieniu. Błędna odpowiedź pozostaje w `gapPlacements`; zaznaczanie i odkładanie nie dopisuje prób. `views/lesson-activities.ts` pokazuje stabilną kolejność i puste miejsca po tokenach; `app/gap-drag.ts` kieruje gesty z banku i z luk przez tę samą akcję kontrolera. Brak nowych pól kopii i drugiego oceniania.

## Koci rozmówcy i samodzielne historyjki — D-54

Aktualna treść czterech lekcji Food zawiera wyłącznie identyfikatory luk jednej sceny. `learning/lesson-variety.ts` nie dodaje zadań, gdy cały zestaw stanowi scenę; walidator map dopuszcza samodzielną pełną scenę krótszą niż sześć zadań, bez luzowania minimum zwykłych lekcji. `cats.ts:sceneCats` przypisuje różne kotki do ról na podstawie zapisanego ID sesji i ID sceny. `views/scene-actors.ts` łączy obsadę z obecnym rendererem obrazów; logika scen nie zna kotów ani Food. Portrety są renderowane w rozmowie i jej podsumowaniu. Osobne identyfikatory przycięcia SVG zapobiegają kolizjom z kotkami informacji zwrotnej.

## Zróżnicowanie lekcji i kontynuacja — D-50

Fabryka `legendarySession` w `learning/lesson-flow.ts` kopiuje zakres ukończonej sesji i usuwa jej odpowiedzi oraz znaczniki rozliczenia. Dawne automatyczne powroty tego samego klucza usuwa wyłącznie z nowej powtórki. Dalsze urozmaicenie zmienia oprawę, bez ponownego dobierania zakresu. Oryginalny zapis pozostaje bez zmian.

`learning/lesson-variety.ts` przygotowuje wyłącznie nowe sesje mapowe: zachowuje bazowe zadania, dodaje najwyżej dwa poznane zadania uzupełniające z wcześniejszego zakresu i limituje zestaw do 10. Odpowiada za przeplatanie oraz oznaczenie planszy par i banku propozycji. `learning/lesson-flow.ts` szuka kontekstu i następnej lekcji w tym kursie, także pomiędzy mapami. `views/lesson-activities.ts` i `views/lesson-summary-actions.ts` oddzielają interakcje ćwiczeń i trzy akcje końcowe od głównego widoku. Kontroler zapisuje wybór przez dotychczasowe `mutate`, ocenia każdą parę zwykłym `recordAnswer`, a powtórkę legendarną rozlicza istniejącą nagrodą za ponowne ukończenie. Materiały podręcznika pozostają poza tymi mechanizmami.

## Sekcje adaptacyjne i zaproszenia — D-48–D-49

`learning/section-plan.ts` wybiera i projektuje dwa stabilne przystanki sekcji 7 + 2. Warstwa domku używa jego czystej projekcji, bez zależności od nagród w `adventure.ts`. `learning/recall.ts` dobiera wcześniejsze błędy, zastępstwo z poznanego materiału i dobrowolne otwarcie/finał. `learning/retention.ts` odpowiada za wspólny licznik elementu oraz jednokrotne rozliczenie ukończonej sesji; stary mechanizm tur tematycznych pozostaje w `stage-review.ts`. Żaden z tych mechanizmów nie zna reguł konkretnego języka ani treści Food.

`controllers/learning.ts` zapisuje plan i sesję przez istniejące `mutate`; odczyt i renderer nie losują ani nie zapisują. `views/cat-invitation.ts` buduje wspólną ramkę, a `app/views.ts` umieszcza początek na pierwszej mapie i finał na ostatniej, również w ekranie modułu. `learning-labels.ts` rozdziela nazwy widoczne od historycznych tytułów. `learning/backup-validation/adaptive.ts` sprawdza nowe opcjonalne dane kopii v1. [Reguły](03-nauka.md), [zapis](06-zapis.md).

Status: mapa obecnego kodu oraz docelowe granice odpowiedzialności. To nie jest plan ponownego refaktoringu całej aplikacji.

## Stan obecny

Punkt odniesienia pochodzi z przeglądu rewizji `24cdeda` (9–10 listopada 2026 r.). Poniższa mapa jest uzupełniona o [etap 1](wdrozenie-nauki.md), [etap 2](wdrozenie-kursow.md), [etap 3](wdrozenie-zakresow.md) i [etap 4](wdrozenie-food.md). Opis zachowania użytkowego, zakres sprawdzonych testów i ograniczenia znajdują się w [spisie dokumentacji](README.md). Planowane zmiany dla innych języków są osobno w [przeglądzie gotowości](rozwoj-jezykow.md).

`src/main.ts` uruchamia aplikację i łączy jej części. Nie zawiera już szablonów ekranów, oceniania odpowiedzi ani formularzy konta.

| Zmiana | Miejsce |
| --- | --- |
| Wygląd strony startowej i ramki kontynuacji | `src/views/home.ts`, `src/home.css` |
| Wybór następnej lekcji lub modułu | `src/next-step.ts` |
| Dobór wersji lekcji do ukończenia i aktywnej sesji | `src/adventure.ts`: `lessonForProgress`, `journeyForProgress`; `src/app/selectors.ts` |
| Lista map i modułów | `src/views/catalog.ts` |
| Ekran ćwiczenia, błąd, poprawka i podsumowanie | `src/views/study.ts` |
| Ustawienia ćwiczeń i ściąga gramatyczna | `src/views/setup.ts` |
| Konto, logowanie i formularze ustawień | `src/views/account.ts`, `src/controllers/account.ts` |
| Wygląd postępów i kopii | `src/views/progress.ts`, `src/views/backup.ts` |
| Import, eksport i pobieranie starszej historii | `src/controllers/backup.ts` |
| Rozpoczęcie sesji, odpowiedzi, nagrody i odblokowania po nauce | `src/controllers/learning.ts` |
| Otwarcie domku, wybór pokoju i dekoracji, zakupy i ustawienia | `src/controllers/house.ts` |
| Zapis zmiany i odtwarzanie starszych błędów | `src/controllers/progress.ts` |
| Obsługa kliknięć, formularzy i przejść | `src/app/events.ts` |
| Rejestr ekranów | `src/app/views.ts` |
| Odświeżanie ekranu, fokus i blokada przy zapisie | `src/app/renderer.ts` |
| Rozruch, odczyt konta i blokada drugiej karty | `src/app/startup.ts` |
| Stan otwartego interfejsu | `src/app/state.ts` |
| Typy sesji i zapisanych wyników, zgodne typy ćwiczeń | `src/learning/model.ts` |
| Kurs, znaczenie i wariant językowy | `src/materials/model.ts` |
| Odczyt, walidacja, przypisania i adapter dawnego formatu materiałów | `src/materials/library.ts`, `validation.ts`, `vocabulary.ts`, `legacy.ts` |
| Pobieranie plików materiałów | `src/content.ts` |
| Treść pytania, warianty i ocenianie | `src/learning/questions.ts`, `src/answers.ts`; jawna polityka a/an słówek: `src/learning/vocabulary-answer.ts` |
| Stałe menu i krótkie etykiety mobilne | `src/views/shell.ts`, `src/theme.css` |
| Przebieg sesji i wynik pierwszej próby | `src/learning/session.ts` |
| Poznany zakres, dobór treningu i kontrola jego rozmieszczenia | `src/learning/training.ts` |
| Przygotowanie do treningu bez wcześniejszej puli | `src/views/training-preparation.ts`, `src/learning/training.ts`, `src/controllers/learning.ts` |
| Procent ukończenia i opis zaległych ćwiczeń | `src/learning/map-progress.ts` |
| Zakres kursu i język poleceń | `src/learning/scope.ts` |
| Poznane elementy i globalne zestawy | `src/learning/known-material.ts`, `src/learning/course-practice.ts` |
| Lokalny wybór kursu i powrót do rozpoczętej sesji | `src/controllers/courses.ts` |
| Kafelek kontekstu, lista kursów i globalne ćwiczenia | `src/views/courses.ts`, `src/courses.css` |
| Statystyki | `src/learning/statistics.ts` |
| Publiczna walidacja/eksport kopii i części walidatora | `src/learning/backup.ts`, `src/learning/backup-validation/` |
| Synchronizacja, konflikty i rozdzielenie kont | `src/sync.ts` |
| Firebase i planowanie synchronizacji | `src/firebase.ts`, `src/services/` |
| IndexedDB i archiwum historii | `src/storage.ts`, `src/history.ts`, `src/history-backup.ts` |
| PWA i cache offline | `src/pwa.ts`, `scripts/build-sw.mjs` |
| Materiały podręcznika | `public/content/` |

### Przepływ działania

Widok wyświetla dane i przyciski z `data-action`. Obsługa zdarzeń przekazuje działanie do odpowiedniego kontrolera. Kontroler ćwiczeń lub konta korzysta z wydzielonej logiki i usług, a zmiany wyników przechodzą przez `mutate` w kontrolerze postępów. Po zakończeniu operacji renderer odświeża ekran.

W kontrolerze nauki `confirmReplacement` wspólnie sprawdza, czy jest aktywna sesja i czy użytkownik zgadza się ją zastąpić. Wywołujące akcje zachowują własne komunikaty i kolejność przygotowania sesji. `openSession` zapisuje ją przez `replaceActive` i dopiero po udanym zapisie przełącza ekran na ćwiczenie. Wyzerowanie przejściowej informacji o nagrodzie zachowuje dotychczasowy wyjątek dla modułowego wyboru trybu. Wznowienie sesji nie wymaga potwierdzenia ani ponownego zapisu. Nie zmienia to formatu postępów, historii ani naliczania gwiazdek.

Kursy i znaczenia są materiałami, nie stanem konta. `readLibrary` otrzymuje funkcję odczytu pliku i jest wspólny dla przeglądarki, testów i kontroli budowania. Nowe znaczenia są projektowane do zgodnych `Word` i `Exercise`. Dawne identyfikatory nie są przepisywane; silnik sesji i zapis postępów nie wymagają osobnej implementacji dla każdego języka.

Widoki nie zapisują wyników. Moduły z `learning/` nie korzystają z DOM, Firebase ani IndexedDB. Kontrolery otrzymują potrzebne usługi jako argumenty; żaden nie importuje `main.ts`. `AppState` zawiera stan bieżącego interfejsu i nie jest zapisywany jako całość.

### Zgodność danych

- `src/core.ts` pozostaje wspólnym punktem eksportu istniejących funkcji i typów; zachowano dotychczasowy interfejs.
- Kopie i zapis postępów nadal mają wersję `1`; zachowano nazwy pól, identyfikatory materiałów i kont, rewizje oraz klucze IndexedDB i Firestore.
- `mutate` nadal pracuje na kopii wyników, sprawdza wersję zapisu konta i potwierdza zapis przed aktualizacją interfejsu.
- Zachowano reguły archiwizacji historii, ochronę przed konfliktem dwóch urządzeń i blokadę dwóch otwartych kart.
- Kolejność istniejących stylów pozostaje: `style.css`, `theme.css`, `adventure.css`, `home.css`. Etap 3 dokłada na końcu `courses.css`, z regułami nowych elementów kursu. Nie należy jej zmieniać przy porządkowaniu importów.

Ta reorganizacja nie wymaga migracji wyników, nowych reguł Firebase ani ponownego zakładania kont.

### Sprawdzanie zmian

Uruchom `npm.cmd test` i `npm.cmd run build`. Dla zmian w interfejsie lub obsłudze aplikacji uruchom też Playwright zgodnie z README. Istniejące testy obejmują starsze kopie, archiwizację, wznowienie sesji, wiele kont, konflikty, tryb offline i małe ekrany telefonu.

Przy kolejnej zmianie zacznij od wskazanego obszaru i jego testów. Nie przenoś logiki z powrotem do `main.ts` ani nie zmieniaj formatu postępów przy zmianie wyglądu.

## Docelowe granice odpowiedzialności

- [Mechanika](02-mechanika.md) opisuje obiekty i możliwości, a kod stosuje ich kontrakt bez wyjątków dla konkretnego podręcznika.
- [Nauka](03-nauka.md) opisuje dobór zakresu, role lekcji, utrwalanie i nagrody. Wybrany algorytm treningu powinien dać się sprawdzać niezależnie od ekranów.
- [Merytoryka](04-merytoryka.md) dostarcza konkretne treści, źródła i kryteria odpowiedzi dla kursu.
- Widoki pokazują stan i przyjmują działania użytkownika; nie zawierają własnego zapisu ani reguł francuskiego i włoskiego.
- [Zapis](06-zapis.md) chroni zgodność sesji i wyników podczas rozwoju.
- [Testy](07-testy.md) sprawdzają każdą granicę oraz najważniejsze pełne przebiegi.

Część tego podziału już istnieje po refaktoringu, ale nadal są powiązania z Food i angielskim. [Przegląd gotowości](rozwoj-jezykow.md) wskazuje konkretne miejsca. Nie opisujemy docelowego podziału jako w pełni wdrożonego.

## Znane granice obecnej implementacji

- Mapy są wczytywane niezależnie przez `readJourneys` / `loadJourneys`: wynik zawiera poprawne mapy i problemy odczytu. Błąd jednej mapy nie usuwa pozostałych; katalog pokazuje ponowienie pobrania. Przy duplikacie tożsamości izolowane są wszystkie konfliktujące definicje. Nie izoluje to błędów samych plików modułu lub rejestru kursów. [Obsługa awarii i zachowanie sesji](odpornosc-map.md).
- Nadal istnieją szczegóły Food w prezentacji: opisy rozmówek, etykieta podstawowych fiszek i odznaka pierwszej mapy. Przed publikacją kolejnego języka trzeba sprawdzić te teksty na rzeczywistym materiale.
- Statystyki i historia obejmują konto. Wybór kursu ogranicza katalogi i dobór ćwiczeń oraz wskazuje osobny domek i portfel tego kursu; każda sesja zachowuje swój zakres i pochodzenie.

## Do ustalenia

Podstawowy format kursów, wybór kursu, poznany zakres i aktualizacje Food są wdrożone — [U-01](decyzje.md#u-01), [U-03](decyzje.md#u-03), [U-04](decyzje.md#u-04). Nie planujemy automatycznego podziału istniejących etapów na nowe mapy. Dalsze rozszerzenia i harmonogram treningu pozostają w [U-05](decyzje.md#u-05).

## Domek rozdzielony na kursy

`src/house/catalog.ts` to dane dekoracji, cen, pokoi i nagród. `src/house/progress.ts` realizuje portfele, zgodny odczyt angielskiego dorobku, odblokowania i ustawienia. `src/views/house.ts` odpowiada za ekran domku, oddzielony od `adventure-view.ts` z mapami i wprowadzeniami lekcji. Kontroler domku przekazuje kurs przy zakupach i ustawianiu dekoracji. Kontroler nauki przypisuje nagrodę według modułu sesji, a kontroler zapisu rozlicza odblokowania również dla dawnych ukończeń. [Kontrakt i ograniczenia](koci-domek.md).

Po [etapie 3 refaktoringu](refaktoring-etap-3.md) `main.ts` tworzy kontroler domku ze wspólną funkcją `mutate`. `app/events.ts` przekazuje mu akcje domku przed pozostałymi kontrolerami; nierozpoznane akcje przechodzą dalej. Widok i zapis korzystają z tych samych mechanizmów co wcześniej.

## Wspólne podstawy po refaktoringu etapu 1

Po [etapie 4](refaktoring-etap-4.md) walidację kopii podzielono na kontrole sesji, domku, stanu przygody, podsumowania historii, stron archiwum i bieżących postępów. `backup.ts` zachowuje dotychczasowy interfejs i składa kontrole, a `history-backup.ts` nadal sprawdza integralność pełnej historii. Nie zmienia to formatu danych ani działania importu.

`src/learning/journey.ts` zawiera typy i stabilne klucze map bez zależności od domku, zapisu i nagród. `adventure.ts` nadal eksportuje te symbole dla zgodności istniejących wywołań. Domek korzysta bezpośrednio z tego małego modułu, usuwając cykl wykonawczy `house/progress.ts` ↔ `adventure.ts`.

Wartości gwiazdek są w `src/learning/rewards.ts`, wybór kursu według modułu w `src/learning/scope.ts`, a stały identyfikator dawnego angielskiego kursu w `src/materials/identity.ts`. Lista identyfikatorów miejsc w domku pochodzi z katalogu i służy również walidacji kopii. `src/polish-count.ts` współdzieli odmianę liczebników. [Zakres i dowody zachowania zgodności](refaktoring-etap-1.md).


### Rozmieszczanie i kolekcja domku — D-43

`house/catalog.ts` zawiera miejsca, ich warstwy i dostępność dla pokoi. `house/progress.ts` sprawdza możliwość ustawienia, zajętość i podporę stolika. `views/house-placement.ts` prezentuje położenie zakupu, panel wyboru miejsca i zapowiedź schowania zastanego przedmiotu; główny `views/house.ts` składa pokój, sklep i kolekcję. Kontroler domku odpowiada za wybór zakładki i przejście do pasującego pokoju; zapis nadal przechodzi przez `mutate`. Renderer po wyborze dekoracji przewija i przenosi fokus do panelu ustawiania. Nie dodano osobnego modelu schowka ani nowych obrazków. [Zasady i zgodność](koci-domek.md).


### Siatka i gesty domku — D-44–D-45

`house/layout.ts` definiuje siatkę, rozmiary, odczyt starych miejsc, obszary i kolizje. `house/progress.ts` zapisuje ruch, sprawdza pokój i zachowuje dorobek. `views/house-room.ts` renderuje proporcjonalny pokój, siatkę, przedmioty i strzałki. `house/drag.ts` obsługuje Pointer Events, podgląd, anulowanie i kończenie dotyku; `app/events.ts` przekazuje zatwierdzony ruch do kontrolera i transakcji `run`/`mutate`. Nie zapisujemy danych przy każdym ruchu palca. Przed zapisem sprawdzamy aktualność konta, kursu, pokoju i stanu wyników, a zmianę DOM odkładamy do zakończenia cyklu gestu. Przyciski edytora mają obsługę dotykową bez zależności od opóźnionego kliknięcia po przeciąganiu. Walidator kopii używa tej samej siatki i rozmiarów. Nie dodano biblioteki przeciągania, nowych grafik ani serwera. [Kontrakt domku](koci-domek.md).


### Kocia rozgrzewka — D-46–D-47

`views/warmup.ts` jest osobnym ekranem dodatkowych rozgrzewek z wyborem kursu, modułu i tematu. `learning/training.ts` pozostaje wspólnym doborem materiału dawnego treningu i jego rozgrzewki: na mapie filtruje poznany materiał wcześniejszych lekcji tej mapy i wcześniejszych map; dodatkowo może ograniczyć zestaw do jednego modułu. `learning-labels.ts` odpowiada za nazwę wyświetlaną. Istniejące role w JSON, tryby sesji i klucze ukończeń nie zmieniły się.

`adventure-view.ts` i `views/catalog.ts` nadają sukces według ukończenia lekcji, bez widocznych kolejek błędów. `next-step.ts` po zakończeniu dostępnych map proponuje dobrowolną rozgrzewkę, zamiast automatycznie wysyłać do kolejki. Rozpoczęta sesja zachowuje pierwszeństwo. `views/study.ts` wyświetla skończone, pozytywne podsumowanie, a `views/progress.ts` pokazuje ukończone sesje zamiast liczby rzeczy do powtórki. Wewnętrzne kolejki i stara premia etapu pozostają w `stage-review.ts`. Nie utożsamiamy braku ostrzeżeń z wyzerowaniem błędów w danych.
