# Koci domek — rozbudowa za postępy w nauce

Status: **wdrożone D-44–D-45: własne wyposażenie pokojów, siatka i stałe rozmiary**, 12 listopada 2026. Zakupy i postępy pozostają zachowane. Niżej oddzielono obecne zasady od wcześniejszego wariantu D-41–D-43.

## Cel

Domek ma przede wszystkim motywować do nauki i pokazywać jej efekty. Ukończenie pojedynczej mapy poszerza dostępne wyposażenie do kupienia za gwiazdki, a przejście wszystkich map modułu pozwala zdobyć nowy pokój. Urządzanie wspiera ten mechanizm; samo przenoszenie wcześniejszych zakupów nie ma zastępować nagród za kolejny materiał.

## Stan obecny — siatka i własne wyposażenie, D-44–D-45

### Nagrody i przypisanie wyposażenia

- Każdy pokój ma własne wyposażenie. Nowy zakup trafia do pierwszego pokoju wskazanego w katalogu dekoracji. Jedenaście obecnych dekoracji saloniku pozostaje wyposażeniem tego pokoju; toster, kubki i stolik należą do dotychczasowej kuchni.
- Zakupione wcześniej rzeczy zachowują swój zapisany pokój, nawet jeśli stara wersja pozwoliła umieścić je gdzie indziej. Brak pokoju w starym zapisie nadal oznacza salonik. Niczego nie odbieramy ani nie duplikujemy.
- Nie można teraz przenosić wyposażenia między pokojami. Wybranie rzeczy z kolekcji przełącza do pokoju, do którego należy; nie przenosi zakupu.
- Food zachowuje dotychczasowy charakter pokoju i grafiki. Nie dodano nowego pomieszczenia ani nie usunięto istniejącej, zdobytej kuchni. Zachowano dotychczasowe odblokowania map, pokoi i wyposażenia, ceny oraz nagrody za naukę. Dane nagród kolejnych modułów trzeba nadal zdefiniować osobno.
- Mapa odblokowuje wyposażenie do zakupu, wszystkie mapy modułu odblokowują przypisany pokój, a gwiazdki z nauki służą do kupowania. Urządzanie samo nie daje gwiazdek ani nowych nagród.

### Siatka i wygląd

- Pokój ma **24 kolumny i 15 rzędów**. Współrzędne są całkowite, liczone od lewego górnego rogu przedmiotu. Jest to wybrany wariant pierwszego wdrożenia, a nie wcześniejsza decyzja użytkowniczki o konkretnej liczbie kolumn.
- Każdy przedmiot ma stałą szerokość i wysokość w siatce, określoną w danych układu. Miejsce nie zmienia jego rozmiaru. Cały pokój skaluje się proporcjonalnie do ekranu; grafiki zachowują proporcje. Nie ma sterowania rozmiarem ani obrotem.
- Tekstylia są pod meblami, a drobiazgi nad nimi. W siatce przedmioty różnych warstw mogą się nakładać; prostokąty dwóch przedmiotów tej samej warstwy nie mogą się przecinać. Samo stykanie krawędzi jest dozwolone.
- Meble i tekstylia stoją na podłodze. Drobiazgi mogą stać na podłodze, półce, pod oknem, a w kuchni także na blacie lub stoliku. Obszar określa dolna krawędź i środek przedmiotu; cały jego prostokąt musi mieścić się w pokoju.
- Po ustawieniu drobiazgu na powierzchni stolika przesunięcie lub schowanie tego stolika odkłada drobiazg do schowka. Nie usuwa własności ani nie pobiera gwiazdek. Przedmiot nie wędruje sam razem ze stolikiem.

### Obsługa na telefonie i komputerze

1. **„Urządź pokój”** włącza siatkę i przeciąganie. Poza tym trybem pokój służy do oglądania i wyboru dekoracji; można normalnie przewijać stronę.
2. Wybrany przedmiot przeciąga się myszą lub palcem. Podgląd przyciąga się do pól siatki; niedozwolona pozycja jest zaznaczona i ma wyjaśnienie.
3. Poprawne upuszczenie od razu zapisuje pozycję. Błędne upuszczenie, anulowanie gestu, utrata wskaźnika lub zmiana ekranu/rozmiaru okna nie zatwierdzają ruchu. Poprzedni zapis pozostaje.
4. Strzałki bezpośrednio pod pokojem przesuwają wybraną rzecz o jedno pole. Mają stałe identyfikatory do zachowania fokusu i co najmniej 48 px do dotykania. Obok jest przycisk schowania rzeczy.
5. Rzecz ze schowka ma w edycji półprzezroczysty podgląd. Trzeba go przeciągnąć lub użyć przycisku ustawienia; sam wybór rzeczy nie zapisuje pozycji.
6. **„Gotowe — zakończ urządzanie”** wyłącza tryb edycji. Nie jest dodatkowym zatwierdzeniem wszystkich ruchów; każdy poprawny ruch zapisano już osobno.

Dotychczasowe nazwane miejsca pozostają jako skróty przy ustawianiu. Zachowują wcześniejszą zasadę odkładania zastanej dekoracji do schowka, ale używają już stałych wymiarów przedmiotów. Swobodne przeciąganie po siatce nie zastępuje innych rzeczy: przy kolizji odmawia ruchu.

### Zapis i zgodność

- Stare zakupy i nazwane miejsca odczytujemy bez przepisywania danych. Ich położenie jest wyliczane na potrzeby podglądu; od początku mają stałe rozmiary. Pierwszy zatwierdzony ruch zapisuje współrzędne przesuwanego przedmiotu; związane z nim drobiazgi mogą przy ruchu stolika wrócić do schowka.
- Zakup ma opcjonalne pole `position: { x, y }`. Przy współrzędnych `slot` wynosi `null`; brak współrzędnych i `slot: null` oznaczają schowek. Koszt i pokój pozostają w dotychczasowych polach.
- Współrzędne przechodzą przez ten sam zapis transakcyjny, walidację kopii, IndexedDB i synchronizację. Nie zmieniają aktywnej sesji, historii, ukończeń, salda ani portfeli innych kursów.
- Nie przyjmujemy niecałkowitych lub wychodzących poza pokój współrzędnych. Format kopii pozostaje w wersji 1; odczyt nowych współrzędnych wymaga aktualnej aplikacji. Dawny zestaw 116 przypadków walidatora pozostaje punktem odniesienia bez regeneracji.
- Gest rozpoczęty na innym koncie, kursie lub pokoju, bądź przed zmianą stanu wyników, nie może zapisać pozycji w nowym kontekście. Błąd zapisu zachowuje poprzednie dane.

### Dalsze decyzje

Dokładne wyposażenie i obszary nowych pokoi, nowe nagrody, swobodne skalowanie lub obracanie oraz bardziej zaawansowane kolizje nie są częścią tego wdrożenia. Nie zmieniono mechaniki nauki ani cen.

## Wcześniejsze wdrożenie nagród Food — zachowane

Każdy kurs każdego konta ma osobny salonik, zakupy i portfel. Obecny dorobek pozostaje w angielskim. Food odblokowuje cztery przedmioty za każdą z dwóch map, a po obu mapach kuchnię. Przedmioty kupuje się za gwiazdki; kuchnia i jej podstawowe tło są bezpłatne. Dotychczasowa odznaka kucharza za pierwszą mapę pozostaje zachowana. Mechanizm opisuje [logika domku](../src/house/progress.ts), a sposób zapisu [zapis](06-zapis.md).

## Wcześniejsze zasady i obecne wdrożenie — D-41–D-43

Poniższe części zachowują opis wariantu sprzed siatki. W kwestii przypisania wyposażenia do pokoju, rozmiarów i przesuwania obowiązuje wdrożone D-44–D-45 opisane powyżej; dawne opisy przenoszenia między pokojami są historyczne.

### Własność domku

- Każde konto ma własne domki.
- W ramach konta każdy kurs ma osobny domek: np. angielski, francuski i włoski rozwijają różne domki.
- Nauka, zakup lub ustawienie dekoracji w jednym kursie nie zmienia domku innego kursu ani innego konta.
- Wybór kursu określa, który domek oglądamy i urządzamy.

### Osobne gwiazdki i przejście z obecnego zapisu — D-42

- Każde konto ma osobny portfel gwiazdek dla każdego kursu. Gwiazdki zdobyte w kursie wydajemy tylko w domku tego kursu.
- Wszystkie obecne gwiazdki, zakupy i ustawienia przypisujemy do istniejącego kursu angielskiego `angielski-hani`, osobno dla każdego konta i zapisu gościa. Dotychczasowy pokój pozostaje pokojem początkowym tego kursu.
- Zachowujemy dotychczasowe wydatki i dostępne saldo: nie zwracamy wydanych gwiazdek, nie odejmujemy ich drugi raz i nie kopiujemy ich do innych kursów.
- Nowy kurs zaczyna z własnym pokojem początkowym, bez zakupów i z zerowym portfelem. Nie dziedziczy wyposażenia angielskiego.
- Przypisanie dawnego dorobku wykonujemy tylko raz, także po odświeżeniu, synchronizacji lub imporcie starszej kopii. Nie wymaga ono ponownego ukończenia lekcji.

### Pokój za cały moduł

- Każdy ukończony moduł odblokowuje jeden przypisany do niego pokój.
- Warunkiem jest ukończenie **wszystkich map tego modułu** — niezależnie od tego, czy ma jedną, dwie, czy trzy mapy.
- Ukończenie mapy wymaga wszystkich jej lekcji i treningów mapowych. Zaległe powtórki błędów nie blokują nagrody, zgodnie z dotychczasową zasadą ukończenia map.
- Pokój odblokowuje się bez wydawania gwiazdek. Za gwiazdki kupujemy wyposażenie.
- Ponowne przejście modułu nie tworzy drugiego egzemplarza tego samego pokoju.
- Pokoje mogą pełnić różne funkcje, np. kuchnia, łazienka, sypialnia lub ogród. Dla Food zatwierdzono kuchnię; pozostałe pokoje są przykładami przyszłych nagród.

### Wyposażenie za pojedyncze mapy

- Każda ukończona mapa odblokowuje przypisane wyposażenie do zakupu za gwiazdki.
- Odblokowanie przedmiotu oznacza możliwość zakupu, a nie automatyczne kupienie go ani wydanie gwiazdek.
- Nowe przedmioty mogą rozbudowywać wcześniej zdobyte pokoje lub być przeznaczone do pokoju zdobywanego za ukończenie modułu. Przedmiot można ustawić dopiero w posiadanym, pasującym pokoju.
- Ukończenie ostatniej mapy modułu może jednocześnie odblokować jej wyposażenie i pokój za cały moduł.
- Powtórzenie mapy nie dubluje odblokowań. Nagrody gwiazdkowe za lekcje i ich pełne powtórzenia zachowują dotychczasowe zasady.
- Sklep rozróżnia przedmioty zablokowane, dostępne do zakupu i posiadane. Przy blokadzie pokazuje właściwy warunek, np. ukończenie konkretnej mapy.
- Kupione przedmioty można przestawiać i chować bez ponownego płacenia.

### Przykład: obecny moduł Food

Food ma dwie mapy. Ukończenie jednej z nich odblokowuje przypisane jej przedmioty. Dopiero ukończenie obu odblokowuje jeden nowy pokój dla kursu angielskiego tego konta. Kolejność przechodzenia map jest dowolna. Powtórki błędów mogą nadal pozostawać do wykonania.

## Obsługa, zapis i zgodność

- Zachowujemy obecny pokój początkowy, kupione dekoracje, ustawienia, ukończenia i zdobyte gwiazdki.
- Wcześniej ukończone mapy i moduły również dają należne odblokowania; nie wymagamy ponownego przechodzenia materiału i nie naliczamy za to ponownie gwiazdek.
- Zdobytych pokoi i przedmiotów nie odbieramy przy aktualizacji materiałów. Implementacja zachowuje raz zapisane odblokowania; przy nowym odblokowaniu sprawdza wszystkie aktualnie dostępne mapy modułu oraz wymagane mapy z katalogu nagród.
- Pokoje, zakupy i ustawienia działają offline, podlegają synchronizacji konta oraz eksportowi i importowi kopii postępów.
- Na telefonie przełączanie pokoi i urządzanie ma być wygodne bez konieczności precyzyjnego przeciągania. Zachowujemy pastelowy styl, kotki i lekkie grafiki dostępne offline.
- Powiązania moduł–pokój i mapa–wyposażenie mają być danymi, aby dodanie nagród do kolejnego modułu nie wymagało wyjątków w mechanice nauki.

## Wcześniej zatwierdzony wariant nagród Food — D-41–D-43

Food daje **jeden nowy pokój: Kocią kuchnię**, po ukończeniu obu map. Obecny pokój początkowy nazywamy **Kocim salonikiem**. Kuchnia ma bezpłatne tło z oknem, prostym blatem i szafkami, dzięki czemu od razu wygląda jak pokój; ruchome dekoracje kupujemy osobno. Paleta: krem, róż, błękit i fiolet, z kotkami w obecnym stylu aplikacji.

| Ukończona mapa | Nowe wyposażenie do zakupu | Cena | Gdzie można ustawić |
| --- | --- | --- | --- |
| Przygotowania do kociego pikniku | Dwie kocie miseczki | 6 ★ | Salonik lub kuchnia |
| Przygotowania do kociego pikniku | Dzbanek lemoniady | 8 ★ | Salonik lub kuchnia |
| Przygotowania do kociego pikniku | Koszyk piknikowy | 10 ★ | Salonik lub kuchnia |
| Przygotowania do kociego pikniku | Koc piknikowy | 12 ★ | Salonik |
| Kocia kuchnia — Food w praktyce | Misa owoców | 6 ★ | Salonik lub kuchnia |
| Kocia kuchnia — Food w praktyce | Toster z kocimi uszami | 10 ★ | Kuchnia |
| Kocia kuchnia — Food w praktyce | Półeczka z kubkami | 12 ★ | Kuchnia |
| Kocia kuchnia — Food w praktyce | Stolik z dwoma krzesełkami | 18 ★ | Kuchnia |

Wyposażenie pierwszej mapy można wykorzystać w saloniku jeszcze przed zdobyciem kuchni. Jeśli użytkownik najpierw ukończy drugą mapę, misa owoców również pasuje do saloniku; przy pozostałych przedmiotach pokazujemy informację, że wymagają kuchni. Po zdobyciu pokoju kupione przedmioty pasujące do obu pomieszczeń można przenosić, bez tworzenia drugiego egzemplarza. Obecny koszyk i nowy koszyk piknikowy są osobnymi dekoracjami o odmiennym wyglądzie, z zachowaniem dotychczasowych zakupów.

Łazienka, sypialnia i ogród to propozycje nagród za kolejne moduły; Food nie odblokowuje ich wszystkich. Ceny i lista wyposażenia Food są wdrożone w sklepie.

## Do ustalenia przed wdrożeniem

- Przy kolejnych modułach trzeba zdefiniować pokój, wymagane mapy, nagrody, ceny i miejsca ustawienia w katalogu. Dalszy projekt nagród przy zmianach zakresu modułu pozostaje otwarty; implementacja nie odbiera już zapisanych odblokowań.

## Kryteria odbioru

1. Ukończenie części map modułu daje wyposażenie za te mapy, ale nie pokój za cały moduł.
2. Ukończenie ostatniej brakującej mapy daje dokładnie jeden pokój; zaległe błędy nie blokują go.
3. Odświeżenie, synchronizacja, import i ponowne ukończenie nie dublują pokoi ani wyposażenia.
4. Domki i portfele dwóch kursów jednego konta oraz dwóch kont pozostają niezależne. Zakup w jednym kursie nie zmienia salda drugiego.
5. Dotychczasowe ukończenia pozostają zachowane. Stare gwiazdki, zakupy i ustawienia trafiają dokładnie raz do angielskiego, bez zmiany dostępnego salda; przejście ze starego zapisu ma osobny test zgodności, również dla starszych kopii i synchronizacji.
6. Odblokowanie, zakup i ustawienie przedmiotu działają offline i odtwarzają się po imporcie kopii lub synchronizacji.

## Gdzie rozwijać i jak chroniony jest zapis

- [Katalog domku](../src/house/catalog.ts) zawiera dane przedmiotów, cen, zgodnych pokoi i wymaganych map oraz nagrody modułów. Nie kopiujemy ich do silnika nauki.
- [Mechanizm domku](../src/house/progress.ts) obsługuje portfele, odblokowania, zakupy i ustawienia. [Widok](../src/views/house.ts) i [style](../src/adventure.css) odpowiadają za prezentację; [grafiki SVG](../public/game/kitchen.svg) są lekkimi plikami lokalnymi objętymi cache PWA.
- Salonik jest dostępny od początku. Kuchnia pojawia się po obu mapach, bez wymagania wyzerowania błędów. Przedmioty do jeszcze zablokowanej kuchni mają informację o docelowym pokoju; część nagród pasuje również do saloniku.
- Zgodność jest realizowana bez przenoszenia i zerowania starego portfela: pola `adventure.earned` i `adventure.purchases` oznaczają odtąd wyłącznie angielski. Inne kursy korzystają z `adventure.courseHomes[courseId]`. Dlatego ponowny odczyt starszej kopii nie dubluje dorobku ani wydatków.
- `rooms` i `unlockedItems` przechowują odblokowania, a opcjonalne `room` przy zakupie określa pokój; brak `room` oznacza salonik. Miejsca są osobne dla pokoi. Od D-43 przeniesienie do zajętego miejsca zawsze chowa zastany przedmiot, także w tym samym pokoju. Nie zamienia dekoracji miejscami i nie usuwa zakupu.
- Odblokowania zapisujemy wraz z przygotowaniem postępów, również po imporcie i przy synchronizacji. Błąd jednej mapy nie daje fałszywej nagrody za cały moduł i nie odbiera zdobytego pokoju. Nie zmieniono identyfikatorów kursów, materiałów, ukończeń ani ocen, wersji kopii i reguł Firebase.
- Powiadomienie o nowym pokoju po ukończeniu ostatniej lekcji prowadzi użytkownika do pozycji Domek w stałej nawigacji. Wybrany aktualnie pokój jest stanem ekranu; po ponownym uruchomieniu zaczynamy od saloniku, z zachowaniem ustawień obu pokoi.


## Historia: więcej miejsc, warstwy i „Moje rzeczy” — D-43

**Stan obecny, 12 listopada 2026.** Salonik ma 11 miejsc, kuchnia 14; wcześniej było po 6. Dawne identyfikatory i ustawienia pozostają bez zmian. Dodatkowe miejsca obejmują koc pod meblami, poduszkę przy dywanie, dwie strony półki oraz podłogę z boku. Kuchnia ma też blat i dwie strony stolika. Całe obecne wyposażenie saloniku można rozstawić jednocześnie. Nie ma obowiązku wystawienia wszystkich zakupów.

- **Tekstylia** (poduszka, koc) są rysowane pod meblami. **Meble i koszyki** tworzą środkową warstwę, a **drobiazgi** są nad nią. Warstwy wynikają z katalogu dekoracji; nie są nową kopią zakupów w zapisie.
- Nowe miejsca są dopasowane do warstwy i pokoju. Dawne sześć miejsc zachowuje dotychczasową swobodę ustawiania, również dla nietypowych starych aranżacji. Niczego automatycznie nie przestawiamy przy odczycie.
- Drobiazgi na stoliku wymagają posiadanego stolika ustawionego w kuchni na miejscu „Na dywanie”. Przeniesienie stolika z tego miejsca lub jego schowanie przenosi drobiazgi do schowka. Nie odbiera własności i nie pobiera gwiazdek. Blat i półki są częścią pokoju i nie wymagają dodatkowego mebla.
- Sekcja **„Moje rzeczy”** pokazuje wszystkie znane aplikacji zakupione dekoracje tego kursu, z informacją „W saloniku”, „W kuchni” lub „W schowku”. Nie jest osobnym magazynem danych. **„Sklep”** pokazuje katalog bieżącego pokoju, ceny i warunki odblokowania.
- Dotknięcie przedmiotu w kolekcji lub w pokoju przenosi do panelu ustawiania. W razie potrzeby wybiera pasujący posiadany pokój. Wybór miejsca odbywa się przyciskiem, bez przeciągania; przyciski mają co najmniej 44 px wysokości i na telefonie dwie kolumny.
- Przed ustawieniem w zajętym miejscu przycisk pokazuje, co trafi do schowka. Zastępowany przedmiot pozostaje własnością użytkownika. Przy wypieraniu stolika ostrzeżenie obejmuje też jego drobiazgi.
- Schowanie używa dotychczasowego `slot: null`. Po ponownym ustawieniu nie płacimy drugi raz. Jedno miejsce w jednym pokoju mieści jeden przedmiot; oddzielne warstwy korzystają z oddzielnych miejsc, które mogą wizualnie nakładać się na siebie.
- Nowe miejsca korzystają z tego samego zapisu lokalnego, synchronizacji i kopii wersji 1. Starsze kopie są czytane bez migracji; kopia zawierająca nowe miejsca wymaga aktualnej wersji aplikacji. Nie zmieniono zakupów, kosztów, salda, ukończeń, ocen ani aktywnej lekcji.

**Zakres tego wdrożenia D-43:** nie obejmował przesuwania po siatce ani nowych pokoi. Późniejsze wdrożenie siatki D-45 opisano na początku dokumentu. Nie dodano nowych nagród ani cen.
