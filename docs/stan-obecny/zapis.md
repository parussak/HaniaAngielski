# Konta, postępy i offline — stan obecny

[Zakres przeglądu](../README.md). Opis potwierdzono w kodzie i testach lokalnych; nie odczytywano prywatnych kont ani wdrożonych reguł produkcyjnego Firebase.

## Co jest zapisywane

`Progress` w wersji `1` przechowuje ukończone sesje, jedną aktywną sesję, statusy słów i trudne zadania. Opcjonalnie zawiera podsumowanie starszej historii oraz dane przygód: ukończone lekcje, kolejki powtórek etapowych, gwiazdki, zakupy i ustawienie domku.

Aktywna sesja przechowuje m.in. kolejność pozycji, indeks pytania, fazę, pierwsze odpowiedzi i poprawki. To pozwala wznowić naukę także po błędzie lub odświeżeniu.

Nie ma osobnej aktywnej sesji dla każdego języka. Nie ma też pola kursu w sesji: kontekst opiera się na `moduleId`, a sesja z wcześniejszymi modułami może zawierać pozycje z kilku modułów.

Źródła: [model](../../src/learning/model.ts), [obsługa sesji](../../src/learning/session.ts), [walidacja kopii](../../src/learning/backup.ts).

## Urządzenie, gość i konta

IndexedDB ma przestrzeń `hania-language:` zależną od ścieżki strony, wersję bazy `1` i magazyn `progress`. Główne klucze to:

| Klucz | Przeznaczenie |
| --- | --- |
| `current` | Osobny zapis bez konta |
| `account:<uid>` | Lokalny zapis konta wraz ze stanem synchronizacji |
| `firebase-user` | Dane potrzebne do przywrócenia kontekstu konta |
| `history-page:<hash>` | Niezmienne części starszej historii |

Konta mają oddzielne wyniki. Przy logowaniu zapis gościa nie jest automatycznie dopisywany do konta; użytkownik może świadomie wybrać przeniesienie. Wylogowanie przywraca osobny kontekst gościa. Zmiana imienia lub potwierdzona zmiana e-maila nie zmienia Firebase UID, według którego przypisane są postępy.

Nazwa ścieżki strony jest częścią lokalnej przestrzeni zapisu. Zmiana adresu wdrożenia może więc oznaczać inną lokalną bazę, mimo zachowania danych konta w chmurze.

Źródła: [storage.ts](../../src/storage.ts), [konto](../../src/controllers/account.ts), [Firebase](../../src/firebase.ts), [testy rozdzielenia kont](../../tests/sync.test.ts).

## Bezpieczny zapis i synchronizacja

Zmiana wyników powstaje na kopii. Dla gościa jest przygotowywana i zapisywana lokalnie, a dla konta przechodzi przez `ProgressSync` z kontrolą lokalnej wersji. Interfejs otrzymuje potwierdzony stan. Konto korzysta z lokalnego zapisu także bez sieci; oczekujące zmiany są wysyłane po połączeniu podczas pracy aplikacji lub kolejnego uruchomienia.

Firebase przechowuje główny dokument pod `users/<uid>/progress/main`. Rewizja zwiększa się transakcyjnie. Rozbieżność między urządzeniami wywołuje konflikt i wybór zapisu, a nie dowolne automatyczne scalenie odpowiedzi. Przewidziana jest kopia sprzed zastąpienia. Spóźnione odpowiedzi sieciowe są odcinane po zmianie konta.

Przy starcie aplikacja utrzymuje blokadę przeglądarki, aby dwie karty pod tą samą ścieżką nie zapisywały jednocześnie. Mechanizm wymaga obsługi Web Locks.

Źródła: [kontroler postępów](../../src/controllers/progress.ts), [ProgressSync](../../src/sync.ts), [planowanie synchronizacji](../../src/services/sync-scheduler.ts), [rozruch i blokada](../../src/app/startup.ts), [testy synchronizacji](../../tests/sync.test.ts).

## Historia i kopie

Historia nie znika po przekroczeniu rozmiaru bieżącego zapisu. Kod pozostawia do 30 ostatnich pełnych sesji lub mniejszy zestaw wynikający z budżetu około 90 KB, co najmniej jedną. Starsze sesje trafiają do części powiązanych skrótem SHA-256 i podsumowań statystycznych. Części są zapisywane przed zmianą odnośnika do historii.

Lokalne części mają limit 200 000 bajtów. Reguły Firebase przewidują limit 700 000 dla głównego payloadu i 200 000 dla części historii; dane są dodatkowo sprawdzane przez kod. To ograniczenia implementacji, nie gwarancja nieskończonego miejsca.

Eksport formatu `hania-language`, wersja `1`, zawiera postępy oraz potrzebne archiwa. Import kontroluje strukturę, powiązania, skróty i podsumowania, ma limit pliku 50 MB i wymaga potwierdzenia zastąpienia wyników. Kopia nie zawiera materiałów podręcznikowych. Starszy brakujący moduł może uniemożliwić wznowienie sesji, ale nie powinien usuwać jej historii.

Źródła: [historia](../../src/history.ts), [pełne kopie](../../src/history-backup.ts), [import/eksport](../../src/controllers/backup.ts), [reguły](../../firestore.rules), [testy historii](../../tests/history.test.ts).

## PWA i materiały offline

Service worker przygotowuje cache całego publicznego wydania, w tym JSON i ilustracji. Rozruch offline wymaga wcześniejszego poprawnego pobrania. Nowa wersja oczekuje na przycisk aktualizacji; aktywacja nie usuwa IndexedDB. Odpowiedzi Firebase i tokeny nie są dodawane do tego cache.

Obecnie nie ma pobierania wybranych kursów na żądanie. Dodanie wielu podręczników zwiększy początkowy zestaw offline. Synchronizacja nie jest niezależną usługą działającą stale po zamknięciu aplikacji.

Źródła: [PWA](../../src/pwa.ts), [generator service workera](../../scripts/build-sw.mjs), [testy PWA](../../tests/browser/pwa.spec.ts).

## Granice obecnego modelu

Postępy poszczególnych modułów są rozróżnialne dzięki `moduleId`, lecz nie ma zapisów na kurs, osobnych preferencji nauki per język ani statystyk kursowych. Wspólny bilans gwiazdek i jeden domek są obecnym zachowaniem, nie błędem do automatycznego naprawienia przy dodaniu francuskiego.

Przy rozwoju należy zdecydować, co pozostaje wspólne, zachowując istniejące identyfikatory i kopie. Ten przegląd nie wprowadza nowego schematu ani migracji.
