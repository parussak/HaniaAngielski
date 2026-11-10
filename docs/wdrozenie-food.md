# Etap 4 — sprawdzenie Food i bezpieczne uzupełnienie treści

Stan na 10 listopada 2026 r. Wdrożenie D-22 i D-24: poprawiamy tylko nieukończone lekcje etapów 5–7, a brak ćwiczenia materiału w kontekście uzupełniamy drugą mapą. Nie przenosimy lekcji między etapami ani nie zerujemy wyników.

Późniejsza aktualizacja: dodano przycisk do lekcji przygotowującej przy pustym treningu i niezależne odzyskiwanie map po błędach. [Bieżąca obsługa tych sytuacji](odpornosc-map.md). Poniższy raport zachowuje zakres i wyniki etapu 4.

## Porównanie z materiałami

Punktem odniesienia są 27 zdjęć z archiwum użytkowniczki, opisane w [rejestrze źródeł](materialy-food.md). Przejrzano zestaw zdjęć na planszach kontaktowych, a kluczowe strony porównano w powiększeniu: podręcznik 25, 27, 29–33, 35 i zeszyt ćwiczeń 19–20. Tytuł i wydanie książki nadal nie są ustalone. Zdjęć ani skanów nie dodajemy do publicznej aplikacji.

| Zakres i źródło | Wynik porównania | Wdrożenie |
| --- | --- | --- |
| Vocabulary Food & drink (1), (2), Containers; Wordlist, s. 25, 27, 29, 33; Word blog, zeszyt s. 21 | Dotychczasowe 97 haseł pokrywa 93 pozycje Wordlist oraz 4 dodatkowe. Nie wykazano potrzeby dokładania kolejnych fiszek. | Zostaje 38 podstawowych i 97 wszystkich fiszek; pisownia, identyfikatory i akceptowane odpowiedzi bez zmian. |
| Policzalność, a/an/brak rodzajnika, some/any, there is/are i krótkie odpowiedzi; podręcznik s. 27, zeszyt s. 15, 20 | Zakres jest obecny w starych zadaniach i etapach 3–4. | Etapy 1–4 i wszystkie dotychczasowe pytania pozostają nienaruszone. |
| How much/many, a lot of, opakowania; podręcznik s. 29, zeszyt s. 16, 20 i notatki | Zakres jest obecny; rozróżnienie ilości wody i liczby butelek wymaga dalszej praktyki. | Istniejące zadania jako uzupełnienie etapu 7, nowe konteksty na drugiej mapie. |
| Zamawianie; podręcznik s. 30, zeszyt s. 17, 20 | Zwroty są obecne, lecz niektóre lekcje mają tylko 2–5 zadań. | Sześć nowych wariantów próśb, pytań kelnera i podziękowania. Nieukończone lekcje etapu 5 mają po 6 zadań. |
| So/because; podręcznik s. 32, zeszyt s. 19 | Cztery zadania i jeden dialog nie wyczerpują ćwiczenia rozróżnienia powodu i skutku w opisie śniadania. | Trzy nowe warianty; nieukończona lekcja etapu 6 ma 8 zadań. Wyjaśnienia wskazują kierunek przyczyny i skutku. |
| Dzienniczek i rozmowa o posiłkach; podręcznik s. 25, ćw. 6–9 | Słówka są w katalogu, ale brakowało pytań opartych na krótkiej notatce i ćwiczenia never/sometimes/often w kontekście jedzenia. | „Dzienniczek posiłków”: 6 zadań; nowe objaśnienie `meals`. |
| The pancake; podręcznik s. 31 | Słówka są na starej mapie, lecz samo tłumaczenie nie ćwiczy rozumienia przepisu i opisu dodatków. | „Naleśnik krok po kroku”: 6 krótkich adaptacji o składnikach, patelni, on top, some i a lot of. Bez kopiowania całego tekstu i bez pytań wymagających niepokazanego tekstu. |
| Opis śniadania; podręcznik s. 32, 35, zeszyt s. 19 | Dotychczas brakowało pracy z konstrukcją opisu dnia szkolnego i weekendu. | „Moje śniadanie”: 6 luk przygotowujących do pisania, z rozróżnieniem on a school day / at the weekend oraz because/so. W zadaniu o weekendzie jawnie wskazano brytyjski wariant z książki. |

Nowe zadania to adaptacje w zakresie Food, a nie transkrypcje nagrań ani wierne kopie ćwiczeń. Źródło, odpowiedzi, objaśnienie i ilustracja są zapisane przy każdym zadaniu. Automatyczna kontrola odwołań i odpowiedzi nie zastępuje recenzji językowej.

## Dwie mapy Food

1. **Przygotowania do kociego pikniku** — nadal 7 etapów i te same 41 identyfikatorów lekcji. Etapy 1–4 bez zmian. Szesnaście lekcji etapów 5–7 ma opcjonalną poprawioną wersję: po 6 zadań, z wyjątkiem „Powodu i skutku” z 8 zadaniami. Zachowano wszystkie słówka przy ich dotychczasowych lekcjach; krótkie lekcje etapu 7 uzupełniono wcześniejszą gramatyką Food. Ukończona stara wersja pozostaje dostępna w oryginalnym zakresie.
2. **Kocia kuchnia — Food w praktyce**, identyfikator `food-w-praktyce` — „Dzienniczek posiłków”, „Naleśnik krok po kroku”, „Moje śniadanie”, trening wcześniejszej mapy i „Wspólny posiłek”. Cztery lekcje po 6 zadań oraz trening do 8 poznanych pozycji. Trening następuje po trzech lekcjach i jest wymagany do ukończenia tej mapy. Korzysta tylko z faktycznie poznanego materiału poprzedniej mapy, również bezbłędnego. Jeśli tego materiału jeszcze nie ćwiczono, trzeba wrócić do pierwszej mapy; nie tworzymy pustej sesji ani nie dokładamy przyszłych treści. Mapa pozostaje dostępna z katalogu bez nowego systemu blokad między mapami.

Łącznie: **97 haseł, 97 pytań słownikowych, 92 ćwiczenia, 12 dialogów i 10 objaśnień**, czyli 201 zadań po skompilowaniu. Przybyły 33 ćwiczenia: 9 dla poprawek pierwszej mapy oraz 24 na drugą. Dotychczasowe treści są zachowane bez zmian.

## Ochrona wyników i nagród

- `sciezka.json` zawiera oryginalną definicję lekcji oraz opcjonalne `update`. Silnik wybiera wariant na podstawie postępu danego konta, bez przepisywania go przy odczycie.
- Dawne ukończenie bez `edition` oznacza oryginał. Nadal jest ukończone, także w etapach 5–7. Rozpoczęta dawna sesja zachowuje listę pytań, odpowiedzi, poprawki i miejsce wznowienia.
- Nowo rozpoczynana nieukończona lekcja z aktualizacją otrzymuje `lesson.edition: 2`. Pierwsze ukończenie przenosi ten znacznik do istniejącego wpisu `adventure.completed`. Późniejsze powtarzanie zachowuje poprawioną wersję i nie daje ponownej nagrody.
- Klucze materiałów, pierwszej mapy i kolejek błędów nie zmieniają się. Stare pytania zachowują odpowiedzi i rewizje, dlatego zapisane błędy nadal dają się powtarzać.
- Zdobyte gwiazdki, zakupy i stara odznaka kociego kucharza pozostają. Druga mapa nie odbiera odznaki za pierwszą ani nie obniża jej 100%. Ma osobny postęp 0–100%.
- Nowe lekcje, w tym trening, dają po 3 ★ za pierwsze ukończenie, maksymalnie 15 ★ za nową mapę. Nowa mapa ma własną dobrowolną powtórkę, bez dodatkowej premii za jej utrwalenie; nie rozstrzygamy zaparkowanych zasad nowych premii.
- Kopie pozostają w wersji 1; nowy znacznik jest opcjonalny i walidowany. Historia, synchronizacja i limity zapisu działają jak wcześniej. Przybywa najwyżej jeden mały znacznik na zaktualizowane ukończenie, nie nowy dziennik zdarzeń.

## Granice opracowania

Nie dodano nagrań, oceniania wymowy ani rozumienia nieudostępnionego audio. Krótkie luki nie potwierdzają jeszcze umiejętności swobodnego napisania tekstu 60–70 słów lub przeprowadzenia rozmowy. Nie odtworzono całych czytanek kulturowych, „Autumn time” ani przekrojowej powtórki Units 1–2. Druga mapa uzupełnia ważne zastosowania słownictwa i gramatyki, nie jest cyfrową kopią każdej strony podręcznika. Algorytm długoterminowych treningów pozostaje do ustalenia.

## Kontrole

`tests/food-audit.test.ts` chroni oryginalną mapę i dotychczasowe treści przez skróty ich kanonicznych danych oraz sprawdza warianty per konto, rozpoczęte sesje, kopie, nagrody, pokrycie i trening. Nowe kontrole telefonu i offline są w `tests/browser/food-audit.spec.ts`. Wyniki pełnej weryfikacji zapisujemy w [testach](07-testy.md).

Weryfikacja: 137/137 testów Node, 72/72 testów przeglądarkowych gotowej aplikacji w Chrome, poprawne budowanie i 373 lokalne odnośniki dokumentacji bez brakujących plików. Sprawdzono zrzuty mobilne; nie jest to próba na fizycznym telefonie Hani.

Rozmiar: nowe i uzupełnione pliki treści zajmują łącznie o 40 284 bajty więcej, około 5,7 kB więcej po gzip. Główny kod aplikacji ma 137,04 kB, 45,74 kB po gzip; względem etapu 3 przybyło około 0,3 kB po gzip. Nie dodano bibliotek ani obrazów. PWA przechowuje 197 zasobów tego wydania, o jeden plik mapy więcej. Firestore nie otrzymuje katalogu treści — jedynie dotychczasowy zapis postępów, z małym opcjonalnym znacznikiem wydania ukończonej lekcji.

Nie wykonywano zmian na prawdziwym koncie Firebase, commita, pushu ani publikacji.
