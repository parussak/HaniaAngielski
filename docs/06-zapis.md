# Zapis — co, gdzie i z jaką zgodnością

Status: obecne rozwiązanie oraz granice przyszłych zmian. Dokument nie wprowadza migracji.

## Stan obecny

| Dane | Miejsce i zakres |
| --- | --- |
| Postępy gościa | IndexedDB w przestrzeni zależnej od ścieżki strony, osobny klucz `current` |
| Postępy konta i stan synchronizacji | Lokalny rekord `account:<uid>` oraz dokument konta w Firestore |
| Imię i dane logowania | Firebase Authentication; lokalne dane do przywrócenia kontekstu konta |
| Starsza historia | Pełne sesje w niezmiennych częściach, lokalnie i na koncie; ich podsumowania w bieżącym zapisie |
| Zewnętrzna kopia | Eksport JSON, format `hania-language`, wersja `1`, z potrzebnymi archiwami |
| Materiały kursów | Wspólne pliki statyczne i cache PWA, oddzielnie od wyników |

Jedna aktywna sesja jest zapisywana dla użytkownika, nie osobno dla każdego języka. Wznowienie obejmuje m.in. pytanie, fazę, pierwszą odpowiedź i poprawki. Konto ma wspólny bilans gwiazdek i domek.

Zachowano rozdzielenie kont i gościa, kontrolę wersji przy synchronizacji, wybór przy konflikcie i blokadę drugiej karty. Import kopii zastępuje wyniki po potwierdzeniu. Konto wysyła oczekujące zmiany po połączeniu podczas działania aplikacji lub kolejnego uruchomienia, nie jako stała usługa po zamknięciu.

Pełny opis kluczy, limitów, archiwizacji, cache i dowodów: [zapis — punkt odniesienia](stan-obecny/zapis.md). Mapa implementacji: [architektura](05-architektura.md).

## Rozszerzenie treningów — wdrożone po D-34

Sesja treningu ma opcjonalne pole `training` z rolą `map` lub `extra`. Trening na mapie korzysta z istniejącego rejestru ukończeń lekcji; dodatkowy trening zapisuje `rewarded: true` w ukończonej sesji. Znacznik jest zapisywany razem z gwiazdką, nie na osobnej nieograniczonej liście nagród. Sesje nadal podlegają dotychczasowej kompakcji i archiwizacji.

Format kopii pozostaje w wersji 1 i odczytuje stare dane. Kopie zawierające nowy tryb treningu wymagają aktualnej aplikacji. Nie zmieniono kluczy istniejących materiałów, IndexedDB ani reguł Firestore. Sam dobór pytań treningu i wyliczenie podglądu postępu nie zmieniają wyników. Przy uruchomieniu i zapisie aplikacja może osobno skompaktować historię, odtworzyć starsze kolejki błędów oraz rozliczyć należną, jeszcze nieprzyznaną premię dawnego etapu. To istniejące przygotowanie postępu, nie skutek wyboru kursu lub nowej wersji lekcji. Nowe nazwane mapy używają kluczy `moduleId/mapId/lessonId`; pierwsza mapa Food zachowuje `moduleId/lessonId`.

## Kursy bez migracji Food — etap 2

`Course` wskazuje uporządkowane moduły, a każdy moduł należy do jednego kursu. Moduły różnych kursów muszą mieć różne identyfikatory. Klucz `moduleId@rewizja:typ:id` pozostaje bez zmian; nie dopisujemy kursu do historycznych kluczy. To zapewnia osobne wyniki również dla identycznych lokalnych identyfikatorów znaczeń w kilku kursach.

Nie przenosimy istniejącego modułu do innego podręcznika: nowy podręcznik i istotnie zmienione wydanie wymagają nowego kursu oraz nowych identyfikatorów modułów. Kursy i znaczenia są wczytywane do pamięci aplikacji i cache materiałów PWA, a nie dopisywane do `Progress` ani payloadu Firestore. Odczyt Food nie wykonuje migracji. [Szczegóły zgodności](wdrozenie-kursow.md).

## Globalny zakres i preferencja kursu — etap 3

- `Progress.encountered` jest opcjonalną, unikalną listą kluczy elementów po pierwszej próbie. Nie zawiera ocen ani listy zdarzeń; powtarzanie tego samego elementu nie powiększa jej. Stare próby są nadal odczytywane z historii. Przy zastąpieniu starej aktywnej sesji zachowujemy klucze jej prób, bez przepisywania ocen.
- `Session.scope: { kind: "course", courseId }` oznacza globalną sesję; brak pola zachowuje dotychczasowe tryby. `moduleId` jest kotwicą zgodności kursu, a pytania nadal wskazują własne moduły i rewizje.
- `Item.options` jest małą opcjonalną migawką 2–4 poznanych opcji dla słownictwa globalnego. Dzięki niej kopia i wznowienie zachowują ten sam zestaw odpowiedzi.
- `history.courses` agreguje zarchiwizowane sesje globalne osobno od modułowych. Suma sesji kursowych i modułowych musi zgadzać się z liczbą archiwalnych sesji; pełna kopia sprawdza także wartości względem części historii. `history.items` nadal uwzględnia każdą ocenioną próbę raz.
- `course-selection:guest` i `course-selection:account:<uid>` w IndexedDB zawierają wyłącznie lokalną preferencję kursu. Nie są częścią `Progress`, kopii ani synchronizacji.

Kopia pozostaje w wersji 1 i odczytuje wcześniejsze pliki. Obsługa nowych pól wymaga aktualnej aplikacji. Nie zmieniono reguł Firebase ani nie przeliczono starych ocen. [Raport etapu 3](wdrozenie-zakresow.md).

## Wersje lekcji Food — etap 4

Dotychczasowe wpisy ukończenia `{ at }` oraz sesje bez znacznika pozostają oryginalną wersją lekcji. Nowo rozpoczynana nieukończona lekcja korzysta z opcjonalnego `update`, jeśli jej definicja je zawiera. Taka sesja zapisuje `lesson.edition: 2`, a pierwsze ukończenie zachowuje ten znacznik w `adventure.completed[lessonKey]`. Sam wybór wydania nie dopisuje migracji ani nagród. Aktywna sesja nadal przechowuje konkretną listę pytań i miejsce odpowiedzi, a stare pytania pozostają dostępne dla jej wznowienia i powtórek. Nowe lekcje drugiej mapy bez `update` nie potrzebują znacznika wydania 2. Format kopii pozostaje w wersji 1; aktualna walidacja obsługuje oba warianty. Limity historii i synchronizacji bez zmian. [Pełna ochrona wyników](wdrozenie-food.md#ochrona-wyników-i-nagród).

## Założenia docelowe przy rozwoju

- Jeden kurs może być wspólny dla wielu kont, ale każde konto ma własne postępy; sesje i wyniki jednego konta nie zmieniają wyników innego — D-14 w [rejestrze](decyzje.md). W etapie 2 definicja kursu wskazuje globalnie unikalne moduły, a zapis nadal używa ich stabilnych identyfikatorów; nie kopiuje materiałów do danych konta.
- Również na jednym koncie postępy tego samego elementu są oddzielne w każdym kursie. Poprawna odpowiedź w kursie A nie zalicza elementu w kursie B — D-15. Techniczne współdzielenie treści nie może znieść tej granicy.
- Rozwój kursów i map musi zachować dotychczasowe wyniki, pierwsze próby i historię.
- Przy planowanych poprawkach Food zachowujemy wszystkie zaliczone lekcje, także w sekcjach 5–7, i zdobyte gwiazdki. Zmiany obejmują wyłącznie nieukończone lekcje; brakujący materiał trafia na kolejną mapę, bez otwierania zaliczonych lekcji na nowo (D-24).
- Materiał, mapa/lekcja, wykonana sesja i stan utrwalenia pozostają rozróżnialnymi pojęciami. Definicja lekcji nie jest tym samym co konkretne podejście użytkownika.
- Poznanie elementu wynika z pierwszej próby odpowiedzi, także błędnej, w kontekście konta i kursu (D-25). Nie zależy od ukończenia lekcji i nie jest równoznaczne z utrwaleniem. Uwzględniamy wcześniejsze próby ze starszej historii, bez zmiany ocen, ukończeń i gwiazdek (D-26). Wspólny odczyt w `known-material.ts` korzysta z prób ostatnich sesji, aktywnej sesji, podsumowania archiwum oraz `Progress.encountered`. Trening i globalne zestawy korzystają z tych danych; nie trzeba pobierać pełnej dawnej historii do samego ustalenia poznanego zakresu.
- Powiązanie błędu z miejscem jego wystąpienia nie usuwa informacji, z którego materiału pochodzi zadanie. Jest to ważne przy treningu wcześniejszych map.
- Ewentualny nowy harmonogram treningów musi określić potrzebne dane i sposób ich przechowywania bez nieograniczonego powiększania głównego zapisu.
- Nie zmieniamy identyfikatorów istniejących modułów, etapów, lekcji i elementów jedynie dla porządku nazewnictwa. Zmiana wymagająca migracji potrzebuje osobnego planu i testów zgodności.

Nie przesądzamy, że wszystkie obecne pola zostaną zachowane bez rozszerzeń ani że przyszła wersja na pewno nie będzie wymagać migracji. **Sama reorganizacja dokumentacji nie zmienia formatu ani danych.**

## Do ustalenia

- Podstawowe rozdzielenie wyników kursów jest wdrożone przez przypisanie stabilnych modułów. Dalsze rozszerzenia, np. inne rodzaje współdzielonych jednostek materiału, należą do [U-01](decyzje.md#u-01). Osobne postępy kont (D-14) oraz osobne postępy w różnych kursach jednego konta (D-15) są już zatwierdzone.
- Ochronę wyników, aktywnych sesji i kolejek błędów Food wdrożono w etapie 4 — [U-03](decyzje.md#u-03). Kolejne istotne zmiany treści wymagają zachowania również obecnie wdrożonego wydania 2.
- Poznanie i odczyt wcześniejszych prób są wdrożone zgodnie z D-25/D-26 — [U-04](decyzje.md#u-04). Dane przyszłego algorytmu treningu pozostają w [U-05](decyzje.md#u-05).
- Czy potrzebne są oddzielne aktywne sesje, preferencje odpowiedzi albo synchronizacja wyboru kursu — [U-08](decyzje.md#u-08). Obecnie jest jedna sesja, wspólny wybór sposobu odpowiadania i lokalna preferencja kursu.
- Co w przyszłości pozostaje wspólne: gwiazdki, domek i nagrody — [U-07](decyzje.md#u-07).
