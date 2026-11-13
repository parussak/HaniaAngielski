# Plan pierwszej wersji aplikacji

Data: 8 listopada 2026 r.

Aktualizacja realizacji: aplikacja jest zbudowana lokalnie. Użytkownik przekazał materiały modułu 2 Food; zastąpiły one wcześniejszą demonstrację. Materiały są niezależnie edytowalne w `public/content`. Aktualny zakres opisuje [dokument modułu Food](../materialy-food.md); publikacja i próba na telefonie Hani pozostają do wykonania.

Podstawa: [wymagania aplikacji](wymagania.md). Dokument jest planem; budowa aplikacji nie została jeszcze rozpoczęta.

## Zakres pierwszej wersji

Pierwsza wersja pozwoli wybrać gotowy moduł, ćwiczyć fiszki, rozwiązywać quizy i zadania gramatyczne, poprawiać błędy oraz przeglądać wyniki. Postępy będą zapisywane lokalnie, z eksportem i importem kopii. Strona będzie działać na telefonie i komputerze oraz nadawać się do publikacji na GitHub Pages.

Materiały przygotujemy ze zdjęć przesyłanych w rozmowie. Ćwiczenia, odpowiedzi i polskie wyjaśnienia powstaną przed publikacją modułu; rozwiązywanie zadań nie będzie wymagało usługi AI.

Do późniejszego etapu należą: dodawanie PDF-ów i zdjęć na stronie, automatyczne tworzenie modułów, konta, synchronizacja oraz osobna aplikacja na Androida. Wymowa pozostaje do decyzji. Działanie bez internetu nie jest warunkiem pierwszego wydania — lokalny zapis wyników sam w sobie nie zapewnia dostępności całej strony offline.

## Proponowane rozwiązanie

- Statyczna aplikacja internetowa: TypeScript i Vite, bez własnego serwera.
- Gotowe moduły jako pliki JSON, oddzielone od wyglądu i logiki aplikacji.
- IndexedDB do zapisu postępów i trwającej sesji; operacje importu wykonywane w transakcji.
- Kopia postępów jako plik JSON z datą i wersją formatu.
- Publikacja statycznych plików na GitHub Pages.

To propozycja techniczna do realizacji, a nie zainstalowane już narzędzia. Dobór wersji zależności i sposób publikacji należy sprawdzić przy rozpoczęciu budowy.

## Etap 1 — pierwszy moduł i zasady sprawdzania

1. Ustalić język, podręcznik i poziom; otrzymać zdjęcia pierwszego modułu.
2. Odczytać słowa, zwroty i gramatykę, oznaczając niepewne fragmenty do sprawdzenia.
3. Przygotować i zweryfikować zestaw ćwiczeń, akceptowane odpowiedzi oraz wyjaśnienia po polsku.
4. Określić kolejność modułów i wskazać, do jakich wcześniejszych modułów może odwoływać się każde ćwiczenie.
5. Uzgodnić zasady oceny pisowni. Propozycja: pomijać zbędne spacje, wielkość liter oceniać zależnie od zadania, a warianty odpowiedzi akceptować tylko z przygotowanej listy. Nie usuwać automatycznie znaków istotnych w danym języku.

Rezultat: sprawdzony pierwszy moduł. Przygotowanie struktury aplikacji może odbywać się wcześniej; odbiór treści i zasad oceniania wymaga rzeczywistych materiałów.

## Etap 2 — struktura danych i ekrany

1. Zdefiniować moduł: trwały identyfikator, wersja treści, kolejność, źródło, słownictwo, zagadnienia i ćwiczenia.
2. Nadać trwałe identyfikatory słowom i ćwiczeniom. Zmiana odpowiedzi lub znaczenia zadania musi być rozpoznawalna, aby stare wyniki nie zostały przypisane do innej treści.
3. Zdefiniować zapis sesji, pierwszych odpowiedzi, poprawek, oznaczeń fiszek i wyników modułów.
4. Przygotować ekrany: lista modułów, wybór sesji, ćwiczenie, podsumowanie, postępy oraz kopia zapasowa.
5. Ustalić krótką domyślną sesję, np. 10 zadań, skracaną przy mniejszym zestawie. Przyciski i polecenia muszą być czytelne na telefonie i dostępne z klawiatury.

Rezultat: szkielet aplikacji i walidowany format modułów. Dane demonstracyjne, jeśli potrzebne, są wyraźnie oznaczone i nie zastępują materiału z książki.

## Etap 3 — nauka i poprawianie odpowiedzi

1. Dodać fiszki: odkrycie odpowiedzi oraz świadome oznaczenie „Znam” lub „Do powtórki”.
2. Dodać quizy z wyborem, wpisywaniem i trybem mieszanym.
3. Dodać zadania gramatyczne z gotowymi odpowiedziami i wyjaśnieniami.
4. Po błędzie pokazywać odpowiedź i wyjaśnienie, udostępniać ponowną próbę oraz późniejszą powtórkę.
5. Liczyć wynik pierwszych prób niezależnie od poprawek; kolejne kliknięcia i wznowienia nie mogą naliczać odpowiedzi ponownie.
6. Filtrować zadania według zakresu: bieżący moduł lub bieżący i wcześniejsze. Sprawdzać również zakres błędnych wariantów odpowiedzi i wyjaśnień.

Rezultat: pełna sesja nauki z podsumowaniem i możliwością powrotu do trudniejszych zadań.

## Etap 4 — trwały zapis i postępy

1. Zapisywać stan po każdej odpowiedzi i oznaczeniu fiszki.
2. Przy wznowieniu przywracać kolejność zadań, aktualne miejsce i etap odpowiedzi, także po pokazaniu wyjaśnienia.
3. Pokazywać historię sesji, wyniki pierwszych prób, poprawy i materiał do powtórki osobno dla modułów.
4. Obsłużyć brak miejsca lub odmowę zapisu. Wyświetlać zrozumiałą informację, jeśli zapis się nie uda; nie deklarować wtedy, że postępy zostały zapisane.
5. Wskazać, że wyniki należą do tej przeglądarki. Unikać równoczesnego nadpisywania postępów z dwóch otwartych kart, np. przez ograniczenie aktywnej sesji do jednej karty.

Rezultat: zamknięcie strony lub przeglądarki nie gubi prawidłowo zapisanej nauki.

## Etap 5 — kopia zapasowa

1. Eksportować wszystkie postępy i trwającą sesję, datę eksportu oraz wersję formatu.
2. Walidować strukturę, wersję i rozsądny rozmiar pliku przed zmianą danych.
3. Pokazywać datę kopii, ostrzeżenie o zastąpieniu wyników i możliwość eksportu bieżących danych.
4. Wczytywać dopiero po potwierdzeniu, zastępując dane w jednej transakcji. Błąd zapisu nie może pozostawić częściowo wczytanej kopii.
5. Zachować wyniki nieobecnych modułów. Przy niezgodnej wersji materiału zachować historię i wyjaśnić, dlaczego nie da się wznowić dawnej sesji.
6. Po wczytaniu pokazywać potwierdzenie i aktualne postępy. Nie scalać dwóch kopii automatycznie.

Rezultat: wyniki można bezpiecznie odtworzyć i przenieść do innej przeglądarki z tymi samymi materiałami.

## Etap 6 — sprawdzenie i publikacja

Przeprowadzić automatyczne sprawdzenia logiki oceniania, oddzielnego liczenia pierwszych prób i poprawek, doboru zakresu modułów oraz walidacji kopii. Sprawdzić w przeglądarce pełną sesję i następujące scenariusze:

- Odświeżenie i ponowne otwarcie strony odtwarza postępy i rozpoczętą sesję.
- Eksport oraz import do innej przeglądarki odtwarza wszystkie zapisane dane.
- Anulowanie importu, błędny plik i nieobsługiwana wersja nie zmieniają danych.
- Kopia z brakującym modułem zachowuje jego wyniki.
- Nieudany zapis jest widoczny dla użytkowniczki i nie usuwa wcześniejszych danych.
- Wynik sesji jest prawidłowy po błędzie, poprawie i wznowieniu strony.
- Oba zakresy nauki nie dopuszczają późniejszych modułów.
- Ekrany i wpisywanie odpowiedzi działają na telefonie oraz komputerze.

Przygotować konfigurację publikacji na GitHub Pages, uwzględniając adres aplikacji w podkatalogu repozytorium. Przy publikacji sprawdzić dostęp do właściwego repozytorium i przetestować działającą stronę pod docelowym adresem. Nie umieszczać zdjęć książki ani kopii postępów w publicznych plikach strony. Publicznie opublikowane zestawy ćwiczeń również będą dostępne dla odwiedzających.

Rezultat: działający adres strony oraz krótka instrukcja nauki, zapisu kopii, odtwarzania i dodawania kolejnych przygotowanych modułów.

## Warunki zakończenia pierwszej wersji

- Dostępny jest co najmniej jeden sprawdzony moduł z rzeczywistych materiałów.
- Działają fiszki, oba rodzaje quizów, gramatyka i poprawa po błędzie.
- Wyniki pierwszych prób są oddzielone od poprawek.
- Lokalny zapis, wznowienie sesji oraz eksport i import przeszły opisane sprawdzenia.
- Strona działa na telefonie i komputerze oraz została sprawdzona na GitHub Pages.
- Nauka z przygotowanych modułów nie wymaga konta ani płatnej usługi.

## Najbliższy krok

Ustalić język i podręcznik oraz otrzymać zdjęcia pierwszego modułu. Na ich podstawie dopracować pierwszy zestaw i reguły oceniania, a następnie rozpocząć budowę zgodnie z etapami 2–6.
