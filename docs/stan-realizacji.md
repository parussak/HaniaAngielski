# Stan aplikacji po audycie

Aktualizacja: 9 listopada 2026 r.

Bieżący materiał: moduł 2 Food, 97 fiszek, 156 zadań i 9 zasad. Treści są oddzielone od kodu w public/content/02-food.

Aktualizacja zestawów: „Fiszki podstawa” zawierają 38 haseł z ramek Vocabulary na s. 25, 27 i 29. Drugi wybór „Fiszki” zachowuje wszystkie 97 haseł. Lista podstawowa jest edytowalna w `basicFlashcardIds` pliku `modul.json`. Nie usunięto słów ani wyników; oba zestawy współdzielą status tych samych słów. Quizy i gramatyka zachowują poprzedni zakres.

Poprawki obejmują trwałe powtórki błędów i fiszek, pierwszeństwo trudnych i nowych elementów, pomijanie znanych fiszek, tasowanie opcji stałe po wznowieniu oraz tolerowanie drobnych różnic interpunkcyjnych. Zachowano wszystkie identyfikatory. Postęp zależy od opcjonalnego rev elementu (domyślnie 1), a nie wersji modułu. Nie zmieniono nazwy bazy IndexedDB ani formatu kopii.

Na małym ekranie pytanie i działania zajmują ekran bez dużego nagłówka; dłuższe wyjaśnienie można przewijać wewnątrz karty. Poprawiono etykiety, fokus, kontrast i rozmiar tekstu, skrócono objaśnienia, poprawiono źródła. Czcionki są systemowe, dodano koci favicon. Manifest pominięto do czasu sprawdzenia danych na iOS.

Aktualizacja aktywnych fiszek: oba zestawy wymagają odpowiedzi (wybór, wpisywanie lub tryb mieszany). Sposób odpowiedzi wybiera się przed dotknięciem kafelka. Każdy kafelek od razu zaczyna sesję; usunięto osobny przycisk startu na dole. Zakres wcześniejszych modułów i źródła są rozwijane. Błąd pokazuje poprawną odpowiedź i wyjaśnienie, umożliwia poprawę i zapisuje trudność do kolejnej sesji. Nowe wyniki fiszek obejmują pierwsze próby i poprawki; stare wyniki, kopie i identyfikatory pozostają obsługiwane.

Ilustracje po odpowiedzi: 97 słówek (oraz odpowiadające im quizy) i 59 zadań gramatycznych mają ilustrację z podpisem. Wykorzystano kolorowe piktogramy i własne lokalne rysunki SVG produktów. Ilustracja jest widoczna od początku pytania i podczas poprawy w fiszkach, quizach, gramatyce i powtórkach. Podpis jest pokazywany dopiero po sprawdzeniu odpowiedzi. W 26 zadaniach z wariantami w nawiasie wymuszono odpowiedzi zamknięte, także w trybie wpisywania i starszych sesjach. Pole `illustration` i opcjonalne `responseType` edytuje się w treści.

Po błędzie we wszystkich trybach pokazujemy „Twoja odpowiedź” i „Poprawna odpowiedź”, z podkreśleniem oraz kolorem odmiennych fragmentów. Porównanie wybiera najbliższy akceptowany wariant i uwzględnia tolerancję oceniania. Ostatnia odpowiedź jest zapisywana osobno w opcjonalnym `lastAnswer`; `answer` oraz pierwszy wynik pozostają zachowane. Stare kopie nadal są obsługiwane; gdy nie zawierają ostatniej poprawki, widok wyjaśnia brak tego zapisu. Poprawiono również spacje przy ukrywanych na telefonie podziałach wiersza na stronie głównej.

Dodano opcjonalne konto Firebase (projekt `male-kroki-nauka`), logowanie e-mail/hasło, rejestrację i odzyskanie hasła. Każde konto ma osobną pamięć lokalną. Wyniki zapisują się najpierw lokalnie, potem są synchronizowane wersjonowaną transakcją Firestore. Konflikt zatrzymuje nadpisanie i umożliwia wybór wersji z zachowaniem kopii. Przeniesienie dotychczasowych wyników gościa jest jawne. Instrukcja uruchomienia i ograniczenia: [firebase.md](firebase.md). Użytkowniczka potwierdziła włączenie usług, publikację reguł i działający zapis Firebase na dwóch urządzeniach.

Dodano PWA z ikoną kotka, manifestem i pobraniem wszystkich publicznych materiałów, ilustracji i kodu do pracy bez sieci. Aktualizacja czeka na wybór użytkownika i nie usuwa wyników. Po ponownym połączeniu synchronizacja konta działa w otwartej aplikacji lub przy kolejnym uruchomieniu. Szczegóły: [pwa.md](pwa.md). Powiadomienia push i natywny widżet nie są częścią tej zmiany.

Weryfikacja po aktualizacji: 45 testów jednostkowych, check:content i build poprawne; 31 testów zbudowanej aplikacji pod /HaniaAngielski/. Sprawdzono 320×640, 360×740, szerokości 390 i 430 oraz 844×390, wczytanie starej kopii bez zmiany jej danych, oba zestawy i kontrast sprawdzanych tekstów.

Testy domyślnie korzystają z Chromium, Edge jest dostępny przez zmienną środowiskową. Osobny CI sprawdza push i pull request; GitHub Pages publikuje push na main i umożliwia uruchomienie ręczne.

Wcześniejsza wersja działa na GitHub Pages. Tych poprawek nie commitowano, nie wysyłano ani nie publikowano. Nie sprawdzono fizycznego telefonu, czytników ekranu ani Linux/macOS. Nie dodano nowych trybów nauki ani automatycznego importu PDF. PWA wymaga pierwszego pobrania z siecią; fizyczna instalacja na telefonie nie została sprawdzona. Próby kont w przeglądarce korzystają z testowego adaptera sieciowego; użytkowniczka potwierdziła także działający rzeczywisty zapis Firebase po konfiguracji.

Szczegółowy raport: [raport-poprawek-audyt.md](raport-poprawek-audyt.md). Instrukcja treści: [public/content/README.md](../public/content/README.md).
