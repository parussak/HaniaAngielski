# Ustalenia i rzeczy do rozstrzygnięcia

**D-52 · 13 listopada 2026 — wdrożone:** Ukończona lekcja zostaje ukończona. Ukończenie zależy wyłącznie od identyfikatora lekcji, niezależnie od późniejszych zmian jej treści, wydania i rewizji materiału. Treść lekcji, także ukończonej, można poprawiać i uzupełniać wielokrotnie; każde konto widzi aktualną treść. Mapa, etap i moduł zachowują 100%, gratulacje, gwiazdki, odblokowania domku i zakupy; nie pokazujemy komunikatu o nowych zadaniach do zrobienia. Nowa sesja ukończonej lekcji i Poziom legendarny zwykłej lekcji biorą aktualną treść i dają dotychczasową 1 ★, nigdy ponownie 3 ★. Rozpoczęta sesja zachowuje zapisany zestaw zadań. Zmiana treści nie dodaje wymaganych lekcji do ukończonej mapy. D-52 zastępuje część D-24 („poprawiamy tylko nieukończone lekcje”) oraz zapis D-50 o kopiowaniu zestawu przez Poziom legendarny dla zwykłych lekcji; zestawy dynamiczne (Kocia powtórka, Koci trening) nadal są kopiowane. Bez nowych pól, migracji i zmiany kopii v1. [Wymagania](03-nauka.md), [zasady edycji treści](format-materialow.md#aktualizacja-wydanej-lekcji), [zapis](06-zapis.md).

**D-51 · 12 listopada 2026 — wdrożone:** Osiem poprawek plansz i nawigacji: wspólna plansza luk, pary bez przerwy po każdym wyborze, widok lekcji z „Zacznij od nowa” i „Kontynuuj”, rozgrzewka przed każdą mapą z poznanego materiału, cofanie według historii ekranów, przywracanie ekranu po odświeżeniu, ramka kursu tylko na stronie startowej, ramka aktualizacji poza ćwiczeniami. Kod i testy (`boards-navigation.test.ts`, `browser/eight-points.spec.ts`) istnieją i przechodzą. Piętnaście starszych scenariuszy przeglądarkowych, w tym pięć PWA, dostosowano do D-51 13 listopada 2026 — [lista](07-testy.md). [Wymagania](03-nauka.md).

**D-50 · 12 listopada 2026 — wdrożone, wymagania zapisane przed kodem:** Dla nowych modułów preferujemy jedną mapę, ale Food zachowuje obie mapy i cały dorobek. Po lekcji są trzy przyciski: Kolejna lekcja, Poziom legendarny (dobrowolna pełna powtórka, dotychczasowe +1 ★), Wróć do mapy. Lekcje mapowe automatycznie mieszają wpisywanie i wybór, bez pytania o preferencję. Przeplatamy słownictwo i gramatykę w dostępnym zakresie oraz dodajemy dobieranie par i bank odpowiedzi do luk, z zachowaniem źródłowych dialogów i poziomu nauki. Nie zmieniamy rozpoczętych sesji, ukończeń, gwiazdek ani materiałów podręcznika. [Pełne wymagania i stan wdrożenia](03-nauka.md).

Aktualizacja: 10 listopada 2026 r. Ustalenie docelowe nie oznacza automatycznego wdrożenia. Stan działającej aplikacji opisuje [punkt odniesienia](stan-obecny/README.md).

## Uzgodnione założenia docelowe

| ID | Ustalenie | Główny opis |
| --- | --- | --- |
| D-01 | Moduł obejmuje zakres działu podręcznika i ma 1–3 mapy; każda mapa ma kilka lekcji. | [Mechanika](02-mechanika.md) |
| D-02 | Mapy modułu łącznie prowadzą przez wszystkie jego najważniejsze elementy słownictwa i gramatyki. | [Nauka](03-nauka.md) |
| D-03 | Mechanika nie zawiera reguł konkretnego języka; konkretne treści i kryteria pochodzą z materiału. | [Mechanika](02-mechanika.md), [merytoryka](04-merytoryka.md) |
| D-04 | Rozróżniamy poznawanie/ćwiczenie, trening wcześniejszych map i powtórkę błędów danej mapy. | [Nauka](03-nauka.md) |
| D-05 | Trening obejmuje także wcześniej bezbłędne elementy; nie jest wyłącznie powtórką trudności. | [Nauka](03-nauka.md) |
| D-06 | Są ćwiczenia modułowe i globalne z poznanego zakresu wybranego kursu. | [Produkt](01-produkt.md), [nauka](03-nauka.md) |
| D-07 | Lekcje mają być w miarę równe, według ustalonego zakresu liczby zadań początkowych. | [Nauka](03-nauka.md) |
| D-08 | Angielski i francuski Hani oraz włoski Pauliny opieramy na odpowiednich podręcznikach. | [Kursy](kursy/README.md) |
| D-09 | Nie utożsamiamy pokrycia zakresu, poprawki odpowiedzi i trwałego utrwalenia. | [Nauka](03-nauka.md) |
| D-10 | Obecne zadanie zmienia tylko dokumentację: bez nowego kodu, danych, migracji, Spec Kit i skilla. | [Spis dokumentacji](README.md) |
| D-11 | Jeden kurs odpowiada jednemu podręcznikowi do danego języka. Różne podręczniki do tego samego języka tworzą osobne kursy. | [Mechanika](02-mechanika.md), [karty kursów](kursy/README.md) |
| D-12 | Język nauki i język objaśnień określamy oddzielnie dla każdego kursu. Na początek objaśnienia kursów angielskiego Hani, francuskiego Hani i włoskiego Pauliny są po polsku. | [Mechanika](02-mechanika.md), [karty kursów](kursy/README.md) |
| D-13 | Dodruk i drobne poprawki podręcznika pozostają w tym samym kursie. Istotnie zmienione wydanie, np. z innym układem działów lub zakresem materiału, stanowi osobny kurs. | [Mechanika](02-mechanika.md), [karty kursów](kursy/README.md) |
| D-14 | Z jednego kursu może korzystać wiele kont: materiały są wspólne, a każde konto ma własne postępy. Nauka lub testowanie na jednym koncie nie zmienia wyników innych kont. | [Mechanika](02-mechanika.md), [zapis](06-zapis.md) |
| D-15 | Postępy tego samego elementu są osobne w każdym kursie, także na jednym koncie. Wynik w jednym kursie nie zalicza automatycznie elementu w innym. | [Mechanika](02-mechanika.md), [zapis](06-zapis.md) |
| D-16 | Jedno hasło opisuje jedno konkretne znaczenie, z przypisaną do tego znaczenia ilustracją i wariantami językowymi. Różne znaczenia identycznego zapisu są osobnymi hasłami. | [Mechanika](02-mechanika.md), [merytoryka](04-merytoryka.md) |
| D-17 | Podstawowy opis kursu zawiera nazwę, język nauki i objaśnień, tytuł, autora i wydanie podręcznika, poziom lub zakres poziomów oraz uporządkowaną listę modułów. Konkretne strony i źródła ćwiczeń pozostają przy materiałach modułu. | [Mechanika](02-mechanika.md), [karty kursów](kursy/README.md) |
| D-18 | Zwykła lekcja zawiera 6–10 zadań początkowych, najczęściej 8. Poprawki i powroty błędów nie wliczają się do tej liczby. | [Nauka](03-nauka.md) |
| D-19 | Powtórka błędów zawiera 1–10 zadań początkowych, zależnie od dostępnej kolejki. Nie dokładamy innych pytań do minimum; większa kolejka jest dzielona na krótkie sesje. Poprawki i powroty błędów są liczone osobno. | [Nauka](03-nauka.md) |
| D-20 | Trening wcześniejszego materiału zawiera 6–10 zadań początkowych, najczęściej 8. Przy mniejszej puli dostępnego wcześniejszego materiału może być krótszy, bez sięgania po niepoznane treści i powielania pytań wyłącznie dla wypełnienia minimum. Poprawki i powroty błędów są liczone osobno. | [Nauka](03-nauka.md) |
| D-21 | Jedna samodzielnie oceniana odpowiedź to jedno zadanie, bez dodatkowych wag. W zestawach o standardowym zakresie 6–10 zadań przy dłuższych zadaniach dobieramy liczbę bliższą 6, a przy krótkich 8–10; zachowujemy wyjątki krótkich powtórek i małej puli treningu. | [Nauka](03-nauka.md) |
| D-22 | Zachowujemy obecną mapę Food i postępy Hani, bez proponowanego podziału na trzy mapy. Ukończone części 1–4 pozostają bez zmian. Plan poprawek dotyczy sekcji 5 „W restauracji”, 6 „Powód i skutek” i 7 „Koci piknik”. Dodatkową mapę planujemy dla rzeczywiście brakującego materiału po sprawdzeniu pokrycia podręcznika. | [Nauka](03-nauka.md), [angielski Hani](kursy/angielski-hani.md) |
| D-23 | Oddzielamy postęp ukończenia lekcji od zaległości utrwalania. Pasek lub kółko pokazuje ukończenie lekcji, osiągając 100% po wszystkich lekcjach ścieżki bez wymagania powtórek. Zamiast ogólnego procentu utrwalenia pokazujemy pomarańczową liczbę, np. „5 ćwiczeń do utrwalenia”; po wymaganych 3 zaliczeniach element znika z zaległości. Po ukończeniu lekcji i wyzerowaniu zaległości pokazujemy zielony stan i gratulacje. | [Produkt](01-produkt.md), [nauka](03-nauka.md) |
| D-24 | Przy planowanych poprawkach Food każda zaliczona lekcja pozostaje ukończona, także wewnątrz sekcji 5–7, a zdobyte gwiazdki zostają na koncie. Poprawiamy tylko nieukończone lekcje; brakujący materiał dodajemy na kolejnej mapie. Nie otwieramy ponownie zaliczonej lekcji z powodu poprawiania jej sekcji. | [Nauka](03-nauka.md), [zapis](06-zapis.md) |
| D-25 | Element materiału uznajemy za poznany po pierwszej próbie odpowiedzi na dotyczące go zadanie, także błędnej. Samo obejrzenie wprowadzenia nie wystarcza; ukończenie całej lekcji nie jest wymagane. Poprawność i utrwalenie są liczone osobno, w kontekście konta i kursu. | [Nauka](03-nauka.md), [zapis](06-zapis.md) |
| D-26 | Przy ustalaniu poznanego materiału uwzględniamy wcześniejsze zapisane próby odpowiedzi, także ze starszej historii i niezależnie od poprawności. Nie wymaga to ponownego poznawania tych elementów ani zmiany ocen, ukończeń czy zdobytych gwiazdek. | [Nauka](03-nauka.md), [zapis](06-zapis.md) |
| D-27 | Oprócz treningów na mapie dostępny jest dodatkowy trening na żądanie, bez czekania na termin, także kilka razy jednego dnia. Nadal korzysta wyłącznie z dozwolonego, wcześniej poznanego materiału w danym kursie. | [Produkt](01-produkt.md), [nauka](03-nauka.md) |
| D-28 | Trening łączy słownictwo i gramatykę zależnie od dostępnego, wcześniej poznanego materiału, bez sztywnych proporcji. Jeśli dostępny jest tylko jeden rodzaj materiału, trening może korzystać wyłącznie z niego; nie dodajemy niepoznanych treści dla sztucznego zachowania proporcji. | [Nauka](03-nauka.md) |
| D-29 | W treningu trudne i dawno niećwiczone elementy wracają częściej, a rozwiązywane bezbłędnie rzadziej, ale regularnie. Wybór konkretnego algorytmu doboru i odstępów odkładamy na później; nie wybrano SM-2, FSRS ani innego rozwiązania. | [Nauka](03-nauka.md) |
| D-30 | Nową mapę zaczynamy od nowego materiału. Pierwszy trening umieszczamy po 2–3 lekcjach nowego materiału, jeśli jest już poznany materiał z wcześniejszych map. Kolejne treningi pojawiają się co 2–3 lekcje nowego materiału, zależnie od długości mapy i dostępnego materiału. Nie umieszczamy treningu na początku mapy ani nie tworzymy pustego treningu. | [Nauka](03-nauka.md) |
| D-31 | Przy zadaniach gramatycznych po odpowiedzi poprawnej i błędnej wyjaśniamy, dlaczego dana forma jest prawidłowa lub nieprawidłowa w konkretnym zdaniu. Wyjaśnienie łączy regułę z kontekstem; samo wskazanie poprawnej odpowiedzi nie wystarcza. Celem jest rozumienie gramatyki. | [Nauka](03-nauka.md), [merytoryka](04-merytoryka.md) |
| D-32 | Ukończenie mapy wymaga ukończenia zwykłych lekcji i treningów umieszczonych na mapie. Dodatkowe treningi na żądanie są dobrowolne, a powtórki błędów nie blokują ukończenia mapy. Warunki nagród pozostają osobną decyzją. | [Nauka](03-nauka.md), [produkt](01-produkt.md) |
| D-33 | Pierwsze ukończenie danego treningu na mapie daje 3 gwiazdki. Pierwotnie kolejne ukończenia nie dawały dodatkowych gwiazdek; D-40 zastępuje tę część zasadą 1 gwiazdki za nową pełną sesję powtórzenia. Nie rozstrzyga to nagród za dodatkowe treningi na żądanie ani premii za utrwalenie. | [Nauka](03-nauka.md) |
| D-34 | Ukończenie dodatkowego treningu na żądanie daje 1 gwiazdkę. Pozostałe pytania odkładamy; użytkowniczka upoważniła do rozpoczęcia wdrażania uzgodnionych zmian. Nie oznacza to zatwierdzenia otwartych zasad ani resetowania postępów. | [Nauka](03-nauka.md) |
| D-35 | Forma odpowiedzi gramatycznej wynika z podręcznika i poziomu nauki. Przy luce wymagamy tylko brakującego słowa lub wyrażenia, przy podanych wariantach — wyboru. Całe zdanie wymagane jest wyłącznie wtedy, gdy taki jest cel zadania źródłowego. Ponowna próba i obie powtórki zachowują tę samą jednostkę odpowiedzi; pokazanie pełnego przykładu w wyjaśnieniu nie rozszerza zakresu poprawki. | [Merytoryka](04-merytoryka.md), [dodawanie modułów](dodawanie-modulow.md) |

## Przerwa w ustalaniu wymagań — 10 listopada 2026

Pozostałe pytania U-01–U-10 są zaparkowane na prośbę użytkowniczki. Wybór algorytmu treningów nadal odłożony. D-10 opisuje poprzedni etap rozmowy: od D-34 można zmieniać kod w zakresie uzgodnionych wymagań. Nie zatwierdzono wdrożenia otwartych rozstrzygnięć. Szczegóły wykonania i sprawdzenia zapisujemy w [raporcie wdrożenia](wdrozenie-nauki.md); historyczny punkt odniesienia pozostaje bez zmian.

Użytkowniczka następnie zatwierdziła etap 2: uporządkowanie kursów i materiałów pod różne języki, z zachowaniem Food, wyglądu i postępów. Techniczny kontrakt opisuje [format materiałów](format-materialow.md), a wykonanie i testy [raport etapu 2](wdrozenie-kursow.md). Nie jest to zgoda na rozstrzyganie pozostałych zaparkowanych zasad.

Użytkowniczka zatwierdziła także etap 3: wybór kursu i globalne fiszki, quiz oraz gramatykę z poznanego materiału. Implementację opisuje [raport zakresów](wdrozenie-zakresow.md). Nie rozszerza to zgody na pozostałe zaparkowane pytania.

Użytkowniczka zatwierdziła etap 4: porównanie Food z podręcznikiem, poprawki wyłącznie nieukończonych lekcji i nową mapę dla braków. [Raport Food](wdrozenie-food.md) opisuje wykonanie i ochronę wyników. Pozostałe pytania nadal są zaparkowane.

## Uzupełnienia wdrożone po przeglądzie nauki — 10 listopada 2026

- **D-36:** Nawigacja Nauka / Mapy / Domek / Postępy / Konto na komputerze i telefonie; kopia postępów w Koncie również dla gościa. Błędna odpowiedź na jasnoróżowym tle, poprawna na zielonym, bez przekreśleń i oznaczania różnic.
- **D-37:** W słówkach jawnie określamy użycie a/an. Brak poprawnego rodzajnika jest zaliczany z pomarańczowym wyjaśnieniem; błędny lub zbędny jest błędem z wyjaśnieniem. Pytamy o jedno znaczenie i konkretną liczbę/kontekst. Gramatyka zachowuje własne dokładne kryteria.
- **D-38:** Stały zestaw zadań, bez automatycznego dopisywania błędów do końca. Poprawka przy pytaniu jest dobrowolna, a błędy pozostają w osobnych powtórkach. Pierwsza próba nadal określa wynik. Stare rozpoczęte sesje zachowują zapisaną listę.
- **D-39:** Dowolny wybór dostępnej mapy, etapu i lekcji bez wymogu poprzednich ukończeń. Kolejność jest rekomendacją. Trening nadal wymaga poznanego wcześniejszego materiału; pusta pula pokazuje przygotowanie.
- **D-40:** Każda nowa pełna sesja powtórzenia lekcji na mapie (również treningu na mapie) daje 1 gwiazdkę. Pierwsze ukończenie nadal daje 3. Nie naliczamy dwa razy za tę samą sesję ani wstecz za dawną historię. Ukończenia i zdobyte gwiazdki zostają. To uzupełnia D-33, zastępując wcześniejszy brak nagrody za pełne powtórzenie.

Pozostałe zaparkowane pytania pozostają otwarte; wdrożenie tych zasad nie rozstrzyga kryteriów FR/IT ani docelowego algorytmu treningu.

## Rozbudowa domku — wymaganie do wdrożenia

**D-41:** Każde konto ma osobny domek dla każdego kursu. Ukończenie wszystkich map modułu odblokowuje jeden pokój, a ukończenie pojedynczej mapy odblokowuje wyposażenie. Pokój jest nagrodą za moduł; wyposażenie jest dostępne do kupienia za gwiazdki. Wdrożono dla Food: kuchnia za obie mapy i osiem przedmiotów w zatwierdzonych cenach. [Pełne wymaganie, wdrożenie i ochrona dorobku](koci-domek.md). Osobne domki nie rozstrzygają podziału portfela gwiazdek.

**D-42:** Gwiazdki są osobne dla każdego kursu i konta. Cały obecny dorobek domku — gwiazdki, zakupy, ustawienia i pokój początkowy — przypisujemy do kursu angielskiego `angielski-hani`, z zachowaniem wydatków i dostępnego salda. Przejście wykonujemy raz, również przy imporcie starszej kopii i synchronizacji. Nowe kursy zaczynają z zerowym portfelem i bez zakupów. Zasada jest wdrożona; zastępuje otwarte pytanie o wspólny portfel przy D-41. Dorobek angielskiego pozostaje w starych polach zapisu, a pozostałe kursy mają osobne portfele; nie trzeba zerować ani kopiować dawnych kwot. [Wymaganie i wdrożenie Food](koci-domek.md).

**D-43 · 12 listopada 2026:** Rozbudowujemy domek o dodatkowe miejsca i osobne warstwy tekstyliów, mebli oraz drobiazgów. Dodajemy „Moje rzeczy” z położeniem każdego zakupu i schowkiem, obsługiwane na telefonie przez wybór przedmiotu i przyciski miejsc, bez precyzyjnego przeciągania. Zastąpiona dekoracja wraca do schowka; przed ustawieniem pokazujemy, co zostanie schowane. Zachowujemy stare zakupy i ustawienia, gwiazdki oraz postępy, osobno dla kont i kursów. **Status: wdrożone.** Szczegółowe rozmieszczenie, zachowanie stolika i zgodność kopii opisuje [kontrakt domku](koci-domek.md).

**D-44 · 12 listopada 2026 — wdrożone:** Domek przede wszystkim motywuje do nauki. Każdy pokój ma własne wyposażenie odblokowywane przez naukę przypisanego modułu. Nadal mapa odblokowuje wyposażenie do zakupu za gwiazdki, a wszystkie mapy modułu odblokowują przypisany pokój. Food zachowuje dotychczasową grafikę i charakter pokoju. Zachowano istniejącą kuchnię, odblokowania, zakupy, koszty i postępy. Nowe zakupy przypisujemy do pierwszego pokoju z katalogu; stare zachowują już zapisany pokój, bez odbierania rzeczy ustawionych wcześniej gdzie indziej. Nie można przenosić wyposażenia między pokojami. [Obecne zasady i przejście ze starego układu](koci-domek.md).

**D-45 · 12 listopada 2026 — wdrożone:** Przedmioty można przesuwać po siatce w pasującym obszarze pokoju. Każdy ma stały rozmiar względem pokoju, niezależny od pozycji; użytkownik nie może go skalować ani obracać. Cały pokój skaluje się do telefonu. W pierwszym wdrożeniu wybrano siatkę 24 × 15, przeciąganie myszą/dotykiem i strzałki o jedno pole. Poprawny ruch zapisuje się od razu, błędny lub anulowany zachowuje poprzednie ustawienie. Nowe współrzędne są opcjonalnym rozszerzeniem zakupu; stare miejsca odczytujemy bez przepisywania danych. Zasady powierzchni, kolizji i schowania drobiazgów ze stolika opisuje [specyfikacja](koci-domek.md). Błąd rozmiarów zależnych od miejsca został usunięty. Wcześniejsze pytania o szczegóły siatki były otwarte na etapie specyfikacji; obecny wariant implementacji jest opisany jawnie w dokumencie domku.

**D-46 · 12 listopada 2026 — wdrożone:** Ukończona mapa pozostaje ukończona: 100%, gratulacje i zdobyta nagroda nie zależą od wyzerowania błędów. Nie pokazujemy na niej ostrzeżeń ani liczników sugerujących zaległą pracę. Powtórki stają się osobną, pozytywnie nazwaną „Kocią rozgrzewką” z krótkimi, skończonymi sesjami, własnym postępem i wyraźnym zakończeniem, również gdy w tle pozostaje materiał do ćwiczenia. Kolejne sesje są dobrowolne, także kilka razy dziennie z wybranego modułu. Błędy nadal wspierają dobór zadań; nie usuwamy danych ani nie zmieniamy automatycznie algorytmu trzech zaliczeń. D-46 aktualizuje docelową prezentację D-23 i podtrzymuje ukończenie według D-32. W pierwszym wdrożeniu D-47 zachowuje dotychczasowe nagrody treningów oraz dawną premię etapu, a dodatkowy zestaw ma do 8 zadań. Dalsze zmiany algorytmu odstępów i nagród wymagają osobnej decyzji. Zachowujemy ukończenia, historię i zdobyte gwiazdki. [Pełne wymaganie i kryteria](03-nauka.md).

**D-47 · 12 listopada 2026 — wdrożone:** „Kocia rozgrzewka” zastępuje obecne treningi. Na mapie jest wymaganą lekcją do jej ukończenia, poza mapą jest dobrowolna. Zachowujemy identyfikatory i ukończenia obecnych treningów, rozpoczęte sesje, gwiazdki i nagrody; nie otwieramy zaliczonych lekcji ponownie. Rozgrzewka utrwala poznany materiał bieżącej i wcześniejszych map, także wcześniej bezbłędny, bez wprowadzania nowych treści. Dotychczasowe reguły nagród treningów zostają, a D-46 określa niezależny sukces mapy i krótkie zakończenie rozgrzewki. Wymaganie zapisano przed zmianą kodu. Wdrożono bez zmiany technicznych ról i kluczy zapisanych sesji; pierwsza mapa Food nie dostała nowych obowiązkowych lekcji. [Szczegóły i ochrona dorobku](03-nauka.md).

**D-48 · 12 listopada 2026 — wdrożone po zleceniu implementacji:** Sekcja łącznie 9 lekcji: 7 bazowych i 2 dynamiczne Kocie powtórki. Wdrożenie zapisuje raz wylosowane miejsca, dobiera wcześniejsze błędy tego kursu, przy braku błędów poznany materiał, oraz rozlicza wspólny licznik trzech pierwszych poprawnych prób w osobnych ukończonych sesjach. Techniczne doprecyzowania i nagrody opisuje [nauka](03-nauka.md). Opt-in obejmuje nie rozpoczęte „Ilości i opakowania”; nie przebudowuje rozpoczętych lub ukończonych sekcji. Koci trening pozostaje, a w przyszłej sekcji 7 + 2 mieści się w siedmiu bazowych, bez dziesiątej lekcji.

**D-49 · 12 listopada 2026 — pierwsza wersja wdrożona:** Kocia rozgrzewka na początku modułu, Koci trening pomiędzy lekcjami i „Misja Kociego Mistrza” na końcu. Zaproszenia mają obecne kotki, pastelowe ramki i duży przycisk z łapką; nowe specjalne rysunki pozostają na później. Otwarcie i finał są dobrowolne, zachowują nagrodę dodatkowego treningu, nie otwierają ukończonych lekcji ponownie. [Warunki i limity](03-nauka.md), [wygląd](01-produkt.md).

## Obszary decyzji i ich status





Poniższe punkty nie są zgodą na zmianę aplikacji. Każdy wymaga doprecyzowania przed implementacją odpowiadającej mu funkcji.

## U-01

**Format kursu i powiązań językowych.** Jakie dokładnie dane opisują kurs, język treści, objaśnień, podręcznik i warianty haseł? Jak powiązać je z istniejącymi modułami i wynikami bez zmieniania identyfikatorów dla samego porządku?

**Status: podstawowe założenia produktowe i kontrakt materiałów są wdrożone w etapie 2.** D-11–D-17 określają kurs jako podręcznik, osobne języki, rozróżnianie wydań, wspólne materiały i osobne wyniki oraz znaczenie z ilustracją i wariantami językowymi. `Course`, rejestr kursów i format znaczeń są opisane w [kontrakcie](format-materialow.md). Wyniki pozostają przy globalnie unikalnych modułach; nie zmieniono historycznych kluczy ani nie wykonano migracji Food. Wybór kursu w interfejsie wdrożono w etapie 3; dalsze rozszerzenia pozostają oddzielnym zakresem. Kryteria konkretnych odpowiedzi nadal należą do U-06; nie dodano automatycznego przenoszenia postępów między podręcznikami.

## U-02

**Wielkość lekcji. Status: założenia rozstrzygnięte.** Zwykłe lekcje mają 6–10 zadań początkowych, najczęściej 8 (D-18). Powtórki błędów mają 1–10 zadań, bez dopełniania kolejki innymi pytaniami (D-19). Treningi mają 6–10 zadań początkowych, najczęściej 8, ale mogą być krótsze przy mniejszej puli wcześniejszego materiału (D-20). Poprawki i powroty błędów nie wliczają się do początkowej wielkości. Jedna samodzielnie oceniana odpowiedź to jedno zadanie, bez wag; w standardowym zakresie przy dłuższych zadaniach bliżej 6, przy krótkich 8–10 (D-21). Pierwsze wdrożenie D-34 obsługuje wielkość treningu i kontroluje 6–10 zadań zwykłej lekcji nowych nazwanych map; pierwsze cztery etapy Food i dawne ukończenia pozostają bez przebudowy. W etapie 4 nowe wersje nieukończonych lekcji etapów 5–7 mają po 6–8 zadań.

## U-03

**Dalszy rozwój obecnego Food. Status: wdrożone w etapie 4.** Zgodnie z D-22 i D-24 zachowano pierwszą mapę, wszystkie identyfikatory oraz oryginalne treści. Etapy 1–4 nie mają aktualizacji; w etapach 5–7 poprawioną wersję otrzymują wyłącznie nieukończone lekcje. Dawne aktywne sesje zachowują swoje pytania, ukończone lekcje i zdobyte gwiazdki pozostają. Audyt wskazał brak praktyki krótkich notatek o posiłkach, przepisu i opisu śniadania. Uzupełnia je druga mapa „Kocia kuchnia — Food w praktyce”, z treningiem wcześniejszej mapy po trzech lekcjach. [Źródła, zasady wersji, ochrona wyników i granice](wdrozenie-food.md). Nie dodano nagrań ani oceny swobodnego pisania; nie są to umiejętności potwierdzone samym przejściem map. Nie rozstrzygnięto pozostałych zaparkowanych pytań.

## U-04

**Co oznacza poznanie materiału. Status: wdrożone w etapie 3.** Zgodnie z D-25 poznanie następuje przy pierwszej próbie odpowiedzi dotyczącej elementu, niezależnie od poprawności i ukończenia lekcji. Samo obejrzenie wprowadzenia nie wystarcza. D-26 nakazuje uwzględnić również wcześniejsze zapisane próby, także ze starszej historii, bez zmiany ocen, ukończeń i gwiazdek. Element może wejść do poznanego zakresu globalnych ćwiczeń; trening nadal respektuje warunek wcześniejszych map. Wspólny odczyt prób obejmuje również podsumowania archiwów, a `encountered` zachowuje klucze poznania przy zastąpieniu aktywnej sesji, bez zmiany ocen. Pierwsze wdrożenie odczytuje poznany zakres na potrzeby treningu z istniejących prób i podsumowań historii, bez migracji danych. Mechanizm jest obecnie wykorzystywany także przez globalne fiszki, quiz i gramatykę — [raport etapu 3](wdrozenie-zakresow.md).

## U-05

**Dobór i harmonogram treningów.** Algorytm według tur, SM-2, FSRS czy inne rozwiązanie? Gdzie umieszczamy treningi, jak łączymy słownictwo z gramatyką, jak obejmujemy bezbłędny materiał i jak działa dodatkowe ćwiczenie przed sprawdzianem? Jak wybieramy zadania, gdy mało materiału jest dostępne?

**Status: częściowo rozstrzygnięte; wybór algorytmu świadomie odłożony na później.** D-27 zatwierdza dodatkowe treningi na żądanie, D-28 mieszanie słownictwa i gramatyki, a D-29 pierwszeństwo trudnych i dawno niećwiczonych elementów z regularnym powrotem bezbłędnych. Wielkość określa D-20. Zgodnie z doprecyzowanym D-30 mapa zaczyna się od nowego materiału, pierwszy trening umieszczamy po 2–3 lekcjach nowego materiału, a kolejne co 2–3 lekcje nowego materiału, zależnie od długości mapy i dostępnego materiału. Początkowo warunkiem był poznany materiał z wcześniejszych map; wdrożone D-47 dopuszcza także wcześniejsze lekcje bieżącej mapy. Odrzucono trening na początku mapy; bez dostępnego wcześniejszego materiału nie tworzymy pustego treningu. Rytm rozmieszczenia uzgodniono; konkretne pozycje i liczbę treningów ustalamy przy układaniu danej mapy zgodnie z tą zasadą. D-32 rozstrzyga wymagalność: treningi na mapie są wymagane do jej ukończenia, dodatkowe treningi są dobrowolne, a powtórki błędów nie blokują ukończenia. Wybór algorytmu, parametrów i odstępów odłożono na później. D-33 ustala 3 gwiazdki za pierwsze ukończenie danego treningu na mapie; D-40 dodaje 1 za każdą nową pełną sesję powtórzenia. D-34 zatwierdza 1 gwiazdkę za ukończony dodatkowy trening. Wpływ na przyszły harmonogram i docelowe miejsce przycisku pozostają zaparkowane. W pierwszym wdrożeniu przycisk jest dostępny na mapie i w ćwiczeniach swobodnych; szczegóły opisuje raport wdrożenia. Pierwszy etap implementacji jest opisany w [raporcie wdrożenia](wdrozenie-nauki.md); pozostałe pytania pozostają zaparkowane.

## U-06

**Kryteria odpowiedzi.** Kiedy wymagamy akcentów, rodzajników, wielkości liter i konkretnej formy? Jakie warianty akceptujemy w każdym kursie? Swobodna wypowiedź wymaga osobnej decyzji o ocenianiu; nie dodajemy jej domyślnie.

**Uzgodnione wymaganie informacji zwrotnej (D-31):** gramatykę objaśniamy po poprawnej i błędnej odpowiedzi przez odniesienie reguły do konkretnego zdania. D-37 rozstrzyga tolerancję a/an dla wskazanych angielskich słówek, z konkretnym kontekstem. Pozostałe kryteria, w tym FR/IT, nadal wymagają ustalenia.

## U-07

**Utrwalenie, procenty i nagrody. Status: D-46–D-47 wdrożone; dalszy algorytm i zmiany nagród pozostają otwarte.** Ukończona mapa pokazuje sukces bez ostrzeżeń o zaległościach, a powtórki są osobną „Kocią rozgrzewką” z krótkim zakończeniem. Rozgrzewki zastępują treningi: na mapie wymagane, dodatkowe dobrowolne. Zachowano reguły 3/1/1 ★, stare ukończenia oraz starą premię utrwalenia etapu. Wewnętrzne trzy zaliczenia tematów pozostają, ale nie są widocznym obowiązkiem. Nie przeliczamy ani nie odbieramy zdobytych gwiazdek. Sam brak błędów przed ukończeniem lekcji nie zalicza mapy. [Obecne zasady](03-nauka.md).

## U-08

**Wybór kursu i zakresu. Status: podstawowy interfejs wdrożony w etapie 3.** Kurs wybieramy pod powitaniem i przy katalogach, a globalne ćwiczenia przez „Ćwicz cały poznany materiał”. Mapy, moduły i kontynuacja respektują wybrany kurs. Pozostaje jedna aktywna sesja; sesja innego kursu jest zachowana i ma osobny przycisk powrotu. Nowa sesja wymaga potwierdzenia zastąpienia. Wybór kursu jest lokalną preferencją osobną dla konta i gościa, bez synchronizacji. Wiele równoległych sesji i preferencje odpowiadania per kurs pozostają zaparkowane. [Opis działania i zapisu](wdrozenie-zakresow.md).

## U-09

**Potrzeby Hani i Pauliny.** Czy potrzebne są różne tempo, cele, możliwość pomijania materiału lub opcje gamifikacji? Nie ma decyzji o usuwaniu kotków ani o osobnej aplikacji dla dorosłego.

## U-10

**Podręczniki i recenzja.** Jakie są tytuły/ wydania i pierwsze zakresy FR/IT? Jak oznaczamy niepewny odczyt, potwierdzamy źródła i zatwierdzamy poprawność językową? Które elementy modułu uznajemy za obowiązkowe do pokrycia przez mapy?

Przygotowano [lekką instrukcję opracowania modułu](dodawanie-modulow.md) i [szablon karty materiałów](szablon-modulu.md), z zapisem pokrycia, niepewności i faktycznego zakresu przeglądu. To procedura redakcyjna; nie zamyka wyboru podręczników FR/IT, ich konkretnych zakresów ani kryteriów odpowiedzi i niezależnego zatwierdzania językowego.

## Osobne propozycje techniczne

[Przegląd gotowości językowej](rozwoj-jezykow.md) zawiera obserwacje J1–J10, m.in. dotyczące izolacji błędu nowej mapy, sprawdzania zasobów, zakresu testów i pobierania offline. To propozycje do oceny przy danej zmianie, nie dodatkowy zaakceptowany zakres bieżącego zadania.
