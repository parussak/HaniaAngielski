# Wdrożenie uzgodnionych zasad nauki

10 listopada 2026. Pozostałe pytania produktowe zostały zaparkowane, a implementacja zatwierdzonych zasad jest dozwolona (D-34). Ten raport oddziela wdrożenie od docelowych wymagań i historycznego punktu odniesienia.

## Zakres prac

- Czytelny postęp ukończenia lekcji i osobna liczba ćwiczeń do utrwalenia, bez ogólnego procentu utrwalenia.
- Oddzielny mechanizm treningów: poznany zakres, trening na mapie i dodatkowy trening na żądanie; nagrody 3 i 1 gwiazdka.
- Przygotowanie obsługi kilku map w module, z zachowaniem identyfikatorów dotychczasowej mapy Food.
- Ochrona starych kopii, aktywnych sesji, ukończeń, gwiazdek i historii.

## Granice

Nie wybrano algorytmu odstępów ani nowych kryteriów oceniania językowego. Obecna mapa Food nie jest dzielona na inne mapy. Nowe podręczniki i kursy nie są dopisywane bez materiałów. Dokładne poprawki treści Food i ewentualna dodatkowa mapa wymagają osobnego porównania z podręcznikiem; nie uznajemy automatycznie, że brakuje konkretnego materiału.

## Co działa

- Procent/pasek dotyczy ukończenia lekcji. Zaległe błędy mają osobną pomarańczową liczbę ćwiczeń; nie obniżają procentu ukończenia. Wszystkie lekcje i brak zaległości oznaczają zielony stan z gratulacjami. Brak błędów przed nauką nie oznacza ukończenia. W trakcie pobierania starszych błędów nie pokazujemy przedwczesnego pełnego utrwalenia.
- Dodatkowy trening jest dostępny z mapy i z ćwiczeń swobodnych. Obejmuje wcześniej poznane słownictwo i gramatykę tego samego kursu, również bezbłędne. Poznanie wynika z pierwszej próby, także błędnej i w niedokończonej sesji. Uwzględniane są stare próby z podsumowania archiwum, bez pobierania wszystkich zdjęć czy całej surowej historii.
- Trening ma zwykle 8 zadań; przy małej puli jest krótszy, bez duplikowania tego samego znaczenia jako fiszki i quizu. Sposób odpowiadania pozostaje wyborem użytkownika; jawnie podane warianty w pytaniu zawsze oznaczają przyciski.
- Każda nowa ukończona sesja dodatkowego treningu daje 1 ★. Wznowienie lub ponowne przetworzenie tego samego ukończenia nie daje drugiej gwiazdki. Znacznik nagrody jest w sesji i podlega istniejącej archiwizacji; nie dodano nieograniczonej listy identyfikatorów nagród.
- Rola treningu na mapie dobiera wyłącznie poznany materiał wcześniejszych map tego samego kursu, jest wymagana do ukończenia mapy i daje 3 ★ tylko za pierwsze ukończenie. Sprawdzono to na testowej drugiej mapie; nie dopisano treningów do pierwszej mapy Food.
- Metadane modułu przyjmują uporządkowaną listę 1–3 map. Nowe mapy mają osobne identyfikatory i klucze ukończeń, a stare Food zachowuje wszystkie dotychczasowe klucze. Walidacja nowych nazwanych map wymaga 6–10 zadań zwykłej lekcji; krótsze stare lekcje Food nadal działają.
- Kontrola materiałów sprawdza również pliki map, istnienie ilustracji i pozycje treningów po 2–3 lekcjach nowego materiału. Nie dodaje treningów automatycznie i nie ocenia językowej poprawności treści.
- Gramatyka po dobrej i błędnej odpowiedzi pokazuje istniejące wyjaśnienie pod nagłówkiem „Dlaczego tak?” i pozwala rozwinąć przypisaną regułę z przykładami. Nie generuje analizy dowolnej odpowiedzi przez AI i nie zastępuje recenzji merytorycznej.

## Rozdzielenie odpowiedzialności

- `src/learning/training.ts`: poznany zakres, dobór zadań i kontrola rozmieszczenia treningów. Nie zależy od DOM ani Firebase.
- `src/learning/map-progress.ts`: ukończenie lekcji i komunikaty o zaległościach, osobno od oceniania.
- `src/learning/scope.ts`: granica kursu i język polecenia. Nowe podręczniki mogą deklarować osobne `courseId` i `languageCode`. Stare pliki mają zgodny wstecznie zakres według języka; przy dodawaniu nowych książek należy przypisać jawne identyfikatory kursu i globalnie unikalne identyfikatory modułów.
- Materiał nadal jest w `public/content/`; żadnych słówek ani reguł językowych nie przeniesiono do algorytmu treningu.

## Robocze rozwiązania, które nie zamykają zaparkowanych pytań

- Dobór nie jest harmonogramem powtórek: nie ma terminów ani wybranego SM-2/FSRS. W pierwszym wdrożeniu pierwszeństwo mają pozycje mniej ćwiczone, z dodatkowym pierwszeństwem trudnych; przy remisie starsza ostatnia próba. Bezbłędne pozycje pozostają dostępne. To wymienna polityka doboru, nie zatwierdzony docelowy algorytm. Starsza zagregowana historia nie ma dokładnego czasu każdej odpowiedzi, więc nie udajemy znajomości takich dat.
- Dodatkowy trening uruchamiany poza mapą obejmuje poznany zakres kursu, w tym już ćwiczone elementy bieżącej pierwszej mapy. Trening będący lekcją na mapie ma węższy zakres wcześniejszych map. Rozróżnienie pozwala używać dodatkowego treningu już przy obecnym Food.
- Stare premie etapów Food pozostają. Nowe nazwane mapy nie dziedziczą automatycznie premii utrwalenia — ta zasada nadal jest zaparkowana.
- Nie zmieniono oceniania akcentów, rodzajników i wariantów odpowiedzi. Nie dodano interfejsu wyboru kursu ani osobnych aktywnych sesji dla każdego kursu.

## Czego ten etap nie wdraża

- Pełnego modelu kursów i znaczeń z wariantami językowymi oraz gotowych kursów francuskiego i włoskiego.
- Globalnych fiszek, quizu i gramatyki ograniczonych do poznanego zakresu; dodatkowy trening jest osobnym wejściem i nie zastępuje wszystkich tych trybów.
- Korekty treści nieukończonych sekcji 5–7 Food ani dodatkowej produkcyjnej mapy: trzeba najpierw wskazać konkretne braki po porównaniu z podręcznikiem. Obecna mapa już wskazuje wszystkie 97 obecnych haseł i wszystkie istniejące zadania gramatyczne oraz dialogowe; nie jest to dowód kompletności względem całego podręcznika.
- Przebudowy istniejących etapowych kolejek Food na jedną wspólną kolejkę każdej przyszłej mapy. Obsługa kilku etapów nowych map zachowuje obecnie etapowy podział błędów.

## Sprawdzenie

- Testy Node: **100/100**, w tym nowe scenariusze treningów, starszej historii, rewizji, zakresów kursu, nagród, rozmieszczenia lekcji i zachowania postępów.
- Gotowa wersja na ścieżce `/HaniaAngielski/`: **57/57 testów Playwright w Chrome**, bez pominięć. Obejmują małe ekrany, nawigację drugiej mapy testowej, import/eksport, wznowienie, konta i konflikty, rzeczywisty service worker oraz zimny start offline.
- Nowy scenariusz PWA kończy dodatkowy trening offline, odświeża aplikację i sprawdza wysłanie dokładnie jednej gwiazdki po odzyskaniu połączenia. Firebase jest w tych testach zastąpiony adapterem testowym; nie wykonano zmian na prawdziwym koncie Hani.
- Budowanie i kontrola materiałów przechodzą. Bez nowych bibliotek, obrazków ani zmian reguł Firebase; główny kod po kompresji około 40,5 kB, oddzielnie ładowany Firebase około 172,3 kB. Service worker nadal obejmuje 195 plików.
- Nie zmieniono produkcyjnych plików JSON Food, identyfikatorów materiałów ani wcześniej zapisanych wyników. Nie wykonano publikacji na GitHub Pages.
