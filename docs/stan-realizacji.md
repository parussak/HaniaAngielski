# Stan aplikacji po audycie

8 listopada 2026 r.

Bieżący materiał: moduł 2 Food, 97 fiszek, 156 zadań i 9 zasad. Treści są oddzielone od kodu w public/content/02-food.

Aktualizacja zestawów: domyślnie wybrane „Fiszki podstawa” zawierają 38 haseł z ramek Vocabulary na s. 25, 27 i 29. Drugi wybór „Fiszki” zachowuje wszystkie 97 haseł. Lista podstawowa jest edytowalna w `basicFlashcardIds` pliku `modul.json`. Nie usunięto słów ani wyników; oba zestawy współdzielą status tych samych słów. Quizy i gramatyka zachowują poprzedni zakres.

Poprawki obejmują trwałe powtórki błędów i fiszek, pierwszeństwo trudnych i nowych elementów, pomijanie znanych fiszek, tasowanie opcji stałe po wznowieniu oraz tolerowanie drobnych różnic interpunkcyjnych. Zachowano wszystkie identyfikatory. Postęp zależy od opcjonalnego rev elementu (domyślnie 1), a nie wersji modułu. Nie zmieniono nazwy bazy IndexedDB ani formatu kopii.

Na małym ekranie pytanie i działania zajmują ekran bez dużego nagłówka; dłuższe wyjaśnienie można przewijać wewnątrz karty. Poprawiono etykiety, fokus, kontrast i rozmiar tekstu, skrócono objaśnienia, poprawiono źródła. Czcionki są systemowe, dodano koci favicon. Manifest pominięto do czasu sprawdzenia danych na iOS.

Weryfikacja po dodaniu dwóch zestawów: 29 testów jednostkowych, check:content i build poprawne; 17 testów zbudowanej aplikacji pod /HaniaAngielski/ poprawnych. Sprawdzono 320×640, 360×740, szerokości 390 i 430 oraz 844×390, wczytanie starej kopii bez zmiany jej danych, oba zestawy i kontrast sprawdzanych tekstów.

Testy domyślnie korzystają z Chromium, Edge jest dostępny przez zmienną środowiskową. Osobny CI sprawdza push i pull request; publikacja pozostaje ręczna.

Wcześniejsza wersja działa na GitHub Pages. Tych poprawek nie commitowano, nie wysyłano ani nie publikowano. Nie sprawdzono fizycznego telefonu, czytników ekranu ani Linux/macOS. Nie dodano kont, backendu, nowych trybów, automatycznego importu PDF ani pełnej obsługi offline.

Szczegółowy raport: [raport-poprawek-audyt.md](raport-poprawek-audyt.md). Instrukcja treści: [public/content/README.md](../public/content/README.md).
