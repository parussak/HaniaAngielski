# Aplikacja do nauki języka dla Hani — wymagania

Stan ustaleń: 8 listopada 2026 r.

## Cel i użytkowniczka

Aplikacja pomaga 11-letniej Hani ćwiczyć język na podstawie jej podręcznika. Polecenia, objaśnienia i informacje o błędach są po polsku. Interfejs jest prosty i wygodny na telefonie oraz komputerze.

## Moduły i materiały

Materiał jest podzielony na nazwane moduły odpowiadające rozdziałom podręcznika.

Na początku rodzic przesyła zdjęcia w rozmowie, a na ich podstawie powstają sprawdzone zestawy do aplikacji.

Docelowo funkcja „Dodaj moduł” umożliwia:

1. Podanie nazwy modułu i dodanie PDF-u lub zdjęć.
2. Odczytanie słownictwa i zagadnień gramatycznych oraz przygotowanie propozycji ćwiczeń.
3. Sprawdzenie i poprawienie materiału przez rodzica.
4. Udostępnienie zatwierdzonego modułu do nauki.

Nieczytelne fragmenty wymagają sprawdzenia. System nie uzupełnia ich zgadywaną treścią. Sposób realizacji i koszty automatycznego importu pozostają do ustalenia.

## Zakres nauki

Nowe ćwiczenia mogą korzystać wyłącznie ze słownictwa i gramatyki wybranego modułu oraz, opcjonalnie, wcześniejszych modułów.

Przed sesją Hania wybiera „Tylko ten moduł” albo „Z powtórką wcześniejszych”. Materiał z późniejszych modułów nie jest wykorzystywany.

## Sposoby ćwiczenia

- Fiszki z odkrywaniem odpowiedzi i oznaczaniem znajomości.
- Quizy z wyborem odpowiedzi.
- Quizy z wpisywaniem odpowiedzi.
- Zadania gramatyczne, np. uzupełnianie luk i wybór poprawnej formy.
- Powtórki słów i zagadnień sprawiających trudność.

Hania wybiera odpowiedzi zamknięte, wpisywanie albo tryb mieszany.

## Informacja po błędzie

Po błędnej odpowiedzi aplikacja pokazuje poprawną wersję i krótkie wyjaśnienie po polsku. Hania może następnie ponowić próbę.

Pierwsza odpowiedź i poprawa są zapisywane osobno. Poprawienie odpowiedzi po wyjaśnieniu nie zmienia wyniku pierwszej próby. Trudniejsze zadanie może wrócić później w sesji.

## Lokalny zapis postępów

Pierwsza wersja nie wymaga konta ani logowania. Aplikacja automatycznie zapisuje postępy w przeglądarce na używanym urządzeniu.

Zapisywane są:

- wyniki i historia ukończonych sesji;
- odpowiedzi z pierwszych prób oraz późniejsze poprawy;
- oznaczenia znajomości fiszek;
- słowa i zagadnienia wymagające powtórki;
- postęp bieżącej sesji, pozwalający wrócić do nauki po zamknięciu strony.

Odkrycie odpowiedzi na fiszce nie oznacza automatycznie opanowania słowa.

Postępy pozostają dostępne po odświeżeniu strony i ponownym uruchomieniu przeglądarki. Nie synchronizują się automatycznie między urządzeniami ani przeglądarkami. Wyczyszczenie danych strony może je usunąć.

## Kopia zapasowa i przenoszenie postępów

Przycisk „Zapisz kopię postępów” pobiera plik zawierający wszystkie zapisane postępy, datę eksportu oraz wersję formatu danych.

Przycisk „Wczytaj kopię” umożliwia odtworzenie postępów z pliku, również na innym urządzeniu.

Przed wczytaniem aplikacja:

1. Sprawdza poprawność i zgodność pliku.
2. Pokazuje datę kopii.
3. Informuje, że wczytanie zastąpi obecne postępy, i prosi o potwierdzenie.
4. Umożliwia zapisanie kopii obecnych postępów przed ich zastąpieniem.

Nieprawidłowy lub nieobsługiwany plik nie zmienia obecnych danych. Pierwsza wersja nie łączy automatycznie postępów z dwóch urządzeń.

Kopia postępów nie zawiera PDF-ów, zdjęć ani treści modułów. Do kontynuowania nauki potrzebny jest odpowiedni zestaw materiałów. Brak modułu nie powoduje usunięcia jego wyników z wczytywanej kopii.

## Wdrożenie i koszty

Strona jest publikowana na GitHub Pages. Lokalny zapis postępów nie wymaga dodatkowej usługi ani płatnego serwera.

Konta i automatyczna synchronizacja mogą zostać dodane w kolejnej wersji. Automatyczne tworzenie modułów z PDF-ów jest osobną funkcją, której realizacja i ewentualne koszty wymagają ustalenia.

## Sprawdzenie działania zapisu

Przed udostępnieniem aplikacji należy potwierdzić, że:

- wyniki pozostają po zamknięciu i ponownym otwarciu strony;
- można wznowić rozpoczętą sesję;
- eksport i ponowny import odtwarzają zapisane postępy;
- kopię można przenieść do innej przeglądarki;
- anulowanie importu lub wybranie błędnego pliku pozostawia dotychczasowe dane bez zmian.

## Informacje jeszcze nieustalone

- Tytuł i wydanie podręcznika oraz poziom Hani. Język potwierdzony materiałami: angielski.
- Dostępność pełnego klucza odpowiedzi i nagrań. Materiały modułu 2 Food zostały przekazane w 27 zdjęciach i opracowane w aplikacji.
- Potrzeba odsłuchiwania wymowy w pierwszej wersji.

Szczegóły realizacji pierwszej wersji opisuje [plan](plan-pierwszej-wersji.md). Propozycje techniczne w planie nie zastępują powyższych ustaleń.
