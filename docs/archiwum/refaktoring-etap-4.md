# Refaktoring — etap 4: podział walidacji kopii

Data: 11 listopada 2026. Cel: ułatwić utrzymanie walidatora bez zmiany formatu kopii, obsługi dawnych danych i działania aplikacji.

## Podział odpowiedzialności

[Publiczny punkt wejścia](../../src/learning/backup.ts) nadal udostępnia `validateBackup` i `backup`. Sprawdza nagłówek pliku, wywołuje poszczególne kontrole i zwraca niezależną kopię danych. Zachowuje dotychczasowy komunikat błędu. Nie normalizuje, nie usuwa pól i nie migruje postępów.

| Część | Odpowiedzialność |
| --- | --- |
| [values.ts](../../src/learning/backup-validation/values.ts) | Dotychczasowe reguły obiektów, tekstów, dat, liczb i bezpiecznych identyfikatorów |
| [session.ts](../../src/learning/backup-validation/session.ts) | Element zadania, aktywna/ukończona sesja, odpowiedzi, tryby i opcjonalne znaczniki |
| [home.ts](../../src/learning/backup-validation/home.ts) | Portfel, zakupy, pokoje, odblokowania i zajętość miejsc w domku |
| [adventure.ts](../../src/learning/backup-validation/adventure.ts) | Ukończenia, domki kursów, stan powtórek etapów i ich nagrody |
| [history.ts](../../src/learning/backup-validation/history.ts) | Struktura podsumowania historii i liczby sesji modułowych/kursowych |
| [archives.ts](../../src/learning/backup-validation/archives.ts) | Struktura części archiwum i brak powielonych stron/sesji względem bieżącego zapisu |
| [progress.ts](../../src/learning/backup-validation/progress.ts) | Bieżące postępy, unikalność sesji i powiązanie aktywnej powtórki z kolejką etapu |

Funkcje pomocnicze zwracają wynik sprawdzenia, nie zapisują danych i nie wyświetlają komunikatów. Publiczny punkt wejścia składa całą walidację; pojedynczy helper nie zastępuje sprawdzenia pełnej kopii.

## Co pozostaje bez zmian

- Wersja kopii `1`, nazwy pól, identyfikatory i limity danych.
- Obsługa starych kopii, sesji bez nowych pól opcjonalnych, dawnych wydań lekcji i portfela angielskiego.
- Warunki przyjmowania/odrzucania pliku i dotychczasowy komunikat błędu.
- Zachowanie pól dodatkowych oraz brak modyfikowania przekazanego źródła.
- Mechanizmy zapisu, synchronizacji, importu i eksportu. Nie zmieniano IndexedDB, reguł Firebase, widoków, stylów ani materiałów Food.

`validateBackup` nadal sprawdza strukturę. [validateFullBackup](../../src/history-backup.ts) nadal osobno kontroluje powiązanie i kompletność archiwum, skróty stron oraz zgodność podsumowania z historią. Jego logiki nie przepisywano. Plik ze strukturalnie poprawnym identyfikatorem strony może nie przejść sprawdzenia integralności pełnej kopii — to zamierzone rozdzielenie.

## Dowody zgodności

Przed zmianą wykonano 170/170 istniejących testów Node oraz zapisano wynik oryginalnego walidatora dla **116 przypadków: 21 przyjętych i 95 odrzuconych**. Zestaw obejmuje starą kopię wersji 1, aktywne i ukończone sesje, trening, lekcję z wydaniem 2, zakres kursu, domki i portfele, podsumowania i archiwa oraz aktywne powtórki. Celowo uszkodzone warianty obejmują brakujące pola, błędne indeksy i tryby, kolizje sesji, przekroczenie salda, nieprawidłowe pokoje i powiązania powtórek.

[Przypadki](../../tests/fixtures/backup-validation-cases.ts) są generowane z małych danych syntetycznych i dawnej fixture. [Wyniki odniesienia](../../tests/fixtures/backup-validation-results.json) pochodzą ze starej implementacji: dla przyjętych plików zawierają skrót dokładnej serializacji wyniku, dla odrzuconych treść błędu. Po podziale otrzymano identyczny plik wyników, bajt po bajcie.

[Test regresji](../../tests/backup-validation.test.ts) porównuje cały zestaw z tym odniesieniem, sprawdza brak mutacji źródła, niezależność zwracanej kopii i granicę między walidacją struktury a integralnością historii. Nie regenerujemy odniesienia automatycznie po zmianie kodu; zmiana kryteriów wymaga osobnego uzgodnienia i świadomego przeglądu wyników.

## Weryfikacja — 11 listopada 2026

- 173/173 testy Node przeszły na zwykłej bibliotece i na wirtualnym rozszerzeniu o kolejne moduły/kursy. Trzy nowe testy publicznego kontraktu obejmują zestaw 116 wariantów, brak mutacji oraz integralność historii.
- 88/88 testów Playwright gotowej aplikacji w Chrome przeszło, z importem/eksportem, archiwizacją, kontami, drugim urządzeniem, domkiem i Food offline. Dotychczasowych oczekiwań nie zmieniano.
- `npm run build` przeszedł walidację treści, TypeScript, budowanie i przygotowanie 206 zasobów PWA. Style i grafiki pozostają bez zmian.
- Kontrola odnośników dokumentacji i `git diff --check` przeszły. Nie wykonywano prób na fizycznym telefonie ani rzeczywistych danych Hani; synchronizacja korzysta z adaptera testowego.

## Dalszy zakres

Nie wprowadzono nowych kryteriów poprawności danych ani biblioteki schematów. Ewentualne nowe pola i migracje trzeba projektować osobno, zachowując dotychczasowy kontrakt. Pozostałe propozycje audytu nie są wdrażane przy okazji tego podziału.
