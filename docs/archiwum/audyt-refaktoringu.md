# Audyt „Małe kroki” pod kątem bezpiecznego refaktoringu i pracy z AI

**Raport historyczny z 10 listopada 2026.** Poniższe ustalenia i wyniki zachowują stan z dnia audytu. Po wykonaniu porządków obowiązuje [aktualny status ustaleń](status-audytu.md), z rozróżnieniem rzeczy zamkniętych, pozostałych i niewymagających zmiany.

Data audytu: 10 listopada 2026. Zakres: kod (`src/`, ok. 3,5 tys. linii TypeScript), testy (`tests/`), dokumentacja (`docs/`, `README.md`, skill `male-kroki-dokumentacja`), workflow GitHub. W ramach audytu niczego nie zmieniano w aplikacji, materiałach ani istniejącej dokumentacji, nie wykonano commita, pushu ani publikacji. Ten plik jest jedynym dodanym.

## 0. Co sprawdzono, a czego nie

**Wykonano** (na kopii plików w odizolowanym środowisku, Node 22; CI używa Node 24):
- `npm ci`, `npm test` – 158/158 testów Node przeszło (zgodnie z `docs/07-testy.md`),
- `npm run check:content` – przeszło,
- `tsc --noEmit` i `vite build` + `scripts/build-sw.mjs` – przeszły,
- `scripts/check-docs.mjs` (linki i skill) – przeszło,
- statyczna analiza: graf importów, cykle, duplikacje, porównanie dokumentacji z kodem.

**Nie sprawdzono:**
- testów Playwright ani działania w prawdziwej przeglądarce/PWA/offline (brak powłoki na komputerze i przeglądarki w tym środowisku). Dokumentacja podaje 86/86; w kodzie naliczyłem 72 wywołania `test(` w `tests/browser/*.spec.ts` – różnica może wynikać z testów generowanych w pętlach lub z nieaktualnej liczby, **nie potwierdzono**,
- historii git (commit bazowy, zmiany niezatwierdzone) i faktycznie opublikowanej strony,
- Firebase na żywo (reguły i synchronizacja tylko z kodu i testów z atrapami),
- 186 ilustracji SVG i ikon PWA: w kopii były puste zaślepki, więc nie oceniano treści graficznych,
- żadnych prawdziwych danych Hani.

## 1. Krótka ocena obecnej struktury

Struktura jest **zdrowsza, niż sugeruje cel „uporządkować kod”**. Warstwy są rozpoznawalne: `learning/` (mechanika sesji i pytań), `materials/` (model i walidacja materiałów), `house/` (domki), `adventure.ts` i `stage-review.ts` (mapy, nagrody), `sync.ts`/`firebase.ts`/`storage.ts` (zapis i synchronizacja), `controllers/` + `app/` + `views/` (interfejs). Moduły logiki (`learning`, `materials`, `house`) nie sięgają do DOM, Firebase ani IndexedDB (sprawdzone wyszukiwaniem). Pliki są małe (największy: `controllers/learning.ts`, 245 linii), kontrolki zapisu mają jednego piszącego (`navigator.locks`, kolejka w `sync.ts`), a zgodność danych jest traktowana poważnie (klucze `moduleId@rev:typ:id`, wersje wydań lekcji, testy kopii z wersji 1).

Nie ma tu ani jednego pliku, który wymagałby pilnego „rozbicia”. Ryzyko leży w kilku **miejscach, gdzie ta sama reguła żyje w dwóch–trzech plikach**, w **domyślnych założeniach „Food/angielski” w kilku wspólnych miejscach** oraz w **kruchości części testów**. To są małe, lokalne poprawki, nie przebudowa.

## 2. Rozwiązania, które warto zachować

1. **Odczyt dawnego angielskiego zapisu bez przepisywania.** Dawny portfel leży w korzeniu `p.adventure`, a kolejne kursy w `adventure.courseHomes[kurs]` (`src/house/progress.ts`: `homeFor`/`ensureHome`, `src/house/catalog.ts`: `legacyCourse='angielski-hani'`). To jest świadomy, jednokierunkowy odczyt zgodny z D-42. Nie ma powodu migrować formatu; migracja zwiększałaby ryzyko utraty gwiazdek i zakupów bez korzyści dla funkcji. **Nie ruszać układu danych.**
2. **Klucze postępu z wersją elementu** (`moduleId@rev:typ:id`) i `sessionCompatible` – dzięki temu stare sesje i stare wydania lekcji nie psują nowych. Pokryte testami (`tests/stage2.test.ts` I7, `tests/course-practice.test.ts`).
3. **Pojedynczy zapis z blokadą i CAS po stronie Firestore** (`src/sync.ts`, `firestore.rules`: rewizja +1, limit rozmiaru, niezmienna historia) oraz **historia adresowana skrótem SHA-256** – prosty, odporny model.
4. **Następny krok wyliczany, nie przechowywany** (`src/next-step.ts`) – brak kursora, który mógłby się rozjechać z postępem.
5. **Walidacja materiałów jako osobny krok budowania** (`check:content` w `npm run build`), a testy Node jako szybka, deterministyczna siatka bezpieczeństwa (158 testów, brak zależności od przeglądarki).
6. **System dokumentacji**: statusy w `docs/README.md` (stan obecny / uzgodnione D-xx / do ustalenia U-xx / propozycja), rejestr decyzji, skill z listą dokumentów dla typu zmiany i skrypt `check-docs.mjs`. To realnie ogranicza kontekst potrzebny agentowi.
7. **Konfiguracja Playwright sterowana zmiennymi środowiska**, bez zależności od Windows poza jedną gałęzią `npm.cmd`.

## 3. Najważniejsze ustalenia (wg wpływu i ryzyka)

Legenda: **[BŁĄD]** potwierdzony błąd · **[ROZBIEŻNOŚĆ]** specyfikacja vs kod/testy · **[RYZYKO]** ryzyko architektoniczne · **[OPCJA]** opcjonalne usprawnienie. **W tym audycie nie potwierdziłem żadnego błędu funkcjonalnego** – wszystkie poniższe punkty to ryzyka lub rozbieżności.

### 3.1 [RYZYKO] Reguły nagród i portfela rozproszone w kilku plikach, z cyklem importu

- **Dowód:** `src/house/progress.ts` importuje `journeyKey`, `lessons` z `src/adventure.ts`, a `adventure.ts` (`rewardCompletion`, ok. linii 84–98) importuje z `house/progress.ts` `creditStars`, `courseForModule`. To cykl uruchomieniowy między „domkiem” a „mapą”. Wartości nagród (3 / 1 / 1 gwiazdki) są w `adventure.ts` (`rewardCompletion`), a nagroda za powtórkę etapu osobno w `src/stage-review.ts` (ok. linii 82, `creditStars(p,3,…)`). Dodatkowo `src/controllers/learning.ts` (ok. linii 215–232) liczy w widoku, co zostanie wyświetlone jako nagroda.
- **Konsekwencja:** zmiana zasady (np. D-33/D-40 – ile gwiazdek za co) wymaga zmian w 3 plikach i łatwo o niespójność między tym, co przyznane, a tym, co pokazane. Cykl działa dziś, bo importy są używane dopiero w funkcjach, ale utrudnia wydzielenie i testowanie domku niezależnie od map.
- **Rekomendacja:** przenieść **bez zmiany zachowania** wspólne funkcje kluczy i wyboru kursu (`journeyKey`, `lessons`, `courseForModule`) do małego modułu zależnego tylko od typów, tak by `house/` nie importował `adventure.ts`. Wartości nagród zebrać w jednym miejscu jako stałe (nie zmieniając ich), a widok niech je stamtąd czyta.
- **Jak sprawdzić bezpieczeństwo:** `tests/house.test.ts`, `tests/adventure.test.ts`, `tests/stage-review.test.ts`, `tests/sync.test.ts` (część domku) bez żadnych zmian w testach; dodatkowo porównanie wyniku `backup(progress)` przed/po na istniejących fixtures (`tests/fixtures/backup-v1.json`) – ma być identyczne bajt w bajt.

### 3.2 [RYZYKO] Zaszyte założenia „Food” i „angielski” we wspólnych miejscach

- **Dowód:**
  - `src/house/catalog.ts`: `decorations` mają wartości `map:` kluczowane mapami Food; `legacyCourse='angielski-hani'` jest też powielone jako literał w `src/learning/backup.ts` (ok. linia 84).
  - `src/adventure.ts` ok. linia 58: domyślna ścieżka mapy Food w `readJourneys/loadJourneys`.
  - `src/learning/vocabulary-answer.ts`: logika a/an jest angielska i siedzi we wspólnym katalogu `learning/`.
  - `src/learning/questions.ts` `requiresChoice`: heurystyka oparta na regexach po treści polskiego/angielskiego polecenia.
  - `src/learning/backup.ts` ok. linia 63: **własna kopia listy slotów** domku (zamiast importu z `house/catalog.ts`), linia 14: własna lista trybów.
- **Konsekwencja:** dodanie kursu francuskiego lub włoskiego (cel produktu) wymaga szukania takich miejsc „po grepie”. Nie są to błędy dziś, ale to **najczęstsze miejsce, gdzie nowy język cicho zadziała jak angielski** (np. a/an, rozpoznawanie typu pytania). Jedynym kursem produkcyjnym jest dziś angielski, więc nic się nie psuje.
- **Rekomendacja:** (a) w `learning/backup.ts` importować listę slotów i `legacyCourse` z jednego źródła; (b) oznaczyć w dokumentacji (`docs/rozwoj-jezykow.md`) listę miejsc zależnych od języka: a/an, `requiresChoice`; (c) **nie** projektować teraz abstrakcji „reguły języka” – dopiero przy pierwszym drugim języku, gdy będzie wiadomo, co się naprawdę różni. To mieści się w zasadzie „nie rozstrzygaj otwartych decyzji produktowych”.
- **Jak sprawdzić:** `tests/house.test.ts`, `tests/core.test.ts` (walidacja kopii), `tests/courses.test.ts`; test kopii ze starych fixtures musi przejść bez zmian.

### 3.3 [RYZYKO] `validateBackup` jako monolit z powielonymi regułami

- **Dowód:** `src/learning/backup.ts` – jedna funkcja `validateBackup` (linie ok. 3–119) waliduje progres, sesje, adventure, domek, archiwum recenzji w jednym ciągu. Zawiera kopie list (sloty, tryby) i literał kursu starszego.
- **Konsekwencja:** każda zmiana kształtu danych (nowy typ ćwiczenia, nowy pokój, nowe pole kursu) trzeba dopisać tutaj ręcznie; błąd w walidacji = odrzucenie kopii użytkownika (utrata danych przy imporcie) lub, odwrotnie, przyjęcie uszkodzonej. To miejsce o najwyższej „kosztowności błędu” w repozytorium.
- **Rekomendacja:** **nie przepisywać**. Podzielić na funkcje pomocnicze (`validateSessions`, `validateAdventure`, `validateHome`) z zachowaniem dokładnie tych samych warunków, najlepiej po jednym kawałku na etap. Zachować komunikaty błędów.
- **Jak sprawdzić:** wszystkie testy kopii (`backup-v1.json`, testy odrzucania w `tests/core.test.ts`, `tests/course-practice.test.ts`, `tests/history.test.ts`), plus jednorazowo porównanie wyniku walidacji dla zestawu poprawnych i celowo uszkodzonych kopii przed/po (różnica = zero).

### 3.4 [RYZYKO] Kruche testy sprawdzające tekst kodu źródłowego

- **Dowód:** `tests/stage1.test.ts:65` czyta `src/views/home.ts` i sprawdza, czy zawiera dosłowny napis „się od małych kroków.”; `tests/stage2.test.ts:44` czyta `src/views/study.ts` i `setup.ts` jako tekst; `tests/stage3.test.ts:8–12` czyta `src/style.css` i `playwright.config.ts` jako tekst. 15 plików testów używa `readFileSync` (większość do wczytywania `public/content/*.json` i fixtures – to jest w porządku). Dokument `docs/stan-obecny/testy.md` sam opisuje tę kruchość i historyczne nazwy `stage1/2/3`.
- **Konsekwencja:** zmiana układu szablonu lub przeniesienie tekstu rozbije test, choć zachowanie się nie zmieniło; to dokładnie ten typ zmiany, który refaktoring powinien umożliwiać.
- **Rekomendacja:** przy refaktoringu widoków zamienić te kilka asercji tekstowych na sprawdzenie zachowania w istniejących testach Playwright albo je usunąć, gdy to samo jest pokryte gdzie indziej. **Nie dodawać nowych testów dla pokrycia.** Pozostałe testy tekstowe konfiguracji (Playwright, CSS bez Google Fonts) są tanie i uzasadnione – zostawić.
- **Jak sprawdzić:** przed zmianą ustalić (uruchomić Playwright lokalnie), że zachowanie, które test miał chronić, jest pokryte; dopiero wtedy usunąć asercję.

### 3.5 [RYZYKO] Testy zakładają `modules[0]` = Food i jeden kurs

- **Dowód:** `tests/materials.ts` + `const m=modules[0]` w `tests/stage1.test.ts:6`, `stage2.test.ts:6`, `training.test.ts:15`, `core.test.ts:8`, `course-practice.test.ts:19`, `active-flashcards.test.ts`, `illustrations.test.ts`; `tests/content.test.ts:7` ma `assert.equal(modules.length,1)`, `tests/courses.test.ts:19` `assert.equal(courses.length,1)`; `tests/adventure.test.ts:8`, `stage-review.test.ts:10`, `next-step.test.ts:9` wczytują na sztywno `public/content/02-food/sciezka.json`.
- **Konsekwencja:** dodanie drugiego modułu lub kursu do `public/content` **rozbije kilka testów mimo poprawnego działania aplikacji**. To bezpośrednio uderza w plan kolejnych kursów. Niektóre testy są świadomie „o Food” (dokumentacja to mówi) – tych nie ruszać; chodzi o testy mechaniki, które Food używają tylko jako przykładu.
- **Rekomendacja:** mechanikę testować na istniejącym `tests/fixtures/course-materials.ts` (już jest i jest używany w `courses.test.ts` oraz `course-practice.test.ts`), a testy „treści produkcyjnej Food” zostawić jako osobną grupę. Robić to stopniowo, dopiero gdy pojawi się drugi kurs.
- **Jak sprawdzić:** liczba i nazwy testów przed/po; dodać tymczasowo drugi moduł fixture i zobaczyć, które testy pękają.

### 3.6 [RYZYKO] Rozrost `controllers/learning.ts` i łańcuch `if` w obsłudze akcji

- **Dowód:** `src/controllers/learning.ts` (245 linii): `handleAction` jako łańcuch `if`, powtarzający się wzorzec „potwierdź → `replaceActive`” (np. przy `startStageReview`), akcje domku i obliczenia nagród w jednym pliku; `src/app/events.ts` rozsyła kliknięcia łańcuchem (z pośrednim przyciskiem `answer-form`).
- **Konsekwencja:** dodanie typu ćwiczenia lub akcji dotyka tego samego pliku i wymaga wiedzy o wszystkich pozostałych gałęziach. Na razie plik jest wciąż czytelny; to **ryzyko wzrostu, nie bieżący problem**.
- **Rekomendacja:** wydzielić **tylko** akcje domku (kupno, ustawienie) do osobnego kontrolera oraz powtarzany wzorzec „zastąp aktywną sesję po potwierdzeniu” do jednej funkcji. Nie wprowadzać frameworka zdarzeń ani rejestru akcji.
- **Jak sprawdzić:** testy Playwright (`house.spec.ts`, `stage-review.spec.ts`, `adventure.spec.ts`, `training.spec.ts`) – obowiązkowo uruchomione lokalnie przed i po (w tym audycie **nie** uruchomiono).

### 3.7 [RYZYKO] Dwie niezależne implementacje polskiej liczby mnogiej

- **Dowód:** `src/stage-review.ts` linie 51–52 (`plural`, `pendingLabel`) i `src/learning/map-progress.ts` (`exerciseCount`).
- **Konsekwencja:** poprawka odmiany w jednym miejscu nie dotyczy drugiego; drobne, ale dotyczy tekstów widzianych przez Hanię. Przy francuskim/włoskim interfejsie pozostanie polski (język objaśnień), więc to nie blokuje rozwoju.
- **Rekomendacja:** [OPCJA] jedna mała funkcja pomocnicza. Niski priorytet; zrobić przy okazji etapu 1.

### 3.8 [OPCJA] Domyślne dystraktory w pytaniach o słówka są zawsze te same

- **Dowód:** `src/learning/questions.ts` ok. linii 55: jeśli pytanie nie ma własnych opcji, złe odpowiedzi to **pierwsze dwa inne słówka modułu** (`.slice(0, 2)`). Kolejność opcji jest tasowana deterministycznie (`optionsFor`), ale zestaw błędnych odpowiedzi – nie.
- **Konsekwencja:** w quizie wybierającym dla tego samego słówka zawsze pojawią się te same dwie błędne odpowiedzi, co ułatwia zgadywanie. To zachowanie produktowe, nie błąd; zmiana zmieniłaby sposób nauki, więc **nie część refaktoringu** (zasada „nie rozstrzygaj decyzji produktowych”). Odnotowuję jako kandydata do osobnej decyzji.

### 3.9 [RYZYKO] Walidacja ścieżki mapy ładowana dopiero przy użyciu

- **Dowód:** `src/adventure.ts` 57–74: `readJourneys/loadJourneys` pobierają `fetch(new URL('content/…', document.baseURI))` – jedyne miejsce w warstwie „logiki”, które zależy od środowiska przeglądarki (kontrastuje z czystością `learning/`, `materials/`, `house/`). Testy omijają to, wczytując JSON z dysku.
- **Konsekwencja:** logika map jest trudniejsza do użycia w skryptach (np. `check:content`) bez udawania przeglądarki; oddzielenie „skąd wczytać” od „jak zwalidować” wyjaśniłoby granicę.
- **Rekomendacja:** [OPCJA] podać funkcję pobierającą (`read`) jako parametr, jak już robi `readLibrary` w `materials/library.ts`. Tam, gdzie jest ten wzorzec, już działa i jest testowany.

## 4. Lista rozbieżności: dokumentacja – kod – testy

| # | Rozbieżność | Rodzaj | Gdzie |
|---|---|---|---|
| R1 | `README.md` (sekcja GitHub Pages) mówi, że `pages.yml` publikuje każdy push na `main` po testach i budowaniu. Workflow robi dokładnie to (`npm ci`, `npm test`, `npm run build`), **ale nie uruchamia `check:content` osobno** (jest w `build`, więc pośrednio tak) i **nie uruchamia Playwright**. Opis jest zgodny; dokument `docs/07-testy.md` poprawnie zaznacza brak Playwright w CI. | zgodne, ale warto wiedzieć | `.github/workflows/pages.yml`, `checks.yml` |
| R2 | `docs/07-testy.md` podaje 86/86 testów Playwright; w `tests/browser/*.spec.ts` naliczono 72 wywołania `test(`. Możliwe wytłumaczenia: pętle generujące testy lub nieaktualna liczba. **Nie sprawdzono przez uruchomienie.** | do weryfikacji | `docs/07-testy.md`, `tests/browser/` |
| R3 | `docs/07-testy.md` ma charakter dziennika (kolejne liczby 84→114→130→137→144→146→151→158). Poprawny jako historia, ale trudny jako „aktualne zasady testowania” – agent musi doczytać do końca, by wiedzieć, jaka liczba obowiązuje. | czytelność | `docs/07-testy.md` |
| R4 | Brak skryptu `check:docs` w `package.json`, mimo że `scripts/check-docs.mjs` istnieje (działa po ręcznym uruchomieniu) i skill go opisuje; nie jest częścią CI ani `build`. | brak kontraktu | `package.json`, `.github/workflows/` |
| R5 | Nazwy plików testów `stage1/2/3.test.ts` są historyczne i nie mówią, co testują (opisane w `docs/stan-obecny/testy.md`); zasady dokumentu o „rozdzieleniu testów mechaniki, materiałów, zapisu i interfejsu” nie są odzwierciedlone w nazwach. | czytelność | `tests/stage*.test.ts` |
| R6 | Dokumentacja deklaruje, że logika nauki nie dotyka DOM/Firebase/IndexedDB. W `learning/`, `materials/`, `house/` to się **zgadza**; wyjątkiem jest `src/adventure.ts` (`document.baseURI`), który w dokumentach bywa opisywany razem z logiką. | drobna nieścisłość | `src/adventure.ts:71` |
| R7 | Testy mechaniki zakładają, że istnieje dokładnie jeden moduł i kurs (`modules.length===1`, `courses.length===1`), podczas gdy dokumentacja opisuje wiele kursów jako docelowy stan. | test vs założenie | `tests/content.test.ts:7`, `tests/courses.test.ts:19` |
| R8 | Numeracja decyzji: rejestr kończy się na D-42, otwarte pytania U-01–U-10 – spójne z `docs/README.md`. Nie znaleziono sprzeczności. | brak problemu | `docs/decyzje.md` |

Uwaga: rozbieżności R1 i R8 sprawdziłem i są **zgodne**; wpisano je, żeby nie szukać ich ponownie.

## 5. Koszt dalszej pracy z AI – konkretne przykłady

Bez liczb tokenów; szacuję tylko liczbę plików, które agent musi otworzyć.

- **Zmiana zasady nagród** (np. ile gwiazdek za trening): `src/adventure.ts` (`rewardCompletion`), `src/stage-review.ts`, `src/controllers/learning.ts` (wyświetlana nagroda), plus testy `house/adventure/stage-review`, plus `docs/decyzje.md` – ok. 4–6 plików, w tym jeden cykl importów. Skill z dokumentacją to ułatwia, ale same reguły są w kodzie w trzech miejscach.
- **Dodanie pokoju lub wyposażenia:** `src/house/catalog.ts` (sloty, `decorations`, `roomRewards`, `mapNames`), `src/learning/backup.ts` (powielona lista slotów – łatwo pominąć), widok `src/views/house.ts`, ewentualnie ilustracje i testy `house.test.ts`. To właśnie powielona lista w `backup.ts` jest **ukrytym trzecim miejscem** zmiany.
- **Dodanie modułu w istniejącym kursie:** dobrze opisane w `docs/dodawanie-modulow.md` i objęte `check:content`; w kodzie nie powinno być zmian. **Ale** testy zakładające `modules.length===1` i sztywne ścieżki Food (3.5) zaczną pękać – agent musi to odróżnić od prawdziwej regresji.
- **Dodanie kursu w innym języku (francuski/włoski):** model materiałów (`src/materials/*`) jest już ogólny (`targetLanguage`, `explanationLanguage`), natomiast trzeba przejrzeć punkty z 3.2 (a/an, heurystyki typu pytania, domyślna ścieżka mapy). Dokumentacja (`docs/rozwoj-jezykow.md`) opisuje to na poziomie założeń, a nie jako listę miejsc w kodzie.
- **Dodanie typu ćwiczenia:** `src/learning/model.ts` (typy), `questions.ts` (`questionFor`, `isCorrect`, `requiresChoice`), `session.ts`, `backup.ts` (walidacja), widok `study.ts`, `content-validation.ts`/`materials/validation.ts`, testy. Zmiana przekracza granice warstw, bo typ ćwiczenia jest zdefiniowany w modelu, a jego „rozumienie” rozproszone po heurystykach. To normalne dla takiej zmiany; nie wymaga refaktoringu z wyprzedzeniem.

**Co pomaga:** README z kategoriami statusu, skill z mapą dokumentów, małe pliki, testy Node uruchamiane w sekundach, brak frameworka. **Co przeszkadza:** historyczne nazwy testów, dziennikowy `07-testy.md`, trzy miejsca na zasady nagród, brak jednego „spisu miejsc zależnych od języka”.

## 6. Etapowy plan małych refaktoringów

Zasada dla każdego etapu: zachowanie, wygląd i format zapisu bez zmian; po etapie uruchomić `npm test`, `npm run build`, a gdy dotyka interfejsu – Playwright lokalnie; osobny commit na etap.

**Etap 1 – jedno źródło dla list i stałych (najmniejsze ryzyko).**
- Zakres: `learning/backup.ts` importuje sloty domku i `legacyCourse` z `house/catalog.ts`; wspólna funkcja polskiej liczby mnogiej; stałe nagród w jednym miejscu (wartości bez zmian).
- Zależności: brak.
- Kryterium: 158/158 testów, `check:content`, `tsc`, build; `backup()` i `validateBackup()` dają identyczne wyniki dla `backup-v1.json` i bieżących fixtures; diff nie zmienia żadnej wartości liczbowej nagrody.

**Etap 2 – rozcięcie cyklu `house` ↔ `adventure`.**
- Zakres: przenieść `journeyKey`, `lessons`, `courseForModule` (tylko typy i czyste funkcje) do małego modułu bez zależności od `house/`.
- Zależności: etap 1 (stałe nagród).
- Kryterium: analiza importów bez cyklu `house/progress.ts` ↔ `adventure.ts`; testy `house`, `adventure`, `stage-review`, `sync` bez modyfikacji; porównanie zapisu po ukończeniu lekcji w starym i nowym kodzie.

**Etap 3 – podział `validateBackup` na części.**
- Zakres: funkcje pomocnicze z identycznymi warunkami i komunikatami.
- Zależności: etap 1.
- Kryterium: wszystkie testy kopii przechodzą; zestaw celowo uszkodzonych kopii daje te same odrzucenia; zestaw poprawnych – ten sam wynik.

**Etap 4 – odciążenie `controllers/learning.ts`.**
- Zakres: akcje domku do osobnego kontrolera, wspólny helper „potwierdź i zastąp aktywną sesję”.
- Zależności: etap 2.
- Kryterium: Playwright (`house`, `stage-review`, `adventure`, `training`) przed i po zielony; brak zmian w widoku (porównanie zrzutów ekranu na tym samym profilu testowym, nie na danych Hani).

**Etap 5 – testy odporniejsze na układ (stopniowo, przy okazji zmian widoków).**
- Zakres: wymiana asercji tekstowych na pliki źródłowe (`stage1.test.ts:65`, `stage2.test.ts:44`) na asercje zachowania lub ich usunięcie, gdy zachowanie już jest pokryte; testy mechaniki przeniesione z `modules[0]` na `fixtures/course-materials.ts` w momencie dodania drugiego kursu.
- Zależności: Playwright dostępny lokalnie.
- Kryterium: zmiana układu szablonu nie psuje testów mechaniki; liczba chronionych zachowań nie spada.

**Etap 6 (dopiero gdy zacznie się francuski/włoski) – lista miejsc zależnych od języka.**
- Zakres: opis w `docs/rozwoj-jezykow.md` miejsc z 3.2 (a/an, `requiresChoice`, domyślna ścieżka mapy); ewentualnie wstrzyknięcie funkcji pobierającej ścieżki map.
- Kryterium: dodanie pustego kursu z fixture nie wymaga zmian w `src/` poza materiałami.

### Pierwszy zalecany etap

**Etap 1.** Jest najmniejszy, odwracalny, bez zmian wyglądu i danych, usuwa „ukryte trzecie miejsce” przy dodawaniu pokoju i przygotowuje grunt pod etapy 2–3. Przed nim warto raz uruchomić Playwright lokalnie i zapisać wynik jako punkt odniesienia (tego w audycie nie zrobiono).

## 7. Czego teraz nie warto ruszać

- **Format zapisu postępu i dawnego portfela angielskiego** – działa, jest pokryty testami, a zmiana wymagałaby migracji (poza zakresem).
- **Klucze `moduleId@rev:typ:id`, wersje wydań lekcji, `sessionCompatible`** – to rdzeń zgodności starych sesji.
- **Synchronizacja i reguły Firestore** (`sync.ts`, `firebase.ts`, `firestore.rules`) – prosty model CAS; zmiany tylko z realnym powodem.
- **Podział `src/` na warstwy i wielkość plików** – nie dzielić „dla estetyki”; `controllers/learning.ts` zasługuje tylko na wydzielenie domku (etap 4).
- **Dokumentacja historyczna** (`docs/stan-obecny/`) – punkt odniesienia, bez przepisywania.
- **Wybór algorytmu treningów, zestawy dystraktorów i inne otwarte decyzje (U-01–U-10)** – to decyzje produktowe.
- **Brak frameworka/Spec Kit** – obecny system dokumentów wystarcza.

## 8. Źródła i ograniczenia raportu

Numery linii pochodzą z kopii plików wykonanej w dniu audytu; po zmianach w repozytorium mogą się przesunąć. Liczby testów i poleceń odnoszą się do uruchomień opisanych w sekcji 0. Wnioski dotyczące interfejsu, PWA/offline i Firebase na żywo opierają się wyłącznie na lekturze kodu, dokumentacji i testów, nie na uruchomieniu aplikacji.
