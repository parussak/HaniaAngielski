# Stan aplikacji po audycie

Aktualizacja: 9 listopada 2026 r.

Bieżący materiał: moduł 2 Food, 97 fiszek, 156 zadań i 9 zasad. Treści są oddzielone od kodu w public/content/02-food.

Aktualizacja zestawów: „Fiszki podstawa” zawierają 38 haseł z ramek Vocabulary na s. 25, 27 i 29. Drugi wybór „Fiszki” zachowuje wszystkie 97 haseł. Lista podstawowa jest edytowalna w `basicFlashcardIds` pliku `modul.json`. Nie usunięto słów ani wyników; oba zestawy współdzielą status tych samych słów. Quizy i gramatyka zachowują poprzedni zakres.

Poprawki obejmują trwałe powtórki błędów i fiszek, pierwszeństwo trudnych i nowych elementów, pomijanie znanych fiszek, tasowanie opcji stałe po wznowieniu oraz tolerowanie drobnych różnic interpunkcyjnych. Zachowano wszystkie identyfikatory. Postęp zależy od opcjonalnego rev elementu (domyślnie 1), a nie wersji modułu. Nie zmieniono nazwy bazy IndexedDB ani formatu kopii.

Na małym ekranie pytanie i działania zajmują ekran bez dużego nagłówka; dłuższe wyjaśnienie można przewijać wewnątrz karty. Poprawiono etykiety, fokus, kontrast i rozmiar tekstu, skrócono objaśnienia, poprawiono źródła. Czcionki są systemowe, dodano koci favicon. Manifest pominięto do czasu sprawdzenia danych na iOS.

Aktualizacja aktywnych fiszek: oba zestawy wymagają odpowiedzi (wybór, wpisywanie lub tryb mieszany). Sposób odpowiedzi wybiera się przed dotknięciem kafelka. Każdy kafelek od razu zaczyna sesję; usunięto osobny przycisk startu na dole. Zakres wcześniejszych modułów i źródła są rozwijane. Błąd pokazuje poprawną odpowiedź i wyjaśnienie, umożliwia poprawę i zapisuje trudność do kolejnej sesji. Nowe wyniki fiszek obejmują pierwsze próby i poprawki; stare wyniki, kopie i identyfikatory pozostają obsługiwane.

Ilustracje po odpowiedzi: 97 słówek (oraz odpowiadające im quizy) i 59 zadań gramatycznych mają ilustrację z podpisem. Wykorzystano kolorowe piktogramy i własne lokalne rysunki SVG produktów. Ilustracja jest widoczna od początku pytania i podczas poprawy w fiszkach, quizach, gramatyce i powtórkach. Podpis jest pokazywany dopiero po sprawdzeniu odpowiedzi. W 26 zadaniach z wariantami w nawiasie wymuszono odpowiedzi zamknięte, także w trybie wpisywania i starszych sesjach. Pole `illustration` i opcjonalne `responseType` edytuje się w treści.

Po błędzie we wszystkich trybach pokazujemy „Twoja odpowiedź” i „Poprawna odpowiedź”, z podkreśleniem oraz kolorem odmiennych fragmentów. Porównanie wybiera najbliższy akceptowany wariant i uwzględnia tolerancję oceniania. Ostatnia odpowiedź jest zapisywana osobno w opcjonalnym `lastAnswer`; `answer` oraz pierwszy wynik pozostają zachowane. Stare kopie nadal są obsługiwane; gdy nie zawierają ostatniej poprawki, widok wyjaśnia brak tego zapisu. Poprawiono również spacje przy ukrywanych na telefonie podziałach wiersza na stronie głównej.

Dodano opcjonalne konto Firebase (projekt `male-kroki-nauka`), logowanie e-mail/hasło, rejestrację i odzyskanie hasła. Każde konto ma osobną pamięć lokalną. Wyniki zapisują się najpierw lokalnie, potem są synchronizowane wersjonowaną transakcją Firestore. Konflikt zatrzymuje nadpisanie i umożliwia wybór wersji z zachowaniem kopii. Przeniesienie dotychczasowych wyników gościa jest jawne. Instrukcja uruchomienia i ograniczenia: [firebase.md](../firebase.md). Użytkowniczka potwierdziła włączenie usług, publikację reguł i działający zapis Firebase na dwóch urządzeniach.

Dodano PWA z ikoną kotka, manifestem i pobraniem wszystkich publicznych materiałów, ilustracji i kodu do pracy bez sieci. Aktualizacja czeka na wybór użytkownika i nie usuwa wyników. Po ponownym połączeniu synchronizacja konta działa w otwartej aplikacji lub przy kolejnym uruchomieniu. Szczegóły: [pwa.md](../pwa.md). Powiadomienia push i natywny widżet nie są częścią tej zmiany.

Dodano ustawienia wielu kont: imię przy rejestracji i edycji profilu, spersonalizowane powitanie i podsumowanie, zmianę konta, zmianę hasła po ponownym uwierzytelnieniu oraz zmianę e-maila przez link potwierdzający. Profile i lokalne wyniki są oddzielone według UID. Reguły Firestore pozostają bez zmian. Testy zarządzania kontem korzystają z atrapy SDK, nie wysyłają prawdziwych wiadomości i nie zmieniają rzeczywistych haseł.

Dodano zaakceptowaną kocią ekipę: Albert, Oluś, Felix, Maja i Krzywołap. 25 wariantów jest zapisanych w trzech planszach PNG i katalogu kadrów, niezależnie od kodu strony. Nauczyciele pojawiają się po błędzie, zadowolone lub świętujące kotki po poprawnej odpowiedzi, a dwie zabawne scenki każdej postaci na końcu sesji. Losowanie jest stałe dla danej odpowiedzi i nie powtarza postaci w sąsiednich pytaniach. Ilustracje jedzenia pozostają osobno, a kotki działają offline. Dokumentacja: [public/cats/README.md](../../public/cats/README.md).

Weryfikacja po aktualizacji: 50 testów jednostkowych, check:content i build poprawne; 35 testów zbudowanej aplikacji pod /HaniaAngielski/. Sprawdzono 320×640, 360×740, szerokości 390 i 430 oraz 844×390, wczytanie starej kopii bez zmiany jej danych, oba zestawy i kontrast sprawdzanych tekstów.

Testy domyślnie korzystają z Chromium, Edge jest dostępny przez zmienną środowiskową. Osobny CI sprawdza push i pull request; GitHub Pages publikuje push na main i umożliwia uruchomienie ręczne.

Wcześniejsza wersja działa na GitHub Pages. Tych poprawek nie commitowano, nie wysyłano ani nie publikowano. Nie sprawdzono fizycznego telefonu, czytników ekranu ani Linux/macOS. Nie dodano automatycznego importu PDF. PWA wymaga pierwszego pobrania z siecią; fizyczna instalacja na telefonie nie została sprawdzona. Próby kont w przeglądarce korzystają z testowego adaptera sieciowego; użytkowniczka potwierdziła także działający rzeczywisty zapis Firebase po konfiguracji.

Szczegółowy raport: [raport-poprawek-audyt.md](raport-poprawek-audyt.md). Instrukcja treści: [public/content/README.md](../../public/content/README.md).

## Kocia mapa, domek i części historii

Dodano siedem etapów Food i 41 lekcji, obejmujących wszystkie 97 słówek i zadania gramatyczne/rozmówki. Lekcja zaczyna się od słówek lub przykładów reguł, potem przechodzi do ćwiczeń. Pierwsze ukończenie daje 3 gwiazdki; dodatkowe 3 przysługują za domknięty etap z 100% utrwalenia powtórki. Dawna premia dzienna jest wyłączona, bez odebrania zdobytych wcześniej gwiazdek. Sześć dekoracji domku można kupować, ustawiać, zamieniać i chować. Postęp i zakupy są częścią zapisu konta i kopii, a własny trening pozostaje dostępny. Szczegóły: [kocia-przygoda.md](../kocia-przygoda.md).

Starsze pełne sesje są zachowane w niezmiennych częściach lokalnych i chmurowych. Bieżąca migawka przechowuje najwyżej 30 ostatnich sesji, podsumowania oraz początek łańcucha historii. Import/eksport uwzględnia pełne archiwum, a stare kopie pozostają zgodne. Sprawdzono migrację 1500 sesji, błędy zapisu, integralność części, statystyki i kolejność wysyłania. Przy pobraniu starego dużego zapisu konta migracja odbywa się automatycznie. [historia.md](../historia.md).

Weryfikacja tej wersji: 65 testów jednostkowych i 41 testów zbudowanej aplikacji przeszło. Sprawdzono zakup po ukończeniu lekcji, brak podwójnej nagrody, ustawienie po odświeżeniu, kopie na drugim urządzeniu, odrębność kont, testową synchronizację domku, naukę i domek offline oraz układ mobilny. Adapter konta w testach jest atrapą; nie tworzono rzeczywistych kont ani nie publikowano reguł. Gotowe pliki strony: 4 138 399 bajtów, wzrost o 55 942 bajty (1,37%) względem poprzedniej wersji. Wszystkie siedem nowych grafik domku to łącznie 3374 bajty SVG.

**Przed publikacją strony użytkowniczka musi opublikować aktualną zawartość `firestore.rules` w konsoli Firebase.** Reguły dodają prywatne części historii; stara reguła bieżącego zapisu jest zachowana. Nie wykonano commita, pushu ani zdalnego wdrożenia reguł.

## Powtórki etapów do 3/3

Każdy etap mapy ma osobny, nieblokujący kafelek „Powtórka”. Zbiera błędy tylko z lekcji tego etapu. Poprawne pierwsze próby w ukończonych turach zwiększają serię do 3/3; po pierwszym sukcesie pozycja pomija jedną turę, po drugim dwie. Jeśli wszystkie czekają, wybierana jest najbliższa niepusta tura. Samo uruchamianie, przerwanie ani natychmiastowa poprawka nie zwiększają serii. Błąd zapisuje się od razu i zeruje serię.

Zwinięte etapy i podstawowy podgląd Food pokazują procent pełnego utrwalenia i liczbę pozostałych słówek/zadań. Wszystkie lekcje ukończone + brak zaległych pozycji daje jednorazowo 3 ★ za etap. Następny etap nie jest blokowany, a nowy błąd nie odbiera gwiazdek ani nie pozwala ponownie zdobyć tej samej premii. Etap bez błędów dostaje premię po ostatniej lekcji.

Starsze błędy lekcji są odtwarzane z ostatnich sesji i jednorazowo ze starszych części historii. Kursor doczytywania jest zapisywany, nauka pozostaje dostępna offline, a premie etapów czekają na kompletne sprawdzenie starej historii. Nie zmieniono reguł ani struktury dokumentów Firebase. Zapis, kopie i rozstrzyganie konfliktów obejmują nowe liczniki.

Weryfikacja aktualizacji: 75 testów jednostkowych i 44 przeglądarkowe przeszły; build i kontrola treści poprawne. Sprawdzono zakres etapu, reset serii, brak podwójnego naliczania, nieblokowanie lekcji, stare kopie/archiwum, mobilny układ, prawdziwy tryb offline PWA oraz synchronizację licznika między dwoma testowymi urządzeniami i rozdzielenie kont. Cała strona ma około 4,148 MB; aktualizacja dodała około 9,9 KB bez nowych grafik. Synchronizacja w testach korzysta z atrapy adaptera, nie zmienia rzeczywistych kont. Zmiany pozostają lokalne, bez commita i pushu.

Dodano osobny tryb Rozmówki: 12 nowych krótkich dialogów z jedną luką, utworzonych w zakresie słownictwa i gramatyki Food, z oznaczeniem adaptacji. Wybór i wpisywanie, porównanie błędnej odpowiedzi, wznowienie, kopie i synchronizacja korzystają z dotychczasowego mechanizmu. Nowy plik treści: `public/content/02-food/rozmowki.json`. Wszystkie ilustracje zastąpiono spójnymi pastelowymi SVG, a zadania gramatyczne mają scenki przedstawiające sytuację zdania zamiast samego emoji. Identyfikatory i rewizje dotychczasowych zadań pozostały bez zmian.
