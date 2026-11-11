# Refaktoring — etap 1: zależności i wspólne stałe

Data: 11 listopada 2026. Zakres zatwierdzony po przeglądzie audytu: usunięcie cyklu mapy–domek i zebranie powielonych stałych, bez zmiany wyglądu, działania i zapisanych postępów.

## Wykonane zmiany

- [Model i klucze map](../src/learning/journey.ts) zawierają `Journey`, `Stage`, `Lesson`, `JourneyIssue`, `journeyKey`, `lessonKey` i `lessons`. Ten moduł nie zależy od domku ani nagród. `adventure.ts` zachowuje dotychczasowe eksporty, więc istniejące importy pozostają zgodne.
- [Zakres kursu](../src/learning/scope.ts) zawiera wspólny wybór kursu według modułu (`courseForModule`). Domek nie musi już importować wykonawczego modułu map `adventure.ts`. Dotychczasowy eksport `courseForModule` z domku pozostaje dostępny.
- [Wartości nagród](../src/learning/rewards.ts) są wspólne dla naliczania, opisów na mapie i wprowadzeniu, ustawień treningu oraz podsumowania premii etapu. Wartości pozostają: 3 za pierwsze ukończenie, 1 za pełną powtórkę, 1 za dodatkowy trening i 3 za dawną premię etapu. Warunki przyznawania pozostają bez zmian.
- [Identyfikator historycznego kursu](../src/materials/identity.ts) ma jedno źródło, używane przez wybór kursu, domek i walidację kopii. `house/catalog.ts` nadal udostępnia go jako zgodny eksport.
- [Katalog domku](../src/house/catalog.ts) udostępnia listę `slotIds` wyprowadzoną z `slots`; walidacja kopii korzysta z tej samej listy, zamiast własnej kopii.
- [Polska odmiana liczebników](../src/polish-count.ts) jest wspólna dla liczników ćwiczeń i etykiet zaległych słówek/zadań. Brzmienie etykiet nie zmienia się.

## Ochrona zgodności

Nie zmieniono publicznych materiałów, ich identyfikatorów i rewizji, formatu kopii, kluczy postępów, układu portfeli ani reguł Firebase. Nie wykonano migracji, resetu lub ponownego naliczania nagród. Nie zmieniono stylów ani grafik.

Przed edycją przygotowano deterministyczny zapis kontrolny: przejście pierwszej mapy Food z błędami, nagrody i premie, odblokowania, zakupy i drugi portfel kursu. Po zmianie ten zapis oraz wyniki przyjęcia/odrzucenia 13 kopii (stara wersja 1, bieżąca i celowo uszkodzone warianty) były identyczne bajt po bajcie. Osobno porównano HTML mapy, wprowadzenia i ustawień dla dwóch stanów postępów — wszystkie sześć wyników było identycznych.

Nowy [test granic i zgodności](../tests/refactor-boundaries.test.ts) sprawdza wykonawcze zależności po usunięciu importów typów, zachowanie starych eksportów i kluczy map, odmianę liczebników oraz odczyt starej kopii i walidację miejsc/portfela. To test granicy architektury; nie uzależnia treści interfejsu od formatowania kodu źródłowego.

W dwóch testach przeglądarkowych domku doprecyzowano oczekiwanie na widoczne pytanie po rozpoczęciu lekcji i na zapisane ustawienie dekoracji przed zamknięciem strony. Pierwszy pełny przebieg wykazał brak tych oczekiwań (84/86); nie zmieniono przez to działania aplikacji ani oczekiwanych rezultatów nauki i zapisu.

## Weryfikacja — 11 listopada 2026

- Przed zmianą: 158/158 testów Node.
- Po zmianie: **162/162 testy Node i 86/86 testów Playwright** gotowej aplikacji w Chrome, po doprecyzowaniu oczekiwań dwóch scenariuszy domku.
- `npm run build`: walidacja materiałów, TypeScript, budowanie i przygotowanie 206 plików PWA — poprawnie. Style i grafiki pozostają bez zmian.
- Kontrola odnośników dokumentacji i `git diff --check` — poprawnie. Nie wykonywano prób na fizycznym telefonie ani prawdziwych danych Hani; testy synchronizacji korzystają z adaptera testowego.

## Dalszy zakres

Ten etap nie dzieli walidatora kopii ani kontrolera nauki, nie zmienia doboru odpowiedzi, kryteriów językowych i testów zależnych od pozycji Food w katalogu. To osobne etapy. Oryginalny audyt pozostaje zapisem przeglądu sprzed tych zmian.
