# Testy — podział i zasady

## D-50 — koniec lekcji, poziom legendarny i nowe prezentacje

`lesson-variety.test.ts` sprawdza zachowanie bazowych zadań, dobór wyłącznie wcześniej poznanego zakresu, limit sesji, pary i wpisywanie, zapis banku, odrzucanie uszkodzonych grup/wyborów, przenoszenie błędu z planszy do powtórki z wpisywaniem, kontynuację pomiędzy mapami i koniec dostępnego zakresu. Sprawdza też zachowanie ukończeń, jednokrotną nagrodę 1 ★ i utworzenie pełnej legendarnej powtórki bez kopiowania ocen i nagród poprzedniej sesji.

`browser/lesson-flow.spec.ts` obejmuje brak selektora przed lekcją, wybór dowolnego hasła na planszy, wznowienie wyboru, ocenianie każdej pary osobno, trzy akcje końcowe, pełny poziom legendarny i przejście do następnej lekcji. Dialog z bankiem zachowuje wybraną propozycję po odświeżeniu i pozwala ją zmienić po błędzie. Osobny scenariusz zamyka aplikację i kończy planszę oraz lekcję offline. Wspólny pomocnik testów odpowiada przez widoczne kontrolki: wpisuje, dobiera parę albo wybiera propozycję i zatwierdza bank, zamiast zakładać jeden formularz dla całej lekcji.

Poprzednie scenariusze Food nadal kontrolują dawne i nowe wydanie lekcji, zachowanie aktywnych sesji, ukończenia, gwiazdki, domek, konta, synchronizację i kopie. Pliki treści i obu map Food nie są zmieniane przez D-50. Starsze wyniki pozostają historyczne.

Weryfikacja D-50, 12 listopada 2026: **226/226 Node w obu wariantach biblioteki**, **102/102 w pełnym przebiegu Playwright**. Po końcowej ochronie starych automatycznych powrotów i dopracowaniu widoku wybranego hasła wykonano ponownie testy fabryki i **9/9 scenariuszy mobilnych, offline, map i starych kopii** na końcowym wydaniu. Budowanie z walidacją treści, TypeScript i 206 publicznymi zasobami PWA przeszło; kontrola odnośników dokumentacji i różnic także. Obejrzano mobilne pary, dialog i trzy przyciski po lekcji. Zachowano zestaw 116 dawnych wyników walidacji. Nie testowano na fizycznym telefonie ani prawdziwym koncie Hani; synchronizacja korzysta z testowego adaptera.

Status: istniejące kontrole oraz docelowy sposób ich organizacji. Po zatwierdzeniu D-34 dodano testy wdrożenia treningów; workflow GitHub pozostaje bez zmian.

## Sekcje 7 + 2 i kocie zaproszenia — D-48–D-49

Nowy zestaw `adaptive-recall.test.ts` obejmuje stały układ dwóch powtórek, kopię v1, brak dopisywania lekcji do rozpoczętej sekcji, 9 wymaganych przystanków i nagrody, granice wcześniejszego materiału/kursu, zastępstwo przy braku błędów, trzy samodzielne zaliczenia, poprawkę, reset, jednokrotne rozliczenie i synchronizację ze starymi kolejkami. Sprawdza też początek z poprzedniego modułu, finał po wszystkich mapach i odrzucanie uszkodzonych danych. Oryginalna suma kontrolna materiałów Food pozostaje: w porównaniu wyłączamy wyłącznie zatwierdzoną flagę planu sekcji, z osobnym sprawdzeniem jej położenia.

`browser/adaptive-recall.spec.ts` sprawdza 320 px, brak nachodzenia kota na tekst, 9 kafelków, odpowiedź z wpisywaniem, wznowienie, wspólny licznik i nagrodę, tę samą kolejność po kopii na drugim urządzeniu oraz zimny start powtórki offline. Dodatkowo uruchamia zaproszenie początku pierwszego modułu i dobrowolny finał z nagrodą, bez zmiany wcześniejszych ukończeń. Istniejące scenariusze kont, konfliktów, synchronizacji, domku i dawnych kopii pozostają. Testy wyboru odpowiedzi czekają na pojawienie się przycisków; błędny wariant wybierają według oceny odpowiedzi, również z rodzajnikiem a/an, zamiast zakładać, że pierwszy przycisk oznacza błąd.

Weryfikacja 12 listopada 2026: **219/219 Node w obu wariantach biblioteki**. Pełny końcowy przebieg przeglądarkowy: **98/98**; następnie dodano scenariusz otwarcia/finału i wykonano cały plik nowych scenariuszy: **3/3** (łącznie 99 różnych sprawdzonych scenariuszy). Budowanie z walidacją treści, TypeScript i 206 publicznymi zasobami PWA przeszło. Obejrzano mobilną mapę i poprawioną ramkę zaproszenia. Zachowano dotychczasowy zestaw 116 wyników walidacji kopii. Nie testowano na fizycznym telefonie ani prawdziwym koncie Hani; konta i sieć są sprawdzane przy użyciu testowego adaptera.

## Bieżący punkt odniesienia

Aktualnym punktem odniesienia jest D-50 powyżej: **226 testów Node w obu bibliotekach i 102 scenariusze Playwright**, z dodatkową kontrolą końcowych poprawek. Wyniki starszych etapów poniżej są historią. [Zasady nauki](03-nauka.md).

## Stan obecny

**Dobór danych po etapie 2 refaktoringu:** mechanika korzysta z danych syntetycznych, regresje Food wskazują go po ID, a kompletność i rozbudowa całego katalogu mają osobne kontrole. Nie wymagamy jednego modułu lub kursu w aplikacji. [Instrukcja danych testowych](../tests/README.md) i [zakres etapu 2](refaktoring-etap-2.md). Wcześniejsze wyniki poniżej są historią uruchomień, a nie wymaganą liczbą testów.

Są testy Node dla logiki, materiałów, historii i synchronizacji oraz scenariusze Playwright dla aplikacji i PWA. Część testów jest ogólna, część świadomie sprawdza konkretne ustalenia Food. Historyczne nazwy `stage1/2/3.test.ts` pozostają; kontrolę tekstu widoków zastąpiono sprawdzaniem wyrenderowanego interfejsu. Statyczne kontrole granic importów i workflow nadal mają uzasadniony zakres.

W przeglądzie 9–10 listopada 2026 r. wykonano 84 testy Node i kontrolę materiałów z powodzeniem. Zebrano 51 testów przeglądarkowych, bez ponownego ich wykonania w zadaniu dokumentacyjnym. Nie są to wyniki nowego uruchomienia przy obecnym porządkowaniu dokumentacji.

Po rozpoczęciu implementacji D-34 uruchomiono także pełny zestaw przeglądarkowy gotowej aplikacji: **57/57**, w tym dodatkowy trening offline i synchronizację jego nagrody. Nowe kontrole Node są w `tests/training.test.ts`, a przebiegi interfejsu w `tests/browser/training.spec.ts` i `tests/browser/pwa.spec.ts`. [Raport wdrożenia](wdrozenie-nauki.md) opisuje zakres i ograniczenia; historyczna macierz pozostaje punktem odniesienia sprzed zmian.

Obecne workflow GitHub uruchamiają testy Node i budowanie z walidacją treści, ale nie Playwright. Brak błędu publikacji nie potwierdza kompletnej recenzji językowej ani działania na wszystkich prawdziwych telefonach.

Szczegółowa macierz pokrycia, ograniczenia i dowody: [testy — punkt odniesienia](stan-obecny/testy.md).

## Weryfikacja etapu 2

Po uporządkowaniu kursów: **114/114 testów Node i 61/61 testów Playwright** gotowej aplikacji. `tests/courses.test.ts` obejmuje model i kontrolę materiałów; `tests/fixtures/course-materials.ts` zawiera wspólne syntetyczne dane EN/FR/IT, a `tests/browser/courses.spec.ts` cztery przebiegi mobilne. Dane testowe nie są dodawane do produkcyjnego katalogu. Test porównuje stare i nowe odczytanie wszystkich słów i skompilowanych zadań Food oraz ich kluczy.

Budowanie korzysta bezpośrednio ze wspólnego `readLibrary`, a nie z importu danych przez plik testowy. Walidacja kursów nie zastępuje recenzji wariantów językowych ani podręcznika. [Raport etapu 2](wdrozenie-kursow.md).

## Weryfikacja etapu 3

**130/130 testów Node i 68/68 testów Playwright** gotowej aplikacji. `tests/course-practice.test.ts` sprawdza poznanie, archiwum, ograniczenie opcji, zgodność kopii, odrębność kursów i preferencje kont. `tests/browser/course-practice.spec.ts` obejmuje sześć scenariuszy mobilnych, a `tests/browser/pwa.spec.ts` dodatkowo globalne ćwiczenie offline i wysłanie jego wyniku po połączeniu.

Sprawdzamy też zachowanie zaliczonych modułowych fiszek Food, brak nowych gwiazdek za globalne tryby, odmowę zastąpienia aktywnej sesji oraz utrzymanie poznania po zastąpieniu starszej niedokończonej sesji. Globalna historia nie jest zaliczana do wyników jednego przypadkowego modułu. [Raport etapu 3](wdrozenie-zakresow.md).

## Weryfikacja etapu 4

**137/137 testów Node i 72/72 testów Playwright** gotowej aplikacji w Chrome, z testami PWA. `npm run build` przechodzi walidację treści, TypeScript, budowanie i przygotowanie zasobów offline. `tests/food-audit.test.ts` chroni oryginalne treści i mapę, odrębny wybór wersji według ukończeń, stare i nowe aktywne sesje, kopie, brak ponownych gwiazdek oraz trening drugiej mapy. `tests/browser/food-audit.spec.ts` obejmuje dawne ukończenie, rozpoczętą sesję, nową mapę z nagrodą i odznaką oraz zimny start nowej mapy offline. Sprawdzono wygląd zrzutów telefonu i brak przewijania poziomego przy 320 i 390 px.

Testy kont używają lokalnego modelu Firebase; nie ingerują w prawdziwe wyniki. Przegląd zdjęć i objaśnień opisuje [raport Food](wdrozenie-food.md); testy struktury nie zastępują recenzji pedagogicznej ani próby na fizycznym telefonie Hani.

## Weryfikacja przygotowania treningu i odzyskiwania map

Po poprawkach po etapie 4: **144/144 testów Node i 76/76 testów Playwright** gotowej aplikacji w Chrome, z dotychczasowymi testami PWA i synchronizacji. `npm run build` przechodzi walidację materiałów, TypeScript i budowanie wydania offline.

`tests/map-recovery.test.ts` obejmuje błąd pobrania, JSON i schematu pojedynczej mapy, duplikaty tożsamości, izolację kursów, odzyskanie katalogu, przygotowanie poznanej puli, nagrody bez duplikatów oraz odroczenie migracji i premii przy brakujących mapach. `tests/browser/map-recovery.spec.ts` sprawdza na telefonie przejście od pustej puli przez lekcję do treningu, brak drugiej nagrody, dostępność poprawnej mapy podczas awarii innej i wznowienie zachowanej sesji po naprawie pliku. Sprawdzono zrzut ekranu przygotowania i brak przewijania poziomego przy 320 px. Kontrole nie zmieniają prawdziwego konta Hani. [Zakres i ograniczenia](odpornosc-map.md).

## Weryfikacja formy odpowiedzi gramatycznej — D-35

Po dodaniu wskazówki do luk: **146/146 testów Node i 79/79 testów Playwright** gotowej aplikacji w Chrome oraz poprawne budowanie. `tests/review-input.test.ts` sprawdza zachowanie krótkiego klucza odpowiedzi i luki w obu powtórkach oraz brak wskazówki przy fiszkach, wyborze i zadaniu bez luki. `tests/browser/grammar-gaps.spec.ts` sprawdza zwykłą gramatykę, powtórkę ogólną i etapową: błędne słowo, porównanie z poprawnym fragmentem, ponowną próbę, wznowienie i poprawną krótką odpowiedź, bez zmiany salda gwiazdek. Nie zmieniono produkcyjnych pytań, ich kluczy ani rewizji. To kontrola formy i przebiegu, nie nowa recenzja językowa całego podręcznika.

## Docelowy podział odpowiedzialności

| Grupa | Co ma sprawdzać | Czego nie ma zastępować |
| --- | --- | --- |
| Mechanika | Obiekty, odwołania, typy pytań, stosowanie kryteriów odpowiedzi i przebieg sesji | Poprawności językowej konkretnego tłumaczenia |
| Nauka | Pokrycie zakresu przez mapy, role lekcji, dobór treningu, błędy, utrwalenie i nagrody | Samej walidacji JSON |
| Materiały — wspólny kontrakt | Format i odwołania każdego kursu, modułu, mapy, zadania i zasobu | Recenzji podręcznika |
| Merytoryka i kursy | Zatwierdzone przykłady odpowiedzi, źródła, warianty i regresje FR/IT/EN | Ogólnego silnika sesji ani recenzji wszystkich treści przez jeden test |
| Zapis i zgodność | Konta, konflikty, offline, starsze kopie, historia i ewentualne migracje | Samego testu kliknięcia przycisku |
| Interfejs i pełne przebiegi | Nawigacja, telefon, dostępność, wznowienie i połączenie części aplikacji | Każdego przypadku algorytmu utrwalania w przeglądarce |

To podział logiczny; docelowe przeniesienie plików testowych lub zmiana CI wymagają oddzielnej zmiany. Nie trzeba tworzyć osobnego testu dla każdego słówka ani kopii całej baterii mechaniki dla każdego języka.

## Ważne przyszłe scenariusze

- Zachowanie mapy Food i ukończonych części 1–4 przy poprawkach sekcji 5–7; nowa mapa uzupełnia ustalone braki bez samoczynnego resetu istniejących postępów (D-22).
- Przy poprawkach Food również zaliczone pojedyncze lekcje wewnątrz sekcji 5–7 pozostają ukończone, a zdobyte gwiazdki zostają na koncie. Poprawiane są tylko nieukończone lekcje; dodanie brakującego materiału na nowej mapie nie otwiera ponownie zaliczonych lekcji (D-24).
- Ukończone lekcje dają 100% postępu także przy zaległych błędach. Zaległości pokazuje osobna pomarańczowa liczba elementów z wynikiem poniżej 3/3; po zaliczeniu całej nauki i wyzerowaniu kolejki jest zielony stan z gratulacjami (D-23). Pusta kolejka przed ukończeniem lekcji nie daje fałszywego 100%.
- Wynik jednego konta nie zmienia wyników innego; na jednym koncie zaliczenie elementu w jednym kursie nie zalicza go w drugim (D-14, D-15).
- Wszystkie wymagane elementy modułu są wskazane w jego 1–3 mapach; trening nie zastępuje brakującego wprowadzenia nowej treści.
- Mapa wymaga ukończenia zwykłych lekcji i treningów na mapie: nieukończony trening na mapie wyklucza jej ukończenie i 100% postępu lekcji. Dodatkowe treningi nie powiększają wymaganego zakresu, a zaległa powtórka błędów nie blokuje ukończenia ani 100% po wszystkich wymaganych lekcjach (D-32). Warunki premii za utrwalenie sprawdzamy osobno.
- Pierwsze ukończenie danego treningu na mapie przyznaje 3 gwiazdki w kontekście konta i kursu; ponowne przetworzenie tej samej sesji, także po ponownym uruchomieniu lub synchronizacji, nie daje ich drugi raz. Nowa pełna sesja powtórzenia daje 1 gwiazdkę (D-40), z zachowaniem pierwotnego ukończenia. Samo rozpoczęcie lub przerwanie treningu nie daje nagrody. Scenariusz nie zakłada jeszcze zasad nagradzania dodatkowych treningów na żądanie.
- Zwykła lekcja ma 6–10 zadań początkowych, najczęściej 8 (D-18). Powtórka błędów ma 1–10 zadań z dostępnej kolejki, bez dopełniania innymi pytaniami i z podziałem większej kolejki na sesje (D-19). Trening ma 6–10 zadań, najczęściej 8, lub mniej przy małej puli wcześniejszego materiału — bez przyszłych treści i sztucznego powielania dla minimum (D-20). Poprawki i powroty błędów nie są doliczane do wielkości początkowego zestawu. Jedna oceniana odpowiedź to jedno zadanie bez dodatkowych wag; w standardowym zakresie liczba jest bliższa 6 dla dłuższych zadań, a 8–10 dla krótkich (D-21).
- Trening wybiera wcześniejszy poznany materiał, w tym elementy wcześniej bezbłędne, i nie wprowadza przyszłych treści ani obcego kursu.
- Mapa rozpoczyna się od nowego materiału; pierwszy trening pojawia się po 2–3 lekcjach nowego materiału, a kolejne co 2–3 lekcje nowego materiału, zależnie od długości mapy i dostępnego materiału (D-30). Warunkiem jest poznany materiał z wcześniejszych map; bez takiej puli nie tworzymy pustego treningu. Walidacja konkretnej mapy uwzględnia ten rytm i dostępność materiału; same treningi oraz powtórki błędów nie są liczone jako lekcje nowego materiału.
- Zadanie gramatyczne pokazuje wyjaśnienie po odpowiedzi poprawnej i błędnej (D-31). Testy sprawdzają obecność i właściwe wyświetlenie uzasadnienia; jego językowa poprawność i dopasowanie do konkretnego zdania wymagają również recenzji merytorycznej.
- Trening łączy dostępne słownictwo i gramatykę bez sztywnego podziału proporcji; przy dostępności tylko jednego rodzaju działa z tym rodzajem, bez dodawania niepoznanych treści do brakującej kategorii (D-28).
- Dobór treningu daje pierwszeństwo trudnym i dawno niećwiczonym elementom, a jednocześnie zapewnia regularny powrót bezbłędnych (D-29). Konkretne oczekiwania dotyczące odstępów, parametrów i liczby wystąpień będą ustalone po odłożonym na później wyborze algorytmu; nie testujemy teraz domniemanego SM-2 ani FSRS.
- Błąd z treningu trafia do powtórki mapy, na której odbywał się trening, z zachowaniem tożsamości źródłowego materiału.
- Globalne fiszki, quiz i gramatyka obejmują poznany zakres kursu, a nie cały przyszły podręcznik lub wszystkie języki.
- Pierwsza próba, także błędna i w niedokończonej lekcji, oznacza poznanie powiązanego elementu dla danego konta i kursu. Samo obejrzenie wprowadzenia nie oznacza poznania; stan ten nie nadaje automatycznie poprawności ani utrwalenia (D-25).
- Poznany zakres jest odtwarzany także z wcześniejszych zapisanych prób, w tym archiwalnych, bez zmiany ocen, ukończeń ani salda zdobytych gwiazdek i bez wymuszania ponownej próby poznania (D-26).
- Wybrany harmonogram ma testy odstępów, błędów, powtórki na żądanie oraz sytuacji bez dostępnego materiału.
- Dodatkowy trening można uruchomić bez oczekiwania na termin, także kilka razy tego samego dnia; nie omija to ograniczeń poznanego zakresu i kursu ani zasad wielkości treningu (D-27, D-20). Sposób aktualizacji harmonogramu po dodatkowym treningu będzie sprawdzany po jego ustaleniu.
- Nowy podział map zachowuje stare postępy i kopie zgodnie z zatwierdzonym sposobem przejścia.

Te scenariusze **nie są deklaracją istniejącego pokrycia**. Szczegóły oczekiwań zależą od [otwartych decyzji](decyzje.md).

## Zasady dodawania i uruchamiania

1. Nowe zachowanie otrzymuje test efektu i istotnego przypadku brzegowego. Test nie powinien wyłącznie powtarzać wewnętrznej struktury funkcji.
2. Powracający błąd dostaje test regresji. Oczekiwania zmieniamy po ustaleniu, czy zmieniła się zasada, a nie tylko dlatego, że test przestał przechodzić.
3. Nowe materiały korzystają ze wspólnych kontroli. Regresje Food pozostają sprawdzane osobno, zamiast ograniczać cały katalog do jednego modułu.
4. Zmiana zapisu wymaga sprawdzenia zgodności starszych danych, kont i aktywnej sesji; rzeczywista migracja wymaga własnych przypadków.
5. Drobna poprawka tekstu lub odstępu zwykle nie wymaga nowego testu. Zakres kontroli powinien odpowiadać ryzyku.
6. W trakcie pracy uruchamiamy kontrole obszaru i zależności. Przed publikacją zmian aplikacji wykonujemy uzgodniony pełny zestaw i istotne scenariusze przeglądarkowe.
7. Dla samej zmiany dokumentacyjnej sprawdzamy zgodność opisów, odnośniki i zakres zmienionych plików; nie przedstawiamy dawnych uruchomień jako nowych.

Przegląd dokumentacji wspiera [skill projektu](../.agents/skills/male-kroki-dokumentacja/SKILL.md), zgodnie z [instrukcją utrzymania](utrzymanie-dokumentacji.md). `node scripts/check-docs.mjs` sprawdza lokalne odnośniki plikowe i prostą strukturę tego skilla; `node scripts/check-docs.mjs --self-test` sprawdza wykrywanie brakujących plików, pomijanie przykładów kodu oraz poprawne i niepoprawne opisy skilla. Nie są to testy działania aplikacji ani recenzja językowa. Nie dodano nowego kroku do CI; aktualne workflow pozostają bez zmian.

## Regresje swobodnej nauki i informacji zwrotnej

Weryfikacja 10 listopada 2026 po D-36–D-40: **151/151 testów Node i 82/82 testy Playwright** gotowej aplikacji w Chrome. `npm run build` przeszedł walidację materiałów, TypeScript, budowanie i przygotowanie PWA. Sprawdzono również odnośniki dokumentacji. Przejrzano zrzuty mobilnego menu, różowej i zielonej odpowiedzi oraz pomarańczowej wskazówki. Testy obejmują ekrany 320–430 px, offline, kopie i synchronizację przez testowy adapter Firebase; nie wykonywano prób na prawdziwym koncie Hani ani fizycznym telefonie.

- `tests/supportive-learning.test.ts`: a/an obecne, pominięte, błędne i zbędne; brak przenoszenia tolerancji na gramatykę/FR; stały zestaw mimo błędów; dowolna lekcja; 3 gwiazdki za pierwszy raz i 1 za nowe pełne powtórzenie, bez podwójnej nagrody po odczycie kopii.
- `tests/browser/supportive-learning.spec.ts`: mobilne menu z Mapami, kopia w Koncie gościa, zielony sukces z pomarańczową uwagą i różowy błąd bez przekreślenia; pominięcie dobrowolnej poprawki kończy sesję i zachowuje błąd.
- Dotychczasowe testy mapy, treningów, kont, offline i historii nadal chronią ukończenia, saldo oraz wymianę danych. Zmiana menu wymaga przejścia do kopii przez Konto, nie usunięcia scenariuszy eksportu/importu.

## Pokoje i portfele kursów — D-41/D-42

Weryfikacja 10 listopada 2026: **158/158 testów Node i 86/86 testów Playwright** gotowej aplikacji w Chrome. `npm run build` przeszedł walidację treści, TypeScript, budowanie oraz przygotowanie 206 plików PWA offline. Sprawdzono lokalne odnośniki dokumentacji i zrzuty saloniku/kuchni na telefonie. Dziewięć nowych grafik SVG zajmuje razem 4789 bajtów. To próby na emulowanych ekranach i adapterze synchronizacji, bez zmiany danych prawdziwego konta Hani ani testu na fizycznym telefonie.

- `tests/house.test.ts`: zgodny odczyt starego angielskiego portfela, osobne zakupy i nagrody kursów, obie kolejności ukończenia map, zaległe błędy, brak jednej mapy, trwałe odblokowania, zakupy tylko po odblokowaniu i przenoszenie między pokojami bez kopiowania. Walidacja kopii odrzuca ujemne saldo, drugi portfel angielskiego i nieprawidłowe pokoje/miejsca; sprawdzamy też kompletność lekkich SVG.
- `tests/sync.test.ts`: portfele i zakupy kilku kursów po błędzie sieci, ponownym uruchomieniu i synchronizacji na drugie urządzenie; inne konto ma osobny zapis. To testowy adapter, bez zmiany prawdziwych kont.
- `tests/browser/house.spec.ts`: telefon, salonik i kuchnia, częściowe i pełne Food, zakupy, przenoszenie, eksport/import, wybór kursu i zimny start offline. Ostatnia lekcja Food ma odblokować pokój z komunikatem, bez dodatkowych gwiazdek za sam pokój.

## Refaktoring zależności i wspólnych stałych — etap 1

`tests/refactor-boundaries.test.ts` chroni brak wykonawczej zależności domku od modułu map, zgodne eksporty i klucze map, formy polskich liczebników oraz walidację starej kopii i miejsc w domku. Istniejące 158 testów zachowano bez zmieniania ich oczekiwań; dodano cztery przypadki zgodności. Porównanie kontrolne przed/po dało identyczny zapis i decyzje walidacji 13 kopii oraz identyczny HTML sześciu wariantów ekranów. [Szczegółowy zakres](refaktoring-etap-1.md).

W `tests/browser/house.spec.ts` scenariusz ostatniej lekcji czeka na pokazanie pytania przed pętlą odpowiedzi, a scenariusz zimnego startu czeka na zapis ustawienia przed zamknięciem strony. Nie zastępujemy tych oczekiwań stałym opóźnieniem i nie zmniejszamy wymagań dotyczących wyniku ani trwałości postępów.

Weryfikacja 11 listopada 2026: **162/162 testy Node i 86/86 testów Playwright** gotowej aplikacji w Chrome. Budowanie z walidacją materiałów, TypeScript i PWA oraz kontrola odnośników dokumentacji przeszły. Pierwszy pełny przebieg przeglądarkowy (84/86) wskazał opisane wyżej brakujące oczekiwania; pełny przebieg po ich doprecyzowaniu przeszedł bez błędów. Nie testowano na fizycznym telefonie ani prawdziwym koncie Hani.

## Testy odporne na nowe moduły i kursy — etap 2 refaktoringu

166/166 testów Node przeszło na zwykłej i wirtualnie rozszerzonej bibliotece. Pełny przebieg Playwright na testowym wydaniu z dodatkowym modułem EN, kursami FR/IT i Food poza pierwszą pozycją dał 88/88 po objęciu dodatkowych kontekstów przeglądarki jawnym scenariuszem Food. Testy pełnej biblioteki pozostają niezależne od tej fixture. [Zakres, wyniki i ograniczenia](refaktoring-etap-2.md); [instrukcja danych testowych](../tests/README.md).

Końcowy przebieg na standardowym wydaniu również dał **88/88**. Budowanie, kontrola dokumentacji i różnic przeszły; wersja PWA jest identyczna z wersją sprzed tego etapu. Nie zmieniono kodu aplikacji ani jej produkcyjnych materiałów.

## Wydzielenie kontrolera domku — etap 3 refaktoringu

Dodano cztery testy w `tests/house-controller.test.ts`: brak wpływu na aktywną lekcję przy nawigacji, trwałe zakupy i ustawienia w osobnych kursach, brak zmiany postępów i komunikatu sukcesu po błędzie zapisu oraz przekazywanie nieswoich akcji między kontrolerami. Dotychczasowe oczekiwania testów Food i domku pozostają zachowane. Porównanie sekwencji 12 akcji przed/po dało identyczne postępy, stan ekranu i komunikaty. [Zakres etapu](refaktoring-etap-3.md).

Weryfikacja 11 listopada 2026: **170/170 testów Node i 88/88 testów Playwright** gotowej aplikacji w Chrome. Budowanie z walidacją treści, TypeScript i PWA, kontrola odnośników dokumentacji oraz kontrola różnic przeszły. Nie zmieniono dotychczasowych oczekiwań przeglądarkowych ani formatu postępów; nie testowano na fizycznym telefonie i prawdziwych danych Hani.

## Podział walidacji kopii — etap 4 refaktoringu

`tests/backup-validation.test.ts` sprawdza publiczny kontrakt względem 116 wyników zapisanych przed podziałem: 21 poprawnych i 95 odrzuconych kopii. Porównuje dokładną zawartość zaakceptowanych danych i treść błędów, a także brak mutacji źródła, niezależność kopii i zachowanie dodatkowych pól. Osobny przypadek chroni rozdzielenie walidacji struktury od kontroli integralności pełnej historii. Dotychczasowe testy kopii, historii, domku, kont, synchronizacji i interfejsu zachowano bez zmiany oczekiwań. [Zakres i dowody zgodności](refaktoring-etap-4.md).

Weryfikacja 11 listopada 2026: **173/173 testy Node** na zwykłej i wirtualnie rozszerzonej bibliotece oraz **88/88 testów Playwright** gotowej aplikacji w Chrome. Budowanie z walidacją materiałów, TypeScript i PWA, kontrola dokumentacji i różnic przeszły. Wyniki 116 przypadków przed/po są identyczne. Nie testowano na fizycznym telefonie ani prawdziwym koncie Hani.


## Testy zachowania i wspólne potwierdzenia — uzupełnienie audytu

W `stage1/2/3.test.ts` usunięto sprawdzanie treści widoków, CSS i konfiguracji Playwright przez wyszukiwanie fragmentów źródeł. Ochrona pozostała: `browser/home.spec.ts` sprawdza pełne hasło przy 320 i 390 px; `browser/ui-contracts.spec.ts` kontroluje widoczną etykietę trybu mieszanego, nazwę i ustawienia pola, dekoracyjną ikonę, źródło zadania i wynik po poprawce. Sprawdza też faktyczne pobranie lokalnej ikony i manifestu oraz systemową czcionkę bez żądań do Google Fonts. `runner-config.test.ts` sprawdza wynik importowanej konfiguracji dla uruchomienia lokalnego, zbudowanej aplikacji i zewnętrznego adresu oraz wskazania Chrome. Zachowano dotychczasową kontrolę źródeł reguł gramatycznych i celowe statyczne kontrole workflow i granic importów.

`learning-controller.test.ts` obejmuje 20 kombinacji: pięć wejść (tryb modułu, tryb kursu, lekcja, trening, powtórka etapu), każde ze zgodą, odmową, bez aktywnej sesji i z błędem zapisu. Potwierdza dokładne komunikaty, brak zmiany postępów po odmowie i błędzie, pojedynczy zapis po zgodzie, zachowanie poznania, historii i portfela oraz dotychczasowe reguły przejściowych informacji o nagrodzie. Wspólna obsługa nie zmienia kolejności tworzenia sesji w poszczególnych akcjach.

Weryfikacja 11 listopada 2026: **192/192 Node** w obu wariantach biblioteki, **90/90 Playwright** gotowej aplikacji w Chrome, budowanie i kontrola dokumentacji. Pełne scenariusze obejmują kopie, konta, drugi zapis/urządzenie, mobilny układ i PWA offline. Nie wykonywano prób na fizycznym telefonie ani rzeczywistym koncie Hani; konta i synchronizacja korzystają z adaptera testowego.


## Miejsca, warstwy i „Moje rzeczy” — D-43

`tests/house-layers.test.ts` sprawdza jednoczesne rozstawienie wszystkich 11 dekoracji saloniku Food, warstwy i zgodność nowych miejsc z pokojem, podporę stolika i schowanie drobiazgów przy jego przeniesieniu, zachowanie starych nietypowych ustawień, odrzucenie duplikatów miejsc i zachowanie kosztów, salda, aktywnej sesji oraz drugiego kursu. Nowe ustawienia przechodzą przez eksport/import wersji 1. Historyczny zestaw 116 wyników walidatora pozostał bez zmian i nadal przechodzi; nie regenerowano odniesienia.

Dwa dodatkowe przypadki kontrolera sprawdzają zakładki bez zmiany wyników, prawdziwy komunikat po nieudanym ustawieniu i informację o schowaniu przedmiotu. Nowy przypadek `sync.test.ts` wysyła nowe miejsca i schowek po offline na drugi zapis urządzenia, z zachowaniem salda i izolacji kont. Testy dotychczasowej zamiany miejsc świadomie zmieniono na oczekiwanie schowania zastanego przedmiotu, zgodnie z D-43.

`browser/house.spec.ts` sprawdza 14 zakupów Food w kolekcji, stary wystrój, 11 jednocześnie wystawionych przedmiotów saloniku, opisy położenia, zapowiedź zastąpienia, schowanie i ponowne ustawienie, przejście do kuchni, warstwy stolika i drobiazgu, zachowanie ukończeń i salda po kopii. Telefon 320/390 px nie przewija się poziomo, a przyciski wyboru miejsc mają co najmniej 44 px. Scenariusz zimnego startu offline ustawia toster na nowym blacie i sprawdza odtworzenie tego miejsca. Obejrzano zrzuty kolekcji, saloniku i kuchni na telefonie.

Weryfikacja 12 listopada 2026: **199/199 testów Node** w obu wariantach biblioteki oraz **91/91 Playwright** gotowego wydania w Chrome. Wcześniejszy celowany przebieg domku dał 5/5. Budowanie, walidacja materiałów i TypeScript przeszły. Nadal jest 206 publicznych plików offline: nie dodano obrazków ani zależności. Kontrola dokumentacji i różnic przeszła. Nie wykonywano prób na fizycznym telefonie ani na prawdziwym koncie Hani; synchronizacja korzysta z testowego adaptera.


## Siatka, stały rozmiar i pokoje — D-44–D-45

`house-grid.test.ts` sprawdza stały rozmiar niezależny od starego miejsca, niemutujący odczyt, współrzędne, granice i obszary, kolizje tej samej warstwy i nakładanie różnych warstw, kopię wersji 1, saldo, aktywną sesję oraz przypisanie do pokoju. Obejmuje schowanie drobiazgów po przesunięciu lub schowaniu stolika i brak schowania przy ruchu do tej samej pozycji. Walidator odrzuca nieprawidłowe współrzędne, duplikaty i wyjście całego przedmiotu poza pokój. Zestaw 116 historycznych wyników walidacji nie był regenerowany.

`house-controller.test.ts` dodatkowo sprawdza odmowę ruchu poza edycją, z obcego konta, kursu lub pokoju, bez zapisu po odmowie, oraz zachowanie poprzedniej pozycji i komunikatu po błędzie zapisu. `sync.test.ts` wysyła współrzędne siatki po offline na drugie urządzenie, bez zmiany salda i bez przekazywania ich innemu kontu.

`browser/house-grid.spec.ts` obejmuje: rzeczywisty ruch myszy, proporcje 320/390 px, niedozwolone upuszczenie i odczekanie zakończenia obsługi, strzałki, kopię z aktywną lekcją, ponowne wczytanie, rzeczywiste zdarzenia dotykowe i anulowanie gestu, schowek, powrót do podglądu i nawigacji oraz zimny start offline z nowymi współrzędnymi. Gesty dotykowe są wysyłane do Chrome przez CDP; nie zastępuje to próby na fizycznym telefonie. Regresje domku świadomie zmieniono tak, by nie wymagały przenoszenia miseczek i owoców między pokojami; stare zakupy w innym pokoju nadal mają osobną kontrolę odczytu.


Weryfikacja siatki 12 listopada 2026: **208/208 testów Node** w obu wariantach biblioteki i **94/94 Playwright** na końcowym wydaniu w Chrome. Zestaw 116 starych wyników walidacji nadal przechodzi bez zmiany odniesienia. Budowanie z kontrolą materiałów, TypeScript i 206 zasobami PWA oraz kontrola dokumentacji i różnic przeszły. Obejrzano zrzut mobilnego edytora; nie wykonywano prób na fizycznym telefonie ani prawdziwym koncie Hani. Wczesny przebieg ujawnił brak oczekiwania w nowym teście na zakończenie obsługi błędnego upuszczenia przed pomiarem po obrocie/zmianie szerokości; test czeka teraz na obsłużenie odmowy i wyczyszczenie podglądu, bez stałego opóźnienia. Test gestu sprawdza również kolejne dotknięcia przycisków edytora i wyjście do nauki.


## Kocia rozgrzewka i trwały sukces mapy — D-46–D-47

Wymagania zapisano przed kodem, następnie zastąpiono treningi rozgrzewkami z zachowaniem roli `training` i identyfikatorów lekcji. `warmup.test.ts` sprawdza pierwszą mapę bez poprzednich map, dobór wyłącznie poznanych wcześniejszych lekcji, pominięcie przyszłych zadań, pierwszeństwo błędów, odrębność kursów i zakres jednego modułu, wymagane ukończenie rozgrzewki mapowej, zgodność kopii i niemutujący odczyt. Wyrenderowana ukończona mapa z błędami i niedoczytanym archiwum ma sukces, bez ostrzeżeń o zaległościach. Dotychczasowe testy nagród i braku resetu ukończeń pozostają.

`browser/warmup.spec.ts` obejmuje dwie ukończone mapy Food z błędami, 100% i gratulacje, brak kafelków i liczników zaległych powtórek, skończoną dodatkową sesję mimo błędów, zachowanie ukończeń, gwiazdkę za nową sesję, wybór zakresu i mobilny układ 320 px. Osobny przypadek wznawia dawną aktywną sesję treningu: pokazuje nową nazwę i daje 1 ★ za pełne powtórzenie, bez ponownego otwierania zaliczonej lekcji. Obejrzano mobilne podglądy mapy i ekranu rozgrzewek.

Regresje `stage-review`, `firebase` i `pwa` nadal sprawdzają trzy zaliczenia, starą premię 3 ★, błąd, poprawkę, wznowienie, konta, drugie urządzenie i offline; wejście jest teraz przez osobną rozgrzewkę, a nie licznik na mapie. Liczbę zaliczeń sprawdzamy w kopii lub testowym zapisie chmury, nie jako obowiązek w interfejsie. `map-recovery` świadomie dopuszcza przygotowanie materiału z bieżącej mapy przy niedostępnej poprzedniej, zgodnie z nowym zakresem D-47. Nie pominięto sprawdzania odzyskania uszkodzonych map.

Weryfikacja 12 listopada 2026: **212/212 Node** w obu wariantach biblioteki oraz **96/96 Playwright**. Budowanie z walidacją treści, TypeScript i 206 publicznymi zasobami PWA oraz kontrola dokumentacji i różnic przeszły. Pierwszy przebieg 93/94 wskazał oczekiwanie starej zasady przygotowania wyłącznie z poprzedniej mapy; dostosowano ten scenariusz do D-47 i dodano dwa scenariusze ochrony ukończonych map. Nie wykonywano prób na prawdziwym koncie ani fizycznym telefonie Hani; synchronizacja korzysta z testowego adaptera.
