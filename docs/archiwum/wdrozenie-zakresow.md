# Etap 3 — wybór kursu i poznany zakres globalny

Status: wdrożone lokalnie 10 listopada 2026 r. na prośbę użytkowniczki. Podstawą są D-06, D-15, D-25 i D-26; pozostałe zaparkowane pytania nie zostały rozstrzygnięte przez tę zmianę.

## Jak korzystać

Na stronie głównej pod powitaniem jest nazwa kursu i przycisk **Wybierz kurs**. Ten sam kontekst jest widoczny przy mapach, modułach i globalnych ćwiczeniach. Wybór filtruje mapy i moduły do danego podręcznika. Obecna biblioteka produkcyjna nadal zawiera jeden kurs z Food; francuski i włoski pozostają materiałami testowymi, nie dodanymi podręcznikami.

W sekcji ćwiczeń na stronie głównej oraz pod listą modułów jest **Ćwicz cały poznany materiał**. Prowadzi do trzech klikalnych kafelków:

- **Fiszki z poznanego materiału** — także słówka już rozwiązywane poprawnie. Dotychczasowe modułowe fiszki Food nadal pomijają słowa oznaczone jako zaliczone.
- **Quiz z poznanego materiału** — wcześniej próbowane pytania słownikowe oraz pytania powiązane z już poznanym znaczeniem.
- **Gramatyka z poznanego materiału** — konkretne pytania gramatyczne, na które była już próba odpowiedzi. Poznanie jednej reguły nie otwiera automatycznie wszystkich nowych pytań o tę regułę.

Zestaw obejmuje wybrany kurs, bez ograniczenia do aktualnego modułu, ale nie wprowadza jego niepoznanych przyszłych treści ani materiałów innego podręcznika. Każdy tryb dobiera do 10 zadań; mała pula pozostaje krótka, bez dopełniania nowymi treściami. Puste kafelki są nieaktywne, z wyjaśnieniem i przejściem do mapy lub modułów.

## Co oznacza poznanie

Wystarcza pierwsza próba odpowiedzi, również błędna lub w niedokończonej sesji. Samo obejrzenie wprowadzenia nie wystarcza. Próba quizu powiązanego przez `wordId` oznacza również poznanie tego znaczenia dla fiszki. Wykorzystywane są wcześniejsze sesje, bieżące odpowiedzi i podsumowania zarchiwizowanej historii.

Nowe pole `Progress.encountered` zapamiętuje same klucze elementów po próbie. Dzięki temu rozpoczęcie innej sesji nie usuwa informacji o poznaniu. Przy zastąpieniu starej aktywnej sesji bez tego pola zachowujemy klucze jej prób. Znacznik nie zastępuje oceny, wyniku pierwszej próby ani ukończenia lekcji. Jeden klucz jest zapisywany raz, niezależnie od liczby powtórzeń; wzrost zależy od liczby elementów i rewizji materiału, a nie od liczby sesji.

Dotychczasowe `words: known/review` nadal opisuje status modułowych fiszek. Nie jest samoistnym dowodem próby odpowiedzi — stare pasywne oznaczenie nie otwiera automatycznie całej globalnej puli. Po zmianie rewizji nowy element nie dziedziczy automatycznie poznania starej rewizji.

## Wybór i wpisywanie odpowiedzi

Użytkownik nadal wybiera wpisywanie, przyciski albo tryb mieszany. Jawne warianty podane w poleceniu wymuszają przyciski, także przy gramatyce.

W globalnych pytaniach słownikowych opcje nie podają innych niepoznanych haseł. Korzystają z poznanych słów tego kursu, z wykluczeniem dodatkowych poprawnych wariantów. Jeśli nie ma co najmniej dwóch sensownych opcji, odpowiedź trzeba wpisać. Katalog gramatyki opiera się na już próbowanych pytaniach; ich jawne opcje pozostają częścią tego znanego zadania.

Wybrane opcje zapisujemy przy pytaniu w sesji. Odświeżenie, kopia lub wznowienie offline nie losuje innego zestawu odpowiedzi. Kryteria poprawności, akcenty i jawne warianty nie zostały zmienione.

## Kurs a rozpoczęta sesja

Nadal jest **jedna aktywna sesja użytkownika**. Zmiana kursu nie usuwa jej ani nie tworzy drugiej. „Kontynuuj naukę” dotyczy wybranego kursu; jeśli sesja pochodzi z innego, jest osobna informacja i przycisk **Wróć do rozpoczętej sesji**. Powrót przywraca też jej kontekst kursu. Rozpoczęcie nowej sesji w miejsce istniejącej nadal wymaga potwierdzenia; odmowa zachowuje sesję bez zmian.

Wybór kursu jest lokalną preferencją interfejsu w IndexedDB, osobną dla gościa i każdego konta. Nie jest częścią kopii wyników ani synchronizacji. Na nowym urządzeniu można wybrać kurs ponownie; domyślnie korzystamy z kontekstu aktywnej lub ostatniej sesji, następnie pierwszego dostępnego kursu. Usunięty z katalogu wybór jest ignorowany. Błąd zapamiętania preferencji nie blokuje nauki i nie oznacza błędu zapisu ocen.

## Wyniki, historia i nagrody

Globalne ćwiczenia korzystają z tych samych kluczy materiału co moduł i współdzielą jego odpowiedzi oraz trudności w danym kursie. Nie kończą lekcji na mapie, nie resetują jej ukończeń i nie dają dodatkowych gwiazdek. Dodatkowy trening za 1 ★ i trening na mapie za 3 ★ pozostają odrębnymi funkcjami.

Błędy z globalnych ćwiczeń trafiają do zwykłych trudności, nie są automatycznie przypisywane do kolejki błędów konkretnego etapu mapy. Reguły trzech zaliczeń w etapowych powtórkach Food pozostają bez zmian.

W historii sesja globalna jest podpisana kursem i rodzajem ćwiczeń, zamiast nazwą przypadkowego modułu. Statystyki ogólne obejmują wszystkie odpowiedzi. W sekcji „Moduł po module” pozostają sesje modułowe; podpis wyjaśnia, gdzie są wyniki przekrojowe. Przy kompakcji globalne podsumowania są w `history.courses`, a nie dopisywane do wyników Food. Wszystkie próby nadal są w `history.items`; pełna kopia weryfikuje zgodność liczników z archiwum.

## Miejsca w kodzie

| Odpowiedzialność | Plik |
| --- | --- |
| Odczyt prób i poznanych elementów | `src/learning/known-material.ts` |
| Globalna pula i sesja | `src/learning/course-practice.ts` |
| Zapamiętanie pierwszej próby i zastąpienie sesji | `src/learning/session.ts` |
| Lokalna preferencja kursu i powrót do sesji | `src/controllers/courses.ts` |
| Kontekst kursu, lista kursów i globalne kafelki | `src/views/courses.ts` |
| Wybór modułów i map bieżącego kursu | `src/app/selectors.ts` |
| Przejścia i rozpoczęcie ćwiczeń | `src/controllers/learning.ts` |
| Opcjonalny zakres, opcje i podsumowania kopii | `src/learning/backup.ts`, `src/history.ts`, `src/history-backup.ts` |

## Zgodność i sprawdzenie

- **130/130 testów Node**, w tym 16 nowych scenariuszy poznanego zakresu, opcji, historii, zachowania postępów i preferencji kont.
- **68/68 testów Playwright** gotowej aplikacji na `/HaniaAngielski/` w Chrome, bez pominięć. Obejmują Food, wybór kursu na telefonie, powrót po odświeżeniu, odmowę zastąpienia sesji, konto, pełne kopie i PWA.
- Nowy test PWA kończy globalną sesję offline, wznawia aplikację i sprawdza wysłanie zakresu i wyników konta po połączeniu. Adapter Firebase jest testowy; nie zmieniano prawdziwych wyników Hani.
- Budowanie i walidacja treści przechodzą. Nie zmieniono plików `public/content/02-food/`, identyfikatorów lekcji ani materiałów, istniejących reguł Firestore lub mechanizmu konfliktów.
- Format kopii nadal ma wersję 1 i odczytuje stare pliki. Nowe opcjonalne pola wymagają aktualnej aplikacji do obsługi globalnego zakresu; nie trzeba eksportować/importować starych postępów przy aktualizacji.
- Bez nowych bibliotek i obrazków. Główny kod po kompresji około 45,5 kB; Firebase nadal ładowany osobno. Cache PWA nadal obejmuje 196 plików.
- Nie wykonano publikacji na GitHub Pages. Pozostałe pytania, algorytm odstępów i prace nad źródłami Food pozostają oddzielnym zakresem.
