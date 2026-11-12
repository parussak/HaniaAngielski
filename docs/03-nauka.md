# Nauka — prowadzenie i utrwalanie

## D-50 — dalsza lekcja, poziom legendarny i urozmaicenie — wdrożone

Wymagania zapisano przed zmianą kodu. Wdrożenie zachowuje obie mapy Food i źródłowe treści. Nowe formy dotyczą nowo rozpoczynanych lekcji, w tym pełnych powtórek; zapisane wcześniej sesje nie są przebudowywane.

- Kierunek dla nowych materiałów: jedna mapa na moduł. **Food zachowuje obie obecne mapy**, ich sekcje, identyfikatory, ukończenia, gwiazdki i zakupy. Nie łączymy map ani nie otwieramy ukończonych lekcji.
- Po każdej lekcji mapowej są trzy główne przyciski: **Kolejna lekcja**, **Poziom legendarny**, **Wróć do mapy**. Kolejna lekcja prowadzi do dalszej nauki w tym kursie, także na następnej mapie. Gdy cały dostępny zakres jest ukończony, przycisk jest nieaktywny z wyjaśnieniem.
- Poziom legendarny jest dobrowolną nową sesją pełnej powtórki ukończonej lekcji. Nie jest powtórką samych błędów, nie blokuje mapy i zachowuje obecną nagrodę 1 ★ za pełne ponowne ukończenie. Sama nazwa nie wprowadza progu bezbłędności, nowych odznak ani dodatkowej premii.
- Przed lekcją mapową nie pytamy o sposób odpowiadania. Silnik miesza wpisywanie i wybór, z zachowaniem jawnych wariantów w pytaniu oraz wpisywania w powtórkach błędów. Uzupełnienie luki wymaga brakującego fragmentu, nie całego zdania. Klasyczne ćwiczenia poza mapą zachowują ustawienia.
- Nowe sesje przeplatają słownictwo i gramatykę, gdy dostępny jest odpowiedni materiał. Zachowujemy bazowe zadania lekcji; można dodać maksymalnie dwa poznane zadania uzupełniające z wcześniejszego zakresu, do limitu 10. Nie wymuszamy nowej gramatyki w pierwszych lekcjach słownictwa ani nie zmieniamy rozpoczętych sesji.
- Nowe prezentacje: dobieranie polskich haseł do tłumaczeń (każda oceniana para jest osobnym zadaniem), istniejące źródłowe dialogi z lukami do wpisania oraz luki uzupełniane propozycją z banku odpowiedzi. Nie dopisujemy wymyślonych dialogów do podręcznika. Gramatyka nadal ma objaśnienie po polsku.
- Nowy wybór pary lub propozycji jest zapisywany lokalnie i na koncie razem z sesją; ćwiczenia działają offline. Nowe pola są opcjonalne w kopiach v1. Dawne sesje i kopie zachowują dotychczasową formę.

Poziom legendarny zachowuje cały zestaw ukończonej sesji (także lekcji dynamicznej), z nowym identyfikatorem sesji i pustymi odpowiedziami. Nie dobiera nowego zakresu w miejsce poprzedniego i nie kopiuje znacznika wypłaconej nagrody. Oprawa zadań może być przeplatana ponownie. Plansze dobierania par pokazują pełne formy z wymaganym rodzajnikiem, według tych samych zasad odpowiedzi co pozostałe ćwiczenia.

Jeżeli dawna sesja zawierała automatyczne powroty tego samego zadania po błędzie, nowa powtórka legendarna bierze każdy element raz. Zachowuje wszystkie różne zadania; nie przywraca dawnego wydłużania sesji.

Status: uzgodnione zasady docelowe z wyraźnymi miejscami wymagającymi decyzji. Pierwsze wdrożenie po D-34 opisuje [raport](wdrozenie-nauki.md); historyczne zachowanie sprzed zmian jest w [punkcie odniesienia](stan-obecny/nauka.md).

## Sekcja 7 + 2 i kocie zaproszenia — D-48–D-49, wdrożenie

**Wdrożono 12 listopada 2026 po zleceniu implementacji.** Rozwiązania techniczne poniżej konkretyzują wcześniejszy projekt. Ochrona ukończonych map i krótki koniec sesji z D-46 pozostają.

### Dziewięć lekcji, bez przebudowy rozpoczętej nauki

- Sekcja oznaczona w materiale `adaptiveReviews: true` ma **7 lekcji bazowych + 2 Kocie powtórki = 9 wymaganych lekcji**. Ewentualny stały Koci trening mieści się w siedmiu bazowych, nie tworzy dziesiątej lekcji. Nie skracamy innych sekcji i nie usuwamy z nich treści, żeby sztucznie uzyskać dziewięć.
- W Food oznaczono sekcję **„Ilości i opakowania”**, która ma siedem lekcji bazowych. Pozostałe sekcje i mapy zachowują swój zakres. Sekcja rozpoczęta przed przydzieleniem planu (ukończona lekcja, zapisana sesja lub aktywna lekcja) zostaje przy starych siedmiu lekcjach. Nie cofamy postępów ani gwiazdek i nie otwieramy ukończonych map.
- Dwa miejsca losujemy raz przy wejściu do map, katalogu przygód lub kontynuacji nauki. Powtórki trafiają po lekcjach bazowych 2–6, z co najmniej dwiema lekcjami bazowymi między nimi. Zapis planu jest częścią postępów konta i kopii; odświeżenie oraz synchronizacja zachowują układ. Ostatnią lekcją pozostaje siódma bazowa.
- Każda Kocia powtórka ma **1–5 zadań**, bez dokładania do minimum i bez wydłużania po błędzie. Dobór następuje dopiero przy rozpoczęciu sesji. Rozpoczęty zestaw, odpowiedzi i indeks są zapisywane.
- Pierwszeństwo mają wcześniejsze błędy z wcześniejszych sekcji, map i modułów **tego samego kursu**. Mniej utrwalone elementy wracają przed bardziej utrwalonymi; remis jest losowy. Element z trzema zaliczeniami wypada z puli błędów, ale nadal może wracać w zwykłym treningu. To prosta polityka doboru, nie nowy algorytm kalendarzowy FSRS/SM-2.
- Gdy wcześniejszych błędów nie ma, przystanek bierze poznany materiał wcześniejszych lekcji bieżącej i wcześniejszych map. Nigdy nie tworzy nowego materiału. Przy zupełnie pustej puli prosi o próbę wcześniejszych lekcji, zamiast otwierać pustą sesję.
- W powtórce wpisujemy odpowiedzi; pytanie z jawnymi wariantami zachowuje przyciski. Forma uzupełniania luk pozostaje zgodna z materiałem. Pierwsze ukończenie przystanku daje 3 ★, pełna nowa sesja powtórzenia 1 ★, wznowienie nie daje dodatkowej nagrody.

### Wspólny licznik utrwalenia

Przydzielenie nowych planów jest odłożone, gdy trwa aktywna sesja lub katalog map danego modułu jest niepełny. Samo wznowienie nie zmienia danych towarzyszących staremu zapisowi.

Błąd zapisuje element z licznikiem 0. Pierwsza poprawna próba w **ukończonej** sesji zwiększa licznik o 1, maksymalnie do 3, także w lekcji, treningu albo dobrowolnej rozgrzewce. Poprawka w tej samej sesji nie zwiększa licznika; błąd zeruje go. Zakończenie tej samej sesji nie liczy się ponownie. Licznik dotyczy dokładnego klucza elementu, w tym wersji materiału, na danym koncie; elementy różnych modułów/kursów nie łączą się przez takie samo brzmienie.

Odczyt korzysta także ze starych kolejek błędów. Nowe rozliczenie aktualizuje wspólny zapis i istniejące wpisy tego samego klucza w kolejkach etapów. Nie przeliczamy dawnych ukończonych sesji i nagród wstecz. Liczniki działają w tle, bez ostrzeżeń na ukończonych mapach. Dawne odstępy między turami tematycznej rozgrzewki i jednorazowa premia etapu pozostają; dynamiczna powtórka nie musi czekać na ich termin.

### Zaproszenia na ścieżce modułu

| Miejsce | Aktywność i warunki |
| --- | --- |
| Początek pierwszej mapy | **Kocia rozgrzewka**: dobrowolnie do 5 poznanych pytań z wcześniejszych modułów kursu. Przy pierwszym module komunikat zachęca do nowych lekcji. |
| Pomiędzy lekcjami | **Koci trening**: istniejąca wymagana lekcja technicznie oznaczona `training`. Jej ukończenie i stary identyfikator pozostają. Dodatkowy trening z zaproszenia jest dobrowolny. |
| Dwa wylosowane miejsca | **Kocia powtórka**: krótkie powroty do trudności według reguł powyżej. |
| Koniec ostatniej mapy | **Misja Kociego Mistrza**: dobrowolnie do 8 poznanych pytań bieżącego modułu, po ukończeniu wszystkich jego map. Brak mapy lub niepełne wczytanie nie otwiera finału. |

Początek i finał są również dostępne w ekranie modułu. Pozostaje osobny ekran dodatkowych rozgrzewek z wyborem kursu, modułu i tematu. Dobrowolne otwarcie/finał mają dotychczasową nagrodę dodatkowego treningu: 1 ★ za nową pełną sesję; nie zwiększają wymaganego zakresu mapy. Finał jest krótkim celebrującym zestawem, nie certyfikatem opanowania całego podręcznika.

Zaproszenia używają obecnych lokalnych kotków, pastelowych ramek i dużych przycisków z łapką; nie dodano nowych ciężkich grafik ani biblioteki. [Wygląd](01-produkt.md). Specjalne nowe pozy kotów i bardziej rozbudowany algorytm powtórek pozostają możliwością na później.

## „Kocia rozgrzewka” — D-46–D-47, podstawa wdrożenia

Nazewnictwo aktywności mapowej zostało następnie rozwinięte do „Koci trening” przez D-49 powyżej. Dawny opis nie oznacza braku nowych, opcjonalnie przydzielanych planów D-48.

### D-47 — wymagania zapisane przed kodem i wdrożone

- „Kocia rozgrzewka” zastępuje obecne treningi; nie dodajemy obok drugiego, podobnego typu lekcji.
- Rozgrzewki umieszczone na mapie są wymagane do jej ukończenia i liczą się do postępu lekcji. Dodatkowe rozgrzewki na żądanie są dobrowolne i nie zwiększają wymaganego zakresu mapy.
- Zachowujemy identyfikatory i istniejące ukończenia treningów. Zmiana nazwy i sposobu prezentacji nie otwiera ponownie zaliczonych lekcji, nie odbiera gwiazdek ani nagród. Rozpoczęte sesje zachowują swój zestaw zadań.
- Rozgrzewka na mapie pojawia się w miejscu dotychczasowego treningu. Nowe mapy planujemy z rozgrzewką po 2–3 lekcjach nowego materiału. Nie dokładamy nowych wymagań do już opublikowanej pierwszej mapy Food.
- Dobór obejmuje wyłącznie poznany materiał bieżącej i wcześniejszych map tego samego kursu, z pierwszeństwem trudniejszych pozycji i udziałem wcześniej bezbłędnych. Nie wprowadzamy przyszłego materiału. Dokładny algorytm odstępów pozostaje odłożony.
- Przy zastąpieniu treningów zachowujemy istniejące nagrody: pierwsze ukończenie rozgrzewki mapowej 3 ★, nowa pełna sesja powtórzenia 1 ★, dodatkowa rozgrzewka 1 ★. Samo wznowienie nie daje kolejnej nagrody. Dawna premia za utrwalenie etapu pozostaje oddzielnym mechanizmem i nie jest warunkiem sukcesu mapy.

**Wdrożono po zapisaniu wymagań.** Zachowano techniczną rolę `training`, klucze lekcji, format sesji i wszystkie stare ukończenia. Nazwa dla użytkownika to „Kocia rozgrzewka”. Nie dopisano nowych obowiązkowych lekcji do obecnych map Food.

**Uzgodnione 12 listopada 2026.** Ukończona mapa pozostaje ukończona, a powtórki są osobną, pozytywnie nazwaną aktywnością z krótkimi sesjami i wyraźnym zakończeniem. Celem jest poczucie sukcesu po przejściu mapy i zachęta do dalszego ćwiczenia, bez poczucia niekończących się zaległości.

### Trwałe ukończenie mapy

- Po wszystkich wymaganych lekcjach i treningach mapa ma 100%, oznaczenie ukończenia, gratulacje i informację o zdobytej nagrodzie. Pozostające lub późniejsze błędy nie cofają tego stanu.
- Nie uzależniamy pozytywnego wyglądu ukończonej mapy od wyzerowania kolejki błędów. Nie pokazujemy na niej pomarańczowych ostrzeżeń, liczników zaległych błędów ani komunikatów sugerujących niedokończoną pracę.
- Sukces mapy i ukończenie krótkiej rozgrzewki są dwoma osobnymi osiągnięciami. Dalsza potrzeba utrwalania nie podważa wcześniejszego ukończenia materiału.

### Osobna aktywność „Kocia rozgrzewka”

- Powtórki są przedstawiane jako zaproszenie do krótkiego ćwiczenia, a nie obowiązek spłacenia wszystkich błędów. Przykład tonu: „Poćwiczymy przez chwilę?”, zamiast „Masz zaległości”.
- Każda sesja ma skończony, krótki zestaw zadań i własny czytelny postęp. Po jego przejściu następuje jednoznaczny komunikat sukcesu i koniec sesji, nawet jeśli w tle pozostał materiał do kolejnych powrotów.
- Wyniki sesji nie zamieniają jej końca w kolejny komunikat o nieskończonej kolejce. Użytkownik może zakończyć naukę z poczuciem wykonania wybranej aktywności lub dobrowolnie uruchomić następną krótką sesję.
- Błędy nadal służą do doboru ćwiczeń. Wewnętrzne liczniki utrwalenia nie są prezentowane jako obowiązek trzech poprawnych odpowiedzi do odrobienia. Nie kasujemy zapisanych pomyłek tylko po to, aby pokazać sukces.
- Dostęp do rozgrzewki ma być spójny i nie powielać ostrzeżeń w wielu miejscach. Ekran rozgrzewek otwiera się ze strony głównej, modułu i mapy; nie dodano szóstego przycisku do dolnej nawigacji. Na ukończonej mapie może być neutralne, dobrowolne zaproszenie do dalszego ćwiczenia.
- Zachowujemy możliwość ćwiczenia wybranego modułu i kilku krótkich sesji pod rząd, np. przed sprawdzianem. Nie wprowadzamy obowiązku ani ograniczenia do jednej sesji dziennie; komunikat zakończenia nie oznacza wyczyszczenia całego materiału.

### Granice ustalenia i ochrona danych

Pierwsze wdrożenie korzysta z obecnych mechanizmów, bez nowego harmonogramu. Zestaw dodatkowy ma do 8 zadań (krótszy przy małej puli), mapowy zachowuje targetCount obecnego treningu, najczęściej 8, a zestaw wybranego tematu ma 1–10 zadań według zachowanej kolejki błędów. Nie narzucamy jednej sesji dziennie i nie dokładamy błędów na koniec. Wewnętrzna zasada trzech zaliczeń dla tematów pozostaje, bez pokazywania jej jako długu.

Zachowano ukończenia, gwiazdki, nagrody domku, historię, zapisane błędy i postępy. Nagrody dawnych treningów 3/1/1 ★ pozostają zgodnie z D-47. Zachowano też dawną premię 3 ★ za pełne utrwalenie etapu pierwszej mapy Food; nie staje się premią za sam pasek 100%. Dalsza zmiana tej premii wymaga osobnej decyzji.

**Stan obecny:** mapy i etapy pokazują ukończenie i gratulacje niezależnie od błędów. Nie ma na nich kafelków powtórek ani pomarańczowych liczników. Strona główna po ukończeniu map proponuje dobrowolną rozgrzewkę zamiast prowadzić do zaległości. Ekran postępów pokazuje ukończone sesje zamiast licznika rzeczy do powtórki. „Kocia rozgrzewka” ma wybór całego kursu, modułu oraz trudniejszego tematu; wyniki sesji kończą się pozytywnym komunikatem bez pozostałej kolejki.

### Kryteria wdrożenia

1. Mapa z ukończonymi lekcjami i treningami oraz niewyzerowaną kolejką błędów pokazuje 100% i sukces, bez ostrzeżeń o zaległościach.
2. Po krótkiej rozgrzewce pojawia się wyraźne zakończenie i pozytywny komunikat, również gdy materiał ma jeszcze wrócić w przyszłości.
3. Kolejna pomyłka lub rozgrzewka nie otwiera ponownie ukończonej mapy i nie odbiera nagród.
4. Kolejne sesje są dobrowolne; można ćwiczyć wybrany moduł więcej niż raz tego samego dnia.
5. Zmiana prezentacji nie usuwa zapisanych błędów, historii, ukończeń ani zdobytych gwiazdek.

## Stan obecny i różnice

| Obszar | Obecna aplikacja | Założenie docelowe |
| --- | --- | --- |
| Organizacja modułu | Food ma dwie mapy: zachowaną z 7 etapami i nową z 5 lekcjami; kod przyjmuje do 3 map | 1–3 mapy w module, każda z kilkoma lekcjami |
| Kolejka błędów | Osobna kolejka każdego etapu w każdej mapie; druga mapa Food ma jeden etap, pierwsza siedem | Lekcja powtórki błędów z lekcji i treningów danej mapy |
| Rozgrzewka (dawny trening) | Obowiązkowa na mapie w miejscu dotychczasowego treningu; dodatkowa dobrowolna. Food zachowuje obecny zestaw lekcji | Utrwalanie poznanego materiału bieżącej i wcześniejszych map, także bezbłędnego |
| Ćwiczenia swobodne | Moduł, opcja wcześniejszych modułów i globalne fiszki/quiz/gramatyka z poznanego zakresu wybranego kursu | Zakres modułowy lub poznany zakres całego wybranego kursu |
| Utrwalenie błędów | 3 zaliczenia w ukończonych turach, odstępy w turach | Zachować rozróżnienie powtórki błędów i treningu; szczegółowy algorytm wymaga decyzji |

Nie przemianowujemy automatycznie obecnych etapów na nowe mapy. Uzgodniono zachowanie obecnej mapy Food i wyników Hani (D-22); szczegóły poprawek oraz ochrony danych są w [U-03](decyzje.md#u-03).

### Food — wdrożenie etapu 4

Zachowujemy istniejącą mapę, zamiast proponowanego wcześniej podziału na trzy. Według relacji użytkowniczki pierwsze cztery części są ukończone i pozostają bez zmian. Poprawione wersje nieukończonych lekcji dotyczą wyłącznie trzech kolejnych sekcji: **„W restauracji”, „Powód i skutek”, „Koci piknik”**. Potoczne „lekcje 5–7” oznacza tu obecne sekcje/etapy, nie trzy pojedyncze techniczne lekcje.

Porównanie wykazało brak ćwiczenia posiłków, przepisu i opisu śniadania w kontekście. Druga mapa „Kocia kuchnia — Food w praktyce” uzupełnia ten zakres, zawiera cztery lekcje po 6 zadań i trening do 8 poznanych pozycji po trzech lekcjach. [Źródła, zakres i ograniczenia](wdrozenie-food.md).

Uzgodniona ochrona wyników D-24: **każda już zaliczona lekcja pozostaje ukończona, również wewnątrz sekcji 5–7, a zdobyte gwiazdki zostają na koncie**. Poprawiamy wyłącznie nieukończone lekcje. Brakujący materiał trafia na kolejną mapę, zamiast wymuszać ponowne ukończenie zaliczonych lekcji. Ochronę wdrożono przez opcjonalną aktualizację definicji lekcji, zapis jej wydania i zachowanie wszystkich starych pytań. Rozpoczęte sesje zachowują zapisany zestaw zadań; stare ukończenia nie są ponownie otwierane.

## Uzgodnione założenia docelowe

### Pokrycie materiału modułu

1. Moduł określa najważniejsze słownictwo i gramatykę z odpowiedniego działu podręcznika.
2. Jego 1–3 mapy wspólnie prowadzą przez ten wymagany zakres. Żaden wymagany element nie powinien zostać pominięty.
3. Mapy dzielą materiał na krótkie lekcje; wprowadzenia, zadania i przykłady odwołują się do tych samych jednostek materiału.
4. Ukończenie całej ścieżki oznacza przepracowanie zakresu, a nie dożywotnią gwarancję zapamiętania.

Które elementy są najważniejsze, ustala się na podstawie podręcznika i recenzji materiału, zgodnie z [merytoryką](04-merytoryka.md). Mechanizm sprawdzania pokrycia nie ocenia samodzielnie ważności słów.

### Wielkość lekcji

Zwykła lekcja ma zawierać **6–10 zadań początkowych, najczęściej 8** — zatwierdzona decyzja D-18 w [rejestrze](decyzje.md). To założenie docelowe, nie opis wielkości wszystkich bieżących lekcji Food.

Powtórka błędów zawiera **1–10 zadań początkowych**, zależnie od dostępnej kolejki — D-19. Jeśli są dwa elementy do przećwiczenia, dostaje dwa zadania, bez dokładania innych do minimum. Większa kolejka jest dzielona na krótkie sesje. Nie tworzymy pustej lekcji, gdy nie ma dostępnych zadań; sposób prezentacji pustej kolejki pozostaje kwestią interfejsu.

Trening wcześniejszego materiału zawiera **6–10 zadań początkowych, najczęściej 8** — D-20. Przy mniejszej puli dostępnego wcześniejszego materiału może być krótszy. Nie sięgamy po niepoznane treści ani nie powielamy pytań wyłącznie dla wypełnienia minimum.

Nowe sesje mają stały zestaw zadań. Błąd nie dopisuje pytania na koniec ani nie wymaga poprawnej odpowiedzi przed przejściem dalej. Użytkownik może dobrowolnie spróbować jeszcze raz przy tym samym pytaniu; pierwsza próba nadal określa wynik, a błąd trafia do osobnej powtórki. Dotyczy to także obu powtórek błędów i treningów. Rozpoczęte wcześniej sesje zachowują zapisaną listę, również dawniej dopisane pozycje, ale nie dostają nowych powrotów (D-38).

**Jedna samodzielnie oceniana odpowiedź = jedno zadanie**, bez dodatkowych wag — D-21. Wybór odpowiedzi, wpisanie słówka i uzupełnienie jednej luki w dialogu liczą się po jednym zadaniu. Sama długość tekstu dialogu nie zwiększa liczby zadań.

Przy komponowaniu zestawu o standardowym zakresie 6–10 zadań dobieramy liczbę bliższą 6 dla dłuższych zadań, a 8–10 dla krótkich. Powtórka może mieć np. dwa elementy, a trening być krótszy przy małej puli. Założenia [U-02](decyzje.md#u-02) są rozstrzygnięte. Walidacja kontroluje 6–10 zadań zwykłej lekcji nowych nazwanych map i poprawionego wydania lekcji. Etap 4 nadał nieukończonym lekcjom etapów 5–7 Food wielkość 6–8; wcześniejsze etapy i oryginalne wersje ukończonych lub rozpoczętych lekcji pozostają krótsze.

### Rola lekcji

| Rola | Zakres i cel |
| --- | --- |
| Poznawanie i ćwiczenie | Wprowadzenie oraz sprawdzenie materiału bieżącej mapy |
| Rozgrzewka na mapie (dawny trening) | Utrwalanie poznanego materiału wcześniejszych lekcji bieżącej mapy oraz wcześniejszych map tego samego kursu |
| Powtórka błędów | Przepracowanie błędów z lekcji i treningów mapy, w której te działania się odbyły |

Rola nie określa jednego formatu pytania: lekcja może łączyć słownictwo i gramatykę oraz różne sposoby odpowiadania. Odpowiedź otwarta lub zamknięta to osobny wymiar [mechaniki](02-mechanika.md).

### Powtórka błędów a trening

**Powtórka błędów** reaguje na konkretne pomyłki. Błąd w treningu na mapie B pochodzi z działania na mapie B, nawet jeśli ćwiczone słowo wprowadzono na mapie A. Odwołanie do oryginalnego materiału pozostaje zachowane.

**Trening** zapobiega zapominaniu całego poznanego zakresu. Jego kandydatami są również słowa i reguły, na które użytkownik wcześniej odpowiadał bezbłędnie. Sama lista błędów nie wystarcza jako źródło treningu.

Trening ma **łączyć słownictwo i gramatykę zależnie od dostępnego materiału, bez sztywnych proporcji** (D-28). Gdy oba rodzaje są dostępne w dozwolonym poznanym zakresie, korzystamy z obu. Jeśli dostępny jest tylko jeden rodzaj, trening może zawierać wyłącznie jego zadania. Nie wprowadzamy nowego materiału tylko po to, by uzyskać sztuczny podział pół na pół. Proporcji nie należy mylić z ustaleniem algorytmu częstotliwości powracania poszczególnych elementów — ten nadal wymaga decyzji.

**Pierwszeństwo doboru jest zatwierdzone (D-29):** trudne i dawno niećwiczone elementy powinny wracać częściej, a bezbłędne rzadziej, ale regularnie. Trening nie może ograniczać się do kolejki błędów ani stale pomijać wcześniej bezbłędnego materiału. Nie ustalono sztywnych udziałów ani wzoru rozstrzygającego między trudnym świeżym elementem a łatwym dawno niećwiczonym.

Rozgrzewka nie wprowadza niepoznanego materiału przyszłych lekcji ani map. D-47 rozszerza zakres dawnego treningu także o wcześniejsze lekcje bieżącej mapy. **Mapę zaczynamy od nowego materiału; pierwszy trening umieszczamy po 2–3 lekcjach nowego materiału, jeśli jest już poznany materiał z wcześniejszych lekcji lub map** (D-30). **Kolejne treningi pojawiają się co 2–3 lekcje nowego materiału**, zależnie od długości mapy i dostępnego materiału. Konkretne pozycje i liczbę treningów ustalamy przy układaniu danej mapy zgodnie z tym rytmem. Nie zaczynamy kolejnej mapy od obowiązkowego treningu wcześniejszego zakresu. Gdy nie ma jeszcze materiału z wcześniejszych map, nie tworzymy pustego treningu. Pozostałe kwestie treningów opisuje [U-05](decyzje.md#u-05); wybór algorytmu i odstępów odłożono na później (D-29). Pierwsza mapa Food nie ma treningów mapowych; druga ma trening wcześniejszego materiału po trzech lekcjach.

**Dodatkowy trening na żądanie jest zatwierdzony (D-27):** obok treningów na mapie użytkownik może uruchomić go bez czekania na termin, także kilka razy jednego dnia, np. przed sprawdzianem. Nadal obowiązuje dozwolony zakres wcześniej poznanego materiału tego kursu i wielkość z D-20. Funkcja jest wdrożona; nagrodę 1 ★ określa D-34. Nie wybrano jeszcze docelowego algorytmu ani sposobu aktualizowania przyszłego harmonogramu po dodatkowej sesji.

### Ukończenie mapy — D-32

Ukończenie mapy wymaga ukończenia wszystkich jej zwykłych lekcji i umieszczonych na niej treningów. W docelowym liczniku ukończenia i pasku postępu trening na mapie liczymy jako lekcję wymaganą; dodatkowy trening na żądanie jest dobrowolny i nie powiększa tego zakresu. Powtórki błędów nie blokują ukończenia mapy ani osiągnięcia 100% postępu lekcji. D-46–D-47 przenoszą doświadczenie powtórek do „Kociej rozgrzewki” i usuwają ostrzeżenia o zaległościach z ukończonej mapy.

Mechanizm działa na drugiej produkcyjnej mapie Food: trening po trzech zwykłych lekcjach jest wymagany do jej ukończenia. Pierwsza mapa Food pozostaje bez treningów mapowych, a zapisane ukończenia i zdobyte gwiazdki są zachowane. Nagrodę za trening na mapie określa D-33; warunki premii za utrwalenie nowych map pozostają osobną decyzją.

Wszystkie dostępne mapy, ich etapy i lekcje można otwierać niezależnie od wcześniejszych ukończeń. Kolejność i „Kontynuuj naukę” są rekomendacją, nie blokadą (D-39). Przy pustej puli treningu ekran „Przygotuj się do rozgrzewki” wskazuje zwykłą lekcję wcześniejszej mapy lub wcześniejszą lekcję bieżącej mapy i pozwala ją otworzyć przyciskiem „Poznaj wcześniejszy materiał”. Po odpowiedziach w tej lekcji można wrócić przez katalog do treningu. Samo wprowadzenie nie daje poznania ani nagrody. Jeśli wcześniejsza mapa jest niedostępna, można przygotować materiał we wcześniejszej lekcji bieżącej mapy. Jeśli nie ma żadnego źródła, ekran proponuje ponowienie wczytania zamiast pustej sesji. Nie wprowadzono automatycznej blokady drugiej mapy ani zastępowania treningu niepoznanym materiałem. [Szczegóły i ochrona wyników](odpornosc-map.md).

### Zakres ćwiczeń swobodnych

| Zakres | Z czego dobieramy materiał |
| --- | --- |
| Moduł | Z wybranego modułu: fiszki, quizy i gramatyka dotyczą jego materiału |
| Globalny w kursie | Z dotychczas poznanego materiału wybranego kursu; również bez wcześniejszych błędów |

Zakres globalny nie obejmuje automatycznie niepoznanych przyszłych treści ani innych kursów. **Element uznajemy za poznany po pierwszej próbie odpowiedzi na dotyczące go zadanie — również błędnej** (D-25). Nie trzeba ukończyć całej lekcji, ale samo obejrzenie wprowadzenia nie wystarcza. Poznanie jest określane dla danego konta i kursu; nie oznacza poprawności ani utrwalenia.

Po takiej próbie element może wejść do poznanego zakresu globalnych ćwiczeń. Przy rozgrzewce na mapie zakres ograniczamy do materiału wcześniejszych lekcji bieżącej mapy i wcześniejszych map. Dodatkowy trening uruchamiany poza mapą korzysta z poznanego zakresu kursu; to roboczy zakres pierwszego wdrożenia opisany w raporcie.

Uwzględniamy również **wcześniejsze zapisane próby odpowiedzi, także ze starszej historii**, niezależnie od poprawności (D-26). Użytkownik nie musi od nowa poznawać elementów tylko z powodu wprowadzenia tej zasady. Odtworzenie poznanego zakresu nie zmienia ocen, ukończonych lekcji ani zdobytych gwiazdek. Poznanie jest wdrożone w etapie 3 przez wspólny odczyt prób i znacznik `encountered`. Nie znika po zastąpieniu niedokończonej sesji i nie zmienia ocen, ukończeń ani gwiazdek — [opis zakresów](wdrozenie-zakresow.md).

Globalne fiszki obejmują także poprawnie znane słówka, podczas gdy modułowe zachowują dotychczasowe pomijanie zaliczonych. Globalny quiz obejmuje pytania o poznane znaczenia i pytania już próbowane; globalna gramatyka tylko konkretne próbowane zadania. Znajomość jednej reguły nie odblokowuje automatycznie niepoznanych zadań. Jawne warianty z pytania pozostają przyciskami; słownikowe opcje globalne korzystają z poznanego zakresu, a przy zbyt małej puli wymagane jest wpisanie. Globalne sesje nie zaliczają map i nie przyznają nowych gwiazdek.

### Wynik, błędy i nagrody

#### Rozumienie gramatyki — D-31

Po poprawnej i po błędnej odpowiedzi na zadanie gramatyczne wyjaśnienie ma wskazać **dlaczego** dana forma pasuje lub nie pasuje do konkretnego zdania. Odwołuje się do reguły i jej zastosowania w kontekście, zamiast wyświetlać wyłącznie gotową poprawną odpowiedź. Po błędzie użytkownik ma rozumieć, jaka zasada prowadzi do poprawki; po sukcesie również otrzymuje uzasadnienie.

Celem jest rozumienie gramatyki, a nie odtwarzanie zapamiętanych odpowiedzi. Konkretne wyjaśnienia należą do merytoryki kursu i muszą być adekwatne do zdania oraz języka objaśnień. Obecnie tekst pochodzi z `explanation` danego zadania i jest wyświetlany po odpowiedzi poprawnej i błędnej; przy `ruleId` dostępne jest rozwijane przypomnienie reguły. Wyjaśnienie jest przygotowane wcześniej, nie generowane dla konkretnej pomyłki. Nie zatwierdzono analizy dowolnej odpowiedzi przez AI podczas nauki.

Zachowujemy rozróżnienie pierwszej próby, poprawki, ukończenia lekcji oraz utrwalenia materiału. Gwiazdki służą motywacji, nie są dowodem znajomości całego modułu.

#### Historia prezentacji postępów — D-23, zastąpiona przez D-46

Poniższa tabela zachowuje wcześniejsze ustalenie. Nie opisuje już obecnego interfejsu: wdrożono D-46–D-47 przedstawione na początku dokumentu. Gratulacje za ukończenie mapy nie wymagają wyzerowania błędów.

| Informacja | Prezentacja |
| --- | --- |
| Ukończenie lekcji w pokazywanym zakresie | Pasek lub kółko postępu oraz czytelny licznik ukończeń; 100% po ukończeniu wszystkich lekcji ścieżki, bez oczekiwania na powtórki |
| Pozostałe błędne elementy do utrwalenia | Pomarańczowa informacja, np. „5 ćwiczeń do utrwalenia”, zamiast ogólnego „12% utrwalenia” |
| Wszystkie lekcje ukończone, ale pozostają błędy | Nadal 100% ukończenia lekcji oraz pomarańczowa liczba zaległości |
| Wszystkie lekcje ukończone i brak zaległości | 100%, zero ćwiczeń do utrwalenia, zielone oznaczenia i komunikat „Wszystko utrwalone. Gratulacje!” |

Liczba zaległości oznacza liczbę elementów, które nie osiągnęły wymaganych trzech zaliczeń, a nie liczbę wszystkich pozostałych odpowiedzi do wpisania. Po jednym zaliczeniu element nadal jest zaległy; znika po osiągnięciu 3/3. Pusty zbiór błędów nie daje automatycznie ukończenia nieprzerobionych lekcji.

Licznik zawsze musi nazywać tę jednostkę, którą faktycznie liczy: np. „sekcje” przy agregacji etapów, „lekcje” przy agregacji technicznych lekcji. Siedem obecnych etapów Food nie jest siedmioma technicznymi lekcjami. Dokładny poziom agregacji na ekranach pozostaje w U-07; procent nie miesza ukończeń z liczbą utrwalonych błędów. Food pokazuje liczbę technicznych lekcji i ukończenia etapów. D-46–D-47 usuwają osobne zaległości z tych podsumowań.

**Obecne liczby:** 3 gwiazdki za pierwsze ukończenie lekcji, również treningu na mapie. Dodatkowe 3 za ukończone lekcje etapu i pełne utrwalenie jego kolejki dotyczą zachowanej pierwszej mapy Food. Nowe nazwane mapy, w tym „Kocia kuchnia”, nie otrzymują tej premii. Powtórki nie blokują dalszych lekcji. Odznaka kociego kucharza pozostaje związana z ukończeniem pierwszej mapy i nie jest odbierana po dodaniu drugiej.

**Nagroda za trening na mapie (D-33):** 3 gwiazdki za pierwsze ukończenie danego treningu. Zasadę braku nagrody za powtarzanie zmienia D-40: każda nowa, w całości ukończona sesja powtórzenia lekcji lub treningu na mapie daje 1 gwiazdkę. Zasada obowiązuje w kontekście konta i kursu; nie zmienia wcześniej zdobytych gwiazdek. **Dodatkowy trening na żądanie (D-34) daje 1 gwiazdkę za ukończenie każdej nowej sesji.** Wznowienie lub ponowne przetworzenie ukończenia tej samej sesji nie daje kolejnej nagrody. Reguły są wdrożone. W obu przypadkach odświeżenie, wznowienie i ponowne przetworzenie tej samej sesji nie daje kolejnej gwiazdki. Pierwsze ukończenie lekcji nadal daje 3, a premia etapu ma dotychczasowe warunki. Przerwanie sesji nie daje nagrody; wcześniejsze ukończenia, oceny i gwiazdki pozostają bez przeliczenia.

Docelowy sposób prezentacji postępu opisano wyżej (D-23), ale nie zmienia on samoczynnie zasad nagród. Nie zakładamy, że stara premia etapu staje się premią każdej nowej mapy ani że sam pasek 100% daje premię utrwalenia — [U-07](decyzje.md#u-07).

## Rozbudowa kociego domku — wdrożona dla Food

Osobny domek i portfel gwiazdek dla każdego konta i kursu. Ukończenie pojedynczej mapy odblokowuje wyposażenie do zakupu za gwiazdki, a ukończenie wszystkich map modułu daje jeden pokój. Powtórki błędów nie blokują ukończenia ani tej nagrody. D-41 i D-42 nie zmieniają liczby gwiazdek za naukę; obecne gwiazdki i zakupy zostają przypisane do angielskiego. Dla Food wdrożono kuchnię i osiem nowych dekoracji. [Pełne wymaganie i wdrożenie Food](koci-domek.md).

## Algorytm treningu — wybór odłożony na później

Na prośbę użytkowniczki wybór konkretnego algorytmu odkładamy (D-29). Uzgodnione są cel i pierwszeństwo doboru: trudne i dawno niećwiczone częściej, bezbłędne rzadziej, ale regularnie. Poniższe rozwiązania pozostają jedynie kandydatami do późniejszej oceny, nie planem wdrożenia.

**Obecny dobór techniczny** w `src/learning/training.ts` wybiera mniej ćwiczone elementy, obniża ich wynik rankingowy przy oznaczeniu trudności, a przy remisie uwzględnia starszą datę próby. Dane z podsumowania archiwum nie mają daty ostatniej próby i są traktowane jak najstarsze. Nie jest to harmonogram terminów ani gwarancja określonych odstępów dla każdej pozycji; docelowa regularność z D-29 pozostaje wymaganiem przyszłego algorytmu.

Oddzielamy trzy decyzje: co wchodzi do puli, kiedy element powinien wrócić i jak z puli powstaje krótka lekcja. Sam algorytm odstępów nie rozwiązuje wszystkich trzech.

| Kandydat | Co wnosi | Co trzeba rozstrzygnąć |
| --- | --- | --- |
| Prosty harmonogram według sesji/tur | Łatwe ćwiczenie kilka razy jednego dnia | Odstępy, równomierne pokrycie, udział trudnego i bezbłędnego materiału |
| SM-2 | Gotowy algorytm odstępów czasowych i trudności elementu | Dopasowanie jakości odpowiedzi oraz treningu na żądanie |
| FSRS | Modelowanie pamięci i terminów kolejnych powtórek | Dane wejściowe, interpretacja wyniku i współpraca z lekcjami na mapie |

Źródła do późniejszej oceny: [opis SM-2](https://super-memory.com/english/ol/sm2.htm), [algorytm FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm). Nie wybrano ani nie wdrożono żadnego z nich dla nowego treningu. Obecne odstępy kolejki błędów nie są wdrożeniem SM-2 ani FSRS.

Dostępność dodatkowego treningu przed sprawdzianem, bez czekania na termin i także kilka razy dziennie, zatwierdzono w D-27. Algorytm doboru materiału i wpływ dodatkowej sesji na harmonogram pozostają częścią [U-05](decyzje.md#u-05). Nie ma decyzji o czekaniu określonej liczby dni przed odblokowaniem kolejnej lekcji.
