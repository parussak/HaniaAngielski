# Stan aplikacji po audycie

8 listopada 2026 r.

Bieżący materiał: moduł 2 Food, 97 fiszek, 156 zadań i 9 zasad. Treści są oddzielone od kodu w public/content/02-food.

Aktualizacja zestawów: „Fiszki podstawa” zawierają 38 haseł z ramek Vocabulary na s. 25, 27 i 29. Drugi wybór „Fiszki” zachowuje wszystkie 97 haseł. Lista podstawowa jest edytowalna w `basicFlashcardIds` pliku `modul.json`. Nie usunięto słów ani wyników; oba zestawy współdzielą status tych samych słów. Quizy i gramatyka zachowują poprzedni zakres.

Poprawki obejmują trwałe powtórki błędów i fiszek, pierwszeństwo trudnych i nowych elementów, pomijanie znanych fiszek, tasowanie opcji stałe po wznowieniu oraz tolerowanie drobnych różnic interpunkcyjnych. Zachowano wszystkie identyfikatory. Postęp zależy od opcjonalnego rev elementu (domyślnie 1), a nie wersji modułu. Nie zmieniono nazwy bazy IndexedDB ani formatu kopii.

Na małym ekranie pytanie i działania zajmują ekran bez dużego nagłówka; dłuższe wyjaśnienie można przewijać wewnątrz karty. Poprawiono etykiety, fokus, kontrast i rozmiar tekstu, skrócono objaśnienia, poprawiono źródła. Czcionki są systemowe, dodano koci favicon. Manifest pominięto do czasu sprawdzenia danych na iOS.

Aktualizacja aktywnych fiszek: oba zestawy wymagają odpowiedzi (wybór, wpisywanie lub tryb mieszany). Sposób odpowiedzi wybiera się przed dotknięciem kafelka. Każdy kafelek od razu zaczyna sesję; usunięto osobny przycisk startu na dole. Zakres wcześniejszych modułów i źródła są rozwijane. Błąd pokazuje poprawną odpowiedź i wyjaśnienie, umożliwia poprawę i zapisuje trudność do kolejnej sesji. Nowe wyniki fiszek obejmują pierwsze próby i poprawki; stare wyniki, kopie i identyfikatory pozostają obsługiwane.

Ilustracje po odpowiedzi: 97 słówek (oraz odpowiadające im quizy) i 59 zadań gramatycznych mają ilustrację z podpisem. Wykorzystano kolorowe piktogramy i własne lokalne rysunki SVG produktów. Ilustracja jest widoczna od początku pytania i podczas poprawy w fiszkach, quizach, gramatyce i powtórkach. Podpis jest pokazywany dopiero po sprawdzeniu odpowiedzi. W 26 zadaniach z wariantami w nawiasie wymuszono odpowiedzi zamknięte, także w trybie wpisywania i starszych sesjach. Pole `illustration` i opcjonalne `responseType` edytuje się w treści.

Weryfikacja po aktualizacji: 34 testy jednostkowe, check:content i build poprawne; 20 testów zbudowanej aplikacji pod /HaniaAngielski/. Sprawdzono 320×640, 360×740, szerokości 390 i 430 oraz 844×390, wczytanie starej kopii bez zmiany jej danych, oba zestawy i kontrast sprawdzanych tekstów.

Testy domyślnie korzystają z Chromium, Edge jest dostępny przez zmienną środowiskową. Osobny CI sprawdza push i pull request; GitHub Pages publikuje push na main i umożliwia uruchomienie ręczne.

Wcześniejsza wersja działa na GitHub Pages. Tych poprawek nie commitowano, nie wysyłano ani nie publikowano. Nie sprawdzono fizycznego telefonu, czytników ekranu ani Linux/macOS. Nie dodano kont, backendu, nowych trybów, automatycznego importu PDF ani pełnej obsługi offline.

Szczegółowy raport: [raport-poprawek-audyt.md](raport-poprawek-audyt.md). Instrukcja treści: [public/content/README.md](../public/content/README.md).
