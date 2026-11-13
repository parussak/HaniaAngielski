# Zapis — co, gdzie i z jaką zgodnością

Gdzie aplikacja przechowuje wyniki, jakie pola mają znaczenie i jak chronimy dorobek przy zmianach. Reguły nauki, które te dane realizują: [nauka](03-nauka.md). Mapa kodu: [architektura](05-architektura.md). Poprzednia wersja, z opisem zmian według decyzji i etapów: [archiwum](archiwum/zapis-do-2026-11-13.md).

## Gdzie leżą dane

| Dane | Miejsce |
| --- | --- |
| Postępy gościa | IndexedDB, klucz `current`, w przestrzeni zależnej od ścieżki strony |
| Postępy konta i stan synchronizacji | Lokalny rekord `account:<uid>` i dokument konta w Firestore |
| Imię i logowanie | Firebase Authentication |
| Starsza historia | Pełne sesje w niezmiennych częściach archiwum (lokalnie i na koncie), podsumowania w bieżącym zapisie |
| Kopia zewnętrzna | Eksport JSON, format `hania-language`, **wersja 1**, z archiwami |
| Materiały kursów, nagrania, indeks audio | Pliki statyczne i cache PWA — nie są częścią postępów ani Firebase |
| Wybór kursu | IndexedDB `course-selection:guest` / `course-selection:account:<uid>` — lokalna preferencja, poza kopią i synchronizacją |
| Przełącznik słuchania | `localStorage` `male-kroki:sluchanie` — na urządzeniu, poza postępami |

- Jedna aktywna sesja na użytkownika (nie na kurs). Wznowienie obejmuje pytanie, fazę, pierwszą odpowiedź i poprawki.
- Konta i gość są rozdzielone. Synchronizacja ma kontrolę wersji, wybór przy konflikcie i blokadę drugiej karty. Oczekujące zmiany są wysyłane po połączeniu w trakcie działania aplikacji lub przy kolejnym uruchomieniu.
- Import kopii zastępuje wyniki dopiero po potwierdzeniu; odrzucony plik nie zmienia obecnych postępów.
- Materiały są wspólne dla kont; każde konto ma własne postępy (D-14), a postępy tego samego elementu są osobne w każdym kursie (D-15).

## Zasady zgodności

1. **Kopia zostaje w wersji 1.** Nowe pola są opcjonalne i walidowane; brak pola oznacza dotychczasowe zachowanie. Stare kopie i sesje wczytują się bez migracji.
2. **Nie zmieniamy identyfikatorów** modułów, map, lekcji, elementów, scen ani luk — także dla porządku nazewnictwa. Klucz elementu ma postać `moduleId@rewizja:typ:id` i nie zawiera kursu; moduły różnych kursów mają różne identyfikatory. Opublikowanych elementów nie usuwamy z plików modułu i nie zmieniamy im `rev` — [reguła edycji](format-materialow.md#aktualizacja-wydanej-lekcji).
3. **Ukończenie lekcji** to wpis `adventure.completed[lessonKey]` i zależy tylko od klucza lekcji (D-52). Klucz: `moduleId/mapId/lessonId` dla nazwanych map, `moduleId/lessonId` dla pierwszej mapy Food.
4. **Aktywna sesja przechowuje własną listę zadań** i wznawia się z niej, nie z definicji lekcji. Rozpoczętych sesji nie przebudowujemy ani nie skracamy.
5. **Nagrody nalicza się raz na sesję** — znaczniki w samej sesji (`lessonRewarded`, `rewarded`, `retentionCounted`) chronią przed ponownym naliczeniem po odświeżeniu, imporcie i synchronizacji. Zdobytych gwiazdek nie przeliczamy wstecz.
6. **Przyrost danych jest ograniczony:** sesje podlegają kompakcji i archiwizacji, liczniki rosną z liczbą różnych elementów, nie odpowiedzi. Nowy mechanizm (np. harmonogram treningu) musi określić swoje dane bez nieograniczonego powiększania głównego zapisu.
7. **Starsza wersja aplikacji** może nie obsłużyć nowych pól — wtedy pokazuje bezpieczny ekran lub wymaga aktualizacji, ale nie niszczy zapisu.
8. **Zmiana wymagająca migracji** potrzebuje osobnej decyzji, planu i testów zgodności.

## Walidacja kopii

`validateBackup` i `backup` (`src/learning/backup.ts`) sprawdzają strukturę; części walidacji są w `src/learning/backup-validation/`. Walidacja nie zmienia źródła, zachowuje dodatkowe pola, zwraca niezależną kopię i nie migruje. Pełna kopia przechodzi następnie `validateFullBackup` (`src/history-backup.ts`): kompletność archiwum, skróty stron i zgodność podsumowania — tego kroku nie wolno pominąć przy imporcie.

## Słownik pól

### Postępy (`Progress`)

| Pole | Znaczenie |
| --- | --- |
| `adventure.completed[lessonKey]` | Ukończenie lekcji `{ at }`; historyczne `edition: 2` dla poprawionych lekcji Food (dopuszczalne tylko brak lub `2`) |
| `adventure.earned`, `adventure.purchases` | Portfel i zakupy kursu `angielski-hani` (dawny format, bez kopiowania) — D-42 |
| `adventure.courseHomes` | Portfele i zakupy pozostałych kursów; bez drugiego wpisu angielskiego |
| `rooms`, `unlockedItems` (w domku kursu) | Odblokowane pokoje i wyposażenie |
| zakup `{ cost, slot, room?, position? }` | `slot: null` bez `position` = schowek; brak `room` = salonik; `position: { x, y }` na siatce 24 × 15 (D-43–D-45) — [koci domek](koci-domek.md) |
| `adventure.sectionPlans` | Plan sekcji 7 + 2: siedem lekcji bazowych i dwa miejsca `after`; losowany raz przy wejściu w naukę mapową (D-48) |
| `adventure.memory` | Licznik utrwalenia 0–3 dla dokładnego klucza elementu z odwołaniem do materiału (D-48) |
| `stageReviews` | Dawne kolejki błędów etapów; zachowane, współpracują z `memory` |
| `encountered` | Unikalna lista kluczy elementów poznanych przez pierwszą próbę (D-25); bez ocen |
| `history.courses`, `history.items` | Podsumowania archiwum: sesje globalne osobno od modułowych; każda oceniona próba raz |

### Sesja

| Pole | Znaczenie |
| --- | --- |
| `training: { kind: map \| extra }` | Trening na mapie (zwykłe ukończenie lekcji) lub dodatkowy |
| `rewarded`, `lessonRewarded` | Nagroda za tę sesję już naliczona |
| `retentionCounted` | Sesja już rozliczona w liczniku utrwalenia |
| `fixedLength` | Nowa sesja o stałym zestawie (D-38); tylko takie dają 1 ★ za pełne powtórzenie |
| `legendary` | Poziom legendarny (D-50) |
| `ritual: opening \| finale` | Dobrowolne otwarcie lub finał modułu (D-49); przy `training.kind: extra` |
| `recall.stageId` | Kocia powtórka; klucz lekcji kończy się `-recall-1` / `-recall-2` |
| `scope: { kind: "course", courseId }` | Sesja globalna z poznanego zakresu kursu |
| `lesson.edition: 2` | Sesja z poprawionej wersji lekcji Food |
| `pairSelection`, `draftAnswer`, `gapPlacements`, `gapSelection`, `boardSummary` | Robocze stany plansz, banku i podsumowań; błędne słowo zostaje w `gapPlacements` |

### Element sesji

| Pole | Znaczenie |
| --- | --- |
| `pairGroup` / `presentation: bank` | Element planszy par lub luki z bankiem; w kolejce błędów zapisywany bez oprawy |
| `options` | Migawka 2–4 opcji słownictwa globalnego, by wznowienie miało ten sam zestaw |
| `listen` | Zadanie może być pokazane jako słuchanie; decyduje urządzenie przy wyświetleniu (D-58) |
| `sceneGroup` | Klucz pierwszej luki sceny; luki sceny stoją obok siebie, rozerwana grupa jest odrzucana (D-53) |

Każda luka sceny ma własny wpis w `attempts` pod kluczem zwykłego zadania (`moduł@rewizja:exercise:<scena>--<luka>`); pozycję w scenie wyznacza `index` sesji. Poprawki zachowują `first` i pierwotną `answer` (D-64).

## Wyliczane, nie zapisywane

Te informacje powstają przy odczycie i **nie mają własnych pól**:

- ocena w kocich łapkach — z `items` i `attempts` (D-64),
- kolor błędnej luki — z `attempts` (D-56),
- obsada kocich rozmówców — z identyfikatora sesji i sceny (D-54),
- rodzajniki w opcjach wyboru — dodawane do pytania, bez zmiany `options` (D-55),
- poznany zakres — z prób ostatnich sesji, aktywnej sesji, podsumowania archiwum i `encountered` (`known-material.ts`),
- widok postępów — tylko odczyt (D-57),
- aktualna treść lekcji — `lessonForProgress` zawsze zwraca aktualną definicję (D-52),
- odtwarzanie dźwięku — nie zmienia sesji, wyników ani historii.

## Niedostępna mapa

Błąd odczytu mapy jest stanem interfejsu, poza `Progress` i kopią. Niepełny katalog wstrzymuje migrację dawnych błędów i premie etapowe do czasu odzyskania; zwykłe nagrody za lekcje działają. Aktywna sesja niedostępnej mapy czeka zapisana. Przygotowanie do pustego treningu niczego nie zalicza — [odporność map](odpornosc-map.md).

## Pytania otwarte

- [U-05](decyzje.md#u-05) — dane przyszłego algorytmu treningu.
- [U-08](decyzje.md#u-08) — wiele aktywnych sesji, preferencje odpowiedzi per kurs, synchronizacja wyboru kursu.
- [U-01](decyzje.md#u-01) — dalsze rodzaje współdzielonych jednostek materiału.
