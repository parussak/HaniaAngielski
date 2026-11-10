# Zapis — co, gdzie i z jaką zgodnością

Status: obecne rozwiązanie oraz granice przyszłych zmian. Dokument nie wprowadza migracji.

## Stan obecny

| Dane | Miejsce i zakres |
| --- | --- |
| Postępy gościa | IndexedDB w przestrzeni zależnej od ścieżki strony, osobny klucz `current` |
| Postępy konta i stan synchronizacji | Lokalny rekord `account:<uid>` oraz dokument konta w Firestore |
| Imię i dane logowania | Firebase Authentication; lokalne dane do przywrócenia kontekstu konta |
| Starsza historia | Niezmienne części z podsumowaniami, lokalnie i na koncie |
| Zewnętrzna kopia | Eksport JSON, format `hania-language`, wersja `1`, z potrzebnymi archiwami |
| Materiały kursów | Wspólne pliki statyczne i cache PWA, oddzielnie od wyników |

Jedna aktywna sesja jest zapisywana dla użytkownika, nie osobno dla każdego języka. Wznowienie obejmuje m.in. pytanie, fazę, pierwszą odpowiedź i poprawki. Konto ma wspólny bilans gwiazdek i domek.

Zachowano rozdzielenie kont i gościa, kontrolę wersji przy synchronizacji, wybór przy konflikcie i blokadę drugiej karty. Import kopii zastępuje wyniki po potwierdzeniu. Konto wysyła oczekujące zmiany po połączeniu podczas działania aplikacji lub kolejnego uruchomienia, nie jako stała usługa po zamknięciu.

Pełny opis kluczy, limitów, archiwizacji, cache i dowodów: [zapis — punkt odniesienia](stan-obecny/zapis.md). Mapa implementacji: [architektura](05-architektura.md).

## Rozszerzenie treningów — wdrożone po D-34

Sesja treningu ma opcjonalne pole `training` z rolą `map` lub `extra`. Trening na mapie korzysta z istniejącego rejestru ukończeń lekcji; dodatkowy trening zapisuje `rewarded: true` w ukończonej sesji. Znacznik jest zapisywany razem z gwiazdką, nie na osobnej nieograniczonej liście nagród. Sesje nadal podlegają dotychczasowej kompakcji i archiwizacji.

Format kopii pozostaje w wersji 1 i odczytuje stare dane. Kopie zawierające nowy tryb treningu wymagają aktualnej aplikacji. Nie zmieniono kluczy istniejących materiałów, IndexedDB ani reguł Firestore. Sam odczyt postępu lub przygotowanie treningu nie zapisuje migracji i nie zmienia wyników. Nowe nazwane mapy używają kluczy `moduleId/mapId/lessonId`; obecna mapa Food zachowuje `moduleId/lessonId`.

## Kursy bez migracji Food — etap 2

`Course` wskazuje uporządkowane moduły, a każdy moduł należy do jednego kursu. Moduły różnych kursów muszą mieć różne identyfikatory. Klucz `moduleId@rewizja:typ:id` pozostaje bez zmian; nie dopisujemy kursu do historycznych kluczy. To zapewnia osobne wyniki również dla identycznych lokalnych identyfikatorów znaczeń w kilku kursach.

Nie przenosimy istniejącego modułu do innego podręcznika: nowy podręcznik i istotnie zmienione wydanie wymagają nowego kursu oraz nowych identyfikatorów modułów. Kursy i znaczenia są wczytywane do pamięci aplikacji i cache materiałów PWA, a nie dopisywane do `Progress` ani payloadu Firestore. Odczyt Food nie wykonuje migracji. [Szczegóły zgodności](wdrozenie-kursow.md).

## Założenia docelowe przy rozwoju

- Jeden kurs może być wspólny dla wielu kont, ale każde konto ma własne postępy; sesje i wyniki jednego konta nie zmieniają wyników innego — D-14 w [rejestrze](decyzje.md). W etapie 2 definicja kursu wskazuje globalnie unikalne moduły, a zapis nadal używa ich stabilnych identyfikatorów; nie kopiuje materiałów do danych konta.
- Również na jednym koncie postępy tego samego elementu są oddzielne w każdym kursie. Poprawna odpowiedź w kursie A nie zalicza elementu w kursie B — D-15. Techniczne współdzielenie treści nie może znieść tej granicy.
- Rozwój kursów i map musi zachować dotychczasowe wyniki, pierwsze próby i historię.
- Przy planowanych poprawkach Food zachowujemy wszystkie zaliczone lekcje, także w sekcjach 5–7, i zdobyte gwiazdki. Zmiany obejmują wyłącznie nieukończone lekcje; brakujący materiał trafia na kolejną mapę, bez otwierania zaliczonych lekcji na nowo (D-24).
- Materiał, mapa/lekcja, wykonana sesja i stan utrwalenia pozostają rozróżnialnymi pojęciami. Definicja lekcji nie jest tym samym co konkretne podejście użytkownika.
- Poznanie elementu wynika z pierwszej próby odpowiedzi, także błędnej, w kontekście konta i kursu (D-25). Nie zależy od ukończenia całej lekcji i nie jest równoznaczne z utrwaleniem. Uwzględniamy także wcześniejsze próby ze starszej historii, bez zmiany ocen, ukończeń i gwiazdek (D-26). Pierwsze wdrożenie treningu odczytuje poznanie bez nowego pola: z prób ostatnich sesji, aktywnej sesji i istniejącego podsumowania archiwum. Pełne wspólne API poznanego zakresu dla wszystkich przyszłych trybów pozostaje do rozszerzenia.
- Powiązanie błędu z miejscem jego wystąpienia nie usuwa informacji, z którego materiału pochodzi zadanie. Jest to ważne przy treningu wcześniejszych map.
- Ewentualny nowy harmonogram treningów musi określić potrzebne dane i sposób ich przechowywania bez nieograniczonego powiększania głównego zapisu.
- Nie zmieniamy identyfikatorów istniejących modułów, etapów, lekcji i elementów jedynie dla porządku nazewnictwa. Zmiana wymagająca migracji potrzebuje osobnego planu i testów zgodności.

Nie przesądzamy, że wszystkie obecne pola zostaną zachowane bez rozszerzeń ani że przyszła wersja na pewno nie będzie wymagać migracji. **Sama reorganizacja dokumentacji nie zmienia formatu ani danych.**

## Do ustalenia

- Podstawowe rozdzielenie wyników kursów jest wdrożone przez przypisanie stabilnych modułów. Dalsze rozszerzenia, np. inne rodzaje współdzielonych jednostek materiału, należą do [U-01](decyzje.md#u-01). Osobne postępy kont (D-14) oraz osobne postępy w różnych kursach jednego konta (D-15) są już zatwierdzone.
- Techniczna ochrona wyników, aktywnych sesji i kolejek błędów przy poprawkach Food — [U-03](decyzje.md#u-03). Zachowanie mapy zatwierdzono w D-22, a wszystkich ukończonych lekcji i zdobytych gwiazdek w D-24; nie jest to już otwarta decyzja o resetowaniu ukończeń.
- Techniczna reprezentacja poznania i odczyt wcześniejszych prób zgodnie z rozstrzygniętymi zasadami D-25 i D-26 — [U-04](decyzje.md#u-04); dane przyszłego algorytmu treningu pozostają w [U-05](decyzje.md#u-05).
- Czy potrzebne są oddzielne aktywne sesje/preferencje kursów — [U-08](decyzje.md#u-08).
- Co w przyszłości pozostaje wspólne: gwiazdki, domek i nagrody — [U-07](decyzje.md#u-07).
